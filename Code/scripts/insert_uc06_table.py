import os
import docx
from docx.shared import Pt, RGBColor
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

def main():
    doc = docx.Document(DOC_TARGET)
    
    # Locate Table 3.8
    p_t38 = None
    for p in doc.paragraphs:
        if "Table 3.8: Textual Specification for Configure Technical Specifications" in p.text:
            p_t38 = p
            break
            
    if p_t38 is not None:
        print("Inserting Table 3.7: Textual Specification for Manage Computer Hardware Products (UC-06)...")
        p_cap = p_t38.insert_paragraph_before("Table 3.7: Textual Specification for Manage Computer Hardware Products (UC-06)")
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(10)

        uc_06_headers = ["Element", "Specification Details"]
        uc_06_data = [
            ("Use Case ID & Name", "UC-06: Manage Computer Hardware Products"),
            ("Primary Actor", "Inventory / Sales Staff, Systems Administrator"),
            ("Stakeholders & Interests", "Store Management: Requires an accurate, rich hardware catalog with official brand designations.\nCustomers: Need complete product descriptions and authentic hardware imagery."),
            ("Pre-conditions", "User is authenticated with Staff or Admin role and holds a valid Bearer JWT session."),
            ("Post-conditions", "Hardware product record persisted in products table linked to appropriate category_id; cache invalidated."),
            ("Trigger", "Staff navigates to Products section in Admin Portal and clicks 'Thêm sản phẩm' (Add Product) or edits existing SKU."),
            ("Main Success Scenario", "1. Staff opens Products management screen.\n2. Admin Portal issues GET /api/products and GET /api/categories to populate catalog view.\n3. Staff inputs Product Name, Brand (e.g. ASUS, MSI, Corsair), Category ID, Description, and Image URL.\n4. Staff clicks 'Lưu sản phẩm' (Save Product).\n5. Frontend sends POST /api/admin/products with validated JSON payload.\n6. Backend verifies JWT authentication and Staff/Admin RBAC clearance.\n7. ProductService inserts new record into PostgreSQL products table.\n8. Backend returns HTTP 201 Created with persisted product entity.\n9. Admin Portal renders success notification and updates product table dynamically."),
            ("Extensions / Alternative Flows", "5a. Mandatory fields missing:\n    - Backend returns HTTP 400 Bad Request with missing field array.\n    - Admin Portal highlights input fields with red validation borders.\n6a. Unauthorized access attempt:\n    - Backend returns HTTP 403 Forbidden."),
            ("Special Requirements & Business Rules", "BR-04: Image URLs must point to verified static asset paths (/public/images/...) or whitelisted HTTPS CDNs.")
        ]
        
        t = doc.add_table(rows=len(uc_06_data) + 1, cols=2)
        for c_idx, h in enumerate(uc_06_headers):
            t.rows[0].cells[c_idx].text = h
        for r_idx, (k, v) in enumerate(uc_06_data, start=1):
            t.rows[r_idx].cells[0].text = k
            t.rows[r_idx].cells[1].text = v
        format_table(t, header_bg="1E3A8A")
        
        p_t38._element.addprevious(t._element)
        p_t38.insert_paragraph_before("")
        
    doc.save(DOC_TARGET)
    print("Saved with Table 3.7 inserted!")

if __name__ == "__main__":
    main()
