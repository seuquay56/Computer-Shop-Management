import docx
from docx.oxml import parse_xml

doc = docx.Document()
h1 = doc.styles['Heading 1']
pPr = h1._element.get_or_add_pPr()
numPr = parse_xml('<w:numPr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:ilvl w:val="0"/><w:numId w:val="5"/></w:numPr>')
pPr.append(numPr)
print('Before remove:', pPr.xml)

for np in pPr.findall('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}numPr'):
    pPr.remove(np)
print('After remove:', pPr.xml)
doc.save('test_clean.docx')
print('Successfully saved!')
