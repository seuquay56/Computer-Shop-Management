import zipfile
import win32com.client, os, time

# Test replacing parts of test_resave_orig.docx with parts from updated.docx
def test_open(path):
    word = win32com.client.Dispatch('Word.Application')
    word.Visible = False
    word.DisplayAlerts = 0
    t0 = time.time()
    try:
        doc = word.Documents.Open(os.path.abspath(path))
        pages = doc.ComputeStatistics(2)
        print(f"Opened {path} in {time.time()-t0:.2f}s! Pages: {pages}")
        doc.Close(False)
        return True
    except Exception as e:
        print(f"Failed {path}: {e}")
        return False
    finally:
        word.Quit()

print("Testing baseline test_resave_orig.docx:")
test_open("test_resave_orig.docx")
