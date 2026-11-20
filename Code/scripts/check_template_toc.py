import docx

doc_temp = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")
print("=== TEMPLATE TOC ZONE ===")
for i, p in enumerate(doc_temp.paragraphs):
    if "TABLE OF CONTENT" in p.text.upper() or "LIST OF TABLE" in p.text.upper():
        for j in range(max(0, i-1), min(len(doc_temp.paragraphs), i+25)):
            pj = doc_temp.paragraphs[j]
            print(f"Template P[{j}]: {pj.text[:60]!r} | style: {pj.style.name} | xml_len: {len(pj._p.xml)}")
            if "hyperlink" in pj._p.xml:
                print("   has hyperlink!")
            if "w:instrText" in pj._p.xml:
                print("   has instrText!")
        break
