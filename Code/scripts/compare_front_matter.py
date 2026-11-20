import docx
import difflib

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

def get_front_matter(doc):
    paras = []
    for p in doc.paragraphs:
        txt = p.text.strip()
        if txt.startswith("CHAPTER 1") or txt == "INTRODUCTION":
            break
        if txt:
            paras.append(txt)
    return paras

fm_a = get_front_matter(doc_a)
fm_b = get_front_matter(doc_b)

print(f"Front matter paragraphs: A={len(fm_a)}, B={len(fm_b)}")

diff = list(difflib.unified_diff(fm_a, fm_b, fromfile="File_A_FrontMatter", tofile="File_B_FrontMatter", lineterm=""))
print(f"Diff lines: {len(diff)}")
for line in diff:
    print(line[:120])
