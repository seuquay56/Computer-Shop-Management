import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
print("All Heading 1 paragraphs:")
for i, p in enumerate(doc.paragraphs):
    if p.style and (p.style.name == "Heading 1" or p.style.name.startswith("Heading 1")):
        print(f"P[{i:3d}] text: {repr(p.text)}")
