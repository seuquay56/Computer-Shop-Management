const { query, getClient } = require('../config/db');

async function listInventory({
  page = 1,
  limit = 20,
  search = '',
  status = 'all',
  categoryId,
}) {
  const conditions = [];
  const values = [];
  const add = (v) => { values.push(v); return `$${values.length}`; };

  if (search) {
    const p = add(`%${search}%`);
    conditions.push(`(pv.sku ILIKE ${p} OR p.name ILIKE ${p} OR p.brand ILIKE ${p})`);
  }

  if (categoryId) {
    conditions.push(`p.category_id = ${add(categoryId)}`);
  }

  if (status === 'out_of_stock') {
    conditions.push(`pv.stock_quantity = 0`);
  } else if (status === 'low_stock') {
    conditions.push(`pv.stock_quantity > 0 AND pv.stock_quantity <= COALESCE(pv.low_stock_threshold, 5)`);
  } else if (status === 'in_stock') {
    conditions.push(`pv.stock_quantity > COALESCE(pv.low_stock_threshold, 5)`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  // Summary statistics across entire inventory
  const statsRes = await query(`
    SELECT
      COUNT(pv.variant_id)::int AS total_skus,
      COALESCE(SUM(pv.stock_quantity), 0)::int AS total_units,
      COALESCE(SUM(pv.stock_quantity * pv.price), 0)::numeric AS total_inventory_value,
      COUNT(pv.variant_id) FILTER (WHERE pv.stock_quantity = 0)::int AS out_of_stock_count,
      COUNT(pv.variant_id) FILTER (WHERE pv.stock_quantity > 0 AND pv.stock_quantity <= COALESCE(pv.low_stock_threshold, 5))::int AS low_stock_count
    FROM product_variants pv
  `);
  const stats = statsRes.rows[0];

  // Total count for pagination
  const countSql = `
    SELECT COUNT(*)::int AS total
      FROM product_variants pv
      JOIN products p ON p.product_id = pv.product_id
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
      pv.variant_id,
      pv.product_id,
      pv.sku,
      pv.price,
      pv.stock_quantity,
      COALESCE(pv.low_stock_threshold, 5) AS low_stock_threshold,
      p.name AS product_name,
      p.brand,
      c.name AS category_name,
      CASE
        WHEN pv.stock_quantity = 0 THEN 'Out of Stock'
        WHEN pv.stock_quantity <= COALESCE(pv.low_stock_threshold, 5) THEN 'Low Stock'
        ELSE 'In Stock'
      END AS stock_status,
      (pv.stock_quantity * pv.price) AS total_value
    FROM product_variants pv
    JOIN products p ON p.product_id = pv.product_id
    JOIN categories c ON c.category_id = p.category_id
    ${whereClause}
    ORDER BY
      CASE
        WHEN pv.stock_quantity = 0 THEN 1
        WHEN pv.stock_quantity <= COALESCE(pv.low_stock_threshold, 5) THEN 2
        ELSE 3
      END ASC,
      pv.stock_quantity ASC,
      pv.sku ASC
    LIMIT ${limitParam} OFFSET ${offsetParam}
  `;

  const rowsResult = await query(listSql, values);
  return { items: rowsResult.rows, total, stats };
}

async function getLowStockAlerts() {
  const sql = `
    SELECT
      pv.variant_id,
      pv.product_id,
      pv.sku,
      pv.price,
      pv.stock_quantity,
      COALESCE(pv.low_stock_threshold, 5) AS low_stock_threshold,
      p.name AS product_name,
      p.brand,
      c.name AS category_name,
      CASE
        WHEN pv.stock_quantity = 0 THEN 'CRITICAL'
        ELSE 'WARNING'
      END AS alert_level,
      GREATEST(COALESCE(pv.low_stock_threshold, 5) - pv.stock_quantity, 0) AS deficit_quantity,
      (COALESCE(pv.low_stock_threshold, 5) * 3 - pv.stock_quantity) AS recommended_reorder_qty
    FROM product_variants pv
    JOIN products p ON p.product_id = pv.product_id
    JOIN categories c ON c.category_id = p.category_id
    WHERE pv.stock_quantity <= COALESCE(pv.low_stock_threshold, 5)
    ORDER BY pv.stock_quantity ASC, pv.sku ASC
  `;
  const result = await query(sql);
  return result.rows;
}

async function batchRestock(client, items, userId, notes = '', batchCode = '') {
  const updatedItems = [];
  const fullNotes = `[${batchCode || 'MANUAL-IMPORT'}] ${notes}`.trim();

  for (const item of items) {
    let variantId = item.variantId;
    if (!variantId && item.sku) {
      const vRes = await client.query('SELECT variant_id FROM product_variants WHERE LOWER(sku) = LOWER($1)', [item.sku.trim()]);
      if (vRes.rows[0]) variantId = vRes.rows[0].variant_id;
    }
    if (!variantId) {
      throw new Error(`Variant not found for restock item: ${JSON.stringify(item)}`);
    }

    const updateRes = await client.query(
      `UPDATE product_variants
          SET stock_quantity = stock_quantity + $1
        WHERE variant_id = $2
    RETURNING variant_id, sku, price, stock_quantity, low_stock_threshold`,
      [item.quantity, variantId]
    );

    if (updateRes.rowCount === 0) {
      throw new Error(`Variant with ID ${variantId} does not exist.`);
    }

    // Try logging to inventory_transactions if table exists
    try {
      await client.query(
        `INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, notes, created_by)
         VALUES ($1, $2, 'Import', $3, $4)`,
        [variantId, item.quantity, fullNotes, userId || null]
      );
    } catch (_ignored) {
      // Graceful fallback if table is omitted
    }

    updatedItems.push({
      ...updateRes.rows[0],
      addedQuantity: item.quantity,
    });
  }

  return updatedItems;
}

async function adjustStock(client, variantId, { newQuantity, lowStockThreshold, reason }, userId) {
  const currentRes = await client.query(
    `SELECT variant_id, stock_quantity, low_stock_threshold FROM product_variants WHERE variant_id = $1`,
    [variantId]
  );
  if (!currentRes.rows[0]) {
    throw new Error(`Variant with ID ${variantId} not found.`);
  }

  const oldStock = currentRes.rows[0].stock_quantity;
  const targetStock = newQuantity !== undefined ? newQuantity : oldStock;
  const delta = targetStock - oldStock;
  const threshold = lowStockThreshold !== undefined ? lowStockThreshold : currentRes.rows[0].low_stock_threshold;

  const updateRes = await client.query(
    `UPDATE product_variants
        SET stock_quantity = $1, low_stock_threshold = $2
      WHERE variant_id = $3
  RETURNING variant_id, sku, price, stock_quantity, low_stock_threshold`,
    [targetStock, threshold, variantId]
  );

  try {
    await client.query(
      `INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, notes, created_by)
       VALUES ($1, $2, 'Adjustment', $3, $4)`,
      [variantId, delta, reason || 'Manual stock level adjustment', userId || null]
    );
  } catch (_ignored) {}

  return updateRes.rows[0];
}

async function deductStockForOrder(client, orderItems, userId) {
  for (const item of orderItems) {
    const checkRes = await client.query(
      `SELECT variant_id, sku, stock_quantity
         FROM product_variants
        WHERE variant_id = $1
          FOR UPDATE`,
      [item.variantId]
    );
    if (!checkRes.rows[0]) {
      throw new Error(`Variant with ID ${item.variantId} not found.`);
    }

    const currentStock = checkRes.rows[0].stock_quantity;
    if (currentStock < item.quantity) {
      throw new Error(
        `Insufficient inventory for SKU '${checkRes.rows[0].sku}'. Requested: ${item.quantity}, Available: ${currentStock}.`
      );
    }

    await client.query(
      `UPDATE product_variants
          SET stock_quantity = stock_quantity - $1
        WHERE variant_id = $2`,
      [item.quantity, item.variantId]
    );

    try {
      await client.query(
        `INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, notes, created_by)
         VALUES ($1, $2, 'Sale', $3, $4)`,
        [item.variantId, -item.quantity, `Deducted for order checkout`, userId || null]
      );
    } catch (_ignored) {}
  }
}

async function getTransactionHistory({ page = 1, limit = 20, variantId }) {
  try {
    const conditions = [];
    const values = [];
    const add = (v) => { values.push(v); return `$${values.length}`; };

    if (variantId) {
      conditions.push(`it.variant_id = ${add(variantId)}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const countRes = await query(`SELECT COUNT(*)::int AS total FROM inventory_transactions it ${where}`, values);
    const total = countRes.rows[0]?.total || 0;

    const limitParam = add(limit);
    const offsetParam = add((page - 1) * limit);

    const rowsRes = await query(
      `SELECT
        it.transaction_id,
        it.variant_id,
        it.change_quantity,
        it.transaction_type,
        it.notes,
        it.created_at,
        pv.sku,
        p.name AS product_name,
        u.username AS actor_username
       FROM inventory_transactions it
       JOIN product_variants pv ON pv.variant_id = it.variant_id
       JOIN products p ON p.product_id = pv.product_id
  LEFT JOIN users u ON u.user_id = it.created_by
       ${where}
       ORDER BY it.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      values
    );

    return { transactions: rowsRes.rows, total };
  } catch (_e) {
    return { transactions: [], total: 0 };
  }
}

module.exports = {
  listInventory,
  getLowStockAlerts,
  batchRestock,
  adjustStock,
  deductStockForOrder,
  getTransactionHistory,
};
