const { query } = require('../config/db');

async function getVariantsWithSpecs(variantIds, client = null) {
  if (!Array.isArray(variantIds) || variantIds.length === 0) return [];
  const runner = client || { query };

  const variantsRes = await runner.query(
    `SELECT
       pv.variant_id,
       pv.product_id,
       pv.sku,
       pv.price,
       pv.stock_quantity,
       COALESCE(pv.low_stock_threshold, 5) AS low_stock_threshold,
       p.name AS product_name,
       p.brand,
       p.image_url,
       c.category_id,
       c.name AS category_name
     FROM product_variants pv
     JOIN products p ON p.product_id = pv.product_id
     JOIN categories c ON c.category_id = p.category_id
     WHERE pv.variant_id = ANY($1::bigint[])`,
    [variantIds]
  );

  if (variantsRes.rows.length === 0) return [];

  const productIds = [...new Set(variantsRes.rows.map((r) => r.product_id))];
  const specsRes = await runner.query(
    `SELECT ps.product_id, s.spec_name, ps.spec_value
       FROM product_specs ps
       JOIN specs s ON s.spec_id = ps.spec_id
      WHERE ps.product_id = ANY($1::bigint[])`,
    [productIds]
  );

  const specsByProduct = new Map();
  for (const row of specsRes.rows) {
    if (!specsByProduct.has(row.product_id)) specsByProduct.set(row.product_id, {});
    specsByProduct.get(row.product_id)[row.spec_name] = row.spec_value;
  }

  return variantsRes.rows.map((row) => ({
    ...row,
    price: Number(row.price),
    specs: specsByProduct.get(row.product_id) || {},
  }));
}

async function ensureWebsiteVisit(client, sessionId, userId = null) {
  if (!sessionId) return null;
  await client.query(
    `INSERT INTO website_visits (session_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (session_id) DO UPDATE
       SET user_id = COALESCE(EXCLUDED.user_id, website_visits.user_id)`,
    [sessionId, userId]
  );
  return sessionId;
}

async function createOrder(client, { userId, sessionId, totalAmount, status, paymentMethod, items }) {
  const orderRes = await client.query(
    `INSERT INTO orders (user_id, session_id, total_amount, status, payment_method)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING order_id, user_id, session_id, total_amount, status, payment_method, created_at`,
    [userId, sessionId || null, totalAmount, status, paymentMethod]
  );
  const order = orderRes.rows[0];

  const insertedItems = [];
  for (const item of items) {
    const itemRes = await client.query(
      `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)
       RETURNING item_id, order_id, variant_id, quantity, unit_price`,
      [order.order_id, item.variantId, item.quantity, item.unitPrice]
    );
    insertedItems.push({
      ...itemRes.rows[0],
      unit_price: Number(itemRes.rows[0].unit_price),
      sku: item.sku,
      product_name: item.productName,
    });
  }

  return {
    ...order,
    total_amount: Number(order.total_amount),
    items: insertedItems,
  };
}

async function findOrderById(orderId, client = null) {
  const runner = client || { query };
  const orderRes = await runner.query(
    `SELECT
       o.order_id,
       o.user_id,
       o.session_id,
       o.total_amount,
       o.status,
       o.payment_method,
       o.created_at,
       u.username,
       u.full_name AS customer_name,
       u.email AS customer_email,
       u.phone AS customer_phone
     FROM orders o
     JOIN users u ON u.user_id = o.user_id
     WHERE o.order_id = $1`,
    [orderId]
  );

  const order = orderRes.rows[0];
  if (!order) return null;

  const itemsRes = await runner.query(
    `SELECT
       oi.item_id,
       oi.order_id,
       oi.variant_id,
       oi.quantity,
       oi.unit_price,
       pv.sku,
       pv.stock_quantity AS current_stock,
       p.product_id,
       p.name AS product_name,
       p.brand,
       p.image_url,
       c.name AS category_name
     FROM order_items oi
     JOIN product_variants pv ON pv.variant_id = oi.variant_id
     JOIN products p ON p.product_id = pv.product_id
     JOIN categories c ON c.category_id = p.category_id
     WHERE oi.order_id = $1
     ORDER BY oi.item_id ASC`,
    [orderId]
  );

  return {
    ...order,
    total_amount: Number(order.total_amount),
    items: itemsRes.rows.map((r) => ({
      ...r,
      unit_price: Number(r.unit_price),
      subtotal: Number(r.unit_price) * Number(r.quantity),
    })),
  };
}

