const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');
const { parseUserId, validateRole, validateStatus } = require('../validators/user.validator');
const AppError = require('../utils/AppError');

function parseBoolean(value) {
  if (value === undefined || value === '') return undefined;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new AppError('isActive query must be true or false.', 400);
}

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  if (role && !['Admin', 'Staff', 'Customer'].includes(role)) {
    throw new AppError('role filter must be Admin, Staff, or Customer.', 400);
  }
  const result = await userService.listUsers({ page, limit, search, role, isActive: parseBoolean(req.query.isActive) });
  return success(res, {
    users: result.users,
    pagination: { page, limit, total: result.total, totalPages: Math.ceil(result.total / limit) },
  });
});

const getOne = asyncHandler(async (req, res) => {
  const user = await userService.getUser(parseUserId(req.params.userId));
  return success(res, { user });
});

const changeRole = asyncHandler(async (req, res) => {
  const userId = parseUserId(req.params.userId);
  validateRole(req.body);
  const user = await userService.changeRole(userId, req.user.userId, req.body.role);
  return success(res, { user }, 200, 'User role updated successfully.');
});

const changeStatus = asyncHandler(async (req, res) => {
  const userId = parseUserId(req.params.userId);
  validateStatus(req.body);
  const user = await userService.changeStatus(userId, req.user.userId, req.body.isActive);
  return success(res, { user }, 200, 'User account status updated successfully.');
});

module.exports = { list, getOne, changeRole, changeStatus };
