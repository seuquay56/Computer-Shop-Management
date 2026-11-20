import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

non_tnr = []

for i, p in enumerate(doc.paragraphs):
    for r in p.runs:
        if r.font and r.font.name and r.font.name != "Times New Roman":
            non_tnr.append((f"P[{i}]", r.font.name, repr(r.text[:30])))

for t_idx, t in enumerate(doc.tables):
    for r_idx, row in enumerate(t.rows):
        for c_idx, cell in enumerate(row.cells):
            for p in cell.paragraphs:
                for r in p.runs:
                    if r.font and r.font.name and r.font.name != "Times New Roman":
                        non_tnr.append((f"T[{t_idx}][{r_idx},{c_idx}]", r.font.name, repr(r.text[:30])))

for s_idx, sec in enumerate(doc.sections):
    for hp in sec.header.paragraphs:
        for r in hp.runs:
            if r.font and r.font.name and r.font.name != "Times New Roman":
                non_tnr.append((f"S[{s_idx}] Header", r.font.name, repr(r.text[:30])))
    for fp in sec.footer.paragraphs:
        for r in fp.runs:
            if r.font and r.font.name and r.font.name != "Times New Roman":
                non_tnr.append((f"S[{s_idx}] Footer", r.font.name, repr(r.text[:30])))

print(f"Total non-Times New Roman runs found: {len(non_tnr)}")
for item in non_tnr[:20]:
    print("  ", item)
