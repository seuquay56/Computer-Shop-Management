import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

doc_path = r"C:\Users\PC\.gemini\antigravity\scratch\Computer-Shop-Management\524H00057_524H0069_524H0052.docx"
diagrams_dir = r"C:\Users\PC\.gemini\antigravity\scratch\Computer-Shop-Management\Code\docs\diagrams"

print(f"Loading document: {doc_path}")
doc = docx.Document(doc_path)

def set_cell_shading(cell, color_hex):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{color_hex}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('w:top', top), ('w:bottom', bottom), ('w:left', left), ('w:right', right)]:
        node = OxmlElement(m)
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def style_header_cell(cell, text):
    set_cell_shading(cell, "1E293B")
    set_cell_margins(cell, top=120, bottom=120, left=150, right=150)
    p = cell.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(10)
    run.font.bold = True
    run.font.color.rgb = RGBColor(255, 255, 255)

def style_body_cell(cell, text, bold=False, italic=False, align=WD_ALIGN_PARAGRAPH.LEFT, size=9.5, bg=None):
    if bg:
        set_cell_shading(cell, bg)
    set_cell_margins(cell, top=90, bottom=90, left=130, right=130)
    p = cell.paragraphs[0]
    p.alignment = align
    run = p.add_run(text)
    run.font.name = "Times New Roman"
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.italic = italic

def add_table_before(target_p, headers, rows_data, col_widths=None):
    tbl = doc.add_table(rows=len(rows_data) + 1, cols=len(headers), style='Table Grid')
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    # Format headers
    for c_idx, h in enumerate(headers):
        style_header_cell(tbl.rows[0].cells[c_idx], h)
        
    # Format rows
    for r_idx, r_data in enumerate(rows_data):
        row_cells = tbl.rows[r_idx + 1].cells
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(r_data):
            # Check if value is ID or short code
            is_code = (c_idx == 0 and len(str(val)) <= 10)
            align = WD_ALIGN_PARAGRAPH.CENTER if is_code else WD_ALIGN_PARAGRAPH.LEFT
            style_body_cell(row_cells[c_idx], str(val), bold=is_code, align=align, bg=bg_color)
            
    # Set widths if specified
    if col_widths:
        for row in tbl.rows:
            for c_idx, w in enumerate(col_widths):
                row.cells[c_idx].width = Inches(w)
                
    target_p._p.addprevious(tbl._tbl)
    return tbl

def add_paragraph_before(target_p, text, bold_prefix="", italic=False, space_after=6):
    new_p = target_p.insert_paragraph_before()
    new_p.paragraph_format.space_after = Pt(space_after)
    new_p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        r_bold = new_p.add_run(bold_prefix)
        r_bold.font.name = "Times New Roman"
        r_bold.font.size = Pt(11)
        r_bold.font.bold = True
    if text:
        r_text = new_p.add_run(text)
        r_text.font.name = "Times New Roman"
        r_text.font.size = Pt(11)
        r_text.font.italic = italic
    return new_p

def add_image_before(target_p, image_path, caption_text, width_inches=6.0):
    img_p = target_p.insert_paragraph_before()
    img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    img_p.paragraph_format.space_before = Pt(8)
    img_p.paragraph_format.space_after = Pt(4)
    run = img_p.add_run()
    run.add_picture(image_path, width=Inches(width_inches))
    
    cap_p = target_p.insert_paragraph_before(caption_text)
    cap_p.style = doc.styles['Caption'] if 'Caption' in doc.styles else doc.styles['Normal']
    cap_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    cap_p.paragraph_format.space_after = Pt(12)
    for r in cap_p.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(10)
        r.font.bold = True
        r.font.italic = True

# ---------------------------------------------------------
# Find target paragraphs in document
# ---------------------------------------------------------
p_map = {}
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt:
        p_map[txt] = p

print("Paragraphs mapped. Locating target anchors...")

anchor_todo_req = p_map.get("[TODO - Thành viên 2 (Vo Nguyen Phuc Thinh) điền vào mục này]")
anchor_stakeholders = p_map.get("Bảng mô tả các tác nhân: Admin, Staff, Customer, Guest")
anchor_graphical_uc = p_map.get("(Chèn sơ đồ Use Case tổng quát và các sơ đồ Use Case phân rã)")
anchor_textual_uc = p_map.get("(Điền các bảng đặc tả Use Case: Scenario, Trigger, Preconditions, Postconditions, Main Flow, Alternative/Exception Flows)")
anchor_fr = p_map.get("Liệt kê chi tiết yêu cầu chức năng cho 4 phân hệ: Auth & Dashboard, Product & Specs Management, Cart & VietQR Payment, Order & Inventory Management")
anchor_nfr = p_map.get("Trình bày yêu cầu phi chức năng: Performance < 1s response time, Security với JWT/Bcrypt, Reliability, Usability")
anchor_class_diag = p_map.get("[TODO - Thành viên 2 (Vo Nguyen Phuc Thinh) chèn UML Class Diagram và mô tả quan hệ]")

# ---------------------------------------------------------
# 1. Fill 3.1: Stakeholders for the System
# ---------------------------------------------------------
print("Writing Section 3.1: Stakeholders...")
add_paragraph_before(
    anchor_stakeholders,
    "The Computer Shop Management Software interacts with various human actors and automated external systems. To ensure that the requirements reflect operational realities, stakeholders are identified, classified, and profiled based on their business responsibilities, authority levels, system touchpoints, and functional goals within the specialized retail hardware domain.",
    space_after=8
)

