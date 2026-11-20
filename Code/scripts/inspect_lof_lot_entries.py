import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")
print("=== LOF ENTRIES ===")
for i in range(126, 141):
    p = doc.paragraphs[i]
    print(f"LOF P[{i}]: {p.text!r}")

print("=== LOT ENTRIES (first 10 and last 5) ===")
for i in range(141, 152):
    p = doc.paragraphs[i]
    print(f"LOT P[{i}]: {p.text!r}")
for i in range(175, 183):
    p = doc.paragraphs[i]
    print(f"LOT P[{i}]: {p.text!r}")
