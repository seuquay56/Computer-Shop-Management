import docx

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(DOC_PATH)

print("=" * 60)
print("1. CHECKING COVER PAGES TRANSITIONS")
print("=" * 60)
for i in range(0, 75):
    p = doc.paragraphs[i]
    txt = p.text.strip()
    if txt in [
        "VIETNAM GENERAL CONFEDERATION OF LABOR",
        "TON DUC THANG UNIVERSITY",
        "HO CHI MINH CITY, 2026",
        "ACKNOWLEDGEMENT",
        "DECLARATION OF AUTHORSHIP",
        "EXECUTIVE SUMMARY"
    ]:
        print(f"P[{i:2d}] pb={p.paragraph_format.page_break_before} align={p.paragraph_format.alignment}: {repr(txt)}")

print("\n" + "=" * 60)
print("2. CHECKING FOR PHANTOM PAGE ('COMPUTER SHOP MANAGEMENT SOFTWARE')")
print("=" * 60)
found_phantom = False
for i, p in enumerate(doc.paragraphs):
    if "COMPUTER SHOP MANAGEMENT SOFTWARE" in p.text and i < 100:
        found_phantom = True
        print(f"  FOUND PHANTOM TITLE at P[{i}]: {repr(p.text)}")
if not found_phantom:
    print("  Zero phantom title pages found! Clean transition from Declaration to Executive Summary.")

print("\n" + "=" * 60)
print("3. CHECKING FONT ACROSS ENTIRE DOCUMENT (100% TIMES NEW ROMAN)")
print("=" * 60)
non_tnr_runs = []
for i, p in enumerate(doc.paragraphs):
    for r in p.runs:
        if r.font and r.font.name and r.font.name != "Times New Roman":
            non_tnr_runs.append((i, p.text[:30], r.font.name))
print(f"Total non-Times New Roman runs in paragraphs: {len(non_tnr_runs)}")
for idx, txt, fn in non_tnr_runs[:10]:
    print(f"  P[{idx}] '{txt}': {fn}")

# Check tables for non-Times New Roman
non_tnr_table_cells = 0
for t_idx, t in enumerate(doc.tables):
    for row in t.rows:
        for cell in row.cells:
            for p in cell.paragraphs:
                for r in p.runs:
                    if r.font and r.font.name and r.font.name != "Times New Roman":
                        non_tnr_table_cells += 1
print(f"Total non-Times New Roman runs in tables: {non_tnr_table_cells}")

print("\n" + "=" * 60)
print("4. CHECKING TABLE OF CONTENTS (NO BLUE, NO UNDERLINE, NO RAW INSTRUCTION)")
print("=" * 60)
in_toc = False
toc_issues = []
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt == "TABLE OF CONTENT":
        in_toc = True
        continue
    elif txt == "LIST OF FIGURES":
        in_toc = False
        break

    if in_toc and txt:
        xml_str = p._element.xml
        has_blue = 'w:val="0000FF"' in xml_str
        has_underline = 'w:u w:val="single"' in xml_str
        has_raw_instr = 'TOC \\o' in xml_str or 'PAGEREF' in xml_str
        if has_blue or has_underline or has_raw_instr:
            toc_issues.append((i, txt[:40], has_blue, has_underline, has_raw_instr))

print(f"Total TOC paragraphs with styling/instruction issues: {len(toc_issues)}")
for idx, txt, b, u, raw in toc_issues:
    print(f"  P[{idx}] '{txt}': blue={b}, underline={u}, raw_instr={raw}")

print("\n" + "=" * 60)
print("5. CHECKING SECTION MARGINS (TDTU STANDARD)")
print("=" * 60)
for i, sec in enumerate(doc.sections):
    print(f"Section {i}: Left={sec.left_margin.inches*2.54:.1f}cm, Right={sec.right_margin.inches*2.54:.1f}cm, Top={sec.top_margin.inches*2.54:.1f}cm, Bottom={sec.bottom_margin.inches*2.54:.1f}cm")
