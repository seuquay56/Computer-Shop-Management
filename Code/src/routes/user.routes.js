const express = require('express');
const controller = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authorize } = require('../middlewares/authorize.middleware');

const router = express.Router();
router.use(authenticate, authorize('Admin'));
router.get('/', controller.list);
router.get('/:userId', controller.getOne);
router.patch('/:userId/role', controller.changeRole);
router.patch('/:userId/status', controller.changeStatus);

module.exports = router;
