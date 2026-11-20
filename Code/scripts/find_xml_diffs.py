import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("test_resave_orig.docx") as z1:
    root1 = ET.fromstring(z1.read("word/document.xml"))

with zipfile.ZipFile("test_t4_fixed.docx") as z2:
    root2 = ET.fromstring(z2.read("word/document.xml"))

body1 = root1.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
body2 = root2.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')

print(f"Orig children count: {len(body1)}")
print(f"Fixed children count: {len(body2)}")

# Let's list what types of children exist
print("Orig child tags:", set(c.tag.split('}')[-1] for c in body1))
print("Fixed child tags:", set(c.tag.split('}')[-1] for c in body2))

# Find the differences between body1 and body2
diffs = []
for i in range(min(len(body1), len(body2))):
    xml1 = ET.tostring(body1[i], encoding='utf-8').decode('utf-8')
    xml2 = ET.tostring(body2[i], encoding='utf-8').decode('utf-8')
    if xml1 != xml2:
        diffs.append((i, xml1, xml2))

print(f"Total different children: {len(diffs)} out of {min(len(body1), len(body2))}")
for i, x1, x2 in diffs[:10]:
    t1 = "".join(ET.fromstring(x1).itertext()).strip()
    t2 = "".join(ET.fromstring(x2).itertext()).strip()
    print(f"Diff at [{i}]:")
    print(f"   orig : {t1[:40]!r}")
    print(f"   fixed: {t2[:40]!r}")
