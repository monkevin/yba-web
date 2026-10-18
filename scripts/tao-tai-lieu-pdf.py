# -*- coding: utf-8 -*-
"""
Tạo hai tài liệu PDF cho Chi hội:

  1. tai-lieu/gioi-thieu-website-yba-cho-lon.pdf  — giới thiệu toàn diện
     website cho Ban Chủ nhiệm / hội viên / đối tác.
  2. tai-lieu/huong-dan-quan-tri-yba-cho-lon.pdf  — cẩm nang cho thư ký
     làm quản trị: đăng nhập, ĐỔI MẬT KHẨU, việc hằng ngày, sự cố.

Chạy lại bất cứ lúc nào nội dung web đổi:  python scripts/tao-tai-lieu-pdf.py
Font: Segoe UI của Windows (đủ dấu tiếng Việt). Màu theo nhận diện:
navy #2e4082 + đỏ son #7c0717/#c8102e — xem AGENTS.md và skill brand-yba.

LƯU Ý: file hướng dẫn có mật khẩu khởi tạo của tài khoản admin — là tài
liệu NỘI BỘ, chỉ gửi cho thư ký / Ban Chủ nhiệm, và trang đầu đã in đậm
yêu cầu đổi mật khẩu ngay lần đăng nhập đầu tiên.
"""

import os
import sys

# Cửa sổ lệnh Windows mặc định bảng mã cp1252 — in tiếng Việt là vỡ
sys.stdout.reconfigure(encoding="utf-8")

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    Image,
    KeepTogether,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

GOC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THU_MUC = os.path.join(GOC, "tai-lieu")
os.makedirs(THU_MUC, exist_ok=True)
LOGO = os.path.join(GOC, "public", "logo-yba-cholon.png")

# ── Màu nhận diện ────────────────────────────────────────────────────
NAVY = colors.HexColor("#2e4082")
NAVY_DAM = colors.HexColor("#1b274d")
DO_SON = colors.HexColor("#7c0717")
DO_TUOI = colors.HexColor("#c8102e")
KEM = colors.HexColor("#faf7f3")
XAM = colors.HexColor("#475569")

# ── Font Segoe UI (đủ dấu tiếng Việt) ───────────────────────────────
FONTS = "C:/Windows/Fonts"
pdfmetrics.registerFont(TTFont("Segoe", os.path.join(FONTS, "segoeui.ttf")))
pdfmetrics.registerFont(TTFont("Segoe-B", os.path.join(FONTS, "segoeuib.ttf")))
pdfmetrics.registerFont(TTFont("Segoe-I", os.path.join(FONTS, "segoeuii.ttf")))
pdfmetrics.registerFontFamily(
    "Segoe", normal="Segoe", bold="Segoe-B", italic="Segoe-I", boldItalic="Segoe-B"
)

# ── Kiểu chữ ─────────────────────────────────────────────────────────
def kieu(ten, **k):
    mac_dinh = dict(fontName="Segoe", fontSize=10.5, leading=15.5, textColor=NAVY_DAM)
    mac_dinh.update(k)
    return ParagraphStyle(ten, **mac_dinh)

ST = {
    "tua_bia": kieu("tua_bia", fontName="Segoe-B", fontSize=27, leading=33,
                    textColor=colors.white),
    "phu_bia": kieu("phu_bia", fontSize=13, leading=19, textColor=colors.HexColor("#f7c9cd")),
    "muc_lon": kieu("muc_lon", fontName="Segoe-B", fontSize=16, leading=20,
                    textColor=DO_SON, spaceBefore=14, spaceAfter=4),
    "muc_nho": kieu("muc_nho", fontName="Segoe-B", fontSize=12, leading=16,
                    textColor=NAVY, spaceBefore=10, spaceAfter=2),
    "than": kieu("than", spaceAfter=4),
    "cham": kieu("cham", leftIndent=14, bulletIndent=4, spaceAfter=2.5),
    "buoc": kieu("buoc", leftIndent=22, bulletIndent=6, spaceAfter=3),
    "ghi_chu": kieu("ghi_chu", fontSize=9, leading=13, textColor=XAM),
    "o_bang": kieu("o_bang", fontSize=9.5, leading=13.5),
    "o_bang_dam": kieu("o_bang_dam", fontName="Segoe-B", fontSize=9.5, leading=13.5,
                       textColor=NAVY_DAM),
    "o_bang_trang": kieu("o_bang_trang", fontName="Segoe-B", fontSize=9.5,
                         leading=13.5, textColor=colors.white),
    "canh_bao": kieu("canh_bao", fontName="Segoe-B", fontSize=11, leading=16,
                     textColor=DO_SON),
}


def ve_bia(canvas, doc, tua, phu, nhan):
    """Trang bìa: dải đỏ son đậm chuyển sắc + logo + tiêu đề."""
    canvas.saveState()
    w, h = A4
    # Nền đỏ son giả chuyển sắc bằng các dải ngang
    canvas.setFillColor(DO_SON)
    canvas.rect(0, 0, w, h, stroke=0, fill=1)
    for i in range(60):
        t = i / 60
        c = colors.Color(
            0.486 * (1 - t) + 0.106 * t,
            0.027 * (1 - t) + 0.153 * t,
            0.090 * (1 - t) + 0.302 * t,
        )  # 7c0717 -> 1b274d
        canvas.setFillColor(c)
        canvas.rect(0, h * 0.55 * (1 - t) - 2, w, h * 0.55 / 60 + 4, stroke=0, fill=1)
    # Vạch đỏ tươi trên đỉnh
    canvas.setFillColor(DO_TUOI)
    canvas.rect(0, h - 6 * mm, w, 6 * mm, stroke=0, fill=1)
    # Logo
    if os.path.exists(LOGO):
        canvas.drawImage(LOGO, w / 2 - 22 * mm, h - 88 * mm, 44 * mm, 44 * mm,
                         mask="auto", preserveAspectRatio=True)
    # Chữ
    from reportlab.lib.styles import ParagraphStyle as PS
    tua_p = Paragraph(tua, ST["tua_bia"])
    phu_p = Paragraph(phu, ST["phu_bia"])
    aw = w - 40 * mm
    _, th = tua_p.wrap(aw, h)
    tua_p.drawOn(canvas, 20 * mm, h - 105 * mm - th)
    _, ph2 = phu_p.wrap(aw, h)
    phu_p.drawOn(canvas, 20 * mm, h - 115 * mm - th - ph2)
    # Nhãn chân bìa
    canvas.setFont("Segoe-B", 10)
    canvas.setFillColor(colors.white)
    canvas.drawString(20 * mm, 22 * mm, "CHI HỘI DOANH NHÂN TRẺ CHỢ LỚN — ybacholon.vn")
    canvas.setFont("Segoe", 9)
    canvas.setFillColor(colors.HexColor("#f7c9cd"))
    canvas.drawString(20 * mm, 16 * mm, nhan)
    canvas.restoreState()


