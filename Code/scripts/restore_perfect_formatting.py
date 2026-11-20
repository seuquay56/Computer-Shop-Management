import os
import re
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(DOC_PATH)

COLOR_NAVY = "1E3A8A"
COLOR_ALT_ROW = "F8FAFC"
COLOR_WHITE = "FFFFFF"
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
                    run.font.name = "Times New Roman"
                    if is_header:
                        run.font.bold = True
                        run.font.color.rgb = COLOR_WHITE_RGB
                        run.font.size = Pt(10.0)
                    else:
                        run.font.size = Pt(9.5)
                        run.font.color.rgb = COLOR_BLACK

def apply_font_to_paragraph(p, size=None, bold=None, italic=None, color=COLOR_BLACK):
    for r in p.runs:
        r.font.name = "Times New Roman"
        if size is not None:
            r.font.size = size
        if bold is not None:
            r.font.bold = bold
        if italic is not None:
            r.font.italic = italic
        if color is not None:
            r.font.color.rgb = color
    # Ensure oxml rFonts
    for r_el in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
        rPr = r_el.get_or_add_rPr()
        rFonts = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rFonts')
        if rFonts is not None:
            rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ascii'] = "Times New Roman"
            rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}hAnsi'] = "Times New Roman"
            rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}cs'] = "Times New Roman"

print("=" * 60)
print("1. IDENTIFYING ZONES SAFELY BY PARAGRAPH INDEX")
print("=" * 60)

# Zone 1: Cover Page (Page 1): from 0 to p1_end
# Zone 2: Sub-Cover Page (Page 2): from p2_start to p2_end
# Zone 3: Front Matter (Ack, Dec, Exec Summary, TOC, LOF, LOT): from p_ack to chapter_1_start
# Zone 4: Body (Chapter 1 to Chapter 7.3): from chapter_1_start to p_ref_start
# Zone 5: References: from p_ref_start to end of document

idx_p2_start = None
idx_p2_end = None
idx_ack = None
idx_ch1 = None
idx_ref = None

count_labor = 0
count_hcm = 0

for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "VIETNAM GENERAL CONFEDERATION OF LABOR":
        count_labor += 1
        if count_labor == 2:
            idx_p2_start = i
    elif txt == "HO CHI MINH CITY, 2026":
        count_hcm += 1
        if count_hcm == 2:
            idx_p2_end = i
    elif txt == "ACKNOWLEDGEMENT" and idx_ack is None:
        idx_ack = i
    elif txt == "CHAPTER 1. INTRODUCTION" and i > 150 and idx_ch1 is None:
        idx_ch1 = i
    elif txt == "REFERENCES" and i > 300 and idx_ref is None:
        idx_ref = i

print(f"Zone boundaries:")
print(f"  Page 1: 0 to {idx_p2_start-1}")
print(f"  Page 2: {idx_p2_start} to {idx_p2_end}")
print(f"  Front matter: {idx_ack} to {idx_ch1-1}")
print(f"  Body (Ch 1-7): {idx_ch1} to {idx_ref-1}")
print(f"  References: {idx_ref} to {len(doc.paragraphs)-1}")

print("\n" + "=" * 60)
print("2. FORMATTING COVER PAGES (PAGES 1 & 2 ONLY)")
print("=" * 60)
# Enforce page breaks
doc.paragraphs[idx_p2_start].paragraph_format.page_break_before = True
doc.paragraphs[idx_ack].paragraph_format.page_break_before = True

for i in range(0, idx_ack):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if txt in ["VIETNAM GENERAL CONFEDERATION OF LABOR", "TON DUC THANG UNIVERSITY", "FACULTY OF INFORMATION TECHNOLOGY"]:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        apply_font_to_paragraph(p, size=Pt(14), bold=("CONFEDERATION" not in txt))
    elif any(k in txt for k in ["ON GIA KHIEM", "VO NGUYEN PHUC THINH", "NGUYEN NHAT HUY"]):
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        apply_font_to_paragraph(p, size=Pt(14), bold=True)
    elif txt in ["FINAL ESSAY", "FINAL ESSAY "]:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_paragraph(p, size=Pt(24), bold=True)
    elif txt == "SOFTWARE ENGINEERING":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_paragraph(p, size=Pt(22), bold=True)
    elif txt == "Advised by":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        apply_font_to_paragraph(p, size=Pt(14), bold=False)
    elif txt == "Mr. Nguyen Ngoc Phien":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_paragraph(p, size=Pt(14), bold=True)
    elif txt == "HO CHI MINH CITY, 2026":
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        apply_font_to_paragraph(p, size=Pt(14), bold=True)
    else:
        # Empty lines on cover/subcover
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.0
        apply_font_to_paragraph(p, size=Pt(12))

