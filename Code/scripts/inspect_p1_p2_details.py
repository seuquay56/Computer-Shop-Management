import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== Page 1 and Page 2 Paragraphs ===")
for i in range(0, 45):
    p = doc.paragraphs[i]
    t = p.text.strip()
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else 0
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else 0
    ls = p.paragraph_format.line_spacing
    pb = p.paragraph_format.page_break_before
    has_pic = 'blip' in p._element.xml
    print(f"P[{i:2d}] pb={pb} pic={has_pic} sp=(B:{sb:.1f}, A:{sa:.1f}, L:{ls}): {repr(t)}")
