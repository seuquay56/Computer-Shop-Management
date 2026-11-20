import docx

doc = docx.Document(r"Computer-Shop-Management\524H0057_524H0069_524H0052_FinalReport.docx")
for i in range(75, 215):
    p = doc.paragraphs[i]
    if p.text.strip():
        xml = p._element.xml
        has_br = 'w:type="page"' in xml
        print(f"P[{i}] (pb={p.paragraph_format.page_break_before}, br={has_br}): {p.text[:65]}")
