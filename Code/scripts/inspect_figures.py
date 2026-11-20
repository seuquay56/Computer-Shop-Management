import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

for i, p in enumerate(doc.paragraphs):
    if "Figure" in p.text:
        print(f"[{i}] {p.text}")
