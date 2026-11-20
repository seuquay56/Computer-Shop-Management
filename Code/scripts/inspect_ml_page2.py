import docx

doc = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")
print("Page 2 in Midterm Template.docx:")
for i in range(24, 48):
    p = doc.paragraphs[i]
    has_pic = 'blip' in p._element.xml
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else None
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else None
    ls = p.paragraph_format.line_spacing
    txt = p.text.strip()
    print(f"P[{i:2d}] pic={has_pic} sp=(B:{sb}, A:{sa}, L:{ls}): {repr(txt)}")
