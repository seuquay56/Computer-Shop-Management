const express = require('express');
const controller = require('../controllers/inventory.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = express.Router();

// All inventory operations require authentication and Staff or Admin role
router.use(authenticate, authorize('Admin', 'Staff'));

router.get('/', controller.list);
router.get('/low-stock', controller.getLowStockAlerts);
router.post('/restock-batch', controller.restockBatch);
router.patch('/variants/:variantId/adjust', controller.adjustStock);
router.get('/transactions', controller.getHistory);

module.exports = router;
