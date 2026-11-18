jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));
jest.mock('../../src/repositories/order.repository');
jest.mock('../../src/repositories/inventory.repository');

const { getClient } = require('../../src/config/db');
const orderRepo = require('../../src/repositories/order.repository');
const inventoryRepo = require('../../src/repositories/inventory.repository');
const sepay = require('../../src/utils/sepay');
const paymentService = require('../../src/services/payment.service');

describe('Unit Tests: SePay Webhook & Payment Callback Service', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };
    getClient.mockResolvedValue(mockClient);
    inventoryRepo.getLowStockAlerts.mockResolvedValue([]);
  });

  test('UT-30: rejects SePay webhook with invalid or missing Apikey header (HTTP 401)', async () => {
    await expect(
      paymentService.processSepayWebhook({ transferType: 'in', transferAmount: 1000 }, 'Apikey wrong_key')
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  test('UT-31: confirms Pending VietQR order on valid SePay webhook and atomically deducts stock', async () => {
    orderRepo.findOrderById.mockResolvedValue({
      order_id: 21, user_id: 3, total_amount: 15490000, status: 'Pending', payment_method: 'VietQR',
    });
    orderRepo.lockOrderById.mockResolvedValue({
      order_id: 21, user_id: 3, total_amount: 15490000, status: 'Pending',
      items: [{ variantId: 1, quantity: 1, unitPrice: 15490000 }],
    });
    orderRepo.updateOrderStatus.mockResolvedValue({
      order_id: 21, user_id: 3, total_amount: 15490000, status: 'Paid',
    });

    const result = await paymentService.processSepayWebhook(
      {
        id: 7001,
        transferType: 'in',
        transferAmount: 15490000,
        accountNumber: '0123456789',
        code: 'CSORDER21',
        content: 'CSORDER21 chuyen khoan',
        referenceCode: 'MBVCB.9999',
      },
      'Apikey test_sepay_webhook_api_key_2026'
    );

    expect(result.matched).toBe(true);
    expect(result.alreadyProcessed).toBe(false);
    expect(result.status).toBe('Paid');
    expect(inventoryRepo.deductStockForOrder).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  test('UT-32: handles duplicate SePay webhook idempotently without double-deducting inventory', async () => {
    orderRepo.findOrderById.mockResolvedValue({
      order_id: 21, user_id: 3, total_amount: 15490000, status: 'Paid', payment_method: 'VietQR',
    });
    orderRepo.lockOrderById.mockResolvedValue({
      order_id: 21, user_id: 3, total_amount: 15490000, status: 'Paid', items: [],
    });

    const result = await paymentService.processSepayWebhook(
      {
        id: 7001,
        transferType: 'in',
        transferAmount: 15490000,
        accountNumber: '0123456789',
        content: 'CSORDER21',
      },
      'Apikey test_sepay_webhook_api_key_2026'
    );

    expect(result.alreadyProcessed).toBe(true);
    expect(inventoryRepo.deductStockForOrder).not.toHaveBeenCalled();
  });

  test('UT-33: rejects SePay webhook when transferred amount does not match order total (HTTP 400)', async () => {
    orderRepo.findOrderById.mockResolvedValue({
      order_id: 22, user_id: 3, total_amount: 15490000, status: 'Pending', payment_method: 'VietQR',
    });

    await expect(
      paymentService.processSepayWebhook(
        {
          transferType: 'in',
          transferAmount: 500000,
          accountNumber: '0123456789',
          content: 'CSORDER22',
        },
        'Apikey test_sepay_webhook_api_key_2026'
      )
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('UT-34: ignores outgoing bank transfers (transferType = out) gracefully', async () => {
    const result = await paymentService.processSepayWebhook(
      { transferType: 'out', transferAmount: 100000, content: 'Rut tien' },
      'Apikey test_sepay_webhook_api_key_2026'
    );
    expect(result.matched).toBe(false);
    expect(result.ignored).toBe(true);
  });

  test('UT-35: verifies HMAC-SHA256 signature on ZaloPay / generic payment callback', async () => {
    const payload = { orderId: 33, amount: 8990000, status: 'PAID', transactionId: 'ZP-33' };
    const sig = sepay.createHmacSignature(payload, process.env.PAYMENT_CALLBACK_SECRET);

    orderRepo.findOrderById.mockResolvedValue({
      order_id: 33, user_id: 3, total_amount: 8990000, status: 'Pending', payment_method: 'ZaloPay',
    });
    orderRepo.lockOrderById.mockResolvedValue({
      order_id: 33, user_id: 3, total_amount: 8990000, status: 'Pending',
      items: [{ variantId: 4, quantity: 1, unitPrice: 8990000 }],
    });
    orderRepo.updateOrderStatus.mockResolvedValue({
      order_id: 33, user_id: 3, total_amount: 8990000, status: 'Paid',
    });

    const result = await paymentService.processPaymentCallback(payload, {
      'x-payment-signature': sig,
    });

    expect(result.status).toBe('Paid');
    expect(inventoryRepo.deductStockForOrder).toHaveBeenCalledTimes(1);
  });

  test('UT-36: rejects tampered ZaloPay callback with invalid HMAC signature (HTTP 401)', async () => {
    await expect(
      paymentService.processPaymentCallback(
        { orderId: 33, amount: 8990000, status: 'PAID', transactionId: 'ZP-33' },
        { 'x-payment-signature': 'deadbeef' }
      )
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});
