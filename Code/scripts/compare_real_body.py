import docx
import difflib

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

def get_real_body_paragraphs(doc):
    paras = []
    in_real_body = False
    for p in doc.paragraphs:
        txt = p.text.strip()
        if not txt: continue
        # Find where Chapter 1 actually starts (not in TOC)
        if txt == "INTRODUCTION" or txt == "CHAPTER 1. INTRODUCTION":
            in_real_body = True
        if in_real_body:
            paras.append(txt)
    return paras

paras_a = get_real_body_paragraphs(doc_a)
paras_b = get_real_body_paragraphs(doc_b)

print(f"Real body paragraphs: A={len(paras_a)}, B={len(paras_b)}")

diff = list(difflib.unified_diff(paras_a, paras_b, fromfile="File_A_Original", tofile="File_B_Updated", lineterm=""))
print(f"Total diff lines: {len(diff)}")

for line in diff:
    if line.startswith("+") or line.startswith("-"):
        print(line[:120])
