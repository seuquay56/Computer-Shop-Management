const bcrypt = require('bcryptjs');
const env = require('../src/config/env');
const { pool } = require('../src/config/db');

function daysAgo(days) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function getOrCreateCategory(client, name, description) {
  const found = await client.query('SELECT category_id FROM categories WHERE name = $1', [name]);
  if (found.rows[0]) return found.rows[0].category_id;
  const inserted = await client.query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING category_id',
    [name, description]
  );
  return inserted.rows[0].category_id;
}

async function getOrCreateProduct(client, { name, brand, categoryId, description }) {
  const found = await client.query(
    'SELECT product_id FROM products WHERE name = $1 AND brand = $2 ORDER BY product_id LIMIT 1',
    [name, brand]
  );
  if (found.rows[0]) return found.rows[0].product_id;
  const inserted = await client.query(
    `INSERT INTO products (name, brand, category_id, description)
     VALUES ($1, $2, $3, $4) RETURNING product_id`,
    [name, brand, categoryId, description]
  );
  return inserted.rows[0].product_id;
}

async function getOrCreateVariant(client, { productId, sku, price, stock }) {
  const result = await client.query(
    `INSERT INTO product_variants (product_id, sku, price, stock_quantity)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (sku) DO UPDATE SET
       product_id = EXCLUDED.product_id,
       price = EXCLUDED.price,
       stock_quantity = EXCLUDED.stock_quantity
     RETURNING variant_id`,
    [productId, sku, price, stock]
  );
  return result.rows[0].variant_id;
}

async function getOrCreateSpec(client, specName) {
  const result = await client.query(
    `INSERT INTO specs (spec_name) VALUES ($1)
     ON CONFLICT (spec_name) DO UPDATE SET spec_name = EXCLUDED.spec_name
     RETURNING spec_id`,
    [specName]
  );
  return result.rows[0].spec_id;
}

