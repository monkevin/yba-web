"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { normalizeSearch } from "@/lib/search";
import { uniqueSlug } from "@/lib/slug";
import { MUC_DICH_DAU_GIA } from "./muc-dich";

export type KetQuaUD = { error?: string; ok?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}
function ngay(fd: FormData, k: string): Date | null {
  const v = chuoi(fd, k);
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
function tien(fd: FormData, k: string): number | null {
  const v = Number(chuoi(fd, k).replace(/[^\d.]/g, ""));
  return Number.isFinite(v) && v > 0 ? v : null;
}

/**
 * Hội viên tự đăng ƯU ĐÃI DOANH NGHIỆP (dùng bảng UuDai chung với Zalo
 * Mini App — đăng ở web là Mini App thấy luôn và ngược lại). Cần tài
 * khoản đã gắn hồ sơ hội viên; đăng là hiện ngay (DANG_HIEN).
 */
export async function dangUuDaiDN(_p: KetQuaUD, fd: FormData): Promise<KetQuaUD> {
  const user = await requireUser();
  if (!user.memberId) {
    return {
      error:
        "Tài khoản chưa gắn hồ sơ hội viên — nhờ Thư ký gắn hồ sơ hoặc đăng giúp ở trang quản trị.",
    };
  }
  const title = chuoi(fd, "title").slice(0, 120);
  const mucUuDai = chuoi(fd, "mucUuDai").slice(0, 200);
  if (title.length < 5) return { error: "Nhập tên sản phẩm / dịch vụ ưu đãi." };
  if (mucUuDai.length < 2) return { error: "Nhập giá trị ưu đãi (vd: Giảm 20%)." };

  const slug = await uniqueSlug(title, async (s) =>
    !!(await prisma.uuDai.findUnique({ where: { slug: s } }))
  );
  await prisma.uuDai.create({
    data: {
      slug,
      memberId: user.memberId,
      title,
      mucUuDai,
      summary: chuoi(fd, "summary").slice(0, 500) || null,
      dieuKien: chuoi(fd, "dieuKien").slice(0, 500) || null,
      startAt: ngay(fd, "startAt"),
      expiresAt: ngay(fd, "expiresAt"),
      searchText: normalizeSearch(`${title} ${mucUuDai}`),
    },
  });
  revalidatePath("/uu-dai");
  return { ok: `Đã đăng ưu đãi “${title}” — hội viên thấy ngay trên web và Mini App.` };
}

/** Hội viên bấm "Tôi quan tâm" một ưu đãi DN — bấm lại là bỏ. */
export async function quanTamUuDai(_p: KetQuaUD, fd: FormData): Promise<KetQuaUD> {
  const user = await requireUser();
  if (!user.memberId) {
    return { error: "Tài khoản chưa gắn hồ sơ hội viên nên chưa ghi nhận quan tâm được." };
  }
  const uuDaiId = chuoi(fd, "id");
  const cu = await prisma.uuDaiLead.findFirst({
    where: { uuDaiId, memberId: user.memberId, hanhDong: "QUAN_TAM" },
  });
  if (cu) {
    await prisma.uuDaiLead.delete({ where: { id: cu.id } });
    revalidatePath("/uu-dai");
    return { ok: "Đã bỏ quan tâm." };
  }
  await prisma.uuDaiLead.create({
    data: { uuDaiId, memberId: user.memberId, hanhDong: "QUAN_TAM" },
  });
  revalidatePath("/uu-dai");
  return { ok: "Đã ghi nhận — chủ ưu đãi sẽ thấy anh/chị quan tâm." };
}

/**
 * Đăng HOT DEAL CÁ NHÂN: đồ mình không dùng, bán giá ưu tiên hội viên
 * (vd đồng hồ mua 20tr đăng 2tr). Người đăng có toàn quyền bán hay không
 * — web chỉ là nơi niêm yết và ghi nhận ai quan tâm.
 */
export async function dangHotDeal(_p: KetQuaUD, fd: FormData): Promise<KetQuaUD> {
  const user = await requireUser();
  const tieuDe = chuoi(fd, "tieuDe").slice(0, 120);
  const lienHe = chuoi(fd, "lienHe").slice(0, 100);
  if (tieuDe.length < 5) return { error: "Nhập tên món đồ." };
  if (lienHe.length < 6) return { error: "Nhập liên hệ (SĐT/Zalo) để hội viên chốt." };
  const giaHV = tien(fd, "giaHV");
  if (!giaHV) return { error: "Nhập giá ưu tiên hội viên (VNĐ)." };

  await prisma.hotDeal.create({
    data: {
      loai: "CA_NHAN",
      memberId: user.memberId,
      tenNguoiDang: user.name,
      tieuDe,
      moTa: chuoi(fd, "moTa").slice(0, 800) || null,
      giaGoc: tien(fd, "giaGoc"),
      giaHV,
      lienHe,
      denNgay: ngay(fd, "denNgay"),
      nguoiTaoId: user.id,
    },
  });
  revalidatePath("/uu-dai");
  return { ok: `Đã đăng “${tieuDe}” — chỉ hội viên đăng nhập thấy được.` };
}

/**
 * BTC mở PHIÊN ĐẤU GIÁ: chọn mục đích (thiện nguyện / gây quỹ Chi hội /
 * cá nhân trích %), gắn được vào một sự kiện của Chi hội, và chọn có
 * CÔNG KHAI trên trang /dau-gia của website không (ai cũng xem, chỉ hội
 * viên trả giá).
 */
export async function taoDauGia(_p: KetQuaUD, fd: FormData): Promise<KetQuaUD> {
  const user = await requireUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) {
    return { error: "Chỉ Ban Tổ chức (quyền Quản lý sự kiện) mở được phiên đấu giá." };
  }
  const tieuDe = chuoi(fd, "tieuDe").slice(0, 120);
  const giaKhoiDiem = tien(fd, "giaKhoiDiem");
  const buocGia = tien(fd, "buocGia");
  const denNgay = ngay(fd, "denNgay");
  if (tieuDe.length < 5) return { error: "Nhập tên vật phẩm đấu giá." };
  if (!giaKhoiDiem || !buocGia) return { error: "Nhập giá khởi điểm và bước giá (VNĐ)." };
  if (!denNgay || denNgay <= new Date()) {
    return { error: "Chọn thời điểm kết thúc trong tương lai." };
  }

  const mucDich = MUC_DICH_DAU_GIA[chuoi(fd, "mucDich")]
    ? chuoi(fd, "mucDich")
    : "THIEN_NGUYEN";
  const mucDichGhiChu = chuoi(fd, "mucDichGhiChu").slice(0, 200) || null;
  let trichPhanTram: number | null = null;
  if (mucDich === "CA_NHAN") {
    const t = Number(chuoi(fd, "trichPhanTram"));
    if (!Number.isFinite(t) || t < 0 || t > 100) {
      return { error: "Phiên cá nhân phải khai % trích lại cho Chi hội (0–100)." };
    }
    trichPhanTram = t;
  }
  if (mucDich === "THIEN_NGUYEN" && !mucDichGhiChu) {
    return { error: "Phiên thiện nguyện cần ghi rõ dự án/nội dung nhận tiền." };
  }

  // Gắn sự kiện: chỉ nhận slug có thật để không hiện nhầm tên
  let suKienSlug: string | null = chuoi(fd, "suKienSlug") || null;
  if (suKienSlug) {
    const lich = await prisma.lichHoatDong.findUnique({
      where: { slug: suKienSlug },
      select: { slug: true },
    });
    if (!lich) suKienSlug = null;
  }

  await prisma.hotDeal.create({
    data: {
      loai: "DAU_GIA",
      memberId: user.memberId,
      tenNguoiDang: user.name,
      tieuDe,
      moTa: chuoi(fd, "moTa").slice(0, 800) || null,
      giaKhoiDiem,
      buocGia,
      denNgay,
      lienHe: chuoi(fd, "lienHe").slice(0, 100) || null,
      mucDich,
      mucDichGhiChu,
      trichPhanTram,
      suKienSlug,
      congKhai: chuoi(fd, "congKhai") === "1",
      nguoiTaoId: user.id,
    },
  });
  revalidatePath("/uu-dai");
  revalidatePath("/dau-gia");
  return { ok: `Đã mở phiên đấu giá “${tieuDe}”.` };
}

