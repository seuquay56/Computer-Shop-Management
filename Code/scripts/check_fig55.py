import docx

doc_a = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052.docx")
doc_b = docx.Document(r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")

def find_blip_for_fig(doc, fig_title):
    for i, p in enumerate(doc.paragraphs):
        if fig_title in p.text:
            # check previous paragraph for blip r:embed
            p_prev = doc.paragraphs[i-1]
            blips = p_prev._element.xpath('.//@r:embed')
            return i, blips
    return None, None

print("File A Fig 5.5:", find_blip_for_fig(doc_a, "Figure 5.5"))
print("File B Fig 5.5:", find_blip_for_fig(doc_b, "Figure 5.5"))
