import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

# Let's inspect paragraphs around tables in Chapter 3
for i, p in enumerate(doc.paragraphs):
    if "Table" in p.text or "UC-" in p.text:
        print(f"[{i}] {p.text}")
