import os
import glob
import docx

folder = r"c:\Users\Huy\Desktop\SE Final Report"
docx_files = glob.glob(os.path.join(folder, "*.docx")) + glob.glob(os.path.join(folder, "**", "*.docx"))

for f in docx_files:
    if "~$" in f: continue
    try:
        d = docx.Document(f)
        refs = []
        for i, p in enumerate(d.paragraphs):
            if "reference" in p.text.lower():
                refs.append((i, p.style.name if p.style else None, p.text.strip()[:60]))
        print(f"File: {os.path.basename(f)} -> {len(refs)} reference occurrences:")
        for r in refs:
            print(f"   P[{r[0]}] ({r[1]}): {repr(r[2])}")
    except Exception as e:
        print(f"File: {os.path.basename(f)} -> Error: {e}")
