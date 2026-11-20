import docx
from docx.shared import Pt, RGBColor
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(DOC_PATH)

toc_page_map = {
    "LIST OF FIGURES": "4",
    "LIST OF TABLES": "5",
    "CHAPTER 1. INTRODUCTION": "7",
    "1.1 Purpose and Scope": "7",
    "1.2 Product Overview": "7",
    "1.3 Structure of the Document": "9",
    "1.4 Terms, Acronyms, and Abbreviations": "9",
    "CHAPTER 2. PROJECT MANAGEMENT PLAN": "11",
    "2.1 Project Organization": "11",
    "2.2 Lifecycle Model Used": "11",
    "2.3 Risk Analysis": "12",
    "2.4 Hardware and Software Resource Requirements": "13",
    "2.5 Deliverables and Schedule": "13",
    "2.6 Monitoring, Reporting, and Controlling Mechanisms": "14",
    "2.7 Professional Standards": "14",
    "2.8 Configuration Management Evidence": "15",
    "2.9 Impact of the Project on Individuals and Organizations": "15",
    "CHAPTER 3. REQUIREMENT SPECIFICATIONS": "16",
    "3.1 Stakeholders for the System": "16",
    "3.2 Use Case Model": "17",
    "3.2.1 Graphical Use Case Model": "17",
    "3.2.2 Textual Description for Each Use Case": "20",
    "3.3 Functional Requirements": "29",
    "3.4 Non-Functional Requirements": "33",
    "CHAPTER 4. ARCHITECTURE": "35",
    "4.1 Architectural Style(s) Used": "35",
    "4.2 Architectural Model": "35",
    "4.3 Technology, Software, and Hardware Used": "36",
    "4.4 Rationale for Your Architectural Style and Model": "37",
    "CHAPTER 5. DESIGN": "38",
    "5.1 Database Design": "38",
    "5.1.1 Entity Relationship Diagram (ERD)": "38",
    "5.1.2 Relational Data Model": "38",
    "5.1.3 Data Dictionary": "39",
    "5.2 Static Model – Class Diagrams": "42",
    "5.3 Dynamic Model – Sequence Diagrams": "44",
    "5.4 Rationale for Detailed Design Model": "49",
    "5.5 Traceability from Requirements to Detailed Design Model": "49",
    "CHAPTER 6. TEST PLAN": "52",
    "6.1 Requirements/Specifications-Based System Level Test Cases": "52",
    "6.2 Traceability of Test Cases to Use Cases": "57",
    "6.3 Techniques Used for Test Generation": "58",
    "6.4 Assessment of the Goodness of Your Testsuite": "60",
    "CHAPTER 7. DEMO": "62",
    "7.1 Database": "62",
    "7.2 Source Code": "62",
    "7.3 Testing": "63",
    "REFERENCES": "64"
}

fig_page_map = {
    "Figure 2.1": "15",
    "Figure 3.1": "18",
    "Figure 3.2": "19",
    "Figure 3.3": "19",
    "Figure 4.1": "36",
    "Figure 5.1": "38",
    "Figure 5.2": "42",
    "Figure 5.3": "46",
    "Figure 5.4": "47",
    "Figure 5.5": "47",
    "Figure 5.6": "48",
    "Figure 7.1": "62",
    "Figure 7.2": "62",
    "Figure 7.3": "63"
}

tbl_page_map = {
    "Table 1.1": "9",
    "Table 2.1": "11",
    "Table 2.2": "12",
    "Table 2.3": "13",
    "Table 3.1": "16",
    "Table 3.2": "20",
    "Table 3.3": "21",
    "Table 3.4": "21",
    "Table 3.5": "22",
    "Table 3.6": "23",
    "Table 3.7": "24",
    "Table 3.8": "25",
    "Table 3.9": "26",
    "Table 3.10": "27",
    "Table 3.11": "28",
    "Table 3.12": "29",
    "Table 3.13": "33",
    "Table 4.1": "36",
    "Table 5.1": "39",
    "Table 5.2": "39",
    "Table 5.3": "39",
    "Table 5.4": "40",
    "Table 5.5": "40",
    "Table 5.6": "40",
    "Table 5.7": "41",
    "Table 5.9": "41",
    "Table 5.10": "41",
    "Table 5.11": "43",
    "Table 5.12": "48",
    "Table 5.14": "49",
    "Table 6.1": "52",
    "Table 6.2": "57",
    "Table 6.3": "58",
    "Table 6.4": "59",
    "Table 6.5": "60"
}

# Update TOC
for p in doc.paragraphs:
    if p.style and p.style.name.startswith("toc"):
        txt = p.text.strip()
        parts = txt.split("\t")
        title = parts[0].strip()
        if title in toc_page_map:
            exact_pg = toc_page_map[title]
            p.text = f"{title}\t{exact_pg}"
            pPr = p._element.get_or_add_pPr()
            tabs = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tabs')
            if tabs is None:
                tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs>')
                pPr.append(tabs)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            is_major = title.startswith("CHAPTER") or title in ["LIST OF FIGURES", "LIST OF TABLES", "REFERENCES"]
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(12)
                r.font.bold = is_major
                r.font.color.rgb = RGBColor(0, 0, 0)

# Update LOF
in_lof = False
for p in doc.paragraphs:
    txt = p.text.strip()
    if txt == "LIST OF FIGURES":
        in_lof = True; continue
    elif txt == "LIST OF TABLES":
        in_lof = False; break
    if in_lof and txt.startswith("Figure "):
        prefix = txt.split(":")[0].strip()
        if prefix in fig_page_map:
            exact_pg = fig_page_map[prefix]
            parts = txt.split("\t")
            title = parts[0].strip()
            p.text = f"{title}\t{exact_pg}"
            pPr = p._element.get_or_add_pPr()
            tabs = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tabs')
            if tabs is None:
                tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs>')
                pPr.append(tabs)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(0, 0, 0)

# Update LOT
in_lot = False
for p in doc.paragraphs:
    txt = p.text.strip()
    if txt == "LIST OF TABLES":
        in_lot = True; continue
    elif txt.startswith("CHAPTER 1"):
        in_lot = False; break
    if in_lot and txt.startswith("Table "):
        prefix = txt.split(":")[0].strip()
        if prefix in tbl_page_map:
            exact_pg = tbl_page_map[prefix]
            parts = txt.split("\t")
            title = parts[0].strip()
            p.text = f"{title}\t{exact_pg}"
            pPr = p._element.get_or_add_pPr()
            tabs = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tabs')
            if tabs is None:
                tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs>')
                pPr.append(tabs)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(0, 0, 0)

doc.save(DOC_PATH)
print("Updated all page numbers in TOC, LOF, and LOT successfully!")
