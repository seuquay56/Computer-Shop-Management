import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z:
    xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(xml)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    
    begins = 0
    separates = 0
    ends = 0
    for elem in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar"):
        f_type = elem.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldCharType")
        if f_type == "begin": begins += 1
        elif f_type == "separate": separates += 1
        elif f_type == "end": ends += 1
    
    print(f"Updated: begins={begins}, separates={separates}, ends={ends}")

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052.docx") as z:
    xml = z.read("word/document.xml").decode("utf-8")
    root = ET.fromstring(xml)
    begins = 0
    separates = 0
    ends = 0
    for elem in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldChar"):
        f_type = elem.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fldCharType")
        if f_type == "begin": begins += 1
        elif f_type == "separate": separates += 1
        elif f_type == "end": ends += 1
    
    print(f"Original: begins={begins}, separates={separates}, ends={ends}")
