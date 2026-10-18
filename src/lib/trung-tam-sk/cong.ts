import { prisma } from "@/lib/prisma";
import { layIp } from "@/lib/gioi-han-dang-nhap";
import { chuanSoDienThoai, laSoDienThoaiVN } from "@/lib/so-dien-thoai";
import { datCheckin, ghepHoiVien, napChiMucHoiVien } from "@/lib/trung-tam-sk/checkin";
import { daChamTran, vuotTran } from "@/lib/trung-tam-sk/gioi-han";

/**
 * CỔNG QR CHO KHÁCH — /sk/[ma]: đăng ký, tự check-in, gửi câu hỏi, đánh giá.
 * Trang công khai nên chỉ đọc đúng những gì khách cần (tên sự kiện, giờ,
 * địa điểm, tên phiên) — KHÔNG bao giờ trả danh sách khách, SĐT, email.
 */

const MA_HOP_LE = /^[a-z0-9]{4,12}$/;

export async function napCong(ma: string) {
  const m = String(ma ?? "").toLowerCase();
  if (!MA_HOP_LE.test(m)) return null;
  return prisma.skSuKien.findFirst({
    where: { ma: m },
    select: {
      id: true,
      eventId: true,
      ma: true,
      trangThai: true,
      moDangKy: true,
      moTuCheckin: true,
      moHoiDap: true,
      moDanhGia: true,
      pinCheckin: true,
      event: { select: { title: true, startAt: true, location: true, summary: true } },
      phien: { select: { id: true, ten: true, batDau: true, diaDiem: true }, orderBy: { order: "asc" } },
    },
  });
}

export type Cong = NonNullable<Awaited<ReturnType<typeof napCong>>>;

/**
 * Phiên khách đang vào: phiên có giờ bắt đầu muộn nhất mà đã tới (cho vào
 * sớm 45 phút); chưa tới phiên nào / phiên không ghi giờ → phiên đầu tiên.
 */
export function phienHienTai<P extends { batDau: Date | null }>(phien: P[], bayGio = new Date()): P | null {
  const moc = bayGio.getTime() + 45 * 60_000;
  const daToi = phien
    .filter((p) => p.batDau && p.batDau.getTime() <= moc)
    .sort((a, b) => a.batDau!.getTime() - b.batDau!.getTime());
  return daToi.at(-1) ?? phien[0] ?? null;
}

/** SĐT di động VN chuẩn hoá (0xxxxxxxxx) hoặc null */
export function sdtHopLe(raw: unknown): string | null {
  const so = chuanSoDienThoai(String(raw ?? ""));
  return laSoDienThoaiVN(so) ? so : null;
}

/**
 * Khách của sự kiện có SĐT này. SĐT nhập từ Excel có thể còn dấu cách / dấu
 * chấm nên so sau khi chuẩn hoá (một sự kiện vài trăm khách — đọc hết vẫn nhẹ).
 */
export async function timKhachTheoSdt(skId: string, so: string) {
  const ds = await prisma.skKhach.findMany({
    where: { skId, phone: { not: null } },
    select: { id: true, ten: true, danhXung: true, phone: true, ban: true, memberId: true },
    orderBy: { order: "asc" },
  });
  return ds.find((k) => chuanSoDienThoai(k.phone) === so) ?? null;
}

/** Chuỗi gọn từ form công khai: cắt khoảng trắng, giới hạn độ dài, rỗng → null */
export const chu = (v: unknown, max: number) => {
  const t = typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
  return t || null;
};

/**
 * Mở đầu mọi API cổng: nạp sự kiện theo mã, kiểm cổng đang mở, giới hạn
 * lượt gửi theo máy và theo cả sự kiện. Trả Response lỗi hoặc dữ liệu.
 */
export async function moCong(
  req: Request,
  ma: string,
  cong: "moDangKy" | "moTuCheckin" | "moHoiDap" | "moDanhGia",
  tran: { may: number; suKien: number; phut: number }
): Promise<{ c: Cong; ip: string; body: Record<string, unknown> } | Response> {
  const c = await napCong(ma);
  if (!c) return Response.json({ error: "Không tìm thấy sự kiện" }, { status: 404 });
  if (!c[cong] || c.trangThai === "HUY")
    return Response.json({ error: "Cổng này đang đóng — anh/chị vui lòng liên hệ Ban tổ chức." }, { status: 403 });
  const ip = layIp(req.headers);
  const cua = tran.phut * 60_000;
  if (vuotTran(`${cong}:may:${c.id}:${ip}`, tran.may, cua) || vuotTran(`${cong}:sk:${c.id}`, tran.suKien, cua))
    return Response.json({ error: "Anh/chị gửi quá nhanh, vui lòng thử lại sau ít phút." }, { status: 429 });
  const b = await req.json().catch(() => null);
  return { c, ip, body: b && typeof b === "object" && !Array.isArray(b) ? (b as Record<string, unknown>) : {} };
}

type KetQuaCong = { status?: number; body: Record<string, unknown> };
const loi = (error: string, status = 400): KetQuaCong => ({ status, body: { error } });

