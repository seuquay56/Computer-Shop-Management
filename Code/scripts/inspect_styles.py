import docx
import zipfile
import xml.etree.ElementTree as ET

DOC_TARGET = r"Computer-Shop-Management\524H0057_524H0069_524H0052_FinalReport.docx"

with zipfile.ZipFile(DOC_TARGET, 'r') as z:
    styles_xml = z.read("word/styles.xml")
    root = ET.fromstring(styles_xml)
    
    for style in root.iter('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}style'):
        style_id = style.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}styleId')
        if style_id in ['Heading1', 'Heading2', 'Heading3', 'Heading4']:
            print("Style ID:", style_id)
            pPr = style.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}pPr')
            if pPr is not None:
                numPr = pPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numPr')
                if numPr is not None:
                    numId = numPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numId')
                    ilvl = numPr.find('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}ilvl')
                    print(f"  numPr found! numId={numId.attrib if numId is not None else None}, ilvl={ilvl.attrib if ilvl is not None else None}")
                else:
                    print("  No numPr in pPr")
