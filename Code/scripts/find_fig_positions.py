import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
for i, p in enumerate(doc.paragraphs):
    if "Figure 4.1" in p.text or "Figure 3.1" in p.text:
        print(f"P[{i}]: text='{p.text}' | prev_has_pic={'blip' in doc.paragraphs[i-1]._element.xml if i > 0 else False}")
