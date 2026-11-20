import fitz

doc = fitz.open(r"Computer-Shop-Management/test_clean_exported.pdf")
print("Total pages in PDF:", len(doc))

for p_idx in range(min(10, len(doc))):
    page = doc[p_idx]
    txt = page.get_text().strip()
    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    first_line = lines[0] if lines else "(empty)"
    last_line = lines[-1] if lines else "(empty)"
    print(f"--- Page {p_idx+1} ---")
    print(f"  First line: {first_line}")
    print(f"  Last line:  {last_line}")
    print(f"  Line count: {len(lines)}")
