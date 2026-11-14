const { query, pool } = require('../src/config/db');

const expectedTables = [
  'roles', 'users', 'categories', 'products', 'product_variants',
  'specs', 'product_specs', 'website_visits', 'orders', 'order_items',
];

async function main() {
  const connection = await query('SELECT current_database() AS database, NOW() AS server_time');
  const tableResult = await query(
    `SELECT table_name
       FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
  );
  const existingTables = new Set(tableResult.rows.map((row) => row.table_name));
  const missingTables = expectedTables.filter((table) => !existingTables.has(table));

  if (missingTables.length) {
    throw new Error(`Database is reachable, but schema is incomplete. Missing tables: ${missingTables.join(', ')}. Run database/schema.sql in pgAdmin.`);
  }

  const rolesResult = await query(`SELECT role_name FROM roles ORDER BY role_id`);
  const roleNames = new Set(rolesResult.rows.map((row) => row.role_name));
  const missingRoles = ['Admin', 'Staff', 'Customer'].filter((role) => !roleNames.has(role));
  if (missingRoles.length) {
    throw new Error(`Schema exists, but these roles are missing: ${missingRoles.join(', ')}. Re-run database/schema.sql.`);
  }

  console.log('PostgreSQL connection successful.');
  console.log('Database:', connection.rows[0].database);
  console.log(`Schema: ${expectedTables.length}/${expectedTables.length} required tables found.`);
  console.log('Roles:', [...roleNames].join(', '));
}

main()
  .catch((error) => {
    console.error('Database check failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