stakeholders_headers = ["Stakeholder / Actor", "Role Category", "Primary Responsibilities", "System Touchpoints & Goals"]
stakeholders_data = [
    [
        "Store Manager (Admin)",
        "Internal / Executive",
        "Strategic business governance, financial performance tracking, user account creation, and role-based access control (RBAC) delegation.",
        "Accesses Admin Dashboard for real-time revenue, order counts, and conversion metrics; manages user status and roles; oversees catalog pricing."
    ],
    [
        "Inventory & Sales Staff",
        "Internal / Operational",
        "Daily warehouse and storefront operations, product catalog configuration, technical specification mapping, batch inward stock receipts, and order fulfillment tracking.",
        "Manages hardware items and technical specs (Socket, RAM, VRAM); executes batch stock-in transactions; monitors low-stock alerts; updates order shipment lifecycle."
    ],
    [
        "Retail Customer",
        "External / Authenticated",
        "Explores computer hardware products, conducts multi-criteria filtering by specs, adds components to the shopping cart, verifies real-time stock availability, and performs cashless checkout.",
        "Storefront UI, authenticated profile management, shopping cart, order placement via VietQR / ZaloPay, personal order tracking."
    ],
    [
        "Guest / Prospective Buyer",
        "External / Anonymous",
        "Browses hardware catalog, inspects component technical parameters, searches across categories, and registers for a customer account.",
        "Public storefront catalog, dynamic specifications filter sidebar, registration page, session tracking cookie/token."
    ],
    [
        "Payment Gateway Engine (VietQR / ZaloPay)",
        "External System / Automated",
        "Generates dynamic QR codes matching transaction references, processes electronic fund transfers, and transmits instant payment callback webhooks.",
        "Payment API callback endpoints (/api/payment/callback), automated order status reconciliation from Pending to Paid."
    ],
    [
        "Systems Administrator / DevOps",
        "Internal / Technical",
        "Database maintenance, connection pool monitoring, security compliance, backup execution, and system-level performance auditing.",
        "PostgreSQL database engine, API server environment, rate limiter logs, security audit tables."
    ]
]

add_paragraph_before(anchor_stakeholders, "Table 3.1: System Stakeholder Profiles and Interaction Matrix", italic=True, space_after=4)
add_table_before(anchor_stakeholders, stakeholders_headers, stakeholders_data, [1.5, 1.2, 2.3, 2.5])

add_paragraph_before(
    anchor_stakeholders,
    "The operational interaction protocols among these stakeholders ensure a clear separation of privileges. Anonymous guests can freely evaluate technical compatibility and prices, authenticated customers experience an uninterrupted purchasing workflow, and internal personnel utilize protected administrative interfaces to guarantee accurate inventory and financial bookkeeping.",
    space_after=12
)

# ---------------------------------------------------------
# 2. Fill 3.2.1: Graphical Use Case Model
# ---------------------------------------------------------
print("Writing Section 3.2.1: Graphical Use Case Model...")
add_paragraph_before(
    anchor_graphical_uc,
    "The Use Case Model formalizes functional boundary boundaries and user interactions across the four primary subsystems of the Computer Shop Management Software. The model follows standard UML 2.5 notation, utilizing <<include>> stereotypes for mandatory subordinate behaviors (e.g., authentication, stock validation, inventory deduction) and <<extend>> stereotypes for conditional or specialized branch actions (e.g., variant configuration, low-stock alert triggers).",
    space_after=8
)

# Figure 3.1: Overall
add_image_before(
    anchor_graphical_uc,
    os.path.join(diagrams_dir, "usecase_overall.png"),
    "Figure 3.1: Overall System Use Case Diagram for Computer Shop Management Software",
    width_inches=6.2
)

add_paragraph_before(
    anchor_graphical_uc,
    "As illustrated in Figure 3.1, the system encompasses four distinct functional packages: (1) Authentication & User Administration, (2) Hardware Products, Specs & Variants Management, (3) Storefront, Cart & Payment, and (4) Order Fulfillment & Inventory Control. The Actor Generalization hierarchy reflects that 'Customer' inherits all foundational browsing capabilities from 'Guest', while 'Admin' inherits staff operational privileges while retaining exclusive access to sensitive RBAC and financial analytics features.",
    space_after=10
)

# Figure 3.2: Module 2 Use Case Diagram
add_image_before(
    anchor_graphical_uc,
    os.path.join(diagrams_dir, "usecase_module2.png"),
    "Figure 3.2: Module 2 Use Case Diagram – Hardware Products, Specs and Variants Management Subsystem",
    width_inches=5.8
)

add_paragraph_before(
    anchor_graphical_uc,
    "Figure 3.2 provides a detailed decomposition of Module 2. Managing computer hardware requires flexible multi-dimensional data handling: products are linked with discrete categories and multiple physical SKU variants (representing different packaging, coolers, or memory configurations). In parallel, an extensible technical specification registry enables dynamic attribute-value mapping (e.g., Socket: LGA1700/AM5; RAM: DDR5-6000MHz; VRAM: 16GB GDDR6X) which dynamically populates the multi-criteria storefront search filters.",
    space_after=10
)

# Figure 3.3: Module 4 Use Case Diagram
add_image_before(
    anchor_graphical_uc,
    os.path.join(diagrams_dir, "usecase_module4.png"),
    "Figure 3.3: Module 4 Use Case Diagram – Order Fulfillment and Inventory Control Subsystem",
    width_inches=5.8
)

add_paragraph_before(
    anchor_graphical_uc,
    "Figure 3.3 illustrates Module 4's inventory control mechanisms. The warehouse workflow supports batch inward receipts (nhập kho theo lô), allowing staff to update multiple component quantities within a single atomic database transaction. Every stock alteration is recorded in an audit trail. The automated Low-Stock Alert engine evaluates current stock levels against individual variant thresholds, triggering warning notices and calculating deficit quantities when reordering is required.",
    space_after=12
)

# ---------------------------------------------------------
# 3. Fill 3.2.2: Textual Description for Each Use Case
# ---------------------------------------------------------
print("Writing Section 3.2.2: Textual Use Case Specifications (10 Use Cases)...")

