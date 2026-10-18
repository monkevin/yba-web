"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import {
  KHONG_HOI_VIEN,
  MOC_1010,
  TEN_PHIEN_CI,
  coHoSo,
  docMaQuet,
  dongBoDiemHoiVien,
  dongBoTatCa1010,
  ghiCheckin,
  gioPhut,
  gioVietNam,
  huyCheckin,
  khachCuaHoiVien,
  laNhomChoLon,
  lucCheckin,
  maThuMoiChuaTrung,
  ngayThang,
  napChiMucHoiVien,
  phienTheoGio,
  timHoiVienKhop,
  trongSuatMoi,
  xoaCheckinThu,
  type CachCheckin,
  type Phien1010,
} from "@/lib/checkin-1010";
import { docQuyTacDiem } from "@/lib/diem-tu-dong";
import { dongBoXacNhanTuSheet } from "@/lib/dong-bo-sheet-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

export type KetQua = { error?: string; ok?: string };

/** Mã thư mời CL-XXXXX chưa ai dùng — luật sinh mã ở src/lib/checkin-1010.ts */
const maChuaTrung = maThuMoiChuaTrung;

/** Các trang phải làm mới sau khi check-in / điểm thay đổi */
function lamMoiCheckin() {
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/quan-tri/khach-moi-1010/check-in");
  revalidatePath("/quan-tri/khach-moi-1010/da-checkin");
  revalidatePath("/quan-tri/su-kien-1010");
  revalidatePath("/bang-hoat-dong");
}

async function nguoiCoQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) throw new Error("Không có quyền");
  return user;
}

/** BTC = ê-kíp phục vụ (PG, lễ tân, photo, sinh viên hỗ trợ…) — cũng
 *  check-in như khách để BTC nắm tổng quân số có mặt tại từng thời điểm. */
const NHOM_HOP_LE = ["HOI_VIEN", "LANH_DAO", "TAI_TRO", "KHACH_MOI", "BTC"];

