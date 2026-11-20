import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("test_resave_orig.docx") as z1, \
     zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    root1 = ET.fromstring(z1.read("word/document.xml"))
    root2 = ET.fromstring(z2.read("word/document.xml"))

body1 = root1.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
body2 = root2.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')

for idx in range(82, 88):
    print(f"--- ORIG [{idx}] ---")
    print(ET.tostring(body1[idx], encoding='utf-8').decode('utf-8')[:250])
    print(f"--- UPDATED [{idx}] ---")
    print(ET.tostring(body2[idx], encoding='utf-8').decode('utf-8')[:250])
