import fitz
import re

doc = fitz.open(r"Computer-Shop-Management/debug_perfect.pdf")

heading_pages = {}
fig_pages = {}
tbl_pages = {}

for p_idx in range(10, len(doc)):
    page = doc[p_idx]
    txt = page.get_text()
    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    if not lines:
        continue
    # Printed page number
    m_num = re.match(r'^(\d+)$', lines[0])
    printed_page = m_num.group(1) if m_num else str(p_idx - 3)

    for line in lines:
        for pattern in [
            r'^(CHAPTER \d+\. [A-Z\s]+)',
            r'^(\d+\.\d+ [A-Z].*)',
            r'^(\d+\.\d+\.\d+ [A-Z].*)',
            r'^(REFERENCES)$'
        ]:
            m = re.match(pattern, line)
            if m:
                h_name = m.group(1).strip()
                if h_name not in heading_pages:
                    heading_pages[h_name] = printed_page

        m_fig = re.match(r'^(Figure \d+\.\d+:)', line)
        if m_fig:
            fig_prefix = m_fig.group(1)
            if fig_prefix not in fig_pages:
                fig_pages[fig_prefix] = printed_page

        m_tbl = re.match(r'^(Table \d+\.\d+:)', line)
        if m_tbl:
            tbl_prefix = m_tbl.group(1)
            if tbl_prefix not in tbl_pages:
                tbl_pages[tbl_prefix] = printed_page

print("=== HEADINGS ===")
for h, p in heading_pages.items():
    print(f"  {h} -> page {p}")

print("\n=== FIGURES ===")
for f, p in fig_pages.items():
    print(f"  {f} -> page {p}")

print("\n=== TABLES ===")
for t, p in tbl_pages.items():
    print(f"  {t} -> page {p}")
