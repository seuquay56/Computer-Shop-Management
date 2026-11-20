import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== CURRENT TABLE OF CONTENTS ===")
for i, p in enumerate(doc.paragraphs):
    if p.style and p.style.name.startswith("toc"):
        print(f"P[{i:3d}]: {repr(p.text)}")