def ve_trang_thuong(canvas, doc, tieu_de_chay):
    """Đầu trang mảnh + số trang cho các trang nội dung."""
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(DO_TUOI)
    canvas.rect(0, h - 3.2 * mm, w, 3.2 * mm, stroke=0, fill=1)
    canvas.setFont("Segoe", 8.2)
    canvas.setFillColor(XAM)
    canvas.drawString(18 * mm, h - 10.5 * mm, tieu_de_chay)
    canvas.drawRightString(w - 18 * mm, h - 10.5 * mm, "ybacholon.vn")
    canvas.setFont("Segoe", 8.2)
    canvas.drawCentredString(w / 2, 10 * mm, f"Trang {canvas.getPageNumber() - 1}")
    canvas.restoreState()


def lam_pdf(duong_dan, tua, phu, nhan_bia, tieu_de_chay, noi_dung):
    doc = BaseDocTemplate(
        duong_dan, pagesize=A4,
        leftMargin=18 * mm, rightMargin=18 * mm,
        topMargin=20 * mm, bottomMargin=16 * mm,
        title=tua.replace("<br/>", " "), author="Chi hội Doanh nhân trẻ Chợ Lớn",
    )
    khung = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="khung")
    doc.addPageTemplates([
        PageTemplate(id="bia", frames=[khung],
                     onPage=lambda c, d: ve_bia(c, d, tua, phu, nhan_bia)),
        PageTemplate(id="thuong", frames=[khung],
                     onPage=lambda c, d: ve_trang_thuong(c, d, tieu_de_chay)),
    ])
    story = [NextPageTemplate("thuong"), PageBreak()]
    story.extend(noi_dung)
    doc.build(story)
    print("Đã tạo:", os.path.relpath(duong_dan, GOC))


def muc(t):
    return Paragraph(t, ST["muc_lon"])

def muc2(t):
    return Paragraph(t, ST["muc_nho"])

def d(t):
    return Paragraph(t, ST["than"])

def cham(t):
    return Paragraph(t, ST["cham"], bulletText="•")

def buoc(i, t):
    return Paragraph(f"<b>Bước {i}.</b> {t}", ST["buoc"])

def ghi_chu(t):
    return Paragraph(t, ST["ghi_chu"])

def vach():
    return HRFlowable(width="100%", thickness=0.7, color=colors.HexColor("#e0e5f3"),
                      spaceBefore=6, spaceAfter=6)

def hop_canh_bao(t):
    """Hộp nền kem viền đỏ cho các cảnh báo quan trọng."""
    b = Table([[Paragraph(t, ST["canh_bao"])]], colWidths=[174 * mm])
    b.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#fdf3f3")),
        ("BOX", (0, 0), (-1, -1), 1.1, DO_TUOI),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([Spacer(1, 4), b, Spacer(1, 6)])

def bang(dong, rong, co_dau=True):
    """Bảng hai/ba cột nền xen kẽ, dòng đầu nền navy chữ trắng."""
    du_lieu = []
    for i, hang in enumerate(dong):
        if i == 0 and co_dau:
            du_lieu.append([Paragraph(o, ST["o_bang_trang"]) for o in hang])
        else:
            du_lieu.append([
                Paragraph(o, ST["o_bang_dam"] if j == 0 else ST["o_bang"])
                for j, o in enumerate(hang)
            ])
    t = Table(du_lieu, colWidths=rong, repeatRows=1 if co_dau else 0)
    st = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 4.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#c2cbe8")),
    ]
    if co_dau:
        st.append(("BACKGROUND", (0, 0), (-1, 0), NAVY))
    for i in range(1 if co_dau else 0, len(dong)):
        if i % 2 == (0 if co_dau else 1):
            st.append(("BACKGROUND", (0, i), (-1, i), KEM))
    t.setStyle(TableStyle(st))
    return t


# ════════════════════════════════════════════════════════════════════
# PDF 1 — GIỚI THIỆU TOÀN DIỆN WEBSITE
# ════════════════════════════════════════════════════════════════════
nd1 = []

nd1.append(muc("1. Website này là gì?"))
nd1.append(d(
    "<b>ybacholon.vn</b> là ngôi nhà trực tuyến của Chi hội Doanh nhân trẻ "
    "Chợ Lớn (trực thuộc Hội Doanh nhân trẻ TP.HCM — YBA HCM), thay thế "
    "hoàn toàn trang WordPress cũ. Khác với web cũ chỉ mang tính giới "
    "thiệu, web mới là <b>ba công cụ trong một</b>:"))
nd1.append(cham("<b>Bộ mặt của Chi hội</b> — giới thiệu tổ chức, Ban Chủ nhiệm, "
                "sự kiện, tin tức cho công chúng và đối tác."))
nd1.append(cham("<b>Sàn giao thương vận hành thật</b> — danh bạ doanh nghiệp, "
                "chợ nhu cầu mua – bán, ghi nhận giao dịch giữa hội viên."))
nd1.append(cham("<b>Công cụ thi đua</b> — chỉ số xúc tiến thương mại và bảng "
                "vinh danh sinh ra tự động từ số liệu thật, không bình chọn cảm tính."))
