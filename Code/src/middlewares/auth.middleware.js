const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { query } = require('../config/db');

const authenticate = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication token is required.', 401);
  }

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    throw new AppError('Invalid or expired authentication token.', 401);
  }

  const result = await query(
    `SELECT u.user_id, u.username, u.full_name, u.email, u.is_active,
            r.role_name AS role
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = $1`,
    [payload.userId]
  );

  const user = result.rows[0];
  if (!user || !user.is_active) {
    throw new AppError('Account does not exist or has been deactivated.', 401);
  }

  req.user = {
    userId: user.user_id,
    username: user.username,
    fullName: user.full_name,
    email: user.email,
    role: user.role,
  };
  next();
});

const optionalAuth = asyncHandler(async (req, _res, next) => {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    req.user = null;
    return next();
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const result = await query(
      `SELECT u.user_id, u.username, u.full_name, u.email, u.is_active,
              r.role_name AS role
         FROM users u
         JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = $1`,
      [payload.userId]
    );

    const user = result.rows[0];
    if (user && user.is_active) {
      req.user = {
        userId: user.user_id,
        username: user.username,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      };
    } else {
      req.user = null;
    }
  } catch (_error) {
    req.user = null;
  }

  next();
});

module.exports = { authenticate, optionalAuth };