def add_usecase_spec_table(anchor_p, uc_id, uc_name, actor, secondary, pre, post, trigger, normal_flow, alt_flows, exc_flows, special):
    headers = ["Element", "Specification Details"]
    rows = [
        ["Use Case ID & Name", f"{uc_id}: {uc_name}"],
        ["Primary Actor", actor],
        ["Secondary Actors", secondary],
        ["Preconditions", pre],
        ["Postconditions", post],
        ["Trigger", trigger],
        ["Main Success Scenario (Normal Flow)", "\n".join(f"{i+1}. {step}" for i, step in enumerate(normal_flow))],
        ["Alternative Flows", "\n".join(alt_flows) if alt_flows else "None."],
        ["Exception Flows", "\n".join(exc_flows) if exc_flows else "None."],
        ["Special Constraints", special]
    ]
    add_paragraph_before(anchor_p, f"Table {uc_id}: Textual Specification for {uc_name}", italic=True, space_after=4)
    add_table_before(anchor_p, headers, rows, [2.0, 5.0])
    add_paragraph_before(anchor_p, "", space_after=8)

# UC-01
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-01", "User Authentication and JWT Session Issuance",
    "Customer, Staff, Store Manager (Admin)", "None",
    "User account exists in the database with an active status (is_active = true).",
    "System issues a digitally signed JWT token containing user_id, username, and role; last_login_at timestamp is updated.",
    "User submits login credentials via Storefront or Admin login interface.",
    [
        "User inputs username/email and password, then submits the login form.",
        "System validates syntax and presence of required fields.",
        "System queries the database for user matching identifier (case-insensitive).",
        "System verifies submitted password against stored Bcrypt hash using secure salt comparison.",
        "System checks account activation status (is_active).",
        "System generates signed JWT token with configured expiration (1 day).",
        "System updates user's last_login_at timestamp.",
        "System responds with HTTP 200, JWT token, and user profile data."
    ],
    [
        "A1: User logs in using email address instead of username: System executes identifier lookup across both username and email columns."
    ],
    [
        "E1: Identifier not found: System returns HTTP 401 'Invalid credentials.'",
        "E2: Password verification fails: System returns HTTP 401 'Invalid credentials.'",
        "E3: Account is deactivated (is_active = false): System halts processing and returns HTTP 403 'Account has been deactivated. Please contact administrator.'"
    ],
    "Password comparison must execute in constant time to prevent side-channel timing attacks."
)

# UC-02
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-02", "Manage System User Accounts and RBAC Permissions",
    "Store Manager (Admin)", "Target User Account",
    "Admin is successfully authenticated with a valid JWT token bearing 'Admin' role.",
    "Target user's role (Admin, Staff, Customer) or activation status is securely updated in the database.",
    "Admin navigates to User Management panel and selects an account to modify.",
    [
        "Admin views paginated list of users with search and role filters.",
        "Admin selects target user and chooses new role or toggles active status.",
        "System checks that Admin is not modifying their own account status or role.",
        "System checks that target user is not the sole active Admin in the system.",
        "System executes parameterized UPDATE query on user record.",
        "System records audit log of administrative action.",
        "System returns updated user record with HTTP 200 and displays success toast."
    ],
    [
        "A1: Admin filters users by active status or role: System updates query with corresponding SQL predicates and returns filtered page."
    ],
    [
        "E1: Admin attempts to alter own status/role: System blocks update and returns HTTP 400 'Cannot change own role or status.'",
        "E2: Operation would leave zero active Admins: System aborts transaction and returns HTTP 400 'Cannot demote or deactivate the last active Admin.'"
    ],
    "Administrative actions must be strictly guarded by RBAC middleware."
)

# UC-03
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-03", "Manage Computer Hardware Products and Categories",
    "Inventory / Sales Staff, Store Manager (Admin)", "Database Engine",
    "User is authenticated with Staff or Admin role.",
    "Hardware product or category is created, updated, or removed in the database.",
    "Staff initiates product or category management action from administrative portal.",
    [
        "Staff enters product details: Name, Brand, Category, and Description.",
        "System validates that selected Category ID exists.",
        "System verifies that product name within the brand does not duplicate existing catalog entry.",
        "System opens a database transaction and inserts product record.",
        "System maps associated specifications and initial SKU variants.",
        "System commits transaction and returns newly created product with HTTP 201."
    ],
    [
        "A1: Staff updates existing product: System modifies descriptive fields without altering order history.",
        "A2: Staff deletes category: System checks product count; if zero, category is removed."
    ],
    [
        "E1: Selected category does not exist: System returns HTTP 404 'Category not found.'",
        "E2: Staff attempts to delete category containing active products: System halts and returns HTTP 400 with active product count.",
        "E3: Staff attempts to delete product whose variants are in order_items: System blocks deletion and returns HTTP 400 'Cannot delete product referenced in customer orders.'"
    ],
    "Cascade delete rules must prevent orphan records in variants and specifications."
)

# UC-04
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-04", "Configure Technical Specifications and Product Variants",
    "Inventory / Sales Staff", "Products Database",
    "Product entity exists in the system; user has Staff or Admin privileges.",
    "Product is linked with technical specifications (e.g. Socket, RAM Bus, VRAM, TDP) and distinct SKU variants.",
    "Staff configures hardware specifications or adds new SKU variants to an existing product.",
    [
        "Staff opens product specification modal in Admin portal.",
        "Staff inputs key-value pairs for technical specifications (e.g. 'Socket': 'LGA1700', 'TDP': '125W').",
        "System queries specs table; registers spec attribute if newly introduced.",
        "System updates product_specs table using ON CONFLICT DO UPDATE upsert semantics.",
        "Staff adds SKU variant with price, stock quantity, and low-stock threshold.",
        "System verifies global uniqueness of SKU code.",
        "System inserts new product_variants record.",
        "System returns updated product details with all specifications and variants."
    ],
    [
        "A1: Staff updates existing variant price or threshold: System modifies product_variants record without altering SKU identity."
    ],
    [
        "E1: Submitted SKU already assigned to another variant: System halts and returns HTTP 409 'SKU already in use.'",
        "E2: Price or stock quantity is negative: System rejects payload with HTTP 400 validation error."
    ],
    "Specification names and values are stored in normalized relational tables to ensure efficient B-tree index lookups."
)

