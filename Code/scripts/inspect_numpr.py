import zipfile
import xml.etree.ElementTree as ET

DOC_TARGET = r"Computer-Shop-Management\524H0057_524H0069_524H0052_FinalReport.docx"

with zipfile.ZipFile(DOC_TARGET, 'r') as z:
    styles_xml = z.read("word/styles.xml")
    root = ET.fromstring(styles_xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    for style in root.findall("w:style", ns):
        s_id = style.attrib.get(f"{{{ns['w']}}}styleId")
        if s_id and s_id.startswith("Heading"):
            name = style.find("w:name", ns).attrib.get(f"{{{ns['w']}}}val") if style.find("w:name", ns) is not None else ""
            pPr = style.find("w:pPr", ns)
            numPr = pPr.find("w:numPr", ns) if pPr is not None else None
            print(f"Style: {s_id} ('{name}'): numPr={'YES' if numPr is not None else 'NO'}")

    if "word/numbering.xml" in z.namelist():
        num_xml = z.read("word/numbering.xml")
        print("numbering.xml exists! size:", len(num_xml))
