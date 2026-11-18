const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = express.Router();
router.use(authenticate);

// Member 1: Admin Dashboard
router.get('/dashboard', authorize('Admin'), dashboardController.getDashboard);

// Member 3 / Module 4: Order Fulfillment Pipeline (Admin & Staff)
router.get('/orders', authorize('Admin', 'Staff'), orderController.listAdminOrders);
router.patch('/orders/:orderId/status', authorize('Admin', 'Staff'), orderController.updateAdminOrderStatus);

module.exports = router;