nd1.append(d(
    "Chi hội hoạt động từ năm 2009, quy tụ <b>trên 150 hội viên</b> là doanh "
    "nhân trẻ tại 7 quận huyện khu vực Chợ Lớn, với khẩu hiệu "
    "<b>“Dấn thân – Đổi mới – Đột phá – Vươn tầm”</b> và tinh thần "
    "<b>“Kết nối – Sẻ chia – Kiến tạo giá trị”</b>."))

nd1.append(muc("2. Ba khu vực của website"))
nd1.append(bang([
    ["Khu vực", "Ai vào được", "Có gì"],
    ["Khu công khai", "Mọi người, không cần đăng nhập",
     "Trang chủ, giới thiệu, danh bạ doanh nghiệp, chợ nhu cầu, sự kiện, "
     "tin tức, video, vinh danh, chỉ số giao thương…"],
    ["Khu hội viên", "Hội viên có tài khoản",
     "Tự sửa hồ sơ doanh nghiệp, đăng tin mua – bán, khai và xác nhận "
     "giao dịch, xem thành tích của mình."],
    ["Khu quản trị", "Ban Chủ nhiệm và thư ký được phân quyền",
     "Duyệt hồ sơ, duyệt tin, duyệt giao dịch, đăng tin tức – sự kiện, "
     "quản lý hội phí, tài khoản, giao diện."],
], [32 * mm, 46 * mm, 96 * mm]))

nd1.append(muc("3. Khu công khai — từng trang một"))
nd1.append(muc2("Trang chủ"))
nd1.append(d(
    "Ảnh hoạt động thật của Chi hội làm nền, khẩu hiệu, bốn chỉ số giao "
    "thương cập nhật tự động (doanh nghiệp hội viên, giá trị giao thương, "
    "giao dịch đã ghi nhận, cặp kết nối), rồi lần lượt: lịch hoạt động sắp "
    "tới, dải ảnh sự kiện, doanh nghiệp tiêu biểu, tin mua – bán mới nhất, "
    "video, định hướng nhiệm kỳ, tin tức. Giao diện có hiệu ứng hiện dần "
    "khi cuộn và lưới chấm phản ứng theo con trỏ — phong cách công nghệ, "
    "hiện đại."))
nd1.append(muc2("Doanh nghiệp — danh bạ hội viên"))
nd1.append(cham("Hàng trăm hồ sơ doanh nghiệp, tìm kiếm được cả khi gõ "
                "<b>không dấu</b>, lọc theo ngành nghề."))
nd1.append(cham("Mỗi doanh nghiệp một trang riêng: giới thiệu, năng lực, sản "
                "phẩm – dịch vụ, hình ảnh, liên kết báo chí viết về doanh "
                "nghiệp, fanpage Facebook nhúng trực tiếp, các tin mua – bán "
                "đang đăng và thành tích giao thương."))
nd1.append(cham("Khách vãng lai <b>không</b> thấy số điện thoại / email hội viên "
                "— muốn liên hệ trực tiếp phải đăng nhập. Bảo vệ hội viên "
                "khỏi bị quấy rầy."))
nd1.append(muc2("Chợ nhu cầu mua – bán"))
nd1.append(cham("Hội viên tự đăng tin <b>cần mua</b> hoặc <b>cần bán</b>; hiện có "
                "hơn 500 tin theo ngành nghề."))
nd1.append(cham("Ai cũng xem và tìm được; tên công ty đăng tin hiện nổi bật; "
                "người quan tâm bấm một nút để kết nối."))
nd1.append(cham("Hội viên đã đóng hội phí được xếp tin lên trước — quyền lợi "
                "thật của việc đóng phí."))
nd1.append(muc2("Xúc tiến thương mại — trang chỉ số"))
nd1.append(cham("Tổng giá trị và số giao dịch theo kỳ, tách <b>ba cấp</b>: nội "
                "Chi hội / liên chi hội / liên hội — đúng cách Hội đo hiệu "
                "quả kết nối."))
nd1.append(cham("Mỗi giao dịch phải qua <b>ba bước</b>: một bên khai — bên kia "
                "xác nhận — Ban Chủ nhiệm duyệt. Chỉ giao dịch đã duyệt mới "
                "được tính, nên con số công bố là con số thật."))
nd1.append(muc2("Vinh danh hội viên"))
nd1.append(d(
    "Bảng vinh danh theo kỳ (Top bán, Top mua, Top kết nối…) tổng hợp tự "
    "động từ giao dịch đã duyệt. Không có bình chọn cảm tính — đây là điểm "
    "khác biệt lớn so với cách vinh danh thông thường."))
nd1.append(muc2("Sự kiện & Lịch hoạt động"))
nd1.append(cham("Kho 80 sự kiện đã tổ chức với album ảnh xem phóng to được; "
                "sự kiện 2026 đã nhập đủ hình ảnh."))
nd1.append(cham("Lịch hoạt động sắp tới có trang đăng ký <b>tham gia</b> hoặc "
                "<b>tài trợ</b> ngay trên web; danh sách hiện tên sau khi Ban "
                "Tổ chức duyệt."))
nd1.append(cham("Trang <b>Đi thăm doanh nghiệp</b> — chương trình ghé thăm nhà "
                "xưởng, văn phòng của hội viên, đăng ký ngay trên web."))
nd1.append(muc2("Ban Chủ nhiệm & Đặt lịch gặp"))
nd1.append(d(
    "28 nhân sự điều hành theo từng ban, mỗi người một trang giới thiệu "
    "riêng kèm doanh nghiệp của họ. Hội viên và khách <b>đặt lịch gặp Ban "
    "Chủ nhiệm</b> trực tuyến — chọn người muốn gặp, đề tài, thời gian."))
nd1.append(muc2("Tin tức, Video, Tài trợ"))
nd1.append(cham("Tin tức chia chuyên mục, bài lấy lại từ Hội cấp trên luôn ghi "
                "rõ nguồn; hai fanpage (Chi hội + Hội) nhúng trực tiếp."))
