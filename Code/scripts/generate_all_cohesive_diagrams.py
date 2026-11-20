import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

DIAG_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs", "diagrams"))
os.makedirs(DIAG_DIR, exist_ok=True)

# Unified Academic Palette
THEME = {
    "font": "Arial",
    "primary": "#1e3a8a",       # Deep Navy
    "primary_dark": "#0f172a",  # Pitch Navy/Black
    "accent": "#2563eb",        # Royal Blue
    "bg_card": "#f8fafc",       # Slate 50
    "bg_card_alt": "#eff6ff",   # Blue 50
    "border": "#1e3a8a",        # Primary stroke
    "border_light": "#cbd5e1",  # Light stroke
    "text": "#000000",          # Strict Pitch Black
    "text_muted": "#334155",    # Slate 700
    "success": "#166534",       # Forest Green
    "warning": "#92400e",       # Dark Amber
    "alt_bg": "#f0f9ff"         # Light blue tint for alt blocks
}

def draw_arch_model():
    """Generates Figure 4.1: Architecture Data Flow Model with Grid=Off and 2-way feedback arrows."""
    fig, ax = plt.subplots(figsize=(13.5, 8.5), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#ffffff")

    # Title
    ax.text(0.5, 0.96, "Figure 4.1: 4-Tier Layered & MVC Software Architecture Data Flow Model",
            ha="center", va="center", fontsize=12.5, fontweight="bold", color=THEME["text"], family=THEME["font"])
    ax.text(0.5, 0.93, "Strict separation of concerns with bidirectional client-to-database communication channels",
            ha="center", va="center", fontsize=9.5, style="italic", color=THEME["text_muted"], family=THEME["font"])

    tiers = [
        ("Tier 1: Client Tier (Presentation Layer)", 0.81, "#eff6ff", [
            ("Customer Storefront SPA", "HTML5, CSS3, ES6 JavaScript\nReactive DOM, Responsive Layout", 0.28),
            ("Administrative Management Portal", "HTML5, CSS3, Vanilla JS SPA\nJWT Header Injection, Admin Panels", 0.72)
        ]),
        ("Tier 2: Routing & Security Tier (API Gateway & Middleware)", 0.58, "#f8fafc", [
            ("Express Router & Security Pipeline", "Helmet CSP Headers, CORS Policy\nexpress.json() Payload Parser", 0.25),
            ("JWT Stateless Session Guard", "HMAC-SHA256 Token Extraction\nExpiration & Tampering Verification", 0.50),
            ("RBAC Role Authorization Guard", "Role Hierarchy (Admin > Staff > Customer)\nDeterministic 403 Forbidden Gate", 0.75)
        ]),
        ("Tier 3: Business Services Tier (Domain & Application Logic)", 0.35, "#eff6ff", [
            ("Product & Specs Service", "Multi-Criteria Spec Filtering\nVariant Stock Aggregation", 0.20),
            ("Order & Cart Service", "Cart Stock Validation\nPC Component Compatibility Engine", 0.45),
            ("Payment & SePay Service", "Dynamic VietQR Generation\nWebhook Idempotency & Verification", 0.70),
            ("Inventory & Restock Service", "Batch SKU Restock Management\nAutomated Low-Stock Alert Engine", 0.90)
        ]),
        ("Tier 4: Persistence Tier (ACID Relational Storage)", 0.12, "#f8fafc", [
            ("PostgreSQL 16 Connection Pool", "pg-pool Adapter, SSL Option\nMax 20 Reusable Client Connections", 0.30),
            ("11 Relational Tables & Composite Indexes", "products, variants, specs, product_specs, orders, items,\nusers, roles, inventory_transactions, website_visits", 0.70)
        ])
    ]

    for title, y_center, bg_color, boxes in tiers:
        # Tier container
        box_tier = FancyBboxPatch((0.04, y_center - 0.08), 0.92, 0.16,
                                  boxstyle="round,pad=0.015",
                                  facecolor=bg_color, edgecolor=THEME["primary"],
                                  linewidth=1.3, zorder=1)
        ax.add_patch(box_tier)
        # Tier title badge
        ax.text(0.06, y_center + 0.062, title, fontsize=9.5, fontweight="bold",
                color=THEME["primary"], family=THEME["font"], zorder=2)

        # Inner components
        for c_title, c_desc, x_pos in boxes:
            w_comp = 0.22 if len(boxes) == 4 else (0.24 if len(boxes) == 3 else 0.38)
            x_left = x_pos - w_comp / 2
            comp_box = FancyBboxPatch((x_left, y_center - 0.065), w_comp, 0.11,
                                      boxstyle="round,pad=0.01",
                                      facecolor="#ffffff", edgecolor=THEME["primary"],
                                      linewidth=1.0, zorder=3)
            ax.add_patch(comp_box)
            ax.text(x_pos, y_center + 0.018, c_title, ha="center", va="center",
                    fontsize=8.5, fontweight="bold", color=THEME["text"], family=THEME["font"], zorder=4)
            ax.text(x_pos, y_center - 0.024, c_desc, ha="center", va="center",
                    fontsize=7.2, color=THEME["text_muted"], family=THEME["font"], zorder=4)

    # 2-Way Feedback Arrows between Tiers
    # Tier 1 <-> Tier 2
    for x_arr in [0.28, 0.72]:
        # Request Arrow (Down)
        ax.annotate("", xy=(x_arr - 0.02, 0.665), xytext=(x_arr - 0.02, 0.725),
                    arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.5, ls="-"))
        # Response Arrow (Up)
        ax.annotate("", xy=(x_arr + 0.02, 0.725), xytext=(x_arr + 0.02, 0.665),
                    arrowprops=dict(arrowstyle="->", color=THEME["accent"], lw=1.5, ls="--"))
        ax.text(x_arr - 0.035, 0.695, "Req", fontsize=7.0, ha="right", va="center", color=THEME["primary"], fontweight="bold")
        ax.text(x_arr + 0.035, 0.695, "Res", fontsize=7.0, ha="left", va="center", color=THEME["accent"], fontweight="bold")

    # Tier 2 <-> Tier 3
    for x_arr in [0.35, 0.65]:
        ax.annotate("", xy=(x_arr - 0.02, 0.435), xytext=(x_arr - 0.02, 0.495),
                    arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.5, ls="-"))
        ax.annotate("", xy=(x_arr + 0.02, 0.495), xytext=(x_arr + 0.02, 0.435),
                    arrowprops=dict(arrowstyle="->", color=THEME["accent"], lw=1.5, ls="--"))
        ax.text(x_arr - 0.035, 0.465, "Dispatch", fontsize=7.0, ha="right", va="center", color=THEME["primary"], fontweight="bold")
        ax.text(x_arr + 0.035, 0.465, "Return", fontsize=7.0, ha="left", va="center", color=THEME["accent"], fontweight="bold")

    # Tier 3 <-> Tier 4
    for x_arr in [0.35, 0.65]:
        ax.annotate("", xy=(x_arr - 0.02, 0.205), xytext=(x_arr - 0.02, 0.265),
                    arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.5, ls="-"))
        ax.annotate("", xy=(x_arr + 0.02, 0.265), xytext=(x_arr + 0.02, 0.205),
                    arrowprops=dict(arrowstyle="->", color=THEME["accent"], lw=1.5, ls="--"))
        ax.text(x_arr - 0.035, 0.235, "SQL Exec", fontsize=7.0, ha="right", va="center", color=THEME["primary"], fontweight="bold")
        ax.text(x_arr + 0.035, 0.235, "Records", fontsize=7.0, ha="left", va="center", color=THEME["accent"], fontweight="bold")

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")
    plt.tight_layout()
    out = os.path.join(DIAG_DIR, "arch_data_flow_model.png")
    plt.savefig(out, dpi=300, facecolor="#ffffff", edgecolor="none")
    plt.close()
    print("Generated:", out)

