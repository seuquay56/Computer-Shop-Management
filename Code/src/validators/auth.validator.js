const AppError = require('../utils/AppError');

function validateRegister(body) {
  const { username, email, password, fullName, phone } = body || {};
  if (typeof username !== 'string' || !/^[a-zA-Z0-9_.-]{3,30}$/.test(username.trim())) {
    throw new AppError('Username must be 3-30 characters and contain only letters, numbers, dot, underscore or hyphen.', 400);
  }
  if (email != null && email !== '' && (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email))) {
    throw new AppError('Email address is not valid.', 400);
  }
  if (typeof password !== 'string' || password.length < 8 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new AppError('Password must be at least 8 characters and no more than 72 bytes.', 400);
  }
  if (fullName != null && (typeof fullName !== 'string' || fullName.trim().length > 100)) {
    throw new AppError('Full name must not exceed 100 characters.', 400);
  }
  if (phone != null && (typeof phone !== 'string' || phone.trim().length > 20)) {
    throw new AppError('Phone must not exceed 20 characters.', 400);
  }
}

function validateLogin(body) {
  if (!body || typeof body.identifier !== 'string' || !body.identifier.trim() || typeof body.password !== 'string' || !body.password) {
    throw new AppError('identifier and password are required.', 400);
  }
}

function validateChangePassword(body) {
  if (!body || typeof body.currentPassword !== 'string' || !body.currentPassword ||
      typeof body.newPassword !== 'string' || body.newPassword.length < 8 ||
      Buffer.byteLength(body.newPassword, 'utf8') > 72) {
    throw new AppError('Current password and a new password of at least 8 characters are required.', 400);
  }
  if (body.currentPassword === body.newPassword) {
    throw new AppError('New password must be different from the current password.', 400);
  }
}

module.exports = { validateRegister, validateLogin, validateChangePassword };
