import os
import sys
import re
import shutil
import zipfile
import time
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

SRC_FILE = r"Computer-Shop-Management\524H00057_524H0069_524H0052.docx"
DEST_FILE = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
PDF_FILE = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.pdf"

print("Starting Master Perfection build...")
shutil.copyfile(SRC_FILE, DEST_FILE)
doc = docx.Document(DEST_FILE)

def create_spacer_p(font_size_pt=12):
    sz_val = int(font_size_pt * 2)
    return parse_xml(
        f'<w:p {nsdecls("w")}>'
        f'<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="{sz_val}"/><w:szCs w:val="{sz_val}"/></w:rPr><w:t></w:t></w:r>'
        f'</w:p>'
    )

def apply_font_to_p(p, font_name="Times New Roman", size=Pt(12), bold=None, italic=None, color_rgb=RGBColor(0,0,0)):
    for r in p.runs:
        r.font.name = font_name
        r._r.get_or_add_rPr()
        rPr = r._r.rPr
        rFonts = rPr.find(qn('w:rFonts'))
        if rFonts is None:
            rFonts = parse_xml(f'<w:rFonts {nsdecls("w")} w:ascii="{font_name}" w:hAnsi="{font_name}" w:cs="{font_name}"/>')
            rPr.append(rFonts)
        else:
            rFonts.set(qn('w:ascii'), font_name)
            rFonts.set(qn('w:hAnsi'), font_name)
            rFonts.set(qn('w:cs'), font_name)
        if size is not None:
            r.font.size = size
        if bold is not None:
            r.font.bold = bold
        if italic is not None:
            r.font.italic = italic
        if color_rgb is not None:
            r.font.color.rgb = color_rgb

def set_right_tab_with_dot_leader(p, tab_pos_pt=439.0):
    p.paragraph_format.tab_stops.clear_all()
    p.paragraph_format.tab_stops.add_tab_stop(Pt(tab_pos_pt), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)

# 1. PAGE 1 & PAGE 2 VERTICAL SPACERS
p_hcm1 = None
for i in range(25):
    if doc.paragraphs[i].text.strip() == "HO CHI MINH CITY, 2026":
        p_hcm1 = doc.paragraphs[i]
        break

# Add 7 spacers before HO CHI MINH CITY, 2026 on Page 1 so it sits gracefully at the bottom matching Page 2
for _ in range(7):
    p_hcm1._p.addprevious(create_spacer_p())

count_labor = 0
p2_names = None
p2_essay = None
p2_advised = None

for p in doc.paragraphs:
    txt = p.text.strip()
    if txt == "VIETNAM GENERAL CONFEDERATION OF LABOR":
        count_labor += 1
    if count_labor == 2:
        if "ON GIA KHIEM" in txt and p2_names is None:
            p2_names = p
        elif "FINAL ESSAY" in txt and p2_essay is None:
            p2_essay = p
        elif txt == "Advised by" and p2_advised is None:
            p2_advised = p
        elif txt == "ACKNOWLEDGEMENT":
            break

for _ in range(2):
    p2_names._p.addprevious(create_spacer_p())
for _ in range(2):
    p2_essay._p.addprevious(create_spacer_p())
for _ in range(3):
    p2_advised._p.addprevious(create_spacer_p())

# 2. LOCATE ANCHORS
p_labor_indices = []
idx_ack = None
idx_dec = None
idx_sw_title = None
idx_abstract = None
idx_toc = None
idx_lof = None
idx_lot = None
idx_ch1 = None

for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "VIETNAM GENERAL CONFEDERATION OF LABOR":
        p_labor_indices.append(i)
    elif txt == "ACKNOWLEDGEMENT" and idx_ack is None:
        idx_ack = i
    elif txt == "DECLARATION OF AUTHORSHIP" and idx_dec is None:
        idx_dec = i
    elif txt == "COMPUTER SHOP MANAGEMENT SOFTWARE" and idx_sw_title is None and i > 60:
        idx_sw_title = i
    elif txt in ["ABSTRACT", "EXECUTIVE SUMMARY"] and idx_abstract is None and i > 60:
        idx_abstract = i
    elif txt == "TABLE OF CONTENT" and idx_toc is None:
        idx_toc = i
    elif txt == "LIST OF FIGURES" and i > 100 and idx_lof is None:
        idx_lof = i
    elif txt == "LIST OF TABLES" and i > 100 and idx_lot is None:
        idx_lot = i
    elif txt.startswith("INTRODUCTION") and i > 150 and idx_ch1 is None:
        idx_ch1 = i

