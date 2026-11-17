-- Run in pgAdmin Query Tool while connected to computer_shop_db.
-- Use each result grid as evidence for report Section 7.1.

-- 1) Confirm the 10 required tables exist.
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2) Roles and user accounts.
SELECT u.user_id, u.username, u.full_name, u.email, r.role_name, u.is_active, u.created_at
FROM users u
JOIN roles r ON r.role_id = u.role_id
ORDER BY u.user_id;

-- 3) Products, categories and stock/price variants.
SELECT p.product_id, p.name AS product_name, p.brand, c.name AS category,
       pv.variant_id, pv.sku, pv.price, pv.stock_quantity
FROM products p
JOIN categories c ON c.category_id = p.category_id
LEFT JOIN product_variants pv ON pv.product_id = p.product_id
ORDER BY p.product_id, pv.variant_id;

-- 4) Orders with the tracked browser session required by Dashboard conversion.
SELECT o.order_id, u.username, o.session_id, o.total_amount, o.status,
       o.payment_method, o.created_at
FROM orders o
JOIN users u ON u.user_id = o.user_id
ORDER BY o.created_at DESC, o.order_id DESC;

-- 5) Order line details.
SELECT oi.item_id, oi.order_id, p.name AS product_name, pv.sku,
       oi.quantity, oi.unit_price, oi.quantity * oi.unit_price AS line_total
FROM order_items oi
JOIN product_variants pv ON pv.variant_id = oi.variant_id
JOIN products p ON p.product_id = pv.product_id
ORDER BY oi.order_id, oi.item_id;

-- 6) Dashboard KPI cross-check.
SELECT
    COALESCE(SUM(total_amount) FILTER (WHERE status IN ('Paid', 'Packing', 'Shipped', 'Completed')), 0) AS revenue,
    COUNT(*) AS total_orders,
    COUNT(*) FILTER (WHERE status = 'Pending') AS pending_orders,
    COUNT(DISTINCT session_id) FILTER (WHERE status <> 'Cancelled' AND session_id IS NOT NULL) AS converted_sessions
FROM orders;

SELECT COUNT(*) AS tracked_sessions FROM website_visits;

-- 7) Low-stock alert and inventory verification (Module 4 - Member 2).
SELECT pv.variant_id, p.name AS product_name, pv.sku, pv.price,
       pv.stock_quantity, COALESCE(pv.low_stock_threshold, 5) AS threshold,
       CASE
         WHEN pv.stock_quantity = 0 THEN 'CRITICAL (Out of Stock)'
         WHEN pv.stock_quantity <= COALESCE(pv.low_stock_threshold, 5) THEN 'WARNING (Low Stock)'
         ELSE 'HEALTHY (In Stock)'
       END AS stock_status
FROM product_variants pv
JOIN products p ON p.product_id = pv.product_id
ORDER BY pv.stock_quantity ASC;

-- 8) Technical Specifications breakdown per product (Module 2 - Member 2).
SELECT p.product_id, p.name AS product_name, p.brand, s.spec_name, ps.spec_value
FROM products p
JOIN product_specs ps ON ps.product_id = p.product_id
JOIN specs s ON s.spec_id = ps.spec_id
ORDER BY p.product_id, s.spec_name;

