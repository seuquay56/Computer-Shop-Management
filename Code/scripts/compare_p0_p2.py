import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z:
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
    for i in range(3):
        print(f"=== UP[{i}] ===")
        print(ET.tostring(body[i], encoding='utf-8').decode('utf-8'))

with zipfile.ZipFile("test_resave_orig.docx") as z:
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
    for i in range(3):
        print(f"=== ORIG[{i}] ===")
        print(ET.tostring(body[i], encoding='utf-8').decode('utf-8'))