/** Hội viên trả giá trong phiên đấu giá — hết giờ là chốt, không gia hạn. */
export async function traGia(_p: KetQuaUD, fd: FormData): Promise<KetQuaUD> {
  const user = await requireUser();
  const dealId = chuoi(fd, "id");
  const soTien = tien(fd, "soTien");
  if (!soTien) return { error: "Nhập số tiền trả giá (VNĐ)." };

  const deal = await prisma.hotDeal.findUnique({
    where: { id: dealId },
    include: { traGia: { orderBy: { soTien: "desc" }, take: 1 } },
  });
  if (!deal || deal.loai !== "DAU_GIA" || deal.an) {
    return { error: "Không tìm thấy phiên đấu giá." };
  }
  if (deal.denNgay && deal.denNgay <= new Date()) {
    return { error: "Phiên đấu giá đã kết thúc." };
  }
  const caoNhat = deal.traGia[0]?.soTien ?? 0;
  const toiThieu = Math.max(deal.giaKhoiDiem ?? 0, caoNhat + (deal.buocGia ?? 0));
  if (soTien < toiThieu) {
    return {
      error: `Giá tối thiểu hiện tại là ${toiThieu.toLocaleString("vi-VN")}đ (giá cao nhất + bước giá).`,
    };
  }
  if (soTien > 10_000_000_000) return { error: "Số tiền lớn bất thường — kiểm tra lại." };

  await prisma.hdTraGia.create({
    data: { dealId, userId: user.id, tenHien: user.name, soTien },
  });
  revalidatePath("/uu-dai");
  return { ok: `Đã ghi nhận mức giá ${soTien.toLocaleString("vi-VN")}đ của anh/chị.` };
}

