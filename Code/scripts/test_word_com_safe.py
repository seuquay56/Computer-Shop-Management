import win32com.client, os, sys

def test_word_com():
    print("Initializing Word...")
    word = win32com.client.DispatchEx("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    try:
        doc_path = os.path.abspath("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx")
        print("Opening doc:", doc_path)
        doc = word.Documents.Open(doc_path, ReadOnly=True, ConfirmConversions=False)
        pages = doc.ComputeStatistics(2) # wdStatisticPages
        print("Successfully opened! Total pages:", pages)
        doc.Close(False)
    except Exception as e:
        print("Error:", e)
    finally:
        word.Quit()
        print("Word quit successfully.")

if __name__ == "__main__":
    test_word_com()
