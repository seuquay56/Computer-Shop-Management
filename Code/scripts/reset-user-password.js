
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { query, pool } = require('../src/config/db');

async function main() {
    const username = (
    process.env.RESET_USERNAME || process.env.ADMIN_USERNAME || ''
    ).trim();

    const newPassword =
    process.env.RESET_PASSWORD || process.env.ADMIN_PASSWORD || '';

  if (!username || !newPassword) {
    throw new Error('Please configure RESET_USERNAME and RESET_PASSWORD in .env');
  }

  if (newPassword.length < 8 || Buffer.byteLength(newPassword, 'utf8') > 72) {
    throw new Error('Password must contain 8-72 characters/bytes.');
  }

  const result = await query(
    `SELECT u.user_id, u.username, r.role_name AS role
     FROM users u
     JOIN roles r ON r.role_id = u.role_id
     WHERE LOWER(u.username) = LOWER($1)
     LIMIT 1`,
    [username]
  );

  const user = result.rows[0];

  if (!user) {
    throw new Error(`Account "${username}" was not found.`);
  }

  const passwordHash = await bcrypt.hash(
    newPassword,
    Number(process.env.BCRYPT_SALT_ROUNDS || 12)
  );

  await query(
    `UPDATE users
     SET password_hash = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $2`,
    [passwordHash, user.user_id]
  );

  console.log('Password updated successfully!');
  console.log(`Username: ${user.username}`);
  console.log(`Role: ${user.role}`);
}

main()
  .catch(error => {
    console.error('Password reset failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
