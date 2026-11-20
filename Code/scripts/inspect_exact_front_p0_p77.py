import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== CHECKING SECTIONS P0 TO P77 ===")
for i in range(78):
    p = doc.paragraphs[i]
    t = p.text.strip()
    has_img = "w:drawing" in p._p.xml
    pb = p.paragraph_format.page_break_before
    xml_pb = 'type="page"' in p._p.xml
    print(f"P[{i:02d}]: {t[:40]!r:42} | img={has_img} pb_before={pb} xml_pb={xml_pb}")
