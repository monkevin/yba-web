/**
 * Đấu trường 1-1 — CHỈ MÁY CHỦ. Chuyển từ "Đấu Trường Thuật Ngữ" của Học viện
 * Mon Amie (gói `_DAU TRUONG - CHUYEN GIAO YBA`), đổi nguồn câu sang ngân hàng
 * 22 trạm và thưởng bằng điểm / vốn của Ngôi nhà.
 *
 * A thách B → máy chủ dựng đề từ kho ~100 bộ câu (`bo-cau.ts`, ưu tiên bộ hai
 * người chưa gặp) hoặc rút từ 22 trạm, lưu đề bài kèm đáp án trong
 * `NnTranDau.deBai`. Hai người chơi cùng bộ câu, không cần online cùng lúc;
 * client chỉ nhận câu đã giấu đáp án, nộp chỉ số đã chọn để máy chủ chấm.
 * **Thời gian làm bài do MÁY CHỦ đếm** (từ 20/09/2026): mở đề lần đầu ghi mốc
 * `thachMoLuc` / `doiThuMoLuc`, nộp bài lấy `Date.now() - mốc` — tải lại trang
 * giữa trận để xem trước câu sau rồi tra đáp án chỉ làm thời gian dài thêm.
 *
 * Số câu, giây, điểm thắng/hoà/thua lấy từ thông số Ban Điều hành chỉnh
 * (`docThongSo`); vốn và trần trận có điểm mỗi ngày theo `nn.luat.dauTruong`.
 * Giây mỗi câu lưu kèm đề bài nên đổi thông số giữa chừng không làm lệch trận
 * đang dở; điểm và vốn tính theo luật lúc trận kết thúc.
 *
 * Ban Điều hành tắt Đấu trường (`nn.tinhNang.dauTruong`) thì không tạo được
 * trận mới, trận đang dở vẫn chơi nốt. Trận treo quá lâu Ban huỷ được: trạng
 * thái "HUY" — không còn là trận dở, không nộp được nữa.
 */
import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { cauCua, cauHienThi, type MucDeBai } from "./dong-co";
import type { CauHienThi, NguoiChoi } from "./kieu";
import { DAU_TRUONG, TRANG_THAI_TRAN } from "./luat";
import { muaHienTai, type MuaHienTai } from "./mua";
import { docThongSo } from "./cau-hinh";
import { docBoCauAn, docMuc, docTinhNang } from "./cai-dat";
import { dauNgay } from "./thoi-gian";
import {
  deBaiThachDau,
  luaChonThachDau,
  maBoCuaDeBai,
  NGAU_NHIEN,
  tenBoCuaDeBai,
} from "./bo-cau";
import { GIAO_DICH, LoiGame, docJson, ghiSoCai, xetCanBang } from "./so-cai";

/** Trạng thái trận còn dở (chờ một bên chơi). Trận "HUY" không nằm trong đây. */
export const TRAN_DANG_DO = ["CHO_THACH", "CHO_DOI_THU"];

/** Nhãn trạng thái trận để hiển thị — thêm "HUY" (Ban Điều hành huỷ trận treo). */
export const NHAN_TRANG_THAI_TRAN: Record<string, string> = {
  ...TRANG_THAI_TRAN,
  HUY: "Đã huỷ",
};

const LOI_TRAN_HUY = "Trận này đã được Ban Điều hành huỷ — thách trận mới nhé.";

/**
 * Mốc lên bản "chấm giờ ở máy chủ" (16:00 giờ VN 20/09/2026).
 *
 * Trận tạo TỪ mốc này trở đi bắt buộc mở đề qua `cauTranDau` (máy chủ ghi
 * `thachMoLuc` / `doiThuMoLuc`) rồi mới nộp được — nộp thẳng bằng server action
 * mà chưa hề xem câu hỏi là cách khai "thời gian nhỏ nhất", chặn luôn.
 *
 * Trận tạo TRƯỚC mốc là dữ liệu của bản cũ: chưa có mốc mở đề nên vẫn chấm
 * theo `msKhach` (giờ trình duyệt khai, có sàn + trần như trước) để trận đang
 * dở lúc nâng cấp chơi nốt được.
 */
export const MOC_CHAM_MAY_CHU = new Date("2026-09-20T09:00:00.000Z");

export type DoiThu = {
  userId: string;
  ten: string;
  congTy: string | null;
  anh: string | null;
  tranThang: number;
  /** Điểm Vươn tầm mùa hiện tại (0 nếu chưa chơi) */
  diem: number;
};

