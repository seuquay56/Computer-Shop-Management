import subprocess
import os

diagrams_dir = r"C:\Users\PC\.gemini\antigravity\scratch\Computer-Shop-Management\Code\docs\diagrams"
os.makedirs(diagrams_dir, exist_ok=True)

# -------------------------------------------------------------
# 1. Figure 3.1: Overall System Use Case Diagram
# -------------------------------------------------------------
dot_overall = """
digraph G {
    rankdir=LR;
    dpi=300;
    nodesep=0.45;
    ranksep=0.85;
    compound=true;
    fontname="Arial";
    node [fontname="Arial"];
    edge [fontname="Arial"];

    // Actors
    node [shape=box, style="filled,rounded", fillcolor="#e0e7ff", color="#3730a3", penwidth=1.5, fontsize=11];
    guest [label="<<actor>>\\nGuest / Visitor"];
    customer [label="<<actor>>\\nCustomer"];
    staff [label="<<actor>>\\nInventory / Sales Staff"];
    admin [label="<<actor>>\\nStore Manager (Admin)"];
    
    node [shape=box, style="filled,rounded", fillcolor="#fef3c7", color="#92400e", penwidth=1.5, fontsize=11];
    payment_gw [label="<<actor>>\\nPayment Gateway\\n(VietQR / ZaloPay)"];

    // Generalizations between actors
    edge [style=solid, arrowhead=empty, color="#3730a3", penwidth=1.2];
    customer -> guest;
    admin -> staff;

    // Use cases style
    node [shape=ellipse, style="filled", fillcolor="#f0fdf4", color="#166534", penwidth=1.2, fontsize=10];

    subgraph cluster_system {
        label="Computer Shop Management Software System Boundary";
        fontname="Arial Bold";
        fontsize=14;
        style=dashed;
        color="#64748b";
        bgcolor="#f8fafc";
        margin=20;

        subgraph cluster_m1 {
            label="Module 1: Authentication and User Administration";
            style=rounded;
            bgcolor="#ffffff";
            color="#cbd5e1";
            uc_login [label="UC-01: Authenticate User\\n(JWT Login)"];
            uc_register [label="UC-02: Register Customer\\nAccount"];
            uc_users [label="UC-03: Manage System\\nUsers and RBAC"];
            uc_dashboard [label="UC-04: View Sales and\\nRevenue Dashboard"];
        }

        subgraph cluster_m2 {
            label="Module 2: Products, Specs and Variants Management";
            style=rounded;
            bgcolor="#ffffff";
            color="#cbd5e1";
            uc_cat [label="UC-05: Manage Hardware\\nCategories"];
            uc_prod [label="UC-06: Manage Hardware\\nProducts"];
            uc_specs [label="UC-07: Configure Technical\\nSpecs and Variants"];
            uc_filter [label="UC-08: Filter and Search\\nHardware by Specs"];
        }

        subgraph cluster_m3 {
            label="Module 3: Storefront, Cart and Payment";
            style=rounded;
            bgcolor="#ffffff";
            color="#cbd5e1";
            uc_cart [label="UC-09: Manage Shopping Cart"];
            uc_stock_val [label="UC-10: Validate Real-Time\\nStock Availability"];
            uc_checkout [label="UC-11: Cashless Checkout\\n(VietQR / ZaloPay)"];
        }

        subgraph cluster_m4 {
            label="Module 4: Order Fulfillment and Inventory Control";
            style=rounded;
            bgcolor="#ffffff";
            color="#cbd5e1";
            uc_orders [label="UC-12: Process Order Fulfillment\\n(Lifecycle: Paid to Shipped)"];
            uc_deduct [label="UC-13: Deduct Inventory\\nStock on Sale"];
            uc_batch_in [label="UC-14: Batch Inward\\nStock Receipt (Restock)"];
            uc_alert [label="UC-15: Monitor Low-Stock\\nAlerts and Thresholds"];
        }
    }

    // Actor to Use Cases Associations
    edge [style=solid, arrowhead=none, color="#334155", penwidth=1.2];
    guest -> uc_filter;
    guest -> uc_register;
    guest -> uc_login;

    customer -> uc_cart;
    customer -> uc_checkout;

    staff -> uc_prod;
    staff -> uc_specs;
    staff -> uc_batch_in;
    staff -> uc_alert;
    staff -> uc_orders;

    admin -> uc_users;
    admin -> uc_dashboard;
    admin -> uc_cat;

    uc_checkout -> payment_gw;

    // <<include>> and <<extend>> relationships
    edge [style=dashed, arrowhead=open, color="#0284c7", penwidth=1.0, fontcolor="#0369a1", fontsize=8];
    uc_users -> uc_login [label="<<include>>"];
    uc_dashboard -> uc_login [label="<<include>>"];
    uc_specs -> uc_prod [label="<<extend>>"];
    uc_cart -> uc_stock_val [label="<<include>>"];
    uc_checkout -> uc_stock_val [label="<<include>>"];
    uc_orders -> uc_deduct [label="<<include>>"];
    uc_batch_in -> uc_alert [label="<<extend>>"];
}
"""

