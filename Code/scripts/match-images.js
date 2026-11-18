const fs = require('fs');
const path = require('path');
const { query } = require('../src/config/db');

async function main() {
  const imagesDir = path.join(__dirname, '..', 'public', 'images', 'products');
  const files = fs.readdirSync(imagesDir);

  const productMap = [
    { id: 1, pattern: /14900k\.jpg/i, name: 'Intel Core i9-14900K' },
    { id: 2, pattern: /7800x3d\.jpg/i, name: 'AMD Ryzen 7 7800X3D' },
    { id: 3, pattern: /4070.*super|4070-ti/i, name: 'ASUS ROG Strix GeForce RTX 4070 Ti SUPER OC 16GB' },
    { id: 4, pattern: /4060.*gaming|rtx-4060/i, name: 'MSI GeForce RTX 4060 GAMING X 8G' },
    { id: 5, pattern: /z790|z890-hero/i, name: 'ASUS ROG MAXIMUS Z790 HERO' },
    { id: 6, pattern: /b650/i, name: 'GIGABYTE B650 AORUS ELITE AX' },
    { id: 7, exact: '/images/products/ram-corsair-vengeance-rgb-white-32gb-2x16gb-6000-ddr5-cmh32gx5m2e.jpg', name: 'Corsair Vengeance RGB 32GB (2x16GB) DDR5 6000MHz' },
    { id: 8, pattern: /990-pro.*1tb|990-pro/i, name: 'Samsung 990 PRO NVMe M.2 SSD' },
    { id: 9, pattern: /rm850e/i, name: 'Corsair RM850e 850W ATX 3.0 80 Plus Gold' },
    { id: 10, exact: '/images/products/laptop-gaming-asus-rog-strix-g16-g614pm-ts147w.jpg', name: 'ASUS ROG Zephyrus G14 OLED GA403' },
  ];

  console.log('Matching files for products...');
  for (const p of productMap) {
    if (p.exact) {
      await query('UPDATE products SET image_url = $1 WHERE product_id = $2', [p.exact, p.id]);
      console.log(` -> Updated Product #${p.id} with exact ${p.exact}`);
      continue;
    }
    const matched = files.filter(f => p.pattern.test(f));
    console.log(`Product #${p.id} (${p.name}):`, matched.slice(0, 3));
    if (matched.length > 0) {
      const chosen = `/images/products/${matched[0]}`;
      await query('UPDATE products SET image_url = $1 WHERE product_id = $2', [chosen, p.id]);
      console.log(` -> Updated Product #${p.id} with ${chosen}`);
    }
  }

  // Also check if any other product still has null image_url
  const remaining = await query('SELECT product_id, name FROM products WHERE image_url IS NULL OR image_url = \'\'');
  console.log('Remaining without image:', remaining.rows.length);

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
