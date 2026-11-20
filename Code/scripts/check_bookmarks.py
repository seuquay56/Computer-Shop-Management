import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z:
    root = ET.fromstring(z.read("word/document.xml"))

starts = set()
ends = set()
for elem in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bookmarkStart'):
    starts.add(elem.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}id'))

for elem in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}bookmarkEnd'):
    ends.add(elem.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}id'))

print(f"Total starts: {len(starts)}, ends: {len(ends)}")
print("Starts without ends:", starts - ends)
print("Ends without starts:", ends - starts)
