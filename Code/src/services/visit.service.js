const { query } = require('../config/db');
const AppError = require('../utils/AppError');

async function trackVisit({ sessionId, userId = null }) {
  if (typeof sessionId !== 'string' || sessionId.trim().length < 8 || sessionId.trim().length > 100) {
    throw new AppError('sessionId must be a string between 8 and 100 characters.', 400);
  }
  await query(
    `INSERT INTO website_visits (session_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (session_id) DO UPDATE
       SET user_id = COALESCE(EXCLUDED.user_id, website_visits.user_id)`,
    [sessionId.trim(), userId]
  );
  return { sessionId: sessionId.trim(), tracked: true };
}

module.exports = { trackVisit };
