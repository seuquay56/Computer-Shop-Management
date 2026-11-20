import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
for i, p in enumerate(doc.paragraphs):
    if "LIST OF FIGURES" in p.text:
        print(f"P[{i}]: text='{p.text}' | style={p.style.name if p.style else None}")
        for j in range(i, min(i+15, len(doc.paragraphs))):
            print(f"  P[{j}]: text='{doc.paragraphs[j].text}' | style={doc.paragraphs[j].style.name if doc.paragraphs[j].style else None}")
