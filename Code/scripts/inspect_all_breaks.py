import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")

print("Checking for page breaks...")
for i, p in enumerate(doc.paragraphs):
    xml_str = p._element.xml
    has_manual_br = ('w:type="page"' in xml_str) or ('<w:lastRenderedPageBreak/>' in xml_str)
    has_page_br = 'w:type="page"' in xml_str
    if has_page_br:
        print(f"P[{i}] text={repr(p.text)}: has manual w:br page break")
    if p.paragraph_format.page_break_before:
        print(f"P[{i}] text={repr(p.text[:40])}: has page_break_before=True")