export type KetQuaTran = {
  soDung: number;
  tong: number;
  diem: number;
  xong: boolean;
  /** null = hoà hoặc trận chưa xong */
  thang: boolean | null;
  /** Trận có được cộng điểm không (quá trần mỗi ngày thì không) */
  tinhDiem?: boolean;
  ghiChuDiem?: string | null;
  /** Vốn cộng cho người vừa nộp khi trận có điểm (theo luật lúc kết thúc) */
  von?: { TT: number; XH: number };
  xemLai: {
    hoi: string;
    phuongAn: string[];
    chon: number;
    dung: number;
    giai: string;
  }[];
};

/** Tên hiển thị + doanh nghiệp của một tài khoản chơi game. */
export async function tenNguoiChoi(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: {
      id: true,
      name: true,
      member: { select: { name: true, company: true, avatar: true } },
    },
  });
  return new Map(
    users.map((u) => [
      u.id,
      {
        ten: u.member?.name ?? u.name,
        congTy: u.member?.company ? tenDoanhNghiep(u.member.company) : null,
        anh: u.member?.avatar ?? null,
      },
    ]),
  );
}

/**
 * Tìm đối thủ. Gồm hội viên đang sinh hoạt (tìm theo tên / doanh nghiệp / mã) và
 * cả tài khoản KHÔNG gắn hồ sơ hội viên (Thư ký, Ban Chủ nhiệm, văn phòng…) nếu
 * đã vào game — trước 16/09/2026 ô tìm chỉ lọc hội viên nên gõ "thư ký" không
 * ra. Ô trống thì gợi ý người đang dẫn đầu bảng điểm mùa.
 */
export async function timDoiThu(
  nguoi: NguoiChoi,
  q: string,
): Promise<DoiThu[]> {
  const tu = normalizeSearch(q.trim());
  const mua = await muaHienTai();
  const chon = {
    id: true,
    name: true,
    member: { select: { name: true, company: true, avatar: true } },
  } as const;

  let users: {
    id: string;
    name: string;
    member: { name: string; company: string; avatar: string | null } | null;
  }[];
  if (tu) {
    const [coHv, khongHv] = await Promise.all([
      prisma.user.findMany({
        where: {
          active: true,
          id: { not: nguoi.userId },
          member: { is: { active: true, searchText: { contains: tu } } },
        },
        select: chon,
        orderBy: { name: "asc" },
        take: 20,
      }),
      prisma.user.findMany({
        where: { active: true, id: { not: nguoi.userId }, memberId: null },
        select: chon,
      }),
    ]);
    const daVaoGame = new Set(
      (
        await prisma.nnNguoiChoi.findMany({
          where: { userId: { in: khongHv.map((u) => u.id) } },
          select: { userId: true },
        })
      ).map((x) => x.userId),
    );
    const khop = khongHv.filter(
      (u) => daVaoGame.has(u.id) && normalizeSearch(u.name).includes(tu),
    );
    users = [...khop, ...coHv].slice(0, 20);
  } else {
    // Gợi ý: người có điểm mùa này cao nhất (bỏ người ẩn khỏi BXH, tài khoản khoá,
    // hội viên đã ngưng), còn chỗ thì thêm hội viên theo tên
    const an = (
      await prisma.nnNguoiChoi.findMany({
        where: { anXepHang: true },
        select: { userId: true },
      })
    ).map((x) => x.userId);
    const top = (
      await prisma.nnSoCai.groupBy({
        by: ["userId"],
        where: { muaId: mua.id, userId: { notIn: [nguoi.userId, ...an] } },
        _sum: { diem: true },
        orderBy: { _sum: { diem: "desc" } },
        take: 30,
      })
    ).filter((t) => (t._sum.diem ?? 0) > 0);
    const coDiem = (
      await prisma.user.findMany({
        where: {
          id: { in: top.map((t) => t.userId) },
          active: true,
          OR: [{ memberId: null }, { member: { is: { active: true } } }],
        },
        select: chon,
      })
    ).slice(0, 20);
    const them =
      coDiem.length < 20
        ? await prisma.user.findMany({
            where: {
              active: true,
              id: {
                notIn: [nguoi.userId, ...an, ...coDiem.map((u) => u.id)],
              },
              member: { is: { active: true } },
            },
            select: chon,
            orderBy: { name: "asc" },
            take: 20 - coDiem.length,
          })
        : [];
    users = [...coDiem, ...them];
  }

  const ids = users.map((u) => u.id);
  const [thanhTich, diemMua] = await Promise.all([
    prisma.nnNguoiChoi.findMany({
      where: { userId: { in: ids } },
      select: { userId: true, tranThang: true },
    }),
    prisma.nnSoCai.groupBy({
      by: ["userId"],
      where: { muaId: mua.id, userId: { in: ids } },
      _sum: { diem: true },
    }),
  ]);
  const thang = new Map(thanhTich.map((t) => [t.userId, t.tranThang]));
  const diem = new Map(diemMua.map((d) => [d.userId, d._sum.diem ?? 0]));
  return users
    .map((u) => ({
      userId: u.id,
      ten: u.member?.name ?? u.name,
      congTy: u.member?.company ? tenDoanhNghiep(u.member.company) : null,
      anh: u.member?.avatar ?? null,
      tranThang: thang.get(u.id) ?? 0,
      diem: diem.get(u.id) ?? 0,
    }))
    .sort((a, b) => b.diem - a.diem || a.ten.localeCompare(b.ten, "vi"));
}

