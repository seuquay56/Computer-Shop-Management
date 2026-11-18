const express = require('express');
const controller = require('../controllers/payment.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// SePay VietQR webhook (authenticated via Authorization: Apikey <SEPAY_WEBHOOK_API_KEY>)
router.post('/sepay-webhook', controller.handleSepayWebhook);

// Unified payment callback (supports both SePay Apikey and ZaloPay/VietQR HMAC-SHA256 signature)
router.post('/callback', controller.handlePaymentCallback);

// Local development / demo webhook simulator (strictly gated by PAYMENT_DEMO_MODE=true)
router.post('/simulate/:orderId', authenticate, controller.simulatePayment);

module.exports = router;