# UC-05
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-05", "Multi-Criteria Hardware Search and Specification Filtering",
    "Customer, Guest / Visitor", "Product Catalog Service",
    "Storefront catalog contains seeded computer hardware records.",
    "System renders paginated hardware list matching all combined filter criteria.",
    "Customer applies filters or inputs search query in storefront sidebar.",
    [
        "Customer selects category (e.g. CPU), brand (e.g. Intel), and price range.",
        "Customer selects technical specifications from dynamic dropdowns (e.g. Socket = LGA1700, RAM = DDR5).",
        "Customer toggles 'In-Stock Only' checkbox and selects sort order (e.g. price_asc).",
        "Frontend dispatches HTTP GET to /api/products with multi-criteria query parameters.",
        "Backend dynamically constructs SQL query with parameterized EXISTS clauses for each specification.",
        "Database executes query utilizing indexes on category_id, brand, and product_specs.",
        "Backend aggregates variants and specs for matching products and calculates total count.",
        "Frontend renders matching hardware cards with price ranges, specs tags, and availability badges."
    ],
    [
        "A1: Customer enters keyword search in combination with specs filters: System matches search against name, brand, description, and SKU.",
        "A2: Customer resets all filters: System reloads default catalog listing sorted by newest arrival."
    ],
    [
        "E1: Query syntax error or invalid parameter types: System catches error in validator and returns HTTP 400.",
        "E2: Zero products match filter criteria: System returns empty array with pagination total = 0; frontend displays friendly empty state."
    ],
    "Filter queries must complete in under 200ms to provide fluid storefront navigation."
)

# UC-06
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-06", "Batch Inward Stock Receipt (Restock by SKU Batches)",
    "Inventory Staff", "Inventory & Transaction Tables",
    "Staff is authenticated; inward hardware shipment arrived from distributor.",
    "Variant stock quantities incremented; inventory_transactions audit record created.",
    "Staff opens Batch Restock modal, inputs batch code, and adds SKU list.",
    [
        "Staff enters Batch Code (e.g. BATCH-202611-001) and supplier invoice notes.",
        "Staff adds list of items: SKU or Variant ID and received quantity (quantity > 0).",
        "Staff clicks 'Confirm Inward Restock'.",
        "System initiates database transaction (BEGIN).",
        "For each item, system locks variant row, verifies existence, and increments stock_quantity.",
        "System inserts record into inventory_transactions with type = 'Import', change_quantity, and user_id.",
        "System commits transaction (COMMIT).",
        "System re-evaluates low-stock alert status and returns summary with HTTP 200."
    ],
    [
        "A1: Staff initiates batch restock directly from Low-Stock Alert banner: System pre-fills items list with critical deficit SKUs."
    ],
    [
        "E1: Any SKU in the batch does not exist: System rolls back entire transaction (ROLLBACK) and returns HTTP 400.",
        "E2: Received quantity is zero or negative: Validator rejects request before database execution."
    ],
    "Atomic multi-item transaction guarantees that partial shipment arrivals do not corrupt inventory counts."
)

# UC-07
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-07", "Low-Stock Threshold Alert and Inventory Monitoring",
    "Inventory / Sales Staff, Store Manager", "Inventory Repository",
    "Hardware variants have defined low_stock_threshold values (default = 5).",
    "System outputs real-time alert feed classifying items by urgency level.",
    "Staff opens Inventory Management tab or background alert scanner executes.",
    [
        "System executes query filtering product_variants WHERE stock_quantity <= low_stock_threshold.",
        "System classifies each alert: stock_quantity = 0 as 'CRITICAL' (Out of stock); stock_quantity <= threshold as 'WARNING' (Low stock).",
        "System calculates deficit_quantity (threshold - current_stock) and recommended reorder quantity (threshold * 3 - current_stock).",
        "System returns alert feed array and total alert count.",
        "Frontend renders prominent alert banner with critical badges and 'Restock Now' shortcut."
    ],
    [
        "A1: Zero items breach threshold: System returns empty alerts array; frontend displays healthy inventory status banner."
    ],
    [
        "E1: Database connection failure: System returns HTTP 500 through central error handler."
    ],
    "Alert calculation must execute efficiently without scanning entire database through indexed stock checks."
)

# UC-08
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-08", "Manage Shopping Cart and Real-Time Stock Validation",
    "Retail Customer", "Cart & Product Variants",
    "Customer has selected a hardware component variant; browser session is active.",
    "Cart state updated in client session/storage; total price calculated.",
    "Customer clicks 'Add to Cart' or modifies item quantity in cart drawer.",
    [
        "Customer selects specific SKU variant (e.g. 16GB RAM) and quantity.",
        "Customer adds item to cart.",
        "System validates requested quantity against live stock_quantity in database.",
        "System calculates item subtotal (quantity * unit_price) and cart total.",
        "System updates cart session state.",
        "Frontend displays updated cart badge and summary."
    ],
    [
        "A1: Customer adjusts quantity in cart: System re-validates stock availability for new quantity.",
        "A2: Customer removes item: System updates cart total."
    ],
    [
        "E1: Requested quantity exceeds available inventory: System displays warning 'Only X items remaining in stock' and limits cart quantity to maximum available stock."
    ],
    "Cart state must maintain live synchronization with physical inventory levels."
)

