import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_TARGET = os.path.join(os.path.dirname(__file__), "..", "..", "524H0057_524H0069_524H0052_FinalReport.docx")

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=70, bottom=70, left=100, right=100):
    tcPr = cell._element.get_or_add_tcPr()
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def format_table(table, header_bg="1E3A8A", alt_bg="F8FAFC"):
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(table.rows):
        is_header = (r_idx == 0)
        bg = header_bg if is_header else (alt_bg if r_idx % 2 == 1 else "FFFFFF")
        for cell in row.cells:
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=100, right=100)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.name = "Arial"
                    if is_header:
                        run.font.bold = True
                        run.font.color.rgb = RGBColor(255, 255, 255)
                        run.font.size = Pt(9.5)
                    else:
                        run.font.size = Pt(9)
                        run.font.color.rgb = RGBColor(30, 41, 59)

def create_styled_table(doc, headers, data, header_bg="1E3A8A"):
    t = doc.add_table(rows=len(data) + 1, cols=len(headers))
    for c_idx, h in enumerate(headers):
        t.rows[0].cells[c_idx].text = h
    for r_idx, row_values in enumerate(data, start=1):
        for c_idx, val in enumerate(row_values):
            t.rows[r_idx].cells[c_idx].text = str(val)
    format_table(t, header_bg=header_bg)
    return t

