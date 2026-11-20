import zipfile
import re

docx_path = r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx"
with zipfile.ZipFile(docx_path, 'r') as z:
    content = z.read("word/document.xml").decode('utf-8')
    matches = re.finditer(r'<w:p [^>]*>.*?</w:p>', content)
    for m in matches:
        p_xml = m.group(0)
        # extract text
        t_matches = re.findall(r'<w:t[^>]*>(.*?)</w:t>', p_xml)
        text = ''.join(t_matches)
        if 'reference' in text.lower():
            print(f"P-XML: {repr(text)}")
