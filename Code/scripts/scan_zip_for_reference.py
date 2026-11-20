import zipfile
import re

docx_path = r"Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx"
with zipfile.ZipFile(docx_path, 'r') as z:
    for filename in z.namelist():
        if filename.endswith('.xml'):
            content = z.read(filename).decode('utf-8')
            matches = re.findall(r'.{0,50}reference.{0,50}', content, flags=re.IGNORECASE)
            if matches:
                print(f"=== {filename} ({len(matches)} matches) ===")
                for m in matches[:10]:
                    print("  ", repr(m.strip()))
