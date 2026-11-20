import docx

doc = docx.Document("test_clean_formatted.docx")
print("=== PARAGRAPHS 75 TO 105 ===")
for i in range(75, 105):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    pb = "PB" if p.paragraph_format.page_break_before else ""
    xml_pb = "xmlPB" if 'type="page"' in p._p.xml else ""
    has_sp = "sectPr" in p._p.xml
    print(f"P[{i:03d}]: {txt[:40]!r:42} | pb={pb} {xml_pb} sectPr={has_sp}")
