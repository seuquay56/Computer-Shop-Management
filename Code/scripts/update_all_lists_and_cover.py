import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(DOC_PATH)

print("=" * 60)
print("1. CLEANING UP COVER & SUB-COVER STUDENT NAMES & ALIGNMENT")
print("=" * 60)

for i in range(45):
    p = doc.paragraphs[i]
    txt = p.text
    # Clean leading whitespace/tabs from student names
    if "ON GIA KHIEM" in txt or "VO NGUYEN" in txt or "NGUYEN NHAT" in txt:
        clean_txt = txt.strip()
        p.text = clean_txt
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.left_indent = None
        p.paragraph_format.right_indent = None
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)
    elif txt.strip() in ["VIETNAM GENERAL CONFEDERATION OF LABOR", "TON DUC THANG UNIVERSITY", "FACULTY OF INFORMATION TECHNOLOGY"]:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.left_indent = None
        p.paragraph_format.right_indent = None
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            if "CONFEDERATION" not in txt:
                r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)
    elif txt.strip() in ["FINAL ESSAY", "FINAL ESSAY ", "SOFTWARE ENGINEERING"]:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = None
        p.paragraph_format.right_indent = None
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(22 if "SOFTWARE" in txt else 24)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)
    elif txt.strip() == "Advised by":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.left_indent = None
        p.paragraph_format.right_indent = None
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.color.rgb = RGBColor(0, 0, 0)
    elif txt.strip() == "Mr. Nguyen Ngoc Phien":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = None
        p.paragraph_format.right_indent = None
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)
    elif txt.strip() == "HO CHI MINH CITY, 2026":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.left_indent = None
        p.paragraph_format.right_indent = None
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(14)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)

print("=" * 60)
print("2. STANDARDIZING CHAPTER 3 USE CASE TABLE CAPTIONS")
print("=" * 60)
# Ensure Table UC-01 to UC-10 are cleanly named Table 3.2 to 3.11
uc_table_map = {
    "Table UC-01: Textual Specification for User Authentication and JWT Session Issuance": "Table 3.2: Textual Specification for User Authentication and JWT Session Issuance (UC-01)",
    "Table UC-02: Textual Specification for Manage System User Accounts and RBAC Permissions": "Table 3.3: Textual Specification for Manage System User Accounts and RBAC Permissions (UC-02)",
    "Table UC-03: Textual Specification for Manage Computer Hardware Products and Categories": "Table 3.4: Textual Specification for Manage Computer Hardware Products and Categories (UC-03)",
    "Table UC-04: Textual Specification for Configure Technical Specifications and Product Variants": "Table 3.5: Textual Specification for Configure Technical Specifications and Product Variants (UC-04)",
    "Table UC-05: Textual Specification for Multi-Criteria Hardware Search and Specification Filtering": "Table 3.6: Textual Specification for Multi-Criteria Hardware Search and Specification Filtering (UC-05)",
    "Table UC-06: Textual Specification for Batch Inward Stock Receipt (Restock by SKU Batches)": "Table 3.7: Textual Specification for Batch Inward Stock Receipt (UC-14)",
    "Table UC-07: Textual Specification for Low-Stock Threshold Alert and Inventory Monitoring": "Table 3.8: Textual Specification for Low-Stock Threshold Alert and Inventory Monitoring (UC-15)",
    "Table UC-08: Textual Specification for Manage Shopping Cart and Real-Time Stock Validation": "Table 3.9: Textual Specification for Manage Shopping Cart and Real-Time Stock Validation (UC-09 & UC-10)",
    "Table UC-09: Textual Specification for Cashless Online Checkout via VietQR / ZaloPay": "Table 3.10: Textual Specification for Cashless Online Checkout via VietQR / ZaloPay (UC-11)",
    "Table UC-10: Textual Specification for Order Fulfillment Lifecycle and Automated Stock Deduction": "Table 3.11: Textual Specification for Order Fulfillment Lifecycle and Automated Stock Deduction (UC-12 & UC-13)"
}

