const { getClient } = require('../config/db');
const env = require('../config/env');
const orderRepo = require('../repositories/order.repository');
const inventoryRepo = require('../repositories/inventory.repository');
const sepay = require('../utils/sepay');
const AppError = require('../utils/AppError');

const ALLOWED_TRANSITIONS = {
  Pending: ['Paid', 'Packing', 'Cancelled'],
  Paid: ['Packing', 'Cancelled'],
  Packing: ['Shipped', 'Cancelled'],
  Shipped: ['Completed'],
  Completed: [],
  Cancelled: [],
};

const STOCK_DEDUCTED_STATUSES = new Set(['Paid', 'Packing', 'Shipped', 'Completed']);

function parseWatts(value) {
  if (!value) return null;
  const match = String(value).match(/(\d{3,4})\s*W/i);
  return match ? Number.parseInt(match[1], 10) : null;
}

function evaluateHardwareCompatibility(resolvedItems) {
  const issues = [];
  const notes = [];

  const cpus = resolvedItems.filter((i) => i.category_name.toLowerCase() === 'cpu');
  const mainboards = resolvedItems.filter((i) => i.category_name.toLowerCase() === 'mainboard');
  const rams = resolvedItems.filter((i) => i.category_name.toLowerCase() === 'ram');
  const gpus = resolvedItems.filter((i) => i.category_name.toLowerCase() === 'gpu');
  const psus = resolvedItems.filter((i) => {
    const cat = i.category_name.toLowerCase();
    return cat === 'power supply' || cat === 'psu';
  });

  // 1. CPU Socket vs Mainboard Socket
  for (const cpu of cpus) {
    const cpuSocket = cpu.specs?.Socket;
    for (const mb of mainboards) {
      const mbSocket = mb.specs?.Socket;
      if (cpuSocket && mbSocket) {
        if (cpuSocket.trim().toUpperCase() !== mbSocket.trim().toUpperCase()) {
          issues.push({
            type: 'SOCKET_MISMATCH',
            severity: 'error',
            message: `Socket không tương thích: ${cpu.product_name} (${cpuSocket}) không lắp vừa ${mb.product_name} (${mbSocket}).`,
          });
        } else {
          notes.push(`CPU & Mainboard tương thích Socket ${cpuSocket}.`);
        }
      }
    }
  }

  // 2. Mainboard RAM Support vs RAM Type
  for (const mb of mainboards) {
    const ramSupport = mb.specs?.['RAM Support'] || mb.specs?.['RAM Type'];
    for (const ram of rams) {
      const ramType = ram.specs?.['RAM Type'];
      if (ramSupport && ramType) {
        if (!ramSupport.toUpperCase().includes(ramType.trim().toUpperCase())) {
          issues.push({
            type: 'RAM_MISMATCH',
            severity: 'error',
            message: `Chuẩn RAM không tương thích: ${ram.product_name} (${ramType}) không khớp với ${mb.product_name} (hỗ trợ ${ramSupport}).`,
          });
        } else {
          notes.push(`RAM ${ramType} tương thích với Mainboard ${mb.product_name}.`);
        }
      }
    }
  }

  // 3. GPU Recommended PSU vs Selected PSU Wattage
  for (const gpu of gpus) {
    const reqWatts = parseWatts(gpu.specs?.['Recommended PSU']);
    for (const psu of psus) {
      const psuWatts = parseWatts(psu.specs?.Wattage);
      if (reqWatts && psuWatts) {
        if (psuWatts < reqWatts) {
          issues.push({
            type: 'PSU_UNDERPOWERED',
            severity: 'warning',
            message: `Nguồn công suất thấp: ${gpu.product_name} khuyến nghị tối thiểu ${reqWatts}W, nhưng nguồn chọn chỉ đạt ${psuWatts}W.`,
          });
        } else {
          notes.push(`Nguồn ${psuWatts}W đáp ứng tốt yêu cầu tối thiểu ${reqWatts}W của ${gpu.product_name}.`);
        }
      }
    }
  }

  return {
    compatible: issues.filter((i) => i.severity === 'error').length === 0,
    issues,
    notes,
  };
}

