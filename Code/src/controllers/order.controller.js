const orderService = require('../services/order.service');
const paymentService = require('../services/payment.service');
const {
  parseOrderId,
  validateCartCheckPayload,
  validateCheckoutPayload,
  validateOrderListQuery,
  validateOrderStatusPayload,
} = require('../validators/order.validator');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');

const validateCart = asyncHandler(async (req, res) => {
  const { items } = validateCartCheckPayload(req.body);
  const data = await orderService.validateCartAndCompatibility(items);
  return success(res, data, 200, 'Cart stock and compatibility validated.');
});

const checkout = asyncHandler(async (req, res) => {
  const payload = validateCheckoutPayload(req.body);
  const data = await orderService.createOrderCheckout(payload, req.user);
  return success(res, data, 201, 'Order created successfully.');
});

const listMyOrders = asyncHandler(async (req, res) => {
  const query = validateOrderListQuery(req.query);
  const data = await orderService.getMyOrders(req.user.userId, query);
  return success(res, data, 200, 'Customer orders retrieved.');
});

const trackPublicOrders = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const data = await orderService.trackPublicOrders(q);
  return success(res, data, 200, 'Orders retrieved successfully.');
});

const getOrderDetail = asyncHandler(async (req, res) => {
  const orderId = parseOrderId(req.params.orderId);
  const data = await orderService.getOrderDetail(orderId, req.user);
  return success(res, data, 200, 'Order details retrieved.');
});

const getOrderPaymentStatus = asyncHandler(async (req, res) => {
  const orderId = parseOrderId(req.params.orderId);
  const data = await paymentService.checkAndReconcileOrderPayment(orderId, req.user);
  return success(res, data, 200, 'Order payment status retrieved.');
});

const cancelMyOrder = asyncHandler(async (req, res) => {
  const orderId = parseOrderId(req.params.orderId);
  const data = await orderService.cancelMyOrder(orderId, req.user);
  return success(res, data, 200, 'Order cancelled successfully.');
});

const listAdminOrders = asyncHandler(async (req, res) => {
  const query = validateOrderListQuery(req.query);
  const data = await orderService.listAdminOrders(query);
  return success(res, data, 200, 'All orders retrieved.');
});

const updateAdminOrderStatus = asyncHandler(async (req, res) => {
  const orderId = parseOrderId(req.params.orderId);
  const { status } = validateOrderStatusPayload(req.body);
  const data = await orderService.updateOrderStatus(orderId, status, req.user);
  return success(res, data, 200, `Order status updated to ${status}.`);
});

module.exports = {
  cancelMyOrder,
  checkout,
  getOrderDetail,
  getOrderPaymentStatus,
  listAdminOrders,
  listMyOrders,
  trackPublicOrders,
  updateAdminOrderStatus,
  validateCart,
};
