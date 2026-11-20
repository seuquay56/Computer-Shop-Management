import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== ALL HEADINGS ===")
for i, p in enumerate(doc.paragraphs):
    if p.style and "Heading" in p.style.name:
        print(f"P[{i:3d}] ({p.style.name}): {repr(p.text)}")

print("\n=== ALL TOC ENTRIES ===")
for i, p in enumerate(doc.paragraphs):
    if p.style and "toc" in p.style.name.lower():
        print(f"P[{i:3d}] ({p.style.name}): {repr(p.text)}")
