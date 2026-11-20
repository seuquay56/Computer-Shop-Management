import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z:
    xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    
    stack = 0
    for p_idx, p in enumerate(root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p")):
        for elem in p.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar"):
            f_type = elem.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldCharType")
            if f_type == "begin":
                stack += 1
            elif f_type == "end":
                stack -= 1
        if stack != 0:
            txt = "".join(p.itertext())
            print(f"P[{p_idx}] has unmatched stack={stack}: {txt[:60]!r}")
            # print XML of this p
            p_xml = ET.tostring(p, encoding='utf-8').decode('utf-8')
            print("   XML snippet:", p_xml[:300])
