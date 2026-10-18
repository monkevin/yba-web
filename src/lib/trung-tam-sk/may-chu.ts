import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { SLUG_1010 } from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { uniqueSlug } from "@/lib/slug";
import { TT_TAI_TRO_CHUA_CHOT } from "@/lib/tai-tro";
import { type QuyenBang, tuNgayNhap } from "@/lib/trung-tam-sk/bang";
import { type QuyMo, taoDuLieuMau } from "@/lib/trung-tam-sk/mau";

/**
 * TRUNG TÂM SỰ KIỆN — phần chạy ở máy chủ (quyền, tạo sự kiện theo mẫu,
 * thống kê). Check-in + điểm ở `checkin.ts`.
 */

export type QuyenSk = {
  /** Khách mời (có SĐT), BTC, công việc, kịch bản, hậu cần, thông tin */
  quanLy: boolean;
  /** Nhà tài trợ, thu chi */
  taiChinh: boolean;
  /** Màn check-in tại bàn lễ tân */
  checkin: boolean;
  /** Vào được Trung tâm (có ít nhất một trong ba quyền trên) */
  vao: boolean;
};

export function quyenSk(user: CurrentUser | null | undefined): QuyenSk {
  const quanLy = co(user, QUYEN.SU_KIEN_QUAN_LY);
  const taiChinh = co(user, QUYEN.SU_KIEN_TAI_CHINH);
  const checkin = quanLy || co(user, QUYEN.SU_KIEN_CHECKIN);
  return { quanLy, taiChinh, checkin, vao: quanLy || taiChinh || checkin };
}

export const coQuyenBang = (q: QuyenSk, can: QuyenBang) =>
  can === "TAI_CHINH" ? q.taiChinh : q.quanLy;

/**
 * Dùng ở route handler: trả người dùng nếu đủ quyền, ngược lại trả Response
 * lỗi để route trả thẳng ra.
 */
export async function nguoiDungApi(
  can: keyof Omit<QuyenSk, "vao"> | "vao"
): Promise<{ user: CurrentUser; quyen: QuyenSk } | Response> {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Phiên đăng nhập đã hết, vui lòng đăng nhập lại" }, { status: 401 });
  const quyen = quyenSk(user);
  if (!quyen[can]) return Response.json({ error: "Không có quyền thực hiện thao tác này" }, { status: 403 });
  return { user, quyen };
}

/** Người ghi điểm / người bấm check-in, dạng sổ điểm dùng */
export const nguoiGhi = (u: CurrentUser) => ({ id: u.id, ten: u.name });

/** Sự kiện + lớp tổ chức + các phiên */
export async function napSuKien(eventId: string) {
  return prisma.event.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      startAt: true,
      endAt: true,
      location: true,
      published: true,
      activityGroup: true,
      toChuc: {
        include: { phien: { orderBy: [{ order: "asc" }, { batDau: "asc" }] } },
      },
    },
  });
}

export type SuKienDaNap = NonNullable<Awaited<ReturnType<typeof napSuKien>>>;

/** Danh sách các ban đã lưu ở SkSuKien.cacBan */
export function docCacBan(json: string | null | undefined): { ten: string; moTa: string }[] {
  if (!json) return [];
  try {
    const a = JSON.parse(json);
    return Array.isArray(a)
      ? a
          .filter((x) => x && typeof x.ten === "string")
          .map((x) => ({ ten: String(x.ten), moTa: String(x.moTa ?? "") }))
      : [];
  } catch {
    return [];
  }
}

export type DuLieuTao = {
  /** Gắn vào sự kiện có sẵn (mục "Sự kiện & chương trình"); trống = tạo sự kiện mới */
  eventId?: string | null;
  tieuDe: string;
  /** YYYY-MM-DD */
  ngay: string;
  /** HH:mm */
  gio: string;
  diaDiem?: string | null;
  loai: string;
  quyMo: QuyMo;
  mucTieuKhach?: number | null;
  /** Sinh sẵn phiên, việc, kịch bản, hậu cần, dự trù chi theo mẫu */
  dungMau: boolean;
};

/**
 * Tạo lớp tổ chức (và sự kiện nếu chưa có) — trả eventId.
 * Lỗi nghiệp vụ ném `Error` có thông điệp tiếng Việt.
 */
