import fitz
import re

doc = fitz.open(r"Computer-Shop-Management/debug_export_v2.pdf")

# We only search after Table of Contents / List of Tables (i.e. starting from PDF page 10, where Chapter 1 starts)
heading_pages = {}
figure_pages = {}
table_pages = {}

# Patterns
# e.g. "1.1 Purpose and Scope", "CHAPTER 1. INTRODUCTION", "Figure 2.1:", "Table 1.1:"
for p_idx in range(9, len(doc)):
    page = doc[p_idx]
    txt = page.get_text()
    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    if not lines:
        continue
    # Printed page number is usually the first line
    header_line = lines[0]
    m_num = re.match(r'^(\d+)$', header_line)
    printed_page = m_num.group(1) if m_num else str(p_idx - 3) # fallback

    for line in lines:
        # Check headings
        for pattern in [
            r'^(CHAPTER \d+\. [A-Z\s]+)',
            r'^(\d+\.\d+ [A-Z].*)',
            r'^(\d+\.\d+\.\d+ [A-Z].*)',
            r'^(REFERENCES)$'
        ]:
            m = re.match(pattern, line)
            if m:
                h_name = m.group(1).strip()
                # Clean up if ends with period or extra space
                if h_name not in heading_pages:
                    heading_pages[h_name] = printed_page

        # Check figures
        m_fig = re.match(r'^(Figure \d+\.\d+:)', line)
        if m_fig:
            fig_prefix = m_fig.group(1)
            if fig_prefix not in figure_pages:
                figure_pages[fig_prefix] = printed_page

        # Check tables
        m_tbl = re.match(r'^(Table \d+\.\d+:)', line)
        if m_tbl:
            tbl_prefix = m_tbl.group(1)
            if tbl_prefix not in table_pages:
                table_pages[tbl_prefix] = printed_page

print(f"Found {len(heading_pages)} headings:")
for h, p in heading_pages.items():
    print(f"  {h} -> page {p}")

print(f"\nFound {len(figure_pages)} figures:")
for f, p in figure_pages.items():
    print(f"  {f} -> page {p}")

print(f"\nFound {len(table_pages)} tables:")
for t, p in table_pages.items():
    print(f"  {t} -> page {p}")
