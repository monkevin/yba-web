import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { normalizeSearch } from "@/lib/search";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { laBanChuNhiem, nhanChucDanh } from "@/lib/vai-tro-hoi";

export const OPTIONS = moOptions;

const MOI_TRANG = 20;
/** Số hội viên mới nhất hiện ở đầu bảng tin (Ban Chủ nhiệm chốt 20/08/2026). */
const SO_HOI_VIEN_MOI = 10;

export const LOAI_TIN = [
  "TIN_VUI",
  "KHAI_TRUONG",
  "TUYEN_DUNG",
  "CHUONG_TRINH",
  "DAU_TU",
  "THIEN_NGUYEN",
  "KHAC",
] as const;

/**
 * Bảng tin nội bộ (mục 11, 15, 16, 17).
 * GET /api/mobile/bang-tin?loai=&trang=1
 *
 * Ngoài tin hội viên tự đăng, còn ghép thêm hai dòng SINH RA TỰ ĐỘNG từ dữ
 * liệu có sẵn để bảng tin không trống lúc mới chạy: hội viên mới kết nạp
 * (mục 16) và giao dịch nội bộ vừa được duyệt (mục 17).
 */
export async function GET(req: Request) {
  const member = await docHoiVien(req);
  const sp = new URL(req.url).searchParams;
  const loai = sp.get("loai")?.trim() ?? "";
  const trang = Math.max(1, Number(sp.get("trang") ?? 1) || 1);

  const where = {
    status: "DANG_HIEN",
    member: { active: true },
    ...(loai ? { loai } : {}),
  };

  const [tong, tin, hoiVienMoi] = await Promise.all([
    prisma.bangTin.count({ where }),
    prisma.bangTin.findMany({
      where,
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      skip: (trang - 1) * MOI_TRANG,
      take: MOI_TRANG,
      select: {
        id: true,
        loai: true,
        tieuDe: true,
        noiDung: true,
        images: true,
        lienKet: true,
        hanDangKy: true,
        pinned: true,
        createdAt: true,
        member: {
          select: {
            slug: true,
            name: true,
            company: true,
            avatar: true,
            logo: true,
            category: { select: { name: true, icon: true } },
          },
        },
        _count: { select: { quanTam: true } },
        ...(member
          ? { quanTam: { where: { memberId: member.id }, select: { id: true } } }
          : {}),
      },
    }),
    // 10 hội viên mới nhất — KHÔNG chặn theo mốc 60 ngày nữa: Chi hội kết nạp
    // thưa, chặn ngày làm khối này trống rỗng suốt nhiều tháng.
    trang === 1 && !loai
      ? prisma.member.findMany({
          where: { active: true, publicVisible: true },
          orderBy: { joinedAt: "desc" },
          take: SO_HOI_VIEN_MOI,
          select: {
            slug: true,
            name: true,
            company: true,
            avatar: true,
            logo: true,
            joinedAt: true,
            hoiRole: true,
            category: { select: { name: true, icon: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  // Sinh nhật trong THÁNG NÀY — thông tin cá nhân nên chỉ hội viên đã xác thực
  // mới xem được, cùng nguyên tắc với /api/mobile/lich.
  const sinhNhat = trang === 1 && !loai && member ? await docSinhNhatThangNay(member.id) : [];

  return moJson({
    tong,
    trang,
    soTrang: Math.max(1, Math.ceil(tong / MOI_TRANG)),
    laHoiVien: !!member,
    tin: tin.map((t) => ({
      ...t,
      soQuanTam: t._count.quanTam,
      toiDaQuanTam: Array.isArray((t as { quanTam?: unknown[] }).quanTam)
        ? (t as { quanTam: unknown[] }).quanTam.length > 0
        : false,
      member: { ...t.member, company: tenDoanhNghiep(t.member.company) },
    })),
    hoiVienMoi: hoiVienMoi.map((m) => ({
      ...m,
      company: tenDoanhNghiep(m.company),
      chucDanh: nhanChucDanh(m.hoiRole),
    })),
    sinhNhat,
  });
}

/**
 * Hội viên có sinh nhật trong tháng dương lịch hiện tại, kèm số đã nhận lời
 * chúc trong năm nay và người xem đã chúc chưa.
 *
 * Trả cả `phone` và `zaloUserId` để Mini App mở được cửa sổ chat / cuộc gọi —
 * chỉ gọi hàm này khi người xem ĐÃ xác thực hội viên.
 */
async function docSinhNhatThangNay(nguoiXemId: string) {
  const thang = new Date().getMonth() + 1;
  const nam = new Date().getFullYear();

  const ai = await prisma.member.findMany({
    where: { active: true, publicVisible: true, birthday: { not: null } },
    select: {
      id: true,
      slug: true,
      name: true,
      company: true,
      avatar: true,
      logo: true,
      birthday: true,
      hoiRole: true,
      phone: true,
    },
  });

  const trongThang = ai.filter((m) => m.birthday!.getMonth() + 1 === thang);
  if (!trongThang.length) return [];

  const ids = trongThang.map((m) => m.id);
  const [daChuc, phien] = await Promise.all([
    prisma.loiChuc.findMany({
      where: { nhanId: { in: ids }, nam },
      select: { nhanId: true, guiId: true },
    }),
    // Mã người dùng Zalo lấy từ phiên đăng nhập gần nhất của họ trên Mini App;
    // ai chưa từng mở app thì không có, khi đó chỉ hiện nút gọi điện.
    prisma.phienMiniApp.findMany({
      where: { memberId: { in: ids }, zaloUserId: { not: null } },
      orderBy: { lanCuoi: "desc" },
      select: { memberId: true, zaloUserId: true },
    }),
  ]);

  const zaloCua = new Map<string, string>();
  for (const p of phien) {
    if (p.memberId && p.zaloUserId && !zaloCua.has(p.memberId)) {
      zaloCua.set(p.memberId, p.zaloUserId);
    }
  }

  return trongThang
    .map((m) => ({
      slug: m.slug,
      name: m.name,
      company: tenDoanhNghiep(m.company),
      avatar: m.avatar,
      logo: m.logo,
      chucDanh: nhanChucDanh(m.hoiRole),
      ngay: m.birthday!.getDate(),
      thang,
      phone: m.phone,
      zaloUserId: zaloCua.get(m.id) ?? null,
      laToi: m.id === nguoiXemId,
      soLoiChuc: daChuc.filter((c) => c.nhanId === m.id).length,
      toiDaChuc: daChuc.some((c) => c.nhanId === m.id && c.guiId === nguoiXemId),
    }))
    .sort((a, b) => a.ngay - b.ngay);
}

/**
 * Hội viên đăng tin lên bảng tin nội bộ.
 * POST /api/mobile/bang-tin  { loai, tieuDe, noiDung, lienKet, hanDangKy }
 *
 * Tin của hội viên thường vào trạng thái CHO_DUYET, Ban Chủ nhiệm duyệt ở
 * /quan-tri/bang-tin mới hiện. Người có chức danh trong Ban Chủ nhiệm đăng là
 * hiện ngay (Ban Chủ nhiệm chốt 20/08/2026).
 */
export async function POST(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  let than: Record<string, unknown>;
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const tieuDe = String(than.tieuDe ?? "").trim();
  const noiDung = String(than.noiDung ?? "").trim();
  if (tieuDe.length < 5) return moJson({ error: "Tiêu đề quá ngắn" }, 400);
  if (noiDung.length < 10) return moJson({ error: "Viết thêm nội dung giúp anh/chị" }, 400);

  const loai = LOAI_TIN.includes(than.loai as (typeof LOAI_TIN)[number])
    ? String(than.loai)
    : "KHAC";

  const hanDangKy = than.hanDangKy ? new Date(String(than.hanDangKy)) : null;
  if (hanDangKy && Number.isNaN(hanDangKy.getTime())) {
    return moJson({ error: "Hạn đăng ký không hợp lệ" }, 400);
  }

  const mienDuyet = laBanChuNhiem(member.hoiRole);

  const tin = await prisma.bangTin.create({
    data: {
      memberId: member.id,
      loai,
      tieuDe: tieuDe.slice(0, 200),
      noiDung: noiDung.slice(0, 3000),
      lienKet: than.lienKet ? String(than.lienKet).slice(0, 500) : null,
      hanDangKy,
      status: mienDuyet ? "DANG_HIEN" : "CHO_DUYET",
      searchText: normalizeSearch(`${tieuDe} ${noiDung} ${member.company}`),
    },
    select: { id: true, tieuDe: true, status: true },
  });

  return moJson({ ok: true, tin, mienDuyet, phaiDuyet: !mienDuyet });
}
