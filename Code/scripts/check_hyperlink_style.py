import zipfile

with zipfile.ZipFile(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx") as z:
    xml_content = z.read("word/styles.xml").decode("utf-8")
    if 'w:styleId="Hyperlink"' in xml_content:
        idx = xml_content.find('w:styleId="Hyperlink"')
        print("=== TEMPLATE Hyperlink style ===")
        print(xml_content[max(0, idx-50):idx+500])
    else:
        print("Template does NOT have Hyperlink style!")

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z:
    xml_content = z.read("word/styles.xml").decode("utf-8")
    if 'w:styleId="Hyperlink"' in xml_content:
        idx = xml_content.find('w:styleId="Hyperlink"')
        print("=== UPDATED Hyperlink style ===")
        print(xml_content[max(0, idx-50):idx+500])
    else:
        print("Updated docx does NOT have Hyperlink style!")
