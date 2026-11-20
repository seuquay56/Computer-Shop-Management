import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

DOC_TARGET = os.path.join(os.path.dirname(__file__), "..", "..", "524H0057_524H0069_524H0052_FinalReport.docx")
DIAG_DIR = os.path.join(os.path.dirname(__file__), "..", "docs", "diagrams")

def main():
    doc = docx.Document(DOC_TARGET)
    
    # Locate first reference paragraph (P463)
    p_ref = None
    for p in doc.paragraphs:
        if "Systems and software Quality Requirements and Evaluation" in p.text:
            p_ref = p
            break
            
    if p_ref is None:
        print("Could not find reference paragraph!")
        return
        
    print("Inserting Section 7.4 before REFERENCES...")
    
    # Section Heading
    p_h = p_ref.insert_paragraph_before("7.4 Full-Stack Application Verification (4 Core Modules)")
    p_h.style = doc.styles["Heading 2"]
    p_h.paragraph_format.space_before = Pt(14)
    p_h.paragraph_format.space_after = Pt(6)
    
    p_desc = p_ref.insert_paragraph_before(
        "To provide empirical verification of the operational system across all four core functional modules, "
        "high-fidelity application captures demonstrate the customer-facing storefront and the administrative "
        "management portal running against live PostgreSQL data and real-time payment webhooks."
    )
    p_desc.paragraph_format.space_after = Pt(10)
    
    # Figure 7.4: Storefront & Multi-Criteria Filtering
    img_74 = os.path.join(DIAG_DIR, "demo_storefront.png")
    if os.path.exists(img_74):
        p_img = p_ref.insert_paragraph_before()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.add_run().add_picture(img_74, width=Inches(6.4))
        p_cap = p_ref.insert_paragraph_before("Figure 7.4: Customer Storefront & Multi-Criteria Hardware Specification Filter (Module 2)")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
        p_ref.insert_paragraph_before("")

    # Figure 7.7: Order Tracking Stepper
    img_77 = os.path.join(DIAG_DIR, "demo_order_tracking.png")
    if os.path.exists(img_77):
        p_img = p_ref.insert_paragraph_before()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.add_run().add_picture(img_77, width=Inches(6.2))
        p_cap = p_ref.insert_paragraph_before("Figure 7.7: Real-Time Order Tracking Interface with Stage Progression Stepper (Module 3)")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
        p_ref.insert_paragraph_before("")

    # Figure 7.10: Admin Dashboard KPIs
    img_710 = os.path.join(DIAG_DIR, "demo_admin_dashboard.png")
    if os.path.exists(img_710):
        p_img = p_ref.insert_paragraph_before()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.add_run().add_picture(img_710, width=Inches(6.4))
        p_cap = p_ref.insert_paragraph_before("Figure 7.10: Executive Revenue Analytics Dashboard and Visitor Session Conversion Rate Metrics (Module 1)")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.style = doc.styles["Normal"]
        for r in p_cap.runs:
            r.font.bold = True
            r.font.name = "Arial"
            r.font.size = Pt(9.5)
        p_ref.insert_paragraph_before("")

    doc.save(DOC_TARGET)
    print("Successfully appended Section 7.4 to:", DOC_TARGET)

if __name__ == "__main__":
    main()
