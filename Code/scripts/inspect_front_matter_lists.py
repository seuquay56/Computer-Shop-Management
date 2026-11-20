import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== CURRENT LIST OF FIGURES ===")
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith("Figure "):
        if i < 180: # in the front matter
            print(f"P[{i:3d}]: {repr(p.text)}")

print("\n=== CURRENT LIST OF TABLES ===")
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith("Table "):
        if i < 180: # in the front matter
            print(f"P[{i:3d}]: {repr(p.text)}")