print("\n" + "=" * 60)
print("3. FORMATTING FRONT MATTER (ACK, DECLARATION, SUMMARY, TOC, LOF, LOT)")
print("=" * 60)
in_toc = False
in_lof = False
in_lot = False

for i in range(idx_ack, idx_ch1):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    
    if txt in ["ACKNOWLEDGEMENT", "DECLARATION OF AUTHORSHIP", "EXECUTIVE SUMMARY", "TABLE OF CONTENT", "LIST OF FIGURES", "LIST OF TABLES"]:
        p.paragraph_format.page_break_before = True
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_paragraph(p, size=Pt(16), bold=True)
        if txt == "TABLE OF CONTENT":
            in_toc = True; in_lof = False; in_lot = False
        elif txt == "LIST OF FIGURES":
            in_toc = False; in_lof = True; in_lot = False
        elif txt == "LIST OF TABLES":
            in_toc = False; in_lof = False; in_lot = True
        continue

    if in_toc:
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_paragraph(p, size=Pt(12), bold=(txt.startswith("CHAPTER") or txt in ["LIST OF FIGURES", "LIST OF TABLES", "REFERENCES"]))
    elif in_lof or in_lot:
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_paragraph(p, size=Pt(10))
    else:
        # Ack, Declaration, Executive Summary body paragraphs
        if txt:
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            apply_font_to_paragraph(p, size=Pt(13))
        else:
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3

print("\n" + "=" * 60)
print("4. FORMATTING CHAPTER 1 TO CHAPTER 7 BODY (HEADINGS, PROSE, CAPTIONS)")
print("=" * 60)
for i in range(idx_ch1, idx_ref):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    
    # Check if Heading 1
    if txt.startswith("CHAPTER "):
        p.paragraph_format.page_break_before = True
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_paragraph(p, size=Pt(16), bold=True)
    # Check if Heading 2 (e.g. "1.1 ...", "2.1 ...", "7.1 ...")
    elif re.match(r'^\d+\.\d+\s+[A-Z]', txt) and len(txt.split()[0].split('.')) == 2:
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(10)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_paragraph(p, size=Pt(14), bold=True)
    # Check if Heading 3 (e.g. "3.2.1 ...", "5.1.1 ...")
    elif re.match(r'^\d+\.\d+\.\d+\s+[A-Z]', txt) and len(txt.split()[0].split('.')) == 3:
        p.paragraph_format.keep_with_next = True
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.3
        apply_font_to_paragraph(p, size=Pt(13), bold=True, italic=True)
    # Check if Caption (Figure or Table)
    elif txt.startswith("Figure ") or txt.startswith("Table "):
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(4)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.15
        apply_font_to_paragraph(p, size=Pt(11), bold=True)
    # Check if Image container paragraph
    elif 'blip' in p._element.xml:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(6)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.0
    # Regular body prose paragraph
    else:
        if txt:
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            apply_font_to_paragraph(p, size=Pt(13))
        else:
            # Spacer empty paragraph between sections
            p.paragraph_format.space_before = Pt(0)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3

print("\n" + "=" * 60)
print("5. FORMATTING REFERENCES SECTION")
print("=" * 60)
p_ref = doc.paragraphs[idx_ref]
p_ref.paragraph_format.page_break_before = True
p_ref.paragraph_format.keep_with_next = True
p_ref.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
p_ref.paragraph_format.space_before = Pt(12)
p_ref.paragraph_format.space_after = Pt(6)
p_ref.paragraph_format.line_spacing = 1.3
apply_font_to_paragraph(p_ref, size=Pt(16), bold=True)

for i in range(idx_ref + 1, len(doc.paragraphs)):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if txt:
        p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.left_indent = Inches(0.4)
        p.paragraph_format.first_line_indent = Inches(-0.4)
        apply_font_to_paragraph(p, size=Pt(12))

print("\n" + "=" * 60)
print("6. FORMATTING ALL TABLES (UNIFIED NAVY THEME & 9.5PT/10PT TIMES)")
print("=" * 60)
for t in doc.tables:
    format_unified_table(t)

# Save document
doc.save(DOC_PATH)
print("Document successfully restored with perfect spacing, proper font hierarchy, and TDTU layout!")
