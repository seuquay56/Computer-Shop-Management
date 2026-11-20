import docx
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def create_spacer_p():
    return parse_xml(f'<w:p {nsdecls("w")}><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr><w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t></w:t></w:r></w:p>')

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")

# Step 1: Fix Page 1
# Locate first 'HO CHI MINH CITY, 2026'
p_hcm1 = None
for i in range(25):
    if doc.paragraphs[i].text.strip() == "HO CHI MINH CITY, 2026":
        p_hcm1 = doc.paragraphs[i]
        break

# Insert 4 spacers before p_hcm1
for _ in range(4):
    p_hcm1._p.addprevious(create_spacer_p())

print("Added 4 spacers to Page 1")

# Step 2: Fix Page 2
# Count labor headers
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

# Insert 2 spacers before p2_names (after logo)
for _ in range(2):
    p2_names._p.addprevious(create_spacer_p())

# Insert 2 spacers before p2_essay (after names)
for _ in range(2):
    p2_essay._p.addprevious(create_spacer_p())

# Insert 3 spacers before p2_advised (after course)
for _ in range(3):
    p2_advised._p.addprevious(create_spacer_p())

print("Added spacers to Page 2")

# Print out all paragraphs from 0 to ACKNOWLEDGEMENT
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    img = "IMG" if "w:drawing" in p._p.xml else ""
    pb = "PB" if p.paragraph_format.page_break_before else ""
    if txt == "ACKNOWLEDGEMENT":
        print(f"P[{i:02d}]: {txt!r} {pb}")
        break
    print(f"P[{i:02d}]: {txt[:35]!r:38} | {img:4} {pb}")
