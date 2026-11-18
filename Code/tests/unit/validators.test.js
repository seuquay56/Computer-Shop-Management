const orderValidator = require('../../src/validators/order.validator');

describe('Unit Tests: Order & Checkout Validators (EP & BVA)', () => {
  test('UT-13: merges duplicate variantId entries in cart payload cleanly', () => {
    const result = orderValidator.validateCartCheckPayload({
      items: [
        { variantId: 3, quantity: 1 },
        { variantId: 3, quantity: 2 },
        { variantId: 7, quantity: 1 },
      ],
    });
    expect(result.items).toEqual([
      { variantId: 3, quantity: 3 },
      { variantId: 7, quantity: 1 },
    ]);
  });

  test('UT-14: rejects empty cart array and non-array items (EP)', () => {
    expect(() => orderValidator.validateCartCheckPayload({ items: [] })).toThrow(/must not be empty/i);
    expect(() => orderValidator.validateCartCheckPayload({})).toThrow(/required/i);
  });

  test('UT-15: enforces quantity boundary values (0, 1, 999, 1000) (BVA)', () => {
    expect(() => orderValidator.validateCartItems([{ variantId: 1, quantity: 0 }])).toThrow(/between 1 and 999/i);
    expect(() => orderValidator.validateCartItems([{ variantId: 1, quantity: -5 }])).toThrow(/between 1 and 999/i);
    expect(() => orderValidator.validateCartItems([{ variantId: 1, quantity: 1000 }])).toThrow(/between 1 and 999/i);

    expect(orderValidator.validateCartItems([{ variantId: 1, quantity: 1 }])[0].quantity).toBe(1);
    expect(orderValidator.validateCartItems([{ variantId: 1, quantity: 999 }])[0].quantity).toBe(999);
  });

  test('UT-16: validates payment methods strictly against DB constraint (VietQR, ZaloPay, COD)', () => {
    for (const method of ['VietQR', 'ZaloPay', 'COD']) {
      const payload = orderValidator.validateCheckoutPayload({
        items: [{ variantId: 1, quantity: 1 }],
        paymentMethod: method,
        sessionId: 'sess-valid-123456',
      });
      expect(payload.paymentMethod).toBe(method);
    }
    expect(() =>
      orderValidator.validateCheckoutPayload({
        items: [{ variantId: 1, quantity: 1 }],
        paymentMethod: 'Bitcoin',
      })
    ).toThrow(/paymentMethod must be one of/i);
  });

  test('UT-17: enforces sessionId length boundary values (7, 8, 100, 101 chars) (BVA)', () => {
    const base = { items: [{ variantId: 1, quantity: 1 }], paymentMethod: 'VietQR' };

    expect(() => orderValidator.validateCheckoutPayload({ ...base, sessionId: '1234567' })).toThrow(/between 8 and 100/i);
    expect(() => orderValidator.validateCheckoutPayload({ ...base, sessionId: 'a'.repeat(101) })).toThrow(/between 8 and 100/i);

    expect(orderValidator.validateCheckoutPayload({ ...base, sessionId: '12345678' }).sessionId).toBe('12345678');
    expect(orderValidator.validateCheckoutPayload({ ...base, sessionId: 'a'.repeat(100) }).sessionId).toHaveLength(100);
  });

  test('UT-18: validates customer phone format and rejects malformed strings', () => {
    const valid = orderValidator.validateCheckoutPayload({
      items: [{ variantId: 1, quantity: 1 }],
      paymentMethod: 'COD',
      customerPhone: '+84 901-234-567',
    });
    expect(valid.customerPhone).toBe('+84 901-234-567');

    expect(() =>
      orderValidator.validateCheckoutPayload({
        items: [{ variantId: 1, quantity: 1 }],
        paymentMethod: 'COD',
        customerPhone: 'abc-not-phone',
      })
    ).toThrow(/customerPhone format is invalid/i);
  });

  test('UT-19: parses positive integer order IDs and rejects invalid values', () => {
    expect(orderValidator.parseOrderId('25')).toBe(25);
    expect(() => orderValidator.parseOrderId('0')).toThrow(/Invalid order ID/i);
    expect(() => orderValidator.parseOrderId('-3')).toThrow(/Invalid order ID/i);
    expect(() => orderValidator.parseOrderId('abc')).toThrow(/Invalid order ID/i);
  });

  test('UT-20: validates order statuses strictly against 6 lifecycle states', () => {
    expect(orderValidator.validateOrderStatusPayload({ status: 'Shipped' })).toEqual({ status: 'Shipped' });
    expect(() => orderValidator.validateOrderStatusPayload({ status: 'Refunded' })).toThrow(/status must be one of/i);
  });
});
