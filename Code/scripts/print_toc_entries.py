import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
print("Table of Contents entries:")
for i in range(88, 140):
    p = doc.paragraphs[i]
    if p.text.strip():
        print(f"P[{i:3d}] style={p.style.name}: {repr(p.text)}")
