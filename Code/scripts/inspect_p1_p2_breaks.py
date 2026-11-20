import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")
print("=== UPDATED DOCX P0-P40 BREAKS & DRAWINGS ===")
for i in range(min(40, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    pb_before = p.paragraph_format.page_break_before
    xml_pb = 'type="page"' in p._p.xml
    drawing = "w:drawing" in p._p.xml
    txt = p.text.strip()
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else 0
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else 0
    ls = p.paragraph_format.line_spacing
    print(f"P[{i:02d}]: {txt[:35]!r:38} | pb_b={str(pb_before):5} | xml_pb={str(xml_pb):5} | img={str(drawing):5} | sb={sb:.1f} sa={sa:.1f} ls={ls}")
