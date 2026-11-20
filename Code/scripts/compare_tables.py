import docx

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print(f"Table count: A={len(doc_a.tables)}, B={len(doc_b.tables)}")

table_diffs = []
for idx in range(min(len(doc_a.tables), len(doc_b.tables))):
    t_a = doc_a.tables[idx]
    t_b = doc_b.tables[idx]
    
    rows_a = len(t_a.rows)
    rows_b = len(t_b.rows)
    cols_a = len(t_a.columns)
    cols_b = len(t_b.columns)
    
    # compare text content
    content_a = [[c.text.strip() for c in row.cells] for row in t_a.rows]
    content_b = [[c.text.strip() for c in row.cells] for row in t_b.rows]
    
    if content_a != content_b:
        table_diffs.append((idx, rows_a, rows_b, cols_a, cols_b, content_a[:1], content_b[:1]))

print(f"Total tables with content differences: {len(table_diffs)}")
for d in table_diffs:
    print(f"Table {d[0]}: rows (A:{d[1]}, B:{d[2]}), cols (A:{d[3]}, B:{d[4]})")
    print(f"   Header A: {d[5]}")
    print(f"   Header B: {d[6]}")
