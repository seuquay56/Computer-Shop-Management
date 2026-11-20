import fitz
import re

doc = fitz.open(r"Computer-Shop-Management/test_clean_no_orphan.pdf")

figs = {}
tbls = {}

for p_idx in range(9, len(doc)):
    page = doc[p_idx]
    txt = page.get_text()
    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    hdr = lines[0] if lines else ""
    for l in lines:
        m_f = re.match(r'^(Figure \d+\.\d+):', l)
        if m_f:
            f_id = m_f.group(1)
            if f_id not in figs: figs[f_id] = hdr
        m_t = re.match(r'^(Table \d+\.\d+):', l)
        if m_t:
            t_id = m_t.group(1)
            if t_id not in tbls: tbls[t_id] = hdr

print("=== FIGURES ===")
for f, p in figs.items(): print(f"  {f:12} -> page {p}")

print("\n=== TABLES ===")
for t, p in tbls.items(): print(f"  {t:12} -> page {p}")
