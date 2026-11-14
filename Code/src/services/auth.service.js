const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const users = require('../repositories/user.repository');
const AppError = require('../utils/AppError');

function signToken(user) {
  return jwt.sign(
    { userId: user.user_id, username: user.username, role: user.role },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

function safeUser(user) {
  return {
    userId: user.user_id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.is_active,
  };
}

async function register(data) {
  const passwordHash = await bcrypt.hash(data.password, env.bcryptSaltRounds);
  let user;
  try {
    user = await users.createCustomer({
      username: data.username,
      email: data.email || '',
      passwordHash,
      fullName: data.fullName || '',
      phone: data.phone || '',
    });
  } catch (error) {
    if (error.code === '23505') throw new AppError('Username or email is already registered.', 409);
    throw error;
  }
  return { user: safeUser(user), token: signToken(user) };
}

async function login({ identifier, password }) {
  const user = await users.findByIdentifier(identifier.trim());
  if (!user || !user.is_active) throw new AppError('Invalid username/email or password.', 401);
  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid username/email or password.', 401);
  await users.updateLastLogin(user.user_id);
  return {
    user: safeUser(user),
    token: signToken(user),
  };
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const profile = await users.findById(userId);
  if (!profile) throw new AppError('User account was not found.', 404);
  const user = await users.findByIdentifier(profile.username);
  if (!user) throw new AppError('User account was not found.', 404);
  const isCurrentValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isCurrentValid) throw new AppError('Current password is incorrect.', 400);
  const passwordHash = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
  await users.updatePassword(userId, passwordHash);
  return { message: 'Password changed successfully. Please sign in again on other devices.' };
}

module.exports = { register, login, changePassword, safeUser };