async function saveOrder(client, { userId, sessionId, total, status, payment, createdAt, items }) {
  await client.query(
    `INSERT INTO website_visits (session_id, user_id, visited_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id) DO UPDATE SET
       user_id = EXCLUDED.user_id,
       visited_at = EXCLUDED.visited_at`,
    [sessionId, userId, createdAt]
  );

  const found = await client.query(
    'SELECT order_id FROM orders WHERE session_id = $1 AND user_id = $2 ORDER BY order_id LIMIT 1',
    [sessionId, userId]
  );

  let orderId;
  if (found.rows[0]) {
    orderId = found.rows[0].order_id;
    await client.query(
      `UPDATE orders SET total_amount = $1, status = $2, payment_method = $3, created_at = $4
       WHERE order_id = $5`,
      [total, status, payment, createdAt, orderId]
    );
    await client.query('DELETE FROM order_items WHERE order_id = $1', [orderId]);
  } else {
    const inserted = await client.query(
      `INSERT INTO orders (user_id, session_id, total_amount, status, payment_method, created_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING order_id`,
      [userId, sessionId, total, status, payment, createdAt]
    );
    orderId = inserted.rows[0].order_id;
  }

  for (const item of items) {
    await client.query(
      `INSERT INTO order_items (order_id, variant_id, quantity, unit_price)
       VALUES ($1, $2, $3, $4)`,
      [orderId, item.variantId, item.quantity, item.unitPrice]
    );
  }
  return orderId;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      `INSERT INTO roles (role_name) VALUES ('Admin'), ('Staff'), ('Customer')
       ON CONFLICT (role_name) DO NOTHING`
    );
    const roleResult = await client.query("SELECT role_id FROM roles WHERE role_name = 'Customer'");
    const customerRoleId = roleResult.rows[0].role_id;

    let customerResult = await client.query(
      'SELECT user_id FROM users WHERE username = $1', ['demo_customer']
    );
    let customerId;
    if (customerResult.rows[0]) {
      customerId = customerResult.rows[0].user_id;
    } else {
      const passwordHash = await bcrypt.hash('DemoCustomer123!', env.bcryptSaltRounds);
      customerResult = await client.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
        ['demo_customer', passwordHash, 'Demo Customer', 'demo.customer@example.com', '0900000001', customerRoleId]
      );
      customerId = customerResult.rows[0].user_id;
    }

    const laptopCategoryId = await getOrCreateCategory(client, 'Laptop', 'Laptop and notebook computers');
    const accessoryCategoryId = await getOrCreateCategory(client, 'Accessories', 'Computer accessories and peripherals');

    const laptopId = await getOrCreateProduct(client, {
      name: 'AeroBook Pro 14', brand: 'AeroTech', categoryId: laptopCategoryId,
      description: 'Demo laptop for testing product catalog and order reporting.'
    });
    const keyboardId = await getOrCreateProduct(client, {
      name: 'Mechanical Keyboard K87', brand: 'KeyWorks', categoryId: accessoryCategoryId,
      description: 'Demo mechanical keyboard.'
    });
    const mouseId = await getOrCreateProduct(client, {
      name: 'Wireless Mouse M5', brand: 'ClickPro', categoryId: accessoryCategoryId,
      description: 'Demo wireless mouse.'
    });

    const laptopVariantId = await getOrCreateVariant(client, {
      productId: laptopId, sku: 'DEMO-LAPTOP-001', price: 21990000, stock: 12
    });
    const keyboardVariantId = await getOrCreateVariant(client, {
      productId: keyboardId, sku: 'DEMO-KEYBOARD-001', price: 890000, stock: 35
    });
    const mouseVariantId = await getOrCreateVariant(client, {
      productId: mouseId, sku: 'DEMO-MOUSE-001', price: 390000, stock: 50
    });

    const specRows = [
      [laptopId, 'CPU', 'Intel Core i7'],
      [laptopId, 'RAM', '16 GB'],
      [keyboardId, 'Switch Type', 'Brown Switch'],
      [mouseId, 'Connection', '2.4 GHz Wireless'],
    ];
    for (const [productId, specName, specValue] of specRows) {
      const specId = await getOrCreateSpec(client, specName);
      await client.query(
        `INSERT INTO product_specs (product_id, spec_id, spec_value)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id, spec_id) DO UPDATE SET spec_value = EXCLUDED.spec_value`,
        [productId, specId, specValue]
      );
    }

    const orderIds = [];
    orderIds.push(await saveOrder(client, {
      userId: customerId, sessionId: 'demo-session-completed-001', total: 22880000,
      status: 'Completed', payment: 'VietQR', createdAt: daysAgo(2),
      items: [
        { variantId: laptopVariantId, quantity: 1, unitPrice: 21990000 },
        { variantId: keyboardVariantId, quantity: 1, unitPrice: 890000 },
      ],
    }));
    orderIds.push(await saveOrder(client, {
      userId: customerId, sessionId: 'demo-session-paid-002', total: 1280000,
      status: 'Paid', payment: 'ZaloPay', createdAt: daysAgo(1),
      items: [
        { variantId: keyboardVariantId, quantity: 1, unitPrice: 890000 },
        { variantId: mouseVariantId, quantity: 1, unitPrice: 390000 },
      ],
    }));
    orderIds.push(await saveOrder(client, {
      userId: customerId, sessionId: 'demo-session-pending-003', total: 780000,
      status: 'Pending', payment: 'COD', createdAt: daysAgo(0),
      items: [{ variantId: mouseVariantId, quantity: 2, unitPrice: 390000 }],
    }));

    await client.query(
      `INSERT INTO website_visits (session_id, user_id, visited_at)
       VALUES ('demo-session-no-order-004', $1, $2)
       ON CONFLICT (session_id) DO UPDATE SET user_id = EXCLUDED.user_id, visited_at = EXCLUDED.visited_at`,
      [customerId, daysAgo(0)]
    );

    await client.query('COMMIT');
    console.log('Demo data seeded successfully.');
    console.log('Demo customer: demo_customer / DemoCustomer123!');
    console.log('Sample orders:', orderIds.join(', '));
    console.log('Demo rows add 4 tracked sessions, 3 converted sessions and one visit without an order (75% conversion within the demo sample).');
    console.log('Revenue excludes Pending and Cancelled orders; sample Paid + Completed revenue is VND 24,160,000.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (error) => {
    console.error('Could not seed demo data:', error.message);
    process.exitCode = 1;
    await pool.end().catch(() => {});
  });