def main():
    doc = docx.Document(DOC_TARGET)
    print("Loaded:", DOC_TARGET)

    # 1. Insert Table 3.3 (UC-02) before Table 3.4
    p_t34 = None
    for p in doc.paragraphs:
        if "Table 3.4: Textual Specification for Manage System User" in p.text:
            p_t34 = p
            break

    if p_t34 is not None:
        print("Inserting Table 3.3 (UC-02: Register Customer Account)...")
        p_cap = p_t34.insert_paragraph_before("Table 3.3: Textual Specification for Register Customer Account (UC-02)")
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(10)

        uc_02_headers = ["Element", "Specification Details"]
        uc_02_data = [
            ("Use Case ID & Name", "UC-02: Register Customer Account"),
            ("Primary Actor", "Unauthenticated Guest / Retail Customer"),
            ("Stakeholders & Interests", "Retail Customers: Desire immediate registration with minimal friction to track orders and save shipping addresses.\nStore Administrators: Require valid customer contact profiles and verified credentials."),
            ("Pre-conditions", "Guest user accesses storefront with active network connectivity; customer is not currently logged in."),
            ("Post-conditions", "New customer record persisted in users table with role_id = 3 (Customer), is_active = TRUE, Bcrypt-hashed password (cost 12); JWT session issued."),
            ("Trigger", "Customer clicks 'Đăng ký' (Register) in storefront top navigation or checkout authentication prompt."),
            ("Main Success Scenario", "1. Guest clicks Register button to display modal registration dialog.\n2. Guest inputs Full Name, Username, Email, Phone Number, and Password.\n3. Frontend validates phone (10-digit VN regex), email pattern, and password length (min 8 chars).\n4. Client submits POST /api/auth/register with user payload.\n5. Backend checks uniqueness of username and email in PostgreSQL users table.\n6. Backend hashes password using Bcrypt with 12 salt rounds.\n7. Backend inserts new record into users table with role_id = 3.\n8. Backend generates signed HMAC-SHA256 JWT access token.\n9. Backend responds HTTP 201 Created with user info and JWT.\n10. Client stores token in sessionStorage, updates header with user initials, and closes modal."),
            ("Extensions / Alternative Flows", "5a. Username or Email already exists:\n    - Backend returns HTTP 409 Conflict with specific collision detail.\n    - Client displays inline validation error message.\n3a. Client validation fails:\n    - Error state highlighted immediately without API roundtrip."),
            ("Special Requirements & Business Rules", "BR-01: Plaintext passwords must never be logged or stored in database.\nBR-02: Input sanitization enforced via Helmet and parameterized SQL queries.")
        ]
        t_uc02 = create_styled_table(doc, uc_02_headers, uc_02_data)
        p_t34._element.addprevious(t_uc02._element)
        p_t34.insert_paragraph_before("")

    # 2. Insert Table 3.5 (UC-04) before Table 3.6
    p_t36 = None
    for p in doc.paragraphs:
        if "Table 3.6: Textual Specification for Manage Hardware Categories" in p.text:
            p_t36 = p
            break

    if p_t36 is not None:
        print("Inserting Table 3.5 (UC-04: View Sales and Revenue Dashboard)...")
        p_cap = p_t36.insert_paragraph_before("Table 3.5: Textual Specification for View Sales and Revenue Dashboard (UC-04)")
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(10)

        uc_04_headers = ["Element", "Specification Details"]
        uc_04_data = [
            ("Use Case ID & Name", "UC-04: View Sales and Revenue Dashboard"),
            ("Primary Actor", "Systems Administrator / Store Manager"),
            ("Stakeholders & Interests", "Store Management: Needs real-time, accurate visibility into gross sales revenue, order fulfillment velocity, visitor conversion rate, and inventory depletion risks.\nInventory Staff: Needs rapid identification of SKUs requiring urgent restock."),
            ("Pre-conditions", "Administrator is authenticated with valid JWT token possessing role_name = 'Admin'."),
            ("Post-conditions", "Dashboard interface displays synchronized KPI summary cards, date-filtered revenue metrics, order status distribution, and real-time low-stock alerts without modifying persistent state."),
            ("Trigger", "Admin logs in or clicks 'Dashboard' in the administrative management portal header."),
            ("Main Success Scenario", "1. Administrator selects target reporting date range (default: 30 days).\n2. Administrative SPA issues GET /api/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD with Bearer JWT.\n3. Middleware authenticate() validates token integrity and expiration.\n4. Middleware authorize('Admin') verifies administrative RBAC clearance.\n5. OrderService aggregates total revenue from orders where status in ('Paid', 'Packing', 'Shipped', 'Completed').\n6. OrderService computes visitor session conversion rate (Paid Orders / Distinct website_visits * 100).\n7. InventoryService queries product_variants for SKUs where stock_quantity <= low_stock_threshold.\n8. Backend returns HTTP 200 OK with aggregated KPI metrics and low-stock alert feed.\n9. Admin Portal renders 4 KPI metric cards, date-filter bar, and inventory alert table."),
            ("Extensions / Alternative Flows", "3a. JWT token missing or expired:\n    - Backend returns HTTP 401 Unauthorized.\n    - Admin Portal clears invalid session and opens login modal.\n4a. Authenticated user has Staff or Customer role:\n    - Backend returns HTTP 403 Forbidden.\n    - Admin Portal displays access restriction warning."),
            ("Special Requirements & Business Rules", "BR-03: Dashboard metrics must reflect committed database state with sub-100ms response time using covering indexes on orders(created_at, status) and website_visits(visited_at).")
        ]
        t_uc04 = create_styled_table(doc, uc_04_headers, uc_04_data)
        p_t36._element.addprevious(t_uc04._element)
        p_t36.insert_paragraph_before("")

    # 3. Insert Table 5.8 (Website_Visits) before Table 5.9
    p_t59 = None
    for p in doc.paragraphs:
        if "Table 5.9: Data Dictionary — Orders" in p.text:
            p_t59 = p
            break

    if p_t59 is not None:
        print("Inserting Table 5.8 (Data Dictionary — Website_Visits)...")
        p_cap = p_t59.insert_paragraph_before("Table 5.8: Data Dictionary — Website_Visits")
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(10)

        visits_headers = ["Column Name", "Data Type", "Constraints", "Description"]
        visits_data = [
            ("session_id", "VARCHAR(100)", "PRIMARY KEY, NOT NULL", "Unique visitor browser session UUID generated on client entry"),
            ("user_id", "BIGINT", "FK (users.user_id), NULLABLE", "Optional foreign key referencing authenticated customer account"),
            ("visited_at", "TIMESTAMPTZ", "NOT NULL DEFAULT CURRENT_TIMESTAMP", "Timestamp of storefront landing for conversion rate tracking")
        ]
        t_v = create_styled_table(doc, visits_headers, visits_data)
        p_t59._element.addprevious(t_v._element)
        p_t59.insert_paragraph_before("")

    # 4. Insert Table 5.11 (Inventory_Transactions) before Table 5.12
    p_t512 = None
    for p in doc.paragraphs:
        if "Table 5.12: Class Model Design Specification" in p.text:
            p_t512 = p
            break

    if p_t512 is not None:
        print("Inserting Table 5.11 (Data Dictionary — Inventory_Transactions)...")
        p_cap = p_t512.insert_paragraph_before("Table 5.11: Data Dictionary — Inventory_Transactions")
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(10)

        inv_trans_headers = ["Column Name", "Data Type", "Constraints", "Description"]
        inv_trans_data = [
            ("transaction_id", "BIGSERIAL", "PRIMARY KEY, NOT NULL", "Unique auto-incrementing inventory audit transaction ID"),
            ("variant_id", "BIGINT", "FK (product_variants.variant_id), NOT NULL", "Target hardware SKU variant receiving inventory modification"),
            ("change_quantity", "INTEGER", "NOT NULL", "Signed quantity delta (+ for Restock/Return, - for Sale)"),
            ("transaction_type", "VARCHAR(30)", "CHECK IN ('Import', 'Sale', 'Adjustment', 'Return')", "Business categorization of inventory movement"),
            ("notes", "TEXT", "NULLABLE", "Operational context (Purchase Order number, supplier, RMA)"),
            ("created_by", "BIGINT", "FK (users.user_id), NULLABLE", "Staff or Admin user ID who initiated or verified transaction"),
            ("created_at", "TIMESTAMPTZ", "NOT NULL DEFAULT CURRENT_TIMESTAMP", "Immutable timestamp of transaction persistence")
        ]
        t_inv = create_styled_table(doc, inv_trans_headers, inv_trans_data)
        p_t512._element.addprevious(t_inv._element)
        p_t512.insert_paragraph_before("")

    doc.save(DOC_TARGET)
    print("Successfully inserted all 4 missing tables into:", DOC_TARGET)

if __name__ == "__main__":
    main()
