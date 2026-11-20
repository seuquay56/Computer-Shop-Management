import docx

doc = docx.Document(r"Computer-Shop-Management\524H00057_524H0069_524H0052_updated.docx")

print("=== 1. Checking Headings for Deliverables & Numbering ===")
for i, p in enumerate(doc.paragraphs):
    if "Deliverables" in p.text:
        print(f"P[{i}] text: '{p.text}' | style: {p.style.name if p.style else None}")
    if any(k in p.text for k in ["CHAPTER 1", "CHAPTER 2", "CHAPTER 3", "CHAPTER 4", "CHAPTER 5", "CHAPTER 6", "CHAPTER 7"]):
        print(f"P[{i}] Chapter: '{p.text}' | pb_before: {p.paragraph_format.page_break_before}")

print("\n=== 2. Checking Page Breaks across Key Milestones ===")
milestones = [
    "DECLARATION OF AUTHORSHIP",
    "TEACHER'S ASSESSMENT AND CONFIRMATION",
    "ABSTRACT",
    "TABLE OF CONTENT",
    "LIST OF FIGURES",
    "LIST OF TABLES",
    "CHAPTER 1. INTRODUCTION",
    "CHAPTER 2. PROJECT MANAGEMENT PLAN",
    "CHAPTER 3. REQUIREMENT SPECIFICATIONS",
    "CHAPTER 4. ARCHITECTURE",
    "CHAPTER 5. DESIGN",
    "CHAPTER 6. TESTING",
    "CHAPTER 7. DEMO",
    "REFERENCES"
]
for i, p in enumerate(doc.paragraphs):
    txt = p.text.strip()
    for m in milestones:
        if txt == m:
            print(f"P[{i}]: '{txt}' | pb_before: {p.paragraph_format.page_break_before}")

print("\n=== 3. Checking List of Figures Samples ===")
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == "LIST OF FIGURES":
        for j in range(i+1, i+6):
            p_fig = doc.paragraphs[j]
            print(f"  P[{j}] style='{p_fig.style.name}': '{p_fig.text}'")
        break

print("\n=== 4. Checking List of Tables Samples ===")
for i, p in enumerate(doc.paragraphs):
    if p.text.strip() == "LIST OF TABLES":
        for j in range(i+1, i+6):
            p_tab = doc.paragraphs[j]
            print(f"  P[{j}] style='{p_tab.style.name}': '{p_tab.text}'")
        break
