import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
p = doc.paragraphs[141]
print("P[141] text:", p.text)
print("P[141] style:", p.style.name if p.style else None)
print("P[141] xml:", p._element.xml)
