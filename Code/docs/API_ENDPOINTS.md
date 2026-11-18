# API Endpoint Documentation - Computer Shop Management

Base URL: `http://localhost:5000/api`

All API responses follow the standard JSON format:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Errors return `{ "success": false, "message": "..." }` with appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500`).

---

## 1. Authentication & Session (Module 1 - Member 1)

| Method | Endpoint | Access | Description / Payload |
|---|---|---|---|
| POST | `/auth/register` | Public | Register customer: `{ "username": "...", "password": "...", "fullName": "...", "email": "...", "phone": "..." }` |
| POST | `/auth/login` | Public | Login with username or email: `{ "identifier": "...", "password": "..." }` |
| GET | `/auth/me` | Bearer Token | Get current user session and role |
| PATCH | `/auth/change-password` | Bearer Token | Change password: `{ "currentPassword": "...", "newPassword": "..." }` |

---

## 2. User Management & RBAC (Module 1 - Member 1)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/users?page=1&limit=20&search=&role=&isActive=` | Admin | List users with pagination and search |
| GET | `/users/:userId` | Admin | Get user details by ID |
| PATCH | `/users/:userId/role` | Admin | Assign role: `{ "role": "Staff" }` (Admin / Staff / Customer) |
| PATCH | `/users/:userId/status` | Admin | Lock/unlock account: `{ "isActive": false }` |

---

## 3. Categories Management (Module 2 - Member 2)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/categories` | Public | List all categories with product count |
| GET | `/categories/:categoryId` | Public | Get single category details |
| POST | `/categories` | Admin, Staff | Create category: `{ "name": "CPU", "description": "Bộ vi xử lý trung tâm" }` |
| PUT | `/categories/:categoryId` | Admin, Staff | Update category: `{ "name": "...", "description": "..." }` |
| DELETE | `/categories/:categoryId` | Admin, Staff | Delete category (fails if active products exist) |

---

## 4. Hardware Products, Variants & Specs Management (Module 2 - Member 2)

| Method | Endpoint | Access | Description / Query & Payload |
|---|---|---|---|
| GET | `/products` | Public | **Multi-Criteria Hardware Filter & Search** (details below) |
| GET | `/products/filter-options/all` | Public | Get all available brands, categories, price range, and dynamic spec attributes with distinct values for storefront sidebar |
| GET | `/products/:productId` | Public | Full product details with all technical specifications and SKU variants |
| POST | `/products` | Admin, Staff | Create hardware product with specs and variants atomically (payload below) |
| PUT | `/products/:productId` | Admin, Staff | Update product general information and specs |
| DELETE | `/products/:productId` | Admin, Staff | Delete product (cascades variants and specs; fails if referenced in orders) |
| POST | `/products/:productId/variants` | Admin, Staff | Add SKU variant to product: `{ "sku": "...", "price": 15000000, "stockQuantity": 10, "lowStockThreshold": 5 }` |
| PATCH | `/products/variants/:variantId` | Admin, Staff | Update variant: `{ "price": 14500000, "sku": "...", "stockQuantity": 8, "lowStockThreshold": 5 }` |
| DELETE | `/products/variants/:variantId` | Admin, Staff | Delete variant (fails if in order history) |

### Multi-Criteria Filtering Query Parameters (`GET /api/products`):
- `search`: Keyword matching product name, brand, description, or SKU.
- `categoryId`: Filter by category ID.
- `category`: Filter by category name (e.g. `category=CPU`).
- `brand`: Filter by brand (e.g. `brand=Intel`, `brand=ASUS`).
- `minPrice`, `maxPrice`: Filter products having variants within price range.
- `inStock`: `true` (only products with total stock > 0) or `false`.
- `sortBy`: `newest` (default), `price_asc`, `price_desc`, `name_asc`, `name_desc`.
- `specs[<SpecName>]` or `spec_<SpecName>`: Filter by technical specs:
  * `spec_Socket=LGA1700`
  * `spec_Socket=AM5`
  * `spec_VRAM=16GB`
  * `spec_RAM Type=DDR5`
  * `spec_Bus Speed=6000 MHz`
  * `spec_Wattage=850W`
- `page`, `limit`: Pagination parameters.

### Create Product Example Payload (`POST /api/products`):
```json
{
  "name": "Intel Core i9-14900K",
  "brand": "Intel",
  "categoryId": 1,
  "description": "Bộ vi xử lý Raptor Lake Refresh 24 nhân 32 luồng.",
  "variants": [
    {
      "sku": "CPU-INTEL-14900K-BOX",
      "price": 15490000,
      "stockQuantity": 8,
      "lowStockThreshold": 5
    },
    {
      "sku": "CPU-INTEL-14900K-TRAY",
      "price": 14200000,
      "stockQuantity": 2,
      "lowStockThreshold": 5
    }
  ],
  "specs": [
    { "specName": "Socket", "specValue": "LGA1700" },
    { "specName": "Cores", "specValue": "24 Cores (8P + 16E)" },
    { "specName": "TDP", "specValue": "125W" },
    { "specName": "Max Boost Clock", "specValue": "6.0 GHz" }
  ]
}
```

---

## 5. Technical Specifications Attribute Management (Module 2 - Member 2)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/specs` | Public | List all technical specification attributes with product usage count |
| GET | `/specs/options` | Public | List distinct spec names and their unique recorded values |
| POST | `/specs` | Admin, Staff | Register new specification attribute: `{ "specName": "VRAM" }` |

---

