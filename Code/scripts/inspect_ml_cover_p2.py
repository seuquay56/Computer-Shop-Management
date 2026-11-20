import docx

doc = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")
for i in range(40, 60):
    p = doc.paragraphs[i]
    xml = p._element.xml
    has_page_br = 'w:type="page"' in xml or '<w:br w:type="page"/>' in xml
    has_sect = 'w:sectPr' in xml
    print(f"P[{i:2d}] pb={p.paragraph_format.page_break_before} br={has_page_br} sect={has_sect}: {repr(p.text)}")
