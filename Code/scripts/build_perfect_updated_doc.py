import shutil
import os
import re
import zipfile
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn

SRC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052.docx"
TARGET_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"

print(f"Step 0: Copying {SRC_PATH} -> {TARGET_PATH}")
shutil.copyfile(SRC_PATH, TARGET_PATH)

doc = docx.Document(TARGET_PATH)

def create_spacer_p():
    return parse_xml(f'<w:p {nsdecls("w")}><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t></w:t></w:r></w:p>')

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

# -------------------------------------------------------------------------
# 1. FIX COVER (PAGE 1) & SUB-COVER (PAGE 2) VERTICAL BALANCING
# -------------------------------------------------------------------------
print("\n--- 1. Adjusting Cover & Sub-Cover Spacers ---")
# 1. Page 1: locate first 'HO CHI MINH CITY, 2026'
p_hcm1 = None
for i in range(25):
    if doc.paragraphs[i].text.strip() == "HO CHI MINH CITY, 2026":
        p_hcm1 = doc.paragraphs[i]
        break

# Insert 4 spacers before p_hcm1
for _ in range(4):
    p_hcm1._p.addprevious(create_spacer_p())
print("Added 4 spacers to Page 1")

# 2. Page 2: locate elements
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

# Insert spacers on Page 2 matching template
for _ in range(2):
    p2_names._p.addprevious(create_spacer_p())
for _ in range(2):
    p2_essay._p.addprevious(create_spacer_p())
for _ in range(3):
    p2_advised._p.addprevious(create_spacer_p())
print("Added 7 spacers to Page 2")

# Re-identify section anchors
p_labor_indices = []
idx_ack = None
idx_dec = None
idx_sw_title = None
idx_abstract = None
idx_toc = None
idx_lof = None
idx_lot = None
idx_ch1 = None
idx_ref = None

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
    elif txt == "CHAPTER 1. INTRODUCTION" and i > 150 and idx_ch1 is None:
        idx_ch1 = i
    elif txt == "REFERENCES" and i > 300 and idx_ref is None:
        idx_ref = i

idx_p2 = p_labor_indices[1]
print(f"Anchors: P2={idx_p2}, Ack={idx_ack}, Dec={idx_dec}, SwTitle={idx_sw_title}, Abs={idx_abstract}, TOC={idx_toc}, LOF={idx_lof}, LOT={idx_lot}, Ch1={idx_ch1}, Ref={idx_ref}")

# Enforce page breaks
doc.paragraphs[idx_p2].paragraph_format.page_break_before = True
doc.paragraphs[idx_ack].paragraph_format.page_break_before = True
doc.paragraphs[idx_dec].paragraph_format.page_break_before = True
doc.paragraphs[idx_toc].paragraph_format.page_break_before = True
doc.paragraphs[idx_lof].paragraph_format.page_break_before = True
doc.paragraphs[idx_lot].paragraph_format.page_break_before = True
doc.paragraphs[idx_ch1].paragraph_format.page_break_before = True

# Format Cover Pages 1 & 2
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

# -------------------------------------------------------------------------
# 2. FORMAT RIGHT-INDENTED SIGNATURES (PAGES 3 & 4)
# -------------------------------------------------------------------------
print("\n--- 2. Formatting Right-Indented Signatures ---")
def format_signature_zone(start_idx, end_idx):
    for i in range(start_idx, end_idx):
        p = doc.paragraphs[i]
        txt = p.text.strip()
        clean_txt = re.sub(r'^\t+', '', p.text).strip()
        
        if "Ho Chi Minh city" in txt:
            p.text = "Ho Chi Minh city, 11th November 2026."
            p.paragraph_format.left_indent = Pt(191.4)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.15
            apply_font_to_p(p, size=Pt(12), italic=True)
        elif txt == "Author":
            p.text = "Author"
            p.paragraph_format.left_indent = Pt(180.0)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(2)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.15
            apply_font_to_p(p, size=Pt(13), bold=True)
        elif txt == "(Signature and full name)":
            p.text = "(Signature and full name)"
            p.paragraph_format.left_indent = Pt(160.55)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(12)
            p.paragraph_format.line_spacing = 1.15
            apply_font_to_p(p, size=Pt(12), italic=True)
        elif clean_txt in ["Khiem", "Thinh", "Huy"]:
            p.text = clean_txt
            p.paragraph_format.left_indent = Pt(180.0)
            p.paragraph_format.first_line_indent = Pt(0)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.0
            apply_font_to_p(p, size=Pt(12), italic=True)
        elif clean_txt in ["On Gia Khiem", "Vo Nguyen Phuc Thinh", "Nguyen Nhat Huy"]:
            p.text = clean_txt
            p.paragraph_format.left_indent = Pt(180.0)
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
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            apply_font_to_p(p, size=Pt(12))

format_signature_zone(idx_ack, idx_dec)
format_signature_zone(idx_dec, idx_abstract or idx_toc)

