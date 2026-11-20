import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(DOC_PATH)

print("=" * 60)
print("FIXING ISSUE 1: COVER PAGE BREAKS")
print("=" * 60)
# Find Page 1 end and Page 2 start
p_inner_cover = None
p_ack = None
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "VIETNAM GENERAL CONFEDERATION OF LABOR" and i > 10:
        p_inner_cover = p
        print(f"Found Page 2 start at P[{i}]: {repr(txt)}")
    elif txt == "ACKNOWLEDGEMENT":
        p_ack = p
        print(f"Found Page 3 start at P[{i}]: {repr(txt)}")

if p_inner_cover is not None:
    p_inner_cover.paragraph_format.page_break_before = True
    print("Enforced page_break_before on Page 2 (Inner Cover)")

if p_ack is not None:
    p_ack.paragraph_format.page_break_before = True
    print("Enforced page_break_before on Page 3 (Acknowledgement)")

# Remove excessive empty paragraphs on Page 1 (between P[15] and P[22])
empty_paras_to_remove = []
for i in range(16, 22):
    p = doc.paragraphs[i]
    if not p.text.strip() and 'blip' not in p._element.xml:
        empty_paras_to_remove.append(p)

print(f"Removing {len(empty_paras_to_remove)} excessive empty paragraphs on Page 1")
for p in empty_paras_to_remove:
    p._element.getparent().remove(p._element)

print("=" * 60)
print("FIXING ISSUE 4: REMOVE PHANTOM SINGLE-LINE PAGE ('COMPUTER SHOP MANAGEMENT SOFTWARE')")
print("=" * 60)
# Find P[85] 'COMPUTER SHOP MANAGEMENT SOFTWARE ' and empty paras right before EXECUTIVE SUMMARY
paras_to_remove = []
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "COMPUTER SHOP MANAGEMENT SOFTWARE" or txt == "COMPUTER SHOP MANAGEMENT SOFTWARE ":
        paras_to_remove.append(p)
        print(f"Found phantom title at P[{i}]: {repr(txt)}")
    elif not txt and i > 75 and i < 90:
        # Check if next paragraph is EXECUTIVE SUMMARY or this is right after signature
        if i + 1 < len(doc.paragraphs) and doc.paragraphs[i+1].text.strip() == "EXECUTIVE SUMMARY":
            paras_to_remove.append(p)

for p in paras_to_remove:
    p._element.getparent().remove(p._element)
print(f"Removed {len(paras_to_remove)} phantom paragraphs before Executive Summary")

print("=" * 60)
print("FIXING ISSUE 2: DECLARATION OF AUTHORSHIP FONT TO TIMES NEW ROMAN")
print("=" * 60)
in_declaration = False
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "DECLARATION OF AUTHORSHIP":
        in_declaration = True
    elif txt == "EXECUTIVE SUMMARY":
        in_declaration = False
        break

    if in_declaration:
        for r in p.runs:
            r.font.name = "Times New Roman"
            r.font.color.rgb = RGBColor(0, 0, 0)
        # Check XML rFonts
        for r in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
            rPr = r.get_or_add_rPr()
            rFonts = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rFonts')
            if rFonts is not None:
                rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ascii'] = "Times New Roman"
                rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}hAnsi'] = "Times New Roman"
print("Enforced Times New Roman font on DECLARATION OF AUTHORSHIP")

print("=" * 60)
print("FIXING ISSUE 3: TABLE OF CONTENTS BLUE TEXT, UNDERLINE, AND RAW TOC INSTRUCTION")
print("=" * 60)
in_toc = False
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "TABLE OF CONTENT":
        in_toc = True
        continue
    elif txt == "LIST OF FIGURES":
        in_toc = False
        break

    if in_toc:
        # 1. Remove raw TOC instruction text and field chars
        for fldChar in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar'):
            fldChar.getparent().remove(fldChar)
        for instr in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}instrText'):
            if "TOC" in (instr.text or ""):
                # Remove parent run
                parent_r = instr.getparent()
                parent_r.getparent().remove(parent_r)
                print(f"Removed raw TOC instruction from P[{i}]")

        # 2. Strip Hyperlink rStyle and force black color and no underline on all runs
        for r in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
            rPr = r.get_or_add_rPr()
            for rStyle in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rStyle'):
                rPr.remove(rStyle)
            # Remove existing u and color
            for u in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}u'):
                rPr.remove(u)
            for color in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color'):
                rPr.remove(color)
            
            # Add black color and u none
            rPr.append(parse_xml('<w:color xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="000000"/>'))
            rPr.append(parse_xml('<w:u xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" w:val="none"/>'))

# Also update Hyperlink style in doc.styles
try:
    s_hyp = doc.styles['Hyperlink']
    s_hyp.font.color.rgb = RGBColor(0, 0, 0)
    s_hyp.font.underline = False
    rPr = s_hyp._element.rPr
    if rPr is not None:
        for u in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}u'):
            u.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'] = "none"
        for c in rPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}color'):
            c.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'] = "000000"
            if '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}themeColor' in c.attrib:
                del c.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}themeColor']
    print("Updated Hyperlink style to Black (#000000) and no underline")
except Exception as e:
    print("Hyperlink style update notice:", e)

doc.save(DOC_PATH)
print("Successfully saved fixes to:", DOC_PATH)
