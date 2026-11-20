import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052.docx") as z:
    xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(xml)
    
    stack = 0
    for p_idx, p in enumerate(root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p")):
        for elem in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar"):
            f_type = elem.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldCharType")
            if f_type == "begin":
                stack += 1
            elif f_type == "end":
                stack -= 1
        if "TABLE OF CONTENT" in "".join(p.itertext()):
            print(f"Orig TOC at P[{p_idx}], stack={stack}")
        if stack == 0 and p_idx > 80 and p_idx < 150:
            txt = "".join(p.itertext())
            if txt:
                print(f"Orig stack became 0 at P[{p_idx}]: {txt[:40]!r}")