# -------------------------------------------------------------------------
# 3. FIX ABSTRACT / EXECUTIVE SUMMARY (REMOVE ORPHAN TITLE PAGE)
# -------------------------------------------------------------------------
print("\n--- 3. Formatting Executive Summary ---")
# If there is a standalone COMPUTER SHOP MANAGEMENT SOFTWARE paragraph before abstract, remove it
if idx_sw_title is not None and idx_sw_title < idx_abstract:
    # Clear its text so it doesn't cause an orphan page
    doc.paragraphs[idx_sw_title].text = ""
    doc.paragraphs[idx_sw_title].paragraph_format.page_break_before = False

# Make EXECUTIVE SUMMARY heading
if idx_abstract is not None:
    doc.paragraphs[idx_abstract].text = "EXECUTIVE SUMMARY"
    doc.paragraphs[idx_abstract].paragraph_format.page_break_before = True
    doc.paragraphs[idx_abstract].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.paragraphs[idx_abstract].paragraph_format.space_before = Pt(12)
    doc.paragraphs[idx_abstract].paragraph_format.space_after = Pt(6)
    doc.paragraphs[idx_abstract].paragraph_format.line_spacing = 1.3
    apply_font_to_p(doc.paragraphs[idx_abstract], size=Pt(16), bold=True)

# Format prose between Executive Summary and TOC
for i in range((idx_abstract or 0) + 1, idx_toc):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if txt:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.first_line_indent = Pt(36)
        p.paragraph_format.left_indent = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_p(p, size=Pt(12))

# -------------------------------------------------------------------------
# 4. PROFESSIONAL TABLE OF CONTENTS (TOC)
# -------------------------------------------------------------------------
print("\n--- 4. Professionalizing Table of Contents ---")
doc.paragraphs[idx_toc].paragraph_format.page_break_before = True
doc.paragraphs[idx_toc].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[idx_toc].paragraph_format.space_before = Pt(12)
doc.paragraphs[idx_toc].paragraph_format.space_after = Pt(12)
apply_font_to_p(doc.paragraphs[idx_toc], size=Pt(16), bold=True)

# Accurate 68-page TOC mapping
toc_exact_pages = {
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
    "REFERENCES": "64",
}

for i in range(idx_toc + 1, idx_lof):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt:
        continue
    
    parts = txt.split("\t")
    raw_title = parts[0].strip()
    
    # Strip any residual field instructions
    clean_title = re.sub(r'TOC\s+\\o\s+"[^"]*"\s+\\h\s+\\z\s+\\u\s*', '', raw_title).strip()
    # Strip any PAGEREF
    clean_title = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', clean_title).strip()
    
    page_str = toc_exact_pages.get(clean_title, parts[1].strip() if len(parts) > 1 else "")
    
    is_lvl3 = bool(re.match(r'^\d+\.\d+\.\d+', clean_title))
    is_lvl2 = bool(re.match(r'^\d+\.\d+', clean_title)) and not is_lvl3
    is_lvl1 = not is_lvl2 and not is_lvl3
    
    p.text = f"{clean_title}\t{page_str}"
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    p.paragraph_format.line_spacing = 1.15
    
    if is_lvl1:
        p.style = doc.styles["toc 1"]
        p.paragraph_format.left_indent = Pt(0)
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(2)
        apply_font_to_p(p, size=Pt(12), bold=True)
    elif is_lvl2:
        p.style = doc.styles["toc 2"]
        p.paragraph_format.left_indent = Pt(18) # 0.25 in
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.space_before = Pt(1)
        p.paragraph_format.space_after = Pt(1)
        apply_font_to_p(p, size=Pt(11), bold=False)
    else: # is_lvl3
        p.style = doc.styles["toc 3"]
        p.paragraph_format.left_indent = Pt(36) # 0.50 in
        p.paragraph_format.first_line_indent = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(1)
        apply_font_to_p(p, size=Pt(10.5), bold=False, italic=False)

# -------------------------------------------------------------------------
# 5. PROFESSIONAL LIST OF FIGURES (LOF)
# -------------------------------------------------------------------------
print("\n--- 5. Professionalizing List of Figures ---")
doc.paragraphs[idx_lof].paragraph_format.page_break_before = True
doc.paragraphs[idx_lof].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[idx_lof].paragraph_format.space_before = Pt(12)
doc.paragraphs[idx_lof].paragraph_format.space_after = Pt(12)
apply_font_to_p(doc.paragraphs[idx_lof], size=Pt(16), bold=True)

fig_exact_pages = {
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
    "Figure 7.3": "63",
}

