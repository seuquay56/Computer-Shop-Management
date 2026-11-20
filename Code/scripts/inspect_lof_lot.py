import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

for i in range(125, 200):
    p = doc.paragraphs[i]
    print(f"P[{i:3d}] ({p.style.name if p.style else None}): {repr(p.text[:65])}")
