import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

for i, p in enumerate(doc.paragraphs):
    xml = p._element.xml
    if "BIBLIOGRAPHY" in xml or "Sommerville" in xml or "ISO/IEC" in xml:
        print(f"P[{i:3d}] style={p.style.name if p.style else None}:")
        print("  text:", repr(p.text))
        print("  xml snippet:", xml[:300])
