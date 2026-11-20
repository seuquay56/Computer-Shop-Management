import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

# Let's inspect paragraphs around tables 6 to 15
for i in range(5, 15):
    t = doc.tables[i]
    print(f"\n=== Table {i+1} ===")
    for r in t.rows[:3]:
        print(" | ".join([cell.text.strip().replace("\n", " ") for cell in r.cells]))
