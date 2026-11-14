const express = require('express');
const controller = require('../controllers/dashboard.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = express.Router();
router.use(authenticate, authorize('Admin'));
router.get('/dashboard', controller.getDashboard);

module.exports = router;