nd1.append(cham("Thư viện video tự cập nhật từ kênh YouTube của Chi hội."))
nd1.append(cham("Trang tài trợ: các gói đồng hành kèm quyền lợi, đăng ký ngay "
                "trên web; nhà tài trợ được vinh danh."))
nd1.append(muc2("WHO AM I? — trắc nghiệm doanh nhân"))
nd1.append(d(
    "Bộ trắc nghiệm tính cách dành cho khách: khai họ tên, số điện thoại là "
    "làm được ngay. Vừa là quà tặng cho cộng đồng, vừa giúp Chi hội có danh "
    "sách khách quan tâm (xem được ở khu quản trị, tải ra Excel)."))
nd1.append(muc2("Tìm kiếm toàn trang & Trợ lý AI"))
nd1.append(cham("Ô tìm kiếm trên thanh menu tìm <b>mọi thứ</b>: doanh nghiệp, "
                "tin đăng, sự kiện, bài viết, nhân sự, video…"))
nd1.append(cham("Nút <b>Hỏi AI</b>: trợ lý trả lời câu hỏi về Hội, Chi hội, hội "
                "viên, ngành nghề, sự kiện — chỉ trả lời từ dữ liệu thật của "
                "web, không bịa, không lộ số điện thoại hội viên."))

nd1.append(muc("4. Khu hội viên — mỗi hội viên một tài khoản"))
nd1.append(cham("<b>Hồ sơ doanh nghiệp:</b> tự sửa giới thiệu, ảnh, sản phẩm; "
                "bản sửa chờ Ban Chủ nhiệm duyệt rồi mới hiện công khai."))
nd1.append(cham("<b>Tin đăng:</b> đăng và quản lý tin cần mua / cần bán, xem ai "
                "quan tâm tin của mình."))
nd1.append(cham("<b>Giao dịch:</b> khai giao dịch với hội viên khác hoặc đơn vị "
                "ngoài, xác nhận giao dịch bên kia khai."))
nd1.append(cham("<b>Thành tích:</b> chỉ số giao thương của riêng mình, thứ hạng, "
                "tình trạng hội phí."))
nd1.append(cham("<b>Chân dung doanh nhân:</b> bốn công cụ khám phá bản thân dành "
                "riêng cho người điều hành (thần số học, tử vi tham khảo, "
                "tính cách điều hành, khí chất) — kết quả riêng tư."))

nd1.append(muc("5. Khu quản trị — một nơi điều hành tất cả"))
nd1.append(d(
    "Ban Chủ nhiệm và thư ký quản lý toàn bộ website không cần biết kỹ "
    "thuật: duyệt hồ sơ, duyệt tin, duyệt giao dịch, kết nạp hội viên mới, "
    "đăng tin tức – sự kiện (có nhập từ file Excel), quản lý hội phí, vinh "
    "danh, tài khoản, đổi cả giao diện (ảnh nền, logo, màu chủ đạo, KV). "
    "Chi tiết trong tài liệu <b>“Hướng dẫn quản trị website”</b> đi kèm."))
nd1.append(d(
    "Phân quyền chi tiết: tài khoản <b>ADMIN</b> (Chủ nhiệm) có mọi quyền; "
    "tài khoản <b>cán bộ ban</b> chỉ thấy đúng phần việc được giao trong 13 "
    "nhóm quyền — thư ký làm nội dung không đụng được vào hội phí, và "
    "ngược lại."))

nd1.append(muc("6. Những nguyên tắc web luôn giữ"))
nd1.append(bang([
    ["Nguyên tắc", "Nghĩa là"],
    ["Số liệu thật", "Chỉ số và vinh danh chỉ tính giao dịch đã qua ba bước "
     "xác nhận; số không đẹp thì để số không — không tô vẽ."],
    ["Bảo vệ hội viên", "Khách vãng lai không thấy số điện thoại / email; "
     "ảnh tải lên bị giới hạn định dạng; mật khẩu mã hoá."],
    ["Ưu tiên người đóng phí", "Hội viên đã đóng hội phí luôn hiện trước ở "
     "danh bạ và chợ nhu cầu; chưa đóng phí vẫn hiện đầy đủ, chỉ xếp sau."],
    ["Ghi nguồn tử tế", "Tin lấy lại từ Hội cấp trên ghi rõ nguồn, không để "
     "người đọc nhầm là hoạt động Chi hội tự tổ chức."],
    ["Tiếng Việt trọn vẹn", "Toàn bộ giao diện tiếng Việt; tìm kiếm hiểu cả "
     "chữ không dấu; chữ dùng bộ font vẽ riêng cho tiếng Việt."],
], [40 * mm, 134 * mm]))

nd1.append(muc("7. Nhận diện & công nghệ"))
nd1.append(cham("<b>Màu sắc:</b> xanh navy #2e4082 và đỏ #c8102e theo nhận diện "
                "YBA, thêm tông đỏ son trầm của khu Chợ Lớn cho các dải nền "
                "lớn — máu lửa, tình huynh đệ."))
nd1.append(cham("<b>Chữ:</b> Be Vietnam Pro (bộ chữ vẽ riêng cho tiếng Việt) cho "
                "nội dung, Playfair Display cho tiêu đề lớn — sang và trang "
                "trọng."))
nd1.append(cham("<b>Hiệu ứng:</b> khối nội dung hiện dần khi cuộn, lưới chấm "
                "sáng theo con trỏ, số liệu đếm chạy, vệt sáng trên thẻ — "
                "tự tắt với người dùng chọn “giảm chuyển động”."))
nd1.append(cham("<b>Nền tảng:</b> công nghệ web hiện đại (Next.js), chạy nhanh "
                "trên điện thoại, chuẩn SEO (sitemap, chia sẻ đẹp lên "
                "Facebook/Zalo), triển khai bằng Docker trên máy chủ riêng, "
                "dữ liệu sao lưu hằng ngày."))
