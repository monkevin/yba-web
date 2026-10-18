/**
 * Đấu trí sự kiện — CHỈ MÁY CHỦ. Ban Điều hành mở một phiên tại buổi sinh
 * hoạt; hội viên có mặt vào bằng mã, chơi trên điện thoại; bảng xếp hạng cập
 * nhật liên tục để chiếu lên màn hình sân khấu. Lượt chơi dùng chung bộ máy
 * `dong-co.ts` (NnLuot với tramMa "DAU:<id>").
 *
 * Số câu của bộ ngẫu nhiên và giây mặc định theo `nn.luat.dauTri`; bộ câu /
 * câu Ban Điều hành ẩn (`nn.boCauAn`) không vào đề phiên mới. Đề đã rút lưu
 * trong `NnDauTri.deBai` nên đổi luật / ẩn câu không làm lệch phiên đã tạo.
 */
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import {
  deBaiTuBoCau,
  rutCauTracNghiem,
  TIEN_TO_DAU,
  xaoLaiPhuongAn,
  type MucDeBai,
} from "./dong-co";
import { DAU_TRI } from "./luat";
import { CHANG } from "./noi-dung";
import { GIAO_DICH, LoiGame } from "./so-cai";
import kinhTe202609 from "./noi-dung/dau-tri/kinh-te-2026-09.json";
import { BO_THEO_MA, deBaiTuBo, khoBoCau } from "./bo-cau";
import { docBoCauAn, docMuc, docTinhNang } from "./cai-dat";
import { GIOI_HAN_LUAT } from "./cai-dat/luat-choi";
import type { BoCauAn } from "./cai-dat/noi-dung-sua";

type BoSoanSan = {
  ma: string;
  ten: string;
  moTa: string;
  nguon: string;
  cau: { hoi: string; phuongAn: string[]; dung: number; giai: string }[];
};
const BO_SOAN_SAN: BoSoanSan[] = [kinhTe202609 as BoSoanSan];

export const NGAN_HANG = "NGAN_HANG";

export type NhomBoCauDauTri = {
  ten: string;
  bo: { ma: string; ten: string; moTa: string }[];
};

/**
 * Nhóm bộ câu Ban Điều hành chọn khi mở phiên: soạn sẵn + 22 trạm, rồi ~100 bộ
 * thách đấu theo chủ đề (đã bỏ bộ đang ẩn). `soCau` = số câu của lựa chọn rút
 * ngẫu nhiên từ 22 trạm (`nn.luat.dauTri.soCau`).
 */
export function nhomBoCauDauTri(
  an?: BoCauAn | null,
  soCau: number = DAU_TRI.SO_CAU,
): NhomBoCauDauTri[] {
  return [
    {
      ten: "Soạn cho sự kiện & hành trình 22 trạm",
      bo: [
        ...BO_SOAN_SAN.map((b) => ({
          ma: b.ma,
          ten: `${b.ten} (${b.cau.length} câu)`,
          moTa: b.moTa,
        })),
        {
          ma: NGAN_HANG,
          ten: `Ngẫu nhiên ${soCau} câu từ 22 trạm`,
          moTa: "Trải đều các chặng, chỉ câu trắc nghiệm / tình huống.",
        },
        ...CHANG.map((c) => ({
          ma: `CHANG_${c.so}`,
          ten: `Chặng ${c.so} · ${c.ten} — ${soCau} câu`,
          moTa: c.moTa,
        })),
      ],
    },
    ...khoBoCau(an).chuDe.map((cd) => ({
      ten: cd.ten,
      bo: cd.bo.map((b) => ({
        ma: b.ma,
        ten: `${b.ten} (${b.cau.length} câu)`,
        moTa: b.moTa,
      })),
    })),
  ];
}

/** Nhóm bộ câu theo luật gốc, không ẩn gì (giữ cho mã cũ / kiểm thử). */
export const NHOM_BO_CAU_DAU_TRI: NhomBoCauDauTri[] = nhomBoCauDauTri();

/** Mọi bộ câu chọn được (phẳng) — dùng để kiểm tra mã bộ hợp lệ. */
export const BO_CAU_DAU_TRI: { ma: string; ten: string; moTa: string }[] =
  NHOM_BO_CAU_DAU_TRI.flatMap((n) => n.bo);

function deBaiCuaBo(ma: string, soCau: number, an: BoCauAn | null): MucDeBai[] {
  const soan = BO_SOAN_SAN.find((b) => b.ma === ma);
  if (soan) return deBaiTuBoCau(soan.ma, soan.cau, soan.nguon);
  const bo = khoBoCau(an).theoMa[ma];
  if (bo) return deBaiTuBo(bo);
  const chang = ma.startsWith("CHANG_") ? Number(ma.slice(6)) : undefined;
  const ids = rutCauTracNghiem(soCau, chang);
  return xaoLaiPhuongAn(ids.map((id) => ({ id, tt: [] })));
}

