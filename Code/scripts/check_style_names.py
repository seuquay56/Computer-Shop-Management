import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
for s in doc.styles:
    if "figure" in s.name.lower() or "table" in s.name.lower() or "toc" in s.name.lower():
        print(f"'{s.name}' (style_id='{s.style_id}')")
