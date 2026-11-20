import docx

doc_orig = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
print("=== ORIGINAL DOCX TOC ZONE ===")
for i, p in enumerate(doc_orig.paragraphs):
    if "TABLE OF CONTENT" in p.text or "LIST OF FIGURES" in p.text:
        for j in range(max(0, i-2), min(len(doc_orig.paragraphs), i+25)):
            pj = doc_orig.paragraphs[j]
            print(f"Orig P[{j}]: {pj.text[:60]!r} | xml: {pj._p.xml[:120]}")
        break
