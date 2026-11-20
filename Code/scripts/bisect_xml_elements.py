import zipfile
import win32com.client, os, time
import xml.etree.ElementTree as ET

def test_open(path):
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0
    try:
        doc = word.Documents.Open(os.path.abspath(path))
        pages = doc.ComputeStatistics(2)
        doc.Close(False)
        return True, pages
    except Exception as e:
        return False, str(e)
    finally:
        word.Quit()

with zipfile.ZipFile("test_t3.docx") as z1:
    base_files = {name: z1.read(name) for name in z1.namelist()}

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    up_doc_xml = z2.read("word/document.xml")

up_root = ET.fromstring(up_doc_xml)
up_body = up_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
up_children = list(up_body)

def test_prefix(n):
    test_root = ET.fromstring(base_files['word/document.xml'])
    test_body = test_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
    for c in list(test_body): test_body.remove(c)
    for c in up_children[:n]: test_body.append(c)
    if up_children[-1].tag.endswith('sectPr'):
        test_body.append(up_children[-1])
    
    test_files = dict(base_files)
    test_files['word/document.xml'] = ET.tostring(test_root, encoding='utf-8', xml_declaration=True)
    with zipfile.ZipFile("test_bisect.docx", 'w') as z:
        for k, v in test_files.items(): z.writestr(k, v)
    ok, res = test_open("test_bisect.docx")
    print(f"Prefix {n}/{len(up_children)}: ok={ok} ({res})")
    return ok

for k in [60, 30, 15, 5, 2]:
    test_prefix(k)
