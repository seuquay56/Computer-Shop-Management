# Computer Shop Management Software — Member 1

Backend and basic Admin web interface for the Computer Shop Management Software project.

## Included features

- PostgreSQL schema with 10 shared tables.
- Customer registration, login, JWT authentication, password change and role-based access control (`Admin`, `Staff`, `Customer`).
- Admin Dashboard: revenue, order counts, daily revenue, recent orders and tracked-session conversion rate.
- Admin user management: search, pagination, role changes and account activation/deactivation.
- Basic web screens: Login/Register, Admin Dashboard and User Management. The UI is plain HTML/CSS/JavaScript and is served by Express; no separate frontend install is required.
- Idempotent demo-data seeder and a Postman collection.

## 1. Requirements

- Node.js 22 or newer (the project uses CommonJS and Express 5).
- PostgreSQL 14 or newer.
- pgAdmin 4 (or `psql`) and npm.

## 2. Create the PostgreSQL database

1. Open pgAdmin and connect to your local PostgreSQL server.
2. Right-click **Databases** → **Create** → **Database**.
3. Set the database name to `computer_shop_db`, then save.
4. Select `computer_shop_db`, open **Tools → Query Tool**, open `database/schema.sql`, and execute it.
5. Refresh **Schemas → public → Tables**. You should see these 10 tables:

   `roles`, `users`, `categories`, `products`, `product_variants`, `specs`, `product_specs`, `website_visits`, `orders`, `order_items`.

The schema file is safe to execute again: it creates missing tables/indexes and seeds the three standard roles. It does not create the database itself; create that once in pgAdmin first.

## 3. Configure and install the backend (Windows 11)

Open PowerShell in the project root (the folder containing `package.json`):

```powershell
Copy-Item .env.example .env
```

Open `.env` and change at least these values:

- `DB_PASSWORD`: the password of the local PostgreSQL user in pgAdmin (usually `postgres`).
- `JWT_SECRET`: use a private random string of at least 32 characters.
- `ADMIN_PASSWORD`: use a new password of at least 12 characters.

Then run:

```powershell
npm install
npm run db:check
npm run db:admin
npm run db:seed
npm run dev
```

Expected messages include a successful PostgreSQL connection, all 10 required tables found, an Admin account created (or already existing), demo data seeded, and the API listening on port 5000.

Open the web UI at **http://localhost:5000/**. Health check: **http://localhost:5000/health**. API base URL: **http://localhost:5000/api**.

If PowerShell blocks `npm`, run the commands in Git Bash or Windows Terminal with Command Prompt. Do not upload `.env` to GitHub.

## 4. First Admin login

The initial Admin username and password are read from `.env`:

- Username: value of `ADMIN_USERNAME` (example: `admin`).
- Password: value of `ADMIN_PASSWORD` (change the example password before use).

Use the Login tab in the web UI or send:

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json
```

```json
{
  "identifier": "admin",
  "password": "YOUR_ADMIN_PASSWORD_FROM_ENV"
}
```

For demo customer testing after `npm run db:seed`:

- Username: `demo_customer`
- Password: `DemoCustomer123!`

This is a local demo account only. Change or remove it before deploying anywhere public.

## 5. Web screens

- **Login/Register**: login with username/email, or register a new Customer account.
- **Admin Dashboard**: filter by date; view revenue, total/pending/completed orders, revenue-by-day chart, recent orders and conversion rate.
- **User Management**: search and filter users, change role and activate/deactivate accounts. An Admin cannot change their own role or deactivate their own account; the last active Admin cannot be removed.

The UI is served from `public/` by the API server. To use it, start `npm run dev` and visit `http://localhost:5000/`.

## 6. API endpoints