# UC-09
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-09", "Cashless Online Checkout via VietQR / ZaloPay",
    "Retail Customer", "Payment Gateway (VietQR / ZaloPay)",
    "Customer cart contains at least one item; stock is verified available.",
    "Order created in database with status 'Pending'; dynamic VietQR code displayed.",
    "Customer clicks 'Proceed to Checkout' and chooses VietQR or ZaloPay.",
    [
        "Customer provides shipping information and selects payment method (VietQR / ZaloPay).",
        "System checks active website_visits session ID.",
        "System opens transaction and creates order record with status = 'Pending', total_amount, and session_id.",
        "System creates order_items records capturing checkout unit prices.",
        "System constructs VietQR payment payload using banking standard NAPAS 24/7 format with order_id reference.",
        "Frontend displays dynamic QR code and countdown timer for payment transfer.",
        "Customer scans QR code using mobile banking app and completes fund transfer."
    ],
    [
        "A1: Customer selects COD (Cash on Delivery): System sets payment_method = 'COD' and transitions order directly to 'Packing'."
    ],
    [
        "E1: Selected item goes out of stock prior to checkout submit: System halts checkout and prompts customer to update cart."
    ],
    "Order session_id must strictly preserve website_visits tracking for conversion metric accuracy."
)

# UC-10
add_usecase_spec_table(
    anchor_textual_uc,
    "UC-10", "Order Fulfillment Lifecycle and Automated Stock Deduction",
    "Inventory / Sales Staff, Payment Webhook", "Orders, Inventory & Transactions",
    "Order exists in database; payment callback received or staff advances order state.",
    "Order status updated; inventory stock decremented; sale audit transaction logged.",
    "Payment gateway callback triggers or staff updates order fulfillment status.",
    [
        "Payment webhook signals successful fund transfer (or staff marks Paid).",
        "System initiates atomic database transaction (BEGIN).",
        "System updates order status to 'Paid' (or 'Packing', 'Shipped', 'Completed').",
        "System iterates through order_items: locks variant rows (FOR UPDATE), checks stock_quantity >= item.quantity.",
        "System executes UPDATE product_variants SET stock_quantity = stock_quantity - quantity.",
        "System inserts inventory_transactions record with type = 'Sale' and negative change_quantity.",
        "System commits transaction (COMMIT).",
        "System triggers Low-Stock alert check if any variant dropped below threshold.",
        "Dashboard metrics automatically reflect updated revenue and converted session."
    ],
    [
        "A1: Order cancelled by customer or staff before shipment: System transitions order to 'Cancelled' and reverses inventory deduction if already applied."
    ],
    [
        "E1: Insufficient stock during deduction: System raises conflict error, rolls back transaction, and flags order for manual staff resolution."
    ],
    "Stock deduction must strictly execute under row-level locking to prevent race conditions during high concurrent traffic."
)

# ---------------------------------------------------------
# 4. Fill 3.3: Functional Requirements
# ---------------------------------------------------------
print("Writing Section 3.3: Functional Requirements...")
add_paragraph_before(
    anchor_fr,
    "The Functional Requirements (FR) define the complete set of system capabilities and behaviors required by the Computer Shop Management Software. These requirements are categorized into four logical subsystems corresponding to the core project modules and prioritized using the MoSCoW framework (Must Have, Should Have, Could Have).",
    space_after=8
)

