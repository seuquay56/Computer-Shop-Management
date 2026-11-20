import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("test_resave_orig.docx") as z1:
    root1 = ET.fromstring(z1.read("word/document.xml"))
    body1 = root1.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
    for idx, c in enumerate(body1):
        if c.tag.endswith('sectPr'):
            print(f"Orig body sectPr at end (child {idx})")
        for sp in c.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sectPr'):
            print(f"Orig paragraph {idx} contains sectPr!")

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    root2 = ET.fromstring(z2.read("word/document.xml"))
    body2 = root2.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
    for idx, c in enumerate(body2):
        if c.tag.endswith('sectPr'):
            print(f"Updated body sectPr at end (child {idx})")
        for sp in c.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sectPr'):
            print(f"Updated paragraph {idx} contains sectPr!")
