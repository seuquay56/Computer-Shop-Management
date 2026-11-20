import docx

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

print(f"Total tables: {len(doc.tables)}")
for i, t in enumerate(doc.tables):
    rows = len(t.rows)
    cols = len(t.columns) if rows > 0 else 0
    # get first row text
    hdr = " | ".join([cell.text.strip().replace("\n", " ") for cell in t.rows[0].cells]) if rows > 0 else ""
    # find paragraph right before table if any
    print(f"Table {i+1} [rows={rows}, cols={cols}]: {hdr[:100]}")