function buildPaymentDetails(order) {
  const transferContent = sepay.buildOrderTransferContent(order.order_id, env.orderPrefix);
  const createdMs = new Date(order.created_at || Date.now()).getTime();
  const expiresAt = new Date(createdMs + env.orderExpireMinutes * 60 * 1000).toISOString();

  if (order.payment_method === 'VietQR') {
    return {
      provider: 'SePay',
      method: 'VietQR',
      bankCode: env.sepay.bankCode,
      bankAccount: env.sepay.bankAccount,
      accountName: env.sepay.accountName,
      amount: Number(order.total_amount),
      transferContent,
      qrUrl: sepay.buildQrUrl(
        { amount: Number(order.total_amount), transferContent },
        env.sepay
      ),
      expiresAt,
      demoMode: env.paymentDemoMode,
    };
  }

  if (order.payment_method === 'ZaloPay') {
    return {
      provider: 'ZaloPay',
      method: 'ZaloPay',
      amount: Number(order.total_amount),
      orderRef: transferContent,
      paymentUrl: `https://sb-openapi.zalopay.vn/v2/pay?order=${encodeURIComponent(transferContent)}`,
      expiresAt,
      demoMode: env.paymentDemoMode,
    };
  }

  return {
    provider: 'COD',
    method: 'COD',
    amount: Number(order.total_amount),
    note: 'Thanh toán tiền mặt khi nhận hàng (Cash on Delivery).',
    demoMode: env.paymentDemoMode,
  };
}

async function validateCartAndCompatibility(items) {
  const variantIds = items.map((i) => i.variantId);
  const variants = await orderRepo.getVariantsWithSpecs(variantIds);
  const variantMap = new Map(variants.map((v) => [Number(v.variant_id), v]));

  let totalAmount = 0;
  let allInStock = true;
  const resolvedItems = [];
  const stockErrors = [];

  for (const item of items) {
    const variant = variantMap.get(Number(item.variantId));
    if (!variant) {
      allInStock = false;
      stockErrors.push({
        variantId: item.variantId,
        code: 'VARIANT_NOT_FOUND',
        message: `SKU variant #${item.variantId} does not exist.`,
      });
      continue;
    }

    const available = Number(variant.stock_quantity);
    const sufficient = available >= item.quantity;
    if (!sufficient) {
      allInStock = false;
      stockErrors.push({
        variantId: Number(variant.variant_id),
        sku: variant.sku,
        code: 'INSUFFICIENT_STOCK',
        available,
        requested: item.quantity,
        message: `Chỉ còn ${available} sản phẩm trong kho cho mã ${variant.sku} (yêu cầu ${item.quantity}).`,
      });
    }

    const unitPrice = Number(variant.price);
    const subtotal = unitPrice * item.quantity;
    totalAmount += subtotal;

    resolvedItems.push({
      variantId: Number(variant.variant_id),
      productId: Number(variant.product_id),
      sku: variant.sku,
      productName: variant.product_name,
      product_name: variant.product_name,
      brand: variant.brand,
      imageUrl: variant.image_url || '',
      categoryName: variant.category_name,
      category_name: variant.category_name,
      unitPrice,
      quantity: item.quantity,
      subtotal,
      stockQuantity: available,
      lowStockThreshold: Number(variant.low_stock_threshold),
      inStock: sufficient,
      specs: variant.specs,
    });
  }

  const compatibility = evaluateHardwareCompatibility(resolvedItems);

  return {
    valid: allInStock && stockErrors.length === 0,
    items: resolvedItems,
    totalItems: resolvedItems.reduce((sum, i) => sum + i.quantity, 0),
    totalAmount,
    stockErrors,
    compatibility,
  };
}

async function createOrderCheckout(payload, user) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const variantIds = payload.items.map((i) => i.variantId);
    const variants = await orderRepo.getVariantsWithSpecs(variantIds, client);
    const variantMap = new Map(variants.map((v) => [Number(v.variant_id), v]));

    let totalAmount = 0;
    const orderItems = [];

    for (const item of payload.items) {
      const variant = variantMap.get(Number(item.variantId));
      if (!variant) {
        throw new AppError(`Product variant #${item.variantId} not found.`, 404);
      }
      if (Number(variant.stock_quantity) < item.quantity) {
        throw new AppError(
          `Insufficient stock for SKU '${variant.sku}'. Only ${variant.stock_quantity} remaining.`,
          409
        );
      }
      const unitPrice = Number(variant.price);
      totalAmount += unitPrice * item.quantity;
      orderItems.push({
        variantId: Number(variant.variant_id),
        sku: variant.sku,
        productName: variant.product_name,
        quantity: item.quantity,
        unitPrice,
      });
    }

    const shippingFee = Math.max(0, Number(payload.shippingFee || 0));
    totalAmount += shippingFee;

    // Strictly preserve Member 1's conversion-rate contract: website_visits -> orders.session_id
    if (payload.sessionId) {
      await orderRepo.ensureWebsiteVisit(client, payload.sessionId, user.userId);
    }

    // Per UC-09 Alternative Flow A1: COD transitions immediately to 'Packing' and deducts stock;
    // VietQR (SePay) and ZaloPay start as 'Pending' until payment callback confirms funds.
    const initialStatus = payload.paymentMethod === 'COD' ? 'Packing' : 'Pending';

    const createdOrder = await orderRepo.createOrder(client, {
      userId: user.userId,
      sessionId: payload.sessionId,
      totalAmount,
      status: initialStatus,
      paymentMethod: payload.paymentMethod,
      items: orderItems,
    });

    if (initialStatus === 'Packing') {
      await inventoryRepo.deductStockForOrder(client, orderItems, user.userId);
    }

    await client.query('COMMIT');

    const payment = buildPaymentDetails(createdOrder);
    return {
      order: createdOrder,
      payment,
      shipping: {
        customerName: payload.customerName || user.fullName || user.username,
        customerPhone: payload.customerPhone || '',
        shippingAddress: payload.shippingAddress || '',
        shippingMethod: payload.shippingMethod || 'standard',
        shippingFee,
        notes: payload.notes || '',
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof AppError) throw error;
    throw new AppError(`Checkout failed: ${error.message}`, 400);
  } finally {
    client.release();
  }
}

