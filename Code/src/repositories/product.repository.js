const { query, getClient } = require('../config/db');
const { getOrCreateSpec } = require('./spec.repository');

async function listProducts({
  page = 1,
  limit = 20,
  search = '',
  categoryId,
  categoryName,
  brand,
  minPrice,
  maxPrice,
  inStock,
  specs = {},
  sortBy = 'newest',
}) {
  const conditions = [];
  const values = [];
  const add = (val) => {
    values.push(val);
    return `$${values.length}`;
  };

  if (search) {
    const p = add(`%${search}%`);
    conditions.push(
      `(p.name ILIKE ${p} OR p.brand ILIKE ${p} OR COALESCE(p.description, '') ILIKE ${p} OR EXISTS (
         SELECT 1 FROM product_variants pv_search WHERE pv_search.product_id = p.product_id AND pv_search.sku ILIKE ${p}
       ))`
    );
  }

  if (categoryId) {
    conditions.push(`p.category_id = ${add(categoryId)}`);
  } else if (categoryName) {
    conditions.push(`LOWER(c.name) = LOWER(${add(categoryName)})`);
  }

  if (brand) {
    conditions.push(`LOWER(p.brand) = LOWER(${add(brand)})`);
  }

  if (minPrice !== undefined) {
    conditions.push(`EXISTS (
      SELECT 1 FROM product_variants pv_min WHERE pv_min.product_id = p.product_id AND pv_min.price >= ${add(minPrice)}
    )`);
  }

  if (maxPrice !== undefined) {
    conditions.push(`EXISTS (
      SELECT 1 FROM product_variants pv_max WHERE pv_max.product_id = p.product_id AND pv_max.price <= ${add(maxPrice)}
    )`);
  }

  if (inStock === true) {
    conditions.push(`EXISTS (
      SELECT 1 FROM product_variants pv_stk WHERE pv_stk.product_id = p.product_id AND pv_stk.stock_quantity > 0
    )`);
  } else if (inStock === false) {
    conditions.push(`NOT EXISTS (
      SELECT 1 FROM product_variants pv_nostk WHERE pv_nostk.product_id = p.product_id AND pv_nostk.stock_quantity > 0
    )`);
  }

  // Filter by dynamic specs (e.g. Socket: LGA1700, RAM: 16 GB, etc.)
  for (const [specKey, specVal] of Object.entries(specs)) {
    const keyParam = add(specKey);
    const valParam = add(`%${specVal}%`);
    conditions.push(`EXISTS (
      SELECT 1 FROM product_specs ps_spec
      JOIN specs s_spec ON s_spec.spec_id = ps_spec.spec_id
      WHERE ps_spec.product_id = p.product_id
        AND LOWER(s_spec.spec_name) = LOWER(${keyParam})
        AND ps_spec.spec_value ILIKE ${valParam}
    )`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Order By
  let orderByClause = 'ORDER BY p.created_at DESC, p.product_id DESC';
  if (sortBy === 'price_asc') {
    orderByClause = 'ORDER BY min_price ASC NULLS LAST, p.name ASC';
  } else if (sortBy === 'price_desc') {
    orderByClause = 'ORDER BY max_price DESC NULLS LAST, p.name ASC';
  } else if (sortBy === 'name_asc') {
    orderByClause = 'ORDER BY p.name ASC';
  } else if (sortBy === 'name_desc') {
    orderByClause = 'ORDER BY p.name DESC';
  }

  // Count total matching products
  const countSql = `
    SELECT COUNT(DISTINCT p.product_id)::int AS total
      FROM products p
      JOIN categories c ON c.category_id = p.category_id
      ${whereClause}
  `;
  const countResult = await query(countSql, values);
  const total = countResult.rows[0]?.total || 0;

  // Retrieve page rows
  const limitParam = add(limit);
  const offsetParam = add((page - 1) * limit);

  const listSql = `
    SELECT
      p.product_id,
      p.name,
      p.brand,
      p.description,
      p.image_url,
      p.created_at,
      c.category_id,
      c.name AS category_name,
      MIN(pv.price) AS min_price,
      MAX(pv.price) AS max_price,
      COALESCE(SUM(pv.stock_quantity), 0)::int AS total_stock,
      COUNT(pv.variant_id)::int AS variant_count,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'variant_id', pv.variant_id,
            'sku', pv.sku,
            'price', pv.price,
            'stock_quantity', pv.stock_quantity,
            'low_stock_threshold', COALESCE(pv.low_stock_threshold, 5)
          )
        ) FILTER (WHERE pv.variant_id IS NOT NULL), '[]'::json
      ) AS variants,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'spec_id', s.spec_id,
            'spec_name', s.spec_name,
            'spec_value', ps.spec_value
          )
        ) FILTER (WHERE s.spec_id IS NOT NULL), '[]'::json
      ) AS specs
    FROM products p
    JOIN categories c ON c.category_id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.product_id
    LEFT JOIN product_specs ps ON ps.product_id = p.product_id
    LEFT JOIN specs s ON s.spec_id = ps.spec_id
    ${whereClause}
    GROUP BY p.product_id, c.category_id, c.name
    ${orderByClause}
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const rowsResult = await query(listSql, values);
  return { products: rowsResult.rows, total };
}

async function findById(productId) {
  const sql = `
    SELECT
      p.product_id,
      p.name,
      p.brand,
      p.description,
      p.image_url,
      p.created_at,
      c.category_id,
      c.name AS category_name,
      MIN(pv.price) AS min_price,
      MAX(pv.price) AS max_price,
      COALESCE(SUM(pv.stock_quantity), 0)::int AS total_stock,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'variant_id', pv.variant_id,
            'sku', pv.sku,
            'price', pv.price,
            'stock_quantity', pv.stock_quantity,
            'low_stock_threshold', COALESCE(pv.low_stock_threshold, 5)
          )
        ) FILTER (WHERE pv.variant_id IS NOT NULL), '[]'::json
      ) AS variants,
      COALESCE(
        JSON_AGG(
          DISTINCT JSONB_BUILD_OBJECT(
            'spec_id', s.spec_id,
            'spec_name', s.spec_name,
            'spec_value', ps.spec_value
          )
        ) FILTER (WHERE s.spec_id IS NOT NULL), '[]'::json
      ) AS specs
    FROM products p
    JOIN categories c ON c.category_id = p.category_id
    LEFT JOIN product_variants pv ON pv.product_id = p.product_id
    LEFT JOIN product_specs ps ON ps.product_id = p.product_id
    LEFT JOIN specs s ON s.spec_id = ps.spec_id
    WHERE p.product_id = $1
    GROUP BY p.product_id, c.category_id, c.name
  `;
  const result = await query(sql, [productId]);
  return result.rows[0] || null;
}

async function createProductWithDetails({ name, brand, categoryId, description, imageUrl = '', specs = [], variants = [] }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const productRes = await client.query(
      `INSERT INTO products (name, brand, category_id, description, image_url)
       VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''))
       RETURNING product_id, name, brand, category_id, description, image_url, created_at`,
      [name, brand, categoryId, description || '', imageUrl || '']
    );
    const productId = productRes.rows[0].product_id;

    // Insert specs
    for (const specItem of specs) {
      const spec = await getOrCreateSpec(client, specItem.specName);
      await client.query(
        `INSERT INTO product_specs (product_id, spec_id, spec_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, spec_id) DO UPDATE SET spec_value = EXCLUDED.spec_value`,
        [productId, spec.spec_id, specItem.specValue]
      );
    }

    // Insert variants
    for (const v of variants) {
      await client.query(
        `INSERT INTO product_variants (product_id, sku, price, stock_quantity, low_stock_threshold)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, v.sku, v.price, v.stockQuantity, v.lowStockThreshold]
      );
    }

    await client.query('COMMIT');
    return findById(productId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function updateProduct(productId, { name, brand, categoryId, description, imageUrl, specs }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const updates = [];
    const values = [];
    const add = (v) => { values.push(v); return `$${values.length}`; };

    if (name !== undefined) updates.push(`name = ${add(name)}`);
    if (brand !== undefined) updates.push(`brand = ${add(brand)}`);
    if (categoryId !== undefined) updates.push(`category_id = ${add(categoryId)}`);
    if (description !== undefined) updates.push(`description = NULLIF(${add(description || '')}, '')`);
    if (imageUrl !== undefined) updates.push(`image_url = NULLIF(${add(imageUrl || '')}, '')`);

    if (updates.length > 0) {
      const pId = add(productId);
      await client.query(
        `UPDATE products SET ${updates.join(', ')} WHERE product_id = ${pId}`,
        values
      );
    }

    if (specs !== undefined) {
      await client.query('DELETE FROM product_specs WHERE product_id = $1', [productId]);
      for (const specItem of specs) {
        const spec = await getOrCreateSpec(client, specItem.specName);
        await client.query(
          `INSERT INTO product_specs (product_id, spec_id, spec_value)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id, spec_id) DO UPDATE SET spec_value = EXCLUDED.spec_value`,
          [productId, spec.spec_id, specItem.specValue]
        );
      }
    }

    await client.query('COMMIT');
    return findById(productId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function deleteProduct(productId) {
  const result = await query(
    `DELETE FROM products WHERE product_id = $1 RETURNING product_id`,
    [productId]
  );
  return result.rowCount > 0;
}

// Variant operations
async function findVariantById(variantId) {
  const result = await query(
    `SELECT pv.variant_id, pv.product_id, pv.sku, pv.price, pv.stock_quantity,
            COALESCE(pv.low_stock_threshold, 5) AS low_stock_threshold,
            p.name AS product_name, p.brand
       FROM product_variants pv
       JOIN products p ON p.product_id = pv.product_id
      WHERE pv.variant_id = $1`,
    [variantId]
  );
  return result.rows[0] || null;
}

async function findVariantBySku(sku) {
  const result = await query(
    `SELECT variant_id, product_id, sku, price, stock_quantity,
            COALESCE(low_stock_threshold, 5) AS low_stock_threshold
       FROM product_variants
      WHERE LOWER(sku) = LOWER($1)`,
    [sku.trim()]
  );
  return result.rows[0] || null;
}

async function addVariant(productId, { sku, price, stockQuantity = 0, lowStockThreshold = 5 }) {
  const result = await query(
    `INSERT INTO product_variants (product_id, sku, price, stock_quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING variant_id, product_id, sku, price, stock_quantity, low_stock_threshold`,
    [productId, sku.trim(), price, stockQuantity, lowStockThreshold]
  );
  return result.rows[0];
}

async function updateVariant(variantId, fields) {
  const updates = [];
  const values = [];
  const add = (v) => { values.push(v); return `$${values.length}`; };

  if (fields.sku !== undefined) updates.push(`sku = ${add(fields.sku)}`);
  if (fields.price !== undefined) updates.push(`price = ${add(fields.price)}`);
  if (fields.stockQuantity !== undefined) updates.push(`stock_quantity = ${add(fields.stockQuantity)}`);
  if (fields.lowStockThreshold !== undefined) updates.push(`low_stock_threshold = ${add(fields.lowStockThreshold)}`);

  if (updates.length === 0) return findVariantById(variantId);

  const vId = add(variantId);
  const result = await query(
    `UPDATE product_variants SET ${updates.join(', ')} WHERE variant_id = ${vId}
     RETURNING variant_id, product_id, sku, price, stock_quantity, low_stock_threshold`,
    values
  );
  return result.rows[0] || null;
}

async function deleteVariant(variantId) {
  const result = await query(
    `DELETE FROM product_variants WHERE variant_id = $1 RETURNING variant_id`,
    [variantId]
  );
  return result.rowCount > 0;
}

// Global Filter Options (Brands, categories, price range, specs)
async function getFilterOptions() {
  const brandsRes = await query(
    `SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand ASC`
  );
  const categoriesRes = await query(
    `SELECT category_id, name FROM categories ORDER BY name ASC`
  );
  const priceRangeRes = await query(
    `SELECT MIN(price) AS min_price, MAX(price) AS max_price FROM product_variants`
  );
  const specsRes = await query(
    `SELECT s.spec_name, ARRAY_AGG(DISTINCT ps.spec_value ORDER BY ps.spec_value) AS values
       FROM specs s
       JOIN product_specs ps ON ps.spec_id = s.spec_id
   GROUP BY s.spec_name
   ORDER BY s.spec_name ASC`
  );

  const catSpecsRes = await query(
    `SELECT p.category_id, s.spec_name, ARRAY_AGG(DISTINCT ps.spec_value ORDER BY ps.spec_value) AS values
       FROM specs s
       JOIN product_specs ps ON ps.spec_id = s.spec_id
       JOIN products p ON p.product_id = ps.product_id
   GROUP BY p.category_id, s.spec_name
   ORDER BY p.category_id, s.spec_name ASC`
  );

  const categorySpecs = {};
  for (const row of catSpecsRes.rows) {
    const cid = String(row.category_id);
    if (!categorySpecs[cid]) categorySpecs[cid] = [];
    categorySpecs[cid].push({
      spec_name: row.spec_name,
      values: row.values,
    });
  }

  return {
    brands: brandsRes.rows.map((r) => r.brand),
    categories: categoriesRes.rows,
    priceRange: {
      min: Number(priceRangeRes.rows[0]?.min_price || 0),
      max: Number(priceRangeRes.rows[0]?.max_price || 0),
    },
    specs: specsRes.rows,
    categorySpecs,
  };
}

module.exports = {
  listProducts,
  findById,
  createProductWithDetails,
  updateProduct,
  deleteProduct,
  findVariantById,
  findVariantBySku,
  addVariant,
  updateVariant,
  deleteVariant,
  getFilterOptions,
};