nd1.append(Spacer(1, 6))
nd1.append(vach())
nd1.append(ghi_chu(
    "Tài liệu do Chi hội Doanh nhân trẻ Chợ Lớn phát hành · Nhiệm kỳ XII "
    "(2024 – 2027) · Cập nhật tháng 8/2026. Số liệu trong tài liệu lấy từ "
    "website tại thời điểm phát hành."))

lam_pdf(
    os.path.join(THU_MUC, "gioi-thieu-website-yba-cho-lon.pdf"),
    "Website Chi hội Doanh nhân trẻ Chợ Lớn",
    "Giới thiệu toàn diện — bộ mặt của Chi hội, sàn giao thương "
    "và công cụ thi đua trong một địa chỉ duy nhất",
    "Tài liệu giới thiệu · Lưu hành trong Hội và đối tác",
    "Giới thiệu website ybacholon.vn",
    nd1,
)



# ════════════════════════════════════════════════════════════════════
# PDF 2 — CẨM NANG SỬ DỤNG & QUẢN TRỊ TOÀN DIỆN
# (bản mở rộng 08/2026: thêm tài khoản thuky, quy trình từng việc,
#  phần hướng dẫn hội viên và bảng tra cứu "sửa ở đâu")
# ════════════════════════════════════════════════════════════════════
nd2 = []

nd2.append(hop_canh_bao(
    "LƯU Ý — TÀI LIỆU NỘI BỘ: có mật khẩu khởi tạo ở trang này. Chỉ gửi "
    "cho thư ký và Ban Chủ nhiệm. Việc ĐẦU TIÊN sau khi đọc là đổi mật "
    "khẩu CẢ HAI tài khoản ở mục 2 — kiểm tra ngày 08/08/2026 cho thấy "
    "web thật vẫn đang dùng mật khẩu khởi tạo."))

nd2.append(muc("1. Hai tài khoản quản trị & đăng nhập"))
nd2.append(d("Vào <b>ybacholon.vn/login</b>. Web có sẵn HAI tài khoản quản "
             "trị toàn quyền (ADMIN):"))
nd2.append(bang([
    ["Tài khoản", "Dành cho", "Mật khẩu khởi tạo"],
    ["<b>admin</b>", "Chủ nhiệm / Ban Chủ nhiệm", "<b>123456</b>"],
    ["<b>thuky</b>", "Thư ký Chi hội", "<b>123456</b>"],
], [40 * mm, 84 * mm, 50 * mm]))
nd2.append(d("Ngoài ra mỗi hội viên có một tài khoản riêng: tên đăng nhập do Chi "
             "hội cấp — chính là MÃ HỘI VIÊN viết thường, ví dụ mã HV0123 gõ "
             "hv0123 — hoặc số điện thoại "
             "đã đăng ký — xem mục 6."))
nd2.append(ghi_chu("Đăng nhập xong, trang quản trị nằm ở ybacholon.vn/quan-tri. "
                   "Trên thanh menu, bấm vào tên mình ở góc phải để vào khu làm việc."))

nd2.append(muc("2. Đổi mật khẩu — làm ngay, cho CẢ HAI tài khoản"))
nd2.append(d("Mật khẩu 123456 ai cầm tài liệu này cũng biết; để nguyên là "
             "người ngoài nắm toàn bộ dữ liệu hội viên. Làm lần lượt:"))
nd2.append(buoc(1, "Đăng nhập bằng <b>admin / 123456</b>, vào "
                   "<b>ybacholon.vn/quan-tri/tai-khoan</b>."))
nd2.append(buoc(2, "Tìm dòng <b>admin</b> → bấm <b>“Đổi mật khẩu”</b> → nhập "
                   "mật khẩu mới (tối thiểu 6 ký tự) → OK."))
nd2.append(buoc(3, "Ngay tại trang đó, tìm dòng <b>thuky</b> → bấm "
                   "<b>“Đổi mật khẩu”</b> → đặt một mật khẩu KHÁC → OK."))
nd2.append(buoc(4, "Ghi hai mật khẩu mới vào sổ riêng hoặc trình quản lý mật "
                   "khẩu. ĐỪNG dán lên màn hình, đừng gửi vào nhóm Zalo chung."))
nd2.append(buoc(5, "Gửi mật khẩu mới của <b>thuky</b> cho thư ký qua kênh "
                   "riêng (gọi điện / nhắn riêng)."))
nd2.append(d("<b>Mẹo đặt mật khẩu:</b> một cụm dễ nhớ khó đoán, ví dụ kiểu "
             "<i>ChoLon2026@Vui</i> — có chữ hoa, số, ký tự đặc biệt."))
nd2.append(hop_canh_bao(
    "Quên mật khẩu? Tài khoản ADMIN còn lại vào /quan-tri/tai-khoan đổi hộ "
    "được ngay — vì vậy đừng bao giờ để cả hai cùng thất lạc. Mất cả hai thì "
    "phải nhờ người quản lý máy chủ can thiệp."))

nd2.append(muc("3. Bản đồ website — dẫn hội viên đi đâu"))
nd2.append(bang([
    ["Khu vực", "Địa chỉ", "Ai vào được"],
    ["Khu công khai", "ybacholon.vn — trang chủ, giới thiệu, danh bạ, chợ nhu "
     "cầu, sự kiện, tin tức, video, vinh danh, WHO AM I?, tìm kiếm, Hỏi AI",
     "Mọi người"],
    ["Khu hội viên", "/tai-khoan — hồ sơ doanh nghiệp, tin đăng, giao dịch, "
     "thành tích, chân dung doanh nhân", "Hội viên đăng nhập"],
    ["Khu quản trị", "/quan-tri — mọi việc điều hành trong tài liệu này",
     "ADMIN + cán bộ ban được phân quyền"],
], [30 * mm, 102 * mm, 42 * mm]))

nd2.append(muc("4. Bảng điều khiển /quan-tri"))
nd2.append(d("Mỗi ô hiện luôn số việc đang chờ (hồ sơ chờ duyệt, đăng ký "
             "mới…). Toàn bộ các ô:"))
