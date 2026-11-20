import docx

doc_template = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")

print("=" * 60)
print("1. COVER & SUB-COVER IN TEMPLATE (P[0] to P[48])")
print("=" * 60)
for i in range(49):
    p = doc_template.paragraphs[i]
    t = p.text
    xml = p._element.xml
    has_pic = 'blip' in xml
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else 0
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else 0
    ls = p.paragraph_format.line_spacing
    al = p.paragraph_format.alignment
    runs = [(r.text, r.font.name, r.font.size.pt if r.font.size else None, r.font.bold) for r in p.runs]
    print(f"P[{i:2d}] align={al} pic={has_pic} sp=(B:{sb:.1f}, A:{sa:.1f}, L:{ls}) text={repr(t)} runs={runs}")

print("\n" + "=" * 60)
print("2. ACKNOWLEDGEMENT & DECLARATION SIGNATURES IN TEMPLATE (P[48] to P[85])")
print("=" * 60)
for i in range(48, min(85, len(doc_template.paragraphs))):
    p = doc_template.paragraphs[i]
    t = p.text
    if t or any(k in t for k in ["Author", "city", "Khiem", "Thinh", "Huy", "Signature"]):
        print(f"P[{i:2d}] align={p.paragraph_format.alignment} left_ind={p.paragraph_format.left_indent} right_ind={p.paragraph_format.right_indent} text={repr(t)}")
        for r in p.runs:
            print(f"     run: text={repr(r.text)}, font={r.font.name}, size={r.font.size.pt if r.font.size else None}")

print("\n" + "=" * 60)
print("3. TABLE OF CONTENTS / FIGURES / TABLES IN TEMPLATE")
print("=" * 60)
for i in range(80, 160):
    if i < len(doc_template.paragraphs):
        p = doc_template.paragraphs[i]
        st = p.style.name if p.style else ""
        t = p.text.strip()
        xml = p._element.xml
        has_fld = 'fld' in xml or 'instrText' in xml
        if t or has_fld:
            print(f"P[{i:3d}] ({st}) has_fld={has_fld} text={repr(t[:60])}")