fr_headers = ["Req ID", "Subsystem", "Requirement Title & Functional Description", "Input Parameters", "Processing Logic & Output", "Priority"]
fr_data = [
    [
        "FR-01", "Module 1",
        "Customer Registration: Allows visitors to create customer accounts.",
        "Username, Password, Full Name, Email, Phone.",
        "Validates uniqueness of username/email; hashes password with Bcrypt (cost 12); inserts into users with Customer role. Output: HTTP 201 & User ID.",
        "Must Have"
    ],
    [
        "FR-02", "Module 1",
        "JWT Authentication: Authenticates users and returns signed JWT bearer tokens.",
        "Username/Email identifier, Plaintext password.",
        "Bcrypt constant-time hash verification; checks is_active; signs JWT with role claim (1-day expiration); updates last_login_at. Output: Token & User Profile.",
        "Must Have"
    ],
    [
        "FR-03", "Module 1",
        "Role-Based Access Control (RBAC): Enforces granular access restrictions.",
        "Authorization Header (Bearer JWT token).",
        "Middleware verifies token signature, extracts role claim, checks against route whitelist (Admin/Staff). Output: Access granted or HTTP 403 Forbidden.",
        "Must Have"
    ],
    [
        "FR-04", "Module 1",
        "Sales & Conversion Dashboard: Provides executive KPIs and revenue analytics.",
        "Date range filter (From Date, To Date).",
        "Aggregates total revenue (Paid, Packing, Shipped, Completed), order count, and tracks unique session conversion rate. Output: KPI Summary JSON.",
        "Must Have"
    ],
    [
        "FR-05", "Module 2",
        "Hardware Category Management: CRUD operations for component categories.",
        "Category Name, Description.",
        "Maintains uniqueness of category names; restricts deletion if active products exist. Output: Category list with active product count.",
        "Must Have"
    ],
    [
        "FR-06", "Module 2",
        "Hardware Product Management: CRUD operations for computer components.",
        "Name, Brand, Category ID, Description.",
        "Atomic validation and persistence; supports product updates while preserving historical order item references. Output: Product entity details.",
        "Must Have"
    ],
    [
        "FR-07", "Module 2",
        "SKU Variants & Pricing: Manages physical variants, prices, and stock.",
        "Product ID, SKU, Price, Initial Stock, Low-Stock Threshold.",
        "Enforces global uniqueness of SKU; validates price >= 0 and stock >= 0; supports multiple variants per product. Output: Variant record.",
        "Must Have"
    ],
    [
        "FR-08", "Module 2",
        "Technical Specifications Registry: Configures hardware spec attributes.",
        "Spec Name (e.g. Socket, RAM Bus, VRAM, TDP).",
        "Maintains normalized specs list; links products to specs with arbitrary values via product_specs. Output: Spec registry entity.",
        "Must Have"
    ],
    [
        "FR-09", "Module 2",
        "Multi-Criteria Specs Filtering: Searches hardware by technical specs.",
        "Category, Brand, Min/Max Price, In-Stock, Spec Key-Values (specs[Socket]=LGA1700).",
        "Constructs dynamic SQL queries with parameterized EXISTS predicates for each specification attribute; supports sorting. Output: Filtered product page.",
        "Must Have"
    ],
    [
        "FR-10", "Module 2",
        "Dynamic Filter Sidebar Options: Aggregates available spec values.",
        "None (GET /api/products/filter-options/all).",
        "Executes DISTINCT aggregations across product_specs, brands, and categories to supply frontend sidebar dropdown options. Output: Filter options JSON.",
        "Should Have"
    ],
    [
        "FR-11", "Module 3",
        "Shopping Cart Management: Client-side component selection and total calculation.",
        "Variant ID, Quantity.",
        "Calculates line item subtotals (quantity * unit price); persists cart state across storefront navigation. Output: Cart summary.",
        "Must Have"
    ],
    [
        "FR-12", "Module 3",
        "Real-Time Stock Validation: Verifies component availability before checkout.",
        "Variant ID, Requested Quantity.",
        "Queries live stock_quantity in product_variants; warns if requested quantity exceeds inventory. Output: Stock validation status.",
        "Must Have"
    ],
    [
        "FR-13", "Module 3",
        "Dynamic VietQR Checkout: Generates VietQR code for cashless payment.",
        "Order ID, Total Amount.",
        "Encodes NAPAS 24/7 banking string with transaction reference; displays scannable QR code. Output: VietQR image string.",
        "Must Have"
    ],
    [
        "FR-14", "Module 3",
        "E-Wallet Payment Gateway Integration: Handles ZaloPay and VietQR callbacks.",
        "Payment Callback Payload (Order ID, Payment Status).",
        "Verifies cryptographic signature; updates order status from Pending to Paid. Output: Callback acknowledgment.",
        "Should Have"
    ],
    [
        "FR-15", "Module 3",
        "Storefront Session Tracking: Records visitor sessions for conversion KPI.",
        "Browser Session UUID.",
        "Inserts into website_visits; associates session_id with orders created during that visit. Output: HTTP 200 visit recorded.",
        "Should Have"
    ],
    [
        "FR-16", "Module 4",
        "Order Fulfillment Lifecycle: Advances order status across pipeline.",
        "Order ID, New Status (Packing, Shipped, Completed, Cancelled).",
        "Validates allowed state transitions; restricts invalid skips; triggers stock deduction upon Paid/Packing. Output: Updated order record.",
        "Must Have"
    ],
    [
        "FR-17", "Module 4",
        "Atomic Stock Deduction: Decrements inventory upon successful order checkout.",
        "Order Items List (Variant ID, Quantity).",
        "Executes row-locked (FOR UPDATE) decrement; verifies sufficient stock; logs Sale audit transaction. Output: Decremented stock levels.",
        "Must Have"
    ],
    [
        "FR-18", "Module 4",
        "Batch Restock & Low-Stock Alerts: Manages warehouse intake and alert feed.",
        "Batch Code, Supplier Notes, Items List (SKU, Quantity).",
        "Executes multi-item atomic increment; queries variants where stock <= threshold; calculates deficit quantity. Output: Restock summary & alert list.",
        "Must Have"
    ]
]

add_paragraph_before(anchor_fr, "Table 3.12: Functional Requirements Specification Matrix", italic=True, space_after=4)
add_table_before(anchor_fr, fr_headers, fr_data, [0.8, 0.9, 2.3, 1.4, 2.4, 0.9])
add_paragraph_before(anchor_fr, "", space_after=12)

# ---------------------------------------------------------
# 5. Fill 3.4: Non-Functional Requirements
# ---------------------------------------------------------
print("Writing Section 3.4: Non-Functional Requirements...")
add_paragraph_before(
    anchor_nfr,
    "The Non-Functional Requirements (NFR) specify quality attributes, security standards, operational constraints, and performance benchmarks governing system execution. These criteria are aligned with the ISO/IEC 25010 Software Engineering Product Quality Model to ensure production readiness, high reliability, and data protection.",
    space_after=8
)

nfr_headers = ["NFR ID", "Quality Characteristic", "Engineering Specification", "Verification Metric & Target Benchmark"]
nfr_data = [
    [
        "NFR-01", "Performance Efficiency (Latency)",
        "API endpoints must process and respond to standard client requests within sub-second thresholds under normal operating loads.",
        "Average HTTP API latency < 500ms; 95th percentile latency < 1000ms for complex multi-criteria specs filtering queries."
    ],
    [
        "NFR-02", "Performance Efficiency (Database)",
        "Relational database queries must utilize B-tree indexes across all foreign keys, SKU columns, and spec attributes.",
        "Query execution time < 100ms for catalog listings; zero full table scans on large inventory variant tables."
    ],
    [
        "NFR-03", "Security (Authentication & RBAC)",
        "User authentication must be stateless and cryptographically verified using JWT tokens with HMAC-SHA256 signatures.",
        "JWT secret key >= 32 characters; token expiration set to 24 hours; role-based route guards intercept 100% of unauthorized admin requests."
    ],
    [
        "NFR-04", "Security (Data Protection & SQLi)",
        "All data exchanges must defend against common web vulnerabilities including SQL Injection (SQLi) and Cross-Site Scripting (XSS).",
        "100% parameterized SQL statements (e.g. $1, $2); Helmet security headers enabled; password hashing with Bcrypt salt rounds >= 12."
    ],
    [
        "NFR-05", "Reliability & Fault Tolerance",
        "Multi-step database updates (batch restock, order placement with stock deduction) must guarantee strict ACID compliance.",
        "Zero partial write discrepancies; transactions roll back completely on runtime errors; central error handling catches all uncaught exceptions."
    ],
    [
        "NFR-06", "Usability & Accessibility",
        "User interfaces must render responsively across standard desktop and mobile viewports with intuitive filtering feedback.",
        "Page load time < 1.5s; clear visual stock status badges (In Stock, Low Stock, Out of Stock); immediate error toast notifications."
    ],
    [
        "NFR-07", "Maintainability & Modularity",
        "Source code must adhere strictly to 4-Tier Layered MVC architecture with decoupled separation of concerns.",
        "Zero circular dependencies; repositories encapsulate all SQL; services manage domain rules; controllers handle HTTP request/response formatting."
    ],
    [
        "NFR-08", "Capacity & Rate Limiting",
        "The backend API gateway must defend against denial-of-service and brute-force credential attacks.",
        "Express rate-limiter restricts client traffic to 300 requests per 15-minute window per IP address; returns HTTP 429 upon threshold breach."
    ]
]

