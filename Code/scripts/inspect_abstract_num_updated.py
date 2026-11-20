import os
import zipfile
import xml.etree.ElementTree as ET

DOC_TARGET = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"

with zipfile.ZipFile(DOC_TARGET, 'r') as z:
    num_xml = z.read("word/numbering.xml")
    root = ET.fromstring(num_xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    for num in root.findall("w:num", ns):
        n_id = num.attrib.get(f"{{{ns['w']}}}numId")
        a_id = num.find("w:abstractNumId", ns).attrib.get(f"{{{ns['w']}}}val") if num.find("w:abstractNumId", ns) is not None else ""
        print(f"numId={n_id} -> abstractNumId={a_id}")
    
    for a_num in root.findall("w:abstractNum", ns):
        a_id = a_num.attrib.get(f"{{{ns['w']}}}abstractNumId")
        print(f"AbstractNum {a_id}:")
        for lvl in a_num.findall("w:lvl", ns):
            ilvl = lvl.attrib.get(f"{{{ns['w']}}}ilvl")
            lvlText = lvl.find("w:lvlText", ns).attrib.get(f"{{{ns['w']}}}val") if lvl.find("w:lvlText", ns) is not None else ""
            numFmt = lvl.find("w:numFmt", ns).attrib.get(f"{{{ns['w']}}}val") if lvl.find("w:numFmt", ns) is not None else ""
            print(f"  ilvl {ilvl}: fmt={numFmt}, text='{lvlText}'")
