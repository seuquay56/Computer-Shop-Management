const express = require('express');
const controller = require('../controllers/category.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = express.Router();

// Public routes for storefront browsing
router.get('/', controller.list);
router.get('/:categoryId', controller.getOne);

// Protected routes (Staff & Admin)
router.post('/', authenticate, authorize('Admin', 'Staff'), controller.create);
router.put('/:categoryId', authenticate, authorize('Admin', 'Staff'), controller.update);
router.delete('/:categoryId', authenticate, authorize('Admin', 'Staff'), controller.remove);

module.exports = router;
