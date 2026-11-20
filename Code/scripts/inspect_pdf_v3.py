import fitz

doc = fitz.open(r"Computer-Shop-Management/debug_export_v3.pdf")
print("Total pages in PDF:", len(doc))

for page_idx in range(min(10, len(doc))):
    txt = doc[page_idx].get_text().strip()
    first_line = txt.splitlines()[0] if txt else "(empty)"
    last_line = txt.splitlines()[-1] if txt else "(empty)"
    print(f"Page {page_idx+1}: first={repr(first_line)[:50]}, last={repr(last_line)[:50]}")

print("\n--- Last 5 pages ---")
for page_idx in range(max(0, len(doc)-5), len(doc)):
    txt = doc[page_idx].get_text().strip()
    first_line = txt.splitlines()[0] if txt else "(empty)"
    last_line = txt.splitlines()[-1] if txt else "(empty)"
    print(f"Page {page_idx+1}: first={repr(first_line)[:50]}, last={repr(last_line)[:50]}")