async function lockOrderById(client, orderId) {
  const res = await client.query(
    `SELECT order_id, user_id, session_id, total_amount, status, payment_method, created_at
       FROM orders
      WHERE order_id = $1
      FOR UPDATE`,
    [orderId]
  );
  if (!res.rows[0]) return null;
  const order = res.rows[0];
  const itemsRes = await client.query(
    `SELECT item_id, order_id, variant_id, quantity, unit_price
       FROM order_items
      WHERE order_id = $1
      ORDER BY item_id ASC`,
    [orderId]
  );
  return {
    ...order,
    total_amount: Number(order.total_amount),
    items: itemsRes.rows.map((r) => ({
      variantId: Number(r.variant_id),
      quantity: Number(r.quantity),
      unitPrice: Number(r.unit_price),
    })),
  };
}

async function findPendingOrders(client = null) {
  const runner = client || { query };
  const res = await runner.query(
    `SELECT order_id, user_id, session_id, total_amount, status, payment_method, created_at
       FROM orders
      WHERE status = 'Pending'
      ORDER BY created_at DESC
      LIMIT 100`
  );
  return res.rows.map((r) => ({
    ...r,
    total_amount: Number(r.total_amount),
  }));
}

async function updateOrderStatus(client, orderId, nextStatus) {
  const res = await client.query(
    `UPDATE orders
        SET status = $1
      WHERE order_id = $2
    RETURNING order_id, user_id, session_id, total_amount, status, payment_method, created_at`,
    [nextStatus, orderId]
  );
  return res.rows[0] ? { ...res.rows[0], total_amount: Number(res.rows[0].total_amount) } : null;
}

async function restoreStockForCancelledOrder(client, orderItems, userId, orderId) {
  for (const item of orderItems) {
    await client.query(
      `UPDATE product_variants
          SET stock_quantity = stock_quantity + $1
        WHERE variant_id = $2`,
      [item.quantity, item.variantId]
    );
    try {
      await client.query(
        `INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, notes, created_by)
         VALUES ($1, $2, 'Return', $3, $4)`,
        [item.variantId, item.quantity, `Stock restored from cancelled order #${orderId}`, userId || null]
      );
    } catch (_ignored) {}
  }
}

async function listOrders({ userId = null, page = 1, limit = 20, status = '', paymentMethod = '', search = '' }) {
  const conditions = [];
  const values = [];
  const add = (v) => {
    values.push(v);
    return `$${values.length}`;
  };

  if (userId) conditions.push(`o.user_id = ${add(userId)}`);
  if (status) conditions.push(`o.status = ${add(status)}`);
  if (paymentMethod) conditions.push(`o.payment_method = ${add(paymentMethod)}`);
  if (search) {
    const p = add(`%${search}%`);
    conditions.push(`(CAST(o.order_id AS TEXT) ILIKE ${p} OR u.username ILIKE ${p} OR COALESCE(u.full_name, '') ILIKE ${p} OR COALESCE(o.session_id, '') ILIKE ${p})`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const countRes = await query(
    `SELECT COUNT(*)::int AS total
       FROM orders o
       JOIN users u ON u.user_id = o.user_id
       ${where}`,
    values
  );
  const total = countRes.rows[0]?.total || 0;

  const limitParam = add(limit);
  const offsetParam = add((page - 1) * limit);

  const listRes = await query(
    `SELECT
       o.order_id,
       o.user_id,
       o.session_id,
       o.total_amount,
       o.status,
       o.payment_method,
       o.created_at,
       u.username,
       u.full_name AS customer_name,
       u.phone AS customer_phone,
       (SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = o.order_id) AS item_count,
       (SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = o.order_id) AS total_quantity,
       (
         SELECT COALESCE(
           json_agg(
             json_build_object(
               'item_id', oi.item_id,
               'variant_id', oi.variant_id,
               'quantity', oi.quantity,
               'unit_price', oi.unit_price::numeric,
               'sku', pv.sku,
               'product_name', p.name,
               'brand', p.brand,
               'image_url', p.image_url
             ) ORDER BY oi.item_id ASC
           ),
           '[]'::json
         )
         FROM order_items oi
         JOIN product_variants pv ON pv.variant_id = oi.variant_id
         JOIN products p ON p.product_id = pv.product_id
         WHERE oi.order_id = o.order_id
       ) AS items
     FROM orders o
     JOIN users u ON u.user_id = o.user_id
     ${where}
     ORDER BY o.created_at DESC, o.order_id DESC
     LIMIT ${limitParam} OFFSET ${offsetParam}`,
    values
  );

  return {
    orders: listRes.rows.map((r) => ({ ...r, total_amount: Number(r.total_amount) })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

module.exports = {
  createOrder,
  ensureWebsiteVisit,
  findOrderById,
  findPendingOrders,
  getVariantsWithSpecs,
  listOrders,
  lockOrderById,
  restoreStockForCancelledOrder,
  updateOrderStatus,
};
