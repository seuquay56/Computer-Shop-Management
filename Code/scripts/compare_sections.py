import docx
import difflib

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

# Function to extract clean paragraphs by section
def extract_sections(doc):
    sections = {}
    current_sec = "FRONT_MATTER"
    sections[current_sec] = []
    
    for p in doc.paragraphs:
        txt = p.text.strip()
        if not txt:
            continue
        # Check if heading
        st = p.style.name if p.style else ""
        if "Heading 1" in st or (txt.startswith("CHAPTER") and len(txt) < 50) or txt in ["ABSTRACT", "EXECUTIVE SUMMARY", "REFERENCES"]:
            current_sec = txt
            sections[current_sec] = []
        else:
            sections[current_sec].append(txt)
    return sections

sec_a = extract_sections(doc_a)
sec_b = extract_sections(doc_b)

print("=== SECTIONS IN FILE A ===")
for k in sec_a.keys():
    print(f"  A: {repr(k)} ({len(sec_a[k])} paras)")

print("\n=== SECTIONS IN FILE B ===")
for k in sec_b.keys():
    print(f"  B: {repr(k)} ({len(sec_b[k])} paras)")
