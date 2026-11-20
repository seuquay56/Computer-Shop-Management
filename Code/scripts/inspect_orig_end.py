import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052.docx")
for i in range(len(doc.paragraphs)-10, len(doc.paragraphs)):
    p = doc.paragraphs[i]
    print(f"P[{i:3d}] style={p.style.name if p.style else None}: {repr(p.text)}")
