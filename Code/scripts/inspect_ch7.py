import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

print("--- Paragraphs 400 to 434 ---")
for i in range(405, len(doc.paragraphs)):
    p = doc.paragraphs[i]
    print(f"[{i}] {p.style.name if p.style else 'NoStyle'}: {p.text}")
