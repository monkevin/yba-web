# -*- coding: utf-8 -*-
"""Tạo file Excel mẫu cho thư ký Chi hội khai báo một chương trình.

File gồm 4 sheet:
  1. Thông tin chương trình  — tên, nội dung, ý nghĩa, địa điểm, tổng kinh phí
  2. Ban tổ chức             — trưởng ban, phó ban, ban chỉ đạo, thành viên
  3. Người tham gia          — danh sách hội viên và khách dự
  4. Nhà tài trợ             — hiện kim, hiện vật, mức tài trợ

Thư ký điền xong tải lên /quan-tri/noi-dung/su-kien để hệ thống chấm điểm
hoạt động của hội viên và Ban Chủ nhiệm.

    python scripts/tao-mau-su-kien.py
"""
import os
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

RA = r"E:\Claude 07 2026 Mon Amie AI\yba-web\public\mau"
os.makedirs(RA, exist_ok=True)
TEP = os.path.join(RA, "mau-bao-cao-su-kien-yba-cho-lon.xlsx")

NAVY = "1B274D"
DO = "C0392B"
NHAT = "F3F5FB"

dam = Font(bold=True, color="FFFFFF", size=11)
tieude_font = Font(bold=True, color=NAVY, size=14)
nen_navy = PatternFill("solid", fgColor=NAVY)
nen_nhat = PatternFill("solid", fgColor=NHAT)
vien = Border(*[Side(style="thin", color="D5DBEA")] * 4)
giua = Alignment(horizontal="center", vertical="center", wrap_text=True)
trai = Alignment(horizontal="left", vertical="center", wrap_text=True)


def dat_tieu_de(ws, cols, dong=1):
    """Kẻ hàng tiêu đề nền navy chữ trắng."""
    for i, (ten, rong) in enumerate(cols, start=1):
        o = ws.cell(row=dong, column=i, value=ten)
        o.font = dam
        o.fill = nen_navy
        o.alignment = giua
        o.border = vien
        ws.column_dimensions[get_column_letter(i)].width = rong
    ws.row_dimensions[dong].height = 30
    ws.freeze_panes = ws.cell(row=dong + 1, column=1)


VI_DU = []  # gom lại để in ra sheet "Ví dụ" cuối file


def vi_du(ws, dong, gia_tri):
    """Ghi lại dòng ví dụ để in ở sheet hướng dẫn.

    KHÔNG ghi thẳng vào sheet dữ liệu: hệ thống đọc mọi dòng có nội dung, nên
    dòng ví dụ để lại trong sheet sẽ bị nhập nhầm thành người thật.
    """
    VI_DU.append((ws.title, gia_tri))


wb = Workbook()

# ── Sheet 1: Thông tin chương trình ─────────────────────────────
ws = wb.active
ws.title = "1. Thông tin chương trình"
ws["A1"] = "BÁO CÁO CHƯƠNG TRÌNH — YBA CHỢ LỚN"
ws["A1"].font = tieude_font
ws.merge_cells("A1:B1")
ws["A2"] = "Thư ký điền đầy đủ các mục dưới đây rồi tải file lên hệ thống."
ws["A2"].font = Font(italic=True, color="7A8194", size=10)
ws.merge_cells("A2:B2")

MUC = [
    ("Tên chương trình", "Ví dụ: Year End Party 2026 — Kết Tâm Vươn Tầm"),
    ("Ngày tổ chức", "Ví dụ: 20/12/2026"),
    ("Địa điểm tổ chức", "Ví dụ: Capella Center, 176 Nguyễn Văn Cừ, TP.HCM"),
    ("Mảng hoạt động", "Kết nối hội viên / Xúc tiến thương mại / Trách nhiệm cộng đồng / Đào tạo / Thể thao"),
    ("Chương trình định kỳ", "Ví dụ: Coffee Share, Business & Library — để trống nếu không thuộc chuỗi nào"),
    ("Nội dung chương trình", "Tóm tắt diễn biến, các phần chính của chương trình"),
    ("Ý nghĩa chương trình", "Chương trình mang lại giá trị gì cho hội viên và cộng đồng"),
    ("Tổng kinh phí (VNĐ)", "Ví dụ: 350000000"),
    ("Số người tham dự", "Ví dụ: 320"),
    ("Ghi chú", ""),
]

ws["A4"] = "MỤC"
ws["B4"] = "NỘI DUNG"
for c in ("A4", "B4"):
    ws[c].font = dam
    ws[c].fill = nen_navy
    ws[c].alignment = giua
    ws[c].border = vien
ws.column_dimensions["A"].width = 30
ws.column_dimensions["B"].width = 85
ws.row_dimensions[4].height = 26

for i, (ten, goi_y) in enumerate(MUC, start=5):
    a = ws.cell(row=i, column=1, value=ten)
    a.font = Font(bold=True, color=NAVY, size=11)
    a.alignment = trai
    a.border = vien
    b = ws.cell(row=i, column=2, value="")
    b.border = vien
    b.alignment = trai
    ws.row_dimensions[i].height = 24
    g = ws.cell(row=i, column=3, value=goi_y)
    g.font = Font(italic=True, color="9AA0A6", size=9)