def draw_optimized_usecase():
    """Generates Figure 3.1: Overall System Use Case Diagram with optimized actor placement (T-04)."""
    fig, ax = plt.subplots(figsize=(14.5, 9.8), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#ffffff")

    # Boundary Box
    sys_box = FancyBboxPatch((0.20, 0.04), 0.58, 0.89,
                             boxstyle="round,pad=0.015",
                             facecolor="#fafafa", edgecolor=THEME["primary"],
                             linewidth=1.4, linestyle="--", zorder=1)
    ax.add_patch(sys_box)
    ax.text(0.49, 0.905, "Computer Shop Management Software — System Boundary",
            ha="center", va="center", fontsize=11.5, fontweight="bold", color=THEME["primary"], family=THEME["font"], zorder=2)

    # Actor boxes helper
    def draw_actor(x, y, label, role="Actor"):
        b = FancyBboxPatch((x - 0.075, y - 0.04), 0.15, 0.08,
                           boxstyle="round,pad=0.01",
                           facecolor="#e0e7ff", edgecolor=THEME["primary"],
                           linewidth=1.3, zorder=5)
        ax.add_patch(b)
        ax.text(x, y + 0.015, f"<<actor>>", ha="center", va="center", fontsize=7.5, style="italic", color=THEME["primary"], family=THEME["font"], zorder=6)
        ax.text(x, y - 0.015, label, ha="center", va="center", fontsize=8.2, fontweight="bold", color=THEME["text"], family=THEME["font"], zorder=6)

    # Use Case ellipse helper
    def draw_uc(x, y, ucid, title):
        b = FancyBboxPatch((x - 0.11, y - 0.03), 0.22, 0.06,
                           boxstyle="round,pad=0.012",
                           facecolor="#ffffff", edgecolor=THEME["accent"],
                           linewidth=1.1, zorder=3)
        ax.add_patch(b)
        ax.text(x, y + 0.01, ucid, ha="center", va="center", fontsize=7.5, fontweight="bold", color=THEME["accent"], family=THEME["font"], zorder=4)
        ax.text(x, y - 0.012, title, ha="center", va="center", fontsize=7.0, color=THEME["text"], family=THEME["font"], zorder=4)

    # 4 Modules Subgraphs
    # Module 1
    m1_box = FancyBboxPatch((0.22, 0.69), 0.54, 0.19, boxstyle="round,pad=0.01", facecolor="#ffffff", edgecolor=THEME["border_light"], linewidth=1.0, zorder=2)
    ax.add_patch(m1_box)
    ax.text(0.24, 0.86, "Module 1: Authentication & User Administration", fontsize=8.8, fontweight="bold", color=THEME["primary"])
    draw_uc(0.35, 0.79, "UC-01", "Authenticate User (JWT Login)")
    draw_uc(0.63, 0.79, "UC-02", "Register Customer Account")
    draw_uc(0.35, 0.72, "UC-03", "Manage System Users & RBAC")
    draw_uc(0.63, 0.72, "UC-04", "View Sales & Revenue Dashboard")

    # Module 2
    m2_box = FancyBboxPatch((0.22, 0.47), 0.54, 0.19, boxstyle="round,pad=0.01", facecolor="#ffffff", edgecolor=THEME["border_light"], linewidth=1.0, zorder=2)
    ax.add_patch(m2_box)
    ax.text(0.24, 0.64, "Module 2: Hardware Products & Technical Specifications", fontsize=8.8, fontweight="bold", color=THEME["primary"])
    draw_uc(0.35, 0.57, "UC-05", "Manage Hardware Categories")
    draw_uc(0.63, 0.57, "UC-06", "Manage Computer Hardware Products")
    draw_uc(0.35, 0.50, "UC-07", "Configure Specs & SKU Variants")
    draw_uc(0.63, 0.50, "UC-08", "Filter & Search Hardware by Specs")

    # Module 3
    m3_box = FancyBboxPatch((0.22, 0.25), 0.54, 0.19, boxstyle="round,pad=0.01", facecolor="#ffffff", edgecolor=THEME["border_light"], linewidth=1.0, zorder=2)
    ax.add_patch(m3_box)
    ax.text(0.24, 0.42, "Module 3: Shopping Cart, Checkout & Cashless Payment", fontsize=8.8, fontweight="bold", color=THEME["primary"])
    draw_uc(0.35, 0.35, "UC-09 & 10", "Manage Cart & Stock Validation")
    draw_uc(0.63, 0.35, "UC-11", "Cashless Checkout (VietQR / ZaloPay)")
    draw_uc(0.49, 0.28, "UC-12 & 13", "Process Order Fulfillment & Deduct Stock")

    # Module 4
    m4_box = FancyBboxPatch((0.22, 0.06), 0.54, 0.16, boxstyle="round,pad=0.01", facecolor="#ffffff", edgecolor=THEME["border_light"], linewidth=1.0, zorder=2)
    ax.add_patch(m4_box)
    ax.text(0.24, 0.20, "Module 4: Warehouse Inventory & Stock Control", fontsize=8.8, fontweight="bold", color=THEME["primary"])
    draw_uc(0.35, 0.12, "UC-14", "Batch Inward Stock Receipt (Restock)")
    draw_uc(0.63, 0.12, "UC-15", "Monitor Low-Stock Alerts & Thresholds")

    # Actors: Placed strategically (T-04)
    # Left side: Guest, Customer
    draw_actor(0.09, 0.79, "Guest / Visitor")
    draw_actor(0.09, 0.45, "Customer")

    # Right side:
    # Payment Gateway: adjacent to Module 3! (x=0.89, y=0.35)
    draw_actor(0.89, 0.35, "Payment Gateway\n(VietQR / ZaloPay)")
    # Inventory Staff: adjacent to Module 2 & 4! (x=0.89, y=0.57)
    draw_actor(0.89, 0.57, "Inventory / Sales\nStaff")
    # Admin: top right (x=0.89, y=0.79)
    draw_actor(0.89, 0.79, "Store Manager\n(Admin)")

    # Connectors
    def connect(x1, y1, x2, y2, color=THEME["primary"], style="-"):
        ax.plot([x1, x2], [y1, y2], color=color, linestyle=style, linewidth=1.1, zorder=2)

    # Guest connects
    connect(0.165, 0.79, 0.24, 0.79) # UC-01
    connect(0.165, 0.79, 0.52, 0.79) # UC-02
    connect(0.165, 0.76, 0.24, 0.50) # UC-08

    # Customer connects
    connect(0.165, 0.45, 0.24, 0.35) # UC-09 & 10
    connect(0.165, 0.43, 0.52, 0.35) # UC-11
    connect(0.165, 0.47, 0.24, 0.50) # UC-08

    # Payment Gateway connects DIRECTLY to Module 3 (Zero crossing lines!)
    connect(0.815, 0.35, 0.74, 0.35) # UC-11
    connect(0.815, 0.33, 0.60, 0.28) # UC-12 & 13

    # Inventory Staff connects to Module 2 and Module 4 (Zero crossing lines!)
    connect(0.815, 0.57, 0.74, 0.57) # UC-06
    connect(0.815, 0.55, 0.46, 0.50) # UC-07
    connect(0.815, 0.54, 0.24, 0.57) # UC-05
    connect(0.815, 0.52, 0.46, 0.12) # UC-14
    connect(0.815, 0.51, 0.74, 0.12) # UC-15

    # Admin connects to Module 1 and general staff
    connect(0.815, 0.79, 0.46, 0.72) # UC-03
    connect(0.815, 0.77, 0.74, 0.72) # UC-04
    ax.annotate("", xy=(0.89, 0.61), xytext=(0.89, 0.75),
                arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.2, ls="--"))
    ax.text(0.90, 0.68, "<<inherits>>", fontsize=6.8, color=THEME["text_muted"], style="italic")

    # Customer inherits Guest
    ax.annotate("", xy=(0.09, 0.75), xytext=(0.09, 0.49),
                arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.2, ls="--"))
    ax.text(0.10, 0.62, "<<inherits>>", fontsize=6.8, color=THEME["text_muted"], style="italic")

    ax.set_xlim(0, 1)
    ax.set_ylim(0, 0.98)
    ax.axis("off")
    plt.tight_layout()
    out = os.path.join(DIAG_DIR, "usecase_overall.png")
    plt.savefig(out, dpi=300, facecolor="#ffffff", edgecolor="none")
    plt.close()
    print("Generated:", out)

