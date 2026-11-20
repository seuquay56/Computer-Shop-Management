import fitz

doc = fitz.open(r"Computer-Shop-Management/test_clean_no_orphan.pdf")

for p_idx in range(9, len(doc)):
    page = doc[p_idx]
    txt = page.get_text()
    lines = [l.strip() for l in txt.splitlines() if l.strip()]
    header = lines[0] if lines else ""
    for l in lines:
        if any(w in l for w in ["INTRODUCTION", "PROJECT MANAGEMENT", "REQUIREMENT SPECIFICATIONS", "ARCHITECTURE", "DESIGN", "TEST PLAN", "DEMO"]):
            if len(l) < 50:
                print(f"Page {p_idx+1} (hdr={header}): {l}")
