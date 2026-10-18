# -*- coding: utf-8 -*-
"""Dựng ảnh chia sẻ mạng xã hội (Open Graph) 1200x630 cho ybacholon.vn.

Nền theo tông ĐỎ SON của web (lớp .san-do trong globals.css): đỏ huyết dụ
#7c0717 chuyển dần về navy sẫm ở góc dưới phải — người bấm link trên
Zalo/Facebook thấy ảnh này rồi mở ra trang chủ cùng một tông, không còn
cảm giác "hai web khác nhau". Chạy lại khi đổi slogan hoặc nhận diện.
"""
from PIL import Image, ImageDraw, ImageFont
import os, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

PUB = r"E:\Claude 07 2026 Mon Amie AI\yba-web\public"

# Bảng màu — trùng khớp globals.css
DO_SON = (124, 7, 23)       # son-800 #7c0717 — nền chính
DO_SAM = (86, 5, 16)        # son-900 #560510
NAVY_DAM = (27, 39, 77)     # navy-800 #1b274d — vùng góc dưới (chất YBA)
DO_TUOI = (200, 16, 46)     # đỏ #c8102e — vạch nhấn
HONG_NHAT = (247, 201, 205) # son-200 — chữ phụ
VANG_KIM = (227, 185, 74)   # vang-400 — điểm cuối dải chữ lửa

W, H = 1200, 630

# ── Nền chuyển sắc chéo: đỏ son -> đỏ sẫm -> navy ở góc dưới phải ──
im = Image.new("RGB", (W, H), DO_SON)
px = im.load()
for y in range(H):
    for x in range(0, W, 2):  # bước 2 điểm cho nhanh, mắt không thấy khác
        # t chạy theo đường chéo từ trái-trên (0) tới phải-dưới (1)
        t = (x / W * 0.55 + y / H * 0.45)
        if t < 0.55:
            k = t / 0.55
            mau = tuple(int(DO_SON[i] * (1 - k) + DO_SAM[i] * k) for i in range(3))
        else:
            k = (t - 0.55) / 0.45
            mau = tuple(int(DO_SAM[i] * (1 - k) + NAVY_DAM[i] * k) for i in range(3))
        px[x, y] = mau
        if x + 1 < W:
            px[x + 1, y] = mau

d = ImageDraw.Draw(im)

# Lưới kỹ thuật mảnh — như lớp .luoi-ky-thuat trên web, rất nhạt.
# LƯU Ý: ImageDraw trên ảnh RGB BỎ QUA kênh alpha trong fill — muốn nét mờ
# phải vẽ lên một lớp RGBA riêng rồi ghép đè, đừng vẽ thẳng.
LUOI = 56
lop_luoi = Image.new("RGBA", (W, H), (0, 0, 0, 0))
dl = ImageDraw.Draw(lop_luoi)
for gx in range(0, W, LUOI):
    dl.line([gx, 0, gx, H], fill=(255, 255, 255, 14), width=1)
for gy in range(0, H, LUOI):
    dl.line([0, gy, W, gy], fill=(255, 255, 255, 14), width=1)
im = Image.alpha_composite(im.convert("RGBA"), lop_luoi).convert("RGB")
d = ImageDraw.Draw(im)

# Vạch đỏ tươi mảnh trên cùng — đúng nhận diện của Hội
d.rectangle([0, 0, W, 10], fill=DO_TUOI)

# Logo
logo = Image.open(os.path.join(PUB, "logo-yba-cholon.png")).convert("RGBA")
logo = logo.resize((190, 190), Image.LANCZOS)
im.paste(logo, (90, 110), logo)


def font(size, bold=True):
    for ten in (
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ):
        if os.path.exists(ten):
            return ImageFont.truetype(ten, size)
    return ImageFont.load_default()


x = 330
d.text((x, 120), "YBA CHỢ LỚN", font=font(78), fill=(255, 255, 255))
d.text((x, 215), "Chi hội Doanh nhân trẻ Chợ Lớn", font=font(38, False), fill=HONG_NHAT)
d.line([x, 285, x + 90, 285], fill=VANG_KIM, width=6)
d.text((x, 315), "Dấn thân – Đổi mới – Đột phá – Vươn tầm", font=font(34), fill=VANG_KIM)
d.text(
    (x, 375),
    "Kết nối · Giao thương · Cùng nhau phát triển",
    font=font(30, False),
    fill=(255, 235, 238),
)

# Chân ảnh
d.line([90, 500, 1110, 500], fill=(180, 80, 90), width=2)
d.text((90, 528), "ybacholon.vn", font=font(34), fill=(255, 255, 255))
d.text(
    (1110, 532),
    "Trực thuộc Hội Doanh nhân trẻ TP.HCM",
    font=font(26, False),
    fill=HONG_NHAT,
    anchor="ra",
)

im.save(os.path.join(PUB, "og-image.png"), optimize=True)
print("Đã tạo:", os.path.join(PUB, "og-image.png"), im.size)