add_paragraph_before(anchor_nfr, "Table 3.13: Non-Functional Requirements Specification (ISO/IEC 25010)", italic=True, space_after=4)
add_table_before(anchor_nfr, nfr_headers, nfr_data, [0.9, 1.5, 2.8, 2.5])
add_paragraph_before(anchor_nfr, "", space_after=12)

# ---------------------------------------------------------
# 6. Fill 5.2: Static Model – Class Diagrams
# ---------------------------------------------------------
print("Writing Section 5.2: Static Model – Class Diagrams...")
add_paragraph_before(
    anchor_class_diag,
    "The static design model formalizes the object-oriented structural layout of the Computer Shop Management Software. It encapsulates the system's domain entities, operational attributes, behavioral member methods, and inter-class relationships. The architecture adheres to Clean Architecture and 4-Tier Layered MVC principles, establishing a unidirectional dependency flow from Presentation Controllers to Domain Services and Persistence Repositories.",
    space_after=8
)

add_image_before(
    anchor_class_diag,
    os.path.join(diagrams_dir, "class_diagram_overall.png"),
    "Figure 5.2: Comprehensive Static Model – UML Class Diagram for Computer Shop Management Software",
    width_inches=6.4
)

add_paragraph_before(
    anchor_class_diag,
    "As depicted in Figure 5.2, the structural model captures domain entities and business service facades. Key architectural relationships and multiplicity constraints include:",
    space_after=6
)

class_spec_headers = ["Class / Entity", "Classification", "Key Attributes & Methods", "Structural Relationship & Multiplicity Semantics"]
class_spec_data = [
    [
        "Product",
        "Domain Entity",
        "+ product_id: Long\n+ name, brand: String\n+ category_id: Long\n+ getVariants(), getSpecs()\n+ getTotalStock(), getPriceRange()",
        "Composition (1 to 1..*) with ProductVariant: a product cannot exist without variants; deleting a product cascades deletion to all its variants."
    ],
    [
        "ProductVariant",
        "Domain Entity",
        "+ variant_id: Long\n+ sku: String (Unique)\n+ price: Decimal\n+ stock_quantity, low_stock_threshold: Integer\n+ isLowStock(), adjustStock()",
        "Composition child of Product; Association (1 to 0..*) with OrderItem and InventoryTransaction. Represents the physical purchasable SKU."
    ],
    [
        "Category",
        "Domain Entity",
        "+ category_id: Long\n+ name, description: String\n+ getProducts(): List<Product>",
        "Aggregation (1 to 0..*) with Product: categories group hardware items. A category can exist independently of whether products are currently assigned to it."
    ],
    [
        "Spec & ProductSpec",
        "Domain Entity",
        "+ spec_id: Long, spec_name: String\n+ product_id, spec_id: Long\n+ spec_value: String",
        "Spec aggregates ProductSpec (1 to 0..*), while Product composes ProductSpec (1 to 0..*). Enables arbitrary dynamic technical attributes per hardware component."
    ],
    [
        "InventoryTransaction",
        "Domain Entity",
        "+ transaction_id, variant_id: Long\n+ change_quantity: Integer\n+ transaction_type: String\n+ notes: String, created_by: Long",
        "Association (0..* to 1) with ProductVariant and User. Provides an immutable audit trail for all stock movements (Import, Sale, Adjustment)."
    ],
    [
        "Order & OrderItem",
        "Domain Entity",
        "+ order_id, user_id: Long\n+ total_amount: Decimal, status: String\n+ item_id, variant_id, quantity, unit_price",
        "Order composes OrderItem (1 to 1..*); Order is associated with User (0..* to 1). Captures financial transactions and checkout line items."
    ],
    [
        "User & Role",
        "Domain Entity",
        "+ user_id: Long, username, email: String\n+ role_id: Long, is_active: Boolean\n+ authenticate(), hasRole()",
        "Role aggregates User (1 to 0..*). Manages system authentication and role-based permissions (Admin, Staff, Customer)."
    ],
    [
        "ProductService",
        "Domain Service",
        "+ listProducts(filters): PageResult\n+ createProduct(dto): ProductDTO\n+ getFilterOptions(): FilterOptionsDTO",
        "Business layer facade orchestrating category checks, SKU uniqueness verification, and multi-criteria specs query assembly."
    ],
    [
        "InventoryService",
        "Domain Service",
        "+ listInventory(filters): InvPage\n+ getLowStockAlerts(): List<Alert>\n+ batchRestock(dto): BatchResult\n+ deductStockForOrder(client, items)",
        "Encapsulates transactional warehouse operations: batch inward receipts, stock reconciliations, low-stock threshold triggers, and atomic order deductions."
    ]
]

