import os
import sys
import zipfile
import shutil
import tempfile
import xml.etree.ElementTree as ET
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DOC_PATH = os.path.join(BASE_DIR, "524H00057_524H0069_524H0052_updated.docx")
DIAG_DIR = os.path.join(BASE_DIR, "Code", "docs", "diagrams")

# Cohesive Palette Constants
COLOR_NAVY = "1E3A8A"        # Deep Navy for Table Headers
COLOR_ALT_ROW = "F8FAFC"     # Slate 50 for alternating rows
COLOR_WHITE = "FFFFFF"
COLOR_BORDER = "CBD5E1"      # Slate 300 for subtle borders
COLOR_BLACK = RGBColor(0, 0, 0)
COLOR_WHITE_RGB = RGBColor(255, 255, 255)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    for shd in tcPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd'):
        tcPr.remove(shd)
    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=70, bottom=70, left=110, right=110):
    tcPr = cell._element.get_or_add_tcPr()
    for tcMar in tcPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tcMar'):
        tcPr.remove(tcMar)
    tcMar = parse_xml(
        f'<w:tcMar {nsdecls("w")}>'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def format_unified_table(table):
    """Formats every table to the exact unified Navy/Slate theme."""
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(table.rows):
        trPr = row._element.get_or_add_trPr()
        if trPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}cantSplit') is None:
            trPr.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
        
        is_header = (r_idx == 0)
        if is_header:
            if trPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tblHeader') is None:
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
            bg = COLOR_NAVY
        else:
            bg = COLOR_ALT_ROW if r_idx % 2 == 1 else COLOR_WHITE

        for cell in row.cells:
            set_cell_background(cell, bg)
            set_cell_margins(cell, top=70, bottom=70, left=110, right=110)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            for p in cell.paragraphs:
                for run in p.runs:
                    run.font.name = "Arial"
                    if is_header:
                        run.font.bold = True
                        run.font.color.rgb = COLOR_WHITE_RGB
                        run.font.size = Pt(9.5)
                    else:
                        run.font.size = Pt(9.0)
                        run.font.color.rgb = COLOR_BLACK

def add_leader_entry(doc, before_p, title, page_str):
    p = before_p.insert_paragraph_before()
    p.style = doc.styles["table of figures"]
    pPr = p._element.get_or_add_pPr()
    tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="8777"/></w:tabs>')
    pPr.append(tabs)
    
    r_txt = p.add_run(title)
    r_txt.font.name = "Arial"
    r_txt.font.size = Pt(10)
    r_txt.font.color.rgb = COLOR_BLACK
    
    p.add_run("\t")
    
    r_pg = p.add_run(page_str)
    r_pg.font.name = "Arial"
    r_pg.font.size = Pt(10)
    r_pg.font.color.rgb = COLOR_BLACK
    return p

