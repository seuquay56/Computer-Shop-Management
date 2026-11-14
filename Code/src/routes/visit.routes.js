const express = require('express');
const controller = require('../controllers/visit.controller');

const router = express.Router();
router.post('/', controller.trackVisit);

module.exports = router;
