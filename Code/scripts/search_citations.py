import docx
import re

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== SEARCHING FOR BRACKET CITATIONS ===")
for i, p in enumerate(doc.paragraphs):
    matches = re.findall(r'\[\d+\]', p.text)
    if matches:
        print(f"P[{i:3d}] matches={matches}: {repr(p.text[:100])}")

print("=== SEARCHING FOR 'REFERENCE' or 'TÀI LIỆU THAM KHẢO' or 'MỤC LỤC' ===")
for i, p in enumerate(doc.paragraphs):
    t_lower = p.text.lower()
    if 'tài liệu tham khảo' in t_lower or 'references' in t_lower or 'bibliography' in t_lower:
        print(f"P[{i:3d}]: {repr(p.text)}")
