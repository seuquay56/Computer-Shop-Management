import docx

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

def print_ch7(doc, label):
    print(f"=== CHAPTER 7 IN {label} ===")
    in_ch7 = False
    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if not txt: continue
        if txt.startswith("CHAPTER 7") or txt == "DEMO":
            if i > 150: # in body
                in_ch7 = True
        elif in_ch7 and (txt.startswith("REFERENCES") or txt == "REFERENCES"):
            break
        if in_ch7:
            has_blip = 'blip' in p._element.xml
            print(f"  P[{i:3d}] ({p.style.name if p.style else None}) blip={has_blip}: {repr(txt)}")

print_ch7(doc_a, "FILE A (Original)")
print_ch7(doc_b, "FILE B (Updated)")
