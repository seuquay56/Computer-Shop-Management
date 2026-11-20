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

with zipfile.ZipFile("test_t4_fixed.docx") as z2:
    fixed_files = {name: z2.read(name) for name in z2.namelist()}

orig_root = ET.fromstring(base_files['word/document.xml'])
orig_body = orig_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
orig_children = list(orig_body)

fixed_root = ET.fromstring(fixed_files['word/document.xml'])
fixed_body = fixed_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
fixed_children = list(fixed_body)

# In test_resave_orig.docx, let's see which chunk from fixed breaks it when substituted
# First, let's test if replacing children 182..400 (Body) works!
# Notice in orig, Chapter 1 starts at child ~147
idx_ch1_orig = None
idx_ch1_fixed = None
for i, c in enumerate(orig_children):
    if "CHAPTER 1. INTRODUCTION" in "".join(c.itertext()):
        idx_ch1_orig = i; break

for i, c in enumerate(fixed_children):
    if "CHAPTER 1. INTRODUCTION" in "".join(c.itertext()) and i > 150:
        idx_ch1_fixed = i; break

print(f"Chapter 1 in orig={idx_ch1_orig}, in fixed={idx_ch1_fixed}")

# Test A: Keep orig 0..idx_ch1_orig, replace body (ch1..end) with fixed
test_root = ET.fromstring(base_files['word/document.xml'])
test_body = test_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
for c in list(test_body): test_body.remove(c)
for c in orig_children[:idx_ch1_orig]: test_body.append(c)
for c in fixed_children[idx_ch1_fixed:]: test_body.append(c)

test_files = dict(fixed_files)
test_files['word/document.xml'] = ET.tostring(test_root, encoding='utf-8', xml_declaration=True)
with zipfile.ZipFile("test_chunk_body.docx", 'w') as z:
    for k, v in test_files.items(): z.writestr(k, v)

okA, resA = test_open("test_chunk_body.docx")
print("Test A (Orig Front + Fixed Body): ok=", okA, resA)

# Test B: Keep fixed 0..idx_ch1_fixed, replace body with orig
test_root = ET.fromstring(base_files['word/document.xml'])
test_body = test_root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
for c in list(test_body): test_body.remove(c)
for c in fixed_children[:idx_ch1_fixed]: test_body.append(c)
for c in orig_children[idx_ch1_orig:]: test_body.append(c)

test_files = dict(fixed_files)
test_files['word/document.xml'] = ET.tostring(test_root, encoding='utf-8', xml_declaration=True)
with zipfile.ZipFile("test_chunk_front.docx", 'w') as z:
    for k, v in test_files.items(): z.writestr(k, v)

okB, resB = test_open("test_chunk_front.docx")
print("Test B (Fixed Front + Orig Body): ok=", okB, resB)