export async function taoToChuc(d: DuLieuTao): Promise<string> {
  const ngay = tuNgayNhap(d.ngay);
  if (!ngay) throw new Error("Ngày tổ chức không hợp lệ");
  const gio = /^\d{2}:\d{2}$/.test(d.gio) ? d.gio : "08:00";
  const startAt = new Date(`${d.ngay}T${gio}:00+07:00`);
  const mau = taoDuLieuMau(d.loai, d.quyMo, ngay, gio);

  let eventId = d.eventId ?? null;
  if (eventId) {
    const ev = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, slug: true, toChuc: { select: { id: true } } },
    });
    if (!ev) throw new Error("Không tìm thấy sự kiện");
    if (ev.slug === SLUG_1010) {
      throw new Error("Lễ chuyển giao 10/10 dùng bộ công cụ riêng (Lưu trữ 10/10), không gắn vào Trung tâm.");
    }
    if (ev.toChuc) return ev.id;
  } else {
    const tieuDe = d.tieuDe.trim();
    if (!tieuDe) throw new Error("Chưa nhập tên sự kiện");
    const ev = await prisma.event.create({
      data: {
        title: tieuDe.slice(0, 200),
        startAt,
        location: d.diaDiem?.trim() || null,
        // Chưa công bố lên web — Ban Truyền thông bật ở tab Thông tin khi sẵn sàng
        published: false,
        slug: await uniqueSlug(
          tieuDe,
          async (s) => !!(await prisma.event.findUnique({ where: { slug: s } })),
          "su-kien"
        ),
      },
      select: { id: true },
    });
    eventId = ev.id;
  }

  await prisma.$transaction(async (tx) => {
    const sk = await tx.skSuKien.create({
      data: {
        eventId: eventId!,
        loai: d.loai,
        quyMo: d.quyMo,
        mucTieuKhach: d.mucTieuKhach ?? mau.mucTieuKhach,
        cacBan: JSON.stringify(mau.cacBan),
      },
      select: { id: true },
    });
    const skId = sk.id;
    // Luôn có ít nhất một phiên — xác nhận / check-in tính theo phiên
    const dsPhien = d.dungMau ? mau.phien : [{ ten: "Chương trình", order: 1 }];
    const phienIds: string[] = [];
    for (const p of dsPhien) {
      const r = await tx.skPhien.create({
        data: { skId, ten: p.ten, order: p.order, batDau: p.order === 1 ? startAt : null, diaDiem: d.diaDiem || null },
        select: { id: true },
      });
      phienIds.push(r.id);
    }
    if (!d.dungMau) return;
    await tx.skViec.createMany({ data: mau.viec.map((v) => ({ ...v, skId })) });
    await tx.skKichBan.createMany({
      data: mau.kichBan.map(({ viTriPhien, ...k }) => ({
        ...k,
        skId,
        phienId: viTriPhien === null ? null : phienIds[viTriPhien] ?? null,
      })),
    });
    await tx.skHauCan.createMany({ data: mau.hauCan.map((h) => ({ ...h, skId })) });
    await tx.skThuChi.createMany({ data: mau.thuChi.map((t) => ({ ...t, skId })) });
  });

  return eventId!;
}

// ─────────────────────────────── thống kê ───────────────────────────────

const homNay = () => new Date();

