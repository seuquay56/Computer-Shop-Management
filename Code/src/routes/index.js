const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const visitRoutes = require('./visit.routes');

// Member 2 Routes (Categories, Specs, Products, Inventory)
const categoryRoutes = require('./category.routes');
const specRoutes = require('./spec.routes');
const productRoutes = require('./product.routes');
const inventoryRoutes = require('./inventory.routes');

// Member 3 Routes (Cart, Checkout, Orders, SePay VietQR & Payment Callbacks)
const orderRoutes = require('./order.routes');
const paymentRoutes = require('./payment.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/visits', visitRoutes);

// Mount Member 2 modules
router.use('/categories', categoryRoutes);
router.use('/specs', specRoutes);
router.use('/products', productRoutes);
router.use('/inventory', inventoryRoutes);

// Mount Member 3 modules
router.use('/orders', orderRoutes);
router.use('/payment', paymentRoutes);

module.exports = router;