nd2.append(bang([
    ["Ô", "Địa chỉ", "Dùng để"],
    ["Hội viên", "/quan-tri/hoi-vien", "Thêm, sửa thông tin hội viên."],
    ["Hồ sơ doanh nghiệp", "/quan-tri/ho-so", "Duyệt bản sửa hồ sơ; sửa hộ."],
    ["Tin đăng", "/quan-tri/tin-dang", "Kiểm soát chợ nhu cầu; bật/tắt bắt "
     "buộc duyệt tin."],
    ["Vinh danh", "/quan-tri/vinh-danh", "Tạo kỳ vinh danh, công bố bảng vàng."],
    ["Lịch hoạt động", "/quan-tri/lich-hoat-dong", "Tạo mục lịch; duyệt đăng "
     "ký tham gia / tài trợ."],
    ["Lịch hẹn", "/quan-tri/lich-hen", "Xử lý đề nghị gặp Ban Chủ nhiệm."],
    ["Đi thăm doanh nghiệp", "/quan-tri/tham-doanh-nghiep", "Tạo chuyến thăm, "
     "mở đăng ký, chốt danh sách."],
    ["Tài trợ", "/quan-tri/tai-tro", "Gói tài trợ và đơn vị đồng hành."],
    ["Khách trắc nghiệm", "/quan-tri/khach-test", "Khách làm WHO AM I? kèm số "
     "điện thoại — tải Excel để chăm sóc."],
    ["Nội dung: Đăng ký hội viên", "/quan-tri/noi-dung/dang-ky", "Hồ sơ xin "
     "gia nhập → nút “Kết nạp thành hội viên”."],
    ["Nội dung: Tin tức", "/quan-tri/noi-dung/tin-tuc", "Viết và đăng bài."],
    ["Nội dung: Sự kiện", "/quan-tri/noi-dung/su-kien", "Tạo sự kiện, tải album "
     "ảnh, nhập danh sách từ Excel."],
    ["Nội dung: Video", "/quan-tri/noi-dung/video", "Video tự lấy từ YouTube; "
     "thêm tay video cũ."],
    ["Trang tĩnh", "/quan-tri/trang", "Sửa chữ trang Giới thiệu, Quyền lợi, "
     "Điều lệ, lời mở Ban Chủ nhiệm + nhân sự các ban."],
    ["Giao diện", "/quan-tri/giao-dien", "Banner, logo, KV, màu, hotline, "
     "email, địa chỉ, khẩu hiệu, fanpage."],
    ["Hội phí", "/quan-tri/hoi-phi", "Ghi nhận đóng hội phí."],
    ["Nhóm sinh hoạt", "/quan-tri/nhom", "Các nhóm sinh hoạt của Chi hội."],
    ["Tài khoản", "/quan-tri/tai-khoan", "Tạo tài khoản, đổi mật khẩu hộ, "
     "khoá, phân quyền."],
], [40 * mm, 52 * mm, 82 * mm]))
nd2.append(ghi_chu("Duyệt GIAO DỊCH giao thương nằm ở mục Giao dịch (/giao-dich) "
                   "trong khu làm việc — không phải trong /quan-tri."))

nd2.append(muc("5. Quy trình từng việc — cầm tay chỉ việc"))

nd2.append(muc2("5.1 Kết nạp hội viên mới"))
nd2.append(buoc(1, "Khách nộp đơn ở trang công khai /dang-ky-hoi-vien."))
nd2.append(buoc(2, "Vào /quan-tri/noi-dung/dang-ky xem hồ sơ; trao đổi, mời "
                   "dự sinh hoạt theo quy trình của Ban Hội viên."))
nd2.append(buoc(3, "Ban Chủ nhiệm đồng ý → bấm <b>“Kết nạp thành hội viên”</b>. "
                   "Hệ thống tự tạo hồ sơ doanh nghiệp + tài khoản."))
nd2.append(buoc(4, "Mật khẩu của hội viên mới hiện <b>ĐÚNG MỘT LẦN</b> trong "
                   "thông báo — chép ngay và gửi riêng cho hội viên."))
nd2.append(ghi_chu("Hệ thống tự chặn trùng theo tên doanh nghiệp và số điện thoại."))

nd2.append(muc2("5.2 Duyệt hồ sơ doanh nghiệp"))
nd2.append(d("Hội viên tự sửa hồ sơ ở khu hội viên → bản sửa vào trạng thái "
             "chờ duyệt nhưng VẪN hiện công khai (quy ước của Chi hội: thà "
             "hiện bản đang chờ còn hơn trống). Vào /quan-tri/ho-so xem và "
             "bấm duyệt; nội dung sai thì “Sửa hộ” trực tiếp."))

nd2.append(muc2("5.3 Chợ nhu cầu mua – bán"))
nd2.append(cham("Mặc định hội viên <b>đăng là hiện ngay</b>. Muốn mọi tin phải "
                "qua duyệt: /quan-tri/tin-dang → bật “Bắt buộc duyệt”."))
nd2.append(cham("Tin không phù hợp: ẩn hoặc gỡ ngay tại trang đó."))
nd2.append(cham("Tin có hạn hiển thị 90 ngày, hết hạn tự ẩn."))

nd2.append(muc2("5.4 Duyệt giao dịch giao thương"))
nd2.append(d("Mỗi giao dịch đi qua BA bước: một bên khai → bên kia xác nhận "
             "→ Ban Chủ nhiệm duyệt tại /giao-dich. Chỉ giao dịch ĐÃ DUYỆT "
             "mới được tính vào chỉ số /xuc-tien-thuong-mai và vinh danh — "
             "vì vậy số trên web luôn là số thật, đừng duyệt giao dịch chưa "
             "kiểm chứng."))

nd2.append(muc2("5.5 Đăng sự kiện & nhập danh sách từ Excel"))
nd2.append(buoc(1, "/quan-tri/noi-dung/su-kien → “Thêm sự kiện”: tên, ngày, "
                   "địa điểm, bài giới thiệu, ảnh bìa + album."))
nd2.append(buoc(2, "Sự kiện CHƯA chắc ngày thì cứ lưu nhưng ĐỪNG bật hiện — "
                   "thà chưa hiện còn hơn hiện sai ngày."))
