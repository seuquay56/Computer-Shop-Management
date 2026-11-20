import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== ACTUAL TABLES IN BODY ===")
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith("Table ") and i >= 180:
        print(f"P[{i:3d}]: {repr(p.text)}")