/** "Tôi quan tâm" một Hot Deal cá nhân — bấm lại là bỏ. */
export async function quanTamHotDeal(_p: KetQuaUD, fd: FormData): Promise<KetQuaUD> {
  const user = await requireUser();
  const dealId = chuoi(fd, "id");
  const cu = await prisma.hdQuanTam.findUnique({
    where: { dealId_userId: { dealId, userId: user.id } },
  });
  if (cu) {
    await prisma.hdQuanTam.delete({ where: { id: cu.id } });
    revalidatePath("/uu-dai");
    return { ok: "Đã bỏ quan tâm." };
  }
  await prisma.hdQuanTam.create({
    data: { dealId, userId: user.id, tenHien: user.name },
  });
  revalidatePath("/uu-dai");
  return { ok: "Đã ghi nhận — người đăng sẽ thấy anh/chị quan tâm." };
}

/** Ẩn / hiện một Hot Deal — chủ deal hoặc người có quyền kiểm soát chợ. */
export async function anHotDeal(_p: KetQuaUD, fd: FormData): Promise<KetQuaUD> {
  const user = await requireUser();
  const deal = await prisma.hotDeal.findUnique({ where: { id: chuoi(fd, "id") } });
  if (!deal) return { error: "Không tìm thấy deal." };
  const laChu =
    deal.nguoiTaoId === user.id ||
    (!!user.memberId && deal.memberId === user.memberId);
  if (!laChu && !co(user, QUYEN.TIN_DANG_DUYET)) {
    return { error: "Chỉ người đăng hoặc Ban kiểm soát mới ẩn được." };
  }
  await prisma.hotDeal.update({
    where: { id: deal.id },
    data: { an: !deal.an },
  });
  revalidatePath("/uu-dai");
  return { ok: deal.an ? "Đã hiện lại." : "Đã ẩn deal." };
}
