import os

p = r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx"
print("File exists:", os.path.exists(p))
print("File size:", os.path.getsize(p))
try:
    with open(p, "a+b") as f:
        print("File is writable (not locked).")
except Exception as e:
    print("File open error:", e)
