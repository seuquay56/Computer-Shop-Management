import zipfile
import win32com.client, os, time

def test_open(path):
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0
    t0 = time.time()
    try:
        doc = word.Documents.Open(os.path.abspath(path))
        pages = doc.ComputeStatistics(2)
        print(f"  SUCCESS: Opened {path} in {time.time()-t0:.2f}s! Pages: {pages}")
        doc.Close(False)
        return True
    except Exception as e:
        print(f"  FAILED {path}: {e}")
        return False
    finally:
        word.Quit()

# Read both zips
with zipfile.ZipFile("test_resave_orig.docx") as z1:
    orig_files = {name: z1.read(name) for name in z1.namelist()}

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    up_files = {name: z2.read(name) for name in z2.namelist()}

# Test 1: orig_files with up_files styles.xml
print("Test 1: orig + updated styles.xml")
t1_files = dict(orig_files)
t1_files['word/styles.xml'] = up_files['word/styles.xml']
with zipfile.ZipFile("test_t1.docx", 'w') as z:
    for n, c in t1_files.items(): z.writestr(n, c)
test_open("test_t1.docx")

# Test 2: orig_files with updated headers
print("Test 2: orig + updated headers")
t2_files = dict(orig_files)
for h in ['word/header1.xml', 'word/header2.xml', 'word/header3.xml']:
    if h in up_files: t2_files[h] = up_files[h]
with zipfile.ZipFile("test_t2.docx", 'w') as z:
    for n, c in t2_files.items(): z.writestr(n, c)
test_open("test_t2.docx")

# Test 3: orig_files with updated media and rels
print("Test 3: orig + updated media and rels")
t3_files = dict(orig_files)
for n, c in up_files.items():
    if 'media/' in n: t3_files[n] = c
t3_files['word/_rels/document.xml.rels'] = up_files['word/_rels/document.xml.rels']
t3_files['[Content_Types].xml'] = up_files['[Content_Types].xml']
with zipfile.ZipFile("test_t3.docx", 'w') as z:
    for n, c in t3_files.items(): z.writestr(n, c)
test_open("test_t3.docx")

# Test 4: orig_files with updated document.xml
print("Test 4: orig + updated document.xml")
t4_files = dict(t3_files)
t4_files['word/document.xml'] = up_files['word/document.xml']
with zipfile.ZipFile("test_t4.docx", 'w') as z:
    for n, c in t4_files.items(): z.writestr(n, c)
test_open("test_t4.docx")
