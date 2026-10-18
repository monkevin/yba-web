"use server";

import { revalidatePath } from "next/cache";
import {
  CAC_PHIEN,
  NGAY_1010,
  NGUOI_TU_DONG,
  ghiCheckin,
  gioNgayDayDu,
  gioPhut,
  gioVietNam,
  ngayThang,
  phienTheoGio,
  soVoiNgaySuKien,
  trongSuatMoi,
  type Phien1010,
} from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";

export type KetQuaPhanHoi = {
  error?: string;
  ok?: string;
  /** Check-in ngoài thời gian sự kiện: lời hẹn thay vì ghi nhận */
  chuaDienRa?: string;
  /** Các mảnh hiển thị đẹp ở màn check-in (Chủ nhiệm chốt 24/09) */
  chao?: string;
  mota?: string;
  phuTrach?: string;
  phienText?: string;
  /** Phiên vừa được GHI NHẬN (QR riêng từng phiên — Chủ tịch đặt 07/10) */
  phienGhi?: string;
  ban?: string;
  /** Check-in Phiên 1–2: lời nhắn "không xếp bàn" thay cho số bàn */
  ghiChuBan?: string;
  /** Ô Bàn là KHU BÀN ("1-2-3-4") → các số bàn trong khu */
  khuBan?: string[];
  /** Check-in Gala: lưu ý khi bàn đã đầy (Chủ tịch dặn 07/10) */
  luuY?: string;
  /** Giờ của lần check-in vừa ghi, vd "19:32 ngày 07/10/2026" */
  lucNay?: string;
  /** Lần check-in trước ở cùng phiên (khách quét lại) */
  lanTruoc?: string;
  /** Mọi lần check-in của khách (chỉ gửi khi có từ 2 lần) */
  lichSu?: string[];
  /** Hội viên Chợ Lớn: dòng báo điểm hoạt động vừa được ghi nhận */
  diem?: string;
};

/** Tên đầy đủ ba phiên cho màn check-in */
const TEN_PHIEN_DAY: Record<Phien1010, string> = {
  TOA_DAM: "Phiên 1 · Tọa đàm",
  LE: "Phiên 2 · Lễ chuyển giao",
  GALA: "Phiên 3 · Gala & Tiệc tri ân",
};

/**
 * Khách mời phản hồi thư mời 10/10 — KHÔNG cần đăng nhập: bản thân mã thư
 * mời (chuỗi ngẫu nhiên, không đoán được) chính là chìa khoá. Chỉ cho đổi
 * các trường phản hồi, không đụng được bàn / ghi chú BTC.
 */
export async function phanHoiThuMoi(
  _prev: KetQuaPhanHoi,
  fd: FormData
): Promise<KetQuaPhanHoi> {
  const ma = String(fd.get("ma") ?? "").trim().toUpperCase();
  const phanHoi = String(fd.get("phanHoi") ?? "");
  if (!/^CL-[A-Z0-9]{5}$/.test(ma)) return { error: "Mã thư mời không đúng." };
  if (phanHoi !== "XAC_NHAN" && phanHoi !== "VANG") {
    return { error: "Vui lòng chọn xác nhận tham dự hoặc xin phép vắng." };
  }

  const khach = await prisma.khachMoi1010.findUnique({ where: { ma } });
  if (!khach) return { error: "Không tìm thấy thư mời với mã này." };

  const soKhach = Math.max(
    0,
    Math.min(20, Number(String(fd.get("soKhachDiCung") ?? "0")) || 0)
  );
  const ghiChu = String(fd.get("ghiChu") ?? "").trim().slice(0, 500) || null;

  // Các phiên khách chọn — chỉ nhận đúng ba mã hợp lệ, và nếu khách có
  // SUẤT MỜI giới hạn (tự đăng ký được duyệt) thì chỉ nhận phiên trong
  // suất — UI đã khoá nhưng máy chủ vẫn phải chặn lại
  const PHIEN_HOP_LE = ["TOA_DAM", "CHUYEN_GIAO", "GALA"];
  const suatMoi = khach.phienDuocMoi
    ? khach.phienDuocMoi.split(",").filter(Boolean)
    : null;
  const phienChon = fd
    .getAll("phien")
    .map(String)
    .filter((p) => PHIEN_HOP_LE.includes(p))
    .filter((p) => !suatMoi || suatMoi.includes(p));
  if (phanHoi === "XAC_NHAN" && phienChon.length === 0) {
    return { error: "Anh/chị chọn ít nhất một phiên sẽ tham dự nhé." };
  }

  const quanTamTaiTro = fd.get("quanTamTaiTro") === "1";
  const dongGopQuy = fd.get("dongGopQuy") === "1";
  // Số tiền cam kết cho quỹ NCDN — gõ kiểu nào cũng nhận (5.000.000 / 5tr)
  const soTienTho = String(fd.get("dongGopSoTien") ?? "").replace(/[^\d]/g, "");
  const dongGopSoTien = dongGopQuy
    ? Math.min(5_000_000_000, Number(soTienTho) || 0)
    : 0;
  const dongHanhGhiChu =
    String(fd.get("dongHanhGhiChu") ?? "").trim().slice(0, 300) || null;

  await prisma.khachMoi1010.update({
    where: { id: khach.id },
    data: {
      trangThai: phanHoi,
      xacNhanLuc: new Date(),
      soKhachDiCung: phanHoi === "XAC_NHAN" ? soKhach : 0,
      phien: phanHoi === "XAC_NHAN" ? phienChon.join(",") : null,
      quanTamTaiTro,
      dongGopQuy,
      dongHanhGhiChu:
        quanTamTaiTro || dongGopQuy ? dongHanhGhiChu : null,
      dongGopSoTien,
      ghiChu,
    },
  });
  revalidatePath(`/1010/moi/${ma}`);
  revalidatePath("/quan-tri/khach-moi-1010");

  return {
    ok:
      phanHoi === "XAC_NHAN"
        ? "Ban Tổ chức đã nhận được xác nhận của anh/chị. Hẹn gặp ngày 10.10.2026!"
        : "Ban Tổ chức đã ghi nhận. Rất tiếc vắng anh/chị dịp này — hẹn anh/chị ở các chương trình sau.",
  };
}


