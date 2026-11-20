import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

t = doc.tables[29] # Table 30
for r in t.rows:
    row_text = [cell.text.strip().replace("\n", " ") for cell in r.cells]
    if "FR-13" in row_text[0] or "FR-14" in row_text[0]:
        print(" | ".join(row_text))
