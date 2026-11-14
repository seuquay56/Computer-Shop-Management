const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { query, pool } = require('../src/config/db');

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const email = process.env.ADMIN_EMAIL || '';
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULL_NAME || 'System Administrator';

  if (!username || !password) {
    throw new Error('Set ADMIN_USERNAME and ADMIN_PASSWORD in .env before running this script.');
  }
  if (password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('ADMIN_PASSWORD must be at least 12 characters and no more than 72 bytes.');
  }

  await query(`INSERT INTO roles (role_name) VALUES ('Admin'), ('Staff'), ('Customer') ON CONFLICT (role_name) DO NOTHING`);
  const existing = await query(
    `SELECT u.user_id, r.role_name AS role
       FROM users u JOIN roles r ON r.role_id = u.role_id
      WHERE LOWER(u.username) = LOWER($1)`, [username]
  );
  if (existing.rows[0]) {
    if (existing.rows[0].role !== 'Admin') {
      throw new Error(`Username "${username}" already exists but is not an Admin. Choose a different ADMIN_USERNAME.`);
    }
    console.log(`Admin account "${username}" already exists. No password was changed.`);
    return;
  }

  const role = await query(`SELECT role_id FROM roles WHERE role_name = 'Admin'`);
  const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
  await query(
    `INSERT INTO users (username, email, password_hash, full_name, role_id)
     VALUES ($1, NULLIF($2, ''), $3, $4, $5)`,
    [username, email, passwordHash, fullName, role.rows[0].role_id]
  );
  console.log(`Admin account "${username}" created successfully.`);
}

main()
  .catch((error) => {
    console.error('Could not create Admin account:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