async function getMyOrders(userId, query) {
  const result = await orderRepo.listOrders({ ...query, userId });
  return {
    ...result,
    orders: result.orders.map((o) => ({
      ...o,
      transferContent: sepay.buildOrderTransferContent(o.order_id, env.orderPrefix),
    })),
  };
}

async function listAdminOrders(query) {
  const result = await orderRepo.listOrders(query);
  return {
    ...result,
    orders: result.orders.map((o) => ({
      ...o,
      transferContent: sepay.buildOrderTransferContent(o.order_id, env.orderPrefix),
    })),
  };
}

async function getOrderDetail(orderId, requester) {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }
  const isStaffOrAdmin = requester.role === 'Admin' || requester.role === 'Staff';
  if (!isStaffOrAdmin && Number(order.user_id) !== Number(requester.userId)) {
    throw new AppError('You do not have permission to view this order.', 403);
  }

  return {
    order,
    payment: buildPaymentDetails(order),
  };
}

async function updateOrderStatus(orderId, nextStatus, actor) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const lockedOrder = await orderRepo.lockOrderById(client, orderId);
    if (!lockedOrder) {
      throw new AppError('Order not found.', 404);
    }

    if (lockedOrder.status === nextStatus) {
      await client.query('COMMIT');
      return { order: lockedOrder, stockChanged: false };
    }

    const allowed = ALLOWED_TRANSITIONS[lockedOrder.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        `Invalid order status transition from '${lockedOrder.status}' to '${nextStatus}'.`,
        400
      );
    }

    let stockChanged = false;
    // Deduct stock when moving from Pending -> Paid or Packing
    if (lockedOrder.status === 'Pending' && STOCK_DEDUCTED_STATUSES.has(nextStatus)) {
      await inventoryRepo.deductStockForOrder(client, lockedOrder.items, actor.userId);
      stockChanged = true;
    }

    // Restore stock when cancelling an order whose stock was already deducted
    if (nextStatus === 'Cancelled' && STOCK_DEDUCTED_STATUSES.has(lockedOrder.status)) {
      await orderRepo.restoreStockForCancelledOrder(client, lockedOrder.items, actor.userId, orderId);
      stockChanged = true;
    }

    const updated = await orderRepo.updateOrderStatus(client, orderId, nextStatus);
    await client.query('COMMIT');

    let lowStockAlerts = [];
    if (stockChanged) {
      lowStockAlerts = await inventoryRepo.getLowStockAlerts().catch(() => []);
    }

    return {
      order: updated,
      stockChanged,
      lowStockAlertCount: lowStockAlerts.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof AppError) throw error;
    throw new AppError(`Failed to update order status: ${error.message}`, 409);
  } finally {
    client.release();
  }
}

async function cancelMyOrder(orderId, user) {
  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw new AppError('Order not found.', 404);
  }
  if (Number(order.user_id) !== Number(user.userId)) {
    throw new AppError('You can only cancel your own orders.', 403);
  }
  if (order.status !== 'Pending') {
    throw new AppError('Only Pending orders can be cancelled by customers.', 400);
  }
  return updateOrderStatus(orderId, 'Cancelled', user);
}

module.exports = {
  ALLOWED_TRANSITIONS,
  buildPaymentDetails,
  cancelMyOrder,
  createOrderCheckout,
  evaluateHardwareCompatibility,
  getMyOrders,
  getOrderDetail,
  listAdminOrders,
  updateOrderStatus,
  validateCartAndCompatibility,
};
