import os
import docx

DOC_TARGET = os.path.join(os.path.dirname(__file__), "..", "..", "524H0057_524H0069_524H0052_FinalReport.docx")

def main():
    doc = docx.Document(DOC_TARGET)
    print("Checking order of Use Case tables...")

    # We want:
    # Table 3.9 (UC-08)
    # Table 3.10 (UC-09 & 10)
    # Table 3.11 (UC-11)
    # Table 3.12 (UC-12 & 13)
    # Table 3.13 (UC-14)
    # Table 3.14 (UC-15)
    # Table 3.15 (FR Matrix)
    
    # Let's locate the pairs of (caption paragraph, table, empty paragraph)
    # We can identify them by their caption text.
    p_t310 = None # Table 3.10
    p_t313 = None # Table 3.13
    p_t315 = None # Table 3.15
    
    for i, p in enumerate(doc.paragraphs):
        if "Table 3.10: Textual Specification for Manage Shopping" in p.text:
            p_t310 = p
        elif "Table 3.13: Textual Specification for Batch Inward" in p.text:
            p_t313 = p
        elif "Table 3.15: Functional Requirements Specification Matrix" in p.text:
            p_t315 = p

    if p_t310 is not None and p_t313 is not None and p_t315 is not None:
        print("Found Table 3.10, 3.13, and 3.15. Reordering blocks so Module 3 precedes Module 4...")
        
        # Elements for Module 4 (Table 3.13 and Table 3.14):
        # Starts at p_t313._element and ends right before p_t310._element
        mod4_elems = []
        curr = p_t313._element
        while curr is not None and curr != p_t310._element:
            nxt = curr.getnext()
            mod4_elems.append(curr)
            curr = nxt
            
        print(f"Extracted {len(mod4_elems)} elements for Module 4 (UC-14 and UC-15)")
        # Move mod4_elems to be right before p_t315._element
        for elem in mod4_elems:
            p_t315._element.addprevious(elem)
            
        doc.save(DOC_TARGET)
        print("Successfully reordered Use Case tables in ascending order!")

if __name__ == "__main__":
    main()
