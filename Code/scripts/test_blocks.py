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

# Helper to build doc with mixed children
def test_mix(up_indices, name):
    test_root = ET.fromstring(base_files['word/document.xml'])
    test_body = test_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
    for c in list(test_body): test_body.remove(c)
    
    # We take orig_children, but for specified range we replace with up_children
    # Or simpler: we replace a slice of orig_children with up_children
    for c in orig_children:
        test_body.append(c)
        
    test_files = dict(base_files)
    test_files['word/document.xml'] = ET.tostring(test_root, encoding='utf-8', xml_declaration=True)
    with zipfile.ZipFile(name, 'w') as z:
        for k, v in test_files.items(): z.writestr(k, v)
    ok, res = test_open(name)
    print(f"Mix {name}: ok={ok} ({res})")

# Let's test taking orig_body, but replacing P[0..80] (Cover & Ack) with up_children P[0..88]
print("Test A: Replace Cover & Front Matter with updated")
test_root = ET.fromstring(base_files['word/document.xml'])
test_body = test_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
for c in list(test_body): test_body.remove(c)

# Add up_children 0 to 88 (up to TABLE OF CONTENT)
for c in up_children[:88]: test_body.append(c)
# Add orig_children from TABLE OF CONTENT to end
for c in orig_children[90:]: test_body.append(c)

test_files = dict(base_files)
test_files['word/document.xml'] = ET.tostring(test_root, encoding='utf-8', xml_declaration=True)
with zipfile.ZipFile("test_block_front.docx", 'w') as z:
    for k, v in test_files.items(): z.writestr(k, v)
ok, res = test_open("test_block_front.docx")
print("Block Front (Cover, Ack, Dec, Exec Summary): ok=", ok, res)