def draw_module2_sequence():
    """Generates Figure 5.4: Module 2 Sequence Diagram (Product, Specs & SKU Variants Management)."""
    fig, ax = plt.subplots(figsize=(14.0, 9.2), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#ffffff")

    ax.text(0.5, 0.96, "Figure 5.4: UML Sequence Diagram — Product, Specifications & SKU Variants Management (UC-05..UC-07)",
            ha="center", va="center", fontsize=11.5, fontweight="bold", color=THEME["text"], family=THEME["font"])

    cols = ["Staff / Admin\n(Portal Client)", "ProductController\n(REST API Router)", "ProductService\n(Domain Facade)", "PostgreSQL\n(ACID Persistence)"]
    xs = [0.15, 0.38, 0.62, 0.85]

    for x, label in zip(xs, cols):
        b = FancyBboxPatch((x - 0.10, 0.86), 0.20, 0.065, boxstyle="round,pad=0.01", facecolor="#e0e7ff", edgecolor=THEME["primary"], lw=1.2)
        ax.add_patch(b)
        ax.text(x, 0.892, label, ha="center", va="center", fontsize=8.0, fontweight="bold", color=THEME["text"], family=THEME["font"])
        ax.plot([x, x], [0.86, 0.06], color=THEME["border_light"], linestyle="--", lw=1.1, zorder=1)

    steps = [
        (1, 0, 1, "1: POST /api/admin/products { name, brand, categoryId, specs, variants } [Bearer JWT]", "call"),
        (2, 1, 1, "2: authenticate() & authorize('Admin', 'Staff') -> Verify JWT clearance", "self"),
        (3, 1, 2, "3: createProductWithSpecs(payload)", "call"),
        (4, 2, 3, "4: BEGIN Transaction", "call"),
        (5, 2, 3, "5: INSERT INTO products (name, brand, category_id, description, image_url) RETURNING product_id", "call"),
        (6, 3, 2, "6: <<return>> product_id: 108", "return"),
        (7, 2, 3, "7: Batch INSERT INTO product_variants (product_id, sku, price, stock, threshold)", "call"),
        (8, 2, 3, "8: Batch INSERT INTO product_specs (product_id, spec_id, spec_value)", "call"),
        (9, 2, 3, "9: COMMIT Transaction", "call"),
        (10, 2, 1, "10: <<return>> { success: true, productId: 108, skuCount: 3 }", "return"),
        (11, 1, 0, "11: <<return>> HTTP 201 Created { success: true, data: { ... } }", "return"),
        (12, 0, 0, "12: Re-render Admin Hardware Catalog table & show success toast notification", "self")
    ]

    y = 0.82
    y_step = 0.06
    for idx, f_col, t_col, msg, kind in steps:
        if kind == "self":
            x = xs[f_col]
            ax.annotate("", xy=(x + 0.03, y - 0.02), xytext=(x, y),
                        arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.2))
            ax.plot([x, x + 0.03, x + 0.03], [y, y, y - 0.02], color=THEME["primary"], lw=1.2)
            ax.text(x + 0.04, y - 0.01, msg, fontsize=7.5, color=THEME["text"], family=THEME["font"])
        elif kind == "call":
            x1, x2 = xs[f_col], xs[t_col]
            ax.annotate("", xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.2))
            ax.text((x1 + x2)/2, y + 0.012, msg, ha="center", va="bottom", fontsize=7.4, color=THEME["text"], family=THEME["font"])
        elif kind == "return":
            x1, x2 = xs[f_col], xs[t_col]
            ax.annotate("", xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=THEME["accent"], lw=1.2, ls="--"))
            ax.text((x1 + x2)/2, y + 0.012, msg, ha="center", va="bottom", fontsize=7.4, color=THEME["text_muted"], style="italic", family=THEME["font"])
        y -= y_step

    ax.set_xlim(0, 1)
    ax.set_ylim(0.04, 0.98)
    ax.axis("off")
    plt.tight_layout()
    out = os.path.join(DIAG_DIR, "seq_catalog_cart.png")
    plt.savefig(out, dpi=300, facecolor="#ffffff", edgecolor="none")
    plt.close()
    print("Generated:", out)