function maNgauNhien(): string {
  const chu = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  return `${chu[Math.floor(Math.random() * chu.length)]}${chu[Math.floor(Math.random() * chu.length)]}${Math.floor(1000 + Math.random() * 9000)}`;
}

/** Giới hạn giây mỗi câu của một phiên (khớp ô "giây mặc định" ở quản trị). */
export const GIOI_HAN_GIAY_DAU_TRI = GIOI_HAN_LUAT.dauTri.giayMacDinh;

/**
 * Ban Điều hành tạo phiên (chưa mở). Giây trống / không hợp lệ → giây mặc
 * định theo luật. Tạo được cả khi tính năng đang tắt (chuẩn bị trước sự kiện).
 */
export async function taoDauTri(d: {
  ten: string;
  moTa?: string | null;
  boCau: string;
  giayMoiCau: number;
}) {
  const ten = d.ten.trim().slice(0, 120);
  if (!ten)
    throw new LoiGame("Nhập tên phiên, ví dụ “Đấu trí – Họp mặt Quý IV”");
  // Đọc luật + câu ẩn trước mọi thao tác ghi (SQLite một kết nối)
  const [luat, an] = await Promise.all([docMuc("luat"), docBoCauAn()]);
  const soCau = luat.dauTri.soCau;
  if (
    !nhomBoCauDauTri(an, soCau).some((n) => n.bo.some((b) => b.ma === d.boCau))
  )
    throw new LoiGame(
      BO_THEO_MA[d.boCau]
        ? "Bộ câu này đang bị ẩn (Nội dung → Kho bộ câu) — chọn bộ khác."
        : "Chọn bộ câu hỏi",
    );
  const [min, max] = GIOI_HAN_GIAY_DAU_TRI;
  const giay = Math.min(
    max,
    Math.max(min, Math.round(d.giayMoiCau) || luat.dauTri.giayMacDinh),
  );
  const deBai = deBaiCuaBo(d.boCau, soCau, an);
  if (deBai.length < 5) throw new LoiGame("Bộ câu chưa đủ câu hỏi");
  for (let i = 0; i < 5; i++) {
    const maThamGia = maNgauNhien();
    try {
      return await prisma.nnDauTri.create({
        data: {
          ten,
          moTa: d.moTa?.trim().slice(0, 500) || null,
          boCau: d.boCau,
          deBai: JSON.stringify(deBai),
          giayMoiCau: giay,
          maThamGia,
        },
      });
    } catch {
      /* trùng mã — thử mã khác */
    }
  }
  throw new LoiGame("Không tạo được mã tham gia, thử lại");
}

export async function doiTrangThaiDauTri(
  id: string,
  trangThai: "DANG_MO" | "DA_DONG",
) {
  await prisma.nnDauTri.update({
    where: { id },
    data: {
      trangThai,
      ...(trangThai === "DANG_MO"
        ? { moLuc: new Date() }
        : { dongLuc: new Date() }),
    },
  });
}

/**
 * Mở lại phiên đã đóng (bấm nhầm "Đóng", hoặc chơi tiếp buổi sau). Người đã
 * chơi xong vẫn giữ lượt cũ — mỗi người một lượt mỗi phiên.
 */
export async function moLaiDauTri(id: string): Promise<void> {
  const cn = await prisma.nnDauTri.updateMany({
    where: { id, trangThai: "DA_DONG" },
    data: { trangThai: "DANG_MO", moLuc: new Date(), dongLuc: null },
  });
  if (cn.count !== 1)
    throw new LoiGame("Chỉ mở lại được phiên đã đóng — tải lại trang để xem.");
}

/**
 * Xoá phiên CHƯA AI CHƠI (thường là phiên tạo nhầm). Phiên đang mở phải đóng
 * trước; phiên đã có người chơi giữ lại để không mất kết quả và điểm.
 *
 * Kiểm và xoá nằm trong CÙNG một giao dịch (chỉ `tx.*`): trước đây đếm lượt
 * xong mới `deleteMany` ở hai bước rời nhau, có người vào chơi đúng khe giữa
 * hai bước là phiên biến mất mà `NnLuot` "DAU:<id>" còn mồ côi.
 */
export async function xoaDauTri(id: string): Promise<{ ten: string }> {
  return prisma.$transaction(async (tx) => {
    const phien = await tx.nnDauTri.findUnique({
      where: { id },
      select: { ten: true, trangThai: true },
    });
    if (!phien) throw new LoiGame("Không tìm thấy phiên — có thể đã xoá rồi.");
    if (phien.trangThai === "DANG_MO")
      throw new LoiGame("Phiên đang mở — bấm “Đóng phiên” trước khi xoá.");
    const soLuot = await tx.nnLuot.count({
      where: { tramMa: `${TIEN_TO_DAU}${id}` },
    });
    if (soLuot > 0)
      throw new LoiGame(
        `Phiên đã có ${soLuot} người chơi — giữ lại để không mất kết quả. Chỉ xoá được phiên chưa ai chơi.`,
      );
    const cn = await tx.nnDauTri.deleteMany({
      where: { id, trangThai: { not: "DANG_MO" } },
    });
    if (cn.count !== 1)
      throw new LoiGame(
        "Phiên vừa đổi trạng thái — tải lại trang rồi thử lại.",
      );
    return { ten: phien.ten };
  }, GIAO_DICH);
}

