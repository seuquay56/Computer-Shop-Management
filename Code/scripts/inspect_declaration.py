import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

print("--- First 100 paragraphs ---")
for i, p in enumerate(doc.paragraphs[:120]):
    text = p.text.strip()
    if text:
        print(f"[{i}] {text[:90]}")