function lam(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Thêm một khách mời. */
export async function themKhach(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const ten = lam(fd, "ten");
  if (ten.length < 2) return { error: "Nhập họ tên khách mời." };
  const nhom = NHOM_HOP_LE.includes(lam(fd, "nhom")) ? lam(fd, "nhom") : "KHACH_MOI";

  await prisma.khachMoi1010.create({
    data: {
      ma: await maChuaTrung(),
      ten,
      danhXung: lam(fd, "danhXung") || null,
      chucDanh: lam(fd, "chucDanh") || null,
      donVi: lam(fd, "donVi") || null,
      phone: lam(fd, "phone") || null,
      email: lam(fd, "email") || null,
      nhom,
      ghiChuBTC: lam(fd, "ghiChuBTC") || null,
    },
  });
  revalidatePath("/quan-tri/khach-moi-1010");
  return { ok: `Đã thêm ${ten}.` };
}

/**
 * Dán danh sách từ Excel: mỗi dòng một khách, các cột cách nhau bằng TAB
 * (copy thẳng từ Excel là ra tab) hoặc dấu chấm phẩy:
 *   Danh xưng ; Họ tên ; Chức danh ; Đơn vị ; SĐT ; Nhóm
 * Chỉ Họ tên là bắt buộc. Nhóm: HOI_VIEN / LANH_DAO / TAI_TRO / KHACH_MOI /
 * BTC (ê-kíp phục vụ: PG, lễ tân, photo, sinh viên…).
 */
export async function nhapHangLoat(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const van = lam(fd, "danhSach");
  if (!van) return { error: "Dán danh sách vào ô trước đã." };

  const dong = van
    .split(/\r?\n/)
    .map((d) => d.trim())
    .filter(Boolean);
  if (dong.length === 0) return { error: "Không đọc được dòng nào." };
  if (dong.length > 500) return { error: "Tối đa 500 khách mỗi lần dán." };

  let them = 0;
  let trung = 0;
  for (const d of dong) {
    const cot = d.split(/\t|;/).map((c) => c.trim());
    const [danhXung, ten, chucDanh, donVi, phone, nhomTho] = cot;
    if (!ten || ten.length < 2) continue;
    // Cùng tên + cùng SĐT (hoặc cùng đơn vị khi không có SĐT) coi như đã mời
    const daCo = await prisma.khachMoi1010.findFirst({
      where: phone
        ? { ten, phone }
        : { ten, donVi: donVi || null },
    });
    if (daCo) {
      trung++;
      continue;
    }
    const nhom = NHOM_HOP_LE.includes((nhomTho || "").toUpperCase())
      ? (nhomTho || "").toUpperCase()
      : "KHACH_MOI";
    await prisma.khachMoi1010.create({
      data: {
        ma: await maChuaTrung(),
        ten,
        danhXung: danhXung || null,
        chucDanh: chucDanh || null,
        donVi: donVi || null,
        phone: phone || null,
        nhom,
      },
    });
    them++;
  }
  revalidatePath("/quan-tri/khach-moi-1010");
  return {
    ok: `Đã thêm ${them} khách${trung ? `, bỏ qua ${trung} dòng trùng` : ""}.`,
  };
}

/** BTC xếp bàn (hoặc xoá bàn khi để trống). */
export async function capNhatBan(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const id = lam(fd, "id");
  const ban = lam(fd, "ban");
  await prisma.khachMoi1010.update({
    where: { id },
    data: { ban: ban || null },
  });
  revalidatePath("/quan-tri/khach-moi-1010");
  return { ok: "Đã lưu bàn." };
}

/**
 * Check-in tại cửa; bấm lần nữa để huỷ (bấm nhầm). BA lần check-in tách
 * riêng từng phiên (Chủ tịch chốt sáng 25/09): `lan` = TOA_DAM / LE /
 * GALA (nhận cả "CHIEU" cũ = Tọa đàm cho tương thích).
 */
export async function doiCheckin(_p: KetQua, fd: FormData): Promise<KetQua> {
  const user = await nguoiCoQuyen();
  const id = lam(fd, "id");
  const lanTho = lam(fd, "lan");
  const lan: Phien1010 =
    lanTho === "GALA" ? "GALA" : lanTho === "LE" ? "LE" : "TOA_DAM";
  const khach = await prisma.khachMoi1010.findUnique({ where: { id } });
  if (!khach) return { error: "Không thấy khách này." };
  const dangCo = lucCheckin(khach, lan);
  const ten = TEN_PHIEN_CI[lan];
  // Ghi / huỷ đều qua lõi check-in để điểm hoạt động của hội viên đi theo
  let ok: string;
  if (dangCo) {
    const r = await huyCheckin(id, lan, user.name);
    ok =
      `Đã huỷ check-in ${ten}.` +
      (r?.diem?.tru ? ` Đã rút ${r.diem.tru} điểm hoạt động.` : "");
  } else {
    const r = await ghiCheckin(id, lan, {
      cach: "LE_TAN",
      nguoi: { id: user.id, ten: user.name },
    });
    ok =
      `✓ ${khach.ten} đã vào ${ten}.` +
      (r?.diem?.cong ? ` +${r.diem.cong} điểm hoạt động.` : "");
  }
  lamMoiCheckin();
  return { ok };
}

/** Bật / tắt hiện tên + số tiền của khách lên bảng vàng quỹ NCDN công khai. */
export async function doiHienQuy(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const id = lam(fd, "id");
  const khach = await prisma.khachMoi1010.findUnique({ where: { id } });
  if (!khach) return { error: "Không thấy khách này." };
  await prisma.khachMoi1010.update({
    where: { id },
    data: { quyCongKhai: !khach.quyCongKhai },
  });
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/1010");
  return { ok: khach.quyCongKhai ? "Đã ẩn khỏi bảng vàng." : "Đã hiện lên bảng vàng." };
}

/**
 * Kéo xác nhận tham dự từ Google Sheet master của BTC (đa số khách xác
 * nhận qua Zalo/điện thoại, BTC ghi sheet). Chi tiết luật khớp và ghi ở
 * src/lib/dong-bo-sheet-1010.ts. Bấm lại bao nhiêu lần cũng an toàn.
 */
export async function dongBoTuSheet(_p: KetQua, _fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const kq = await dongBoXacNhanTuSheet(true);
  if (kq.loi) return { error: kq.loi };
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/1010");
  const phu = [
    kq.nhapNhang.length
      ? `${kq.nhapNhang.length} người trùng tên cần xử tay: ${kq.nhapNhang.slice(0, 5).join(", ")}${kq.nhapNhang.length > 5 ? "…" : ""}`
      : "",
    kq.khongThayTrongWeb
      ? `${kq.khongThayTrongWeb} người có phản hồi trong sheet nhưng chưa nằm trong danh sách mời trên web`
      : "",
    kq.banBoQua.length
      ? `${kq.banBoQua.length} dòng tab xếp bàn không khớp được: ${kq.banBoQua.slice(0, 5).join(", ")}${kq.banBoQua.length > 5 ? "…" : ""}`
      : "",
    kq.loiTabBan ?? "",
  ].filter(Boolean).join(" · ");
  return {
    ok:
      `Đã đối chiếu ${kq.daDoc} dòng có phản hồi trong sheet: ` +
      `${kq.xacNhan} chuyển thành xác nhận, ${kq.vang} xin vắng, ` +
      `${kq.giuNguyen} đã đúng từ trước` +
      (kq.banGhi
        ? `. 🪑 Ghi số bàn cho ${kq.banGhi} khách theo tab "DS Tiệc & Xếp bàn"`
        : "") +
      `.` + (phu ? ` (${phu})` : ""),
  };
}

/** Ẩn / hiện một khách trên danh sách công khai của landing ("Những gương
 *  mặt sẽ hội tụ") — dùng cho khách nhạy cảm không muốn nêu tên. */
export async function doiAnDanhSach(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const id = lam(fd, "id");
  const khach = await prisma.khachMoi1010.findUnique({ where: { id } });
  if (!khach) return { error: "Không thấy khách này." };
  await prisma.khachMoi1010.update({
    where: { id },
    data: { anKhoiDanhSach: !khach.anKhoiDanhSach },
  });
  revalidatePath("/quan-tri/khach-moi-1010");
  revalidatePath("/1010");
  return {
    ok: khach.anKhoiDanhSach
      ? "Đã hiện lại trên landing."
      : "Đã ẩn khỏi danh sách công khai.",
  };
}

/** Xoá một khách (mời nhầm). */
export async function xoaKhach(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  await prisma.khachMoi1010.delete({ where: { id: lam(fd, "id") } });
  revalidatePath("/quan-tri/khach-moi-1010");
  return { ok: "Đã xoá." };
}


// ─────────────── QUÉT MÃ QR tại cửa (Chủ tịch đặt hàng 01/10/2026) ───────────────

export type KetQuaQuet = {
  /**
   * MOI = vừa check-in · DA_CO = phiên này đã vào từ trước · NGOAI_SUAT =
   * khách không có suất mời phiên này (chưa ghi) · KHONG_THAY = mã lạ ·
   * LOI = hết phiên đăng nhập / thiếu quyền
   */
  kieu: "MOI" | "DA_CO" | "NGOAI_SUAT" | "KHONG_THAY" | "LOI";
  /** Chạy thử — không ghi gì vào CSDL */
  thu: boolean;
  thongBao: string;
  id?: string;
  ma?: string;
  ten?: string;
  moTa?: string;
  ban?: string | null;
  phien?: Phien1010;
  tenPhien?: string;
  gio?: string;
  /** Mã hội viên nếu khách là hội viên Chợ Lớn */
  hoiVien?: string | null;
  /** Dòng nói về điểm hoạt động (đã cộng / vì sao chưa cộng) */
  diem?: string;
  canhBao?: string[];
  soDaVao?: { td: number; le: number; gala: number };
};

const PHIEN_HOP_LE: Phien1010[] = ["TOA_DAM", "LE", "GALA"];

async function demDaVao() {
  const [td, le, gala] = await Promise.all([
    prisma.khachMoi1010.count({ where: { checkinLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinLeLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinGalaLuc: { not: null } } }),
  ]);
  return { td, le, gala };
}

/**
 * Lễ tân quét một mã bằng camera (hoặc gõ / dùng súng quét). Nhận mã thư
 * mời CL-XXXXX (cả khi mã nằm trong link thư mời) và thẻ hội viên
 * YBACL:HVxxxx của Zalo Mini App. `phienChon` = TU_DONG thì máy chọn phiên
 * theo giờ Việt Nam; `thu` = chỉ tra cứu, không ghi.
 *
 * Gọi thẳng từ client như một hàm (không qua form) nên trả lỗi bằng `kieu`
 * thay vì ném ngoại lệ.
 */
export async function quetMa(
  tho: string,
  phienChon: string,
  thu: boolean
): Promise<KetQuaQuet> {
  let user: Awaited<ReturnType<typeof nguoiCoQuyen>>;
  try {
    user = await nguoiCoQuyen();
  } catch {
    return {
      kieu: "LOI",
      thu,
      thongBao:
        "Phiên đăng nhập đã hết hoặc tài khoản chưa có quyền Quản lý sự kiện — đăng nhập lại rồi quét tiếp.",
    };
  }

  const doc = docMaQuet(String(tho ?? ""));
  if (!doc) {
    return {
      kieu: "KHONG_THAY",
      thu,
      thongBao:
        "Mã này không phải thư mời 10/10 (CL-…) hay thẻ hội viên YBA Chợ Lớn.",
    };
  }

  const phien: Phien1010 = PHIEN_HOP_LE.includes(phienChon as Phien1010)
    ? (phienChon as Phien1010)
    : phienTheoGio(gioVietNam().phut);
  const tenPhien = TEN_PHIEN_CI[phien];
  const canhBao: string[] = [];

  let khachId: string;
  let cach: CachCheckin = "QUET";
  if (doc.loai === "KHACH") {
    const k = await prisma.khachMoi1010.findUnique({
      where: { ma: doc.ma },
      select: { id: true },
    });
    if (!k) {
      return {
        kieu: "KHONG_THAY",
        thu,
        ma: doc.ma,
        thongBao: `Không có thư mời mã ${doc.ma} trong danh sách.`,
      };
    }
    khachId = k.id;
  } else {
    cach = "QUET_THE";
    const r = await khachCuaHoiVien(doc.code, !thu);
    if (r.loi) {
      return {
        kieu: "KHONG_THAY",
        thu,
        thongBao: `Không tìm thấy hội viên mã ${doc.code}.`,
      };
    }
    if (!r.khachId) {
      // Chỉ gặp khi chạy thử: hội viên chưa có dòng trong danh sách mời
      return {
        kieu: "MOI",
        thu: true,
        ten: r.hoiVien.name,
        hoiVien: r.hoiVien.code,
        phien,
        tenPhien,
        thongBao:
          `CHẠY THỬ — ${r.hoiVien.name} là hội viên nhưng chưa có trong danh sách mời. ` +
          "Khi ghi thật máy sẽ tự thêm vào nhóm Hội viên rồi check-in.",
      };
    }
    khachId = r.khachId;
    if (r.vuaThem) {
      canhBao.push(
        "Hội viên chưa có trong danh sách mời — máy vừa tự thêm vào nhóm Hội viên."
      );
    }
  }

  const khach = await prisma.khachMoi1010.findUnique({ where: { id: khachId } });
  if (!khach) {
    return { kieu: "KHONG_THAY", thu, thongBao: "Không đọc được thư mời này." };
  }

  const ten = [khach.danhXung, khach.ten].filter(Boolean).join(" ");
  const moTa = [khach.chucDanh, khach.donVi].filter(Boolean).join(" · ");
  if (khach.trangThai === "VANG") canhBao.push("Khách từng báo xin vắng.");
  else if (khach.trangThai !== "XAC_NHAN") {
    canhBao.push("Khách chưa xác nhận tham dự trước.");
  }
  if (khach.soKhachDiCung > 0) canhBao.push(`Đi cùng ${khach.soKhachDiCung} khách.`);
  if (khach.nhom === "BTC") canhBao.push("Ê-kíp Ban Tổ chức.");

  // Hồ sơ hội viên: đã ghép, hoặc dò trước xem lượt này sẽ ghép vào ai
  let memberId: string | null = coHoSo(khach.memberId) ? khach.memberId : null;
  if (!memberId && !khach.memberId && khach.nhom !== "BTC") {
    memberId =
      timHoiVienKhop(khach, await napChiMucHoiVien())?.hoiVien.id ?? null;
  }
  const maHV = memberId
    ? ((
        await prisma.member.findUnique({
          where: { id: memberId },
          select: { code: true },
        })
      )?.code ?? null)
    : null;

  const chung = {
    thu,
    id: khach.id,
    ma: khach.ma,
    ten,
    moTa: moTa || undefined,
    ban: khach.ban,
    phien,
    tenPhien,
    hoiVien: maHV,
  };

  if (!trongSuatMoi(khach.phienDuocMoi, phien)) {
    return {
      ...chung,
      kieu: "NGOAI_SUAT",
      canhBao,
      thongBao:
        `${ten} KHÔNG có suất mời phiên ${tenPhien} — chưa check-in. ` +
        "Nếu Ban Tổ chức đồng ý cho vào, tìm tên ở ô bên dưới rồi bấm nút phiên.",
    };
  }

  const q = await docQuyTacDiem();
  const lyDoChuaCong = (): string | undefined => {
    if (!maHV) {
      return laNhomChoLon(khach.nhom) && !khach.memberId
        ? "Chưa ghép được hồ sơ hội viên nên chưa cộng điểm — ghép ở Danh sách khách mời."
        : undefined;
    }
    if (!q.bat || q.phien1010 <= 0) return "Hội viên — đang TẮT cộng điểm tự động.";
    if (!q.dienTap && new Date() < MOC_1010) {
      return "Hội viên — điểm chỉ tính cho lượt check-in từ ngày 10.10 (muốn thử cộng điểm thì bật Diễn tập ở Bảng hoạt động).";
    }
    return undefined;
  };

  const daCo = lucCheckin(khach, phien);
  if (thu) {
    return {
      ...chung,
      kieu: daCo ? "DA_CO" : "MOI",
      canhBao,
      gio: daCo ? gioPhut(daCo) : undefined,
      diem:
        lyDoChuaCong() ??
        (maHV
          ? `Hội viên — khi ghi thật sẽ được +${q.phien1010} điểm hoạt động.`
          : undefined),
      thongBao: daCo
        ? `${ten} đã check-in ${tenPhien} lúc ${gioPhut(daCo)}.`
        : `CHẠY THỬ — đọc đúng mã của ${ten}. Chưa ghi check-in.`,
    };
  }

  const kq = await ghiCheckin(khach.id, phien, {
    cach,
    nguoi: { id: user.id, ten: user.name },
  });
  if (!kq) {
    return {
      ...chung,
      kieu: "LOI",
      thongBao: "Không ghi được check-in — thử quét lại.",
    };
  }
  lamMoiCheckin();

  let diem: string | undefined;
  if (kq.diem && kq.diem.cong > 0) {
    diem = `+${kq.diem.cong} điểm hoạt động (tổng ${kq.diem.tong} điểm ở chương trình này).`;
  } else if (kq.diem && kq.diem.tong > 0) {
    diem = `Đã có ${kq.diem.tong} điểm hoạt động ở chương trình này.`;
  } else {
    diem = lyDoChuaCong();
  }

  return {
    ...chung,
    kieu: kq.moi ? "MOI" : "DA_CO",
    canhBao,
    gio: gioPhut(kq.luc),
    diem,
    soDaVao: await demDaVao(),
    thongBao: kq.moi
      ? `✓ ${ten} đã vào ${tenPhien}.`
      : `✓ ${ten} check-in lại ${tenPhien} lúc ${gioPhut(kq.luc)}` +
        (kq.lanTruoc
          ? ` (lần trước ${gioPhut(kq.lanTruoc)} ngày ${ngayThang(kq.lanTruoc)}).`
          : "."),
  };
}

/** Huỷ một lượt vừa quét nhầm (nút "Huỷ" trong danh sách lượt quét). */
export async function huyQuet(id: string, phienTho: string): Promise<KetQua> {
  let user: Awaited<ReturnType<typeof nguoiCoQuyen>>;
  try {
    user = await nguoiCoQuyen();
  } catch {
    return { error: "Phiên đăng nhập đã hết — đăng nhập lại." };
  }
  if (!PHIEN_HOP_LE.includes(phienTho as Phien1010)) {
    return { error: "Phiên không đúng." };
  }
  const phien = phienTho as Phien1010;
  const r = await huyCheckin(String(id ?? ""), phien, user.name);
  if (!r) return { error: "Không thấy khách này." };
  lamMoiCheckin();
  return {
    ok: r.daHuy
      ? `Đã huỷ check-in ${TEN_PHIEN_CI[phien]}.` +
        (r.diem?.tru ? ` Đã rút ${r.diem.tru} điểm hoạt động.` : "")
      : "Lượt này đã được huỷ từ trước.",
  };
}

// ─────────────── Ghép khách ↔ hồ sơ hội viên, tính lại điểm ───────────────

/** BTC ghép tay một khách với hồ sơ hội viên (máy không tự ghép được). */
export async function ganHoiVien(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const id = lam(fd, "id");
  const memberId = lam(fd, "memberId");
  if (!memberId) return { error: "Chọn hồ sơ hội viên trước đã." };
  const [khach, hv] = await Promise.all([
    prisma.khachMoi1010.findUnique({
      where: { id },
      select: { id: true, ten: true, memberId: true },
    }),
    prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true, code: true, name: true },
    }),
  ]);
  if (!khach) return { error: "Không thấy khách này." };
  if (!hv) return { error: "Không tìm thấy hội viên." };
  await prisma.khachMoi1010.update({ where: { id }, data: { memberId: hv.id } });
  // Người cũ (nếu đổi từ hồ sơ khác) phải được rút điểm, người mới được cộng
  if (coHoSo(khach.memberId) && khach.memberId !== hv.id) {
    await dongBoDiemHoiVien(khach.memberId);
  }
  await dongBoDiemHoiVien(hv.id);
  lamMoiCheckin();
  return { ok: `Đã ghép ${khach.ten} với hồ sơ ${hv.code} · ${hv.name}.` };
}