/**
 * Khách TỰ check-in tại cửa (quét QR của BTC → trang /1010/checkin → tìm
 * tên mình → bấm "Tôi đã đến"; hoặc nút ngay trên thiệp riêng). Không cần
 * đăng nhập; mỗi lần chỉ ghi một lần — bấm lại không đổi giờ, huỷ nhầm thì
 * BTC làm ở màn quản trị.
 *
 * Kịch bản Chủ nhiệm chốt 24/09 (tối):
 *  - NGOÀI thời gian sự kiện → KHÔNG ghi gì, hiện lời hẹn kèm tên khách +
 *    giờ/địa điểm + liên hệ Chị Kiều Linh.
 *  - ĐÚNG ngày (mở cửa check-in 13:30 – 23:00) → ghi nhận theo phiên đang
 *    diễn ra và chào bằng tên + chức danh + người phụ trách (đọc từ
 *    ghiChuBTC "Phụ trách: …") + đang ở PHIÊN nào theo giờ.
 *  - Ô ẩn thu=1 (link ?thu=1) cho BTC chạy thử, CHỈ có tác dụng TRƯỚC ngày
 *    lễ: từ ngày 10.10 trở đi mà còn nhận thì ai cũng tự check-in từ xa
 *    ngoài giờ để lấy điểm hoạt động được.
 *
 * Ghi nhận đi qua lõi `ghiCheckin` (src/lib/checkin-1010.ts): khách là hội
 * viên Chợ Lớn thì điểm hoạt động + bản ghi tham dự tự có (01/10/2026).
 */
/** Câu dặn đi kèm số bàn ở Gala — khớp với tấm QR 2 in ra */
const LUU_Y_BAN_FULL =
  "Trong trường hợp bàn của anh/chị đã full, vui lòng chọn vị trí phù hợp hoặc liên hệ BTC.";

/**
 * Ô Bàn ghi theo KHU BÀN (Chủ tịch chốt 07/10: "1-2-3-4" — khách tự chọn
 * bàn còn chỗ trong khu) → [1, 2, 3, 4]; ô ghi một số bàn thì null.
 */
function khuBan(ban: string | null): string[] | null {
  if (!ban || !/^\d+(\s*[-,–]\s*\d+)+$/.test(ban.trim())) return null;
  return ban.split(/[-,–]/).map((s) => s.trim()).filter(Boolean);
}

/** "15:30" → số phút trong ngày; sai khuôn dạng thì null */
function docGio(s: string): number | null {
  const m = s.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const p = Number(m[2]);
  return h <= 23 && p <= 59 ? h * 60 + p : null;
}

const DIA_DIEM_1010 =
  "Capella Gallery Hall — 24 Đường 3 Tháng 2, P. Hoà Hưng, TP.HCM";
const LIEN_HE_1010 = "Chị Kiều Linh — 0941 603 493";

/** Dòng "Đang diễn ra chương trình" theo khung giờ Chủ tịch chốt 04/10:
 *  14:30–16:30 Tọa đàm · 16:30–17:30 Lễ chuyển giao · 17:30–21:30 Gala &
 *  Tiệc tri ân; ngoài các khung đó ghi rõ chưa đến / đã qua giờ diễn ra. */
