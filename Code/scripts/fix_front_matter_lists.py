import os
import docx
from docx.shared import Pt, RGBColor
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

DOC_TARGET = os.path.join(os.path.dirname(__file__), "..", "..", "524H0057_524H0069_524H0052_FinalReport.docx")

def main():
    doc = docx.Document(DOC_TARGET)
    print("Fixing List of Figures and List of Tables order...")

    # Locate LIST OF FIGURES, LIST OF TABLES, and CHAPTER 1
    p_lof = None
    p_lot = None
    p_ch1 = None

    for i, p in enumerate(doc.paragraphs):
        txt = p.text.strip()
        if txt == "LIST OF FIGURES":
            p_lof = p
        elif txt == "LIST OF TABLES":
            p_lot = p
        elif txt == "CHAPTER 1. INTRODUCTION":
            p_ch1 = p
            break

    if p_lof is None or p_lot is None or p_ch1 is None:
        print("Could not find headings!")
        return

    # Delete everything between p_lof and p_lot
    curr = p_lof._element.getnext()
    while curr is not None and curr != p_lot._element:
        nxt = curr.getnext()
        curr.getparent().remove(curr)
        curr = nxt

    # Delete everything between p_lot and p_ch1
    curr = p_lot._element.getnext()
    while curr is not None and curr != p_ch1._element:
        nxt = curr.getnext()
        curr.getparent().remove(curr)
        curr = nxt

    full_figures = [
        ("Figure 2.1: GitHub Repository Commit History and Continuous Contribution Breakdown", "17"),
        ("Figure 3.1: Overall System Use Case Diagram for Computer Shop Management Software", "19"),
        ("Figure 3.2: Module 2 Use Case Diagram – Hardware Products, Specs and Variants Management Subsystem", "20"),
        ("Figure 3.3: Module 4 Use Case Diagram – Order Fulfillment and Inventory Management Subsystem", "20"),
        ("Figure 4.1: System Architecture Data Flow Model", "21"),
        ("Figure 5.1: Entity Relationship Diagram (ERD) for Computer Shop Management Software", "23"),
        ("Figure 5.2: Comprehensive Static Model – UML Class Diagram for Computer Shop Management Software", "27"),
        ("Figure 5.3: UML Sequence Diagram — User Authentication & JWT/RBAC Authorization (UC-01, UC-03)", "28"),
        ("Figure 5.4: UML Sequence Diagram — Multi-Criteria Hardware Specs Filtering & Cart Compatibility Validation (UC-08, UC-09)", "29"),
        ("Figure 5.5: UML Sequence Diagram — Online Checkout via SePay VietQR, Webhook Callback & Atomic Stock Deduction (UC-11, UC-12)", "30"),
        ("Figure 5.6: UML Activity Diagram (Swimlanes) — End-to-End Cashless Order Checkout & Webhook Reconciliation", "31"),
        ("Figure 7.1: Physical Relational Database Schema and Core Hardware Tables in PostgreSQL (pgAdmin)", "33"),
        ("Figure 7.2: MVC Backend Architecture Directory Structure and RESTful Routing Pipeline", "33"),
        ("Figure 7.3: Automated Unit & Integration Test Suite Execution Output (52 Tests Passed, 81.50% Line Coverage)", "34"),
        ("Figure 7.4: Customer Storefront & Multi-Criteria Hardware Specification Filter (Module 2)", "34"),
        ("Figure 7.5: Shopping Cart with Real-Time Stock Validation and PC Component Compatibility Guard (Module 3)", "35"),
        ("Figure 7.6: Cashless Checkout via Dynamic SePay VietQR Modal and Live Payment Webhook (Module 3)", "35"),
        ("Figure 7.7: Real-Time Order Tracking Interface with Stage Progression Stepper (Module 3)", "36"),
        ("Figure 7.8: Admin Portal — Hardware Products, SKUs, and Specification Attribute Matrix Management (Module 2)", "36"),
        ("Figure 7.9: Admin Inventory Management — Batch Restock (Inward Receipt) and Automated Low-Stock Alert Feed (Module 4)", "37"),
        ("Figure 7.10: Executive Revenue Analytics Dashboard and Visitor Session Conversion Rate Metrics (Module 1)", "37")
    ]

    full_tables = [
        ("Table 1.1: Terms, Acronyms, and Abbreviations", "10"),
        ("Table 2.1: Project Work Breakdown and Team Responsibilities", "12"),
        ("Table 2.2: Project Risk Analysis and Mitigation Strategies", "14"),
        ("Table 2.3: Project Deliverables and Schedule", "15"),
        ("Table 3.1: System Stakeholder Profiles and Interaction Matrix", "19"),
        ("Table 3.2: Textual Specification for User Authentication and JWT Session Issuance (UC-01)", "20"),
        ("Table 3.3: Textual Specification for Register Customer Account (UC-02)", "20"),
        ("Table 3.4: Textual Specification for Manage System User Accounts and RBAC Permissions (UC-03)", "21"),
        ("Table 3.5: Textual Specification for View Sales and Revenue Dashboard (UC-04)", "21"),
        ("Table 3.6: Textual Specification for Manage Hardware Categories (UC-05)", "22"),
        ("Table 3.7: Textual Specification for Manage Computer Hardware Products (UC-06)", "22"),
        ("Table 3.8: Textual Specification for Configure Technical Specifications and Product Variants (UC-07)", "23"),
        ("Table 3.9: Textual Specification for Multi-Criteria Hardware Search and Specification Filtering (UC-08)", "23"),
        ("Table 3.10: Textual Specification for Manage Shopping Cart and Real-Time Stock Validation (UC-09 & UC-10)", "24"),
        ("Table 3.11: Textual Specification for Cashless Online Checkout via VietQR / ZaloPay (UC-11)", "24"),
        ("Table 3.12: Textual Specification for Order Fulfillment Lifecycle and Automated Stock Deduction (UC-12 & UC-13)", "25"),
        ("Table 3.13: Textual Specification for Batch Inward Stock Receipt (UC-14)", "25"),
        ("Table 3.14: Textual Specification for Low-Stock Threshold Alert and Inventory Monitoring (UC-15)", "26"),
        ("Table 3.15: Functional Requirements Specification Matrix", "26"),
        ("Table 3.16: Non-Functional Requirements Specification (ISO/IEC 25010)", "26"),
        ("Table 4.1: Technology Stack and Tools Used", "27"),
        ("Table 5.1: Data Dictionary — Roles", "28"),
        ("Table 5.2: Data Dictionary — Users", "28"),
        ("Table 5.3: Data Dictionary — Categories", "28"),
        ("Table 5.4: Data Dictionary — Products", "29"),
        ("Table 5.5: Data Dictionary — Product_Variants", "29"),
        ("Table 5.6: Data Dictionary — Specs", "29"),
        ("Table 5.7: Data Dictionary — Product_Specs", "30"),
        ("Table 5.8: Data Dictionary — Website_Visits", "30"),
        ("Table 5.9: Data Dictionary — Orders", "30"),
        ("Table 5.10: Data Dictionary — Order_Items", "31"),
        ("Table 5.11: Data Dictionary — Inventory_Transactions", "31"),
        ("Table 5.12: Class Model Design Specification and Association Semantics", "31"),
        ("Table 5.13: Dynamic Interaction Summary, Endpoints, and Transactional Guarantees", "32"),
        ("Table 5.14: Requirements Traceability Matrix", "32"),
        ("Table 6.1: Requirements-Based System-Level Test Cases (TC-01 through TC-30)", "33"),
        ("Table 6.2: Bidirectional Traceability Matrix (Use Cases <-> Functional Requirements <-> Test Cases)", "33"),
        ("Table 6.3: Boundary Value Analysis (BVA) Test Cases (UT-13 through UT-20)", "34"),
        ("Table 6.4: SePay Webhook Payment Confirmation Decision Table", "34"),
        ("Table 6.5: Quantitative Test Suite Quality Assessment Metrics", "34")
    ]

    # Insert Figures in forward order before p_lot
    for title, page in full_figures:
        p_item = p_lot.insert_paragraph_before(f"{title}\t{page}")
        p_item.style = doc.styles["Normal"]
        for r in p_item.runs:
            r.font.name = "Arial"
            r.font.size = Pt(10)
    p_lot.insert_paragraph_before("")

    # Insert Tables in forward order before p_ch1
    for title, page in full_tables:
        p_item = p_ch1.insert_paragraph_before(f"{title}\t{page}")
        p_item.style = doc.styles["Normal"]
        for r in p_item.runs:
            r.font.name = "Arial"
            r.font.size = Pt(10)
    p_ch1.insert_paragraph_before("")

    doc.save(DOC_TARGET)
    print("SUCCESS: Front matter List of Figures (21) and List of Tables (40) updated in forward order!")

if __name__ == "__main__":
    main()
