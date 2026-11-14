# API endpoint quick reference

Base URL: `http://localhost:5000/api`

All successful responses use this shape:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Errors use `{ "success": false, "message": "..." }` with an appropriate HTTP status.

## Authentication

| Method | Endpoint | Access | Request body / notes |
|---|---|---|---|
| POST | `/auth/register` | Public | `{ "username": "customer01", "email": "customer01@example.com", "password": "Customer123!", "fullName": "Nguyen Van A", "phone": "0900000000" }` — creates Customer only; `email`, `fullName`, `phone` optional |
| POST | `/auth/login` | Public | `{ "identifier": "customer01", "password": "Customer123!" }` — identifier can be username or email |
| GET | `/auth/me` | Bearer token | Returns the current user profile |
| PATCH | `/auth/change-password` | Bearer token | `{ "currentPassword": "...", "newPassword": "..." }` |

The login/register response contains `data.token` and `data.user`. Send the token on protected requests as `Authorization: Bearer <token>`.

## Users (Admin only)

| Method | Endpoint | Request / purpose |
|---|---|---|
| GET | `/users?page=1&limit=20&search=&role=Customer&isActive=true` | List users with pagination and optional filters |
| GET | `/users/:userId` | Get one user |
| PATCH | `/users/:userId/role` | `{ "role": "Staff" }` — allowed: `Admin`, `Staff`, `Customer` |
| PATCH | `/users/:userId/status` | `{ "isActive": false }` — activate/deactivate account |

An Admin cannot change their own role or deactivate their own account. The last active Admin cannot be deactivated or demoted.

## Admin dashboard (Admin only)

`GET /admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`

Returns:

- `summary.totalRevenue`, `totalOrders`, `pendingOrders`, `completedOrders`.
- `conversion.trackedSessions`, `convertedSessions`, `conversionRatePercent`.
- `revenueByDay[]` with date, revenue and order count.
- `recentOrders[]` with customer, amount, status, payment method and date.

Revenue counts statuses `Paid`, `Packing`, `Shipped`, and `Completed`; it excludes `Pending` and `Cancelled`.

## Visit tracking (public)

`POST /visits`

```json
{ "sessionId": "a-unique-browser-session-uuid" }
```

The storefront must pass the same `sessionId` into the order-creation endpoint. The checkout member must persist it to `orders.session_id`; otherwise the Dashboard cannot attribute that order to a tracked visit.

## Local sample data

After `npm run db:admin`, run `npm run db:seed`. The repeatable seeder creates demo products, variants, a Customer, three orders and four tracked sessions. Demo customer: `demo_customer` / `DemoCustomer123!`.
