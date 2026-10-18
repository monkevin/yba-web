"""
Đọc file NỘI DUNG.docx của từng sự kiện trong thư mục ảnh, xuất ra JSON để
script nhập sự kiện dùng lại.

    python scripts/doc-noi-dung-docx.py "SỰ KIỆN YBA CHỢ LỚN 2026"

Ghi ra `soat/su-kien-2026.json`. Chỉ ĐỌC, không sửa gì trong thư mục ảnh.
"""

import json
import os
import re
import sys
import zipfile

ANH = (".jpg", ".jpeg", ".png", ".webp")


def doc_docx(duong_dan: str) -> str:
    """Rút chữ từ .docx — mỗi <w:p> là một dòng."""
    try:
        with zipfile.ZipFile(duong_dan) as z:
            xml = z.read("word/document.xml").decode("utf-8")
    except Exception:
        return ""
    xml = re.sub(r"</w:p>", "\n", xml)
    xml = re.sub(r"<w:br[^>]*/>", "\n", xml)
    txt = re.sub(r"<[^>]+>", "", xml)
    for a, b in [("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                 ("&#39;", "'"), ("&quot;", '"'), ("&apos;", "'")]:
        txt = txt.replace(a, b)
    txt = re.sub(r"[ \t]+", " ", txt)
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    return txt.strip()


def tim_ngay(text: str):
    """Tìm ngày trong bài. Trả về (ngay, thang, nam) hoặc None."""
    # "ngày 24/09/2025", "24/9/2025", "ngày 12/3"
    m = re.search(r"ngày\s+(\d{1,2})[/\-.](\d{1,2})(?:[/\-.](\d{2,4}))?", text, re.I)
    if not m:
        m = re.search(r"\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})\b", text)
    if m:
        d, mo, y = m.group(1), m.group(2), m.group(3)
        return int(d), int(mo), int(y) if y else None
    # "ngày 15 tháng 4 năm 2026"
    m = re.search(r"ngày\s+(\d{1,2})\s+tháng\s+(\d{1,2})(?:\s+năm\s+(\d{4}))?", text, re.I)
    if m:
        return int(m.group(1)), int(m.group(2)), int(m.group(3)) if m.group(3) else None
    return None


# Chỗ bắt đầu phần kể chuyện, không còn là tên địa điểm nữa.
# So bằng chữ thường nên các mốc ở đây phải viết thường hết.
CAT_TAI = [
    " nơi ", " với sự", " đã ", " mở ra", " đánh dấu", " chuẩn bị",
    " – một", " - một", ", tọa đàm", " diễn ra", " quy tụ", " thu hút",
]
# Có mấy từ này thì đoạn vừa lấy là câu văn hoặc tên chương trình,
# không phải địa điểm
LOAI_BO = re.compile(
    r"\b(đã|nơi|quy tụ|diễn ra|bùng nổ|chính thức|họp mặt|tọa đàm|chương trình"
    r"|hội viên \d|hội nghị)\b",
    re.I,
)


def tim_dia_diem(text: str):
    """
    Lấy cụm sau chữ 'tại'. Văn bản của Ban Truyền thông viết theo lối kể
    chuyện nên sau 'tại' thường dính luôn cả câu — phải cắt ở chỗ bắt đầu
    kể chuyện, và bỏ hẳn nếu cắt xong vẫn còn giống câu văn hơn là địa chỉ.
    """
    m = re.search(r"\btại\s+(.{6,160})", text)
    if not m:
        return None
    s = m.group(1)

    # Dấu chấm kết câu = chấm + khoảng trắng (không cắt nhầm "TP.HCM")
    s = re.split(r"\.\s|\n", s)[0]
    for c in CAT_TAI:
        i = s.lower().find(c)
        if i > 0:
            s = s[:i]

    # Giữ tối đa hai cụm ngăn bởi dấu phẩy — đủ cho "đường X, quận Y"
    cum = [c.strip() for c in s.split(",") if c.strip()]
    s = ", ".join(cum[:2])

    s = s.strip(" ,;–-.")
    if not s or len(s) > 80 or LOAI_BO.search(s):
        return None
    return s


def main():
    goc = sys.argv[1] if len(sys.argv) > 1 else "SỰ KIỆN YBA CHỢ LỚN 2026"
    ra = []
    for ten in sorted(os.listdir(goc)):
        thu_muc = os.path.join(goc, ten)
        if not os.path.isdir(thu_muc):
            continue

        noi_dung = ""
        tai_tro = ""
        anh = []
        for f in sorted(os.listdir(thu_muc)):
            duong = os.path.join(thu_muc, f)
            low = f.lower()
            if low.endswith(ANH):
                anh.append(duong)
            elif low.endswith(".docx") and "nội dung" in low:
                noi_dung = doc_docx(duong)
            elif low.endswith(".docx") and "tài trợ" in low:
                tai_tro = doc_docx(duong)

        ngay = tim_ngay(noi_dung)
        ra.append({
            "ten": ten,
            "thuMuc": thu_muc,
            "noiDung": noi_dung,
            "taiTro": tai_tro,
            "anh": anh,
            "ngayDoan": {"ngay": ngay[0], "thang": ngay[1], "nam": ngay[2]} if ngay else None,
            "diaDiem": tim_dia_diem(noi_dung),
        })

    os.makedirs("soat", exist_ok=True)
    with open("soat/su-kien-2026.json", "w", encoding="utf-8") as f:
        json.dump(ra, f, ensure_ascii=False, indent=2)

    for m in ra:
        n = m["ngayDoan"]
        print(f"{len(m['anh']):3d} ảnh · {len(m['noiDung']):5d} chữ · "
              f"{(str(n['ngay'])+'/'+str(n['thang'])+'/'+str(n['nam'] or '?')) if n else 'KHÔNG RÕ NGÀY':14s} · {m['ten'][:56]}")
    print(f"\n{len(ra)} sự kiện → soat/su-kien-2026.json")


if __name__ == "__main__":
    main()
