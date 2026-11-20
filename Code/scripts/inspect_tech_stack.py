import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

for i, p in enumerate(doc.paragraphs):
    if "mysql" in p.text.lower() or "react" in p.text.lower():
        print(f"[{i}] {p.text}")

print("\n--- Table 18 (Table 4.1 Tech Stack) ---")
t = doc.tables[17] # Table 18
for r in t.rows:
    print(" | ".join([cell.text.strip().replace("\n", " ") for cell in r.cells]))
