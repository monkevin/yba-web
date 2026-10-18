/**
 * Câu thưởng cuối mỗi lượt — CHỈ MÁY CHỦ.
 *
 * Hai loại, mỗi lượt rút một câu:
 *  - HOI_VIEN: sinh từ dữ liệu hội viên THẬT trên web (ai đại diện doanh nghiệp
 *    nào, doanh nghiệp làm ngành gì) — mỗi lượt một câu khác, giúp hội viên
 *    biết mặt biết tên nhau. Chỉ lấy hồ sơ đang hiện công khai (PUBLIC_MEMBER).
 *  - CHIA_SE: câu hỏi về chính người chơi, không có đúng / sai
 *    (noi-dung/chia-se.json + câu "ấn tượng thành viên Ban Chủ nhiệm"). Câu trả
 *    lời lưu vào NnChiaSe, người chơi thấy ngay tỉ lệ huynh đệ chọn giống mình.
 *
 * Ban Điều hành bật / tắt: công tắc CHÍNH `nn.thongSo.cauThuong`, công tắc con
 * từng loại `nn.tinhNang.cauThuongHoiVien / cauThuongChiaSe`; điểm và giây ở
 * `nn.luat.cauThuong`; câu chia sẻ sửa / tắt ở `nn.chiaSe` (câu `bcn` sinh từ
 * dữ liệu Ban Chủ nhiệm nên không sửa được).
 */
import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER } from "@/lib/public";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import chiaSeJson from "./noi-dung/chia-se.json";
import type { NguoiChoi } from "./kieu";
import { docChiaSeSua, docMuc, docTinhNang } from "./cai-dat";
import { LUAT_MAC_DINH, type LuatChoi } from "./cai-dat/luat-choi";
import type { TinhNang } from "./cai-dat/tinh-nang";

export type CauThuong = {
  loai: "HOI_VIEN" | "CHIA_SE";
  /** Mã câu chia sẻ ("cs03", "bcn") hoặc mã hội viên + dạng ("hv:<id>:nganh") */
  ma: string;
  hoi: string;
  /** Phương án đã xáo sẵn */
  phuongAn: string[];
  /** Chỉ số phương án đúng — chỉ câu HOI_VIEN */
  dung?: number;
  giai?: string;
  /** Đường dẫn hồ sơ để xem thêm */
  lienKet?: string;
  giay: number;
};

export type CauChiaSe = { ma: string; hoi: string; luaChon: string[] };
/** Bản gốc trong JSON — bản đang dùng đọc qua `docChiaSeSua()`. */
export const CAU_CHIA_SE: CauChiaSe[] = chiaSeJson as CauChiaSe[];
export const MA_CHIA_SE_BCN = "bcn";
export const HOI_CHIA_SE_BCN =
  "Bạn ấn tượng với cá tính của thành viên nào trong Ban Chủ nhiệm?";

/** Loại câu thưởng được rút và số giây mỗi loại. */
export type TuyChonCauThuong = {
  hoiVien: boolean;
  chiaSe: boolean;
  giayHoiVien: number;
  giayChiaSe: number;
};

/** Tuỳ chọn câu thưởng từ tính năng + luật đã đọc (hàm thuần). */
export function tuyChonCauThuong(
  tn: Pick<TinhNang, "cauThuongHoiVien" | "cauThuongChiaSe">,
  luat: Pick<LuatChoi, "cauThuong">,
): TuyChonCauThuong {
  return {
    hoiVien: tn.cauThuongHoiVien,
    chiaSe: tn.cauThuongChiaSe,
    giayHoiVien: luat.cauThuong.giayHoiVien,
    giayChiaSe: luat.cauThuong.giayChiaSe,
  };
}

/** Đọc tuỳ chọn câu thưởng từ cài đặt; `null` khi công tắc chính đang tắt. */
export async function docTuyChonCauThuong(): Promise<TuyChonCauThuong | null> {
  const [thongSo, tinhNang, luat] = await Promise.all([
    docMuc("thongSo"),
    docTinhNang(),
    docMuc("luat"),
  ]);
  return thongSo.cauThuong ? tuyChonCauThuong(tinhNang, luat) : null;
}

