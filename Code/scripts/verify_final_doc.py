import docx
import zipfile
import xml.etree.ElementTree as ET

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
doc = docx.Document(DOC_PATH)

print("=" * 60)
print("1. CHECKING MILESTONES AND PAGE BREAKS")
print("=" * 60)
milestones = [
    "DECLARATION OF AUTHORSHIP",
    "TEACHER'S ASSESSMENT AND CONFIRMATION",
    "ABSTRACT",
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

found_milestones = {}
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    if txt in milestones:
        found_milestones[txt] = (i, p.paragraph_format.page_break_before)
        print(f"  P[{i:3d}] {txt:40s} | pb_before={p.paragraph_format.page_break_before}")

for m in milestones:
    if m not in found_milestones:
        print(f"  MISSING MILESTONE: {m}")

print("\n" + "=" * 60)
print("2. CHECKING FOR REDUNDANT MANUAL PAGE BREAKS")
print("=" * 60)
manual_br_count = 0
for i, p in enumerate(doc.paragraphs):
    xml_str = p._element.xml
    if 'w:type="page"' in xml_str or '<w:br w:type="page"/>' in xml_str:
        manual_br_count += 1
        print(f"  Manual page break at P[{i}]: text='{p.text[:30]}'")
if manual_br_count == 0:
    print("  Zero redundant manual page breaks found! Document cleanly paginates via page_break_before.")

print("\n" + "=" * 60)
print("3. CHECKING HEADING DUPLICATION & NUMPR")
print("=" * 60)
for i, p in enumerate(doc.paragraphs):
    if "Deliverables and Schedule" in p.text:
        print(f"  P[{i:3d}] text: {repr(p.text)} | style: {p.style.name}")

# Check styles.xml for numPr
with zipfile.ZipFile(DOC_PATH) as z:
    root = ET.fromstring(z.read('word/styles.xml'))
    w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    numpr_in_headings = []
    for s in root.findall(f'{{{w_ns}}}style'):
        s_id = s.attrib.get(f'{{{w_ns}}}styleId', '')
        if 'Heading' in s_id or 'heading' in s_id:
            pPr = s.find(f'{{{w_ns}}}pPr')
            if pPr is not None and pPr.find(f'{{{w_ns}}}numPr') is not None:
                numpr_in_headings.append(s_id)
    print(f"  Headings with numPr in styles.xml: {len(numpr_in_headings)}")

print("\n" + "=" * 60)
print("4. CHECKING LIST OF FIGURES & LIST OF TABLES SAMPLES")
print("=" * 60)
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == "LIST OF FIGURES":
        print(f"  LIST OF FIGURES heading: P[{i}] style={p.style.name} align={p.paragraph_format.alignment}")
        for j in range(i+1, i+4):
            print(f"    P[{j}] style={doc.paragraphs[j].style.name}: {repr(doc.paragraphs[j].text)}")
    elif p.text.strip() == "LIST OF TABLES":
        print(f"  LIST OF TABLES heading: P[{i}] style={p.style.name} align={p.paragraph_format.alignment}")
        for j in range(i+1, i+4):
            print(f"    P[{j}] style={doc.paragraphs[j].style.name}: {repr(doc.paragraphs[j].text)}")

print("\n" + "=" * 60)
print("5. CHECKING CHAPTER 7 OUTLINE & REFERENCES")
print("=" * 60)
for i, p in enumerate(doc.paragraphs):
    if any(k in p.text for k in ["CHAPTER 7", "7.1", "7.2", "7.3", "7.4", "REFERENCES"]):
        if p.style and ("Heading" in p.style.name or p.text == "REFERENCES" or "Full-Stack" in p.text):
            print(f"  P[{i:3d}] style={p.style.name:15s} | text: {repr(p.text)}")

print("\n" + "=" * 60)
print("6. CHECKING HEADING RUN COLORS (PITCH BLACK ENFORCEMENT)")
print("=" * 60)
non_black_headings = []
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    is_hd = (p.style and ("Heading" in p.style.name or "Title" in p.style.name)) or any(txt.startswith(k) for k in [
        "CHAPTER", "1.", "2.", "3.", "4.", "5.", "6.", "7.",
        "DECLARATION", "TEACHER'S ASSESSMENT", "ABSTRACT", "TABLE OF CONTENT",
        "LIST OF FIGURES", "LIST OF TABLES", "REFERENCES"
    ])
    if is_hd:
        for r in p.runs:
            if r.font and r.font.color and r.font.color.rgb:
                if str(r.font.color.rgb) != "000000":
                    non_black_headings.append((i, txt[:30], str(r.font.color.rgb)))
print(f"  Non-black heading runs count: {len(non_black_headings)}")

print("\n" + "=" * 60)
print("7. CHECKING TEACHER'S ASSESSMENT RUBRIC TABLE")
print("=" * 60)
for t in doc.tables:
    if len(t.rows) > 0 and "Evaluation Item" in t.rows[0].cells[0].text:
        print(f"  Rubric table found with {len(t.rows)} rows:")
        for r_idx, row in enumerate(t.rows):
            print(f"    Row {r_idx:2d}: {row.cells[0].text[:35]:35s} | {row.cells[1].text:12s} | {row.cells[2].text[:45]}...")
        break

print("\n" + "=" * 60)
print("8. CHECKING UNIFIED TABLE STYLES")
print("=" * 60)
print(f"  Total tables formatted: {len(doc.tables)}")
for idx in [0, 1, 5, 10, 20]:
    if idx < len(doc.tables):
        t = doc.tables[idx]
        hdr_shd = t.rows[0].cells[0]._element.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}tcPr/{http://schemas.openxmlformats.org/wordprocessingml/2006/main}shd')
        fill = hdr_shd.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill') if hdr_shd is not None else None
        print(f"  Table[{idx:2d}]: {len(t.rows):2d} rows x {len(t.columns):2d} cols | Header Fill: #{fill}")
