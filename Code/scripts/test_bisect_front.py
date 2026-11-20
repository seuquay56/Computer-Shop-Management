import zipfile
import win32com.client, os, time
import xml.etree.ElementTree as ET

def test_open(path):
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0
    t0 = time.time()
    try:
        doc = word.Documents.Open(os.path.abspath(path))
        pages = doc.ComputeStatistics(2)
        doc.Close(False)
        return True, pages
    except Exception as e:
        return False, str(e)
    finally:
        word.Quit()

with zipfile.ZipFile("test_resave_orig.docx") as z1:
    base_files = {name: z1.read(name) for name in z1.namelist()}

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    up_doc_xml = z2.read("word/document.xml")

up_root = ET.fromstring(up_doc_xml)
up_body = up_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
up_children = list(up_body)

orig_root = ET.fromstring(base_files['word/document.xml'])
orig_body = orig_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
orig_children = list(orig_body)

# Test 1: Only Cover (0 to 47) from updated, rest from orig
test_root = ET.fromstring(base_files['word/document.xml'])
test_body = test_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
for c in list(test_body): test_body.remove(c)
for c in up_children[:47]: test_body.append(c)
for c in orig_children[36:]: test_body.append(c)

test_files = dict(base_files)
test_files['word/document.xml'] = ET.tostring(test_root, encoding='utf-8', xml_declaration=True)
with zipfile.ZipFile("test_cover_only.docx", 'w') as z:
    for k, v in test_files.items(): z.writestr(k, v)
ok1, res1 = test_open("test_cover_only.docx")
print("Cover only (0..47): ok=", ok1, res1)

# Test 2: Only Ack/Dec/Exec (47..88) from updated, rest from orig
test_root = ET.fromstring(base_files['word/document.xml'])
test_body = test_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
for c in list(test_body): test_body.remove(c)
for c in orig_children[:36]: test_body.append(c)
for c in up_children[47:88]: test_body.append(c)
for c in orig_children[90:]: test_body.append(c)

test_files = dict(base_files)
test_files['word/document.xml'] = ET.tostring(test_root, encoding='utf-8', xml_declaration=True)
with zipfile.ZipFile("test_ack_dec_only.docx", 'w') as z:
    for k, v in test_files.items(): z.writestr(k, v)
ok2, res2 = test_open("test_ack_dec_only.docx")
print("Ack/Dec/Exec only (47..88): ok=", ok2, res2)
