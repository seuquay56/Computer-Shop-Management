import zipfile
import xml.etree.ElementTree as ET
import os

DOC_PATH = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"

# Read zip
with zipfile.ZipFile(DOC_PATH, 'r') as z:
    file_map = {name: z.read(name) for name in z.namelist()}

xml_str = file_map['word/document.xml'].decode('utf-8')
root = ET.fromstring(xml_str)
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}

# Locate the run with instrText "TOC"
for p in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p'):
    for instr in p.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}instrText'):
        if 'TOC' in (instr.text or ''):
            print("Found TOC field in paragraph! Removing the field begin, instrText, and separate...")
            # We want to remove the runs containing:
            # 1) fldCharType="begin"
            # 2) instrText containing "TOC"
            # 3) fldCharType="separate"
            runs_to_remove = []
            for r in p.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r'):
                has_begin = any(fc.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldCharType') == 'begin' for fc in r.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar'))
                has_instr = any('TOC' in (t.text or '') for t in r.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}instrText'))
                has_sep = any(fc.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldCharType') == 'separate' for fc in r.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar'))
                if has_begin or has_instr or has_sep:
                    runs_to_remove.append(r)
            for r in runs_to_remove:
                p.remove(r)
                print("  Removed run.")

# Update file_map
new_xml = ET.tostring(root, encoding='utf-8', xml_declaration=True)
file_map['word/document.xml'] = new_xml

# Write back zip
with zipfile.ZipFile(DOC_PATH, 'w', compression=zipfile.ZIP_DEFLATED) as z_out:
    for name, content in file_map.items():
        z_out.writestr(name, content)

print("Saved updated docx without unclosed TOC field!")
