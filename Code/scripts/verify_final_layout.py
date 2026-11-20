import docx

doc = docx.Document("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

print("=== CHECKING COVER (P0 - P46) ===")
for i in range(48):
    p = doc.paragraphs[i]
    t = p.text.strip()
    pb = "PB" if p.paragraph_format.page_break_before else ""
    img = "IMG" if "w:drawing" in p._p.xml else ""
    if t or pb or img:
        print(f"P[{i:02d}]: {t[:35]!r:38} | align={str(p.alignment):12} | {pb:2} {img:3}")

print("\n=== CHECKING SIGNATURES IN ACK (P47 - P66) ===")
for i in range(47, 67):
    p = doc.paragraphs[i]
    t = p.text.strip()
    li = p.paragraph_format.left_indent.pt if p.paragraph_format.left_indent else 0
    if t:
        print(f"P[{i:02d}]: {t[:35]!r:38} | align={str(p.alignment):12} | li={li:5.1f}")

print("\n=== CHECKING SIGNATURES IN DEC (P67 - P84) ===")
for i in range(67, 85):
    p = doc.paragraphs[i]
    t = p.text.strip()
    li = p.paragraph_format.left_indent.pt if p.paragraph_format.left_indent else 0
    if t:
        print(f"P[{i:02d}]: {t[:35]!r:38} | align={str(p.alignment):12} | li={li:5.1f}")

print("\n=== CHECKING TOC SAMPLES (P88 - P100) ===")
for i in range(88, 102):
    p = doc.paragraphs[i]
    t = p.text.strip()
    li = p.paragraph_format.left_indent.pt if p.paragraph_format.left_indent else 0
    tabs = [(tb.position.pt, tb.leader) for tb in p.paragraph_format.tab_stops] if p.paragraph_format.tab_stops else []
    print(f"P[{i:03d}]: {p.style.name:8} | {t[:35]!r:38} | li={li:4.1f} | tabs={tabs}")

print("\n=== CHECKING LOF SAMPLES (P137 - P145) ===")
for i in range(137, 145):
    p = doc.paragraphs[i]
    t = p.text.strip()
    li = p.paragraph_format.left_indent.pt if p.paragraph_format.left_indent else 0
    fi = p.paragraph_format.first_line_indent.pt if p.paragraph_format.first_line_indent else 0
    print(f"P[{i:03d}]: {t[:40]!r:42} | li={li:4.1f} fi={fi:5.1f}")

print("\n=== CHECKING LOT SAMPLES (P152 - P160) ===")
for i in range(152, 160):
    p = doc.paragraphs[i]
    t = p.text.strip()
    li = p.paragraph_format.left_indent.pt if p.paragraph_format.left_indent else 0
    fi = p.paragraph_format.first_line_indent.pt if p.paragraph_format.first_line_indent else 0
    print(f"P[{i:03d}]: {t[:40]!r:42} | li={li:4.1f} fi={fi:5.1f}")
