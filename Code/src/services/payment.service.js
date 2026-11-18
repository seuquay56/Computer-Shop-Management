const { getClient } = require('../config/db');
const env = require('../config/env');
const orderRepo = require('../repositories/order.repository');
const inventoryRepo = require('../repositories/inventory.repository');
const sepay = require('../utils/sepay');
const AppError = require('../utils/AppError');

async function markOrderPaidAtomically(orderId, transactionInfo = {}) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const lockedOrder = await orderRepo.lockOrderById(client, orderId);
    if (!lockedOrder) {
      throw new AppError(`Order #${orderId} not found.`, 404);
    }

    // Idempotent handling: ignore duplicate webhooks safely without double-deducting inventory
    if (lockedOrder.status !== 'Pending') {
      await client.query('COMMIT');
      return {
        matched: true,
        alreadyProcessed: true,
        orderId: Number(lockedOrder.order_id),
        status: lockedOrder.status,
      };
    }

    // Atomic row-locked stock deduction (reusing Member 2's FOR UPDATE repository method)
    await inventoryRepo.deductStockForOrder(client, lockedOrder.items, lockedOrder.user_id);
    const updatedOrder = await orderRepo.updateOrderStatus(client, orderId, 'Paid');

    await client.query('COMMIT');

    const lowStockAlerts = await inventoryRepo.getLowStockAlerts().catch(() => []);

    return {
      matched: true,
      alreadyProcessed: false,
      orderId: Number(updatedOrder.order_id),
      status: updatedOrder.status,
      totalAmount: Number(updatedOrder.total_amount),
      transactionReference: transactionInfo.referenceCode || transactionInfo.id || null,
      lowStockAlertCount: lowStockAlerts.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof AppError) throw error;
    throw new AppError(`Payment confirmation failed: ${error.message}`, 409);
  } finally {
    client.release();
  }
}

async function processSepayWebhook(rawBody, authorizationHeader) {
  if (!sepay.verifyWebhookApiKey(authorizationHeader, env.sepay.webhookApiKey)) {
    throw new AppError('Unauthorized SePay webhook API key.', 401);
  }

  const transaction = sepay.normalizeTransaction(rawBody, 'webhook');
  if (sepay.normalizeText(transaction.transferType) !== 'IN') {
    return {
      matched: false,
      ignored: true,
      reason: 'Non-incoming transfer ignored.',
    };
  }

  // Try direct order lookup from transfer content / code (e.g., CSORDER15)
  const extractedOrderId =
    sepay.extractOrderIdFromText(transaction.code, env.orderPrefix) ||
    sepay.extractOrderIdFromText(transaction.content, env.orderPrefix);

  if (extractedOrderId) {
    const candidate = await orderRepo.findOrderById(extractedOrderId);
    if (!candidate) {
      return { matched: false, reason: `Order #${extractedOrderId} not found.` };
    }

    const orderForMatch = {
      amount: Number(candidate.total_amount),
      transferContent: sepay.buildOrderTransferContent(candidate.order_id, env.orderPrefix),
    };

    if (!sepay.transactionMatchesOrder(transaction, orderForMatch, env.sepay)) {
      throw new AppError(
        `Transaction amount or account mismatch for order #${extractedOrderId}.`,
        400
      );
    }

    return markOrderPaidAtomically(candidate.order_id, transaction);
  }

  // Fallback scan across Pending orders
  const pendingOrders = await orderRepo.findPendingOrders();
  for (const pending of pendingOrders) {
    const orderForMatch = {
      amount: Number(pending.total_amount),
      transferContent: sepay.buildOrderTransferContent(pending.order_id, env.orderPrefix),
    };
    if (sepay.transactionMatchesOrder(transaction, orderForMatch, env.sepay)) {
      return markOrderPaidAtomically(pending.order_id, transaction);
    }
  }

  return {
    matched: false,
    reason: 'No matching pending order found for incoming SePay transaction.',
  };
}