idx_p2 = p_labor_indices[1]
print(f"Found Anchors: P2={idx_p2}, Ack={idx_ack}, Dec={idx_dec}, SwTitle={idx_sw_title}, Abs={idx_abstract}, TOC={idx_toc}, LOF={idx_lof}, LOT={idx_lot}, Ch1={idx_ch1}")

# Enforce explicit page breaks
doc.paragraphs[idx_p2].paragraph_format.page_break_before = True
doc.paragraphs[idx_ack].paragraph_format.page_break_before = True
doc.paragraphs[idx_dec].paragraph_format.page_break_before = True
doc.paragraphs[idx_toc].paragraph_format.page_break_before = True
doc.paragraphs[idx_lof].paragraph_format.page_break_before = True
doc.paragraphs[idx_lot].paragraph_format.page_break_before = True
doc.paragraphs[idx_ch1].paragraph_format.page_break_before = True

# Format Cover Pages 1 & 2 text
for i in range(0, idx_ack):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    if not txt:
        p.paragraph_format.space_after = Pt(0)
        apply_font_to_p(p, size=Pt(12))
    elif txt in ["VIETNAM GENERAL CONFEDERATION OF LABOR", "TON DUC THANG UNIVERSITY", "FACULTY OF INFORMATION TECHNOLOGY"]:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        apply_font_to_p(p, size=Pt(14), bold=("CONFEDERATION" not in txt))
    elif any(k in txt for k in ["ON GIA KHIEM", "VO NGUYEN PHUC THINH", "NGUYEN NHAT HUY"]):
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        apply_font_to_p(p, size=Pt(14), bold=True)
    elif txt in ["FINAL ESSAY", "FINAL ESSAY "]:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_p(p, size=Pt(24), bold=True)
    elif txt == "SOFTWARE ENGINEERING":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_p(p, size=Pt(22), bold=True)
    elif txt == "Advised by":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        apply_font_to_p(p, size=Pt(14), bold=False)
    elif "Nguyen Ngoc Phien" in txt:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_p(p, size=Pt(14), bold=True)
    elif txt == "HO CHI MINH CITY, 2026":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_after = Pt(0)
        apply_font_to_p(p, size=Pt(14), bold=True)

# 3. FORMAT SIGNATURES ON PAGES 3 & 4
def format_signature_zone(start_idx, end_idx):
    for i in range(start_idx, end_idx):
        p = doc.paragraphs[i]
        txt = p.text.strip()
        clean_txt = re.sub(r'^\t+', '', p.text).strip()
        
        # Strip any spurious w:right attribute from pPr/ind
        ind_elem = p._p.pPr.find(qn('w:ind')) if p._p.pPr is not None else None
        if ind_elem is not None and qn('w:right') in ind_elem.attrib:
            del ind_elem.attrib[qn('w:right')]
            
        if "Ho Chi Minh city" in txt:
            p.text = "Ho Chi Minh city, 11th November 2026."
            p.paragraph_format.left_indent = Pt(180.0)
            p.paragraph_format.right_indent = Pt(0)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            apply_font_to_p(p, size=Pt(12), italic=True)
        elif txt == "Author":
            p.text = "Author"
            p.paragraph_format.left_indent = Pt(180.0)
            p.paragraph_format.right_indent = Pt(0)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            apply_font_to_p(p, size=Pt(13), bold=True)
        elif txt == "(Signature and full name)":
            p.text = "(Signature and full name)"
            p.paragraph_format.left_indent = Pt(180.0)
            p.paragraph_format.right_indent = Pt(0)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(12)
            p.paragraph_format.line_spacing = 1.15
            apply_font_to_p(p, size=Pt(12), italic=True)
        elif clean_txt in ["Khiem", "Thinh", "Huy"]:
            p.text = clean_txt
            p.paragraph_format.left_indent = Pt(180.0)
            p.paragraph_format.right_indent = Pt(0)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.0
            apply_font_to_p(p, size=Pt(12), italic=True)
        elif clean_txt in ["On Gia Khiem", "Vo Nguyen Phuc Thinh", "Nguyen Nhat Huy"]:
            p.text = clean_txt
            p.paragraph_format.left_indent = Pt(180.0)
            p.paragraph_format.right_indent = Pt(0)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.0
            apply_font_to_p(p, size=Pt(12), bold=True)
        elif txt in ["ACKNOWLEDGEMENT", "DECLARATION OF AUTHORSHIP"]:
            p.paragraph_format.page_break_before = True
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            apply_font_to_p(p, size=Pt(16), bold=True)
        elif txt:
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.first_line_indent = Pt(36)
            p.paragraph_format.left_indent = Pt(0)
            p.paragraph_format.right_indent = Pt(0)
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            apply_font_to_p(p, size=Pt(12))

