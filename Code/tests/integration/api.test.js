const request = require('supertest');
const jwt = require('jsonwebtoken');

jest.mock('../../src/config/db', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
  pool: { end: jest.fn() },
}));

const { query, getClient } = require('../../src/config/db');
const app = require('../../src/app');

function makeToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('Integration Tests: Full 4-Module REST API Endpoints (Supertest)', () => {
  const adminUser = {
    user_id: 1, username: 'admin', full_name: 'Admin User',
    email: 'admin@shop.local', is_active: true, role: 'Admin',
  };
  const customerUser = {
    user_id: 3, username: 'demo_customer', full_name: 'Nguyen Nhat Huy',
    email: 'huy@shop.local', is_active: true, role: 'Customer',
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('IT-01: GET /health returns 200 OK with security headers (Helmet CSP includes SePay)', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['content-security-policy']).toContain('https://qr.sepay.vn');
  });

  test('IT-02: GET /api/admin/dashboard blocks unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('IT-03: GET /api/admin/dashboard blocks Customer role via RBAC middleware with 403', async () => {
    query.mockResolvedValueOnce({ rows: [customerUser] });
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${makeToken(customerUser)}`);
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('IT-04: POST /api/visits tracks unique storefront session UUID (FR-15)', async () => {
    query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app)
      .post('/api/visits')
      .send({ sessionId: 'storefront-session-uuid-2026' });
    expect(res.status).toBe(201);
    expect(res.body.data.tracked).toBe(true);
  });

  test('IT-05: GET /api/products returns multi-criteria filtered hardware catalog (Module 2)', async () => {
    query
      .mockResolvedValueOnce({ rows: [{ total: 1 }] })
      .mockResolvedValueOnce({
        rows: [{
          product_id: 1, name: 'Intel Core i9-14900K', brand: 'Intel',
          category_name: 'CPU', min_price: '14200000', max_price: '15490000',
          total_stock: 10, variants: [], specs: [{ spec_name: 'Socket', spec_value: 'LGA1700' }],
        }],
      });

    const res = await request(app).get('/api/products?category=CPU&spec_Socket=LGA1700');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products).toHaveLength(1);
    expect(res.body.data.products[0].name).toBe('Intel Core i9-14900K');
  });

  test('IT-06: POST /api/orders/cart/validate checks live stock and PC compatibility (Module 3)', async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          {
            variant_id: 1, product_id: 1, sku: 'CPU-INTEL-14900K-BOX', price: '15490000',
            stock_quantity: 8, low_stock_threshold: 5, product_name: 'Intel Core i9-14900K',
            brand: 'Intel', category_id: 1, category_name: 'CPU',
          },
          {
            variant_id: 5, product_id: 5, sku: 'MB-ASUS-Z790-HERO', price: '16890000',
            stock_quantity: 4, low_stock_threshold: 5, product_name: 'ASUS ROG Z790 HERO',
            brand: 'ASUS', category_id: 3, category_name: 'Mainboard',
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { product_id: 1, spec_name: 'Socket', spec_value: 'LGA1700' },
          { product_id: 5, spec_name: 'Socket', spec_value: 'LGA1700' },
        ],
      });

    const res = await request(app)
      .post('/api/orders/cart/validate')
      .send({ items: [{ variantId: 1, quantity: 1 }, { variantId: 5, quantity: 1 }] });

    expect(res.status).toBe(200);
    expect(res.body.data.valid).toBe(true);
    expect(res.body.data.compatibility.compatible).toBe(true);
    expect(res.body.data.totalAmount).toBe(32380000);
  });

  test('IT-07: POST /api/orders/checkout creates Pending VietQR order and returns SePay QR payload', async () => {
    query.mockResolvedValueOnce({ rows: [customerUser] }); // auth middleware

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ // variants lookup
          rows: [{
            variant_id: 1, product_id: 1, sku: 'CPU-INTEL-14900K-BOX', price: '15490000',
            stock_quantity: 8, low_stock_threshold: 5, product_name: 'Intel Core i9-14900K',
            brand: 'Intel', category_id: 1, category_name: 'CPU',
          }],
        })
        .mockResolvedValueOnce({ rows: [] }) // specs lookup
        .mockResolvedValueOnce({}) // ensureWebsiteVisit
        .mockResolvedValueOnce({ // insert order
          rows: [{
            order_id: 101, user_id: 3, session_id: 'sess-checkout-101',
            total_amount: '15490000.00', status: 'Pending', payment_method: 'VietQR',
            created_at: '2026-11-18T10:30:00Z',
          }],
        })
        .mockResolvedValueOnce({ // insert order_item
          rows: [{ item_id: 1, order_id: 101, variant_id: 1, quantity: 1, unit_price: '15490000.00' }],
        })
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    getClient.mockResolvedValueOnce(mockClient);

    const res = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${makeToken(customerUser)}`)
      .send({
        items: [{ variantId: 1, quantity: 1 }],
        paymentMethod: 'VietQR',
        sessionId: 'sess-checkout-101',
        shippingAddress: '19 Nguyen Huu Tho, Q.7, HCMC',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.order.order_id).toBe(101);
    expect(res.body.data.order.status).toBe('Pending');
    expect(res.body.data.payment.provider).toBe('SePay');
    expect(res.body.data.payment.transferContent).toBe('CSORDER101');
    expect(res.body.data.payment.qrUrl).toContain('https://qr.sepay.vn/img?');
  });

  test('IT-08: POST /api/payment/sepay-webhook rejects unauthorized callers with 401', async () => {
    const res = await request(app)
      .post('/api/payment/sepay-webhook')
      .set('Authorization', 'Apikey invalid_key')
      .send({ transferType: 'in', transferAmount: 15490000, content: 'CSORDER101' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('IT-09: POST /api/payment/sepay-webhook confirms payment and deducts stock atomically', async () => {
    query
      .mockResolvedValueOnce({ // findOrderById order
        rows: [{
          order_id: 101, user_id: 3, session_id: 'sess-checkout-101',
          total_amount: '15490000.00', status: 'Pending', payment_method: 'VietQR',
          created_at: '2026-11-18T10:30:00Z', username: 'demo_customer',
        }],
      })
      .mockResolvedValueOnce({ rows: [] }) // findOrderById items
      .mockResolvedValueOnce({ rows: [] }); // getLowStockAlerts after commit

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ // lockOrderById order
          rows: [{ order_id: 101, user_id: 3, total_amount: '15490000.00', status: 'Pending' }],
        })
        .mockResolvedValueOnce({ // lockOrderById items
          rows: [{ item_id: 1, order_id: 101, variant_id: 1, quantity: 1, unit_price: '15490000.00' }],
        })
        .mockResolvedValueOnce({ // deductStockForOrder SELECT FOR UPDATE
          rows: [{ variant_id: 1, sku: 'CPU-INTEL-14900K-BOX', stock_quantity: 8 }],
        })
        .mockResolvedValueOnce({}) // UPDATE product_variants
        .mockResolvedValueOnce({}) // INSERT inventory_transactions
        .mockResolvedValueOnce({ // updateOrderStatus
          rows: [{ order_id: 101, user_id: 3, total_amount: '15490000.00', status: 'Paid', payment_method: 'VietQR' }],
        })
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    getClient.mockResolvedValueOnce(mockClient);

    const res = await request(app)
      .post('/api/payment/sepay-webhook')
      .set('Authorization', `Apikey ${process.env.SEPAY_WEBHOOK_API_KEY}`)
      .send({
        id: 88001,
        gateway: 'MBBank',
        accountNumber: '0123456789',
        transferType: 'in',
        transferAmount: 15490000,
        code: 'CSORDER101',
        content: 'CSORDER101 thanh toan don hang',
        referenceCode: 'MBVCB.101',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.matched).toBe(true);
    expect(res.body.data.status).toBe('Paid');
  });

  test('IT-10: GET /api/orders/my returns authenticated customer order tracking history', async () => {
    query
      .mockResolvedValueOnce({ rows: [customerUser] }) // auth
      .mockResolvedValueOnce({ rows: [{ total: 1 }] }) // count
      .mockResolvedValueOnce({
        rows: [{
          order_id: 101, user_id: 3, total_amount: '15490000.00', status: 'Paid',
          payment_method: 'VietQR', created_at: '2026-11-18T10:30:00Z', item_count: 1, total_quantity: 1,
        }],
      });

    const res = await request(app)
      .get('/api/orders/my')
      .set('Authorization', `Bearer ${makeToken(customerUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.orders).toHaveLength(1);
    expect(res.body.data.orders[0].transferContent).toBe('CSORDER101');
  });

  test('IT-11: PATCH /api/admin/orders/:id/status advances fulfillment pipeline (Paid -> Packing)', async () => {
    query.mockResolvedValueOnce({ rows: [adminUser] }); // auth

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ order_id: 101, user_id: 3, total_amount: '15490000.00', status: 'Paid' }] })
        .mockResolvedValueOnce({ rows: [{ variant_id: 1, quantity: 1, unit_price: '15490000.00' }] })
        .mockResolvedValueOnce({ rows: [{ order_id: 101, user_id: 3, total_amount: '15490000.00', status: 'Packing' }] })
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    getClient.mockResolvedValueOnce(mockClient);

    const res = await request(app)
      .patch('/api/admin/orders/101/status')
      .set('Authorization', `Bearer ${makeToken(adminUser)}`)
      .send({ status: 'Packing' });

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('Packing');
  });

  test('IT-12: GET /api/inventory/low-stock returns critical/warning alert feed for Admin (Module 4)', async () => {
    query
      .mockResolvedValueOnce({ rows: [adminUser] })
      .mockResolvedValueOnce({
        rows: [{
          variant_id: 8, sku: 'SSD-SAM-990PRO-2TB', stock_quantity: 0,
          low_stock_threshold: 5, alert_level: 'CRITICAL', deficit_quantity: 5,
        }],
      });

    const res = await request(app)
      .get('/api/inventory/low-stock')
      .set('Authorization', `Bearer ${makeToken(adminUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.alertCount).toBe(1);
    expect(res.body.data.alerts[0].alert_level).toBe('CRITICAL');
  });

  test('IT-13: GET /api/orders/:id returns full order details and SePay QR payload for owner', async () => {
    query
      .mockResolvedValueOnce({ rows: [customerUser] }) // auth
      .mockResolvedValueOnce({
        rows: [{
          order_id: 101, user_id: 3, session_id: 'sess-checkout-101',
          total_amount: '15490000.00', status: 'Pending', payment_method: 'VietQR',
          created_at: '2026-11-18T10:30:00Z', username: 'demo_customer', customer_name: 'Nguyen Nhat Huy',
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          item_id: 1, order_id: 101, variant_id: 1, quantity: 1, unit_price: '15490000.00',
          sku: 'CPU-INTEL-14900K-BOX', current_stock: 8, product_id: 1,
          product_name: 'Intel Core i9-14900K', brand: 'Intel', category_name: 'CPU',
        }],
      });

    const res = await request(app)
      .get('/api/orders/101')
      .set('Authorization', `Bearer ${makeToken(customerUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.order.order_id).toBe(101);
    expect(res.body.data.payment.qrUrl).toContain('https://qr.sepay.vn/img?');
  });

  test('IT-14: GET /api/orders/:id/payment-status returns live payment status for polling UI', async () => {
    query
      .mockResolvedValueOnce({ rows: [customerUser] })
      .mockResolvedValueOnce({
        rows: [{
          order_id: 101, user_id: 3, total_amount: '15490000.00', status: 'Paid',
          payment_method: 'VietQR', created_at: '2026-11-18T10:30:00Z', username: 'demo_customer',
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .get('/api/orders/101/payment-status')
      .set('Authorization', `Bearer ${makeToken(customerUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.paid).toBe(true);
    expect(res.body.data.status).toBe('Paid');
  });

  test('IT-15: POST /api/orders/:id/cancel lets customer cancel own Pending order', async () => {
    query
      .mockResolvedValueOnce({ rows: [customerUser] })
      .mockResolvedValueOnce({
        rows: [{
          order_id: 102, user_id: 3, total_amount: '3250000.00', status: 'Pending',
          payment_method: 'VietQR', created_at: '2026-11-18T10:35:00Z', username: 'demo_customer',
        }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ order_id: 102, user_id: 3, total_amount: '3250000.00', status: 'Pending' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ order_id: 102, user_id: 3, total_amount: '3250000.00', status: 'Cancelled' }] })
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    getClient.mockResolvedValueOnce(mockClient);

    const res = await request(app)
      .post('/api/orders/102/cancel')
      .set('Authorization', `Bearer ${makeToken(customerUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.order.status).toBe('Cancelled');
  });

  test('IT-16: POST /api/payment/simulate/:id runs full SePay demo webhook pipeline', async () => {
    query
      .mockResolvedValueOnce({ rows: [customerUser] }) // auth
      .mockResolvedValueOnce({ // simulatePaymentSuccess -> findOrderById
        rows: [{
          order_id: 103, user_id: 3, total_amount: '3250000.00', status: 'Pending',
          payment_method: 'VietQR', created_at: '2026-11-18T10:40:00Z', username: 'demo_customer',
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ // processSepayWebhook -> findOrderById
        rows: [{
          order_id: 103, user_id: 3, total_amount: '3250000.00', status: 'Pending',
          payment_method: 'VietQR', created_at: '2026-11-18T10:40:00Z', username: 'demo_customer',
        }],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] }); // low stock alerts

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ order_id: 103, user_id: 3, total_amount: '3250000.00', status: 'Pending' }] })
        .mockResolvedValueOnce({ rows: [{ item_id: 2, order_id: 103, variant_id: 7, quantity: 1, unit_price: '3250000.00' }] })
        .mockResolvedValueOnce({ rows: [{ variant_id: 7, sku: 'RAM-CORSAIR-D5-32G-BLK', stock_quantity: 20 }] })
        .mockResolvedValueOnce({}) // UPDATE stock
        .mockResolvedValueOnce({}) // INSERT transaction
        .mockResolvedValueOnce({ rows: [{ order_id: 103, user_id: 3, total_amount: '3250000.00', status: 'Paid', payment_method: 'VietQR' }] })
        .mockResolvedValueOnce({}), // COMMIT
      release: jest.fn(),
    };
    getClient.mockResolvedValueOnce(mockClient);

    const res = await request(app)
      .post('/api/payment/simulate/103')
      .set('Authorization', `Bearer ${makeToken(customerUser)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.matched).toBe(true);
    expect(res.body.data.status).toBe('Paid');
  });
});