def draw_module4_sequence():
    """Generates Figure 5.5: Module 4 Sequence Diagram (Batch Restock & Low-Stock Alerts)."""
    fig, ax = plt.subplots(figsize=(14.0, 9.2), dpi=300)
    fig.patch.set_facecolor("#ffffff")
    ax.set_facecolor("#ffffff")

    ax.text(0.5, 0.96, "Figure 5.5: UML Sequence Diagram — Batch Inward Restock & Low-Stock Alerts (UC-14..UC-15)",
            ha="center", va="center", fontsize=11.5, fontweight="bold", color=THEME["text"], family=THEME["font"])

    cols = ["Inventory Staff\n(Portal Client)", "InventoryController\n(REST API Router)", "InventoryService\n(Domain Facade)", "PostgreSQL\n(ACID Persistence)"]
    xs = [0.15, 0.38, 0.62, 0.85]

    for x, label in zip(xs, cols):
        b = FancyBboxPatch((x - 0.10, 0.86), 0.20, 0.065, boxstyle="round,pad=0.01", facecolor="#e0e7ff", edgecolor=THEME["primary"], lw=1.2)
        ax.add_patch(b)
        ax.text(x, 0.892, label, ha="center", va="center", fontsize=8.0, fontweight="bold", color=THEME["text"], family=THEME["font"])
        ax.plot([x, x], [0.86, 0.06], color=THEME["border_light"], linestyle="--", lw=1.1, zorder=1)

    steps = [
        (1, 0, 1, "1: POST /api/admin/inventory/restock { items: [{ variantId, changeQty, notes }] }", "call"),
        (2, 1, 1, "2: authenticate() & authorize('Admin', 'Staff') -> Verify authorization", "self"),
        (3, 1, 2, "3: processBatchRestock(items, staffUserId)", "call"),
        (4, 2, 3, "4: BEGIN Transaction", "call"),
        (5, 2, 3, "5: SELECT stock_quantity, low_stock_threshold FROM product_variants WHERE variant_id = $1 FOR UPDATE", "call"),
        (6, 2, 3, "6: UPDATE product_variants SET stock_quantity = stock_quantity + $1 WHERE variant_id = $2", "call"),
        (7, 2, 3, "7: INSERT INTO inventory_transactions (variant_id, change_quantity, transaction_type, notes, created_by)", "call"),
        (8, 2, 2, "8: checkLowStockAlerts() -> Evaluate if updated stock > threshold", "self"),
        (9, 2, 3, "9: COMMIT Transaction", "call"),
        (10, 2, 1, "10: <<return>> { success: true, updatedSKUs: 4, alertCleared: true }", "return"),
        (11, 1, 0, "11: <<return>> HTTP 200 OK { success: true, message: 'Stock updated' }", "return"),
        (12, 0, 0, "12: Refresh inventory dashboard, clear restock modal & broadcast updated counts", "self")
    ]

    y = 0.82
    y_step = 0.06
    for idx, f_col, t_col, msg, kind in steps:
        if kind == "self":
            x = xs[f_col]
            ax.annotate("", xy=(x + 0.03, y - 0.02), xytext=(x, y),
                        arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.2))
            ax.plot([x, x + 0.03, x + 0.03], [y, y, y - 0.02], color=THEME["primary"], lw=1.2)
            ax.text(x + 0.04, y - 0.01, msg, fontsize=7.5, color=THEME["text"], family=THEME["font"])
        elif kind == "call":
            x1, x2 = xs[f_col], xs[t_col]
            ax.annotate("", xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=THEME["primary"], lw=1.2))
            ax.text((x1 + x2)/2, y + 0.012, msg, ha="center", va="bottom", fontsize=7.4, color=THEME["text"], family=THEME["font"])
        elif kind == "return":
            x1, x2 = xs[f_col], xs[t_col]
            ax.annotate("", xy=(x2, y), xytext=(x1, y),
                        arrowprops=dict(arrowstyle="->", color=THEME["accent"], lw=1.2, ls="--"))
            ax.text((x1 + x2)/2, y + 0.012, msg, ha="center", va="bottom", fontsize=7.4, color=THEME["text_muted"], style="italic", family=THEME["font"])
        y -= y_step

    ax.set_xlim(0, 1)
    ax.set_ylim(0.04, 0.98)
    ax.axis("off")
    plt.tight_layout()
    out = os.path.join(DIAG_DIR, "seq_inventory_restock.png")
    plt.savefig(out, dpi=300, facecolor="#ffffff", edgecolor="none")
    plt.close()
    print("Generated:", out)

if __name__ == "__main__":
    draw_arch_model()
    draw_optimized_usecase()
    draw_module2_sequence()
    draw_module4_sequence()
