const express = require('express');
const controller = require('../controllers/order.controller');
const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public real-time stock & PC hardware compatibility check for storefront cart
router.post('/cart/validate', controller.validateCart);

// Public tracking endpoint (FR-12 & guest order tracking)
router.get('/track', controller.trackPublicOrders);
router.get('/track/:orderId', controller.getOrderDetail);

// Customer & staff order endpoints (optionalAuth allows guest order tracking by direct ID)
router.post('/checkout', authenticate, controller.checkout);
router.get('/my', authenticate, controller.listMyOrders);
router.get('/:orderId', optionalAuth, controller.getOrderDetail);
router.get('/:orderId/payment-status', optionalAuth, controller.getOrderPaymentStatus);
router.post('/:orderId/cancel', optionalAuth, controller.cancelMyOrder);

module.exports = router;