/** Một đối thủ cụ thể (bấm "Thách" từ bảng xếp hạng). */
export async function thongTinDoiThu(
  nguoi: NguoiChoi,
  userId: string,
): Promise<DoiThu | null> {
  if (typeof userId !== "string" || !userId || userId === nguoi.userId)
    return null;
  const u = await prisma.user.findFirst({
    where: { id: userId, active: true },
    select: {
      id: true,
      name: true,
      member: { select: { name: true, company: true, avatar: true } },
    },
  });
  if (!u) return null;
  const mua = await muaHienTai();
  const [nc, d] = await Promise.all([
    prisma.nnNguoiChoi.findUnique({
      where: { userId },
      select: { tranThang: true },
    }),
    prisma.nnSoCai.aggregate({
      where: { userId, muaId: mua.id },
      _sum: { diem: true },
    }),
  ]);
  return {
    userId: u.id,
    ten: u.member?.name ?? u.name,
    congTy: u.member?.company ? tenDoanhNghiep(u.member.company) : null,
    anh: u.member?.avatar ?? null,
    tranThang: nc?.tranThang ?? 0,
    diem: d._sum.diem ?? 0,
  };
}

/** Mã các bộ câu một người đã gặp: trận Đấu trường gần đây + phiên Đấu trí đã chơi. */
async function boDaGap(userId: string): Promise<Set<string>> {
  const [tran, luotDauTri] = await Promise.all([
    prisma.nnTranDau.findMany({
      where: { OR: [{ thachId: userId }, { doiThuId: userId }] },
      select: { deBai: true },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.nnLuot.findMany({
      where: { userId, tramMa: { startsWith: "DAU:" } },
      select: { tramMa: true },
      distinct: ["tramMa"],
      take: 100,
    }),
  ]);
  const gap = new Set(
    tran
      .map((t) => maBoCuaDeBai(docJson<MucDeBai[]>(t.deBai, [])))
      .filter((x): x is string => !!x),
  );
  if (luotDauTri.length) {
    const phien = await prisma.nnDauTri.findMany({
      where: { id: { in: luotDauTri.map((l) => l.tramMa.slice(4)) } },
      select: { boCau: true },
    });
    for (const p of phien) gap.add(p.boCau);
  }
  return gap;
}

/** Gửi lời thách đấu: dựng đề từ bộ câu đã chọn, người thách chơi ngay. */
export async function taoTranDau(
  nguoi: NguoiChoi,
  doiThuId: string,
  chonBo: string = NGAU_NHIEN,
): Promise<string> {
  // Đọc cài đặt trước mọi thao tác khác (SQLite một kết nối)
  const [tinhNang, thongSo, an] = await Promise.all([
    docTinhNang(),
    docThongSo(),
    docBoCauAn(),
  ]);
  if (!tinhNang.dauTruong)
    throw new LoiGame(
      "Đấu trường đang tạm đóng — chưa tạo được trận mới. Trận đang dở vẫn chơi nốt được.",
      "TAT",
    );
  if (doiThuId === nguoi.userId)
    throw new LoiGame("Không thể tự thách đấu chính mình");
  const doiThu = await prisma.user.findFirst({
    where: { id: doiThuId, active: true },
    select: { id: true },
  });
  if (!doiThu) throw new LoiGame("Không tìm thấy đối thủ");
  const dangDo = await prisma.nnTranDau.findFirst({
    where: {
      trangThai: { in: TRAN_DANG_DO },
      OR: [
        { thachId: nguoi.userId, doiThuId },
        { thachId: doiThuId, doiThuId: nguoi.userId },
      ],
    },
  });
  if (dangDo)
    throw new LoiGame(
      "Hai bạn đang có một trận chưa xong — chơi nốt trận đó trước nhé",
    );
  // Bộ từng người đã gặp — đếm riêng để người thách không bốc lại bộ đã biết
  // đáp án; tính cả bộ đã dùng ở Đấu trí sự kiện
  const [gapThach, gapDoiThu] = await Promise.all([
    boDaGap(nguoi.userId),
    boDaGap(doiThuId),
  ]);
  // Chỉ nhận lựa chọn có trên form (ngẫu nhiên / chủ đề / 22 trạm) — không cho
  // gửi thẳng mã một bộ để chơi lại bộ đã biết đáp án
  const chon = luaChonThachDau(an).some((x) => x.ma === chonBo)
    ? chonBo
    : NGAU_NHIEN;
  const { deBai } = deBaiThachDau(
    chon,
    thongSo.dauTruong.soCau,
    thongSo.dauTruong.giay,
    { thach: gapThach, doiThu: gapDoiThu },
    an,
  );
  if (deBai.length < 5) throw new LoiGame("Kho câu hỏi chưa đủ để mở trận");
  await prisma.nnNguoiChoi.upsert({
    where: { userId: nguoi.userId },
    create: { userId: nguoi.userId },
    update: {},
  });
  await prisma.nnNguoiChoi.upsert({
    where: { userId: doiThuId },
    create: { userId: doiThuId },
    update: {},
  });
  const tran = await prisma.nnTranDau.create({
    data: { thachId: nguoi.userId, doiThuId, deBai: JSON.stringify(deBai) },
  });
  return tran.id;
}

function toiLuot(
  tran: { trangThai: string; thachId: string; doiThuId: string },
  userId: string,
): boolean {
  return (
    (tran.trangThai === "CHO_THACH" && tran.thachId === userId) ||
    (tran.trangThai === "CHO_DOI_THU" && tran.doiThuId === userId)
  );
}

/**
 * Bộ câu (đã giấu đáp án) cho người tới lượt.
 *
 * Lần mở đề ĐẦU TIÊN của đúng bên đang tới lượt ghi mốc giờ máy chủ; ghi bằng
 * `updateMany` có điều kiện cột còn trống nên mở lại (tải lại trang giữa trận,
 * mạng rớt vào lại) KHÔNG dời mốc — giờ vẫn chạy từ lần mở đầu.
 */
export async function cauTranDau(
  nguoi: NguoiChoi,
  tranId: string,
): Promise<{ cau: CauHienThi[]; giay: number; moLuc: number }> {
  const tran = await prisma.nnTranDau.findUnique({ where: { id: tranId } });
  if (!tran) throw new LoiGame("Không tìm thấy trận đấu");
  if (tran.trangThai === "HUY") throw new LoiGame(LOI_TRAN_HUY, "HUY");
  if (!toiLuot(tran, nguoi.userId))
    throw new LoiGame("Chưa tới lượt của bạn trong trận này");
  const laThach = tran.thachId === nguoi.userId;
  await prisma.nnTranDau.updateMany({
    where: laThach
      ? { id: tranId, trangThai: tran.trangThai, thachMoLuc: null }
      : { id: tranId, trangThai: tran.trangThai, doiThuMoLuc: null },
    data: laThach ? { thachMoLuc: new Date() } : { doiThuMoLuc: new Date() },
  });
  // Đọc lại mốc: lần mở thứ hai trở đi `updateMany` không đổi gì, giá trị đọc
  // được vẫn là mốc của lần mở đầu tiên
  const sau = await prisma.nnTranDau.findUnique({
    where: { id: tranId },
    select: { thachMoLuc: true, doiThuMoLuc: true },
  });
  const moLuc = (laThach ? sau?.thachMoLuc : sau?.doiThuMoLuc) ?? new Date();
  const deBai = docJson<MucDeBai[]>(tran.deBai, []);
  return {
    cau: deBai.map(cauHienThi),
    giay: deBai[0]?.giay ?? (await docThongSo()).dauTruong.giay,
    /** Mốc máy chủ bắt đầu tính giờ (ms) — mở lại trận không dời mốc này */
    moLuc: moLuc.getTime(),
  };
}

/**
 * Nộp lượt chơi: máy chủ chấm; đủ hai bên thì phân thắng bại và cộng điểm cả hai.
 *
 * Thời gian làm bài lấy theo GIỜ MÁY CHỦ, đếm từ mốc bên này mở đề
 * (`cauTranDau`). `msKhach` — giờ trình duyệt khai — CHỈ còn dùng cho trận cũ
 * tạo trước `MOC_CHAM_MAY_CHU` (xem chú thích ở hằng đó).
 */
export async function nopTranDau(
  nguoi: NguoiChoi,
  tranId: string,
  dapAn: number[],
  msKhach: number,
): Promise<KetQuaTran> {
  const tran = await prisma.nnTranDau.findUnique({ where: { id: tranId } });
  if (!tran) throw new LoiGame("Không tìm thấy trận đấu");
  if (tran.trangThai === "HUY") throw new LoiGame(LOI_TRAN_HUY, "HUY");
  if (!toiLuot(tran, nguoi.userId))
    throw new LoiGame("Chưa tới lượt của bạn trong trận này");
  const laThach = tran.thachId === nguoi.userId;
  const moLuc = laThach ? tran.thachMoLuc : tran.doiThuMoLuc;
  // Chưa mở đề mà đã nộp = gọi thẳng server action, không qua màn chơi. Chặn
  // trước khi chấm để không trả luôn cả đáp án trong `xemLai`.
  if (!moLuc && tran.createdAt >= MOC_CHAM_MAY_CHU)
    throw new LoiGame(
      "Bạn chưa mở đề trận này — bấm “Vào trận” rồi trả lời, máy chủ mới ghi nhận được thời gian.",
      "CHUA_MO_DE",
    );
  const deBai = docJson<MucDeBai[]>(tran.deBai, []);

  let soDung = 0;
  const xemLai = deBai.map((m, i) => {
    const c = cauCua(m)!;
    const chon =
      Number.isInteger(dapAn[i]) && dapAn[i] >= 0 && dapAn[i] < m.tt.length
        ? dapAn[i]
        : -1;
    const dung = m.tt.indexOf(0);
    if (chon === dung) soDung++;
    return {
      hoi: c.q,
      phuongAn: m.tt.map((k) => c.a![k]),
      chon,
      dung,
      giai: c.g,
    };
  });
  // Trần: tổng giây đề bài + 10 giây bù mạng
  const tranMs =
    deBai.reduce((s, m) => s + (m.giay ?? DAU_TRUONG.GIAY) * 1000, 0) + 10_000;
  // Sàn 1 giây mỗi câu đã trả lời: nộp "0 giây" không thắng được người bấm
  // nhanh thật khi bằng số câu đúng
  const sanMs = Math.min(dapAn.length, deBai.length) * 1000;
  const kepMs = (x: number) =>
    Math.min(Math.max(sanMs, Math.round(x) || 0), tranMs);
  // Giờ MÁY CHỦ: đếm từ lúc bên này mở đề lần đầu. Trận cũ (tạo trước
  // `MOC_CHAM_MAY_CHU`) không có mốc → giữ nguyên cách cũ, dùng giờ trình
  // duyệt khai, để trận đang dở lúc nâng cấp vẫn nộp nốt được.
  const ms = moLuc ? kepMs(Date.now() - moLuc.getTime()) : kepMs(msKhach);

  if (laThach) {
    const cn = await prisma.nnTranDau.updateMany({
      where: { id: tranId, trangThai: "CHO_THACH" },
      data: { thachDung: soDung, thachMs: ms, trangThai: "CHO_DOI_THU" },
    });
    if (cn.count !== 1)
      throw new LoiGame("Lượt này đã được nộp hoặc trận vừa bị huỷ");
    return {
      soDung,
      tong: deBai.length,
      diem: 0,
      xong: false,
      thang: null,
      xemLai,
    };
  }

  // Đối thủ chơi xong → phân thắng bại
  const thachDung = tran.thachDung ?? 0;
  const thachMs = tran.thachMs ?? 0;
  let thangId: string | null = null;
  if (soDung > thachDung) thangId = tran.doiThuId;
  else if (soDung < thachDung) thangId = tran.thachId;
  else if (ms < thachMs) thangId = tran.doiThuId;
  else if (ms > thachMs) thangId = tran.thachId;

  // Đọc mùa + thông số + luật TRƯỚC giao dịch (SQLite một kết nối)
  const homNay = dauNgay();
  const [mua, thongSo, luat, daTinhThach, daTinhDoiThu, cungCap] =
    await Promise.all([
      muaHienTai(),
      docThongSo(),
      docMuc("luat"),
      prisma.nnSoCai.count({
        where: {
          userId: tran.thachId,
          loai: "DAU_TRUONG",
          createdAt: { gte: homNay },
        },
      }),
      prisma.nnSoCai.count({
        where: {
          userId: tran.doiThuId,
          loai: "DAU_TRUONG",
          createdAt: { gte: homNay },
        },
      }),
      prisma.nnTranDau.count({
        where: {
          trangThai: "XONG",
          xongLuc: { gte: homNay },
          OR: [
            { thachId: tran.thachId, doiThuId: tran.doiThuId },
            { thachId: tran.doiThuId, doiThuId: tran.thachId },
          ],
        },
      }),
    ]);
  // Chống cày điểm: quá trần mỗi ngày thì trận chỉ tính thắng thua
  const lt = luat.dauTruong;
  const quaCap = cungCap >= lt.cungDoiThuMoiNgay;
  const duocTinh = (daTinh: number) =>
    mua.tinhDiem && !quaCap && daTinh < lt.tranTinhDiemMoiNgay;
  const tinhThach = duocTinh(daTinhThach);
  const tinhDoiThu = duocTinh(daTinhDoiThu);
  const ts = thongSo.dauTruong;
  const diemCua = (userId: string, dung: number) =>
    dung * ts.moiCauDung +
    (thangId === userId ? ts.thang : thangId === null ? ts.hoa : ts.thua);
  const diemThach = diemCua(tran.thachId, thachDung);
  const diemDoiThu = diemCua(tran.doiThuId, soDung);

  await prisma.$transaction(async (tx) => {
    const cn = await tx.nnTranDau.updateMany({
      where: { id: tranId, trangThai: "CHO_DOI_THU" },
      data: {
        doiThuDung: soDung,
        doiThuMs: ms,
        trangThai: "XONG",
        thangId,
        xongLuc: new Date(),
      },
    });
    if (cn.count !== 1)
      throw new LoiGame("Lượt này đã được nộp hoặc trận vừa bị huỷ");
    for (const [userId, diem, tinh] of [
      [tran.thachId, diemThach, tinhThach],
      [tran.doiThuId, diemDoiThu, tinhDoiThu],
    ] as const) {
      await tx.nnNguoiChoi.upsert({
        where: { userId },
        create: { userId },
        update: {
          tranThang: { increment: thangId === userId ? 1 : 0 },
          tranThua: { increment: thangId && thangId !== userId ? 1 : 0 },
          tranHoa: { increment: thangId === null ? 1 : 0 },
        },
      });
      if (tinh) {
        await ghiSoCai(tx, {
          userId,
          muaId: mua.id,
          loai: "DAU_TRUONG",
          nguon: `tran:${tranId}`,
          diem,
          von: { TT: lt.vonTT, XH: lt.vonXH },
          ghiChu:
            thangId === userId
              ? "Thắng trận đấu trường"
              : thangId === null
                ? "Hoà trận đấu trường"
                : "Thua trận đấu trường",
        });
        await xetCanBang(tx, userId, mua.id, luat);
      }
    }
  }, GIAO_DICH);

  return {
    soDung,
    tong: deBai.length,
    diem: tinhDoiThu ? diemDoiThu : 0,
    xong: true,
    thang: thangId === null ? null : thangId === tran.doiThuId,
    xemLai,
    tinhDiem: tinhDoiThu,
    von: tinhDoiThu ? { TT: lt.vonTT, XH: lt.vonXH } : { TT: 0, XH: 0 },
    ghiChuDiem: !mua.tinhDiem
      ? "Mùa giải đã kết thúc — trận không cộng điểm."
      : quaCap
        ? `Hai bạn đã đấu ${lt.cungDoiThuMoiNgay} trận có điểm hôm nay — trận này chỉ tính thắng thua. Mai đấu tiếp nhé!`
        : !tinhDoiThu
          ? `Hôm nay bạn đã được cộng điểm đủ ${lt.tranTinhDiemMoiNgay} trận — trận này chỉ tính thắng thua.`
          : null,
  };
}

/** Dữ liệu sảnh đấu trường của một người. */
export async function sanhDauTruong(nguoi: NguoiChoi) {
  const cuaToi = [{ thachId: nguoi.userId }, { doiThuId: nguoi.userId }];
  // Trận CHƯA XONG lấy riêng, không nằm trong 30 trận gần đây: người chơi nhiều
  // vẫn thấy lời thách cũ ở "Tới lượt bạn" (trang chủ đếm lời thách không giới
  // hạn, mà cặp đang có trận dở thì không thách nhau trận mới được)
  const [dangDo, daXong, thanhTich, topThang] = await Promise.all([
    prisma.nnTranDau.findMany({
      where: { trangThai: { in: TRAN_DANG_DO }, OR: cuaToi },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.nnTranDau.findMany({
      where: { trangThai: { in: ["XONG", "HUY"] }, OR: cuaToi },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
    prisma.nnNguoiChoi.findUnique({
      where: { userId: nguoi.userId },
      select: { tranThang: true, tranThua: true, tranHoa: true },
    }),
    prisma.nnNguoiChoi.findMany({
      where: { tranThang: { gt: 0 }, anXepHang: false },
      orderBy: [{ tranThang: "desc" }, { tranThua: "asc" }],
      take: 10,
    }),
  ]);
  const ids = new Set<string>();
  for (const t of [...dangDo, ...daXong]) {
    ids.add(t.thachId);
    ids.add(t.doiThuId);
  }
  for (const t of topThang) ids.add(t.userId);
  const ten = await tenNguoiChoi([...ids]);
  const mo = (t: (typeof dangDo)[number]) => {
    const laThach = t.thachId === nguoi.userId;
    const khac = laThach ? t.doiThuId : t.thachId;
    return {
      id: t.id,
      trangThai: t.trangThai,
      laThach,
      toiLuot: toiLuot(t, nguoi.userId),
      doiThu: ten.get(khac)?.ten ?? "Hội viên",
      doiThuCongTy: ten.get(khac)?.congTy ?? null,
      toiDung: laThach ? t.thachDung : t.doiThuDung,
      hoDung: laThach ? t.doiThuDung : t.thachDung,
      thang:
        t.trangThai === "XONG"
          ? t.thangId === null
            ? null
            : t.thangId === nguoi.userId
          : null,
      ngay: t.createdAt.toISOString(),
      tenBo: tenBoCuaDeBai(docJson<MucDeBai[]>(t.deBai, [])),
      soCau: docJson<MucDeBai[]>(t.deBai, []).length,
    };
  };
  return {
    dangDo: dangDo.map(mo),
    /** Trận đã kết thúc: đấu xong hoặc bị Ban Điều hành huỷ (xem `trangThai`) */
    daXong: daXong.map(mo),
    thanhTich: thanhTich ?? { tranThang: 0, tranThua: 0, tranHoa: 0 },
    topThang: topThang.map((t) => ({
      userId: t.userId,
      ten: ten.get(t.userId)?.ten ?? "Hội viên",
      congTy: ten.get(t.userId)?.congTy ?? null,
      tranThang: t.tranThang,
      tranThua: t.tranThua,
      tranHoa: t.tranHoa,
    })),
  };
}

/** Số lời thách đang chờ tôi nhận. */
export function soLoiThach(userId: string) {
  return prisma.nnTranDau.count({
    where: { doiThuId: userId, trangThai: "CHO_DOI_THU" },
  });
}

/** Chi tiết một trận cho trang trận đấu. */
export async function chiTietTran(nguoi: NguoiChoi, tranId: string) {
  const t = await prisma.nnTranDau.findUnique({ where: { id: tranId } });
  if (!t || (t.thachId !== nguoi.userId && t.doiThuId !== nguoi.userId))
    return null;
  const ten = await tenNguoiChoi([t.thachId, t.doiThuId]);
  const deBai = docJson<MucDeBai[]>(t.deBai, []);
  return {
    id: t.id,
    trangThai: t.trangThai,
    nhanTrangThai: NHAN_TRANG_THAI_TRAN[t.trangThai] ?? t.trangThai,
    toiLuot: toiLuot(t, nguoi.userId),
    laThach: t.thachId === nguoi.userId,
    thach: {
      userId: t.thachId,
      ten: ten.get(t.thachId)?.ten ?? "Hội viên",
      dung: t.thachDung,
      ms: t.thachMs,
    },
    doiThu: {
      userId: t.doiThuId,
      ten: ten.get(t.doiThuId)?.ten ?? "Hội viên",
      dung: t.doiThuDung,
      ms: t.doiThuMs,
    },
    thangId: t.thangId,
    soCau: deBai.length,
    giay: deBai[0]?.giay ?? DAU_TRUONG.GIAY,
    tenBo: tenBoCuaDeBai(deBai),
  };
}

/**
 * Số trận thắng Đấu trường CÓ GHI SỔ CÁI của một mùa — con số dùng cho mốc quà
 * `TRAN_THANG`.
 *
 * Chỉ đếm trận thắng có dòng `NnSoCai` (`loai:"DAU_TRUONG"`,
 * `nguon:"tran:<id>"`) của chính người thắng, tức trận nằm trong trần chống cày
 * mỗi ngày (10 trận/người, 2 trận/cặp). Trước đây đếm MỌI trận `XONG` nên hai
 * người bắt tay đánh 50 trận/ngày, một bên cố thua, là bên kia lấy được quà
 * thật dù trần chỉ chặn ĐIỂM.
 *
 * Mùa lấy theo `NnSoCai.muaId` (chơi thử ghi vào mùa `CHOI_THU`) nên không cần
 * lọc theo khoảng ngày nữa. `NnNguoiChoi.tranThang` — thành tích hiển thị ở
 * sảnh Đấu trường — vẫn đếm mọi trận thắng như cũ.
 */
export async function tranThangCoGhiSo(
  muaId: string,
  userIds?: string[],
): Promise<Map<string, number>> {
  if (userIds && !userIds.length) return new Map();
  // Sổ cái là vế bị trần chặn nên luôn nhỏ; lọc từ đây rồi mới tra trận
  const soCai = await prisma.nnSoCai.findMany({
    where: {
      muaId,
      loai: "DAU_TRUONG",
      nguon: { startsWith: "tran:" },
      ...(userIds ? { userId: { in: userIds } } : {}),
    },
    select: { userId: true, nguon: true },
  });
  if (!soCai.length) return new Map();
  const coSo = new Set(soCai.map((s) => `${s.userId}|${s.nguon}`));
  const maTran = [...new Set(soCai.map((s) => s.nguon.slice(5)))];
  const dem = new Map<string, number>();
  // Cắt khúc danh sách id: cả mùa có thể vài chục nghìn trận, SQLite chặn số
  // tham số của một câu lệnh
  for (let i = 0; i < maTran.length; i += 400) {
    const tran = await prisma.nnTranDau.findMany({
      where: {
        id: { in: maTran.slice(i, i + 400) },
        trangThai: "XONG",
        ...(userIds
          ? { thangId: { in: userIds } }
          : { thangId: { not: null } }),
      },
      select: { id: true, thangId: true },
    });
    for (const t of tran) {
      // Trận chỉ tính cho người THẮNG, và chỉ khi chính người đó được ghi sổ cái
      if (!t.thangId || !coSo.has(`${t.thangId}|tran:${t.id}`)) continue;
      dem.set(t.thangId, (dem.get(t.thangId) ?? 0) + 1);
    }
  }
  return dem;
}

/** Như `tranThangCoGhiSo` nhưng nhận thẳng mùa hiện tại (trang game đang gọi). */
export async function tranThangTrongMua(
  mua: Pick<MuaHienTai, "id" | "batDau" | "ketThuc">,
  userIds: string[],
): Promise<Map<string, number>> {
  return tranThangCoGhiSo(mua.id, userIds);
}

// ─── Vận hành (quản trị) ──────────────────────────────────────────────

export type TranTreo = {
  id: string;
  trangThai: string;
  nhanTrangThai: string;
  thach: { userId: string; ten: string; congTy: string | null };
  doiThu: { userId: string; ten: string; congTy: string | null };
  /** Người thách đã chơi lượt mở màn chưa (số câu đúng) */
  thachDung: number | null;
  tenBo: string;
  soCau: number;
  taoLuc: string;
};

/**
 * Trận chưa xong (cũ nhất trước) cho trang vận hành — trận treo chặn hai người
 * thách nhau trận mới nên Ban cần thấy để huỷ.
 */
export async function tranChuaXong(
  gioiHan = 300,
): Promise<{ tong: number; ds: TranTreo[]; luc: number }> {
  const [tong, tran] = await Promise.all([
    prisma.nnTranDau.count({ where: { trangThai: { in: TRAN_DANG_DO } } }),
    prisma.nnTranDau.findMany({
      where: { trangThai: { in: TRAN_DANG_DO } },
      orderBy: { createdAt: "asc" },
      take: gioiHan,
      select: {
        id: true,
        thachId: true,
        doiThuId: true,
        trangThai: true,
        thachDung: true,
        deBai: true,
        createdAt: true,
      },
    }),
  ]);
  const ten = await tenNguoiChoi([
    ...new Set(tran.flatMap((t) => [t.thachId, t.doiThuId])),
  ]);
  const nguoi = (userId: string) => ({
    userId,
    ten: ten.get(userId)?.ten ?? "Hội viên",
    congTy: ten.get(userId)?.congTy ?? null,
  });
  return {
    tong,
    /** Mốc lấy dữ liệu (ms) — trang tính "treo bao nhiêu ngày" theo mốc này */
    luc: Date.now(),
    ds: tran.map((t) => {
      const deBai = docJson<MucDeBai[]>(t.deBai, []);
      return {
        id: t.id,
        trangThai: t.trangThai,
        nhanTrangThai: NHAN_TRANG_THAI_TRAN[t.trangThai] ?? t.trangThai,
        thach: nguoi(t.thachId),
        doiThu: nguoi(t.doiThuId),
        thachDung: t.thachDung,
        tenBo: tenBoCuaDeBai(deBai),
        soCau: deBai.length,
        taoLuc: t.createdAt.toISOString(),
      };
    }),
  };
}

/**
 * Ban Điều hành huỷ một trận chưa xong. Cập nhật CÓ ĐIỀU KIỆN trạng thái nên
 * trận vừa được nộp xong không bị huỷ nhầm. Trả về false nếu trận không còn dở.
 * Không cộng / trừ điểm ai (trận chưa xong chưa ghi sổ cái).
 */
export async function huyTranDau(tranId: string): Promise<boolean> {
  if (typeof tranId !== "string" || !tranId) return false;
  const cn = await prisma.nnTranDau.updateMany({
    where: { id: tranId, trangThai: { in: TRAN_DANG_DO } },
    data: { trangThai: "HUY", xongLuc: new Date() },
  });
  return cn.count === 1;
}
