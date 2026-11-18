import os
import docx
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_DOC = os.path.join(BASE_DIR, "524H00057_524H0069_524H0052.docx")
ALT_DOC = os.path.join(BASE_DIR, "524H00057_524H0069_524H0052_updated.docx")
DIAG_DIR = os.path.join(BASE_DIR, "Code", "docs", "diagrams")

MAPPING = {
    "Figure 5.3:": ("seq_auth_rbac.png", 6.3),
    "Figure 5.4:": ("seq_catalog_cart.png", 6.3),
    "Figure 5.5:": ("seq_checkout_sepay.png", 6.4),
    "Figure 5.6:": ("act_order_payment.png", 6.4),
}


def main():
    doc = docx.Document(SRC_DOC)
    replaced = 0
    for idx, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        for prefix, (fname, width) in MAPPING.items():
            if txt.startswith(prefix) and idx > 0:
                img_p = doc.paragraphs[idx - 1]
                img_p.clear()
                img_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                img_p.add_run().add_picture(os.path.join(DIAG_DIR, fname), width=Inches(width))
                replaced += 1
                print(f"Replaced image before {prefix} with {fname}")

    assert replaced == 4, f"Expected 4 replacements, got {replaced}"

    try:
        doc.save(SRC_DOC)
        print(f"Saved directly to: {SRC_DOC}")
    except PermissionError:
        doc.save(ALT_DOC)
        print(f"Original file is open in Word. Saved updated report to: {ALT_DOC}")


if __name__ == "__main__":
    main()
