const users = require('../repositories/user.repository');
const { getClient } = require('../config/db');
const AppError = require('../utils/AppError');

async function listUsers(filters) {
  return users.listUsers(filters);
}

async function getUser(userId) {
  const user = await users.findById(userId);
  if (!user) throw new AppError('User was not found.', 404);
  return user;
}

async function changeRole(targetUserId, requesterId, newRole) {
  if (targetUserId === Number(requesterId)) {
    throw new AppError('You cannot change your own role.', 400);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
    const targetResult = await client.query(
      `SELECT u.user_id, r.role_name AS role
         FROM users u JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = $1 FOR UPDATE OF u`, [targetUserId]
    );
    const target = targetResult.rows[0];
    if (!target) throw new AppError('User was not found.', 404);

    if (target.role === 'Admin' && newRole !== 'Admin') {
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS count
           FROM users u JOIN roles r ON r.role_id = u.role_id
          WHERE r.role_name = 'Admin' AND u.is_active = TRUE AND u.user_id <> $1`,
        [targetUserId]
      );
      if (countResult.rows[0].count < 1) {
        throw new AppError('The system must have at least one active Admin.', 400);
      }
    }

    const updateResult = await client.query(
      `UPDATE users u SET role_id = r.role_id, updated_at = CURRENT_TIMESTAMP
         FROM roles r
        WHERE u.user_id = $1 AND r.role_name = $2`, [targetUserId, newRole]
    );
    if (updateResult.rowCount !== 1) throw new AppError('Requested role does not exist.', 400);
    await client.query('COMMIT');
    return getUser(targetUserId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function changeStatus(targetUserId, requesterId, isActive) {
  if (targetUserId === Number(requesterId) && !isActive) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE');
    const targetResult = await client.query(
      `SELECT u.user_id, u.is_active, r.role_name AS role
         FROM users u JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = $1 FOR UPDATE OF u`, [targetUserId]
    );
    const target = targetResult.rows[0];
    if (!target) throw new AppError('User was not found.', 404);

    if (target.role === 'Admin' && target.is_active && !isActive) {
      const countResult = await client.query(
        `SELECT COUNT(*)::int AS count
           FROM users u JOIN roles r ON r.role_id = u.role_id
          WHERE r.role_name = 'Admin' AND u.is_active = TRUE`,
      );
      if (countResult.rows[0].count <= 1) {
        throw new AppError('The last active Admin account cannot be deactivated.', 400);
      }
    }

    await client.query(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
      [isActive, targetUserId]
    );
    await client.query('COMMIT');
    return getUser(targetUserId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { listUsers, getUser, changeRole, changeStatus };
