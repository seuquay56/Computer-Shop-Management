import os
import shutil

DIAG_DIR = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\Code\docs\diagrams"
UPLOAD_DIR = r"C:\Users\Huy\.gemini\antigravity\brain\fa47158c-cf78-4092-8c9a-27d1ab665eea\.user_uploaded"

# 1. demo_storefront.png is already in DIAG_DIR
# 2. demo_order_tracking.png from media_1795037992680_abff7df6.jpg
shutil.copy(os.path.join(UPLOAD_DIR, "media_1795037992680_abff7df6.jpg"), os.path.join(DIAG_DIR, "demo_order_tracking.png"))

# 3. demo_admin_dashboard.png from rId15.png
if os.path.exists(os.path.join(DIAG_DIR, "rId15.png")):
    shutil.copy(os.path.join(DIAG_DIR, "rId15.png"), os.path.join(DIAG_DIR, "demo_admin_dashboard.png"))

print("Assembled demo screenshots in:", DIAG_DIR)