with open(os.path.join(diagrams_dir, "usecase_overall.dot"), "w", encoding="utf-8") as f:
    f.write(dot_overall)

# -------------------------------------------------------------
# 2. Figure 3.2: Module 2 Use Case Diagram (Product, Specs & Variants)
# -------------------------------------------------------------
dot_m2 = """
digraph G {
    rankdir=LR;
    dpi=300;
    nodesep=0.4;
    ranksep=0.8;
    fontname="Arial";
    node [fontname="Arial"];
    edge [fontname="Arial"];

    node [shape=box, style="filled,rounded", fillcolor="#e0e7ff", color="#3730a3", penwidth=1.5, fontsize=11];
    actor_staff [label="<<actor>>\\nInventory / Sales Staff"];
    actor_admin [label="<<actor>>\\nStore Manager (Admin)"];
    actor_guest [label="<<actor>>\\nCustomer / Guest"];

    edge [style=solid, arrowhead=empty, color="#3730a3", penwidth=1.2];
    actor_admin -> actor_staff;

    node [shape=ellipse, style="filled", fillcolor="#f0fdf4", color="#166534", penwidth=1.2, fontsize=10];

    subgraph cluster_m2_detail {
        label="Module 2: Hardware Products, Specs and Variants Subsystem";
        fontname="Arial Bold";
        fontsize=13;
        style=dashed;
        color="#64748b";
        bgcolor="#f8fafc";
        margin=15;

        uc_create_prod [label="Create Hardware Product\\n(Name, Brand, Category)"];
        uc_update_prod [label="Update Hardware Product"];
        uc_delete_prod [label="Delete Hardware Product"];
        uc_add_variant [label="Add Product SKU Variant\\n(SKU, Price, Stock, Threshold)"];
        uc_update_variant [label="Update Variant Price and Stock"];
        uc_config_specs [label="Map Technical Specifications\\n(Socket, Bus, VRAM, TDP)"];
        uc_manage_specs [label="Register New Spec Attribute\\n(Specs Definition)"];
        uc_filter_specs [label="Search and Multi-Criteria\\nFilter Hardware by Specs"];
        uc_view_options [label="Retrieve Dynamic Filter\\nOptions and Attributes"];
        uc_check_order_ref [label="Validate No Active Order\\nReferences before Delete"];
    }

    edge [style=solid, arrowhead=none, color="#334155", penwidth=1.2];
    actor_staff -> uc_create_prod;
    actor_staff -> uc_update_prod;
    actor_staff -> uc_delete_prod;
    actor_staff -> uc_add_variant;
    actor_staff -> uc_update_variant;
    actor_staff -> uc_config_specs;
    actor_staff -> uc_manage_specs;

    actor_guest -> uc_filter_specs;
    actor_guest -> uc_view_options;

    edge [style=dashed, arrowhead=open, color="#0284c7", penwidth=1.0, fontcolor="#0369a1", fontsize=8];
    uc_add_variant -> uc_create_prod [label="<<extend>>"];
    uc_config_specs -> uc_create_prod [label="<<include>>"];
    uc_delete_prod -> uc_check_order_ref [label="<<include>>"];
    uc_filter_specs -> uc_view_options [label="<<include>>"];
}
"""

with open(os.path.join(diagrams_dir, "usecase_module2.dot"), "w", encoding="utf-8") as f:
    f.write(dot_m2)

