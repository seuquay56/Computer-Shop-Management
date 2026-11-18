jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));
jest.mock('../../src/repositories/order.repository');
jest.mock('../../src/repositories/inventory.repository');

const { getClient } = require('../../src/config/db');
const orderRepo = require('../../src/repositories/order.repository');
const inventoryRepo = require('../../src/repositories/inventory.repository');
const orderService = require('../../src/services/order.service');

describe('Unit Tests: Order Service, PC Compatibility & Stock Lifecycle', () => {
  let mockClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };
    getClient.mockResolvedValue(mockClient);
  });

  test('UT-21: detects CPU + Mainboard socket compatibility and RAM match accurately', () => {
    const compat = orderService.evaluateHardwareCompatibility([
      { product_name: 'Intel Core i9-14900K', category_name: 'CPU', specs: { Socket: 'LGA1700' } },
      { product_name: 'ASUS ROG Z790 HERO', category_name: 'Mainboard', specs: { Socket: 'LGA1700', 'RAM Support': 'DDR5' } },
      { product_name: 'Corsair Vengeance 32GB', category_name: 'RAM', specs: { 'RAM Type': 'DDR5' } },
      { product_name: 'ASUS RTX 4070 Ti SUPER', category_name: 'GPU', specs: { 'Recommended PSU': '750W' } },
      { product_name: 'Corsair RM850e', category_name: 'Power Supply', specs: { Wattage: '850W' } },
    ]);

    expect(compat.compatible).toBe(true);
    expect(compat.issues).toHaveLength(0);
    expect(compat.notes).toHaveLength(3);
  });

  test('UT-22: flags socket mismatch (LGA1700 vs AM5), RAM mismatch, and underpowered PSU', () => {
    const compat = orderService.evaluateHardwareCompatibility([
      { product_name: 'Intel Core i9-14900K', category_name: 'CPU', specs: { Socket: 'LGA1700' } },
      { product_name: 'GIGABYTE B650 AORUS', category_name: 'Mainboard', specs: { Socket: 'AM5', 'RAM Support': 'DDR5' } },
      { product_name: 'Kingston Fury DDR4', category_name: 'RAM', specs: { 'RAM Type': 'DDR4' } },
      { product_name: 'ASUS RTX 4070 Ti SUPER', category_name: 'GPU', specs: { 'Recommended PSU': '750W' } },
      { product_name: 'Budget PSU 500W', category_name: 'Power Supply', specs: { Wattage: '500W' } },
    ]);

    expect(compat.compatible).toBe(false);
    expect(compat.issues.map((i) => i.type)).toEqual(
      expect.arrayContaining(['SOCKET_MISMATCH', 'RAM_MISMATCH', 'PSU_UNDERPOWERED'])
    );
  });

  test('UT-23: validates cart stock against DB and computes live subtotals/total', async () => {
    orderRepo.getVariantsWithSpecs.mockResolvedValue([
      {
        variant_id: 1, product_id: 1, sku: 'CPU-INTEL-14900K-BOX', price: 15490000,
        stock_quantity: 8, low_stock_threshold: 5, product_name: 'Intel Core i9-14900K',
        brand: 'Intel', category_name: 'CPU', specs: { Socket: 'LGA1700' },
      },
      {
        variant_id: 2, product_id: 7, sku: 'RAM-CORSAIR-D5-32G-BLK', price: 3250000,
        stock_quantity: 1, low_stock_threshold: 5, product_name: 'Corsair DDR5 32GB',
        brand: 'Corsair', category_name: 'RAM', specs: { 'RAM Type': 'DDR5' },
      },
    ]);

    const res = await orderService.validateCartAndCompatibility([
      { variantId: 1, quantity: 1 },
      { variantId: 2, quantity: 3 },
    ]);

    expect(res.valid).toBe(false);
    expect(res.totalAmount).toBe(15490000 + 3250000 * 3);
    expect(res.stockErrors).toHaveLength(1);
    expect(res.stockErrors[0].code).toBe('INSUFFICIENT_STOCK');
    expect(res.stockErrors[0].available).toBe(1);
  });

  test('UT-24: creates VietQR order as Pending, preserves website_visits session_id, returns SePay QR', async () => {
    orderRepo.getVariantsWithSpecs.mockResolvedValue([
      {
        variant_id: 1, product_id: 1, sku: 'CPU-INTEL-14900K-BOX', price: 15490000,
        stock_quantity: 8, product_name: 'Intel Core i9-14900K', brand: 'Intel', category_name: 'CPU', specs: {},
      },
    ]);
    orderRepo.createOrder.mockResolvedValue({
      order_id: 55, user_id: 3, session_id: 'sess-track-55', total_amount: 15490000,
      status: 'Pending', payment_method: 'VietQR', created_at: '2026-11-18T10:00:00Z',
      items: [{ variant_id: 1, quantity: 1, unit_price: 15490000 }],
    });

    const result = await orderService.createOrderCheckout(
      { items: [{ variantId: 1, quantity: 1 }], paymentMethod: 'VietQR', sessionId: 'sess-track-55' },
      { userId: 3, username: 'demo_customer', fullName: 'Nguyen Nhat Huy' }
    );

    expect(orderRepo.ensureWebsiteVisit).toHaveBeenCalledWith(mockClient, 'sess-track-55', 3);
    expect(inventoryRepo.deductStockForOrder).not.toHaveBeenCalled();
    expect(result.order.status).toBe('Pending');
    expect(result.payment.provider).toBe('SePay');
    expect(result.payment.transferContent).toBe('CSORDER55');
    expect(result.payment.qrUrl).toContain('https://qr.sepay.vn/img?');
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  test('UT-25: creates COD order directly in Packing status and atomically deducts stock (UC-09 A1)', async () => {
    orderRepo.getVariantsWithSpecs.mockResolvedValue([
      {
        variant_id: 4, product_id: 4, sku: 'GPU-MSI-4060-8G', price: 8990000,
        stock_quantity: 22, product_name: 'MSI RTX 4060', brand: 'MSI', category_name: 'GPU', specs: {},
      },
    ]);
    orderRepo.createOrder.mockResolvedValue({
      order_id: 56, user_id: 3, session_id: 'sess-cod-56', total_amount: 17980000,
      status: 'Packing', payment_method: 'COD', created_at: '2026-11-18T10:05:00Z',
      items: [{ variant_id: 4, quantity: 2, unit_price: 8990000 }],
    });

    const result = await orderService.createOrderCheckout(
      { items: [{ variantId: 4, quantity: 2 }], paymentMethod: 'COD', sessionId: 'sess-cod-56' },
      { userId: 3, username: 'demo_customer' }
    );

    expect(result.order.status).toBe('Packing');
    expect(inventoryRepo.deductStockForOrder).toHaveBeenCalledTimes(1);
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  test('UT-26: rolls back checkout transaction if variant has insufficient stock (HTTP 409)', async () => {
    orderRepo.getVariantsWithSpecs.mockResolvedValue([
      {
        variant_id: 8, product_id: 8, sku: 'SSD-SAM-990PRO-2TB', price: 4890000,
        stock_quantity: 0, product_name: 'Samsung 990 PRO 2TB', brand: 'Samsung', category_name: 'Storage', specs: {},
      },
    ]);

    await expect(
      orderService.createOrderCheckout(
        { items: [{ variantId: 8, quantity: 1 }], paymentMethod: 'VietQR', sessionId: 'sess-oos-01' },
        { userId: 3, username: 'demo_customer' }
      )
    ).rejects.toMatchObject({ statusCode: 409 });

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    expect(mockClient.release).toHaveBeenCalled();
  });

  test('UT-27: blocks illegal state skip (Pending -> Completed) in Order Fulfillment state machine', async () => {
    orderRepo.lockOrderById.mockResolvedValue({
      order_id: 10, user_id: 3, status: 'Pending', items: [{ variantId: 1, quantity: 1 }],
    });

    await expect(
      orderService.updateOrderStatus(10, 'Completed', { userId: 1, role: 'Admin' })
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
  });

  test('UT-28: restores inventory stock automatically when cancelling a Paid/Packing order', async () => {
    orderRepo.lockOrderById.mockResolvedValue({
      order_id: 11, user_id: 3, status: 'Paid', items: [{ variantId: 1, quantity: 2 }],
    });
    orderRepo.updateOrderStatus.mockResolvedValue({
      order_id: 11, user_id: 3, status: 'Cancelled', total_amount: 30980000,
    });
    inventoryRepo.getLowStockAlerts.mockResolvedValue([]);

    const res = await orderService.updateOrderStatus(11, 'Cancelled', { userId: 2, role: 'Staff' });

    expect(res.order.status).toBe('Cancelled');
    expect(res.stockChanged).toBe(true);
    expect(orderRepo.restoreStockForCancelledOrder).toHaveBeenCalledWith(
      mockClient,
      [{ variantId: 1, quantity: 2 }],
      2,
      11
    );
    expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
  });

  test('UT-29: enforces customer order ownership (Customer cannot view another user order)', async () => {
    orderRepo.findOrderById.mockResolvedValue({
      order_id: 77, user_id: 99, status: 'Paid', payment_method: 'VietQR', total_amount: 5000000, items: [],
    });

    await expect(
      orderService.getOrderDetail(77, { userId: 3, role: 'Customer' })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