nd2.append(buoc(3, "Danh sách tham dự đông người: tải mẫu Excel có sẵn trên "
                   "trang, điền đúng cột rồi tải lên — đừng điền vào dòng ví dụ."))

nd2.append(muc2("5.6 Đăng tin tức"))
nd2.append(cham("Chọn đúng loại (Tin tức / Bản tin hội viên / Thông báo) và "
                "chuyên mục — bộ lọc ngoài trang tin tự có thêm mục mới."))
nd2.append(cham("Tin lấy lại từ Hội cấp trên (YBA HCM): <b>bắt buộc điền ô "
                "Nguồn</b> — người đọc phải biết không phải Chi hội tổ chức."))
nd2.append(cham("Bài về một sự kiện: điền ô liên kết sự kiện để hai trang tự "
                "dẫn qua lại."))

nd2.append(muc2("5.7 Lịch hoạt động & duyệt đăng ký"))
nd2.append(cham("/quan-tri/lich-hoat-dong tạo mục lịch (hội thảo, giải thể "
                "thao, họp mặt…) — trang công khai có nút đăng ký tham gia và "
                "đăng ký tài trợ."))
nd2.append(cham("Mọi đăng ký vào trạng thái chờ; <b>duyệt rồi tên mới hiện</b> "
                "trên web. Người đăng ký qua Zalo/điện thoại: Ban Tổ chức tự "
                "thêm, hệ thống duyệt luôn."))

nd2.append(muc2("5.8 Vinh danh theo kỳ"))
nd2.append(d("/quan-tri/vinh-danh → tạo kỳ (ví dụ Quý 4/2026), hệ thống gợi ý "
             "từ số liệu giao dịch đã duyệt; công bố là trang /vinh-danh hiện "
             "bảng vàng. Không có bình chọn cảm tính."))

nd2.append(muc2("5.9 Hội phí"))
nd2.append(d("/quan-tri/hoi-phi ghi nhận từng năm. Hội viên đã đóng được xếp "
             "TRƯỚC ở danh bạ và chợ nhu cầu. <b>Chưa đóng phí không phải là "
             "rời hội</b> — hồ sơ vẫn hiện bình thường, tuyệt đối không đánh "
             "dấu “Rời hội” vì lý do hội phí."))

nd2.append(muc2("5.10 Đổi giao diện & thông tin liên hệ"))
nd2.append(d("/quan-tri/giao-dien là MỘT chỗ duy nhất cho: ảnh nền trang chủ, "
             "tiêu đề + mô tả banner, khẩu hiệu, logo, <b>KV (huy hiệu tròn "
             "của Chi hội)</b>, bộ màu, hotline, email, địa chỉ, hai fanpage. "
             "Đổi ở đây là chân trang, trang Liên hệ, trang Đăng ký, Đặt "
             "lịch, Tài trợ… đổi theo cùng lúc."))

nd2.append(muc2("5.11 Trang tĩnh: giới thiệu, quyền lợi, điều lệ"))
nd2.append(cham("/quan-tri/trang có 4 ô: phần mở đầu trang Giới thiệu; đoạn "
                "Quyền lợi hội viên (hiện ở trang Đăng ký); lời mở đầu trang "
                "Ban Chủ nhiệm; và <b>Điều lệ</b>."))
nd2.append(cham("Riêng Điều lệ: soạn và lưu xong thì trang ybacholon.vn/dieu-le "
                "TỰ XUẤT HIỆN; chưa soạn thì địa chỉ đó chưa tồn tại — không "
                "phải lỗi."))
nd2.append(cham("Trang nào bỏ trống thì web dùng nội dung mặc định — không "
                "bao giờ trống trơn."))

nd2.append(muc2("5.12 Video, khách WHO AM I?, lịch hẹn"))
nd2.append(cham("Video: tự lấy 15 video mới nhất từ kênh YouTube Chi hội; "
                "video cũ hơn thêm tay ở /quan-tri/noi-dung/video."))
nd2.append(cham("/quan-tri/khach-test: danh sách khách làm trắc nghiệm WHO AM "
                "I? kèm số điện thoại — bấm tải Excel gửi Ban Hội viên chăm sóc."))
nd2.append(cham("/quan-tri/lich-hen: đề nghị gặp Ban Chủ nhiệm từ trang "
                "/dat-lich — nhớ phản hồi sớm."))

nd2.append(muc("6. Hướng dẫn nhanh cho HỘI VIÊN (để anh chị chỉ lại)"))
nd2.append(bang([
    ["Việc", "Làm thế nào"],
    ["Đăng nhập", "ybacholon.vn/login — gõ tên đăng nhập do Chi hội gửi (dạng "
     "hv + 4 số — chính là mã hội viên viết thường) hoặc số điện thoại đã đăng ký, "
     "mật khẩu do Chi hội cấp. Quên mật khẩu thì gọi hotline, quản trị đổi hộ; "
     "đăng nhập xong vào Tổng quan → Đổi mật khẩu. Hướng dẫn: "
     "ybacholon.vn/huong-dan-dang-nhap."],
    ["Sửa hồ sơ doanh nghiệp", "Đăng nhập → Tài khoản → Hồ sơ doanh nghiệp: "
     "giới thiệu, logo, ảnh, sản phẩm – dịch vụ. Bản sửa chờ Ban Chủ nhiệm duyệt."],
    ["Đăng tin mua – bán", "Tài khoản → Tin đăng → “Đăng tin mới”: cần mua hay "
     "cần bán, ngành, mô tả. Xem được ai đã quan tâm tin của mình."],
    ["Khai giao dịch", "Khu làm việc → Giao dịch → “Khai giao dịch”: chọn đối "
     "tác, giá trị, phạm vi (nội Chi hội / liên chi hội / liên hội / ngoài). "
     "Bên kia xác nhận, Ban Chủ nhiệm duyệt là được tính điểm."],
    ["Xem thành tích", "Khu làm việc hiện chỉ số của riêng mình, thứ hạng và "
     "tình trạng hội phí."],
    ["Chân dung doanh nhân", "Tài khoản → Chân dung: 4 công cụ (thần số học, "
     "tử vi tham khảo, tính cách điều hành, khí chất) — kết quả riêng tư."],
], [42 * mm, 132 * mm]))

