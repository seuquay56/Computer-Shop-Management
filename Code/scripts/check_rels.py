import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z:
    rels_xml = z.read("word/_rels/document.xml.rels")
    root = ET.fromstring(rels_xml)
    doc_xml = z.read("word/document.xml").decode("utf-8")
    
    # Check all Relationship targets
    for rel in root:
        rid = rel.attrib.get("Id")
        target = rel.attrib.get("Target")
        r_type = rel.attrib.get("Type")
        if "image" in r_type.lower():
            # Check if target exists in zip
            full_path = "word/" + target if not target.startswith("/") else target[1:]
            exists = full_path in z.namelist()
            print(f"Rel {rid} -> {target} (exists: {exists})")