function tenPhienTheoGio(phut: number): string {
  if (phut < 14 * 60 + 30)
    return "Chưa đến thời gian diễn ra — Phiên 1 · Tọa đàm bắt đầu lúc 14:30";
  if (phut < 16 * 60 + 30)
    return "Đang diễn ra: Phiên 1 · Tọa đàm “Một Chợ Lớn – Một Kỷ Nguyên – Một Hành Trình” (14:30 – 16:30)";
  if (phut < 17 * 60 + 30)
    return "Đang diễn ra: Phiên 2 · Lễ chuyển giao & ra mắt Ban Điều hành nhiệm kỳ I (16:30 – 17:30)";
  if (phut <= 21 * 60 + 30)
    return "Đang diễn ra: Phiên 3 · Gala & Tiệc tri ân nhiệm kỳ XII (17:30 – 21:30)";
  return "Chương trình đã khép lại lúc 21:30 — cảm ơn anh/chị đã đồng hành";
}

export async function tuCheckin(
  _prev: KetQuaPhanHoi,
  fd: FormData
): Promise<KetQuaPhanHoi> {
  const ma = String(fd.get("ma") ?? "").trim().toUpperCase();
  const tuThiep = String(fd.get("nguon") ?? "") === "thiep";
  if (!/^CL-[A-Z0-9]{5}$/.test(ma)) return { error: "Mã không đúng." };
  const khach = await prisma.khachMoi1010.findUnique({ where: { ma } });
  if (!khach) return { error: "Không tìm thấy thư mời." };

  const xungHo = [khach.danhXung, khach.ten].filter(Boolean).join(" ");
  const { ngay, phut: phutThat } = gioVietNam();
  const soVoi = soVoiNgaySuKien();
  const chayThu = String(fd.get("thu") ?? "") === "1" && soVoi === "TRUOC";
  // Chạy thử có thể GIẢ LẬP GIỜ (?gio=15:00) để thử từng phiên bất kể bây
  // giờ là mấy giờ — chỉ khi chạy thử, ngày lễ không có tác dụng
  const gioGia = chayThu ? docGio(String(fd.get("gio") ?? "")) : null;
  const phut = gioGia ?? phutThat;
  const dangDienRa =
    ngay === NGAY_1010 && phut >= 13 * 60 + 30 && phut <= 23 * 60;
  const phienTho = String(fd.get("phien") ?? "");
  // HAI MÃ QR IN (?phien=CHIEU / GALA) MỞ NGAY từ bây giờ và quét được
  // nhiều lần (Chủ tịch chốt 07/10) — mỗi lần cập nhật giờ mới nhất + lưu
  // lịch sử; sáng 10/10 BTC bấm "Xoá lượt check-in thử" để quân số ngày lễ
  // bắt đầu từ 0. Nút trên thiệp riêng và QR chung cũ vẫn chỉ mở ngày lễ.
  const maQrIn = phienTho === "CHIEU" || phienTho === "GALA";

  if (soVoi === "SAU" || (soVoi === "DUNG_NGAY" && phut > 23 * 60)) {
    return {
      chuaDienRa:
        `Chương trình đã khép lại ngày 10.10.2026 — cảm ơn ${xungHo} đã đồng hành. ` +
        `Cần bổ sung check-in xin liên hệ ${LIEN_HE_1010}.`,
    };
  }
  if (!dangDienRa && !chayThu && !maQrIn) {
    return {
      chuaDienRa:
        `Hiện nay sự kiện chưa diễn ra. ${xungHo} vui lòng đến từ 14:00 ` +
        `(Tọa đàm bắt đầu 14:30) Thứ Bảy 10.10.2026 tại ${DIA_DIEM_1010}. ` +
        `Mọi chi tiết xin liên hệ ${LIEN_HE_1010}.`,
    };
  }

  // BA lần check-in tách phiên (Chủ tịch chốt sáng 25/09) — máy chọn theo
  // giờ VN: trước 16:30 = Tọa đàm, 16:30–17:30 = Lễ, từ 17:30 = Gala.
  // HAI MÃ QR (Chủ tịch chốt 07/10): ?phien=CHIEU = quầy đầu giờ, chỉ ghi
  // Phiên 1/2 theo giờ (không bao giờ thành Gala, không báo bàn);
  // ?phien=GALA = quầy Phiên 3, ghi thẳng Gala + báo SỐ BÀN.
  const phienGhi: Phien1010 =
    phienTho === "CHIEU"
      ? phut >= 16 * 60 + 30
        ? "LE"
        : "TOA_DAM"
      : (CAC_PHIEN as string[]).includes(phienTho)
        ? (phienTho as Phien1010)
        : phienTheoGio(phut);

  // Suất mời: khách tự đăng ký chỉ phiên 1-2 thì Gala "hiện nhưng không
  // cho check" (Chủ tịch chốt 25/09) — chặn cả ở check-in
  if (!trongSuatMoi(khach.phienDuocMoi, phienGhi)) {
    return {
      error:
        `Theo thư mời, suất của ${xungHo} chưa gồm ${TEN_PHIEN_DAY[phienGhi]}. ` +
        `Anh/chị vui lòng gặp lễ tân hoặc liên hệ ${LIEN_HE_1010} để Ban Tổ chức hỗ trợ.`,
    };
  }

  const kq = await ghiCheckin(khach.id, phienGhi, {
    cach: tuThiep ? "THIEP" : "TU",
    nguoi: NGUOI_TU_DONG,
  });
  if (!kq) return { error: "Không ghi được check-in — anh/chị thử lại giúp." };
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/quan-tri/khach-moi-1010/check-in");
  revalidatePath("/quan-tri/khach-moi-1010/da-checkin");
  revalidatePath("/quan-tri/su-kien-1010");
  revalidatePath("/bang-hoat-dong");

  // Lịch sử mọi lần check-in của khách (để khách thấy lần trước lúc nào)
  const lichSuTho = await prisma.luotCheckin1010.findMany({
    where: { khachId: khach.id, cach: { not: "HUY" } },
    orderBy: { luc: "asc" },
    select: { phien: true, luc: true },
  });
  const lichSu = lichSuTho.map(
    (l) =>
      `${gioPhut(l.luc)} ngày ${ngayThang(l.luc)} · ${TEN_PHIEN_DAY[l.phien as Phien1010] ?? l.phien}`
  );

  const phuTrach =
    khach.ghiChuBTC?.match(/Phụ trách:\s*([^·]+)/)?.[1]?.trim() ?? null;
  const mota = [khach.chucDanh, khach.donVi].filter(Boolean).join(" · ");
  // Trước ngày lễ (và không giả lập giờ) thì "đang diễn ra phiên nào" theo
  // đồng hồ hôm nay là vô nghĩa — báo lịch ngày lễ thay vào
  const phienText =
    ngay !== NGAY_1010 && gioGia === null
      ? `Sự kiện diễn ra Thứ Bảy 10.10.2026 tại ${DIA_DIEM_1010} — đón khách từ 14:00.`
      : tenPhienTheoGio(phut);
  // Chỉ lần check-in Phiên 3 (QR thứ hai) mới có xếp bàn — Phiên 1–2 tự do
  // chọn chỗ (Chủ tịch chốt 07/10)
  const coBan = phienGhi === "GALA";
  const khu = coBan ? khuBan(khach.ban) : null;
  const banText = !coBan
    ? "Phiên 1–2 không xếp bàn, anh/chị tự do chọn chỗ ngồi. Số bàn sẽ báo khi anh/chị check-in Phiên 3 (Gala)."
    : khu
      ? `Khu bàn của anh/chị: bàn ${khu.join(", ")} — mời anh/chị chọn bàn còn chỗ trong khu. ${LUU_Y_BAN_FULL}`
      : khach.ban
        ? `Bàn dự kiến của anh/chị: ${khach.ban}. ${LUU_Y_BAN_FULL}`
        : "Anh/chị vui lòng theo hướng dẫn của lễ tân để nhận chỗ.";
  const diem =
    kq?.diem && kq.diem.tong > 0
      ? kq.diem.cong > 0
        ? `+${kq.diem.cong} điểm hoạt động hội viên — tổng ${kq.diem.tong} điểm ở chương trình này.`
        : `Đã ghi nhận ${kq.diem.tong} điểm hoạt động hội viên ở chương trình này.`
      : undefined;

  return {
    chao: `Xin chào ${xungHo}!`,
    mota: mota || undefined,
    phuTrach: phuTrach ?? undefined,
    phienText,
    phienGhi: TEN_PHIEN_DAY[phienGhi],
    ban: coBan ? (khach.ban ?? undefined) : undefined,
    khuBan: khu ?? undefined,
    ghiChuBan: coBan ? undefined : banText,
    luuY: coBan && khach.ban ? LUU_Y_BAN_FULL : undefined,
    lucNay: gioNgayDayDu(kq.luc),
    lanTruoc: kq.lanTruoc ? gioNgayDayDu(kq.lanTruoc) : undefined,
    lichSu: lichSu.length > 1 ? lichSu : undefined,
    diem,
    // Chuỗi gộp cho nơi hiển thị đơn giản (nút trên thiệp riêng)
    ok: `Xin chào ${xungHo}! Đã check-in ${TEN_PHIEN_DAY[phienGhi]} lúc ${gioNgayDayDu(kq.luc)}. ${phienText} ${banText}`,
  };
}
