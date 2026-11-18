const AppError = require('../utils/AppError');

const VALID_PAYMENT_METHODS = ['VietQR', 'ZaloPay', 'COD'];
const VALID_ORDER_STATUSES = ['Pending', 'Paid', 'Packing', 'Shipped', 'Completed', 'Cancelled'];

function parseOrderId(param) {
  const id = Number.parseInt(param, 10);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError('Invalid order ID parameter.', 400);
  }
  return id;
}

function validateCartItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('Cart items array is required and must not be empty.', 400);
  }
  if (items.length > 50) {
    throw new AppError('A single order cannot contain more than 50 line items.', 400);
  }

  const merged = new Map();
  items.forEach((item, idx) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(`items[${idx}] must be an object.`, 400);
    }
    const variantId = Number.parseInt(item.variantId, 10);
    if (!Number.isInteger(variantId) || variantId <= 0) {
      throw new AppError(`items[${idx}].variantId must be a positive integer.`, 400);
    }
    const quantity = Number.parseInt(item.quantity, 10);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 999) {
      throw new AppError(`items[${idx}].quantity must be an integer between 1 and 999.`, 400);
    }
    merged.set(variantId, (merged.get(variantId) || 0) + quantity);
  });

  return Array.from(merged.entries()).map(([variantId, quantity]) => ({ variantId, quantity }));
}

function validateCartCheckPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  return { items: validateCartItems(body.items) };
}

function validateCheckoutPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }

  const items = validateCartItems(body.items);

  let paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.trim() : '';
  if (paymentMethod === 'ChuyenKhoan' || paymentMethod === 'Chuyển khoản' || paymentMethod === 'BankTransfer') {
    paymentMethod = 'VietQR';
  }
  if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
    throw new AppError(
      `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(', ')}.`,
      400
    );
  }

  let sessionId = null;
  if (body.sessionId !== undefined && body.sessionId !== null && String(body.sessionId).trim() !== '') {
    sessionId = String(body.sessionId).trim();
    if (sessionId.length < 8 || sessionId.length > 100) {
      throw new AppError('sessionId must be between 8 and 100 characters.', 400);
    }
  }

  const shippingAddress = typeof body.shippingAddress === 'string' ? body.shippingAddress.trim() : '';
  if (shippingAddress && shippingAddress.length > 300) {
    throw new AppError('shippingAddress must not exceed 300 characters.', 400);
  }

  const customerPhone = typeof body.customerPhone === 'string' ? body.customerPhone.trim() : '';
  if (customerPhone) {
    const cleanPhone = customerPhone.replace(/[\s\-\(\)\.]/g, '');
    if (!/^(?:\+84|0)(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/.test(cleanPhone)) {
      throw new AppError('customerPhone format is invalid. Vui lòng nhập đúng 10 số di động Việt Nam (+84 hoặc 03, 05, 07, 08, 09).', 400);
    }
  }

  const shippingMethod = typeof body.shippingMethod === 'string' && ['express', 'standard', 'economy'].includes(body.shippingMethod.trim())
    ? body.shippingMethod.trim()
    : 'standard';
  const shippingFee = Math.max(0, Number(body.shippingFee || 0));

  return {
    items,
    paymentMethod,
    sessionId,
    shippingAddress,
    customerName: typeof body.customerName === 'string' ? body.customerName.trim().slice(0, 100) : '',
    customerPhone,
    shippingMethod,
    shippingFee,
    notes: typeof body.notes === 'string' ? body.notes.trim().slice(0, 500) : '',
  };
}

function validateOrderStatusPayload(body) {
  if (!body || typeof body !== 'object') {
    throw new AppError('Request body must be a JSON object.', 400);
  }
  const status = typeof body.status === 'string' ? body.status.trim() : '';
  if (!VALID_ORDER_STATUSES.includes(status)) {
    throw new AppError(`status must be one of: ${VALID_ORDER_STATUSES.join(', ')}.`, 400);
  }
  return { status };
}

function validateOrderListQuery(query = {}) {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const status = VALID_ORDER_STATUSES.includes(query.status) ? query.status : '';
  const paymentMethod = VALID_PAYMENT_METHODS.includes(query.paymentMethod) ? query.paymentMethod : '';
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  return { page, limit, status, paymentMethod, search };
}

module.exports = {
  VALID_ORDER_STATUSES,
  VALID_PAYMENT_METHODS,
  parseOrderId,
  validateCartItems,
  validateCartCheckPayload,
  validateCheckoutPayload,
  validateOrderListQuery,
  validateOrderStatusPayload,
};
