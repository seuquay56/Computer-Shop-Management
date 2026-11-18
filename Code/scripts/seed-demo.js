const fs = require('fs');
const path = require('path');
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

async function getOrCreateProduct(client, { name, brand, categoryId, description, imageUrl = '' }) {
  const found = await client.query(
    'SELECT product_id FROM products WHERE name = $1 AND brand = $2 ORDER BY product_id LIMIT 1',
    [name, brand]
  );
  if (found.rows[0]) {
    if (imageUrl) {
      await client.query('UPDATE products SET image_url = $1 WHERE product_id = $2', [imageUrl, found.rows[0].product_id]);
    }
    return found.rows[0].product_id;
  }
  const inserted = await client.query(
    `INSERT INTO products (name, brand, category_id, description, image_url)
     VALUES ($1, $2, $3, $4, NULLIF($5, '')) RETURNING product_id`,
    [name, brand, categoryId, description, imageUrl]
  );
  return inserted.rows[0].product_id;
}

async function getOrCreateVariant(client, { productId, sku, price, stock, threshold = 5 }) {
  const result = await client.query(
    `INSERT INTO product_variants (product_id, sku, price, stock_quantity, low_stock_threshold)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (sku) DO UPDATE SET
       product_id = EXCLUDED.product_id,
       price = EXCLUDED.price,
       stock_quantity = EXCLUDED.stock_quantity,
       low_stock_threshold = EXCLUDED.low_stock_threshold
     RETURNING variant_id`,
    [productId, sku, price, stock, threshold]
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

    // 1. Roles
    await client.query(
      `INSERT INTO roles (role_name) VALUES ('Admin'), ('Staff'), ('Customer')
       ON CONFLICT (role_name) DO NOTHING`
    );
    const roleResult = await client.query("SELECT role_id FROM roles WHERE role_name = 'Customer'");
    const customerRoleId = roleResult.rows[0].role_id;

    // 2. Staff demo account
    const staffRoleResult = await client.query("SELECT role_id FROM roles WHERE role_name = 'Staff'");
    const staffRoleId = staffRoleResult.rows[0].role_id;

    let staffResult = await client.query('SELECT user_id FROM users WHERE username = $1', ['demo_staff']);
    let staffId;
    if (staffResult.rows[0]) {
      staffId = staffResult.rows[0].user_id;
    } else {
      const staffPasswordHash = await bcrypt.hash('StaffPassword123!', env.bcryptSaltRounds);
      staffResult = await client.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
        ['demo_staff', staffPasswordHash, 'Vo Nguyen Phuc Thinh (Staff)', 'staff@computershop.local', '0901234567', staffRoleId]
      );
      staffId = staffResult.rows[0].user_id;
    }

    // 3. Customer demo account
    let customerResult = await client.query('SELECT user_id FROM users WHERE username = $1', ['demo_customer']);
    let customerId;
    if (customerResult.rows[0]) {
      customerId = customerResult.rows[0].user_id;
    } else {
      const passwordHash = await bcrypt.hash('DemoCustomer123!', env.bcryptSaltRounds);
      customerResult = await client.query(
        `INSERT INTO users (username, password_hash, full_name, email, phone, role_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
        ['demo_customer', passwordHash, 'Nguyen Nhat Huy (Customer)', 'demo.customer@example.com', '0900000001', customerRoleId]
      );
      customerId = customerResult.rows[0].user_id;
    }

    // 4. Categories
    const categoryMap = {
      CPU: await getOrCreateCategory(client, 'CPU', 'Bộ vi xử lý trung tâm máy tính để bàn và máy trạm'),
      GPU: await getOrCreateCategory(client, 'GPU', 'Card màn hình đồ họa chuyên dụng Gaming và Render'),
      Mainboard: await getOrCreateCategory(client, 'Mainboard', 'Bo mạch chủ máy tính các chuẩn kích thước ATX, Micro-ATX'),
      RAM: await getOrCreateCategory(client, 'RAM', 'Bộ nhớ truy xuất ngẫu nhiên DDR4, DDR5 tốc độ cao'),
      Storage: await getOrCreateCategory(client, 'Storage', 'Ổ đĩa cứng SSD M.2 NVMe và HDD lưu trữ'),
      'Power Supply': await getOrCreateCategory(client, 'Power Supply', 'Nguồn máy tính chuẩn 80 Plus Bronze, Gold, Platinum'),
      Laptop: await getOrCreateCategory(client, 'Laptop', 'Laptop gaming, văn phòng và đồ họa chính hãng'),
      Keyboard: await getOrCreateCategory(client, 'Keyboard', 'Bàn phím cơ, bàn phím gaming và văn phòng cao cấp'),
      Mouse: await getOrCreateCategory(client, 'Mouse', 'Chuột gaming, chuột không dây công thái học chính hãng'),
      Accessories: await getOrCreateCategory(client, 'Accessories', 'Phụ kiện máy tính, linh kiện mở rộng'),
    };

    // 5. Authentic anchor items preserved for Member 1 sample orders & dashboard metrics
    const laptopId = await getOrCreateProduct(client, {
      name: 'Laptop Gaming ASUS TUF Gaming A15 FA506NC',
      brand: 'ASUS',
      categoryId: categoryMap.Laptop,
      description: 'Laptop gaming quốc dân với CPU AMD Ryzen 5 7535HS, card đồ họa RTX 3050 4GB và màn hình 144Hz mượt mà.',
      imageUrl: '/images/products/laptop-gaming-asus-tuf-gaming-a15-fa506nc-hn011w.jpg',
    });
    const laptopVariantId = await getOrCreateVariant(client, {
      productId: laptopId, sku: 'LAP-ASUS-TUF-A15', price: 17990000, stock: 15, threshold: 5,
    });

    const keyboardId = await getOrCreateProduct(client, {
      name: 'Bàn phím cơ Gaming Asus ROG Azoth Moonlight White',
      brand: 'ASUS',
      categoryId: categoryMap.Keyboard,
      description: 'Bàn phím cơ custom không dây 3 mode, switch ROG NX Red bôi trơn sẵn, màn hình OLED độc quyền.',
      imageUrl: '/images/products/ban-phim-gaming-asus-rog-azoth-moonlight-white.jpg',
    });
    const keyboardVariantId = await getOrCreateVariant(client, {
      productId: keyboardId, sku: 'KB-ASUS-ROG-AZOTH', price: 4990000, stock: 25, threshold: 5,
    });

    const mouseId = await getOrCreateProduct(client, {
      name: 'Chuột Asus TUF Gaming M3 Gen II',
      brand: 'ASUS',
      categoryId: categoryMap.Mouse,
      description: 'Chuột gaming siêu nhẹ 59g, cảm biến quang học 8000 DPI, kháng nước bụi IP56 và đèn Aura Sync.',
      imageUrl: '/images/products/chuot-asus-tuf-gaming-m3-gen-ii.jpg',
    });
    const mouseVariantId = await getOrCreateVariant(client, {
      productId: mouseId, sku: 'CHU-ASUS-TUF-M3-GENII', price: 390000, stock: 50, threshold: 10,
    });

    // 6. Real TechZone Catalog (180 authentic products)
    const gearvnJsonPath = path.join(__dirname, '..', 'database', 'gearvn_products.json');
    let gearvnData = { products: [] };
    if (fs.existsSync(gearvnJsonPath)) {
      gearvnData = JSON.parse(fs.readFileSync(gearvnJsonPath, 'utf8'));
    }

    const seededVariantIds = [];
    console.log(`Seeding ${gearvnData.products.length} authentic hardware products...`);

    for (const item of gearvnData.products) {
      let catId = categoryMap[item.category];
      if (!catId) {
        if (item.category === 'Accessories') {
          catId = (item.name || '').toLowerCase().includes('chuột') || (item.name || '').toLowerCase().includes('mouse')
            ? categoryMap.Mouse
            : categoryMap.Keyboard;
        } else {
          catId = categoryMap.CPU;
        }
      }
      const pid = await getOrCreateProduct(client, {
        name: item.name,
        brand: item.brand,
        categoryId: catId,
        description: item.description,
        imageUrl: item.imageUrl || '',
      });

      const vid = await getOrCreateVariant(client, {
        productId: pid,
        sku: item.sku,
        price: item.price,
        stock: item.stockQuantity,
        threshold: item.lowStockThreshold || 5,
      });
      seededVariantIds.push(vid);

      // Specs
      for (const specItem of item.specs || []) {
        const specId = await getOrCreateSpec(client, specItem.specName);
        await client.query(
          `INSERT INTO product_specs (product_id, spec_id, spec_value)
           VALUES ($1, $2, $3)
           ON CONFLICT (product_id, spec_id) DO UPDATE SET spec_value = EXCLUDED.spec_value`,
          [pid, specId, specItem.specValue]
        );
      }
    }

    // 7. Inventory Transactions Log (Module 4)
    if (seededVariantIds.length >= 4) {
      try {
        await client.query(`
          INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, notes, created_by)
          VALUES
            (${seededVariantIds[0]}, 15, 'Import', '[BATCH-202611-001] Inward shipment from Synnex FPT', ${staffId}),
            (${seededVariantIds[1]}, 10, 'Import', '[BATCH-202611-001] Inward shipment from ASUS VN Distro', ${staffId}),
            (${seededVariantIds[2]}, 20, 'Import', '[BATCH-202611-002] Inward shipment from Distributor', ${staffId}),
            (${seededVariantIds[3]}, 30, 'Import', '[BATCH-202611-003] Inward shipment from Corsair Distro', ${staffId})
          ON CONFLICT DO NOTHING
        `);
      } catch (_ignored) {}
    }

    // 8. Orders & Website Visits (TV1 Preserved)
    await saveOrder(client, {
      userId: customerId, sessionId: 'demo-session-completed-001', total: 22980000,
      status: 'Completed', payment: 'VietQR', createdAt: daysAgo(2),
      items: [
        { variantId: laptopVariantId, quantity: 1, unitPrice: 17990000 },
        { variantId: keyboardVariantId, quantity: 1, unitPrice: 4990000 },
      ],
    });
    await saveOrder(client, {
      userId: customerId, sessionId: 'demo-session-paid-002', total: 5380000,
      status: 'Paid', payment: 'VietQR', createdAt: daysAgo(1),
      items: [
        { variantId: keyboardVariantId, quantity: 1, unitPrice: 4990000 },
        { variantId: mouseVariantId, quantity: 1, unitPrice: 390000 },
      ],
    });
    await saveOrder(client, {
      userId: customerId, sessionId: 'demo-session-pending-003', total: 780000,
      status: 'Packing', payment: 'COD', createdAt: daysAgo(0),
      items: [{ variantId: mouseVariantId, quantity: 2, unitPrice: 390000 }],
    });

    await client.query(
      `INSERT INTO website_visits (session_id, user_id, visited_at)
       VALUES ('demo-session-no-order-004', $1, $2)
       ON CONFLICT (session_id) DO UPDATE SET user_id = EXCLUDED.user_id, visited_at = EXCLUDED.visited_at`,
      [customerId, daysAgo(0)]
    );

    // Clean up and migrate old Accessories category to Keyboard and Mouse
    await client.query(`
      UPDATE products
      SET category_id = (SELECT category_id FROM categories WHERE name = 'Mouse')
      WHERE category_id IN (SELECT category_id FROM categories WHERE name = 'Accessories')
        AND (LOWER(name) LIKE '%chuột%' OR LOWER(name) LIKE '%mouse%');

      UPDATE products
      SET category_id = (SELECT category_id FROM categories WHERE name = 'Keyboard')
      WHERE category_id IN (SELECT category_id FROM categories WHERE name = 'Accessories');

      DELETE FROM categories WHERE name = 'Accessories' AND NOT EXISTS (SELECT 1 FROM products WHERE category_id = categories.category_id);
    `);

    await client.query('COMMIT');
    console.log('Demo data seeded successfully with authentic catalog + Member 1 KPIs!');
    console.log(`Seeded ${gearvnData.products.length} products across 8 categories with local images and technical specs.`);
    console.log('Demo accounts:');
    console.log('  Admin: admin / AdminSecurePassword123!');
    console.log('  Staff: demo_staff / StaffPassword123!');
    console.log('  Customer: demo_customer / DemoCustomer123!');
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