format_signature_zone(idx_ack, idx_dec)
format_signature_zone(idx_dec, idx_abstract or idx_toc)

# 4. REMOVE ORPHAN BLANK PAGE AND STANDALONE TITLE
# Remove the standalone title paragraph "COMPUTER SHOP MANAGEMENT SOFTWARE"
if idx_sw_title is not None and idx_sw_title < (idx_abstract or 999):
    p_sw = doc.paragraphs[idx_sw_title]
    p_sw._p.getparent().remove(p_sw._p)

# Find EXECUTIVE SUMMARY again
p_exec = None
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() in ["ABSTRACT", "EXECUTIVE SUMMARY"] and i > 60:
        p_exec = p
        p_exec_idx = i
        break

p_exec.text = "EXECUTIVE SUMMARY"
p_exec.paragraph_format.page_break_before = False
p_exec.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
p_exec.paragraph_format.space_before = Pt(12)
p_exec.paragraph_format.space_after = Pt(6)
apply_font_to_p(p_exec, size=Pt(16), bold=True)

# Remove any empty paragraph immediately before EXECUTIVE SUMMARY that causes the orphan blank page
p_prev = doc.paragraphs[p_exec_idx - 1]
if not p_prev.text.strip() and "sectPr" not in p_prev._p.xml:
    print(f"Removing empty paragraph P[{p_exec_idx - 1}] before EXECUTIVE SUMMARY")
    p_prev._p.getparent().remove(p_prev._p)

# 5. SYNCHRONIZE TABLE OF CONTENTS WITH EXACT PRINTED PAGE NUMBERS
EXACT_TOC_PAGES = {
    "LIST OF FIGURES": "4",
    "LIST OF TABLES": "5",
    "CHAPTER 1. INTRODUCTION": "6",
    "1.1 Purpose and Scope": "6",
    "1.2 Product Overview": "6",
    "1.3 Structure of the Document": "8",
    "1.4 Terms, Acronyms, and Abbreviations": "9",
    "CHAPTER 2. PROJECT MANAGEMENT PLAN": "11",
    "2.1 Project Organization": "11",
    "2.2 Lifecycle Model Used": "12",
    "2.3 Risk Analysis": "12",
    "2.4 Hardware and Software Resource Requirements": "14",
    "2.5 Deliverables and Schedule": "14",
    "2.6 Monitoring, Reporting, and Controlling Mechanisms": "15",
    "2.7 Professional Standards": "16",
    "2.8 Configuration Management Evidence": "16",
    "2.9 Impact of the Project on Individuals and Organizations": "16",
    "CHAPTER 3. REQUIREMENT SPECIFICATIONS": "18",
    "3.1 Stakeholders for the System": "18",
    "3.2 Use Case Model": "19",
    "3.2.1 Graphical Use Case Model": "19",
    "3.2.2 Textual Description for Each Use Case": "22",
    "3.3 Functional Requirements": "31",
    "3.4 Non-Functional Requirements": "34",
    "CHAPTER 4. ARCHITECTURE": "36",
    "4.1 Architectural Style(s) Used": "36",
    "4.2 Architectural Model": "36",
    "4.3 Technology, Software, and Hardware Used": "37",
    "4.4 Rationale for Your Architectural Style and Model": "38",
    "CHAPTER 5. DESIGN": "39",
    "5.1 Database Design": "39",
    "5.1.1 Entity Relationship Diagram (ERD)": "39",
    "5.1.2 Relational Data Model": "39",
    "5.1.3 Data Dictionary": "40",
    "5.2 Static Model – Class Diagrams": "44",
    "5.3 Dynamic Model – Sequence Diagrams": "46",
    "5.4 Rationale for Detailed Design Model": "51",
    "5.5 Traceability from Requirements to Detailed Design Model": "51",
    "CHAPTER 6. TEST PLAN": "54",
    "6.1 Requirements/Specifications-Based System Level Test Cases": "54",
    "6.2 Traceability of Test Cases to Use Cases": "57",
    "6.3 Techniques Used for Test Generation": "58",
    "6.4 Assessment of the Goodness of Your Testsuite": "59",
    "CHAPTER 7. DEMO": "61",
    "7.1 Database": "61",
    "7.2 Source Code": "61",
    "7.3 Testing": "62",
    "REFERENCES": "62"
}

