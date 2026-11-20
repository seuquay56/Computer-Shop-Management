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
        print(f"SUCCESS: Opened {path} in {time.time()-t0:.2f}s! Pages: {pages}")
        doc.Close(False)
        return True
    except Exception as e:
        print(f"FAILED {path}: {e}")
        return False
    finally:
        word.Quit()

# Let's inspect styles.xml or document.xml
with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z_up:
    print("styles.xml len:", len(z_up.read("word/styles.xml")))
    print("document.xml len:", len(z_up.read("word/document.xml")))

# Check if updated.docx opens when we copy it to a clean path
import shutil
shutil.copyfile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx", "test_copy_updated.docx")
print("Testing test_copy_updated.docx:")
test_open("test_copy_updated.docx")
