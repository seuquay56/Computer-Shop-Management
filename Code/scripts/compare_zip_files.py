import zipfile

with zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052.docx") as z1, \
     zipfile.ZipFile("Computer-Shop-Management/524H00057_524H0069_524H0052_updated.docx") as z2:
    names1 = set(z1.namelist())
    names2 = set(z2.namelist())
    print("Files in orig but not updated:", names1 - names2)
    print("Files in updated but not orig:", names2 - names1)
