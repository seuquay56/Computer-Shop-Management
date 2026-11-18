require('dotenv').config();
const pool = require('../src/config/db');

async function main() {
  const vars = await pool.query('SELECT variant_id, price FROM product_variants ORDER BY variant_id ASC LIMIT 20');
  const v = vars.rows;

  // Insert extra items into order 2 if it has <= 2 items
  const o2Count = await pool.query('SELECT COUNT(*) AS c FROM order_items WHERE order_id = 2');
  if (Number(o2Count.rows[0].c) < 5) {
    for (let i = 6; i <= 9; i++) {
      if (v[i]) {
        await pool.query(
          'INSERT INTO order_items (order_id, variant_id, quantity, unit_price) VALUES ($1, $2, $3, $4)',
          [2, v[i].variant_id, 1, v[i].price]
        );
      }
    }
    const sumRes2 = await pool.query('SELECT SUM(quantity * unit_price) AS total, COUNT(*) AS count FROM order_items WHERE order_id = 2');
    await pool.query('UPDATE orders SET total_amount = $1 WHERE order_id = 2', [sumRes2.rows[0].total]);
    console.log('Order 2 now has items count:', sumRes2.rows[0].count, 'total:', sumRes2.rows[0].total);
  }

  const allCounts = await pool.query('SELECT order_id, COUNT(*) FROM order_items GROUP BY order_id ORDER BY order_id');
  console.log('Final counts:', allCounts.rows);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
