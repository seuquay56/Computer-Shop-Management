import docx

doc_orig = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
print("--- Headings in original document ---")
for i, p in enumerate(doc_orig.paragraphs):
    if p.style and p.style.name.startswith("Heading"):
        print(f"[{i}] {p.style.name}: '{p.text}'")
