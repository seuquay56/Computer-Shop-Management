import docx

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

def get_figures_in_doc(doc):
    figs = []
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt.startswith("Figure "):
            # check if inside body or front matter
            has_img = False
            # check previous or current paragraph for blip/drawing
            for check_idx in [i-1, i, i+1]:
                if 0 <= check_idx < len(doc.paragraphs):
                    if 'blip' in doc.paragraphs[check_idx]._element.xml:
                        has_img = True
            figs.append((i, txt, has_img))
    return figs

figs_a = get_figures_in_doc(doc_a)
figs_b = get_figures_in_doc(doc_b)

print("=== FIGURES IN FILE A ===")
for f in figs_a:
    print(f"  P[{f[0]:3d}] img={f[2]}: {repr(f[1])}")

print("\n=== FIGURES IN FILE B ===")
for f in figs_b:
    print(f"  P[{f[0]:3d}] img={f[2]}: {repr(f[1])}")
