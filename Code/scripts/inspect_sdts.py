import zipfile
import xml.etree.ElementTree as ET

docx_path = r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx"
with zipfile.ZipFile(docx_path, 'r') as z:
    content = z.read("word/document.xml")
    root = ET.fromstring(content)
    sdts = root.findall('.//{http://schemas.openxmlformats.org/wordprocessingml/2006/main}sdt')
    print(f"Total sdt elements in document: {len(sdts)}")
    for i, sdt in enumerate(sdts):
        t_all = ''.join(sdt.itertext())
        print(f"sdt[{i}]: text[:150]={repr(t_all[:150])}")