/**
 * Gỡ ghép: đánh dấu khách này KHÔNG phải hội viên (máy sẽ không tự ghép
 * lại) — hoặc `che = "tra"` để trả về trạng thái "chưa ghép" cho máy dò lại.
 */
export async function boGanHoiVien(_p: KetQua, fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const id = lam(fd, "id");
  const traLai = lam(fd, "che") === "tra";
  const khach = await prisma.khachMoi1010.findUnique({
    where: { id },
    select: { id: true, ten: true, memberId: true },
  });
  if (!khach) return { error: "Không thấy khách này." };
  await prisma.khachMoi1010.update({
    where: { id },
    data: { memberId: traLai ? null : KHONG_HOI_VIEN },
  });
  if (coHoSo(khach.memberId)) await dongBoDiemHoiVien(khach.memberId);
  lamMoiCheckin();
  return {
    ok: traLai
      ? `Đã trả ${khach.ten} về "chưa ghép".`
      : `Đã ghi ${khach.ten} không phải hội viên Chợ Lớn.`,
  };
}

/** Ghép mọi khách chưa ghép rồi tính lại toàn bộ điểm check-in 10/10. */
export async function ghepVaTinhLai(_p: KetQua, _fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const r = await dongBoTatCa1010();
  lamMoiCheckin();
  const sot = r.chuaGhepChoLon.length
    ? ` Còn ${r.chuaGhepChoLon.length} khách nhóm Chợ Lớn chưa ghép được (${r.chuaGhepChoLon
        .slice(0, 4)
        .join(", ")}${r.chuaGhepChoLon.length > 4 ? "…" : ""}) — bấm ô "Chưa ghép hội viên" để ghép tay.`
    : "";
  return {
    ok:
      `Đã ghép ${r.daGhep}/${r.tongKhach} khách với hồ sơ hội viên` +
      (r.moiGhep ? ` (mới ghép ${r.moiGhep})` : "") +
      ` · ${r.soHoiVienCoDiem} hội viên có điểm check-in, tổng ${r.tongDiem} điểm.` +
      sot,
  };
}

/** Xoá các lượt check-in bấm thử TRƯỚC ngày sự kiện, quân số về 0. */
export async function xoaLuotThu(_p: KetQua, _fd: FormData): Promise<KetQua> {
  await nguoiCoQuyen();
  const n = await xoaCheckinThu();
  lamMoiCheckin();
  return {
    ok: n
      ? `Đã xoá ${n} lượt check-in thử (ghi trước ngày 10.10).`
      : "Không có lượt check-in thử nào.",
  };
}
