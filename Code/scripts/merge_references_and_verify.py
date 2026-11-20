import os
import sys
import shutil
import time
import zipfile
import xml.etree.ElementTree as ET
import docx
from docx.shared import Pt
from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn
import win32com.client

DOCX_PATH = r'Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx'
PDF_PATH = r'Computer-Shop-Management\524H00057_524H0069_524H0052_updated.pdf'

# 1. Inspect and merge the two references lists in document.xml
temp_zip = DOCX_PATH + ".temp.zip"
with zipfile.ZipFile(DOCX_PATH, 'r') as zin, zipfile.ZipFile(temp_zip, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        data = zin.read(item.filename)
        if item.filename == "word/document.xml":
            root = ET.fromstring(data)
            body = root.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}body')
            
            # Find the sdt element
            sdt_idx = None
            for idx, child in enumerate(body):
                if child.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sdt':
                    sdt_idx = idx
                    break
            
            if sdt_idx is not None:
                sdt = body[sdt_idx]
                sdtContent = sdt.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sdtContent')
                if sdtContent is not None:
                    # Set pageBreakBefore on REFERENCES heading
                    ref_heading = sdtContent.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p')
                    if ref_heading is not None:
                        pPr = ref_heading.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
                        if pPr is None:
                            pPr = ET.SubElement(ref_heading, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
                        pBdr = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pageBreakBefore')
                        if pBdr is None:
                            ET.SubElement(pPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pageBreakBefore')
                    
                    # Move trailing 5 citation paragraphs from body into sdtContent
                    # Find trailing citation paragraphs
                    trailing_paras = []
                    to_remove = []
                    for idx in range(sdt_idx + 1, len(body)):
                        child = body[idx]
                        if child.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p':
                            texts = [t.text for t in child.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t') if t.text]
                            full_txt = ''.join(texts).strip()
                            if full_txt:
                                trailing_paras.append(child)
                            to_remove.append(child)
                        elif child.tag == '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sectPr':
                            break
                    
                    for p in to_remove:
                        body.remove(p)
                    
                    for p in trailing_paras:
                        # Ensure pStyle is Bibliography and Times New Roman
                        pPr = p.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
                        if pPr is None:
                            pPr = ET.SubElement(p, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
                        pStyle = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pStyle')
                        if pStyle is None:
                            pStyle = ET.SubElement(pPr, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pStyle')
                        pStyle.set('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', 'Bibliography')
                        sdtContent.append(p)
                        
            data = ET.tostring(root, encoding='utf-8')
        zout.writestr(item, data)

shutil.move(temp_zip, DOCX_PATH)
print("Merged references into single sdtContent successfully.")

# 2. Update TOC in docx to ensure 7.1, 7.2, 7.3 are 61 and REFERENCES is 62
doc = docx.Document(DOCX_PATH)
for p in doc.paragraphs:
    txt = p.text.strip()
    if not txt: continue
    if '\t' in txt:
        parts = txt.split('\t')
        title = parts[0].strip()
        if title == '7.1 Database':
            p.text = f"{title}\t61"
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Pt(439.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        elif title == '7.2 Source Code':
            p.text = f"{title}\t61"
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Pt(439.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        elif title == '7.3 Testing':
            p.text = f"{title}\t61"
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Pt(439.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        elif title == 'REFERENCES':
            p.text = f"{title}\t62"
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Pt(439.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)

doc.save(DOCX_PATH)
print("Saved TOC updates to docx.")

# 3. Export to PDF with Word COM
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
t0 = time.time()
try:
    doc_abs = os.path.abspath(DOCX_PATH)
    pdf_abs = os.path.abspath(PDF_PATH)
    wdoc = word.Documents.Open(doc_abs)
    total_pages = wdoc.ComputeStatistics(2)
    print(f"Word opened doc in {time.time()-t0:.2f}s! Total pages: {total_pages}")
    wdoc.SaveAs(pdf_abs, FileFormat=17)
    print("Exported PDF successfully!")
    wdoc.Close(False)
finally:
    word.Quit()
