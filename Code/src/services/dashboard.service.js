const dashboardRepository = require('../repositories/dashboard.repository');

async function getDashboard(range) {
  return dashboardRepository.getDashboard(range);
}

module.exports = { getDashboard };
