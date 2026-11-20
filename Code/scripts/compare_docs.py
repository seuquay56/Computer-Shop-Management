import docx

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print(f"File A (Original): {len(doc_a.paragraphs)} paragraphs, {len(doc_a.tables)} tables")
print(f"File B (Updated):  {len(doc_b.paragraphs)} paragraphs, {len(doc_b.tables)} tables")

# Compare Headings
def get_headings(doc):
    headings = []
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        st = p.style.name if p.style else ""
        if "Heading" in st or txt.startswith("CHAPTER") or txt in [
            "ACKNOWLEDGEMENT", "DECLARATION OF AUTHORSHIP", "TEACHER'S ASSESSMENT AND CONFIRMATION",
            "ABSTRACT", "EXECUTIVE SUMMARY", "TABLE OF CONTENT", "LIST OF FIGURES", "LIST OF TABLES", "REFERENCES"
        ]:
            headings.append((i, st, txt))
    return headings

h_a = get_headings(doc_a)
h_b = get_headings(doc_b)

print("\n=== HEADINGS COMPARISON ===")
h_a_titles = [x[2] for x in h_a]
h_b_titles = [x[2] for x in h_b]

print("--- In File A but NOT in File B ---")
for h in h_a_titles:
    if h not in h_b_titles:
        print("  -", h)

print("\n--- In File B but NOT in File A ---")
for h in h_b_titles:
    if h not in h_a_titles:
        print("  +", h)

# Compare Tables
print("\n=== TABLES COMPARISON ===")
def get_table_captions(doc):
    caps = []
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt.startswith("Table "):
            caps.append((i, txt))
    return caps

t_a = get_table_captions(doc_a)
t_b = get_table_captions(doc_b)
print(f"File A has {len(t_a)} table captions, File B has {len(t_b)} table captions")

# Compare Figures
print("\n=== FIGURES COMPARISON ===")
def get_figure_captions(doc):
    figs = []
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt.startswith("Figure "):
            figs.append((i, txt))
    return figs

f_a = get_figure_captions(doc_a)
f_b = get_figure_captions(doc_b)
print(f"File A has {len(f_a)} figure captions, File B has {len(f_b)} figure captions")
