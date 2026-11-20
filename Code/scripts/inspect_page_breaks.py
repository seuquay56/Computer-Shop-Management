import docx

doc = docx.Document(r"Computer-Shop-Management\524H0057_524H0069_524H0052_FinalReport.docx")

print("--- Paragraphs with page breaks or page_break_before ---")
for i, p in enumerate(doc.paragraphs):
    has_pb = False
    if p.paragraph_format.page_break_before:
        has_pb = True
    xml = p._element.xml
    has_br = 'w:type="page"' in xml
    if has_pb or has_br:
        print(f"P[{i}]: text='{p.text[:60]}' | pb_before={p.paragraph_format.page_break_before} | br_page={has_br}")