# Find TOC, LOF, LOT indices again
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "TABLE OF CONTENT": idx_toc = i
    elif txt == "LIST OF FIGURES" and i > 100: idx_lof = i
    elif txt == "LIST OF TABLES" and i > 100: idx_lot = i
    elif txt.startswith("INTRODUCTION") and i > 150: idx_ch1 = i; break

doc.paragraphs[idx_toc].paragraph_format.page_break_before = True
doc.paragraphs[idx_toc].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[idx_toc].paragraph_format.space_before = Pt(12)
doc.paragraphs[idx_toc].paragraph_format.space_after = Pt(12)
apply_font_to_p(doc.paragraphs[idx_toc], size=Pt(16), bold=True)

for i in range(idx_toc + 1, idx_lof):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt: continue
    parts = txt.split("\t")
    clean_title = re.sub(r'TOC\s+\\o\s+"[^"]*"\s+\\h\s+\\z\s+\\u\s*', '', parts[0]).strip()
    clean_title = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', clean_title).strip()
    
    # Get accurate page number
    page_str = EXACT_TOC_PAGES.get(clean_title, parts[1].strip() if len(parts) > 1 else "")
    
    is_lvl3 = bool(re.match(r'^\d+\.\d+\.\d+', clean_title))
    is_lvl2 = bool(re.match(r'^\d+\.\d+', clean_title)) and not is_lvl3
    is_lvl1 = not is_lvl2 and not is_lvl3
    
    p.text = f"{clean_title}\t{page_str}"
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    p.paragraph_format.line_spacing = 1.15
    if is_lvl1:
        p.style = doc.styles["toc 1"]
        p.paragraph_format.left_indent = Pt(0)
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(2)
        apply_font_to_p(p, size=Pt(12), bold=True)
    elif is_lvl2:
        p.style = doc.styles["toc 2"]
        p.paragraph_format.left_indent = Pt(18)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        apply_font_to_p(p, size=Pt(11), bold=False)
    else:
        p.style = doc.styles["toc 3"]
        p.paragraph_format.left_indent = Pt(36)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1)
        apply_font_to_p(p, size=Pt(10.5), bold=False)

# 6. SYNCHRONIZE LIST OF FIGURES
EXACT_LOF_PAGES = {
    "Figure 4.1: System Architecture Data Flow Model": "37",
    "Figure 5.1: Entity Relationship Diagram (ERD) for Computer Shop Management Software": "39",
    "Figure 7.1: Physical Relational Database Tables and Sample Computer Hardware Records": "61",
    "Figure 7.2: MVC Project Structure and Running Application Interfaces": "61",
    "Figure 7.3: Automated Unit Test Execution Output": "62"
}

doc.paragraphs[idx_lof].paragraph_format.page_break_before = True
doc.paragraphs[idx_lof].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[idx_lof].paragraph_format.space_before = Pt(12)
doc.paragraphs[idx_lof].paragraph_format.space_after = Pt(12)
apply_font_to_p(doc.paragraphs[idx_lof], size=Pt(16), bold=True)

for i in range(idx_lof + 1, idx_lot):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt: continue
    parts = txt.split("\t")
    clean_caption = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', parts[0]).strip()
    page_str = EXACT_LOF_PAGES.get(clean_caption, parts[1].strip() if len(parts) > 1 else "")
    p.text = f"{clean_caption}\t{page_str}"
    p.style = doc.styles["table of figures"]
    p.paragraph_format.left_indent = Pt(20)
    p.paragraph_format.first_line_indent = Pt(-20)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    apply_font_to_p(p, size=Pt(10.5), bold=False)

