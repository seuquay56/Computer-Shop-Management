# pgAdmin screenshots for report Section 7.1

Run these steps on your own computer after applying `database/schema.sql` and running `npm run db:seed`.

1. In pgAdmin, expand `Servers → PostgreSQL → Databases → computer_shop_db → Schemas → public → Tables`. Capture the Browser tree with the 10 table names visible.
2. Open Query Tool on `computer_shop_db`, open `database/verification.sql`, and execute it. Capture the result grid for roles/users, product variants, orders and order items. The `orders` result must visibly include `session_id`.
3. Capture the Dashboard at `http://localhost:5000/` after signing in as Admin. Use the same date range that contains the sample data.
4. In the Word report's Section 7.1, add each screenshot with a short caption describing what it proves. For example: “Figure 7.1. PostgreSQL database contains the 10 shared tables”; “Figure 7.2. Product variants and sample inventory”; “Figure 7.3. Sample orders retain the tracked session ID”; and “Figure 7.4. Admin Dashboard reads the sample data from PostgreSQL”.

Do not submit a screenshot of this SQL file as proof of database contents. The report evidence should be real result grids from your running pgAdmin session and the actual application.
