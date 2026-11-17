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

    // Roles
    await client.query(
      `INSERT INTO roles (role_name) VALUES ('Admin'), ('Staff'), ('Customer')
       ON CONFLICT (role_name) DO NOTHING`
    );
    const roleResult = await client.query("SELECT role_id FROM roles WHERE role_name = 'Customer'");
    const customerRoleId = roleResult.rows[0].role_id;

    // Staff role & Demo Staff
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

    // Customer
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
        ['demo_customer', passwordHash, 'Nguyen Nhat Huy (Customer)', 'demo.customer@example.com', '0900000001', customerRoleId]
      );
      customerId = customerResult.rows[0].user_id;
    }

    // ==========================================
    // Categories (Module 2)
    // ==========================================
    const catCpu = await getOrCreateCategory(client, 'CPU', 'Bộ vi xử lý trung tâm máy tính để bàn và máy trạm');
    const catGpu = await getOrCreateCategory(client, 'GPU', 'Card màn hình đồ họa chuyên dụng Gaming và Render');
    const catMainboard = await getOrCreateCategory(client, 'Mainboard', 'Bo mạch chủ máy tính các chuẩn kích thước ATX, Micro-ATX');
    const catRam = await getOrCreateCategory(client, 'RAM', 'Bộ nhớ truy xuất ngẫu nhiên DDR4, DDR5 tốc độ cao');
    const catStorage = await getOrCreateCategory(client, 'Storage', 'Ổ đĩa cứng SSD M.2 NVMe và HDD lưu trữ');
    const catPsu = await getOrCreateCategory(client, 'Power Supply', 'Nguồn máy tính chuẩn 80 Plus Gold, Platinum');
    const catLaptop = await getOrCreateCategory(client, 'Laptop', 'Laptop gaming, văn phòng và đồ họa');
    const catAccessory = await getOrCreateCategory(client, 'Accessories', 'Phụ kiện bàn phím cơ, chuột gaming, tai nghe');

    // ==========================================
    // Products & Variants & Specs (Module 2)
    // ==========================================
    // 1. CPU Intel i9-14900K
    const pCpuIntel = await getOrCreateProduct(client, {
      name: 'Intel Core i9-14900K', brand: 'Intel', categoryId: catCpu,
      description: 'Bộ vi xử lý thế hệ 14 Raptor Lake Refresh, 24 nhân 32 luồng, xung nhịp lên đến 6.0 GHz.'
    });
    const vCpuIntelBox = await getOrCreateVariant(client, {
      productId: pCpuIntel, sku: 'CPU-INTEL-14900K-BOX', price: 15490000, stock: 8, threshold: 5
    });
    const vCpuIntelTray = await getOrCreateVariant(client, {
      productId: pCpuIntel, sku: 'CPU-INTEL-14900K-TRAY', price: 14200000, stock: 2, threshold: 5 // Low stock
    });

    // 2. CPU AMD Ryzen 7 7800X3D
    const pCpuAmd = await getOrCreateProduct(client, {
      name: 'AMD Ryzen 7 7800X3D', brand: 'AMD', categoryId: catCpu,
      description: 'Bộ vi xử lý Gaming đỉnh cao kiến trúc Zen 4 trang bị bộ nhớ đệm 3D V-Cache 104MB.'
    });
    const vCpuAmdBox = await getOrCreateVariant(client, {
      productId: pCpuAmd, sku: 'CPU-AMD-7800X3D-BOX', price: 11290000, stock: 16, threshold: 5
    });

    // 3. GPU ASUS ROG Strix RTX 4070 Ti SUPER
    const pGpuAsus = await getOrCreateProduct(client, {
      name: 'ASUS ROG Strix GeForce RTX 4070 Ti SUPER OC 16GB', brand: 'ASUS', categoryId: catGpu,
      description: 'Card đồ họa cao cấp ASUS ROG Strix tản nhiệt 3 quạt Axial-tech, hỗ trợ Ray Tracing và DLSS 3.'
    });
    const vGpuAsus = await getOrCreateVariant(client, {
      productId: pGpuAsus, sku: 'GPU-ASUS-4070TIS-16G', price: 26990000, stock: 3, threshold: 5 // Low stock
    });

    // 4. GPU MSI RTX 4060 Gaming X
    const pGpuMsi = await getOrCreateProduct(client, {
      name: 'MSI GeForce RTX 4060 GAMING X 8G', brand: 'MSI', categoryId: catGpu,
      description: 'Card đồ họa tầm trung quốc dân kiến trúc Ada Lovelace, thiết kế Twin Frozr 9 êm ái.'
    });
    const vGpuMsi = await getOrCreateVariant(client, {
      productId: pGpuMsi, sku: 'GPU-MSI-4060-8G', price: 8990000, stock: 22, threshold: 5
    });

    // 5. Mainboard ASUS ROG MAXIMUS Z790 HERO
    const pMbAsus = await getOrCreateProduct(client, {
      name: 'ASUS ROG MAXIMUS Z790 HERO', brand: 'ASUS', categoryId: catMainboard,
      description: 'Bo mạch chủ Intel Z790 socket LGA1700 hỗ trợ DDR5, PCIe 5.0, Wi-Fi 6E.'
    });
    const vMbAsus = await getOrCreateVariant(client, {
      productId: pMbAsus, sku: 'MB-ASUS-Z790-HERO', price: 16890000, stock: 4, threshold: 5 // Low stock
    });

    // 6. Mainboard GIGABYTE B650 AORUS ELITE AX
    const pMbGiga = await getOrCreateProduct(client, {
      name: 'GIGABYTE B650 AORUS ELITE AX', brand: 'GIGABYTE', categoryId: catMainboard,
      description: 'Bo mạch chủ AMD Socket AM5 hỗ trợ Ryzen 7000/8000/9000 series, DDR5 EXPO.'
    });
    const vMbGiga = await getOrCreateVariant(client, {
      productId: pMbGiga, sku: 'MB-GIGA-B650-AX', price: 5690000, stock: 14, threshold: 5
    });

    // 7. RAM Corsair Vengeance RGB DDR5 32GB
    const pRamCorsair = await getOrCreateProduct(client, {
      name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz', brand: 'Corsair', categoryId: catRam,
      description: 'Kit RAM DDR5 hiệu năng cao với dải LED RGB đa vùng, tối ưu cho Intel XMP và AMD EXPO.'
    });
    const vRamCorsairBlk = await getOrCreateVariant(client, {
      productId: pRamCorsair, sku: 'RAM-CORSAIR-D5-32G-BLK', price: 3250000, stock: 20, threshold: 10
    });
    const vRamCorsairWht = await getOrCreateVariant(client, {
      productId: pRamCorsair, sku: 'RAM-CORSAIR-D5-32G-WHT', price: 3350000, stock: 1, threshold: 5 // Critical low
    });

    // 8. SSD Samsung 990 PRO NVMe M.2
    const pSsdSam = await getOrCreateProduct(client, {
      name: 'Samsung 990 PRO NVMe M.2 SSD', brand: 'Samsung', categoryId: catStorage,
      description: 'Ổ cứng SSD PCIe 4.0 hàng đầu thế giới với tốc độ đọc tuần tự lên đến 7,450 MB/s.'
    });
    const vSsdSam1Tb = await getOrCreateVariant(client, {
      productId: pSsdSam, sku: 'SSD-SAM-990PRO-1TB', price: 2790000, stock: 15, threshold: 5
    });
    const vSsdSam2Tb = await getOrCreateVariant(client, {
      productId: pSsdSam, sku: 'SSD-SAM-990PRO-2TB', price: 4890000, stock: 0, threshold: 5 // Out of stock
    });

    // 9. Nguồn Corsair RM850e
    const pPsuCorsair = await getOrCreateProduct(client, {
      name: 'Corsair RM850e 850W ATX 3.0 80 Plus Gold', brand: 'Corsair', categoryId: catPsu,
      description: 'Nguồn máy tính công suất 850W, chuẩn PCIe 5.0 12VHPWR cho card đồ họa RTX 40 series.'
    });
    const vPsuCorsair = await getOrCreateVariant(client, {
      productId: pPsuCorsair, sku: 'PSU-CORSAIR-RM850E', price: 3190000, stock: 11, threshold: 5
    });

    // 10. Laptop ASUS ROG Zephyrus G14
    const pLaptopAsus = await getOrCreateProduct(client, {
      name: 'ASUS ROG Zephyrus G14 OLED GA403', brand: 'ASUS', categoryId: catLaptop,
      description: 'Laptop gaming mỏng nhẹ màn hình 14 inch 3K OLED 120Hz, Ryzen 9 8945HS, RTX 4060.'
    });
    const vLaptopAsus = await getOrCreateVariant(client, {
      productId: pLaptopAsus, sku: 'LAPTOP-ASUS-G14-OLED', price: 38990000, stock: 5, threshold: 2
    });

    // 11. Laptop AeroBook Pro 14 (TV1 original)
    const laptopId = await getOrCreateProduct(client, {
      name: 'AeroBook Pro 14', brand: 'AeroTech', categoryId: catLaptop,
      description: 'Demo laptop for testing product catalog and order reporting.'
    });
    const laptopVariantId = await getOrCreateVariant(client, {
      productId: laptopId, sku: 'DEMO-LAPTOP-001', price: 21990000, stock: 12, threshold: 5
    });

    // 12. Mechanical Keyboard K87
    const keyboardId = await getOrCreateProduct(client, {
      name: 'Mechanical Keyboard K87', brand: 'KeyWorks', categoryId: catAccessory,
      description: 'Demo mechanical keyboard with hot-swappable switches.'
    });
    const keyboardVariantId = await getOrCreateVariant(client, {
      productId: keyboardId, sku: 'DEMO-KEYBOARD-001', price: 890000, stock: 35, threshold: 10
    });

    // 13. Wireless Mouse M5
    const mouseId = await getOrCreateProduct(client, {
      name: 'Wireless Mouse M5', brand: 'ClickPro', categoryId: catAccessory,
      description: 'Demo wireless ergonomic mouse.'
    });
    const mouseVariantId = await getOrCreateVariant(client, {
      productId: mouseId, sku: 'DEMO-MOUSE-001', price: 390000, stock: 50, threshold: 10
    });

    // ==========================================
    // Specifications (Module 2 Specs Management)
    // ==========================================
    const specRows = [
      // Intel CPU
      [pCpuIntel, 'Socket', 'LGA1700'],
      [pCpuIntel, 'Cores', '24 Cores (8P + 16E)'],
      [pCpuIntel, 'TDP', '125W'],
      [pCpuIntel, 'Max Boost Clock', '6.0 GHz'],
      // AMD CPU
      [pCpuAmd, 'Socket', 'AM5'],
      [pCpuAmd, 'Cores', '8 Cores / 16 Threads'],
      [pCpuAmd, 'TDP', '120W'],
      [pCpuAmd, 'Max Boost Clock', '5.0 GHz'],
      // ASUS GPU
      [pGpuAsus, 'VRAM', '16GB GDDR6X'],
      [pGpuAsus, 'Interface', 'PCIe 4.0 x16'],
      [pGpuAsus, 'Recommended PSU', '750W'],
      // MSI GPU
      [pGpuMsi, 'VRAM', '8GB GDDR6'],
      [pGpuMsi, 'Interface', 'PCIe 4.0 x8'],
      [pGpuMsi, 'Recommended PSU', '550W'],
      // ASUS Mainboard
      [pMbAsus, 'Socket', 'LGA1700'],
      [pMbAsus, 'Chipset', 'Intel Z790'],
      [pMbAsus, 'Form Factor', 'ATX'],
      [pMbAsus, 'RAM Support', 'DDR5'],
      // GIGABYTE Mainboard
      [pMbGiga, 'Socket', 'AM5'],
      [pMbGiga, 'Chipset', 'AMD B650'],
      [pMbGiga, 'Form Factor', 'ATX'],
      [pMbGiga, 'RAM Support', 'DDR5'],
      // Corsair RAM
      [pRamCorsair, 'RAM Type', 'DDR5'],
      [pRamCorsair, 'Capacity', '32 GB'],
      [pRamCorsair, 'Bus Speed', '6000 MHz'],
      // Samsung SSD
      [pSsdSam, 'Interface', 'M.2 NVMe PCIe 4.0'],
      [pSsdSam, 'Read Speed', '7450 MB/s'],
      // Corsair PSU
      [pPsuCorsair, 'Wattage', '850W'],
      [pPsuCorsair, 'Efficiency', '80 Plus Gold'],
      // ASUS Laptop
      [pLaptopAsus, 'Display', '14 inch 3K OLED 120Hz'],
      [pLaptopAsus, 'CPU', 'AMD Ryzen 9 8945HS'],
      [pLaptopAsus, 'VRAM', '8GB RTX 4060'],
      [pLaptopAsus, 'RAM', '16 GB LPDDR5X'],
      // TV1 Demo Items
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

    // ==========================================
    // Inventory Transactions Log (Module 4)
    // ==========================================
    try {
      await client.query(`
        INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, notes, created_by)
        VALUES
          (${vCpuIntelBox}, 10, 'Import', '[BATCH-202611-001] Inward shipment from Synnex FPT', ${staffId}),
          (${vCpuIntelTray}, 5, 'Import', '[BATCH-202611-001] Inward shipment from Synnex FPT', ${staffId}),
          (${vGpuAsus}, 5, 'Import', '[BATCH-202611-002] Inward shipment from ASUS Vietnam', ${staffId}),
          (${vRamCorsairBlk}, 25, 'Import', '[BATCH-202611-003] Inward shipment from Corsair Distro', ${staffId})
        ON CONFLICT DO NOTHING
      `);
    } catch (_ignored) {}

    // ==========================================
    // Orders & Website Visits (TV1 Preserved)
    // ==========================================
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
    console.log('Demo data seeded successfully with comprehensive hardware catalog for Member 2!');
    console.log('Demo accounts:');
    console.log('  Admin: admin / AdminSecurePassword123!');
    console.log('  Staff: demo_staff / StaffPassword123!');
    console.log('  Customer: demo_customer / DemoCustomer123!');
    console.log('Products seeded across 8 categories (CPU, GPU, Mainboard, RAM, Storage, PSU, Laptop, Accessories).');
    console.log('Hardware specs configured: Socket (LGA1700, AM5), VRAM (8GB, 16GB), RAM Type (DDR4, DDR5), etc.');
    console.log('Inventory stock configured with In-Stock, Low-Stock (<= threshold), and Out-of-Stock items for alert testing.');
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
