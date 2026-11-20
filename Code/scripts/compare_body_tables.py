import docx
import re

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== BODY TABLE CAPTIONS ===")
for i, p in enumerate(doc.paragraphs[182:], start=182):
    txt = p.text.strip()
    if txt.startswith("Table "):
        print(f"P[{i:03d}]: {txt[:70]}")