async function themKhachCong(
  skId: string,
  d: { ten: string; phone: string; donVi: string | null; email?: string | null; chucDanh?: string | null; ghiChu?: string | null },
  nguon: "ONLINE" | "TU_CHECKIN",
  nhomKhac: string
) {
  const max = await prisma.skKhach.aggregate({ where: { skId }, _max: { order: true } });
  const memberId = ghepHoiVien({ ten: d.ten, phone: d.phone, donVi: d.donVi, nhom: null }, await napChiMucHoiVien());
  return prisma.skKhach.create({
    data: { skId, ...d, nhom: memberId ? "Hội viên" : nhomKhac, nguon, memberId, order: (max._max.order ?? 0) + 1 },
    select: { id: true, ten: true, danhXung: true, phone: true, ban: true, memberId: true },
  });
}

/**
 * Khách tự đăng ký. Đã có trong danh sách (trùng SĐT) thì KHÔNG ghi đè thông
 * tin BTC đã nhập, chỉ đánh dấu "Tham dự" các phiên chọn. Trả lời như nhau
 * cho cả hai trường hợp — không để lộ SĐT nào đã có trong danh sách.
 */
export async function dangKyCong(c: Cong, b: Record<string, unknown>): Promise<KetQuaCong> {
  const ten = chu(b.ten, 120);
  if (!ten) return loi("Vui lòng nhập họ tên");
  const phone = sdtHopLe(b.phone);
  if (!phone) return loi("Số điện thoại chưa đúng");
  const emailTho = chu(b.email, 160);
  const email = emailTho && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTho) ? emailTho : null;
  const chon = Array.isArray(b.phienIds) ? b.phienIds.filter((x): x is string => typeof x === "string") : [];
  const phien = c.phien.filter((p) => !chon.length || chon.includes(p.id));
  if (!phien.length) return loi("Vui lòng chọn phiên tham dự");

  const khach =
    (await timKhachTheoSdt(c.id, phone)) ??
    (await themKhachCong(
      c.id,
      { ten, phone, email, donVi: chu(b.donVi, 200), chucDanh: chu(b.chucDanh, 160), ghiChu: chu(b.ghiChu, 500) },
      "ONLINE",
      "Đăng ký online"
    ));
  for (const p of phien) {
    await prisma.skThamDu.upsert({
      where: { khachId_phienId: { khachId: khach.id, phienId: p.id } },
      create: { khachId: khach.id, phienId: p.id, xacNhan: "CO" },
      update: { xacNhan: "CO" },
    });
  }
  return { body: { ok: true, phien: phien.map((p) => p.ten) } };
}

export const PIN_SAI = { may: 8, suKien: 150, cuaSo: 15 * 60_000 };
export const NGUOI_TU_CHECKIN = { id: "cong-qr", ten: "Khách tự check-in (QR)" };

/**
 * Khách tự check-in bằng SĐT + mã PIN BTC đọc / in tại bàn đón (người ở nhà
 * quét được QR cũng không check-in được). PIN sai bị đếm theo máy và theo cả
 * sự kiện; chạm trần thì phải chờ. Khách chưa có trong danh sách: lần đầu trả
 * `canThongTin`, khách điền họ tên rồi gửi lại → thêm thành khách vãng lai.
 */
export async function tuCheckinCong(c: Cong, b: Record<string, unknown>, ip: string): Promise<KetQuaCong> {
  const kMay = `pin-sai:${c.id}:${ip}`;
  const kSk = `pin-sai:${c.id}`;
  if (daChamTran(kMay, PIN_SAI.may, PIN_SAI.cuaSo) || daChamTran(kSk, PIN_SAI.suKien, PIN_SAI.cuaSo))
    return loi("Nhập sai mã PIN quá nhiều lần — vui lòng nhờ bàn lễ tân check-in giúp.", 429);
  const pin = String(b.pin ?? "").replace(/\D/g, "");
  if (!c.pinCheckin || pin !== c.pinCheckin) {
    vuotTran(kMay, PIN_SAI.may, PIN_SAI.cuaSo);
    vuotTran(kSk, PIN_SAI.suKien, PIN_SAI.cuaSo);
    return loi("Mã PIN chưa đúng — mã in ở bàn đón khách.");
  }
  const phone = sdtHopLe(b.phone);
  if (!phone) return loi("Số điện thoại chưa đúng");
  const phien = c.phien.find((p) => p.id === b.phienId) ?? phienHienTai(c.phien);
  if (!phien) return loi("Sự kiện chưa có phiên — vui lòng liên hệ lễ tân.");

  let khach = await timKhachTheoSdt(c.id, phone);
  if (!khach) {
    const ten = chu(b.ten, 120);
    if (!ten) return { body: { canThongTin: true } };
    khach = await themKhachCong(c.id, { ten, phone, donVi: chu(b.donVi, 200) }, "TU_CHECKIN", "Khách vãng lai");
  }

  const cu = await prisma.skThamDu.findUnique({
    where: { khachId_phienId: { khachId: khach.id, phienId: phien.id } },
    select: { checkinLuc: true },
  });
  let diem = 0;
  if (!cu?.checkinLuc) {
    const r = await datCheckin({ eventId: c.eventId, khachId: khach.id, phienId: phien.id, coMat: true, nguoi: NGUOI_TU_CHECKIN });
    if (!r.ok) return loi(r.error);
    diem = r.diem;
  }
  return {
    body: {
      ok: true,
      daCo: !!cu?.checkinLuc,
      ten: [khach.danhXung, khach.ten].filter(Boolean).join(" "),
      ban: khach.ban,
      phien: phien.ten,
      diem,
    },
  };
}
