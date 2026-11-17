const { query } = require('../config/db');

async function listCategories() {
  const result = await query(
    `SELECT c.category_id, c.name, c.description,
            COUNT(p.product_id)::int AS product_count
       FROM categories c
  LEFT JOIN products p ON p.category_id = c.category_id
   GROUP BY c.category_id, c.name, c.description
   ORDER BY c.name ASC`
  );
  return result.rows;
}

async function findById(categoryId) {
  const result = await query(
    `SELECT category_id, name, description
       FROM categories
      WHERE category_id = $1`,
    [categoryId]
  );
  return result.rows[0] || null;
}

async function findByName(name) {
  const result = await query(
    `SELECT category_id, name, description
       FROM categories
      WHERE LOWER(name) = LOWER($1)`,
    [name.trim()]
  );
  return result.rows[0] || null;
}

async function createCategory({ name, description }) {
  const result = await query(
    `INSERT INTO categories (name, description)
     VALUES ($1, NULLIF($2, ''))
     RETURNING category_id, name, description`,
    [name.trim(), (description || '').trim()]
  );
  return result.rows[0];
}

async function updateCategory(categoryId, { name, description }) {
  const result = await query(
    `UPDATE categories
        SET name = $1, description = NULLIF($2, '')
      WHERE category_id = $3
  RETURNING category_id, name, description`,
    [name.trim(), (description || '').trim(), categoryId]
  );
  return result.rows[0] || null;
}

async function deleteCategory(categoryId) {
  const result = await query(
    `DELETE FROM categories WHERE category_id = $1 RETURNING category_id`,
    [categoryId]
  );
  return result.rowCount > 0;
}

async function countProductsInCategory(categoryId) {
  const result = await query(
    `SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1`,
    [categoryId]
  );
  return result.rows[0].count;
}

module.exports = {
  listCategories,
  findById,
  findByName,
  createCategory,
  updateCategory,
  deleteCategory,
  countProductsInCategory,
};
