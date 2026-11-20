import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
print("Total paragraphs:", len(doc.paragraphs))
for i in range(435, len(doc.paragraphs)):
    p = doc.paragraphs[i]
    if p.text.strip():
        print(f"P[{i:3d}] style={p.style.name if p.style else None} pb={p.paragraph_format.page_break_before}: {repr(p.text[:70])}")
