"""Dựng ảnh banner trang chủ từ một ảnh sự kiện của Chi hội.

  python scripts/tao-banner.py [đường-dẫn-ảnh-nguồn]

Mặc định lấy ảnh ra mắt Ban Chủ nhiệm nhiệm kỳ XII (YEP 2024). Ảnh được cắt về
khổ ngang 21:9, làm tối nhẹ và phủ một lớp navy để chữ trắng đè lên vẫn đọc rõ.
Muốn đổi banner: chạy lại script với ảnh khác.
"""
from PIL import Image, ImageEnhance
import os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(GOC, "public")
MAC_DINH = os.path.join(PUB, "su-kien", "yep-2024-2024", "01.jpg")
NAVY = (27, 39, 77)

nguon = sys.argv[1] if len(sys.argv) > 1 else MAC_DINH
if not os.path.exists(nguon):
    print(f"Không thấy ảnh nguồn: {nguon}")
    sys.exit(1)

im = Image.open(nguon).convert("RGB")

# Cắt về khổ 21:9, lấy phần giữa theo chiều dọc hơi lệch lên (mặt người)
RONG, CAO = 2000, 860
ty_le = max(RONG / im.width, CAO / im.height)
im = im.resize((round(im.width * ty_le), round(im.height * ty_le)), Image.LANCZOS)

trai = (im.width - RONG) // 2
tren = max(0, round((im.height - CAO) * 0.35))
im = im.crop((trai, tren, trai + RONG, tren + CAO))

# Làm tối và giảm bão hoà để chữ trắng nổi lên
im = ImageEnhance.Brightness(im).enhance(0.62)
im = ImageEnhance.Color(im).enhance(0.75)

# Phủ một lớp navy mỏng cho ăn nhận diện Hội
phu = Image.new("RGB", im.size, NAVY)
im = Image.blend(im, phu, 0.35)

dich = os.path.join(PUB, "banner-trang-chu.jpg")
im.save(dich, "JPEG", quality=84, optimize=True, progressive=True)
print(f"Đã tạo {dich} — {im.size[0]}x{im.size[1]}, {os.path.getsize(dich) // 1024} KB")
print(f"Nguồn: {nguon}")
