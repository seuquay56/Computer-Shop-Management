import os
import sys
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
DOC_PATH = os.path.join(BASE_DIR, "524H00057_524H0069_524H0052_updated.docx")

# Palette constants
COLOR_NAVY = "1E3A8A"        # Deep Navy for Table Headers
COLOR_ALT_ROW = "F8FAFC"     # Slate 50 for alternating rows
COLOR_WHITE = "FFFFFF"
COLOR_BLACK = RGBColor(0, 0, 0)
COLOR_WHITE_RGB = RGBColor(255, 255, 255)

def set_cell_background(cell, fill_hex):
    tcPr = cell._element.get_or_add_tcPr()
    for shd in tcPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd'):
        tcPr.remove(shd)
    tcPr.append(parse_xml(f'<w:shd xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:fill="{fill_hex}"/>'))

def set_cell_margins(cell, top=70, bottom=70, left=110, right=110):
    tcPr = cell._element.get_or_add_tcPr()
    for tcMar in tcPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tcMar'):
        tcPr.remove(tcMar)
    tcMar = parse_xml(
        f'<w:tcMar xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
        f'<w:top w:w="{top}" w:type="dxa"/>'
        f'<w:bottom w:w="{bottom}" w:type="dxa"/>'
        f'<w:left w:w="{left}" w:type="dxa"/>'
        f'<w:right w:w="{right}" w:type="dxa"/>'
        f'</w:tcMar>'
    )
    tcPr.append(tcMar)

