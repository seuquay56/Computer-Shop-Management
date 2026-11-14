const visitService = require('../services/visit.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');

const trackVisit = asyncHandler(async (req, res) => {
  const data = await visitService.trackVisit({ sessionId: req.body?.sessionId });
  return success(res, data, 201, 'Visit session tracked.');
});

module.exports = { trackVisit };
