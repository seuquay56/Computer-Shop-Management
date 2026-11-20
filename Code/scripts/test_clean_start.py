import shutil
import docx
import win32com.client, os, time

# Copy clean original to test_clean_start.docx
shutil.copyfile("Computer-Shop-Management/524H00057_524H0069_524H0052.docx", "test_clean_start.docx")

word = win32com.client.Dispatch('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
t0 = time.time()
try:
    doc = word.Documents.Open(os.path.abspath("test_clean_start.docx"))
    pages = doc.ComputeStatistics(2)
    print(f"Clean start opens in {time.time()-t0:.2f}s! Pages: {pages}")
    doc.Close(False)
finally:
    word.Quit()