All API endpoints are prefixed with `/api`.

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register a Customer |
| POST | `/auth/login` | Public | Login with username or email |
| GET | `/auth/me` | Authenticated | Current user profile |
| PATCH | `/auth/change-password` | Authenticated | Change own password |
| GET | `/users` | Admin | List/search users with pagination |
| GET | `/users/:userId` | Admin | Get one user |
| PATCH | `/users/:userId/role` | Admin | Assign Admin / Staff / Customer |
| PATCH | `/users/:userId/status` | Admin | Activate/deactivate a user |
| GET | `/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD` | Admin | Dashboard metrics and recent orders |
| POST | `/visits` | Public | Track a unique storefront session |

See `docs/API_ENDPOINTS.md`. To test in Postman, choose **Import** and open `postman/Computer_Shop_API.postman_collection.json`; edit the collection variables `adminUsername` and `adminPassword`, run **Login as Admin** first, then run the Dashboard and User Management requests. The login request saves the returned JWT into `adminToken` automatically.

## 7. Dashboard conversion-rate integration contract

The conversion rate is based on tracked browser sessions, not the number of orders divided by users:

1. The storefront creates one stable `sessionId` per browser session (UUID is recommended).
2. When the visitor enters the storefront, it calls `POST /api/visits` with `{ "sessionId": "..." }`.
3. When checkout creates an order, it stores that exact same value in `orders.session_id`.
4. Do not generate a new session ID during checkout. The `session_id` must reference an existing row in `website_visits`.

Example visit request:

```http
POST /api/visits
Content-Type: application/json
```

```json
{ "sessionId": "a-unique-browser-session-uuid" }
```

Example order insert contract for the checkout member:

```sql
INSERT INTO orders (user_id, session_id, total_amount, status, payment_method)
VALUES ($1, $2, $3, 'Pending', 'COD');
```

The `$2` parameter must be the same session ID submitted to `/api/visits`. This is the integration point that Huy must preserve in the checkout API. Revenue includes `Paid`, `Packing`, `Shipped` and `Completed` orders; it excludes `Pending` and `Cancelled` orders. Conversion counts non-cancelled orders with a tracked session.

## 8. Demo data and report screenshots

Run `npm run db:seed` after creating the Admin account. The script is repeatable and adds/updates:

- A demo customer (`demo_customer`).
- Three sample products and variants, product specifications and two categories.
- Three sample orders (`Completed`, `Paid`, `Pending`) plus one tracked visit without an order.
- Matching `website_visits` and `orders.session_id` values so the Dashboard conversion metric is demonstrable.

Expected sample overview (assuming these demo rows are not manually changed): 4 tracked sessions, 3 converted sessions, 75% conversion. Paid + Completed demo revenue is VND 24,160,000; Pending is excluded from revenue.

For the report's **Section 7.1**, use your own pgAdmin screenshots after running the schema and seeder. See `docs/REPORT_SCREENSHOTS.md` and execute `database/verification.sql` to obtain the result grids. Capture (1) the `public` table list showing all 10 tables, (2) `users` and `roles`, (3) `products` joined with `product_variants`, and (4) `orders` showing `session_id`, status and total amount. Add the Dashboard screenshot as a separate application-result figure if the report permits it. Do not use mock screenshots as proof of a live database.

## 9. Team integration notes

- Do not rename the shared tables or columns in `database/schema.sql` without agreeing with the other members.
- Roles are exactly `Admin`, `Staff`, and `Customer`.
- User primary key is `user_id`; role foreign key is `role_id`.
- JWT contains `userId`, `username`, and `role`.
- Order statuses are `Pending`, `Paid`, `Packing`, `Shipped`, `Completed`, and `Cancelled`.
- Payment methods are `VietQR`, `ZaloPay`, and `COD`.
- Huy's checkout/order-creation code must save `sessionId` into `orders.session_id` for conversion tracking.
- Send `docs/API_ENDPOINTS.md` and the `session_id` integration contract to Thịnh and Huy before they connect their modules.

## 10. Security and limitations

- `.env` is local configuration and must never be committed.
- Public registration can create only `Customer`; an Admin assigns higher roles.
- The demo seeder is for local development/report demonstrations, not production data.
- The project cannot connect to your laptop's PostgreSQL instance from this development environment. Run the database commands locally and capture genuine pgAdmin screenshots there.