for i in range(idx_lof + 1, idx_lot):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt:
        continue
    
    parts = txt.split("\t")
    raw_caption = parts[0].strip()
    clean_caption = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', raw_caption).strip()
    
    m = re.match(r'^(Figure \d+\.\d+)', clean_caption)
    fig_key = m.group(1) if m else ""
    page_num = fig_exact_pages.get(fig_key, parts[1].strip() if len(parts) > 1 else "")
    
    if fig_key == "Figure 7.3":
        clean_caption = "Figure 7.3: Live Web Application Verification — Admin Dashboard KPIs & Real-Time Metrics"
    
    p.text = f"{clean_caption}\t{page_num}"
    p.style = doc.styles["table of figures"]
    p.paragraph_format.left_indent = Pt(20)
    p.paragraph_format.first_line_indent = Pt(-20) # Hanging indent!
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    apply_font_to_p(p, size=Pt(10.5), bold=False)

# -------------------------------------------------------------------------
# 6. PROFESSIONAL LIST OF TABLES (LOT)
# -------------------------------------------------------------------------
print("\n--- 6. Professionalizing List of Tables ---")
doc.paragraphs[idx_lot].paragraph_format.page_break_before = True
doc.paragraphs[idx_lot].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
doc.paragraphs[idx_lot].paragraph_format.space_before = Pt(12)
doc.paragraphs[idx_lot].paragraph_format.space_after = Pt(12)
apply_font_to_p(doc.paragraphs[idx_lot], size=Pt(16), bold=True)

tbl_exact_pages = {
    "Table 1.1": "10",
    "Table 2.1": "12",
    "Table 2.2": "14",
    "Table 2.3": "15",
    "Table 3.1": "19",
    "Table 3.2": "20",
    "Table 3.3": "20",
    "Table 3.4": "21",
    "Table 3.5": "21",
    "Table 3.6": "22",
    "Table 3.7": "23",
    "Table 3.8": "24",
    "Table 3.9": "25",
    "Table 3.10": "26",
    "Table 3.11": "27",
    "Table 3.12": "29",
    "Table 3.13": "33",
    "Table 3.14": "34",
    "Table 3.15": "34",
    "Table 3.16": "34",
    "Table 4.1": "36",
    "Table 5.1": "39",
    "Table 5.2": "39",
    "Table 5.3": "40",
    "Table 5.4": "40",
    "Table 5.5": "40",
    "Table 5.6": "41",
    "Table 5.7": "41",
    "Table 5.8": "41",
    "Table 5.9": "41",
    "Table 5.10": "41",
    "Table 5.11": "42",
    "Table 5.12": "45",
    "Table 5.13": "48",
    "Table 5.14": "49",
    "Table 6.1": "52",
    "Table 6.2": "57",
    "Table 6.3": "58",
    "Table 6.4": "59",
    "Table 6.5": "60",
}

for i in range(idx_lot + 1, idx_ch1):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt:
        continue
    
    parts = txt.split("\t")
    raw_caption = parts[0].strip()
    clean_caption = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', raw_caption).strip()
    
    m = re.match(r'^(Table \d+\.\d+)', clean_caption)
    tbl_key = m.group(1) if m else ""
    page_num = tbl_exact_pages.get(tbl_key, parts[1].strip() if len(parts) > 1 else "")
    
    p.text = f"{clean_caption}\t{page_num}"
    p.style = doc.styles["table of figures"]
    p.paragraph_format.left_indent = Pt(20)
    p.paragraph_format.first_line_indent = Pt(-20) # Hanging indent!
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(2.5)
    p.paragraph_format.line_spacing = 1.15
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    apply_font_to_p(p, size=Pt(10.5), bold=False)

# -------------------------------------------------------------------------
# 7. ENFORCE 100% TIMES NEW ROMAN AND CLEAN BODY PROSE
# -------------------------------------------------------------------------
print("\n--- 7. Enforcing Times New Roman, 1.3 Line Spacing, 6pt After across Body ---")
for i in range(idx_ch1, len(doc.paragraphs)):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt:
        continue
    
    # Check if Heading 1
    if txt.startswith("CHAPTER "):
        p.paragraph_format.page_break_before = True
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_p(p, size=Pt(16), bold=True)
    elif txt == "REFERENCES":
        p.paragraph_format.page_break_before = True
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_p(p, size=Pt(16), bold=True)
    elif p.style.name.startswith("Heading 2") or re.match(r'^\d+\.\d+\s+[A-Z]', txt):
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_p(p, size=Pt(14), bold=True)
    elif p.style.name.startswith("Heading 3") or re.match(r'^\d+\.\d+\.\d+\s+[A-Z]', txt):
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_p(p, size=Pt(13), bold=True)
    elif txt.startswith("Figure ") or txt.startswith("Table "):
        # Caption
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_p(p, size=Pt(11), bold=True)
    elif re.match(r'^\[\d+\]', txt):
        # Reference citation
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.left_indent = Pt(25.2)
        p.paragraph_format.first_line_indent = Pt(-25.2)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_p(p, size=Pt(11))
    else:
        # Standard prose paragraph
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.first_line_indent = Pt(36)
        p.paragraph_format.left_indent = Pt(0)
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_p(p, size=Pt(12))

print("Saving modified document...")
doc.save(TARGET_PATH)
print("Saved successfully!")
