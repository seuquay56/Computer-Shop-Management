import docx
from docx.shared import Inches, Pt, RGBColor

template_path = r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx"
doc = docx.Document(template_path)

print("=" * 60)
print("1. SECTION MARGINS AND PAGE SETUP")
print("=" * 60)
for i, sec in enumerate(doc.sections):
    print(f"Section {i}:")
    print(f"  Page Width: {sec.page_width.inches:.2f} in ({sec.page_width.pt:.1f} pt)")
    print(f"  Page Height: {sec.page_height.inches:.2f} in ({sec.page_height.pt:.1f} pt)")
    print(f"  Top Margin: {sec.top_margin.inches:.2f} in ({sec.top_margin.pt:.1f} pt)")
    print(f"  Bottom Margin: {sec.bottom_margin.inches:.2f} in ({sec.bottom_margin.pt:.1f} pt)")
    print(f"  Left Margin: {sec.left_margin.inches:.2f} in ({sec.left_margin.pt:.1f} pt)")
    print(f"  Right Margin: {sec.right_margin.inches:.2f} in ({sec.right_margin.pt:.1f} pt)")
    print(f"  Header Distance: {sec.header_distance.inches:.2f} in")
    print(f"  Footer Distance: {sec.footer_distance.inches:.2f} in")
    print(f"  Different First Page: {sec.different_first_page_header_footer}")

print("\n" + "=" * 60)
print("2. STYLES INSPECTION (FONTS, SIZES, SPACING)")
print("=" * 60)
key_styles = ['Normal', 'Heading 1', 'Heading 2', 'Heading 3', 'Title', 'Subtitle', 'Caption', 'Body Text', 'TOC 1', 'TOC 2', 'TOC 3']
for name in key_styles:
    try:
        s = doc.styles[name]
        fn = s.font.name if s.font else None
        fs = s.font.size.pt if s.font and s.font.size else None
        b = s.font.bold if s.font else None
        i = s.font.italic if s.font else None
        col = s.font.color.rgb if s.font and s.font.color else None
        
        pf = s.paragraph_format
        sb = pf.space_before.pt if pf.space_before else None
        sa = pf.space_after.pt if pf.space_after else None
        ls = pf.line_spacing
        fl = pf.first_line_indent.pt if pf.first_line_indent else None
        align = pf.alignment
        print(f"Style '{name}':")
        print(f"  Font: {fn}, Size: {fs}pt, Bold: {b}, Italic: {i}, Color: {col}")
        print(f"  Spacing: Before={sb}pt, After={sa}pt, LineSpacing={ls}, FirstLine={fl}pt, Align={align}")
    except KeyError:
        print(f"Style '{name}': NOT FOUND")

print("\n" + "=" * 60)
print("3. SAMPLE PARAGRAPHS FROM TEMPLATE")
print("=" * 60)
for i, p in enumerate(doc.paragraphs[:40]):
    fn_set = set(r.font.name for r in p.runs if r.font and r.font.name)
    fs_set = set(r.font.size.pt for r in p.runs if r.font and r.font.size)
    sb = p.paragraph_format.space_before.pt if p.paragraph_format.space_before else None
    sa = p.paragraph_format.space_after.pt if p.paragraph_format.space_after else None
    ls = p.paragraph_format.line_spacing
    fl = p.paragraph_format.first_line_indent.pt if p.paragraph_format.first_line_indent else None
    pb = p.paragraph_format.page_break_before
    if p.text.strip():
        print(f"P[{i:2d}] style={p.style.name:15s} font={fn_set} size={fs_set} sp=(B:{sb}, A:{sa}, L:{ls}, FL:{fl}) pb={pb}: {repr(p.text[:60])}")
