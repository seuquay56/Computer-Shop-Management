import win32com.client
import os

print("Starting Word export...")
word = win32com.client.Dispatch("Word.Application")
word.Visible = False
word.DisplayAlerts = 0
try:
    doc_path = os.path.abspath(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
    pdf_path = os.path.abspath(r"Computer-Shop-Management\debug_export_v4.pdf")
    print("Opening docx...")
    doc = word.Documents.Open(doc_path, ReadOnly=True)
    print("Exporting PDF...")
    doc.SaveAs(pdf_path, FileFormat=17)
    pages = doc.ComputeStatistics(2)
    print(f"EXPORT SUCCESS! Total pages: {pages}")
    doc.Close(False)
except Exception as e:
    print("Error:", e)
finally:
    word.Quit()
    print("Word closed.")
