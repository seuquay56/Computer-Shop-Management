import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")

print("--- Inspecting LIST OF FIGURES in updated.docx ---")
found = False
for i, p in enumerate(doc.paragraphs):
    if "LIST OF FIGURES" in p.text:
        found = True
    if found:
        print(f"P[{i}]: text='{p.text}'")
        print("  style:", p.style.name if p.style else None)
        print("  xml:", p._element.xml[:300])
        if "LIST OF TABLES" in p.text or i > 170:
            break