## 6. Inventory & Low-Stock Alerts (Module 4 - Member 2)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/inventory` | Admin, Staff | Inventory stock table with search, category filter, and status filter (`all`, `low_stock`, `out_of_stock`, `in_stock`), plus overall inventory valuation summary |
| GET | `/inventory/low-stock` | Admin, Staff | **Low-Stock Alert Feed**: returns all items with `stock_quantity <= low_stock_threshold`, deficit quantity, alert level (`CRITICAL` vs `WARNING`), and recommended reorder quantity |
| POST | `/inventory/restock-batch` | Admin, Staff | **Batch Restock (Nhập kho theo lô)**: Atomic batch import of multiple SKUs, increments stock, records import transaction log |
| PATCH | `/inventory/variants/:variantId/adjust` | Admin, Staff | Adjust stock quantity or threshold manually with audit reason |
| GET | `/inventory/transactions` | Admin, Staff | Audit log of all stock movements (Imports, Sales, Adjustments) |

### Batch Restock Example Payload (`POST /api/inventory/restock-batch`):
```json
{
  "batchCode": "BATCH-202611-001",
  "notes": "Lô hàng linh kiện nhập từ Synnex FPT",
  "items": [
    { "sku": "CPU-INTEL-14900K-BOX", "quantity": 10 },
    { "sku": "GPU-ASUS-4070TIS-16G", "quantity": 5 },
    { "variantId": 7, "quantity": 20 }
  ]
}
```

### Stock Adjustment Example Payload (`PATCH /api/inventory/variants/:variantId/adjust`):
```json
{
  "newQuantity": 15,
  "lowStockThreshold": 5,
  "reason": "Kiểm kê định kỳ thực tế"
}
```

---

## 7. Admin Dashboard & Storefront Tracking (Module 1 - Member 1)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD` | Admin | Revenue KPIs, recent orders, daily revenue, conversion rate |
| POST | `/visits` | Public | Storefront visit tracking: `{ "sessionId": "<uuid>" }` |

---

## 8. Storefront Cart, SePay VietQR Checkout & Order Tracking (Module 3 & 4 - Member 3)

| Method | Endpoint | Access | Description / Payload |
|---|---|---|---|
| POST | `/orders/cart/validate` | Public | Real-time stock check, live subtotal/total calculation, and PC hardware compatibility check (CPU Socket, RAM Type, PSU Wattage): `{ "items": [{ "variantId": 1, "quantity": 1 }] }` |
| POST | `/orders/checkout` | Authenticated | Create order preserving `orders.session_id` (`website_visits` contract). Returns dynamic SePay VietQR URL (`qr.sepay.vn`) for `VietQR`, gateway ref for `ZaloPay`, or immediately transitions `COD` to `Packing` with atomic stock deduction |
| GET | `/orders/my?page=1&limit=20&status=` | Authenticated | List authenticated customer's order tracking history |
| GET | `/orders/:orderId` | Owner / Staff / Admin | Full order details, line items, status timeline, and SePay VietQR details |
| GET | `/orders/:orderId/payment-status` | Owner / Staff / Admin | Lightweight payment polling endpoint (supports automatic SePay User API v2 reconciliation when `SEPAY_API_TOKEN` is set) |
| POST | `/orders/:orderId/cancel` | Owner | Cancel customer's own `Pending` order |
| POST | `/payment/sepay-webhook` | SePay (`Authorization: Apikey <key>`) | Incoming SePay bank transfer webhook: verifies API key (constant-time), matches `CSORDER<id>` & exact amount, atomically updates `Pending → Paid` and deducts inventory (`FOR UPDATE`) |
| POST | `/payment/callback` | SePay Apikey / HMAC-SHA256 | Unified payment callback endpoint supporting both SePay `Apikey` and ZaloPay/VietQR `X-Payment-Signature` HMAC-SHA256 verification |
| POST | `/payment/simulate/:orderId` | Authenticated (`PAYMENT_DEMO_MODE=true`) | Executes the real SePay webhook or ZaloPay HMAC callback pipeline locally for demonstration and QA testing |
| GET | `/admin/orders?status=&paymentMethod=&search=` | Admin, Staff | List all orders across the shop for fulfillment management |
| PATCH | `/admin/orders/:orderId/status` | Admin, Staff | Advance order lifecycle (`Pending → Paid → Packing → Shipped → Completed / Cancelled`) with automatic stock deduction or cancellation stock restoration |

### Checkout Example Payload (`POST /api/orders/checkout`):
```json
{
  "items": [
    { "variantId": 1, "quantity": 1 },
    { "variantId": 7, "quantity": 2 }
  ],
  "paymentMethod": "VietQR",
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "customerName": "Nguyen Nhat Huy",
  "customerPhone": "0901234567",
  "shippingAddress": "19 Nguyen Huu Tho, Q.7, TP.HCM",
  "notes": "Lap rap san va test nhiet do"
}
```

### SePay Webhook Example Payload (`POST /api/payment/sepay-webhook`):
```http
POST http://localhost:5000/api/payment/sepay-webhook
Authorization: Apikey YOUR_SEPAY_WEBHOOK_API_KEY
Content-Type: application/json
```
```json
{
  "id": 92704,
  "gateway": "MBBank",
  "transactionDate": "2026-11-18 17:15:00",
  "accountNumber": "0123456789",
  "code": "CSORDER15",
  "content": "CSORDER15 Thanh toan don hang Computer Shop",
  "transferType": "in",
  "transferAmount": 15490000,
  "referenceCode": "MBVCB.3278907687"
}
```
