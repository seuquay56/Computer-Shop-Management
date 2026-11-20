import docx

doc = docx.Document(r'Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx')
for idx, t in enumerate(doc.tables):
    prev_p_text = ''
    p_elem = t._element.getprevious()
    while p_elem is not None:
        if p_elem.tag.endswith('p'):
            p_text = ''.join(p_elem.itertext()).strip()
            if p_text:
                prev_p_text = p_text
                break
        p_elem = p_elem.getprevious()
    first_row = [c.text.strip().replace('\n', ' ') for c in t.rows[0].cells]
    print(f'Table {idx}: caption="{prev_p_text[:45]}" | header={first_row[:3]}')
