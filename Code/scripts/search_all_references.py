import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
print("Searching for 'reference' in paragraphs:")
for i, p in enumerate(doc.paragraphs):
    if "REFERENCE" in p.text.upper():
        print(f"  P[{i:3d}] style={p.style.name if p.style else None}: {repr(p.text[:80])}")

print("\nSearching in Tables:")
for t_idx, t in enumerate(doc.tables):
    for r_idx, row in enumerate(t.rows):
        for c_idx, cell in enumerate(row.cells):
            if "REFERENCE" in cell.text.upper():
                print(f"  Table[{t_idx}] row {r_idx} cell {c_idx}: {repr(cell.text[:80])}")

print("\nSearching in Headers/Footers:")
for s_idx, sec in enumerate(doc.sections):
    for h in [sec.header, sec.footer]:
        for p in h.paragraphs:
            if "REFERENCE" in p.text.upper():
                print(f"  Section[{s_idx}] header/footer: {repr(p.text)}")
