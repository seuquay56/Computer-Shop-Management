import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("test_resave_orig.docx") as z1, \
     zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    root1 = ET.fromstring(z1.read("word/document.xml"))
    root2 = ET.fromstring(z2.read("word/document.xml"))

tags1 = set(elem.tag for elem in root1.iter())
tags2 = set(elem.tag for elem in root2.iter())

print("Tags in updated not in orig:", tags2 - tags1)
print("Tags in orig not in updated:", tags1 - tags2)
