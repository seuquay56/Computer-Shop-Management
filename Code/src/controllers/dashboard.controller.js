const dashboardService = require('../services/dashboard.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');
const { validateDateRange } = require('../validators/dashboard.validator');

const getDashboard = asyncHandler(async (req, res) => {
  const range = validateDateRange(req.query);
  const data = await dashboardService.getDashboard(range);
  return success(res, data, 200, 'Dashboard data loaded successfully.');
});

module.exports = { getDashboard };
