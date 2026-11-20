import docx

doc = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")
for i in [84, 85, 86, 95]:
    p = doc.paragraphs[i]
    print(f"=== Template P[{i}] ({p.style.name if p.style else None}) ===")
    print(p._element.xml)