def main():
    print(f"Loading document directly from: {DOC_PATH}")
    doc = docx.Document(DOC_PATH)

    # =========================================================================
    # 1. FIX FIGURE CAPTIONS AND EMBED HIGH-RES UNIFIED DIAGRAMS
    # =========================================================================
    print("Step 1: Updating figure captions and replacing diagrams...")
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        # Fix missing figure numbers in captions
        if "Figure .: System Architecture Data Flow Model" in txt:
            p.text = "Figure 4.1: System Architecture Data Flow Model"
            print("Fixed caption for Figure 4.1")
        elif "Figure .: Entity Relationship Diagram (ERD)" in txt:
            p.text = "Figure 5.1: Entity Relationship Diagram (ERD) for Computer Shop Management Software"
            print("Fixed caption for Figure 5.1")
        elif txt.startswith("Figure 2.1: GitHub Repository Commit History demonstrating"):
            p.text = "Figure 2.1: GitHub Repository Commit History and Continuous Contribution Breakdown"
            print("Standardized caption for Figure 2.1")
        elif txt.startswith("Figure 5.5: UML Sequence Diagram — Online Checkout"):
            p.text = "Figure 5.5: UML Sequence Diagram — Batch Inward Restock & Low-Stock Alerts (UC-14..UC-15)"
            print("Standardized caption for Figure 5.5")

    # Replace diagrams with high-res files
    replacements = [
        ("Figure 2.1:", "github_network_graph.png"),
        ("Figure 3.1:", "usecase_overall.png"),
        ("Figure 4.1:", "arch_data_flow_model.png"),
        ("Figure 5.4:", "seq_catalog_cart.png"),
        ("Figure 5.5:", "seq_inventory_restock.png")
    ]
    for prefix, img_name in replacements:
        img_path = os.path.join(DIAG_DIR, img_name)
        if not os.path.exists(img_path):
            print(f"Warning: {img_path} not found!")
            continue
        for i, p in enumerate(doc.paragraphs):
            if p.text.startswith(prefix) and i > 0:
                p_img = doc.paragraphs[i-1]
                p_img.clear()
                p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
                p_img.add_run().add_picture(img_path, width=Inches(6.4))
                print(f"Successfully replaced image for {prefix} with {img_name}")
                break

    # =========================================================================
    # 2. RECONSTRUCT FRONT MATTER LIST OF FIGURES & LIST OF TABLES
    # =========================================================================
    print("Step 2: Reconstructing List of Figures and List of Tables cleanly...")
    
    # Locate p_toc_end and p_ch1
    p_ch1 = None
    p_toc_start = None
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt == "TABLE OF CONTENT":
            p_toc_start = p
        elif txt == "CHAPTER 1. INTRODUCTION":
            p_ch1 = p
            break

    # Find the end of TOC: it is the last toc 1 entry 'REFERENCES\t33'
    p_ref_toc = None
    for p in doc.paragraphs:
        if p.text.strip().startswith("REFERENCES\t"):
            p_ref_toc = p
            break

    if p_ref_toc is not None and p_ch1 is not None:
        # Clear everything between p_ref_toc and p_ch1
        curr = p_ref_toc._element.getnext()
        while curr is not None and curr != p_ch1._element:
            nxt = curr.getnext()
            curr.getparent().remove(curr)
            curr = nxt
        print("Cleared space between Table of Contents and Chapter 1.")

        # 2a. Insert LIST OF FIGURES heading
        p_lof = p_ch1.insert_paragraph_before("LIST OF FIGURES")
        p_lof.paragraph_format.page_break_before = True
        p_lof.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p_lof.runs:
            r.font.name = "Arial"
            r.font.size = Pt(16)
            r.font.bold = True
            r.font.color.rgb = COLOR_BLACK

        full_figures = [
            ("Figure 2.1: GitHub Repository Commit History and Continuous Contribution Breakdown", "17"),
            ("Figure 3.1: Overall System Use Case Diagram for Computer Shop Management Software", "19"),
            ("Figure 3.2: Module 2 Use Case Diagram – Hardware Products, Specs and Variants Management Subsystem", "20"),
            ("Figure 3.3: Module 4 Use Case Diagram – Order Fulfillment and Inventory Control Subsystem", "20"),
            ("Figure 4.1: System Architecture Data Flow Model", "21"),
            ("Figure 5.1: Entity Relationship Diagram (ERD) for Computer Shop Management Software", "23"),
            ("Figure 5.2: Comprehensive Static Model – UML Class Diagram for Computer Shop Management Software", "27"),
            ("Figure 5.3: UML Sequence Diagram — User Authentication & JWT/RBAC Authorization (UC-01, UC-02)", "28"),
            ("Figure 5.4: UML Sequence Diagram — Multi-Criteria Hardware Specs Filtering & Cart Compatibility Validation (UC-05, UC-08)", "29"),
            ("Figure 5.5: UML Sequence Diagram — Batch Inward Restock & Low-Stock Alerts (UC-14..UC-15)", "30"),
            ("Figure 5.6: UML Activity Diagram (Swimlanes) — End-to-End Hardware Purchase, SePay Payment & Order Fulfillment Lifecycle", "31"),
            ("Figure 7.1: Physical Relational Database Schema and Core Hardware Tables in PostgreSQL (pgAdmin)", "33"),
            ("Figure 7.2: MVC Backend Architecture Directory Structure and RESTful Routing Pipeline", "33"),
            ("Figure 7.3: Automated Unit & Integration Test Suite Execution Output (52 Tests Passed, 81.50% Line Coverage)", "34"),
            ("Figure 7.4: Customer Storefront & Multi-Criteria Hardware Specification Filter (Module 2)", "34"),
            ("Figure 7.5: Shopping Cart with Real-Time Stock Validation and PC Component Compatibility Guard (Module 3)", "35"),
            ("Figure 7.6: Cashless Checkout via Dynamic SePay VietQR Modal and Live Payment Webhook (Module 3)", "35"),
            ("Figure 7.7: Real-Time Order Tracking Interface with Stage Progression Stepper (Module 3)", "36"),
            ("Figure 7.8: Admin Portal — Hardware Products, SKUs, and Specification Attribute Matrix Management (Module 2)", "36"),
            ("Figure 7.9: Admin Inventory Management — Batch Restock (Inward Receipt) and Automated Low-Stock Alert Feed (Module 4)", "37"),
            ("Figure 7.10: Executive Revenue Analytics Dashboard and Visitor Session Conversion Rate Metrics (Module 1)", "37")
        ]

        for title, pg in full_figures:
            add_leader_entry(doc, p_ch1, title, pg)

        # 2b. Insert LIST OF TABLES heading
        p_lot = p_ch1.insert_paragraph_before("LIST OF TABLES")
        p_lot.paragraph_format.page_break_before = True
        p_lot.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p_lot.runs:
            r.font.name = "Arial"
            r.font.size = Pt(16)
            r.font.bold = True
            r.font.color.rgb = COLOR_BLACK

        full_tables = [
            ("Table 1.1: Terms, Acronyms, and Abbreviations", "10"),
            ("Table 2.1: Project Work Breakdown and Team Responsibilities", "12"),
            ("Table 2.2: Project Risk Analysis and Mitigation Strategies", "14"),
            ("Table 2.3: Project Deliverables and Schedule", "15"),
            ("Table 3.1: System Stakeholder Profiles and Interaction Matrix", "19"),
            ("Table 3.2: Textual Specification for User Authentication and JWT Session Issuance (UC-01)", "20"),
            ("Table 3.3: Textual Specification for Register Customer Account (UC-02)", "20"),
            ("Table 3.4: Textual Specification for Manage System User Accounts and RBAC Permissions (UC-03)", "21"),
            ("Table 3.5: Textual Specification for View Sales and Revenue Dashboard (UC-04)", "21"),
            ("Table 3.6: Textual Specification for Manage Hardware Categories (UC-05)", "22"),
            ("Table 3.7: Textual Specification for Manage Computer Hardware Products (UC-06)", "22"),
            ("Table 3.8: Textual Specification for Configure Technical Specifications and Product Variants (UC-07)", "23"),
            ("Table 3.9: Textual Specification for Multi-Criteria Hardware Search and Specification Filtering (UC-08)", "23"),
            ("Table 3.10: Textual Specification for Manage Shopping Cart and Real-Time Stock Validation (UC-09 & UC-10)", "24"),
            ("Table 3.11: Textual Specification for Cashless Online Checkout via VietQR / ZaloPay (UC-11)", "24"),
            ("Table 3.12: Textual Specification for Order Fulfillment Lifecycle and Automated Stock Deduction (UC-12 & UC-13)", "25"),
            ("Table 3.13: Textual Specification for Batch Inward Stock Receipt (UC-14)", "25"),
            ("Table 3.14: Textual Specification for Low-Stock Threshold Alert and Inventory Monitoring (UC-15)", "26"),
            ("Table 3.15: Functional Requirements Specification Matrix", "26"),
            ("Table 3.16: Non-Functional Requirements Specification (ISO/IEC 25010)", "26"),
            ("Table 4.1: Technology Stack and Tools Used", "27"),
            ("Table 5.1: Data Dictionary — Roles", "28"),
            ("Table 5.2: Data Dictionary — Users", "28"),
            ("Table 5.3: Data Dictionary — Categories", "28"),
            ("Table 5.4: Data Dictionary — Products", "29"),
            ("Table 5.5: Data Dictionary — Product_Variants", "29"),
            ("Table 5.6: Data Dictionary — Specs", "29"),
            ("Table 5.7: Data Dictionary — Product_Specs", "30"),
            ("Table 5.8: Data Dictionary — Website_Visits", "30"),
            ("Table 5.9: Data Dictionary — Orders", "30"),
            ("Table 5.10: Data Dictionary — Order_Items", "31"),
            ("Table 5.11: Data Dictionary — Inventory_Transactions", "31"),
            ("Table 5.12: Class Model Design Specification and Association Semantics", "31"),
            ("Table 5.13: Dynamic Interaction Summary, Endpoints, and Transactional Guarantees", "32"),
            ("Table 5.14: Requirements Traceability Matrix", "32"),
            ("Table 6.1: Requirements-Based System-Level Test Cases (TC-01 through TC-30)", "33"),
            ("Table 6.2: Bidirectional Traceability Matrix (Use Cases <-> Functional Requirements <-> Test Cases)", "33"),
            ("Table 6.3: Boundary Value Analysis (BVA) Test Cases (UT-13 through UT-20)", "34"),
            ("Table 6.4: SePay Webhook Payment Confirmation Decision Table", "34"),
            ("Table 6.5: Quantitative Test Suite Quality Assessment Metrics", "34")
        ]

        for title, pg in full_tables:
            add_leader_entry(doc, p_ch1, title, pg)
        print("Inserted List of Figures (21 entries) and List of Tables (38 entries) with dot leaders.")

    # =========================================================================
    # 3. ENFORCE PITCH BLACK (RGB 0, 0, 0) ON ALL HEADINGS ACROSS DOCUMENT
    # =========================================================================
    print("Step 3: Enforcing 100% Pitch Black (#000000) on all headings and titles...")
    for p in doc.paragraphs:
        txt = p.text.strip()
        is_hd = False
        if p.style and (p.style.name.startswith("Heading") or "Heading" in p.style.name or "Title" in p.style.name or "TOC" in p.style.name):
            is_hd = True
        if any(txt.startswith(k) for k in [
            "CHAPTER", "1.", "2.", "3.", "4.", "5.", "6.", "7.",
            "DECLARATION", "TEACHER'S ASSESSMENT", "ABSTRACT", "TABLE OF CONTENT",
            "LIST OF FIGURES", "LIST OF TABLES", "REFERENCES", "Figure", "Table"
        ]):
            is_hd = True

        if is_hd:
            p.paragraph_format.keep_with_next = True
            for r in p.runs:
                r.font.name = "Arial"
                r.font.color.rgb = COLOR_BLACK

    # Also table of figures runs
    for p in doc.paragraphs:
        if p.style and p.style.name == "table of figures":
            for r in p.runs:
                r.font.name = "Arial"
                r.font.color.rgb = COLOR_BLACK

    # =========================================================================
    # 4. UNIFY ALL TABLES TO IEEE NAVY/SLATE PALETTE
    # =========================================================================
    print("Step 4: Unifying all tables to IEEE Navy/Slate palette...")
    for t in doc.tables:
        format_unified_table(t)

    # =========================================================================
    # 5. ENFORCE STRICT PAGE BREAKS ON ALL MILESTONES
    # =========================================================================
    print("Step 5: Enforcing page_break_before on all milestone headings...")
    milestones = [
        "DECLARATION OF AUTHORSHIP",
        "TEACHER'S ASSESSMENT AND CONFIRMATION",
        "ABSTRACT",
        "TABLE OF CONTENT",
        "LIST OF FIGURES",
        "LIST OF TABLES",
        "CHAPTER 1. INTRODUCTION",
        "CHAPTER 2. PROJECT MANAGEMENT PLAN",
        "CHAPTER 3. REQUIREMENT SPECIFICATIONS",
        "CHAPTER 4. ARCHITECTURE",
        "CHAPTER 5. DESIGN",
        "CHAPTER 6. TEST PLAN",
        "CHAPTER 7. DEMO",
        "REFERENCES"
    ]
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt in milestones:
            p.paragraph_format.page_break_before = True

    # Save document directly to DOC_PATH
    print(f"Saving changes directly to: {DOC_PATH}")
    doc.save(DOC_PATH)
    print("Docx saved successfully via python-docx!")

    # =========================================================================
    # 6. POST-PROCESSING: PURGE NUMPR AND BLUE THEME COLORS FROM DOCX PACKAGE
    # =========================================================================
    print("Step 6: Post-processing docx package to permanently strip numPr from styles.xml...")
    temp_dir = tempfile.mkdtemp()
    temp_zip = os.path.join(temp_dir, "temp.zip")
    with zipfile.ZipFile(DOC_PATH, 'r') as zin:
        zin.extractall(temp_dir)

    # 6a. Fix styles.xml
    styles_path = os.path.join(temp_dir, "word", "styles.xml")
    if os.path.exists(styles_path):
        ET.register_namespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        tree = ET.parse(styles_path)
        root = tree.getroot()
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        for style in root.findall('w:style', ns):
            s_id = style.attrib.get(f"{{{ns['w']}}}styleId", "")
            if s_id.startswith('Heading') or s_id.startswith('heading') or 'Title' in s_id or 'TOC' in s_id:
                pPr = style.find('w:pPr', ns)
                if pPr is not None:
                    numPr = pPr.find('w:numPr', ns)
                    if numPr is not None:
                        pPr.remove(numPr)
                
                rPr = style.find('w:rPr', ns)
                if rPr is not None:
                    color = rPr.find('w:color', ns)
                    if color is not None:
                        color.attrib[f"{{{ns['w']}}}val"] = "000000"
                        if f"{{{ns['w']}}}themeColor" in color.attrib:
                            del color.attrib[f"{{{ns['w']}}}themeColor"]

        tree.write(styles_path, encoding='utf-8', xml_declaration=True)
        print("styles.xml: purged numPr and blue colors.")

    # 6b. Fix document.xml
    doc_xml_path = os.path.join(temp_dir, "word", "document.xml")
    if os.path.exists(doc_xml_path):
        ET.register_namespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        tree = ET.parse(doc_xml_path)
        root = tree.getroot()
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        for p in root.iter(f"{{{ns['w']}}}p"):
            pPr = p.find('w:pPr', ns)
            if pPr is not None:
                pStyle = pPr.find('w:pStyle', ns)
                style_val = pStyle.attrib.get(f"{{{ns['w']}}}val", "") if pStyle is not None else ""
                if style_val.startswith('Heading') or style_val.startswith('heading'):
                    numPr = pPr.find('w:numPr', ns)
                    if numPr is not None:
                        pPr.remove(numPr)

        tree.write(doc_xml_path, encoding='utf-8', xml_declaration=True)
        print("document.xml: purged inline numPr on headings.")

    # Repack zip
    with zipfile.ZipFile(temp_zip, 'w', zipfile.ZIP_DEFLATED) as zout:
        for root_dir, dirs, files in os.walk(temp_dir):
            for file in files:
                if file == "temp.zip":
                    continue
                full_path = os.path.join(root_dir, file)
                arcname = os.path.relpath(full_path, temp_dir)
                zout.write(full_path, arcname)

    shutil.copy2(temp_zip, DOC_PATH)
    shutil.rmtree(temp_dir)
    print(f"PERFECT FINALIZATION COMPLETE directly into: {DOC_PATH}")

if __name__ == "__main__":
    main()
