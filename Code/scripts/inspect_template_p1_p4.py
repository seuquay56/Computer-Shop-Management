import docx

doc = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")
print("=== TEMPLATE FIRST 50 PARAGRAPHS ===")
for i, p in enumerate(doc.paragraphs[:50]):
    has_pb = "type=\"page\"" in p._p.xml or p.paragraph_format.page_break_before
    img = "IMG" if "w:drawing" in p._p.xml else ""
    print(f"P[{i:02d}]: {p.text[:60]!r} | style: {p.style.name} | align: {p.alignment} | pb: {has_pb} {img}")
