const paymentService = require('../services/payment.service');
const { parseOrderId } = require('../validators/order.validator');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');

const handleSepayWebhook = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const data = await paymentService.processSepayWebhook(req.body, authHeader);
  return success(res, data, 200, data.matched ? 'SePay payment confirmed.' : 'SePay webhook processed.');
});

const handlePaymentCallback = asyncHandler(async (req, res) => {
  const data = await paymentService.processPaymentCallback(req.body, req.headers);
  return success(res, data, 200, 'Payment callback processed.');
});

const simulatePayment = asyncHandler(async (req, res) => {
  const orderId = parseOrderId(req.params.orderId);
  const data = await paymentService.simulatePaymentSuccess(orderId, req.user);
  return success(res, data, 200, 'Demo payment callback executed successfully.');
});

module.exports = {
  handlePaymentCallback,
  handleSepayWebhook,
  simulatePayment,
};