def format_unified_table(table):
    """Formats every table to the exact unified Navy/Slate theme with Times New Roman."""
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for r_idx, row in enumerate(table.rows):
        trPr = row._element.get_or_add_trPr()
        if trPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}cantSplit') is None:
            trPr.append(parse_xml('<w:cantSplit xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))
        
        is_header = (r_idx == 0)
        if is_header:
            if trPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tblHeader') is None:
                trPr.append(parse_xml('<w:tblHeader xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))
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

def apply_times_font_to_paragraph(p, size=None, bold=None, italic=None, color=COLOR_BLACK):
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

def main():
    print(f"Loading document directly from: {DOC_PATH}")
    doc = docx.Document(DOC_PATH)

    # =========================================================================
    # 1. APPLY TDTU MARGINS MATCHING Midterm Template.docx
    # =========================================================================
    print("Step 1: Setting page margins to exact TDTU template standard...")
    # Top = 3.5cm (1.38 in), Bottom = 3.0cm (1.18 in), Left = 3.5cm (1.38 in), Right = 2.0cm (0.79 in)
    for i, sec in enumerate(doc.sections):
        sec.top_margin = Inches(1.38)
        sec.bottom_margin = Inches(1.18)
        sec.left_margin = Inches(1.38)
        sec.right_margin = Inches(0.79)
        sec.header_distance = Inches(0.50)
        sec.footer_distance = Inches(0.50)
    print("Applied margins (Left: 3.5cm, Right: 2.0cm, Top: 3.5cm, Bottom: 3.0cm) to all sections.")

    # =========================================================================
    # 2. FIX COVER PAGES & SEPARATIONS (PAGES 1, 2, 3, 4)
    # =========================================================================
    print("Step 2: Fixing cover page transitions and removing extra spacing...")
    # Find Page 1 bottom, Page 2 top, Acknowledgement top, Declaration top
    p_inner_cover = None
    p_ack = None
    p_dec = None
    idx_inner_cover = None
    for idx, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt == "VIETNAM GENERAL CONFEDERATION OF LABOR" and p_inner_cover is None and idx > 10:
            p_inner_cover = p
            idx_inner_cover = idx
        elif txt == "ACKNOWLEDGEMENT":
            p_ack = p
        elif txt == "DECLARATION OF AUTHORSHIP":
            p_dec = p

    # Enforce page_break_before on Page 2 (Inner Cover), Page 3 (Acknowledgement), Page 4 (Declaration)
    if p_inner_cover is not None:
        p_inner_cover.paragraph_format.page_break_before = True
        print("Page 2 (Inner Cover): enforced page_break_before=True")
    if p_ack is not None:
        p_ack.paragraph_format.page_break_before = True
        print("Page 3 (Acknowledgement): enforced page_break_before=True")
    if p_dec is not None:
        p_dec.paragraph_format.page_break_before = True
        print("Page 4 (Declaration): enforced page_break_before=True")

    # Remove extra empty paragraphs on Page 1 (between Software Engineering and Ho Chi Minh City)
    paras_p1_empty = []
    end_idx = idx_inner_cover if idx_inner_cover else 25
    for i in range(16, end_idx - 1):
        p = doc.paragraphs[i]
        if not p.text.strip() and 'blip' not in p._element.xml:
            paras_p1_empty.append(p)
    # Keep only 1 empty paragraph on Page 1 for spacing
    if len(paras_p1_empty) > 1:
        for p in paras_p1_empty[:-1]:
            p._element.getparent().remove(p._element)
        print(f"Cleaned up {len(paras_p1_empty)-1} empty paragraphs on Page 1.")

    # =========================================================================
    # 3. REMOVE PHANTOM SINGLE-LINE PAGE ('COMPUTER SHOP MANAGEMENT SOFTWARE')
    # =========================================================================
    print("Step 3: Removing phantom standalone page...")
    paras_to_remove = []
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt == "COMPUTER SHOP MANAGEMENT SOFTWARE" or txt == "COMPUTER SHOP MANAGEMENT SOFTWARE ":
            paras_to_remove.append(p)
            print(f"Removing phantom title at P[{i}]: {repr(txt)}")
        elif not txt and i > 70 and i < 90:
            if i + 1 < len(doc.paragraphs) and doc.paragraphs[i+1].text.strip() == "EXECUTIVE SUMMARY":
                paras_to_remove.append(p)

    for p in paras_to_remove:
        p._element.getparent().remove(p._element)

    # Ensure EXECUTIVE SUMMARY has page_break_before
    for p in doc.paragraphs:
        if p.text.strip() == "EXECUTIVE SUMMARY":
            p.paragraph_format.page_break_before = True
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            apply_times_font_to_paragraph(p, size=Pt(16), bold=True, color=COLOR_BLACK)
            break

    # =========================================================================
    # 4. FIX TABLE OF CONTENTS: REMOVE RAW TOC INSTRUCTION & PURGE BLUE/UNDERLINE
    # =========================================================================
    print("Step 4: Cleaning Table of Contents (removing raw instruction, blue colors, and underlines)...")
    in_toc = False
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt == "TABLE OF CONTENT":
            in_toc = True
            p.paragraph_format.page_break_before = True
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            apply_times_font_to_paragraph(p, size=Pt(16), bold=True, color=COLOR_BLACK)
            continue
        elif txt == "LIST OF FIGURES":
            in_toc = False
            break

        if in_toc:
            # Remove raw TOC instruction and field characters
            for fldChar in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar'):
                fldChar.getparent().remove(fldChar)
            for instr in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}instrText'):
                if "TOC" in (instr.text or "") or "PAGEREF" in (instr.text or ""):
                    parent_r = instr.getparent()
                    parent_r.getparent().remove(parent_r)

            # Strip Hyperlink rStyle and force black color and no underline
            for r in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
                rPr = r.get_or_add_rPr()
                for rStyle in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rStyle'):
                    rPr.remove(rStyle)
                for u in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}u'):
                    rPr.remove(u)
                for color in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color'):
                    rPr.remove(color)

                rPr.append(parse_xml('<w:color xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="000000"/>'))
                rPr.append(parse_xml('<w:u xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="none"/>'))

            # Apply Times New Roman to runs in TOC
            apply_times_font_to_paragraph(p, size=Pt(12), color=COLOR_BLACK)

    # Update Hyperlink style in styles.xml
    try:
        s_hyp = doc.styles['Hyperlink']
        s_hyp.font.name = "Times New Roman"
        s_hyp.font.color.rgb = COLOR_BLACK
        s_hyp.font.underline = False
        rPr = s_hyp._element.rPr
        if rPr is not None:
            for u in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}u'):
                u.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'] = "none"
            for c in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color'):
                c.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'] = "000000"
                if '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}themeColor' in c.attrib:
                    del c.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}themeColor']
    except Exception as e:
        pass

    # =========================================================================
    # 5. ENFORCE 100% TIMES NEW ROMAN & JUSTIFIED BODY SPACING (MATCHING TEMPLATE)
    # =========================================================================
    print("Step 5: Enforcing 100% Times New Roman across ALL paragraphs, headings, and tables...")
    for p in doc.paragraphs:
        txt = p.text.strip()
        is_hd1 = txt.startswith("CHAPTER") or txt in [
            "DECLARATION OF AUTHORSHIP", "ACKNOWLEDGEMENT", "EXECUTIVE SUMMARY",
            "TABLE OF CONTENT", "LIST OF FIGURES", "LIST OF TABLES", "REFERENCES"
        ]
        is_hd2 = any(txt.startswith(f"{c}.") for c in range(1, 8)) and len(txt.split()[0].split('.')) == 2
        is_hd3 = any(txt.startswith(f"{c}.") for c in range(1, 8)) and len(txt.split()[0].split('.')) == 3
        is_caption = txt.startswith("Figure ") or txt.startswith("Table ")

        if is_hd1:
            p.paragraph_format.keep_with_next = True
            p.paragraph_format.space_before = Pt(12)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.3
            apply_times_font_to_paragraph(p, size=Pt(16), bold=True, color=COLOR_BLACK)

        elif is_hd2:
            p.paragraph_format.keep_with_next = True
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.3
            apply_times_font_to_paragraph(p, size=Pt(14), bold=True, color=COLOR_BLACK)

        elif is_hd3:
            p.paragraph_format.keep_with_next = True
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.3
            apply_times_font_to_paragraph(p, size=Pt(13), bold=True, italic=True, color=COLOR_BLACK)

        elif is_caption:
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(4)
            p.paragraph_format.space_after = Pt(6)
            apply_times_font_to_paragraph(p, size=Pt(11), bold=True, color=COLOR_BLACK)

        else:
            # Body paragraph
            if p.style and p.style.name == "table of figures":
                apply_times_font_to_paragraph(p, size=Pt(10), color=COLOR_BLACK)
            elif any(txt.startswith(k) for k in ["VIETNAM GENERAL", "TON DUC THANG", "FACULTY OF", "ON GIA KHIEM", "VO NGUYEN", "NGUYEN NHAT", "FINAL ESSAY", "SOFTWARE ENGINEERING", "HO CHI MINH CITY", "Advised by", "Mr. Nguyen"]):
                # Cover page items: keep their sizes and centering, but force Times New Roman
                apply_times_font_to_paragraph(p, color=COLOR_BLACK)
            else:
                # Regular body text: Justified, 13pt, 1.3 line spacing, 6pt after
                p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                p.paragraph_format.line_spacing = 1.3
                p.paragraph_format.space_before = Pt(0)
                p.paragraph_format.space_after = Pt(6)
                apply_times_font_to_paragraph(p, size=Pt(13), color=COLOR_BLACK)

    # Format all tables with Times New Roman and unified Navy theme
    print("Step 6: Formatting all tables with Times New Roman and unified Navy theme...")
    for t in doc.tables:
        format_unified_table(t)

    # Save directly via python-docx (100% native oxml)
    print(f"Saving changes directly to: {DOC_PATH}")
    doc.save(DOC_PATH)
    print(f"SUCCESS: {DOC_PATH} completely updated with 100% Times New Roman, TDTU margins, and clean cover layout!")

if __name__ == "__main__":
    main()
