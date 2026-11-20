import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")
print("=== UPDATED DOCX P[45] to P[120] ===")
for i in range(45, min(120, len(doc.paragraphs))):
    p = doc.paragraphs[i]
    if p.text.strip():
        print(f"P[{i:02d}]: {p.text[:80]!r} | style: {p.style.name} | align: {p.alignment}")
    else:
        print(f"P[{i:02d}]: [EMPTY]")
