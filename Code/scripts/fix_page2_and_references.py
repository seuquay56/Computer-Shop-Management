import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(DOC_PATH)

print("=" * 60)
print("1. REMOVING DUPLICATE REFERENCES (SDT / BIBLIOGRAPHY BLOCK)")
print("=" * 60)

# 1. Remove any top-level w:sdt in w:body
body = doc._element.body
sdts_removed = 0
for child in list(body):
    if child.tag.endswith('sdt'):
        body.remove(child)
        sdts_removed += 1
print(f"Removed {sdts_removed} top-level <w:sdt> elements (containing duplicate bibliography).")

# 2. Find Chapter 7.3 Testing, clean empty paragraphs after it, and build unified clean REFERENCES
p_test_fig = None
p_ref_heading = None
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt.startswith("Figure 7.3:"):
        p_test_fig = p
        print(f"Found Figure 7.3 at P[{i}]")
    elif txt == "REFERENCES":
        p_ref_heading = p
        print(f"Found REFERENCES heading at P[{i}]")

# Remove all existing paragraphs after Figure 7.3 (including empty paragraphs, old REFERENCES heading, and old citations)
if p_test_fig is not None:
    found_fig = False
    paras_to_remove = []
    for p in doc.paragraphs:
        if p == p_test_fig:
            found_fig = True
            continue
        if found_fig:
            paras_to_remove.append(p)
    print(f"Removing {len(paras_to_remove)} trailing paragraphs after Figure 7.3")
    for p in paras_to_remove:
        p._element.getparent().remove(p._element)

# Now append a single clean REFERENCES section with page_break_before=True
p_ref = doc.add_paragraph("REFERENCES")
p_ref.style = "Heading 1"
p_ref.paragraph_format.page_break_before = True
p_ref.paragraph_format.keep_with_next = True
p_ref.paragraph_format.space_before = Pt(12)
p_ref.paragraph_format.space_after = Pt(6)
p_ref.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
for r in p_ref.runs:
    r.font.name = "Times New Roman"
    r.font.size = Pt(16)
    r.font.bold = True
    r.font.color.rgb = RGBColor(0, 0, 0)

# Add the 13 unified citations
citations = [
    '[1] I. Sommerville, Software Engineering, 10th ed. Boston, MA, USA: Pearson, 2016.',
    '[2] R. S. Pressman and B. R. Maxim, Software Engineering: A Practitioner\'s Approach, 8th ed. New York, NY, USA: McGraw-Hill Education, 2014.',
    '[3] R. C. Martin, Clean Architecture: A Craftsman\'s Guide to Software Structure and Design. Boston, MA, USA: Prentice Hall, 2017.',
    '[4] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, Design Patterns: Elements of Reusable Object-Oriented Software. Reading, MA, USA: Addison-Wesley, 1994.',
    '[5] Object Management Group (OMG), "OMG Unified Modeling Language (OMG UML) Specification, Version 2.5.1," Dec. 2017.',
    '[6] M. Jones, J. Bradley, and N. Sakimura, "JSON Web Token (JWT)," Internet Engineering Task Force (IETF), RFC 7519, May 2015.',
    '[7] OpenJS Foundation, "Node.js v20 Documentation & Express.js Web Framework Guide," 2026. [Online]. Available: https://nodejs.org/docs',
    '[8] PostgreSQL Global Development Group, "PostgreSQL 16 Relational Database Documentation," 2026. [Online]. Available: https://www.postgresql.org/docs/',
    '[9] ISO/IEC, "Systems and software engineering — Systems and software Quality Requirements and Evaluation (SQuaRE) — System and software quality models," ISO/IEC 25010:2011, Mar. 2011.',
    '[10] International Software Testing Qualifications Board (ISTQB), "Certified Tester Foundation Level (CTFL) Syllabus, Version 4.0," 2023. [Online]. Available: https://www.istqb.org/',
    '[11] Meta Open Source, "Jest: Delightful JavaScript Testing Framework Documentation (v29)," 2026. [Online]. Available: https://jestjs.io/docs/getting-started',
    '[12] SePay Vietnam, "SePay VietQR & Automated Bank Transfer Webhook API Documentation (v2)," 2026. [Online]. Available: https://docs.sepay.vn/',
    '[13] National Payment Corporation of Vietnam (NAPAS), "VietQR Quick Response Code Standard for Fast Fund Transfer 24/7 (EMVCo Specification)," 2024.'
]

for cite in citations:
    p_c = doc.add_paragraph(cite)
    p_c.style = "Normal"
    p_c.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p_c.paragraph_format.line_spacing = 1.15
    p_c.paragraph_format.space_before = Pt(0)
    p_c.paragraph_format.space_after = Pt(4)
    p_c.paragraph_format.left_indent = Inches(0.4)
    p_c.paragraph_format.first_line_indent = Inches(-0.4)
    for r in p_c.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.font.color.rgb = RGBColor(0, 0, 0)