# -------------------------------------------------------------
# 3. Figure 3.3: Module 4 Use Case Diagram (Order & Inventory)
# -------------------------------------------------------------
dot_m4 = """
digraph G {
    rankdir=LR;
    dpi=300;
    nodesep=0.4;
    ranksep=0.8;
    fontname="Arial";
    node [fontname="Arial"];
    edge [fontname="Arial"];

    node [shape=box, style="filled,rounded", fillcolor="#e0e7ff", color="#3730a3", penwidth=1.5, fontsize=11];
    actor_staff [label="<<actor>>\\nInventory / Sales Staff"];
    actor_system [label="<<system actor>>\\nOrder Checkout Engine"];

    node [shape=ellipse, style="filled", fillcolor="#f0fdf4", color="#166534", penwidth=1.2, fontsize=10];

    subgraph cluster_m4_detail {
        label="Module 4: Order Fulfillment and Inventory Control Subsystem";
        fontname="Arial Bold";
        fontsize=13;
        style=dashed;
        color="#64748b";
        bgcolor="#f8fafc";
        margin=15;

        uc_view_inv [label="View Inventory Levels\\nand Total Valuation"];
        uc_batch_restock [label="Batch Inward Stock Receipt\\n(Import Batch by SKUs)"];
        uc_log_trans [label="Record Inventory Transaction\\n(Audit Trail: Import/Sale)"];
        uc_adjust_stock [label="Adjust Variant Stock Quantity\\nand Low-Stock Threshold"];
        uc_check_alerts [label="Evaluate Low-Stock Alerts\\n(Stock <= Threshold)"];
        uc_dispatch_alert [label="Trigger Critical Alert Warning\\n(Deficit and Reorder Rec)"];
        uc_deduct_stock [label="Deduct Inventory Stock on Sale\\n(Atomic Transaction)"];
        uc_fulfill_order [label="Fulfill Order State Transition\\n(Paid -> Packing -> Shipped)"];
    }

    edge [style=solid, arrowhead=none, color="#334155", penwidth=1.2];
    actor_staff -> uc_view_inv;
    actor_staff -> uc_batch_restock;
    actor_staff -> uc_adjust_stock;
    actor_staff -> uc_check_alerts;
    actor_staff -> uc_fulfill_order;

    actor_system -> uc_deduct_stock;

    edge [style=dashed, arrowhead=open, color="#0284c7", penwidth=1.0, fontcolor="#0369a1", fontsize=8];
    uc_batch_restock -> uc_log_trans [label="<<include>>"];
    uc_adjust_stock -> uc_log_trans [label="<<include>>"];
    uc_deduct_stock -> uc_log_trans [label="<<include>>"];
    uc_check_alerts -> uc_dispatch_alert [label="<<extend>>"];
    uc_fulfill_order -> uc_deduct_stock [label="<<include>>"];
}
"""

with open(os.path.join(diagrams_dir, "usecase_module4.dot"), "w", encoding="utf-8") as f:
    f.write(dot_m4)

