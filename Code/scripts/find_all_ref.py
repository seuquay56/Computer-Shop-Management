import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")

print("Checking every paragraph for 'reference':")
for i, p in enumerate(doc.paragraphs):
    txt_lower = p.text.lower()
    if "reference" in txt_lower:
        print(f"P[{i:3d}] style={p.style.name if p.style else None}: {repr(p.text)}")
