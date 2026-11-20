import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
for i, p in enumerate(doc.paragraphs):
    if any(k in p.text for k in ["Figure 5.3", "Figure 5.4", "Figure 5.5", "Figure 5.6"]):
        print(f"P[{i}]: text='{p.text}' | prev_has_pic={'blip' in doc.paragraphs[i-1]._element.xml if i > 0 else False}")
