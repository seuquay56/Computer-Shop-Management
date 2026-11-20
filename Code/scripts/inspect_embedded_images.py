import zipfile

doc_path = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
with zipfile.ZipFile(doc_path) as z:
    media_files = [f for f in z.namelist() if f.startswith("word/media/")]
    print(f"Total media files in docx: {len(media_files)}")
    for mf in sorted(media_files):
        info = z.getinfo(mf)
        print(f"{mf} ({info.file_size} bytes)")
