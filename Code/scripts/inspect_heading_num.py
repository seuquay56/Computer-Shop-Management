import docx

doc = docx.Document(r"Computer-Shop-Management\524H0057_524H0069_524H0052_FinalReport.docx")
for i, p in enumerate(doc.paragraphs):
    if "Deliverables and Schedule" in p.text:
        print(f"P[{i}]: text='{p.text}'")
        print("style:", p.style.name if p.style else "No style")
        print("xml:", p._element.xml)
