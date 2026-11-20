import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
for i in range(447, 461):
    p = doc.paragraphs[i]
    print(f"P[{i:3d}] style={p.style.name if p.style else None}: {repr(p.text)}")