nd2.append(muc("7. Phân quyền — giao việc không giao chìa khoá"))
nd2.append(cham("<b>ADMIN</b> (admin, thuky): toàn quyền."))
nd2.append(cham("<b>Cán bộ ban (STAFF)</b>: chỉ có đúng quyền được tích trong "
                "13 nhóm (duyệt hồ sơ, hội phí, duyệt giao dịch, tin đăng, "
                "vinh danh, viết tin, sự kiện, trang tĩnh, giao diện, hồ sơ & "
                "tin nhắn, tài khoản…)."))
nd2.append(d("Tạo tài khoản mới ở /quan-tri/tai-khoan, có sẵn <b>bộ quyền "
             "mẫu</b>: “Thư ký Chi hội”, “Ban Truyền thông”, “Ban Xúc tiến "
             "thương mại”, “Ban Hội viên”, “Ban Sự kiện”. Khuyến nghị: mỗi "
             "người MỘT tài khoản mang tên mình — để biết ai đã làm gì; đừng "
             "đưa tài khoản admin cho nhiều người dùng chung."))

nd2.append(muc("8. Quy tắc vàng"))
nd2.append(cham("Chưa đóng hội phí ≠ rời hội — không bao giờ đánh dấu rời hội "
                "vì hội phí."))
nd2.append(cham("Quy mô công bố luôn là <b>“trên 150 hội viên”</b> — đừng lấy "
                "số hồ sơ trong hệ thống."))
nd2.append(cham("Tin lấy từ Hội cấp trên phải ghi nguồn."))
nd2.append(cham("Sự kiện chưa chắc ngày thì đừng bật hiện."))
nd2.append(cham("Không bịa thông tin cho doanh nghiệp hội viên."))
nd2.append(cham("Mật khẩu cấp cho hội viên chỉ hiện một lần — gửi kênh riêng, "
                "không lưu file chung."))

nd2.append(muc("9. Sự cố thường gặp"))
nd2.append(bang([
    ["Hiện tượng", "Cách xử lý"],
    ["Quên mật khẩu admin/thuky", "Tài khoản ADMIN còn lại vào "
     "/quan-tri/tai-khoan đổi hộ. Mất cả hai → nhờ người quản lý máy chủ."],
    ["Hội viên quên mật khẩu", "/quan-tri/tai-khoan → tìm mã HV → “Đổi mật "
     "khẩu” → đặt tạm → nhắn riêng."],
    ["Trang lộn xộn, mất màu", "Ctrl + F5. Vẫn lỗi → chụp màn hình gửi kỹ thuật."],
    ["Sửa nội dung web chưa đổi", "Chờ ít phút rồi Ctrl + F5; kiểm tra đã bấm "
     "Lưu và bật Hiện chưa."],
    ["Ảnh tải lên bị từ chối", "Chỉ nhận file ảnh tối đa 5 MB — thu nhỏ trước."],
    ["Không thấy một ô quản trị", "Tài khoản thiếu quyền — nhờ ADMIN tích thêm."],
    ["/dieu-le báo không tìm thấy", "Bình thường: trang chỉ xuất hiện sau khi "
     "soạn Điều lệ ở /quan-tri/trang."],
], [48 * mm, 126 * mm]))

nd2.append(muc("10. Tra cứu nhanh: muốn sửa gì thì vào đâu"))
nd2.append(bang([
    ["Muốn đổi…", "Vào"],
    ["Hotline, email, địa chỉ, fanpage, khẩu hiệu", "/quan-tri/giao-dien"],
    ["Ảnh nền trang chủ, logo, KV, bộ màu", "/quan-tri/giao-dien"],
    ["Chữ trang Giới thiệu / Quyền lợi / Điều lệ", "/quan-tri/trang"],
    ["Ảnh + chức danh Ban Chủ nhiệm", "/quan-tri/trang → tab Nhân sự các ban"],
    ["Tin tức, sự kiện, video", "/quan-tri/noi-dung/…"],
    ["Lịch hoạt động, tài trợ, thăm doanh nghiệp", "/quan-tri/lich-hoat-dong, "
     "/quan-tri/tai-tro, /quan-tri/tham-doanh-nghiep"],
    ["Hội viên, hội phí, vinh danh, tài khoản", "/quan-tri/hoi-vien, /hoi-phi, "
     "/vinh-danh, /tai-khoan"],
    ["Nhiệm kỳ, khu vực hoạt động, điều kiện gia nhập, mục tiêu, giới thiệu "
     "YBA HCM", "Nằm cố định trong mã nguồn — nhắn người phụ trách kỹ thuật "
     "kèm tên mục"],
], [80 * mm, 94 * mm]))

nd2.append(Spacer(1, 8))
nd2.append(vach())
nd2.append(ghi_chu(
    "Cẩm nang sử dụng & quản trị ybacholon.vn · Lưu hành nội bộ Chi hội "
    "Doanh nhân trẻ Chợ Lớn · Nhiệm kỳ XII (2024 – 2027) · Bản toàn diện "
    "08/2026. Đọc mục 1–2 là dùng được ngay; mục 5 và 10 để tra cứu khi làm."))

lam_pdf(
    os.path.join(THU_MUC, "huong-dan-quan-tri-yba-cho-lon.pdf"),
    "Cẩm nang sử dụng &amp; quản trị website",
    "Bản toàn diện cho thư ký &amp; Ban Chủ nhiệm — đăng nhập, đổi mật khẩu, "
    "quy trình từng việc, hướng dẫn hội viên, tra cứu nhanh",
    "Tài liệu nội bộ · Có mật khẩu khởi tạo — KHÔNG chia sẻ ra ngoài",
    "Cẩm nang sử dụng & quản trị · Nội bộ",
    nd2,
)

print("Xong. Hai file nằm trong thư mục tai-lieu/")
