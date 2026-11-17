const { query } = require('../config/db');

async function listSpecs() {
  const result = await query(
    `SELECT s.spec_id, s.spec_name,
            COUNT(DISTINCT ps.product_id)::int AS product_count,
            ARRAY_AGG(DISTINCT ps.spec_value) FILTER (WHERE ps.spec_value IS NOT NULL) AS sample_values
       FROM specs s
  LEFT JOIN product_specs ps ON ps.spec_id = s.spec_id
   GROUP BY s.spec_id, s.spec_name
   ORDER BY s.spec_name ASC`
  );
  return result.rows;
}

async function findByName(specName) {
  const result = await query(
    `SELECT spec_id, spec_name FROM specs WHERE LOWER(spec_name) = LOWER($1)`,
    [specName.trim()]
  );
  return result.rows[0] || null;
}

async function findById(specId) {
  const result = await query(
    `SELECT spec_id, spec_name FROM specs WHERE spec_id = $1`,
    [specId]
  );
  return result.rows[0] || null;
}

async function getOrCreateSpec(clientOrPool, specName) {
  const trimmed = specName.trim();
  const existing = await clientOrPool.query(
    `SELECT spec_id, spec_name FROM specs WHERE LOWER(spec_name) = LOWER($1)`,
    [trimmed]
  );
  if (existing.rows[0]) return existing.rows[0];

  const inserted = await clientOrPool.query(
    `INSERT INTO specs (spec_name)
     VALUES ($1)
     ON CONFLICT (spec_name) DO UPDATE SET spec_name = EXCLUDED.spec_name
     RETURNING spec_id, spec_name`,
    [trimmed]
  );
  return inserted.rows[0];
}

async function getDistinctValuesBySpec() {
  const result = await query(
    `SELECT s.spec_name, ARRAY_AGG(DISTINCT ps.spec_value ORDER BY ps.spec_value) AS values
       FROM specs s
       JOIN product_specs ps ON ps.spec_id = s.spec_id
   GROUP BY s.spec_name
   ORDER BY s.spec_name ASC`
  );
  return result.rows;
}

module.exports = {
  listSpecs,
  findByName,
  findById,
  getOrCreateSpec,
  getDistinctValuesBySpec,
};
