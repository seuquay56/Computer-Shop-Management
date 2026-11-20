import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")
print("=== UPDATED DOCX TOC/LOF/LOT PARAGRAPHS ===")
for i in range(77, 160):
    p = doc.paragraphs[i]
    if "CHAPTER 1. INTRODUCTION" in p.text and p.style.name != "toc 1":
        print(f"Reached body at P[{i}]: {p.text[:40]}")
        break
    li = p.paragraph_format.left_indent.pt if p.paragraph_format.left_indent else 0
    fi = p.paragraph_format.first_line_indent.pt if p.paragraph_format.first_line_indent else 0
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else 0
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else 0
    font_sz = p.runs[0].font.size.pt if p.runs and p.runs[0].font.size else "def"
    font_b = p.runs[0].font.bold if p.runs else False
    tabs = [(t.position.pt, t.leader) for t in p.paragraph_format.tab_stops] if p.paragraph_format.tab_stops else []
    print(f"P[{i:03d}]: {p.style.name:10} | {p.text[:35]!r:38} | li={li:4.1f} fi={fi:5.1f} sb={sb:.1f} sa={sa:.1f} sz={font_sz} b={font_b} tabs={tabs}")
