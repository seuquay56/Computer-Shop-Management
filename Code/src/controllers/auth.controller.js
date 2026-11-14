const authService = require('../services/auth.service');
const users = require('../repositories/user.repository');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/http');
const { validateRegister, validateLogin, validateChangePassword } = require('../validators/auth.validator');
const AppError = require('../utils/AppError');

const register = asyncHandler(async (req, res) => {
  validateRegister(req.body);
  const data = await authService.register(req.body);
  return success(res, data, 201, 'Customer account created successfully.');
});

const login = asyncHandler(async (req, res) => {
  validateLogin(req.body);
  const data = await authService.login(req.body);
  return success(res, data, 200, 'Login successful.');
});

const me = asyncHandler(async (req, res) => {
  const user = await users.findById(req.user.userId);
  if (!user) throw new AppError('User account was not found.', 404);
  return success(res, {
    userId: user.user_id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.is_active,
  });
});

const changePassword = asyncHandler(async (req, res) => {
  validateChangePassword(req.body);
  const data = await authService.changePassword(req.user.userId, req.body);
  return success(res, data);
});

module.exports = { register, login, me, changePassword };
