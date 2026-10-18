"""Tối ưu ảnh trong public/ cho web tải nhanh.

  python scripts/toi-uu-anh.py

Ảnh chụp sự kiện lấy thẳng từ máy ảnh / Facebook thường rất nặng so với nhu cầu
hiển thị. Script thu nhỏ ảnh rộng quá 1600px và nén lại ở mức chất lượng 82 —
mắt thường không phân biệt được nhưng dung lượng giảm mạnh.

Chạy lại nhiều lần an toàn: ảnh đã đạt chuẩn sẽ được bỏ qua.
Cần: pip install pillow
"""
from PIL import Image
import os, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

GOC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public")
RONG_TOI_DA = 1600
CHAT_LUONG = 82
# Chỉ đụng vào ảnh chụp; bỏ qua logo và ảnh nhận diện đã chỉnh sẵn
BO_QUA = {"logo-yba-cholon.png", "og-image.png"}

truoc = sau = 0
da_sua = 0
tong = 0

for thu_muc, _, files in os.walk(GOC):
    for ten in files:
        if not ten.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        if ten in BO_QUA:
            continue

        duong_dan = os.path.join(thu_muc, ten)
        cu = os.path.getsize(duong_dan)
        tong += 1
        truoc += cu

        try:
            im = Image.open(duong_dan)
        except Exception as e:
            print(f"  bỏ qua {ten}: {e}")
            sau += cu
            continue

        can_sua = im.width > RONG_TOI_DA or cu > 250 * 1024
        if not can_sua:
            sau += cu
            continue

        if im.width > RONG_TOI_DA:
            ty_le = RONG_TOI_DA / im.width
            im = im.resize((RONG_TOI_DA, round(im.height * ty_le)), Image.LANCZOS)

        if ten.lower().endswith(".png") and im.mode in ("RGBA", "LA", "P"):
            # Giữ nguyên PNG có nền trong suốt
            im.save(duong_dan, optimize=True)
        else:
            im.convert("RGB").save(
                duong_dan, "JPEG", quality=CHAT_LUONG, optimize=True, progressive=True
            )

        moi = os.path.getsize(duong_dan)
        sau += moi
        da_sua += 1

print(f"Đã xử lý {da_sua}/{tong} ảnh.")
print(f"Trước: {truoc / 1024 / 1024:.1f} MB → Sau: {sau / 1024 / 1024:.1f} MB")
if truoc:
    print(f"Giảm {100 - sau * 100 / truoc:.0f}%")
