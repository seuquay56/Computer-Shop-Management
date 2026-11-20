import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("test_resave_orig.docx") as z1, \
     zipfile.ZipFile("test_t4_fixed.docx") as z2:
    root1 = ET.fromstring(z1.read("word/document.xml"))
    root2 = ET.fromstring(z2.read("word/document.xml"))

body1 = root1.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
body2 = root2.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')

print("ORIG 67:")
print(ET.tostring(body1[67], encoding='utf-8').decode('utf-8'))
print("FIXED 67:")
print(ET.tostring(body2[67], encoding='utf-8').decode('utf-8'))