# -------------------------------------------------------------
# 4. Figure 5.2: Comprehensive UML Class Diagram
# -------------------------------------------------------------
dot_class = """
digraph UML_Class_Diagram {
    rankdir=BT;
    dpi=300;
    nodesep=0.5;
    ranksep=0.7;
    fontname="Arial";
    node [fontname="Arial", shape=record, fontsize=9];
    edge [fontname="Arial", fontsize=9];

    // Domain Entities
    Category [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{Category|+ category_id: Long\\n+ name: String\\n+ description: String|+ getProducts(): List\\<Product\\>}"
    ];

    Product [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{Product|+ product_id: Long\\n+ name: String\\n+ brand: String\\n+ category_id: Long\\n+ description: String\\n+ created_at: Timestamp|+ getVariants(): List\\<ProductVariant\\>\\n+ getSpecs(): List\\<ProductSpec\\>\\n+ getTotalStock(): Integer\\n+ getPriceRange(): PriceRange}"
    ];

    ProductVariant [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{ProductVariant|+ variant_id: Long\\n+ product_id: Long\\n+ sku: String\\n+ price: Decimal\\n+ stock_quantity: Integer\\n+ low_stock_threshold: Integer|+ isLowStock(): Boolean\\n+ isOutOfStock(): Boolean\\n+ adjustStock(delta: Integer): Void}"
    ];

    Spec [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{Spec|+ spec_id: Long\\n+ spec_name: String|+ getDistinctValues(): List\\<String\\>}"
    ];

    ProductSpec [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{ProductSpec|+ product_id: Long\\n+ spec_id: Long\\n+ spec_value: String|}"
    ];

    InventoryTransaction [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{InventoryTransaction|+ transaction_id: Long\\n+ variant_id: Long\\n+ change_quantity: Integer\\n+ transaction_type: String\\n+ notes: String\\n+ created_by: Long\\n+ created_at: Timestamp|+ recordMovement(): Void}"
    ];

    Role [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{Role|+ role_id: Long\\n+ role_name: String|+ getPermissions(): List\\<String\\>}"
    ];

    User [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{User|+ user_id: Long\\n+ username: String\\n+ password_hash: String\\n+ full_name: String\\n+ email: String\\n+ phone: String\\n+ role_id: Long\\n+ is_active: Boolean\\n+ last_login_at: Timestamp\\n+ created_at: Timestamp|+ authenticate(password: String): Boolean\\n+ hasRole(roleName: String): Boolean}"
    ];

    Order [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{Order|+ order_id: Long\\n+ user_id: Long\\n+ session_id: String\\n+ total_amount: Decimal\\n+ status: String\\n+ payment_method: String\\n+ created_at: Timestamp|+ calculateTotal(): Decimal\\n+ updateStatus(newStatus: String): Void}"
    ];

    OrderItem [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{OrderItem|+ item_id: Long\\n+ order_id: Long\\n+ variant_id: Long\\n+ quantity: Integer\\n+ unit_price: Decimal|+ getSubtotal(): Decimal}"
    ];

    WebsiteVisit [
        fillcolor="#f8fafc", style=filled, color="#334155",
        label="{WebsiteVisit|+ session_id: String\\n+ user_id: Long\\n+ visited_at: Timestamp|}"
    ];

    // Service Layer
    ProductService [
        fillcolor="#e0e7ff", style=filled, color="#3730a3",
        label="{ProductService||+ listProducts(filters: ProductQueryDTO): PageResult\\n+ getProduct(id: Long): ProductDTO\\n+ createProduct(dto: CreateProductDTO): ProductDTO\\n+ updateProduct(id: Long, dto: UpdateProductDTO): ProductDTO\\n+ deleteProduct(id: Long): Boolean\\n+ getFilterOptions(): FilterOptionsDTO}"
    ];

    InventoryService [
        fillcolor="#e0e7ff", style=filled, color="#3730a3",
        label="{InventoryService||+ listInventory(filters: InvQueryDTO): InvPageResult\\n+ getLowStockAlerts(): List\\<AlertDTO\\>\\n+ batchRestock(dto: BatchRestockDTO, actorId: Long): BatchResultDTO\\n+ adjustStock(variantId: Long, dto: AdjustStockDTO, actorId: Long): VariantDTO\\n+ deductStockForOrder(client: Client, items: List\\<OrderItem\\>): Void}"
    ];

    CategoryService [
        fillcolor="#e0e7ff", style=filled, color="#3730a3",
        label="{CategoryService||+ listCategories(): List\\<Category\\>\\n+ getCategory(id: Long): Category\\n+ createCategory(dto: CategoryDTO): Category\\n+ deleteCategory(id: Long): Boolean}"
    ];

    // Relationships (Arrows point from child/dependent to parent/target in BT rankdir)
    // Association Product -> Category
    Product -> Category [arrowtail=none, arrowhead=none, taillabel="*", headlabel="1", label="belongs to"];

    // Composition: Product *-- ProductVariant
    ProductVariant -> Product [arrowtail=diamond, arrowhead=none, dir=both, taillabel="1..*", headlabel="1", label="composed of"];

    // Composition: Product *-- ProductSpec
    ProductSpec -> Product [arrowtail=diamond, arrowhead=none, dir=both, taillabel="*", headlabel="1"];

    // Aggregation: Spec o-- ProductSpec
    ProductSpec -> Spec [arrowtail=ediamond, arrowhead=none, dir=both, taillabel="*", headlabel="1"];

    // Composition: Order *-- OrderItem
    OrderItem -> Order [arrowtail=diamond, arrowhead=none, dir=both, taillabel="1..*", headlabel="1"];

    // Association: OrderItem -> ProductVariant
    OrderItem -> ProductVariant [arrowtail=none, arrowhead=none, taillabel="*", headlabel="1"];

    // Association: InventoryTransaction -> ProductVariant
    InventoryTransaction -> ProductVariant [arrowtail=none, arrowhead=none, taillabel="*", headlabel="1"];

    // Association: Role o-- User
    User -> Role [arrowtail=none, arrowhead=none, taillabel="*", headlabel="1", label="assigned to"];

    // Association: Order -> User
    Order -> User [arrowtail=none, arrowhead=none, taillabel="*", headlabel="1", label="placed by"];

    // Association: WebsiteVisit -> User
    WebsiteVisit -> User [arrowtail=none, arrowhead=none, taillabel="*", headlabel="0..1"];

    // Dependencies from Services to Entities
    edge [style=dashed, arrowhead=open, color="#475569"];
    ProductService -> Product;
    ProductService -> ProductVariant;
    InventoryService -> ProductVariant;
    InventoryService -> InventoryTransaction;
    CategoryService -> Category;
}
"""

with open(os.path.join(diagrams_dir, "class_diagram_overall.dot"), "w", encoding="utf-8") as f:
    f.write(dot_class)

# Compile all diagrams using dot
diagram_files = ["usecase_overall", "usecase_module2", "usecase_module4", "class_diagram_overall"]
for name in diagram_files:
    dot_file = os.path.join(diagrams_dir, f"{name}.dot")
    png_file = os.path.join(diagrams_dir, f"{name}.png")
    cmd = ["dot", "-Tpng", dot_file, "-o", png_file]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode == 0:
        print(f"SUCCESS: Generated {name}.png ({os.path.getsize(png_file)} bytes)")
    else:
        print(f"ERROR: {name} failed: {res.stderr}")
