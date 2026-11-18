const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../src/config/env');

async function main() {
  const { host, port, database, user, password, ssl } = env.database;

  // 1. Connect to default 'postgres' maintenance database to create target DB if missing
  const adminClient = new Client({
    host,
    port,
    database: 'postgres',
    user,
    password,
    ssl,
  });

  await adminClient.connect();
  try {
    const check = await adminClient.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [database]
    );
    if (check.rowCount === 0) {
      const safeDbName = database.replace(/[^a-zA-Z0-9_]/g, '');
      await adminClient.query(`CREATE DATABASE "${safeDbName}"`);
      console.log(`Created PostgreSQL database "${safeDbName}".`);
    } else {
      console.log(`Database "${database}" already exists.`);
    }
  } finally {
    await adminClient.end();
  }

  // 2. Connect to target database and apply database/schema.sql
  const dbClient = new Client({
    host,
    port,
    database,
    user,
    password,
    ssl,
  });

  await dbClient.connect();
  try {
    const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    await dbClient.query(sql);
    console.log('Applied database/schema.sql successfully (11 tables ready).');
  } finally {
    await dbClient.end();
  }
}

main().catch((error) => {
  console.error('Database initialization failed:', error.message);
  process.exit(1);
});
