const express = require('express');
const controller = require('../controllers/spec.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = express.Router();

router.get('/', controller.list);
router.get('/options', controller.getFilterOptions);
router.post('/', authenticate, authorize('Admin', 'Staff'), controller.create);

module.exports = router;
