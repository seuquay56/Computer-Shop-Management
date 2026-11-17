const express = require('express');
const controller = require('../controllers/product.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = express.Router();

// Public routes for storefront
router.get('/', controller.list);
router.get('/filter-options/all', controller.getFilterOptions);
router.get('/:productId', controller.getOne);

// Protected routes (Admin & Staff) for Product Management
router.post('/', authenticate, authorize('Admin', 'Staff'), controller.create);
router.put('/:productId', authenticate, authorize('Admin', 'Staff'), controller.update);
router.delete('/:productId', authenticate, authorize('Admin', 'Staff'), controller.remove);

// Variant Sub-routes (Admin & Staff)
router.post('/:productId/variants', authenticate, authorize('Admin', 'Staff'), controller.addVariant);
router.patch('/variants/:variantId', authenticate, authorize('Admin', 'Staff'), controller.updateVariant);
router.delete('/variants/:variantId', authenticate, authorize('Admin', 'Staff'), controller.removeVariant);

module.exports = router;