ws.column_dimensions["C"].width = 70

# ── Sheet 2: Ban tổ chức ────────────────────────────────────────
ws2 = wb.create_sheet("2. Ban tổ chức")
dat_tieu_de(
    ws2,
    [
        ("Họ và tên", 28),
        ("Vai trò", 22),
        ("Doanh nghiệp", 42),
        ("Mã hội viên", 14),
        ("Ghi chú", 30),
    ],
)
vi_du(ws2, 2, ["Đặng Viên Khang", "Trưởng ban", "Công ty TNHH DV TKTT Hoàng Vy", "HV0001", ""])
vi_du(ws2, 3, ["Nguyễn Đức Anh", "Phó ban", "Công ty Cổ phần VES", "HV0002", ""])
vi_du(ws2, 4, ["Phạm Văn Hoàng", "Ban chỉ đạo", "Công ty TNHH SX TM Minh Chất", "HV0003", ""])
vi_du(ws2, 5, ["Lê Nguyên Tùng", "Thành viên", "Công ty TNHH ĐT TM NH Dada", "HV0004", ""])
ws2["G1"] = "Vai trò hợp lệ: Trưởng ban · Phó ban · Ban chỉ đạo · Thành viên"
ws2["G1"].font = Font(italic=True, color="9AA0A6", size=9)

# ── Sheet 3: Người tham gia ─────────────────────────────────────
ws3 = wb.create_sheet("3. Người tham gia")
dat_tieu_de(
    ws3,
    [
        ("Họ và tên", 28),
        ("Doanh nghiệp / đơn vị", 45),
        ("Mã hội viên", 14),
        ("Số điện thoại", 18),
        ("Ghi chú", 30),
    ],
)
vi_du(ws3, 2, ["Nguyễn Văn A", "Công ty TNHH ABC", "HV0025", "0903000111", ""])
vi_du(ws3, 3, ["Trần Thị B", "Khách mời — Sở Công Thương", "", "0908222333", "Khách mời"])
ws3["G1"] = "Để trống Mã hội viên nếu là khách mời ngoài Hội."
ws3["G1"].font = Font(italic=True, color="9AA0A6", size=9)

# ── Sheet 4: Nhà tài trợ ────────────────────────────────────────
ws4 = wb.create_sheet("4. Nhà tài trợ")
dat_tieu_de(
    ws4,
    [
        ("Nhà tài trợ", 45),
        ("Mức tài trợ", 16),
        ("Hiện kim (VNĐ)", 18),
        ("Hiện vật — mô tả", 40),
        ("Giá trị hiện vật (VNĐ)", 20),
        ("Trạng thái", 16),
        ("Mã hội viên", 14),
        ("Ghi chú", 30),
    ],
)
vi_du(
    ws4, 2,
    ["Công ty Cổ phần Jemmia", "Kim cương", 25000000, "Huy hiệu Chí Lớn Vang Danh", 25000000, "Hoàn tất", "HV0030", ""],
)
vi_du(
    ws4, 3,
    ["Công ty TNHH San Hà", "Bạc", 0, "300 phần khô gà 500g", 15000000, "Hoàn tất", "HV0007", ""],
)
ws4["J1"] = "Mức: Kim cương · Vàng · Bạc · Đồng · Đồng hành"
ws4["J1"].font = Font(italic=True, color="9AA0A6", size=9)
ws4["J2"] = "Trạng thái: Hoàn tất · Cam kết · Còn thiếu"
ws4["J2"].font = Font(italic=True, color="9AA0A6", size=9)

# ── Sheet 5: Ví dụ điền mẫu ─────────────────────────────────────
ws5 = wb.create_sheet("5. Ví dụ điền mẫu")
ws5["A1"] = "VÍ DỤ CÁCH ĐIỀN — CHỈ ĐỂ THAM KHẢO"
ws5["A1"].font = tieude_font
ws5["A2"] = (
    "Sheet này không được nhập vào hệ thống. Anh/chị điền dữ liệu thật vào "
    "các sheet 2, 3, 4."
)
ws5["A2"].font = Font(italic=True, color="7A8194", size=10)
ws5.column_dimensions["A"].width = 34
for i in range(2, 10):
    ws5.column_dimensions[get_column_letter(i)].width = 26

r = 4
sheet_dang_in = None
for ten_sheet, gia_tri in VI_DU:
    if ten_sheet != sheet_dang_in:
        sheet_dang_in = ten_sheet
        o = ws5.cell(row=r, column=1, value=f"Sheet {ten_sheet}")
        o.font = Font(bold=True, color=NAVY, size=12)
        r += 1
    for i, v in enumerate(gia_tri, start=1):
        c = ws5.cell(row=r, column=i, value=v)
        c.fill = nen_nhat
        c.alignment = trai
        c.border = vien
        c.font = Font(italic=True, color="7A8194", size=10)
    r += 1
    if ten_sheet != sheet_dang_in:
        r += 1

wb.save(TEP)
print("Da tao:", TEP)
for s in wb.sheetnames:
    print("  -", s)
