import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("test_resave_orig.docx") as z1:
    xml1 = z1.read("word/document.xml").decode("utf-8")

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    xml2 = z2.read("word/document.xml").decode("utf-8")

print(f"Len orig: {len(xml1)}, Len updated: {len(xml2)}")

# Parse and check element counts
root1 = ET.fromstring(xml1)
root2 = ET.fromstring(xml2)

body1 = root1.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
body2 = root2.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')

print(f"Body children: orig={len(body1)}, updated={len(body2)}")

# Let's check differences in body tags
for i in range(min(len(body1), len(body2))):
    t1 = "".join(body1[i].itertext()).strip()
    t2 = "".join(body2[i].itertext()).strip()
    if t1 != t2:
        print(f"First diff at child {i}:")
        print(f"  Orig:    {t1[:50]!r}")
        print(f"  Updated: {t2[:50]!r}")
        break
