const AppError = require('../utils/AppError');

function validateDateRange(query) {
  const { from, to } = query;
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if ((from && !datePattern.test(from)) || (to && !datePattern.test(to))) {
    throw new AppError('from and to must use YYYY-MM-DD format.', 400);
  }
  const today = new Date().toISOString().slice(0, 10);
  const start = from || '2000-01-01';
  const end = to || today;
  if (Number.isNaN(Date.parse(`${start}T00:00:00Z`)) || Number.isNaN(Date.parse(`${end}T00:00:00Z`))) {
    throw new AppError('Date range is not valid.', 400);
  }
  if (start > end) throw new AppError('from must be earlier than or equal to to.', 400);
  return { from: start, to: end };
}

module.exports = { validateDateRange };
