import docx

doc = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")
print("=== TEMPLATE P0 - P48 DETAILS ===")
for i in range(48):
    p = doc.paragraphs[i]
    runs_info = []
    for r in p.runs:
        sz = r.font.size.pt if r.font.size else "def"
        b = "B" if r.font.bold else ""
        it = "I" if r.font.italic else ""
        fn = r.font.name or "def"
        runs_info.append(f"{r.text[:20]!r}({fn},{sz},{b}{it})")
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else 0
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else 0
    ls = p.paragraph_format.line_spacing
    has_img = "w:drawing" in p._p.xml
    print(f"P[{i:02d}]: {p.text[:30]!r:32} | sb={sb:4.1f} sa={sa:4.1f} ls={ls} img={has_img} | runs={' '.join(runs_info)}")
