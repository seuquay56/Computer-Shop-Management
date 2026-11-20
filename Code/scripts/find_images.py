import os

root_dir = r"C:\Users\Huy\Desktop\SE Final Report"
for root, dirs, files in os.walk(root_dir):
    if "node_modules" in root or "public\\images\\products" in root:
        continue
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg', '.svg')):
            full_path = os.path.join(root, f)
            size = os.path.getsize(full_path)
            print(f"{full_path} ({size} bytes)")