add_paragraph_before(anchor_class_diag, "Table 5.11: Class Model Design Specification and Association Semantics", italic=True, space_after=4)
add_table_before(anchor_class_diag, class_spec_headers, class_spec_data, [1.4, 1.2, 2.5, 2.6])

add_paragraph_before(
    anchor_class_diag,
    "The separation between domain entities and application services guarantees that database operations and business logic remain isolated from transport layers (Express routes and HTTP controllers). Entity-to-DTO mapping ensures that internal state (such as password hashes or raw table IDs) is never exposed inappropriately to client storefronts.",
    space_after=12
)

# ---------------------------------------------------------
# 7. Update Table 5.10: Requirements Traceability Matrix
# ---------------------------------------------------------
print("Updating Table 5.10: Requirements Traceability Matrix to cover FR-01 through FR-18...")
rtm_table = None
for t in doc.tables:
    if t.rows and len(t.rows[0].cells) >= 5 and "Requirement ID" in t.rows[0].cells[0].text:
        rtm_table = t
        break

if rtm_table is not None:
    print(f"Found RTM table with {len(rtm_table.rows)} rows and {len(rtm_table.columns)} columns.")
    
    full_rtm_data = [
        ["FR-01", "Customer Account Self-Registration", "users, roles", "AuthService, UserRepository", "/api/auth/register, Register UI"],
        ["FR-02", "Stateless JWT Authentication & Session Token", "users, roles", "AuthService, JWTGuard", "/api/auth/login, Login UI"],
        ["FR-03", "Role-Based Access Control (RBAC) Enforcement", "users, roles", "authorizeMiddleware, UserRepo", "API Route Guards (/admin, /users)"],
        ["FR-04", "Business Analytics & Conversion Dashboard", "orders, order_items, website_visits", "DashboardService, DashboardRepo", "/api/admin/dashboard, Dashboard UI"],
        ["FR-05", "Hardware Category Management (CRUD)", "categories, products", "CategoryService, CategoryRepo", "/api/categories, Admin Portal"],
        ["FR-06", "Hardware Product Management (CRUD)", "products, categories", "ProductService, ProductRepo", "/api/products, Admin Products UI"],
        ["FR-07", "SKU Variants & Flexible Pricing Management", "product_variants, products", "ProductService, ProductRepo", "/api/products/:id/variants"],
        ["FR-08", "Technical Specification Attributes Registry", "specs, product_specs", "SpecService, SpecRepo", "/api/specs, Specs Manager"],
        ["FR-09", "Multi-Criteria Specs Search & Filtering", "products, product_specs, specs, variants", "ProductService, ProductRepo", "/api/products, Storefront Filter"],
        ["FR-10", "Dynamic Filter Sidebar Options Aggregation", "specs, product_specs, categories, products", "ProductService, SpecRepo", "/api/products/filter-options/all"],
        ["FR-11", "Shopping Cart Management & Subtotal Calc", "product_variants", "CartService, StorefrontApp", "/cart, Storefront Drawer"],
        ["FR-12", "Real-Time Stock Availability Validation", "product_variants", "InventoryService, ProductRepo", "/api/products/:id, Cart Check"],
        ["FR-13", "Dynamic VietQR Payment Code Generation", "orders, order_items", "PaymentService, VietQRHelper", "/checkout, VietQR Modal"],
        ["FR-14", "Cashless E-Wallet Payment Gateway Callback", "orders, order_items", "PaymentService, OrderRepo", "/api/payment/callback"],
        ["FR-15", "Storefront Session Tracking & Attribution", "website_visits, orders", "VisitService, VisitRepo", "/api/visits, Session Tracker"],
        ["FR-16", "Order Fulfillment Lifecycle Management", "orders, order_items", "OrderService, OrderRepo", "/api/admin/orders, Order Status UI"],
        ["FR-17", "Atomic Inventory Stock Deduction on Sale", "product_variants, inventory_transactions", "InventoryService, InventoryRepo", "Order Checkout Service"],
        ["FR-18", "Batch Inward Restock & Low-Stock Alerts", "product_variants, inventory_transactions", "InventoryService, InventoryRepo", "/api/inventory/restock-batch, /low-stock"]
    ]
    
    # Remove existing body rows
    while len(rtm_table.rows) > 1:
        tr = rtm_table.rows[1]._tr
        tr.getparent().remove(tr)
        
    # Append new rows
    for r_idx, r_data in enumerate(full_rtm_data):
        row = rtm_table.add_row()
        bg_color = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(r_data):
            cell = row.cells[c_idx]
            is_code = (c_idx == 0)
            align = WD_ALIGN_PARAGRAPH.CENTER if is_code else WD_ALIGN_PARAGRAPH.LEFT
            style_body_cell(cell, val, bold=is_code, align=align, size=9.0, bg=bg_color)
            
    # Set widths for RTM
    rtm_widths = [0.8, 2.2, 1.8, 1.8, 1.6]
    for row in rtm_table.rows:
        for c_idx, w in enumerate(rtm_widths):
            row.cells[c_idx].width = Inches(w)

# ---------------------------------------------------------
# 8. Clean up placeholder TODO paragraphs
# ---------------------------------------------------------
print("Cleaning up placeholder TODO paragraphs...")
placeholders_to_remove = [
    anchor_todo_req,
    anchor_stakeholders,
    anchor_graphical_uc,
    anchor_textual_uc,
    anchor_fr,
    anchor_nfr,
    anchor_class_diag
]

for p in placeholders_to_remove:
    if p is not None:
        p_elem = p._p
        parent = p_elem.getparent()
        if parent is not None:
            parent.remove(p_elem)

# Save document
print("Saving updated document...")
doc.save(doc_path)
print("SUCCESS: 524H00057_524H0069_524H0052.docx updated thoroughly for Member 2!")
