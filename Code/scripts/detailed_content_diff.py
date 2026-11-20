import docx
import difflib

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

def get_body_paragraphs(doc):
    # Skip front matter: find first chapter heading
    paras = []
    in_body = False
    for p in doc.paragraphs:
        txt = p.text.strip()
        if not txt: continue
        if txt.startswith("CHAPTER 1") or txt == "INTRODUCTION":
            in_body = True
        if in_body:
            paras.append(txt)
    return paras

paras_a = get_body_paragraphs(doc_a)
paras_b = get_body_paragraphs(doc_b)

print(f"Total body paragraphs: A={len(paras_a)}, B={len(paras_b)}")

# Let's inspect differences in paragraphs
diff = list(difflib.unified_diff(paras_a, paras_b, fromfile="File_A_Original", tofile="File_B_Updated", lineterm=""))

print(f"Total diff lines: {len(diff)}")
for line in diff[:100]:
    print(line[:100])
