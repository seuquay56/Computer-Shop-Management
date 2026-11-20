import docx
import difflib

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

def is_heading_or_caption(txt):
    if not txt: return True
    if txt.startswith("CHAPTER") or txt.startswith("Table ") or txt.startswith("Figure "): return True
    if txt.startswith("Table .:") or txt.startswith("Figure .:"): return True
    if txt.startswith("Table UC-"): return True
    # check if section title like "1.1 ...", "2.1 ...", "INTRODUCTION", etc.
    import re
    if re.match(r'^\d+(\.\d+)*\s+[A-Z]', txt): return True
    if txt in [
        "INTRODUCTION", "Purpose and Scope", "Product Overview", "Structure of the Document", "Terms, Acronyms, and Abbreviations",
        "PROJECT MANAGEMENT PLAN", "Project Organization", "Lifecycle Model Used", "Risk Analysis",
        "Hardware and Software Resource Requirements", "Deliverables and Schedule", "Monitoring, Reporting, and Controlling Mechanisms",
        "Professional Standards", "Configuration Management Evidence", "Impact of the Project on Individuals and Organizations",
        "REQUIREMENT SPECIFICATIONS", "Stakeholders for the System", "Use Case Model", "Graphical Use Case Model",
        "Textual Description for Each Use Case", "Functional Requirements", "Non-Functional Requirements",
        "ARCHITECTURE", "Architectural Style(s) Used", "Architectural Model", "Technology, Software, and Hardware Used",
        "Rationale for Your Architectural Style and Model", "DESIGN", "Database Design", "Entity Relationship Diagram (ERD)",
        "Relational Data Model", "Data Dictionary", "Static Model – Class Diagrams", "Dynamic Model – Sequence Diagrams",
        "Rationale for Detailed Design Model", "Traceability from Requirements to Detailed Design Model",
        "TEST PLAN", "Requirements/Specifications-Based System Level Test Cases", "Traceability of Test Cases to Use Cases",
        "Techniques Used for Test Generation", "Assessment of the Goodness of Your Testsuite",
        "DEMO", "Database", "Source Code", "Testing", "REFERENCES"
    ]:
        return True
    return False

def get_body_text_only(doc):
    texts = []
    in_body = False
    for p in doc.paragraphs:
        txt = p.text.strip()
        if not txt: continue
        if "INTRODUCTION" in txt:
            in_body = True
        if in_body:
            if not is_heading_or_caption(txt):
                texts.append(txt)
    return texts

texts_a = get_body_text_only(doc_a)
texts_b = get_body_text_only(doc_b)

print(f"Total prose paragraphs: A={len(texts_a)}, B={len(texts_b)}")

diff = list(difflib.unified_diff(texts_a, texts_b, fromfile="File_A_Prose", tofile="File_B_Prose", lineterm=""))
print(f"Total prose diff lines: {len(diff)}")
for line in diff:
    print(line[:120])
