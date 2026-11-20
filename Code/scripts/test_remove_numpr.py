import zipfile
import tempfile
import os
import shutil
import xml.etree.ElementTree as ET

def remove_numpr_from_docx_styles(docx_path):
    temp_dir = tempfile.mkdtemp()
    temp_zip = os.path.join(temp_dir, "temp.zip")
    
    with zipfile.ZipFile(docx_path, 'r') as zin:
        zin.extractall(temp_dir)
        
    styles_path = os.path.join(temp_dir, "word", "styles.xml")
    if os.path.exists(styles_path):
        ET.register_namespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
        tree = ET.parse(styles_path)
        root = tree.getroot()
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        removed_count = 0
        for style in root.findall('w:style', ns):
            s_id = style.attrib.get(f"{{{ns['w']}}}styleId")
            if s_id and s_id.startswith('Heading'):
                pPr = style.find('w:pPr', ns)
                if pPr is not None:
                    numPr = pPr.find('w:numPr', ns)
                    if numPr is not None:
                        pPr.remove(numPr)
                        removed_count += 1
                        print(f"Removed numPr from {s_id}")
                        
        tree.write(styles_path, encoding='utf-8', xml_declaration=True)
        print(f"Successfully removed numPr from {removed_count} heading styles in styles.xml")
        
        # Repack zip
        with zipfile.ZipFile(temp_zip, 'w', zipfile.ZIP_DEFLATED) as zout:
            for root_dir, dirs, files in os.walk(temp_dir):
                for file in files:
                    if file == "temp.zip":
                        continue
                    full_path = os.path.join(root_dir, file)
                    arcname = os.path.relpath(full_path, temp_dir)
                    zout.write(full_path, arcname)
                    
        shutil.copy2(temp_zip, docx_path)
        print(f"Updated styles in: {docx_path}")
        
    shutil.rmtree(temp_dir)

if __name__ == "__main__":
    test_doc = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
    remove_numpr_from_docx_styles(test_doc)