const ngauNhien = (n: number) => Math.floor(Math.random() * n);
function xaoTron<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = ngauNhien(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
/** Lấy `n` phần tử khác nhau (theo khoá) từ danh sách, bỏ qua phần tử bị loại. */
function chonKhac<T>(
  ds: T[],
  n: number,
  khoa: (x: T) => string,
  loai: Set<string>,
): T[] {
  const kq: T[] = [];
  const daCo = new Set(loai);
  for (const x of xaoTron(ds)) {
    const k = khoa(x);
    if (daCo.has(k)) continue;
    daCo.add(k);
    kq.push(x);
    if (kq.length === n) break;
  }
  return kq;
}
const xungHo = (m: { salutation: string | null; name: string }) =>
  `${m.salutation ? `${m.salutation} ` : ""}${m.name}`;

/** Câu hỏi về một hội viên thật, sinh ngẫu nhiên. Trả null khi chưa đủ dữ liệu. */
export async function taoCauHoiVien(
  nguoi: NguoiChoi,
  giay = LUAT_MAC_DINH.cauThuong.giayHoiVien,
): Promise<CauThuong | null> {
  const ds = await prisma.member.findMany({
    where: { ...PUBLIC_MEMBER, company: { not: "" }, name: { not: "" } },
    select: {
      id: true,
      slug: true,
      name: true,
      salutation: true,
      company: true,
      industry: true,
      position: true,
    },
  });
  const ungVien = ds.filter((m) => m.id !== nguoi.memberId);
  if (ungVien.length < 4) return null;
  const m = ungVien[ngauNhien(ungVien.length)];
  const cty = tenDoanhNghiep(m.company);
  // Chỉ hỏi ngành khi hồ sơ ghi MỘT ngành (nhiều ngành nối bằng "·" thành phương án dài, khó đọc)
  const motNganh = (x: string | null | undefined) =>
    x && !x.includes("·") && x.trim().length <= 70 ? x.trim() : null;
  const nganh = motNganh(m.industry);
  const cacNganh = [
    ...new Set(
      ds.map((x) => motNganh(x.industry)).filter((x): x is string => !!x),
    ),
  ];
  const dang = xaoTron([
    "dai-dien",
    "doanh-nghiep",
    ...(nganh && cacNganh.length >= 4 ? ["nganh"] : []),
  ])[0];

  let dungText: string;
  let sai: string[];
  let hoi: string;
  if (dang === "dai-dien") {
    hoi = `${cty} do hội viên nào đại diện trong Chi hội?`;
    dungText = xungHo(m);
    sai = chonKhac(ungVien, 3, (x) => x.name, new Set([m.name])).map(xungHo);
  } else if (dang === "doanh-nghiep") {
    hoi = `${xungHo(m)} là đại diện của doanh nghiệp nào?`;
    dungText = cty;
    sai = chonKhac(
      ungVien,
      3,
      (x) => tenDoanhNghiep(x.company),
      new Set([cty]),
    ).map((x) => tenDoanhNghiep(x.company));
  } else {
    hoi = `${cty} hoạt động trong lĩnh vực nào?`;
    dungText = nganh!;
    sai = chonKhac(cacNganh, 3, (x) => x, new Set([nganh!]));
  }
  if (sai.length < 3) return null;
  const phuongAn = xaoTron([dungText, ...sai]);
  return {
    loai: "HOI_VIEN",
    ma: `hv:${m.id}:${dang}`,
    hoi,
    phuongAn,
    dung: phuongAn.indexOf(dungText),
    giai: `${xungHo(m)} – ${m.position ? `${m.position}, ` : ""}${cty}${nganh ? ` · ngành ${nganh}` : ""}. Ghé hồ sơ để làm quen nhé.`,
    lienKet: `/doanh-nghiep/${m.slug}`,
    giay,
  };
}

/** Câu chia sẻ đang bật (bản Ban Điều hành sửa, chưa sửa thì bản gốc). */
async function cauChiaSeDangBat(): Promise<CauChiaSe[]> {
  return (await docChiaSeSua()).ds
    .filter((c) => c.bat)
    .map((c) => ({ ma: c.ma, hoi: c.hoi, luaChon: c.luaChon }));
}

/**
 * Câu chia sẻ người chơi CHƯA trả lời; hết câu thì trả null. `ds` = danh sách
 * câu đang bật (không truyền thì đọc cài đặt). Câu `bcn` luôn sinh động.
 */
export async function taoCauChiaSe(
  nguoi: NguoiChoi,
  giay = LUAT_MAC_DINH.cauThuong.giayChiaSe,
  ds?: CauChiaSe[],
): Promise<CauThuong | null> {
  const dangBat = ds ?? (await cauChiaSeDangBat());
  const daTraLoi = new Set(
    (
      await prisma.nnChiaSe.findMany({
        where: { userId: nguoi.userId },
        select: { maCau: true },
      })
    ).map((x) => x.maCau),
  );
  const con: CauChiaSe[] = dangBat.filter((c) => !daTraLoi.has(c.ma));
  if (!daTraLoi.has(MA_CHIA_SE_BCN)) {
    const bcn = await prisma.leader.findMany({
      where: { active: true },
      orderBy: [{ group: "asc" }, { order: "asc" }],
      select: { name: true, title: true, group: true },
    });
    const uuTien = bcn.filter((l) => l.group === "BAN_CHU_NHIEM");
    const chon = xaoTron(uuTien.length >= 4 ? uuTien : bcn).slice(0, 4);
    if (chon.length === 4) {
      con.push({
        ma: MA_CHIA_SE_BCN,
        hoi: HOI_CHIA_SE_BCN,
        luaChon: chon.map((l) => `${l.name} – ${l.title}`),
      });
    }
  }
  if (!con.length) return null;
  const c = con[ngauNhien(con.length)];
  return {
    loai: "CHIA_SE",
    ma: c.ma,
    hoi: c.hoi,
    phuongAn: c.ma === MA_CHIA_SE_BCN ? c.luaChon : xaoTron(c.luaChon),
    giay,
  };
}

/**
 * Rút câu thưởng cho một lượt: xen kẽ ngẫu nhiên hai loại, ưu tiên câu chia sẻ
 * chưa trả lời. Chỉ rút loại đang bật; cả hai tắt (hoặc công tắc chính tắt) thì
 * lượt không có câu thưởng. `tuyChon` không truyền thì tự đọc cài đặt — dù sao
 * cũng phải gọi NGOÀI giao dịch.
 */
export async function rutCauThuong(
  nguoi: NguoiChoi,
  tuyChon?: TuyChonCauThuong | null,
): Promise<CauThuong | null> {
  const tc = tuyChon === undefined ? await docTuyChonCauThuong() : tuyChon;
  if (!tc || (!tc.hoiVien && !tc.chiaSe)) return null;
  const hoiVien = async () =>
    tc.hoiVien ? taoCauHoiVien(nguoi, tc.giayHoiVien) : null;
  const chiaSe = async () =>
    tc.chiaSe ? taoCauChiaSe(nguoi, tc.giayChiaSe) : null;
  const thuChiaSeTruoc = Math.random() < 0.5;
  if (thuChiaSeTruoc) return (await chiaSe()) ?? (await hoiVien());
  return (await hoiVien()) ?? (await chiaSe());
}

/** Tỉ lệ (%) huynh đệ đã chọn từng phương án của một câu chia sẻ, theo thứ tự `phuongAn`. */
export async function tiLeChiaSe(
  maCau: string,
  phuongAn: string[],
): Promise<{ phanTram: number[]; soNguoi: number }> {
  const nhom = await prisma.nnChiaSe.groupBy({
    by: ["luaChon"],
    where: { maCau },
    _count: { _all: true },
  });
  const soNguoi = nhom.reduce((s, x) => s + x._count._all, 0);
  const dem = new Map(nhom.map((x) => [x.luaChon, x._count._all]));
  return {
    phanTram: phuongAn.map((p) =>
      soNguoi ? Math.round((100 * (dem.get(p) ?? 0)) / soNguoi) : 0,
    ),
    soNguoi,
  };
}

/**
 * Tổng hợp mọi câu chia sẻ cho Ban Điều hành — gồm cả câu đã TẮT, câu gốc đã
 * bị bỏ khỏi bản sửa và phương án cũ đã đổi chữ, để câu trả lời cũ vẫn đọc được.
 */
export async function tongHopChiaSe() {
  const [nhom, sua] = await Promise.all([
    prisma.nnChiaSe.groupBy({
      by: ["maCau", "luaChon"],
      _count: { _all: true },
    }),
    docChiaSeSua(),
  ]);
  const cau: (CauChiaSe & { bat: boolean })[] = sua.ds.map((c) => ({
    ma: c.ma,
    hoi: c.hoi,
    luaChon: c.luaChon,
    bat: c.bat,
  }));
  const daCo = new Set(cau.map((c) => c.ma));
  const them = (c: CauChiaSe & { bat: boolean }) => {
    if (daCo.has(c.ma)) return;
    cau.push(c);
    daCo.add(c.ma);
  };
  for (const c of CAU_CHIA_SE) them({ ...c, bat: false });
  them({ ma: MA_CHIA_SE_BCN, hoi: HOI_CHIA_SE_BCN, luaChon: [], bat: true });
  // Mã có câu trả lời mà không còn trong danh sách nào (hiếm) — vẫn hiện theo mã
  for (const x of nhom)
    them({ ma: x.maCau, hoi: x.maCau, luaChon: [], bat: false });

  return cau.map((c) => {
    const dong = nhom.filter((x) => x.maCau === c.ma);
    const soNguoi = dong.reduce((s, x) => s + x._count._all, 0);
    const luaChon = [
      ...c.luaChon,
      ...dong.map((x) => x.luaChon).filter((l) => !c.luaChon.includes(l)),
    ];
    return {
      ma: c.ma,
      hoi: c.hoi,
      bat: c.bat,
      soNguoi,
      ketQua: luaChon
        .map((l) => ({
          luaChon: l,
          so: dong.find((x) => x.luaChon === l)?._count._all ?? 0,
        }))
        .sort((a, b) => b.so - a.so),
    };
  });
}
