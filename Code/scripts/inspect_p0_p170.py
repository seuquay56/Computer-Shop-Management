import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")
print("=== PARAGRAPHS 0 to 170 IN UPDATED DOCX ===")
for i in range(min(170, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    pb = "PB" if p.paragraph_format.page_break_before or "type=\"page\"" in p._p.xml else ""
    img = "IMG" if "w:drawing" in p._p.xml else ""
    if txt or pb or img:
        print(f"P[{i:03d}]: {txt[:50]!r:52} | style={p.style.name:12} | {pb:2} {img:3}")
