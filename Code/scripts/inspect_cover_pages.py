import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
for i in range(0, 65):
    p = doc.paragraphs[i]
    xml_str = p._element.xml
    has_page_br = ('w:type="page"' in xml_str) or ('<w:br w:type="page"/>' in xml_str)
    has_pic = 'blip' in xml_str
    print(f"P[{i:2d}] pb={p.paragraph_format.page_break_before} br={has_page_br} pic={has_pic} style={p.style.name if p.style else None}: {repr(p.text)}")
