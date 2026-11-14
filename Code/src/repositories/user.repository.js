const { query } = require('../config/db');

const publicUserColumns = `u.user_id, u.username, u.full_name, u.email, u.phone,
  u.is_active, u.last_login_at, u.created_at, r.role_id, r.role_name AS role`;

async function findByIdentifier(identifier) {
  const result = await query(
    `SELECT u.user_id, u.username, u.password_hash, u.full_name, u.email,
            u.phone, u.is_active, r.role_name AS role
       FROM users u JOIN roles r ON r.role_id = u.role_id
      WHERE LOWER(u.username) = LOWER($1)
         OR LOWER(COALESCE(u.email, '')) = LOWER($1)
      LIMIT 1`, [identifier]
  );
  return result.rows[0] || null;
}

async function findById(userId) {
  const result = await query(
    `SELECT ${publicUserColumns}
       FROM users u JOIN roles r ON r.role_id = u.role_id
      WHERE u.user_id = $1`, [userId]
  );
  return result.rows[0] || null;
}

async function createCustomer({ username, email, passwordHash, fullName, phone }) {
  const roleResult = await query(`SELECT role_id FROM roles WHERE role_name = 'Customer'`);
  if (!roleResult.rows[0]) throw new Error('Customer role has not been seeded. Run database/schema.sql.');
  const result = await query(
    `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
     VALUES ($1, NULLIF($2, ''), $3, NULLIF($4, ''), NULLIF($5, ''), $6)
     RETURNING user_id`,
    [username.trim(), email || '', passwordHash, fullName || '', phone || '', roleResult.rows[0].role_id]
  );
  return findById(result.rows[0].user_id);
}

async function updateLastLogin(userId) {
  await query(`UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE user_id = $1`, [userId]);
}

async function updatePassword(userId, passwordHash) {
  await query(
    `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
    [passwordHash, userId]
  );
}

async function listUsers({ page, limit, search, role, isActive }) {
  const conditions = [];
  const values = [];
  const add = (value) => { values.push(value); return `$${values.length}`; };

  if (search) {
    const p = add(`%${search}%`);
    conditions.push(`(u.username ILIKE ${p} OR COALESCE(u.full_name, '') ILIKE ${p} OR COALESCE(u.email, '') ILIKE ${p})`);
  }
  if (role) conditions.push(`r.role_name = ${add(role)}`);
  if (isActive !== undefined) conditions.push(`u.is_active = ${add(isActive)}`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM users u JOIN roles r ON r.role_id = u.role_id ${where}`,
    values
  );
  const limitParam = add(limit);
  const offsetParam = add((page - 1) * limit);
  const rowsResult = await query(
    `SELECT ${publicUserColumns}
       FROM users u JOIN roles r ON r.role_id = u.role_id
       ${where}
      ORDER BY u.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  );
  return { users: rowsResult.rows, total: countResult.rows[0].total };
}

async function setUserRole(userId, roleName) {
  const result = await query(
    `UPDATE users u SET role_id = r.role_id, updated_at = CURRENT_TIMESTAMP
       FROM roles r
      WHERE u.user_id = $1 AND r.role_name = $2
      RETURNING u.user_id`, [userId, roleName]
  );
  return result.rowCount > 0;
}

async function setUserStatus(userId, isActive) {
  const result = await query(
    `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2`,
    [isActive, userId]
  );
  return result.rowCount > 0;
}

module.exports = {
  findByIdentifier, findById, createCustomer, updateLastLogin, updatePassword,
  listUsers, setUserRole, setUserStatus,
};
