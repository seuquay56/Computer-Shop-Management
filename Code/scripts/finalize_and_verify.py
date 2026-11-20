import os
import sys
import shutil
import time
import docx
from docx.shared import Pt
from docx.enum.text import WD_TAB_ALIGNMENT, WD_TAB_LEADER
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls, qn
import win32com.client

SRC = 'test_clean_no_orphan.docx'
DEST = r'Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx'
PDF_OUT = r'Computer-Shop-Management\524H00057_524H0069_524H0052_updated.pdf'

print("Copying pristine base...")
shutil.copyfile(SRC, DEST)
doc = docx.Document(DEST)

# 1. Page 1: add 3 spacers before HO CHI MINH CITY, 2026
def create_spacer_p():
    return parse_xml(
        f'<w:p {nsdecls("w")}>'
        f'<w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>'
        f'<w:r><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="24"/></w:rPr><w:t></w:t></w:r>'
        f'</w:p>'
    )

for i in range(25):
    if doc.paragraphs[i].text.strip() == 'HO CHI MINH CITY, 2026':
        for _ in range(3):
            doc.paragraphs[i]._p.addprevious(create_spacer_p())
        break

# 2. Fix signature blocks ind on Page 3 and 4
for i in [64, 65, 66, 82, 83, 84]:
    if i < len(doc.paragraphs):
        p = doc.paragraphs[i]
        ind = p._p.pPr.find(qn('w:ind')) if p._p.pPr is not None else None
        if ind is not None:
            if qn('w:right') in ind.attrib:
                del ind.attrib[qn('w:right')]
            ind.set(qn('w:left'), '3600')

# 3. Synchronize TOC, LOF, LOT page numbers
EXACT_TOC_PAGES = {
    'LIST OF FIGURES': '4',
    'LIST OF TABLES': '5',
    'CHAPTER 1. INTRODUCTION': '6',
    '1.1 Purpose and Scope': '6',
    '1.2 Product Overview': '6',
    '1.3 Structure of the Document': '8',
    '1.4 Terms, Acronyms, and Abbreviations': '9',
    'CHAPTER 2. PROJECT MANAGEMENT PLAN': '11',
    '2.1 Project Organization': '11',
    '2.2 Lifecycle Model Used': '12',
    '2.3 Risk Analysis': '12',
    '2.4 Hardware and Software Resource Requirements': '14',
    '2.5 Deliverables and Schedule': '14',
    '2.6 Monitoring, Reporting, and Controlling Mechanisms': '15',
    '2.7 Professional Standards': '16',
    '2.8 Configuration Management Evidence': '16',
    '2.9 Impact of the Project on Individuals and Organizations': '16',
    'CHAPTER 3. REQUIREMENT SPECIFICATIONS': '18',
    '3.1 Stakeholders for the System': '18',
    '3.2 Use Case Model': '19',
    '3.2.1 Graphical Use Case Model': '19',
    '3.2.2 Textual Description for Each Use Case': '22',
    '3.3 Functional Requirements': '31',
    '3.4 Non-Functional Requirements': '34',
    'CHAPTER 4. ARCHITECTURE': '36',
    '4.1 Architectural Style(s) Used': '36',
    '4.2 Architectural Model': '36',
    '4.3 Technology, Software, and Hardware Used': '37',
    '4.4 Rationale for Your Architectural Style and Model': '38',
    'CHAPTER 5. DESIGN': '39',
    '5.1 Database Design': '39',
    '5.1.1 Entity Relationship Diagram (ERD)': '39',
    '5.1.2 Relational Data Model': '39',
    '5.1.3 Data Dictionary': '40',
    '5.2 Static Model – Class Diagrams': '44',
    '5.3 Dynamic Model – Sequence Diagrams': '46',
    '5.4 Rationale for Detailed Design Model': '51',
    '5.5 Traceability from Requirements to Detailed Design Model': '51',
    'CHAPTER 6. TEST PLAN': '54',
    '6.1 Requirements/Specifications-Based System Level Test Cases': '54',
    '6.2 Traceability of Test Cases to Use Cases': '57',
    '6.3 Techniques Used for Test Generation': '58',
    '6.4 Assessment of the Goodness of Your Testsuite': '59',
    'CHAPTER 7. DEMO': '61',
    '7.1 Database': '61',
    '7.2 Source Code': '61',
    '7.3 Testing': '62',
    'REFERENCES': '62'
}

EXACT_LOF_PAGES = {
    'Figure 4.1: System Architecture Data Flow Model': '37',
    'Figure 5.1: Entity Relationship Diagram (ERD) for Computer Shop Management Software': '39',
    'Figure 7.1: Physical Relational Database Tables and Sample Computer Hardware Records': '61',
    'Figure 7.2: MVC Project Structure and Running Application Interfaces': '61',
    'Figure 7.3: Automated Unit Test Execution Output': '62'
}

EXACT_LOT_PAGES = {
    'Table 1.1: Terms, Acronyms, and Abbreviations': '9',
    'Table 2.1: Work contribution': '11',
    'Table 2.2: Project Risk Analysis': '13',
    'Table 2.3: Project Deliverables and Schedule': '14',
    'Table 4.1: Technology Stack and Tools Used': '37',
    'Table 5.1: Roles': '40',
    'Table 5.2: Users': '40',
    'Table 5.3: Categories': '41',
    'Table 5.4: Products': '41',
    'Table 5.5: Product_Variants': '41',
    'Table 5.6: Specs': '42',
    'Table 5.7: Product_Specs': '42',
    'Table 5.8: Orders': '43',
    'Table 5.9: Order_Items': '43',
    'Table 5.10: Requirements Traceability Matrix': '51'
}

for p in doc.paragraphs:
    txt = p.text.strip()
    if not txt: continue
    if '\t' in txt:
        parts = txt.split('\t')
        title = parts[0].strip()
        if title in EXACT_TOC_PAGES:
            p.text = f"{title}\t{EXACT_TOC_PAGES[title]}"
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Pt(439.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        elif title in EXACT_LOF_PAGES:
            p.text = f"{title}\t{EXACT_LOF_PAGES[title]}"
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Pt(439.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)
        elif title in EXACT_LOT_PAGES:
            p.text = f"{title}\t{EXACT_LOT_PAGES[title]}"
            p.paragraph_format.tab_stops.clear_all()
            p.paragraph_format.tab_stops.add_tab_stop(Pt(439.0), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.DOTS)

doc.save(DEST)
print(f"Saved {DEST} successfully!")

# Word COM verification
word = win32com.client.Dispatch('Word.Application')
word.Visible = False
word.DisplayAlerts = 0
t0 = time.time()
try:
    doc_abs = os.path.abspath(DEST)
    pdf_abs = os.path.abspath(PDF_OUT)
    print("Opening in Word COM...")
    wdoc = word.Documents.Open(doc_abs)
    total_pages = wdoc.ComputeStatistics(2)
    print(f"Opened in {time.time()-t0:.2f}s! Total pages: {total_pages}")
    wdoc.SaveAs(pdf_abs, FileFormat=17)
    print(f"Successfully exported {pdf_abs}!")
    wdoc.Close(False)
except Exception as e:
    print(f"Word COM Error: {e}")
finally:
    word.Quit()
print("All done!")
