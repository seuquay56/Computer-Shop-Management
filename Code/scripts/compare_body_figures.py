import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== BODY FIGURE CAPTIONS ===")
for i, p in enumerate(doc.paragraphs[182:], start=182):
    txt = p.text.strip()
    if txt.startswith("Figure "):
        print(f"P[{i:03d}]: {txt[:70]}")
