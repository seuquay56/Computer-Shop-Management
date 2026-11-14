const app = require('./app');
const env = require('./config/env');
const { query, pool } = require('./config/db');

async function startServer() {
  try {
    await query('SELECT 1');
    console.log('PostgreSQL connection established.');
    const server = app.listen(env.port, () => {
      console.log(`Computer Shop API listening at http://localhost:${env.port}`);
    });

    const shutdown = async (signal) => {
      console.log(`${signal} received. Closing server...`);
      server.close(async () => {
        await pool.end();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Could not start server:', error.message);
    process.exit(1);
  }
}

startServer();