async function processPaymentCallback(rawBody, headers = {}) {
  const authHeader = headers.authorization || headers.Authorization || '';
  if (/^Apikey\s+/i.test(authHeader)) {
    return processSepayWebhook(rawBody, authHeader);
  }

  const signature = headers['x-payment-signature'] || headers['X-Payment-Signature'] || rawBody?.signature;
  const payloadToVerify = {
    orderId: Number(rawBody?.orderId),
    amount: Number(rawBody?.amount),
    status: String(rawBody?.status || ''),
    transactionId: String(rawBody?.transactionId || ''),
  };

  if (!sepay.verifyHmacSignature(payloadToVerify, signature, env.paymentCallbackSecret)) {
    throw new AppError('Invalid payment callback signature.', 401);
  }

  if (!Number.isInteger(payloadToVerify.orderId) || payloadToVerify.orderId <= 0) {
    throw new AppError('Valid orderId is required in callback payload.', 400);
  }

  if (payloadToVerify.status.toUpperCase() !== 'PAID' && payloadToVerify.status.toUpperCase() !== 'SUCCESS') {
    return {
      matched: true,
      orderId: payloadToVerify.orderId,
      status: 'Pending',
      message: 'Non-success payment status acknowledged.',
    };
  }

  const candidate = await orderRepo.findOrderById(payloadToVerify.orderId);
  if (!candidate) {
    throw new AppError(`Order #${payloadToVerify.orderId} not found.`, 404);
  }
  if (Math.round(Number(candidate.total_amount)) !== Math.round(payloadToVerify.amount)) {
    throw new AppError('Callback payment amount does not match order total.', 400);
  }

  return markOrderPaidAtomically(candidate.order_id, {
    referenceCode: payloadToVerify.transactionId,
  });
}

async function checkAndReconcileOrderPayment(orderId, requester) {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }
  const isStaffOrAdmin = requester.role === 'Admin' || requester.role === 'Staff';
  if (!isStaffOrAdmin && Number(order.user_id) !== Number(requester.userId)) {
    throw new AppError('Forbidden.', 403);
  }

  const transferContent = sepay.buildOrderTransferContent(order.order_id, env.orderPrefix);

  // If still Pending and SePay User API v2 token is configured, reconcile automatically
  if (order.status === 'Pending' && order.payment_method === 'VietQR' && env.sepay.apiToken) {
    try {
      const transactions = await sepay.fetchTransactions(
        { q: transferContent, fromDate: new Date(order.created_at) },
        env.sepay
      );
      const orderForMatch = {
        amount: Number(order.total_amount),
        transferContent,
      };
      const matchedTx = transactions.find((tx) =>
        sepay.transactionMatchesOrder(tx, orderForMatch, env.sepay)
      );
      if (matchedTx) {
        const result = await markOrderPaidAtomically(order.order_id, matchedTx);
        return {
          orderId: Number(order.order_id),
          status: result.status,
          paid: true,
          reconciledViaSepayApi: true,
          transferContent,
        };
      }
    } catch (_reconcileError) {
      // Non-fatal fallback; webhook or subsequent polling will retry
    }
  }

  return {
    orderId: Number(order.order_id),
    status: order.status,
    paid: order.status !== 'Pending' && order.status !== 'Cancelled',
    paymentMethod: order.payment_method,
    totalAmount: Number(order.total_amount),
    transferContent,
  };
}

async function simulatePaymentSuccess(orderId, requester) {
  if (!env.paymentDemoMode) {
    throw new AppError('Payment simulation is disabled in production mode.', 403);
  }

  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }
  const isStaffOrAdmin = requester.role === 'Admin' || requester.role === 'Staff';
  if (!isStaffOrAdmin && Number(order.user_id) !== Number(requester.userId)) {
    throw new AppError('You do not have permission to simulate payment for this order.', 403);
  }

  const transferContent = sepay.buildOrderTransferContent(order.order_id, env.orderPrefix);

  if (order.payment_method === 'ZaloPay') {
    const payload = {
      orderId: Number(order.order_id),
      amount: Number(order.total_amount),
      status: 'PAID',
      transactionId: `ZP-DEMO-${Date.now()}`,
    };
    const signature = sepay.createHmacSignature(payload, env.paymentCallbackSecret);
    return processPaymentCallback(payload, { 'x-payment-signature': signature });
  }

  // Run through the EXACT SePay webhook verification & matching pipeline
  const simulatedWebhook = {
    id: Date.now(),
    gateway: env.sepay.bankCode,
    transactionDate: sepay.formatDateTimeVn(new Date()),
    accountNumber: env.sepay.bankAccount,
    code: transferContent,
    content: `${transferContent} Thanh toan don hang Computer Shop`,
    transferType: 'in',
    transferAmount: Number(order.total_amount),
    referenceCode: `SEPAY-DEMO-${order.order_id}-${Date.now()}`,
  };

  return processSepayWebhook(simulatedWebhook, `Apikey ${env.sepay.webhookApiKey}`);
}

module.exports = {
  checkAndReconcileOrderPayment,
  markOrderPaidAtomically,
  processPaymentCallback,
  processSepayWebhook,
  simulatePaymentSuccess,
};
