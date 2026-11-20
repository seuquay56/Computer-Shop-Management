import docx

doc = docx.Document(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx")
print("=== TEMPLATE ACKNOWLEDGEMENT & DECLARATION ===")
for i in range(48, 83):
    p = doc.paragraphs[i]
    li = p.paragraph_format.left_indent.pt if p.paragraph_format.left_indent else 0
    ri = p.paragraph_format.right_indent.pt if p.paragraph_format.right_indent else 0
    fi = p.paragraph_format.first_line_indent.pt if p.paragraph_format.first_line_indent else 0
    align = p.alignment
    txt = p.text.strip()
    tabs = [t.position.pt for t in p.paragraph_format.tab_stops] if p.paragraph_format.tab_stops else []
    print(f"P[{i:02d}]: {txt[:35]!r:38} | align={str(align):10} | li={li:5.1f} fi={fi:5.1f} | tabs={tabs}")
