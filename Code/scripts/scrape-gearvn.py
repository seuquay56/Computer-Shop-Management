import os
import re
import json
import html as html_lib
import urllib.request
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
IMG_DIR = os.path.join(BASE_DIR, "public", "images", "products")
OUT_JSON = os.path.join(BASE_DIR, "database", "gearvn_products.json")
os.makedirs(IMG_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
}

# Target ~20 products per category (10 more than original 10, with Keyboard and Mouse separated)
CATEGORY_SOURCES = [
    ("CPU", "Bộ vi xử lý trung tâm máy tính để bàn và máy trạm", [("cpu-bo-vi-xu-ly", 20)]),
    ("GPU", "Card màn hình đồ họa chuyên dụng Gaming và Render", [("vga-card-man-hinh", 20)]),
    ("Mainboard", "Bo mạch chủ máy tính các chuẩn kích thước ATX, Micro-ATX", [("mainboard-bo-mach-chu", 20)]),
    ("RAM", "Bộ nhớ truy xuất ngẫu nhiên DDR4, DDR5 tốc độ cao", [("ram-pc", 20)]),
    ("Storage", "Ổ đĩa cứng SSD M.2 NVMe và HDD lưu trữ", [("ssd-o-cung-the-ran", 20)]),
    ("Power Supply", "Nguồn máy tính chuẩn 80 Plus Bronze, Gold, Platinum", [("psu-nguon-may-tinh", 20)]),
    ("Laptop", "Laptop gaming, văn phòng và đồ họa chính hãng", [("laptop", 20)]),
    ("Keyboard", "Bàn phím cơ, bàn phím gaming và làm việc cao cấp", [("ban-phim-co", 15), ("ban-phim-may-tinh", 5)]),
    ("Mouse", "Chuột gaming, chuột không dây công thái học chính hãng", [("chuot-may-tinh", 20)]),
]


def fetch_text(url, timeout=15):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def get_collection_slugs(collection_handle, limit=40):
    ordered = []
    seen = set()
    for page in (1, 2, 3, 4):
        url = f"https://gearvn.com/collections/{collection_handle}?page={page}"
        try:
            page_html = fetch_text(url)
            raw_slugs = re.findall(r'href="/products/([a-z0-9\-]+)"', page_html)
            for s in raw_slugs:
                if s not in seen and len(s) > 4 and not s.isdigit():
                    seen.add(s)
                    ordered.append(s)
                    if len(ordered) >= limit:
                        return ordered
        except Exception:
            pass
    return ordered


def clean_description(raw_text):
    if not raw_text:
        return ""
    text = html_lib.unescape(str(raw_text))
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:420]