# 7. SYNCHRONIZE LIST OF TABLES
EXACT_LOT_PAGES = {
    "Table 1.1: Terms, Acronyms, and Abbreviations": "9",
    "Table 2.1: Work contribution": "11",
    "Table 2.2: Project Risk Analysis": "13",
    "Table 2.3: Project Deliverables and Schedule": "14",
    "Table 4.1: Technology Stack and Tools Used": "37",
    "Table 5.1: Roles": "40",
    "Table 5.2: Users": "40",
    "Table 5.3: Categories": "41",
    "Table 5.4: Products": "41",
    "Table 5.5: Product_Variants": "41",
    "Table 5.6: Specs": "42",
    "Table 5.7: Product_Specs": "42",
    "Table 5.8: Orders": "43",
    "Table 5.9: Order_Items": "43",
    "Table 5.10: Requirements Traceability Matrix": "51"
}

doc.paragraphs[idx_lot].paragraph_format.page_break_before = True
doc.paragraphs[idx_lot].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[idx_lot].paragraph_format.space_before = Pt(12)
doc.paragraphs[idx_lot].paragraph_format.space_after = Pt(12)
apply_font_to_p(doc.paragraphs[idx_lot], size=Pt(16), bold=True)

for i in range(idx_lot + 1, idx_ch1):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt: continue
    parts = txt.split("\t")
    clean_caption = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', parts[0]).strip()
    page_str = EXACT_LOT_PAGES.get(clean_caption, parts[1].strip() if len(parts) > 1 else "")
    p.text = f"{clean_caption}\t{page_str}"
    p.style = doc.styles["table of figures"]
    p.paragraph_format.left_indent = Pt(20)
    p.paragraph_format.first_line_indent = Pt(-20)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    apply_font_to_p(p, size=Pt(10.5), bold=False)

# 8. ENFORCE 100% TIMES NEW ROMAN ACROSS ALL REMAINING PARAGRAPHS
for p in doc.paragraphs:
    for r in p.runs:
        if r.font.name != "Times New Roman":
            r.font.name = "Times New Roman"
            r._r.get_or_add_rPr()
            rPr = r._r.rPr
            rFonts = rPr.find(qn('w:rFonts'))
            if rFonts is not None:
                rFonts.set(qn('w:ascii'), 'Times New Roman')
                rFonts.set(qn('w:hAnsi'), 'Times New Roman')
                rFonts.set(qn('w:cs'), 'Times New Roman')

doc.save(DEST_FILE)
print(f"Saved initial pass to {DEST_FILE}")

# 9. PURGE HYPERLINK BLUE/UNDERLINE IN word/styles.xml
temp_zip = DEST_FILE + ".tmp.zip"
with zipfile.ZipFile(DEST_FILE, 'r') as zin, zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "word/styles.xml":
            xml_str = data.decode('utf-8')
            # Replace hyperlink color and underline
            xml_str = re.sub(
                r'(<w:style[^>]*w:styleId="Hyperlink"[^>]*>[\s\S]*?<w:rPr>)([\s\S]*?)(</w:rPr>)',
                r'\1<w:color w:val="000000"/><w:u w:val="none"/>\3',
                xml_str
            )
            data = xml_str.encode('utf-8')
        zout.writestr(item, data)

shutil.move(temp_zip, DEST_FILE)
print("Updated styles.xml in docx package successfully.")

# 10. VERIFY WITH WORD COM & EXPORT TO PDF
import win32com.client
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
t0 = time.time()
try:
    doc_abs = os.path.abspath(DEST_FILE)
    pdf_abs = os.path.abspath(PDF_FILE)
    wdoc = word.Documents.Open(doc_abs)
    total_pages = wdoc.ComputeStatistics(2)
    wdoc.SaveAs(pdf_abs, FileFormat=17) # 17 = wdExportFormatPDF
    wdoc.Close(False)
    print(f"WORD COM VERIFICATION SUCCESS in {time.time()-t0:.2f}s! Total pages: {total_pages}")
except Exception as e:
    print(f"WORD COM ERROR: {e}")
finally:
    word.Quit()