for p in doc.paragraphs:
    txt = p.text.strip()
    if txt in uc_table_map:
        p.text = uc_table_map[txt]
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(11)
            r.font.bold = True
            r.font.color.rgb = RGBColor(0, 0, 0)
        print(f"Renamed: {txt[:30]} -> {p.text[:40]}")

print("=" * 60)
print("3. UPDATING TABLE OF CONTENTS WITH EXACT VERIFIED PAGE NUMBERS")
print("=" * 60)
toc_page_map = {
    "LIST OF FIGURES": "4",
    "LIST OF TABLES": "5",
    "CHAPTER 1. INTRODUCTION": "6",
    "1.1 Purpose and Scope": "6",
    "1.2 Product Overview": "6",
    "1.3 Structure of the Document": "7",
    "1.4 Terms, Acronyms, and Abbreviations": "8",
    "CHAPTER 2. PROJECT MANAGEMENT PLAN": "9",
    "2.1 Project Organization": "9",
    "2.2 Lifecycle Model Used": "9",
    "2.3 Risk Analysis": "10",
    "2.4 Hardware and Software Resource Requirements": "10",
    "2.5 Deliverables and Schedule": "11",
    "2.6 Monitoring, Reporting, and Controlling Mechanisms": "11",
    "2.7 Professional Standards": "12",
    "2.8 Configuration Management Evidence": "12",
    "2.9 Impact of the Project on Individuals and Organizations": "12",
    "CHAPTER 3. REQUIREMENT SPECIFICATIONS": "13",
    "3.1 Stakeholders for the System": "13",
    "3.2 Use Case Model": "14",
    "3.2.1 Graphical Use Case Model": "14",
    "3.2.2 Textual Description for Each Use Case": "16",
    "3.3 Functional Requirements": "24",
    "3.4 Non-Functional Requirements": "28",
    "CHAPTER 4. ARCHITECTURE": "30",
    "4.1 Architectural Style(s) Used": "30",
    "4.2 Architectural Model": "30",
    "4.3 Technology, Software, and Hardware Used": "31",
    "4.4 Rationale for Your Architectural Style and Model": "31",
    "CHAPTER 5. DESIGN": "32",
    "5.1 Database Design": "32",
    "5.1.1 Entity Relationship Diagram (ERD)": "32",
    "5.1.2 Relational Data Model": "32",
    "5.1.3 Data Dictionary": "32",
    "5.2 Static Model – Class Diagrams": "35",
    "5.3 Dynamic Model – Sequence Diagrams": "38",
    "5.4 Rationale for Detailed Design Model": "42",
    "5.5 Traceability from Requirements to Detailed Design Model": "42",
    "CHAPTER 6. TEST PLAN": "45",
    "6.1 Requirements/Specifications-Based System Level Test Cases": "45",
    "6.2 Traceability of Test Cases to Use Cases": "50",
    "6.3 Techniques Used for Test Generation": "51",
    "6.4 Assessment of the Goodness of Your Testsuite": "52",
    "CHAPTER 7. DEMO": "54",
    "7.1 Database": "54",
    "7.2 Source Code": "54",
    "7.3 Testing": "55",
    "REFERENCES": "56"
}

for p in doc.paragraphs:
    if p.style and p.style.name.startswith("toc"):
        txt = p.text.strip()
        parts = txt.split("\t")
        title = parts[0].strip()
        if title in toc_page_map:
            exact_pg = toc_page_map[title]
            # Update run text
            # Find the run containing the page number
            for r in p.runs:
                if r.text.strip().isdigit() and len(r.text.strip()) <= 3:
                    r.text = exact_pg
                    break
            else:
                # If tab and page number were in the same run or separate
                p.text = f"{title}\t{exact_pg}"
                # restore dot leader tab stop
                pPr = p._element.get_or_add_pPr()
                tabs = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tabs')
                if tabs is None:
                    tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs>')
                    pPr.append(tabs)

# Enforce Times New Roman on all TOC runs
for p in doc.paragraphs:
    if p.style and p.style.name.startswith("toc"):
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.size = Pt(12)
            r.font.color.rgb = RGBColor(0, 0, 0)

