const express = require('express');
const controller = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public real-time stock & PC hardware compatibility check for storefront cart
router.post('/cart/validate', controller.validateCart);

// Public tracking endpoint (FR-12 & guest order tracking)
router.get('/track', controller.trackPublicOrders);

// Authenticated customer & staff order endpoints
router.post('/checkout', authenticate, controller.checkout);
router.get('/my', authenticate, controller.listMyOrders);
router.get('/:orderId', authenticate, controller.getOrderDetail);
router.get('/:orderId/payment-status', authenticate, controller.getOrderPaymentStatus);
router.post('/:orderId/cancel', authenticate, controller.cancelMyOrder);

module.exports = router;