/** Phiên đang mở (để hội viên vào) — mới nhất trước. */
export function dauTriDangMo() {
  return prisma.nnDauTri.findMany({
    where: { trangThai: "DANG_MO" },
    orderBy: { moLuc: "desc" },
  });
}

/** Hội viên nhập mã tham gia. Ban Điều hành tắt Đấu trí thì không vào phiên mới được. */
export async function timTheoMa(ma: string) {
  const tn = await docTinhNang();
  if (!tn.dauTri)
    throw new LoiGame(
      "Đấu trí sự kiện đang tạm đóng — Ban Điều hành sẽ mở lại khi có sự kiện.",
      "TAT",
    );
  const m = ma.trim().toUpperCase();
  if (!m) return null;
  return prisma.nnDauTri.findUnique({ where: { maThamGia: m } });
}

export type DongBangDauTri = {
  userId: string;
  hang: number;
  ten: string;
  congTy: string | null;
  anh: string | null;
  diem: number;
  soDung: number;
  ms: number;
  laToi: boolean;
};

/**
 * Bảng xếp hạng một phiên: điểm cao trước, bằng điểm thì tổng thời gian trả lời
 * ít hơn trước. Kèm danh sách người đang chơi dở (có mặt tại sự kiện).
 */
export async function bangDauTri(dauTriId: string, userId?: string) {
  const tramMa = `${TIEN_TO_DAU}${dauTriId}`;
  const luot = await prisma.nnLuot.findMany({
    where: { tramMa },
    select: {
      id: true,
      userId: true,
      diem: true,
      soDung: true,
      trangThai: true,
      createdAt: true,
    },
  });
  const ids = [...new Set(luot.map((l) => l.userId))];
  const [users, thoiGian] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        member: { select: { name: true, company: true, avatar: true } },
      },
    }),
    prisma.nnTraLoi.groupBy({
      by: ["luotId"],
      where: { luotId: { in: luot.map((l) => l.id) } },
      _sum: { thoiGianMs: true },
    }),
  ]);
  const ten = new Map(users.map((u) => [u.id, u]));
  const ms = new Map(thoiGian.map((t) => [t.luotId, t._sum.thoiGianMs ?? 0]));
  const xong = luot
    .filter((l) => l.trangThai === "XONG")
    .map((l) => ({ l, ms: ms.get(l.id) ?? 0 }))
    .sort(
      (a, b) =>
        b.l.diem - a.l.diem ||
        a.ms - b.ms ||
        a.l.createdAt.getTime() - b.l.createdAt.getTime(),
    );
  const dong: DongBangDauTri[] = xong.map(({ l, ms: t }, i) => {
    const u = ten.get(l.userId);
    return {
      userId: l.userId,
      hang: i + 1,
      ten: u?.member?.name ?? u?.name ?? "Hội viên",
      congTy: u?.member?.company ? tenDoanhNghiep(u.member.company) : null,
      anh: u?.member?.avatar ?? null,
      diem: l.diem,
      soDung: l.soDung,
      ms: t,
      laToi: l.userId === userId,
    };
  });
  const dangChoi = luot
    .filter((l) => l.trangThai === "DANG_CHOI")
    .map((l) => {
      const u = ten.get(l.userId);
      return {
        userId: l.userId,
        ten: u?.member?.name ?? u?.name ?? "Hội viên",
        congTy: u?.member?.company ? tenDoanhNghiep(u.member.company) : null,
      };
    });
  return {
    dong,
    dangChoi,
    soNguoi: ids.length,
    cuaToi: dong.find((d) => d.laToi) ?? null,
  };
}

/** Lượt của tôi trong một phiên (nếu có). */
export function luotCuaToi(userId: string, dauTriId: string) {
  return prisma.nnLuot.findFirst({
    where: { userId, tramMa: `${TIEN_TO_DAU}${dauTriId}` },
    orderBy: { createdAt: "desc" },
    select: { id: true, trangThai: true, diem: true, soDung: true },
  });
}

/** Số câu chính của một đề bài đã lưu (không tính câu thưởng). */
export function soCauDeBai(deBaiJson: string | null | undefined): number {
  try {
    const ds = JSON.parse(deBaiJson ?? "[]") as { thuong?: unknown }[];
    return Array.isArray(ds) ? ds.filter((m) => !m?.thuong).length : 0;
  } catch {
    return 0;
  }
}