def infer_specs(category, title, desc):
    combined = f"{title} {desc}"
    upper = combined.upper()
    specs = {}

    if category == "CPU":
        m_sock = re.search(r"\b(LGA\s?1851|LGA\s?1700|LGA\s?1200|AM5|AM4)\b", upper)
        if m_sock:
            specs["Socket"] = m_sock.group(1).replace(" ", "")
        elif "RYZEN 7 7" in upper or "RYZEN 9 7" in upper or "RYZEN 5 7" in upper or "9800X" in upper or "9700X" in upper or "9950X" in upper or "9600X" in upper or "7800X3D" in upper:
            specs["Socket"] = "AM5"
        elif "RYZEN" in upper:
            specs["Socket"] = "AM4"
        elif "ULTRA" in upper:
            specs["Socket"] = "LGA1851"
        elif "I3-1" in upper or "I5-1" in upper or "I7-1" in upper or "I9-1" in upper:
            specs["Socket"] = "LGA1700"

        m_cores = re.search(r"(\d+\s*(?:nhân|cores?)(?:\s*/?\s*\d+\s*(?:luồng|threads?))?)", combined, re.I)
        if m_cores:
            specs["Cores"] = m_cores.group(1).strip()
        m_ghz = re.search(r"(\d+(?:\.\d+)?\s*GHz)", combined, re.I)
        if m_ghz:
            specs["Max Boost Clock"] = m_ghz.group(1).strip()

    elif category == "GPU":
        m_vram = re.search(r"\b(\d+\s*GB(?:\s*GDDR\dX?)?)\b", upper)
        if m_vram:
            specs["VRAM"] = re.sub(r"\s+", " ", m_vram.group(1)).replace(" GB", "GB")
        if "RTX 5090" in upper or "RTX 4090" in upper:
            specs["Recommended PSU"] = "850W"
        elif "RTX 5080" in upper or "RTX 4080" in upper or "5070 TI" in upper or "4070 TI" in upper:
            specs["Recommended PSU"] = "750W"
        elif "RTX 5070" in upper or "RTX 4070" in upper or "5060 TI" in upper or "4060 TI" in upper or "RX 7800" in upper:
            specs["Recommended PSU"] = "650W"
        else:
            specs["Recommended PSU"] = "550W"
        m_pcie = re.search(r"(PCIE\s*\d\.\d(?:\s*X\d+)?)", upper)
        specs["Interface"] = m_pcie.group(1) if m_pcie else "PCIe 4.0 x16"

    elif category == "Mainboard":
        m_sock = re.search(r"\b(LGA\s?1851|LGA\s?1700|LGA\s?1200|AM5|AM4)\b", upper)
        if m_sock:
            specs["Socket"] = m_sock.group(1).replace(" ", "")
        elif any(k in upper for k in ["B650", "B850", "X670", "X870", "A620"]):
            specs["Socket"] = "AM5"
        elif any(k in upper for k in ["B550", "A520", "B450", "X570"]):
            specs["Socket"] = "AM4"
        elif any(k in upper for k in ["Z890", "B860"]):
            specs["Socket"] = "LGA1851"
        elif any(k in upper for k in ["Z790", "B760", "H610", "B660", "Z690"]):
            specs["Socket"] = "LGA1700"

        if "DDR5" in upper:
            specs["RAM Support"] = "DDR5"
        elif "DDR4" in upper:
            specs["RAM Support"] = "DDR4"
        elif specs.get("Socket") in ("AM5", "LGA1851"):
            specs["RAM Support"] = "DDR5"
        else:
            specs["RAM Support"] = "DDR4"

        m_chip = re.search(r"\b(Z890|B860|Z790|B760|H610|B660|X870E?|B850|B650E?|A620|B550|A520)\b", upper)
        if m_chip:
            specs["Chipset"] = m_chip.group(1)
        if "M-ATX" in upper or "MICRO-ATX" in upper or "MATX" in upper:
            specs["Form Factor"] = "Micro-ATX"
        elif "ITX" in upper:
            specs["Form Factor"] = "Mini-ITX"
        else:
            specs["Form Factor"] = "ATX"

    elif category == "RAM":
        specs["RAM Type"] = "DDR5" if "DDR5" in upper else "DDR4"
        m_cap = re.search(r"\b(\d+\s*GB(?:\s*\(\d+X\d+GB\))?)\b", upper)
        if m_cap:
            specs["Capacity"] = re.sub(r"\s+", " ", m_cap.group(1))
        m_bus = re.search(r"\b(\d{4})\s*M?HZ\b", upper)
        if m_bus:
            specs["Bus Speed"] = f"{m_bus.group(1)} MHz"

    elif category == "Storage":
        m_cap = re.search(r"\b(\d+\s*(?:TB|GB))\b", upper)
        if m_cap:
            specs["Capacity"] = re.sub(r"\s+", "", m_cap.group(1))
        if "GEN5" in upper or "PCIE 5" in upper:
            specs["Interface"] = "M.2 NVMe PCIe 5.0"
        elif "NVME" in upper or "M.2" in upper or "PCIE" in upper:
            specs["Interface"] = "M.2 NVMe PCIe 4.0"
        else:
            specs["Interface"] = "SATA III 2.5 inch"

    elif category == "Power Supply":
        m_w = re.search(r"\b(\d{3,4})\s*W\b", upper)
        if m_w:
            specs["Wattage"] = f"{m_w.group(1)}W"
        m_eff = re.search(r"(80\s*PLUS\s*(?:TITANIUM|PLATINUM|GOLD|SILVER|BRONZE|WHITE))", upper)
        if m_eff:
            specs["Efficiency"] = m_eff.group(1).title()
        elif "GOLD" in upper:
            specs["Efficiency"] = "80 Plus Gold"
        elif "BRONZE" in upper:
            specs["Efficiency"] = "80 Plus Bronze"

    elif category == "Laptop":
        m_cpu = re.search(r"(Intel Core (?:Ultra )?i?\d[\-\s]\w+|AMD Ryzen \d \w+)", combined, re.I)
        if m_cpu:
            specs["CPU"] = m_cpu.group(1).strip()
        m_gpu = re.search(r"(RTX\s*\d{4}(?:\s*Ti)?|Radeon\s*\w+)", combined, re.I)
        if m_gpu:
            specs["GPU"] = m_gpu.group(1).strip()
        m_ram = re.search(r"\b(8GB|16GB|32GB|64GB)\b", upper)
        if m_ram:
            specs["RAM"] = m_ram.group(1)
        m_disp = re.search(r"(\d{2}(?:\.\d)?\s*(?:inch|\")\s*(?:OLED|IPS|FHD|QHD|2K|3K)?(?:\s*\d{2,3}Hz)?)", combined, re.I)
        if m_disp:
            specs["Display"] = m_disp.group(1).strip()

    elif category == "Keyboard":
        if any(w in upper for w in ["KHONG DAY", "KHÔNG DÂY", "WIRELESS", "BLUETOOTH", "3 MODE"]):
            specs["Connection"] = "Wireless / Bluetooth"
        else:
            specs["Connection"] = "Wired USB Type-C"
        if "RED SWITCH" in upper or "LINEAR" in upper:
            specs["Switch Type"] = "Linear Red Switch"
        elif "BLUE SWITCH" in upper or "CLICKY" in upper:
            specs["Switch Type"] = "Clicky Blue Switch"
        elif "BROWN SWITCH" in upper or "TACTILE" in upper:
            specs["Switch Type"] = "Tactile Brown Switch"
        else:
            specs["Switch Type"] = "Mechanical Custom Switch"
        if any(w in upper for w in ["FULLSIZE", "104", "108"]):
            specs["Layout"] = "Fullsize 104 Keys"
        elif "87" in upper or "TKL" in upper:
            specs["Layout"] = "Tenkeyless (TKL)"
        else:
            specs["Layout"] = "Compact 75% / 80%"

    elif category == "Mouse":
        if any(w in upper for w in ["KHONG DAY", "KHÔNG DÂY", "WIRELESS", "BLUETOOTH", "2.4GHZ"]):
            specs["Connection"] = "Wireless 2.4GHz / BT"
        else:
            specs["Connection"] = "Wired USB"
        m_dpi = re.search(r"(\d{1,2}(?:\.\d{3})?|\d{4,5})\s*DPI", upper)
        if m_dpi:
            specs["DPI"] = f"{m_dpi.group(1)} DPI"
        else:
            specs["DPI"] = "8.000 - 26.000 DPI"
        specs["Sensor"] = "Optical Gaming Sensor"

    elif category == "Accessories":
        if "KHÔNG DÂY" in upper or "WIRELESS" in upper or "BLUETOOTH" in upper or "3 MODE" in upper:
            specs["Connection"] = "Wireless / Bluetooth"
        else:
            specs["Connection"] = "Wired USB"
        if "BÀN PHÍM" in upper or "KEYBOARD" in upper:
            specs["Type"] = "Mechanical Keyboard"
        elif "CHUỘT" in upper or "MOUSE" in upper:
            specs["Type"] = "Gaming Mouse"

    return [{"specName": k, "specValue": v[:95]} for k, v in specs.items() if v]


