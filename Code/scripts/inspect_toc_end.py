import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")
for i in range(130, 142):
    p = doc.paragraphs[i]
    xml_str = p._element.xml
    has_end = 'fldCharType="end"' in xml_str
    print(f"P[{i:3d}] has_end={has_end} text={repr(p.text)}")
