import docx

doc = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")
found = 0
for i, p in enumerate(doc.paragraphs):
    for node in p._element.xpath(".//*[local-name()='instrText' or local-name()='fldChar' or local-name()='fldSimple']"):
        tag = node.tag.split("}")[-1]
        print(f"P[{i}] tag={tag} text={repr(node.text)} attrib={node.attrib}")
        found += 1

print(f"Total field nodes found in paragraphs: {found}")

found_tables = 0
for t_idx, t in enumerate(doc.tables):
    for r_idx, row in enumerate(t.rows):
        for c_idx, cell in enumerate(row.cells):
            for node in cell._element.xpath(".//*[local-name()='instrText' or local-name()='fldChar' or local-name()='fldSimple']"):
                tag = node.tag.split("}")[-1]
                print(f"T[{t_idx}][{r_idx},{c_idx}] tag={tag} text={repr(node.text)} attrib={node.attrib}")
                found_tables += 1
print(f"Total field nodes found in tables: {found_tables}")