def download_and_save_image(img_url, slug):
    if not img_url:
        return None
    if img_url.startswith("//"):
        img_url = "https:" + img_url
    out_name = f"{slug[:65]}.jpg"
    out_path = os.path.join(IMG_DIR, out_name)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 2000:
        return f"/images/products/{out_name}"

    req = urllib.request.Request(img_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        raw = resp.read()

    img = Image.open(BytesIO(raw))
    if img.mode in ("RGBA", "LA", "P"):
        bg = Image.new("RGB", img.size, (255, 255, 255))
        if img.mode == "P":
            img = img.convert("RGBA")
        bg.paste(img, mask=img.split()[-1] if img.mode in ("RGBA", "LA") else None)
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    img.thumbnail((600, 600), Image.Resampling.LANCZOS)
    img.save(out_path, format="JPEG", quality=84, optimize=True)
    return f"/images/products/{out_name}"


def scrape_product(category, slug):
    url = f"https://gearvn.com/products/{slug}"
    page_html = fetch_text(url)
    lds = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', page_html, re.S)
    prod_ld = None
    for blk in lds:
        try:
            obj = json.loads(blk.strip())
            if isinstance(obj, dict) and obj.get("@type") == "Product":
                prod_ld = obj
                break
        except Exception:
            continue

    if not prod_ld:
        return None

    name = html_lib.unescape(str(prod_ld.get("name") or "")).strip()
    if not name:
        return None

    brand_obj = prod_ld.get("brand")
    brand = ""
    if isinstance(brand_obj, dict):
        brand = str(brand_obj.get("name") or "").strip()
    elif isinstance(brand_obj, str):
        brand = brand_obj.strip()
    if not brand or brand.lower() in ("khác", "other", "gearvn"):
        brand = name.split()[0] if name else "Generic"
    brand = brand[:48]

    offers = prod_ld.get("offers")
    if isinstance(offers, list) and offers:
        offers = offers[0]
    price = 0
    if isinstance(offers, dict):
        try:
            price = int(float(offers.get("price") or 0))
        except Exception:
            price = 0

    if price < 100000:
        return None

    images = prod_ld.get("image")
    img_url = None
    if isinstance(images, list) and images:
        img_url = images[0]
    elif isinstance(images, str):
        img_url = images

    local_img = None
    if img_url:
        try:
            local_img = download_and_save_image(img_url, slug)
        except Exception:
            local_img = None
    if not local_img:
        return None

    raw_sku = str(prod_ld.get("sku") or "").strip()
    sku = re.sub(r"[^A-Za-z0-9\-_]", "", raw_sku).upper()[:44]
    if not sku or len(sku) < 3:
        sku = f"GVN-{category[:3].upper()}-{slug[:18].upper()}"

    desc = clean_description(prod_ld.get("description") or f"{name} chính hãng bảo hành đầy đủ.")
    specs = infer_specs(category, name, desc)

    return {
        "category": category,
        "slug": slug,
        "name": name[:148],
        "brand": brand,
        "price": price,
        "sku": sku,
        "imageUrl": local_img,
        "description": desc,
        "specs": specs,
    }


def main():
    all_products = []
    seen_skus = set()
    seen_names = set()

    for cat_name, cat_desc, sources in CATEGORY_SOURCES:
        cat_items = []
        for col_handle, target_count in sources:
            print(f"[{cat_name}] Fetching collection: {col_handle} (target {target_count})...")
            try:
                slugs = get_collection_slugs(col_handle, limit=target_count * 3)
            except Exception as e:
                print(f"  WARN: Could not fetch collection {col_handle}: {e}")
                continue

            found_here = 0
            with ThreadPoolExecutor(max_workers=6) as ex:
                futures = [ex.submit(scrape_product, cat_name, s) for s in slugs]
                for fut in as_completed(futures):
                    if found_here >= target_count:
                        continue
                    try:
                        item = fut.result()
                    except Exception:
                        item = None
                    if not item:
                        continue
                    key_name = item["name"].lower()
                    if key_name in seen_names:
                        continue
                    # Ensure globally unique SKU
                    base_sku = item["sku"]
                    sku = base_sku
                    suffix = 2
                    while sku in seen_skus:
                        sku = f"{base_sku[:42]}-{suffix}"
                        suffix += 1
                    item["sku"] = sku
                    seen_skus.add(sku)
                    seen_names.add(key_name)
                    cat_items.append(item)
                    found_here += 1

        print(f"  -> Collected {len(cat_items)} products for {cat_name}")
        all_products.extend(cat_items)

    # Assign realistic demo stock quantities (including some Low-Stock & Out-of-Stock for Module 4 alerts)
    for idx, prod in enumerate(all_products):
        if idx % 17 == 15:
            stock, threshold = 0, 5   # Out of stock (CRITICAL alert)
        elif idx % 9 == 4:
            stock, threshold = 2, 5   # Low stock (WARNING alert)
        elif idx % 9 == 7:
            stock, threshold = 4, 5   # Low stock (WARNING alert)
        else:
            stock, threshold = 8 + (idx * 3) % 24, 5
        prod["stockQuantity"] = stock
        prod["lowStockThreshold"] = threshold

    payload = {
        "source": "gearvn.com",
        "categories": [{"name": c[0], "description": c[1]} for c in CATEGORY_SOURCES],
        "totalProducts": len(all_products),
        "products": all_products,
    }
    with open(OUT_JSON, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)

    print(f"\nDONE! Saved {len(all_products)} products to {OUT_JSON}")
    print(f"Images saved in {IMG_DIR}")


if __name__ == "__main__":
    main()