/** Số liệu tổng hợp của một sự kiện — dùng cho Dashboard và báo cáo */
export async function thongKe(eventId: string, skId: string) {
  const [phien, khach, viec, hauCan, thuChi, taiTro, btc] = await Promise.all([
    prisma.skPhien.findMany({ where: { skId }, orderBy: { order: "asc" } }),
    prisma.skKhach.findMany({
      where: { skId },
      select: {
        id: true,
        nhom: true,
        vip: true,
        memberId: true,
        moi: true,
        thamDu: { select: { phienId: true, xacNhan: true, checkinLuc: true } },
      },
    }),
    prisma.skViec.findMany({
      where: { skId },
      select: { id: true, ban: true, tieuDe: true, trangThai: true, uuTien: true, hanChot: true, nguoiLam: true },
    }),
    prisma.skHauCan.findMany({ where: { skId }, select: { trangThai: true } }),
    prisma.skThuChi.findMany({ where: { skId } }),
    prisma.taiTroSuKien.findMany({
      where: { eventId },
      select: {
        id: true,
        nhaTaiTro: true,
        mucTaiTro: true,
        hienKim: true,
        giaTri: true,
        daThu: true,
        trangThai: true,
        quyenLoi: { select: { xong: true } },
      },
    }),
    prisma.banToChuc.findMany({ where: { eventId }, select: { ban: true, memberId: true } }),
  ]);

  const theoPhien = phien.map((p) => {
    let co = 0,
      khong = 0,
      cho = 0,
      checkin = 0;
    for (const k of khach) {
      const t = k.thamDu.find((x) => x.phienId === p.id);
      if (t?.checkinLuc) checkin++;
      if (t?.xacNhan === "CO") co++;
      else if (t?.xacNhan === "KHONG") khong++;
      else cho++;
    }
    return { id: p.id, ten: p.ten, batDau: p.batDau, sucChua: p.sucChua, co, khong, cho, checkin };
  });

  const xacNhanItNhat1 = khach.filter((k) => k.thamDu.some((t) => t.xacNhan === "CO")).length;
  const daDen = khach.filter((k) => k.thamDu.some((t) => t.checkinLuc)).length;
  const hoiVienDen = khach.filter((k) => k.memberId && k.thamDu.some((t) => t.checkinLuc)).length;

  const nhomKhach = new Map<string, { tong: number; co: number; den: number }>();
  for (const k of khach) {
    const n = k.nhom?.trim() || "Chưa phân nhóm";
    const g = nhomKhach.get(n) ?? { tong: 0, co: 0, den: 0 };
    g.tong++;
    if (k.thamDu.some((t) => t.xacNhan === "CO")) g.co++;
    if (k.thamDu.some((t) => t.checkinLuc)) g.den++;
    nhomKhach.set(n, g);
  }

  const now = homNay();
  const viecMo = viec.filter((v) => v.trangThai !== "XONG");
  const viecTre = viecMo
    .filter((v) => v.hanChot && v.hanChot < now)
    .sort((a, b) => (a.hanChot!.getTime() - b.hanChot!.getTime()));
  const theoBan = new Map<string, { xong: number; mo: number; tre: number }>();
  for (const v of viec) {
    const b = v.ban?.trim() || "Chung";
    const g = theoBan.get(b) ?? { xong: 0, mo: 0, tre: 0 };
    if (v.trangThai === "XONG") g.xong++;
    else {
      g.mo++;
      if (v.hanChot && v.hanChot < now) g.tre++;
    }
    theoBan.set(b, g);
  }

  const chi = thuChi.filter((t) => t.loai === "CHI");
  const thu = thuChi.filter((t) => t.loai === "THU");
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const ttChot = taiTro.filter((t) => !TT_TAI_TRO_CHUA_CHOT.includes(t.trangThai));
  const taiChinh = {
    duTruChi: sum(chi.map((t) => t.duTru)),
    thucChi: sum(chi.map((t) => t.thucTe)),
    daTraChi: sum(chi.filter((t) => t.trangThai === "DA_TT").map((t) => t.thucTe)),
    noChi: sum(chi.filter((t) => t.trangThai !== "DA_TT").map((t) => t.thucTe)),
    duTruThu: sum(thu.map((t) => t.duTru)),
    thucThuKhac: sum(thu.map((t) => t.thucTe)),
    taiTroCamKet: sum(ttChot.map((t) => t.hienKim)),
    taiTroGiaTri: sum(ttChot.map((t) => t.giaTri)),
    taiTroDaThu: sum(ttChot.map((t) => t.daThu)),
    soNtt: ttChot.length,
    soNttDangVanDong: taiTro.filter((t) => t.trangThai === "Đang vận động").length,
    quyenLoiXong: sum(ttChot.map((t) => t.quyenLoi.filter((q) => q.xong).length)),
    quyenLoiTong: sum(ttChot.map((t) => t.quyenLoi.length)),
  };
  const tongThu = taiChinh.taiTroDaThu + taiChinh.thucThuKhac;

  return {
    phien: theoPhien,
    khach: {
      tong: khach.length,
      xacNhan: xacNhanItNhat1,
      daDen,
      hoiVienDen,
      vip: khach.filter((k) => k.vip).length,
      chuaMoi: khach.filter((k) => k.moi === "CHUA_MOI").length,
      theoNhom: [...nhomKhach.entries()]
        .map(([ten, g]) => ({ ten, ...g }))
        .sort((a, b) => b.tong - a.tong),
    },
    viec: {
      tong: viec.length,
      xong: viec.length - viecMo.length,
      tre: viecTre.length,
      dsTre: viecTre.slice(0, 8).map((v) => ({
        id: v.id,
        tieuDe: v.tieuDe,
        ban: v.ban,
        hanChot: v.hanChot,
        uuTien: v.uuTien,
        nguoiLam: v.nguoiLam,
      })),
      theoBan: [...theoBan.entries()]
        .map(([ten, g]) => ({ ten, ...g }))
        .sort((a, b) => b.xong + b.mo - (a.xong + a.mo)),
    },
    hauCan: { tong: hauCan.length, xong: hauCan.filter((h) => h.trangThai === "XONG").length },
    taiChinh: { ...taiChinh, tongThu, ketDu: tongThu - taiChinh.thucChi },
    btc: { tong: btc.length, hoiVien: btc.filter((b) => b.memberId).length },
  };
}

export type ThongKe = Awaited<ReturnType<typeof thongKe>>;
