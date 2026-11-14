const AppError = require('../utils/AppError');

function parseUserId(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new AppError('userId must be a positive integer.', 400);
  return id;
}

function validateRole(body) {
  if (!body || !['Admin', 'Staff', 'Customer'].includes(body.role)) {
    throw new AppError('role must be Admin, Staff, or Customer.', 400);
  }
}

function validateStatus(body) {
  if (!body || typeof body.isActive !== 'boolean') {
    throw new AppError('isActive must be true or false.', 400);
  }
}

module.exports = { parseUserId, validateRole, validateStatus };
