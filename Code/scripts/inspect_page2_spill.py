import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")

print("Checking paragraphs 15 to 45:")
for i in range(15, 45):
    p = doc.paragraphs[i]
    xml_str = p._element.xml
    has_page_br = ('w:type="page"' in xml_str) or ('<w:br w:type="page"/>' in xml_str)
    has_pic = 'blip' in xml_str
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else None
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else None
    ls = p.paragraph_format.line_spacing
    print(f"P[{i:2d}] pb={p.paragraph_format.page_break_before} br={has_page_br} pic={has_pic} sp=(B:{sb}, A:{sa}, L:{ls}): {repr(p.text)}")
