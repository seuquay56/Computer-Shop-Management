import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile(r"C:\Users\Huy\Desktop\ML Midterm\data\Midterm Template.docx") as z:
    xml_content = z.read("word/styles.xml").decode("utf-8")
    root = ET.fromstring(xml_content)
    ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    for style in root.findall("w:style", ns):
        style_id = style.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}styleId", "")
        if "toc" in style_id.lower() or "figure" in style_id.lower() or "table" in style_id.lower():
            print("-----------------------------------------")
            print(f"Style ID: {style_id}")
            pPr = style.find("w:pPr", ns)
            if pPr is not None:
                ind = pPr.find("w:ind", ns)
                if ind is not None:
                    print(f"  ind: {ind.attrib}")
                tabs = pPr.find("w:tabs", ns)
                if tabs is not None:
                    for tab in tabs.findall("w:tab", ns):
                        print(f"  tab: {tab.attrib}")
            rPr = style.find("w:rPr", ns)
            if rPr is not None:
                sz = rPr.find("w:sz", ns)
                b = rPr.find("w:b", ns)
                rFonts = rPr.find("w:rFonts", ns)
                print(f"  rPr: sz={sz.attrib if sz is not None else None} b={b.attrib if b is not None else None} rFonts={rFonts.attrib if rFonts is not None else None}")