print("=" * 60)
print("4. CLEANING UP LIST OF FIGURES (14 REAL FIGURES ONLY)")
print("=" * 60)
fig_page_map = {
    "Figure 2.1": "12",
    "Figure 3.1": "14",
    "Figure 3.2": "15",
    "Figure 3.3": "16",
    "Figure 4.1": "30",
    "Figure 5.1": "32",
    "Figure 5.2": "36",
    "Figure 5.3": "39",
    "Figure 5.4": "40",
    "Figure 5.5": "41",
    "Figure 5.6": "41",
    "Figure 7.1": "54",
    "Figure 7.2": "54",
    "Figure 7.3": "55"
}

# Remove phantom figures (Figure 7.4 through 7.10) from front matter
lof_paras_to_del = []
in_lof = False
for p in doc.paragraphs:
    txt = p.text.strip()
    if txt == "LIST OF FIGURES":
        in_lof = True
        continue
    elif txt == "LIST OF TABLES":
        in_lof = False
        break

    if in_lof and txt.startswith("Figure "):
        prefix = txt.split(":")[0].strip()
        if prefix not in fig_page_map:
            lof_paras_to_del.append(p)
            print(f"Removing phantom figure from LOF: {txt[:40]}")
        else:
            # Update page number
            exact_pg = fig_page_map[prefix]
            parts = txt.split("\t")
            fig_title = parts[0].strip()
            p.text = f"{fig_title}\t{exact_pg}"
            # ensure tab leader
            pPr = p._element.get_or_add_pPr()
            tabs = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tabs')
            if tabs is None:
                tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs>')
                pPr.append(tabs)
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(0, 0, 0)

for p in lof_paras_to_del:
    p._element.getparent().remove(p._element)

print("=" * 60)
print("5. CLEANING UP LIST OF TABLES WITH EXACT PAGE NUMBERS")
print("=" * 60)
table_page_map = {
    "Table 1.1": "8",
    "Table 2.1": "9",
    "Table 2.2": "10",
    "Table 2.3": "11",
    "Table 3.1": "13",
    "Table 3.2": "16",
    "Table 3.3": "17",
    "Table 3.4": "18",
    "Table 3.5": "19",
    "Table 3.6": "20",
    "Table 3.7": "21",
    "Table 3.8": "21",
    "Table 3.9": "22",
    "Table 3.10": "23",
    "Table 3.11": "23",
    "Table 3.12": "25",
    "Table 3.13": "28",
    "Table 4.1": "31",
    "Table 5.1": "32",
    "Table 5.2": "32",
    "Table 5.3": "33",
    "Table 5.4": "33",
    "Table 5.5": "34",
    "Table 5.6": "34",
    "Table 5.7": "34",
    "Table 5.8": "34",
    "Table 5.9": "34",
    "Table 5.10": "35",
    "Table 5.11": "36",
    "Table 5.12": "42",
    "Table 5.13": "42",
    "Table 5.14": "42",
    "Table 6.1": "45",
    "Table 6.2": "50",
    "Table 6.3": "51",
    "Table 6.4": "52",
    "Table 6.5": "52"
}

in_lot = False
for p in doc.paragraphs:
    txt = p.text.strip()
    if txt == "LIST OF TABLES":
        in_lot = True
        continue
    elif txt.startswith("CHAPTER 1"):
        in_lot = False
        break

    if in_lot and txt.startswith("Table "):
        prefix = txt.split(":")[0].strip()
        if prefix in table_page_map:
            exact_pg = table_page_map[prefix]
            parts = txt.split("\t")
            tbl_title = parts[0].strip()
            p.text = f"{tbl_title}\t{exact_pg}"
            # ensure tab leader
            pPr = p._element.get_or_add_pPr()
            tabs = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tabs')
            if tabs is None:
                tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs>')
                pPr.append(tabs)
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(0, 0, 0)

doc.save(DOC_PATH)
print("Updated all lists and cover pages successfully!")
