import docx

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("File A Chapter 7 blips:")
for i in range(405, 420):
    if i < len(doc_a.paragraphs):
        p = doc_a.paragraphs[i]
        blips = p._element.xpath('.//@r:embed')
        if blips:
            print(f"  P[{i}]: {blips} ({p.text[:30]})")

print("File B Chapter 7 blips:")
for i in range(423, 440):
    if i < len(doc_b.paragraphs):
        p = doc_b.paragraphs[i]
        blips = p._element.xpath('.//@r:embed')
        if blips:
            print(f"  P[{i}]: {blips} ({p.text[:30]})")
