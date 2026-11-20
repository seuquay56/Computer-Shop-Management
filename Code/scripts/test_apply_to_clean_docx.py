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
TEST_PATH = r"test_clean_formatted.docx"

shutil.copyfile(SRC_PATH, TEST_PATH)
doc = docx.Document(TEST_PATH)

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

# 1. Page 1 & 2 spacers
p_hcm1 = None
for i in range(25):
    if doc.paragraphs[i].text.strip() == "HO CHI MINH CITY, 2026":
        p_hcm1 = doc.paragraphs[i]
        break

for _ in range(4):
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

# Find anchors
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
print(f"Anchors: P2={idx_p2}, Ack={idx_ack}, Dec={idx_dec}, SwTitle={idx_sw_title}, Abs={idx_abstract}, TOC={idx_toc}, LOF={idx_lof}, LOT={idx_lot}, Ch1={idx_ch1}")

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

# 2. Format Signatures
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

# 3. Remove standalone title
if idx_sw_title is not None and idx_sw_title < (idx_abstract or 999):
    doc.paragraphs[idx_sw_title].text = ""

# Executive Summary
if idx_abstract is not None:
    doc.paragraphs[idx_abstract].text = "EXECUTIVE SUMMARY"
    doc.paragraphs[idx_abstract].paragraph_format.page_break_before = True
    doc.paragraphs[idx_abstract].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    doc.paragraphs[idx_abstract].paragraph_format.space_before = Pt(12)
    doc.paragraphs[idx_abstract].paragraph_format.space_after = Pt(6)
    apply_font_to_p(doc.paragraphs[idx_abstract], size=Pt(16), bold=True)

# 4. TOC formatting
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
    page_str = parts[1].strip() if len(parts) > 1 else ""
    
    is_lvl3 = bool(re.match(r'^\d+\.\d+\.\d+', clean_title))
    is_lvl2 = bool(re.match(r'^\d+\.\d+', clean_title)) and not is_lvl3
    is_lvl1 = not is_lvl2 and not is_lvl3
    
    p.text = f"{clean_title}\t{page_str}"
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    p.paragraph_format.line_spacing = 1.15
    if is_lvl1:
        p.style = doc.styles["toc 1"]
        p.paragraph_format.left_indent = Pt(0)
        p.paragraph_format.space_before = Pt(4); p.paragraph_format.space_after = Pt(2)
        apply_font_to_p(p, size=Pt(12), bold=True)
    elif is_lvl2:
        p.style = doc.styles["toc 2"]
        p.paragraph_format.left_indent = Pt(18)
        p.paragraph_format.space_before = Pt(1); p.paragraph_format.space_after = Pt(1)
        apply_font_to_p(p, size=Pt(11), bold=False)
    else:
        p.style = doc.styles["toc 3"]
        p.paragraph_format.left_indent = Pt(36)
        p.paragraph_format.space_before = Pt(0); p.paragraph_format.space_after = Pt(1)
        apply_font_to_p(p, size=Pt(10.5), bold=False)

# 5. LOF & LOT formatting
doc.paragraphs[idx_lof].paragraph_format.page_break_before = True
doc.paragraphs[idx_lof].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
apply_font_to_p(doc.paragraphs[idx_lof], size=Pt(16), bold=True)

for i in range(idx_lof + 1, idx_lot):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt: continue
    parts = txt.split("\t")
    clean_caption = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', parts[0]).strip()
    page_str = parts[1].strip() if len(parts) > 1 else ""
    p.text = f"{clean_caption}\t{page_str}"
    p.style = doc.styles["table of figures"]
    p.paragraph_format.left_indent = Pt(20)
    p.paragraph_format.first_line_indent = Pt(-20)
    p.paragraph_format.space_before = Pt(0); p.paragraph_format.space_after = Pt(2.5)
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    apply_font_to_p(p, size=Pt(10.5), bold=False)

doc.paragraphs[idx_lot].paragraph_format.page_break_before = True
doc.paragraphs[idx_lot].paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
apply_font_to_p(doc.paragraphs[idx_lot], size=Pt(16), bold=True)

for i in range(idx_lot + 1, idx_ch1):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if not txt: continue
    parts = txt.split("\t")
    clean_caption = re.sub(r'PAGEREF\s+\S+\s*(\\h)?\s*\d*', '', parts[0]).strip()
    page_str = parts[1].strip() if len(parts) > 1 else ""
    p.text = f"{clean_caption}\t{page_str}"
    p.style = doc.styles["table of figures"]
    p.paragraph_format.left_indent = Pt(20)
    p.paragraph_format.first_line_indent = Pt(-20)
    p.paragraph_format.space_before = Pt(0); p.paragraph_format.space_after = Pt(2.5)
    set_right_tab_with_dot_leader(p, tab_pos_pt=439.0)
    apply_font_to_p(p, size=Pt(10.5), bold=False)

doc.save(TEST_PATH)
print("Saved", TEST_PATH)

# Test open in Word COM
import win32com.client
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
t0 = time.time()
try:
    d = word.Documents.Open(os.path.abspath(TEST_PATH))
    pages = d.ComputeStatistics(2)
    print(f"SUCCESS! test_clean_formatted.docx opened in {time.time()-t0:.2f}s! Total pages: {pages}")
    d.Close(False)
except Exception as e:
    print("FAILED:", e)
finally:
    word.Quit()
