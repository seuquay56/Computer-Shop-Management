import fitz
import re

doc = fitz.open(r"Computer-Shop-Management/test_clean_no_orphan.pdf")

sections = {}
for p_idx in range(9, len(doc)):
    page = doc[p_idx]
    txt = page.get_text()
    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    hdr = lines[0] if lines else ""
    for l in lines:
        m = re.match(r'^(\d+\.\d+(\.\d+)?\s+[A-Z].*)', l)
        if m:
            s_name = m.group(1).strip()
            if s_name not in sections:
                sections[s_name] = hdr

print("=== ALL SECTIONS AND PRINTED PAGES ===")
for s, p in sections.items():
    print(f"  {s:45} -> page {p}")
