import fitz

doc = fitz.open(r"Computer-Shop-Management/debug_export_v2.pdf")

search_titles = [
    "EXECUTIVE SUMMARY",
    "TABLE OF CONTENT",
    "LIST OF FIGURES",
    "LIST OF TABLES",
    "CHAPTER 1. INTRODUCTION",
    "CHAPTER 2. PROJECT MANAGEMENT PLAN",
    "CHAPTER 3. REQUIREMENT SPECIFICATIONS",
    "CHAPTER 4. ARCHITECTURE",
    "CHAPTER 5. DESIGN",
    "CHAPTER 6. TEST PLAN",
    "CHAPTER 7. DEMO",
    "REFERENCES"
]

print("=== ACTUAL PAGES IN PDF ===")
for p_idx, page in enumerate(doc):
    txt = page.get_text()
    for t in search_titles:
        if t in txt:
            # Check page number printed on page (usually first or last line)
            lines = [l.strip() for l in txt.splitlines() if l.strip()]
            header_num = lines[0] if lines else ""
            print(f"'{t}' found on PDF Page {p_idx+1} (printed number: {repr(header_num)})")
