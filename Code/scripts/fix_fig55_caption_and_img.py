import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
SEPAY_IMG_PATH = r"Computer-Shop-Management\Code\docs\diagrams\seq_checkout_sepay.png"

doc = docx.Document(DOC_PATH)

# 1. Update List of Figures entry for Figure 5.5
for p in doc.paragraphs:
    if p.text.startswith("Figure 5.5:"):
        if "Batch Inward" in p.text:
            p.text = "Figure 5.5: UML Sequence Diagram — Online Checkout via SePay VietQR, Webhook Callback & Atomic Stock Deduction (UC-09, UC-10)\t41"
            pPr = p._element.get_or_add_pPr()
            tabs = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tabs')
            if tabs is None:
                tabs = parse_xml(f'<w:tabs {nsdecls("w")}><w:tab w:val="right" w:leader="dot" w:pos="9072"/></w:tabs>')
                pPr.append(tabs)
            for r in p.runs:
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                r.font.color.rgb = RGBColor(0, 0, 0)
            print("Updated List of Figures entry for Figure 5.5")
            break

# 2. Update Body Caption and Image for Figure 5.5
fig55_body_p = None
fig55_img_p = None

for i, p in enumerate(doc.paragraphs):
    if p.text.startswith("Figure 5.5:") and i > 150:
        fig55_body_p = p
        fig55_img_p = doc.paragraphs[i-1]
        print(f"Found Figure 5.5 in body at P[{i}]")
        break

if fig55_body_p is not None:
    # Update caption text
    fig55_body_p.text = "Figure 5.5: UML Sequence Diagram — Online Checkout via SePay VietQR, Webhook Callback & Atomic Stock Deduction (UC-09, UC-10)"
    fig55_body_p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fig55_body_p.paragraph_format.space_before = Pt(4)
    fig55_body_p.paragraph_format.space_after = Pt(6)
    for r in fig55_body_p.runs:
        r.font.name = "Times New Roman"
        r.font.size = Pt(11)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0, 0, 0)

    # Replace image in fig55_img_p
    # Clear runs in fig55_img_p and add picture
    fig55_img_p.text = ""
    run = fig55_img_p.add_run()
    run.add_picture(SEPAY_IMG_PATH, width=Inches(6.2))
    fig55_img_p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fig55_img_p.paragraph_format.space_before = Pt(6)
    fig55_img_p.paragraph_format.space_after = Pt(2)
    print("Replaced Figure 5.5 image with seq_checkout_sepay.png (width=6.2 in)")

doc.save(DOC_PATH)
print("Saved document with corrected Figure 5.5!")
