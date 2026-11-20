import docx
import os

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(doc_path)

print("Paragraphs count:", len(doc.paragraphs))
print("Tables count:", len(doc.tables))

headings = []
for i, p in enumerate(doc.paragraphs):
    if p.style and p.style.name.startswith("Heading"):
        headings.append((i, p.style.name, p.text.strip()))

print("\n--- Total Headings:", len(headings))
for idx, sname, text in headings[:30]:
    print(f"[{idx}] {sname}: {text}")

print("\n--- Search for [CHÈN HÌNH 2.1...]:")
for i, p in enumerate(doc.paragraphs):
    if "CHÈN" in p.text.upper() or "HÌNH 2.1" in p.text.upper() or "FIGURE 2.1" in p.text.upper():
        print(f"Paragraph {i}: {p.text}")

print("\n--- Search for Declaration sentence:")
for i, p in enumerate(doc.paragraphs[:50]):
    if "responsibility" in p.text.lower():
        print(f"Paragraph {i}: {p.text}")