print(f"Appended single REFERENCES section with {len(citations)} complete IEEE citations.")

print("\n" + "=" * 60)
print("2. FIXING PAGE 1 & PAGE 2 LAYOUT (PREVENTING HO CHI MINH CITY SPILL)")
print("=" * 60)

# Identify Page 1 end, Page 2 start, and Page 2 end
# Page 1: P[0] to P_page1_end
# Page 2: starts at "VIETNAM GENERAL CONFEDERATION OF LABOR" (2nd occurrence)
# Ends at "HO CHI MINH CITY, 2026" (2nd occurrence)
p2_start_idx = None
p2_end_idx = None
count_labor = 0
count_hcm = 0

for i, p in enumerate(doc.paragraphs[:60]):
    txt = p.text.strip()
    if txt == "VIETNAM GENERAL CONFEDERATION OF LABOR":
        count_labor += 1
        if count_labor == 2:
            p2_start_idx = i
    elif txt == "HO CHI MINH CITY, 2026":
        count_hcm += 1
        if count_hcm == 2:
            p2_end_idx = i

print(f"Page 2 range in paragraphs: P[{p2_start_idx}] to P[{p2_end_idx}]")

# Let's inspect paragraphs on Page 2 and remove unnecessary consecutive empty paragraphs
empty_to_remove = []
# On Page 2:
# Keep at most 1 empty line between elements:
# Logo -> 1 empty line -> names
# names -> 1 empty line -> FINAL ESSAY
# FINAL ESSAY -> SOFTWARE ENGINEERING (no empty line or 1)
# SOFTWARE ENGINEERING -> 1 empty line -> Advised by
# Mr. Nguyen Ngoc Phien -> 1 empty line -> HO CHI MINH CITY, 2026

consecutive_empty = 0
for i in range(p2_start_idx, p2_end_idx):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    has_pic = 'blip' in p._element.xml
    if not txt and not has_pic:
        consecutive_empty += 1
        if consecutive_empty > 1:
            empty_to_remove.append(p)
    else:
        consecutive_empty = 0

print(f"Removing {len(empty_to_remove)} excess empty lines from Page 2.")
for p in empty_to_remove:
    p._element.getparent().remove(p._element)

# Now recalculate indices and format Page 1 and Page 2 paragraphs strictly
count_labor = 0
count_hcm = 0
p2_start = None
p2_end = None
p_ack = None

for i, p in enumerate(doc.paragraphs[:60]):
    txt = p.text.strip()
    if txt == "VIETNAM GENERAL CONFEDERATION OF LABOR":
        count_labor += 1
        if count_labor == 2:
            p2_start = p
    elif txt == "HO CHI MINH CITY, 2026":
        count_hcm += 1
        if count_hcm == 2:
            p2_end = p
    elif txt == "ACKNOWLEDGEMENT":
        p_ack = p

if p2_start is not None:
    p2_start.paragraph_format.page_break_before = True
if p_ack is not None:
    p_ack.paragraph_format.page_break_before = True

# Format all paragraphs on Page 1 and Page 2: space_before=0, space_after=0, line_spacing=1.0 (or 1.15 for title)
in_cover = True
for i, p in enumerate(doc.paragraphs):
    if p == p_ack:
        break
    # For cover paragraphs, enforce 0 space after and 0 space before
    txt = p.text.strip()
    if txt in ["FINAL ESSAY", "FINAL ESSAY ", "SOFTWARE ENGINEERING"]:
        p.paragraph_format.line_spacing = 1.15
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(4)
    else:
        p.paragraph_format.line_spacing = 1.0
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
    
    # Ensure Times New Roman on all runs
    for r in p.runs:
        r.font.name = "Times New Roman"
        r.font.color.rgb = RGBColor(0, 0, 0)
    # Ensure oxml rFonts
    for r_el in p._element.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
        rPr = r_el.get_or_add_rPr()
        rFonts = rPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}rFonts')
        if rFonts is not None:
            rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ascii'] = "Times New Roman"
            rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}hAnsi'] = "Times New Roman"
            rFonts.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}cs'] = "Times New Roman"

# Ensure all section margins match TDTU template
for sec in doc.sections:
    sec.top_margin = Inches(1.38)     # 3.5cm
    sec.bottom_margin = Inches(1.18)  # 3.0cm
    sec.left_margin = Inches(1.38)    # 3.5cm
    sec.right_margin = Inches(0.79)   # 2.0cm

doc.save(DOC_PATH)
print(f"Successfully saved updated document to: {DOC_PATH}")
