import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z:
    xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(xml)

ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

# Find all fldChar elements
fld_elements = []
for elem in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar"):
    fld_elements.append(elem.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldCharType"))

print("Total fldChar elements:", len(fld_elements))
print("Sequence of fldChar types:")
print(fld_elements)
