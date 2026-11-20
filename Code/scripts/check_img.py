from PIL import Image

p = r"C:\Users\Huy\Desktop\SE Final Report\Computer-Shop-Management\Code\docs\diagrams\unit_test_results.png"
im = Image.open(p)
print("Image size:", im.size, "Format:", im.format)
