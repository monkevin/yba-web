"""Cắt ảnh chân dung nhân sự các ban từ Profile YBA Chợ Lớn.

Mỗi trang là một ảnh đã bẹt. Phía trên trang là dải navy có logo + tên ban, phía
dưới là nền trắng chứa các thẻ ảnh chân dung xếp thành hàng ngang.
Cách làm: CHỈ xét phần thân trắng (bỏ dải navy), tìm cụm cột không trắng.
"""
import fitz, numpy as np, os, sys, io
from PIL import Image
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

CAC_NGUON = [
    r"E:\Claude 07 2026 Mon Amie AI\yba-web\PROFILE YBA CHỢ LỚN.pdf",
    r"C:\Users\Dell\Downloads\PROFILE YBA CHỢ LỚN.pdf",
]
SRC = next((p for p in CAC_NGUON if os.path.exists(p)), None)
if SRC is None:
    sys.exit("Không tìm thấy file PROFILE YBA CHỢ LỚN.pdf")

OUT = r"E:\Claude 07 2026 Mon Amie AI\yba-web\public\ban-chu-nhiem"
os.makedirs(OUT, exist_ok=True)

# Render ở DPI cao: mỗi trang có 3–5 chân dung xếp ngang nên ở 200 dpi mỗi ảnh
# chỉ còn ~150px, phóng lên thẻ 300px là mờ hẳn. 560 dpi cho ra ~500–700px.
DPI = 560
CANH_TOI_DA = (900, 1200)

PAGES = {
    14: ("chu-nhiem", 1),
    13: ("co-van", 5),
    15: ("hoi-vien", 3),
    18: ("xttm", 3),
    20: ("su-kien", 3),
    16: ("truyen-thong", 3),
    17: ("dao-tao", 3),
    19: ("tai-tro", 3),
    21: ("doi-ngoai", 4),
}

TRANG = 700  # tổng R+G+B coi là "trắng"


def tim_day_navy(a):
    """Trả về hàng y đầu tiên mà từ đó trở xuống là nền trắng (hết dải navy)."""
    h = a.shape[0]
    ty_le_trang = (a.sum(axis=2) > TRANG).mean(axis=1)
    for y in range(int(0.10 * h), int(0.60 * h)):
        if ty_le_trang[y] > 0.9:
            return y
    return int(0.25 * h)


doc = fitz.open(SRC)
for pno, (prefix, mong_doi) in PAGES.items():
    pix = doc[pno - 1].get_pixmap(dpi=DPI)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    a = np.asarray(im).astype(int)
    h, w, _ = a.shape

    y_dau = tim_day_navy(a) + int(0.01 * h)
    than = a[y_dau: int(0.97 * h), :, :]

    # Cột "có ảnh" = có đủ nhiều pixel không trắng trong phần thân
    khong_trang = (than.sum(axis=2) < TRANG).mean(axis=0) > 0.25

    cum, dau = [], None
    for x in range(w):
        if khong_trang[x] and dau is None:
            dau = x
        elif not khong_trang[x] and dau is not None:
            if x - dau > w * 0.05:
                cum.append((dau, x))
            dau = None
    if dau is not None and w - dau > w * 0.05:
        cum.append((dau, w))

    ten_file = []
    for i, (x0, x1) in enumerate(cum):
        cot = than[:, x0:x1, :]
        hang = (cot.sum(axis=2) < TRANG).mean(axis=1) > 0.5
        ys = np.nonzero(hang)[0]
        if len(ys) == 0:
            continue
        y0 = y_dau + ys.min()
        y1 = y_dau + ys.max()
        crop = im.crop((x0, y0, x1, y1))
        cw, ch = crop.size
        muc_tieu = int(cw * 4 / 3)
        if ch > muc_tieu:
            crop = crop.crop((0, 0, cw, muc_tieu))
        crop.thumbnail(CANH_TOI_DA, Image.LANCZOS)
        ten = f"{prefix}-{i + 1}.jpg"
        crop.convert("RGB").save(os.path.join(OUT, ten), quality=90)
        ten_file.append(f"{ten} {crop.size[0]}x{crop.size[1]}")

    dau_hieu = "OK " if len(ten_file) == mong_doi else "!! "
    print(f"{dau_hieu}trang {pno:>2} {prefix:<14} {len(ten_file)}/{mong_doi} ảnh")

print("\nThư mục:", OUT)
