import docx
import re

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== SEARCHING TABLES IN BODY ===")
current_heading = "START"
table_locations = {}
for i, p in enumerate(doc.paragraphs[182:], start=182):
    txt = p.text.strip()
    if p.style.name.startswith("Heading") or txt.startswith("CHAPTER "):
        current_heading = txt
    m = re.match(r'^(Table \d+\.\d+):', txt)
    if m:
        tbl_id = m.group(1)
        table_locations[tbl_id] = (i, txt[:60], current_heading)
        print(f"{tbl_id:12} at P[{i:03d}]: under '{current_heading[:40]}'")

print(f"Total tables found in body: {len(table_locations)}")
