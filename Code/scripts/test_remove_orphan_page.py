import docx
import win32com.client, os, time

doc = docx.Document("test_clean_formatted.docx")

# P[96] is empty between sectPr and EXECUTIVE SUMMARY
# Let's remove P[96] and set page_break_before = False on EXECUTIVE SUMMARY
p_exec = None
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == "EXECUTIVE SUMMARY":
        p_exec = p
        p_idx = i
        break

print(f"EXECUTIVE SUMMARY found at P[{p_idx}]")
p_exec.paragraph_format.page_break_before = False

# Check if previous paragraph is empty
p_prev = doc.paragraphs[p_idx - 1]
if not p_prev.text.strip() and "sectPr" not in p_prev._p.xml:
    print(f"Removing empty paragraph P[{p_idx - 1}] before EXECUTIVE SUMMARY")
    p_prev._p.getparent().remove(p_prev._p)

doc.save("test_clean_no_orphan.docx")

# Re-export to PDF
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
try:
    doc_path = os.path.abspath('test_clean_no_orphan.docx')
    pdf_path = os.path.abspath('Computer-Shop-Management/test_clean_no_orphan.pdf')
    d = word.Documents.Open(doc_path)
    d.SaveAs(pdf_path, FileFormat=17)
    pages = d.ComputeStatistics(2)
    print(f"EXPORT SUCCESS! Pages: {pages}")
    d.Close(False)
finally:
    word.Quit()
