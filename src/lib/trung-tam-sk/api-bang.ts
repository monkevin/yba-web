import { prisma } from "@/lib/prisma";
import {
  BANG,
  QUYEN_LOI_THEO_HANG,
  epKieu,
  type CauHinhBang,
} from "@/lib/trung-tam-sk/bang";
import { dongBoHoiVien, ghepHoiVien, napChiMucHoiVien } from "@/lib/trung-tam-sk/checkin";
import type { NguoiGhiDiem } from "@/lib/diem-tu-dong";

/**
 * TRUNG TÂM SỰ KIỆN — lõi API sửa bảng dùng chung (route ở
 * /api/quan-tri/su-kien/bang/...). Route lo kiểm quyền; ở đây lo phạm vi
 * dữ liệu: chỉ đụng bản ghi thuộc sự kiện ĐANG quản lý ở Trung tâm, chỉ ghi
 * trường có trong danh sách trắng `BANG`.
 */

type Dong = Record<string, unknown> & { id: string };
type Delegate = {
  findMany(a: unknown): Promise<Dong[]>;
  findFirst(a: unknown): Promise<Dong | null>;
  create(a: unknown): Promise<Dong>;
  update(a: unknown): Promise<Dong>;
  updateMany(a: unknown): Promise<{ count: number }>;
  deleteMany(a: unknown): Promise<{ count: number }>;
  aggregate(a: unknown): Promise<{ _max: { order: number | null } }>;
};

const MO_HINH: Record<string, string> = {
  phien: "skPhien",
  khach: "skKhach",
  viec: "skViec",
  kichban: "skKichBan",
  thuchi: "skThuChi",
  haucan: "skHauCan",
  btc: "banToChuc",
  taitro: "taiTroSuKien",
  quyenloi: "skQuyenLoi",
  hangtaitro: "skHangTaiTro",
  giai: "skGiai",
  cauhoi: "skCauHoi",
  tailieu: "skTaiLieu",
  baidang: "skBaiDang",
  ncc: "skNhaCungCap",
  ruiro: "skRuiRo",
};

export function layBang(ten: string): { cauHinh: CauHinhBang; db: Delegate } | null {
  const cauHinh = BANG[ten];
  const mh = MO_HINH[ten];
  if (!cauHinh || !mh) return null;
  return { cauHinh, db: (prisma as unknown as Record<string, Delegate>)[mh] };
}

/** Điều kiện "bản ghi thuộc một sự kiện đang quản lý ở Trung tâm" */
export function phamVi(c: CauHinhBang, eventId?: string): Record<string, unknown> {
  if (c.cha === "sk") return eventId ? { sk: { eventId } } : {};
  if (c.cha === "event")
    return eventId ? { eventId, event: { toChuc: { isNot: null } } } : { event: { toChuc: { isNot: null } } };
  return { taiTro: { event: { toChuc: { isNot: null } } } };
}

/** Lọc + ép kiểu dữ liệu gửi lên theo danh sách trắng. Trả lỗi nếu có. */
export async function locDuLieu(
  ten: string,
  c: CauHinhBang,
  vao: Record<string, unknown>,
  boQua: string[] = []
): Promise<{ data: Record<string, unknown> } | { error: string }> {
  const data: Record<string, unknown> = {};
  for (const [k, t] of Object.entries(c.truong)) {
    if (boQua.includes(k) || !(k in vao)) continue;
    const v = epKieu(t, vao[k]);
    if (v === undefined) return { error: `Giá trị "${String(vao[k])}" không hợp lệ cho cột ${t.label}` };
    data[k] = v;
  }
  if (c.tieuDe in data && !data[c.tieuDe]) {
    return { error: `${c.truong[c.tieuDe].label} không được để trống` };
  }
  if (c.coHoiVien && "memberId" in vao && !boQua.includes("memberId")) {
    const m = vao.memberId;
    if (m === null || m === "") data.memberId = null;
    else if (typeof m === "string" && (await prisma.member.findUnique({ where: { id: m }, select: { id: true } })))
      data.memberId = m;
    else return { error: "Không tìm thấy hội viên" };
  }
  if (ten === "kichban" && typeof data.phienId === "string") {
    if (!(await prisma.skPhien.findUnique({ where: { id: data.phienId }, select: { id: true } })))
      return { error: "Phiên không tồn tại" };
  }
  return { data };
}

/** Thêm một hoặc nhiều dòng. `chaId` = eventId (hoặc taiTroId với bảng quyền lợi). */
export async function themDong(
  ten: string,
  chaId: string,
  dsVao: Record<string, unknown>[]
): Promise<{ dong: Dong[] } | { error: string; status?: number }> {
  const b = layBang(ten);
  if (!b) return { error: "Bảng không hợp lệ", status: 404 };
  const { cauHinh: c, db } = b;

  let cha: Record<string, unknown>;
  let suKienTen = "";
  let skId = "";
  if (c.cha === "taiTro") {
    const tt = await prisma.taiTroSuKien.findFirst({
      where: { id: chaId, event: { toChuc: { isNot: null } } },
      select: { id: true },
    });
    if (!tt) return { error: "Không tìm thấy nhà tài trợ", status: 404 };
    cha = { taiTroId: tt.id };
  } else {
    const sk = await prisma.skSuKien.findUnique({
      where: { eventId: chaId },
      select: { id: true, event: { select: { id: true, title: true } } },
    });
    if (!sk) return { error: "Sự kiện chưa bật quản lý ở Trung tâm", status: 404 };
    skId = sk.id;
    suKienTen = sk.event.title;
    cha = c.cha === "sk" ? { skId } : { eventId: sk.event.id };
  }

  const max = await db.aggregate({ where: cha, _max: { order: true } });
  let order = max._max.order ?? 0;
  const cm = ten === "khach" ? await napChiMucHoiVien() : null;
  const hangTheoTen = new Map(
    (ten === "taitro" && skId ? await prisma.skHangTaiTro.findMany({ where: { skId } }) : []).map((h) => [h.ten, h])
  );

  const tao: Dong[] = [];
  for (const vao of dsVao.slice(0, 2000)) {
    const r = await locDuLieu(ten, c, vao);
    if ("error" in r) return { error: r.error, status: 400 };
    const data = r.data;
    // Chọn hội viên mà chưa gõ tên → lấy tên / doanh nghiệp từ hồ sơ
    if (typeof data.memberId === "string" && !data[c.tieuDe]) {
      const hv = await prisma.member.findUnique({
        where: { id: data.memberId },
        select: { name: true, company: true, phone: true, position: true },
      });
      if (hv && ten === "btc") data.hoTen = hv.name;
      if (hv && ten === "taitro") data.nhaTaiTro = hv.company;
      if (hv && ten === "khach") {
        data.ten = hv.name;
        data.donVi ??= hv.company;
        data.phone ??= hv.phone;
        data.chucDanh ??= hv.position;
        data.nhom ??= "Hội viên";
      }
    }
    if (!data[c.tieuDe]) data[c.tieuDe] = "Dòng mới";
    if (ten === "taitro") data.suKien = suKienTen;
    if (ten === "khach" && !("memberId" in data) && cm) {
      data.memberId = ghepHoiVien(
        {
          ten: String(data.ten),
          phone: (data.phone as string) ?? null,
          donVi: (data.donVi as string) ?? null,
          nhom: (data.nhom as string) ?? null,
        },
        cm
      );
    }
    // Chọn hạng mà chưa nhập số tiền → lấy mức tiền của hạng ở chương trình này
    if (ten === "taitro" && typeof data.mucTaiTro === "string" && !("hienKim" in data)) {
      const hang = hangTheoTen.get(data.mucTaiTro);
      if (hang?.mucTien) data.hienKim = hang.mucTien;
    }
    if (ten === "taitro" && typeof data.hienKim === "number" && !(Number(data.giaTri) >= data.hienKim))
      data.giaTri = data.hienKim;
    const dong = await db.create({ data: { ...data, ...cha, order: ++order } });
    tao.push(dong);

    // Khách dán kèm cột xác nhận theo phiên: { xacNhan: { [phienId]: "CO" | "KHONG" | "CHO" } }
    if (ten === "khach" && vao.xacNhan && typeof vao.xacNhan === "object") {
      for (const [phienId, xn] of Object.entries(vao.xacNhan as Record<string, unknown>)) {
        if (!["CO", "KHONG", "CHO"].includes(String(xn))) continue;
        const p = await prisma.skPhien.findFirst({ where: { id: phienId, skId }, select: { id: true } });
        if (p) await prisma.skThamDu.create({ data: { khachId: dong.id, phienId: p.id, xacNhan: String(xn) } });
      }
    }
    // Nhà tài trợ có hạng → sinh sẵn danh sách quyền lợi theo bảng hạng của
    // CHƯƠNG TRÌNH này (không có thì theo mẫu chung)
    if (ten === "taitro" && typeof data.mucTaiTro === "string") {
      const hang = hangTheoTen.get(data.mucTaiTro);
      const mau = hang?.quyenLoi
        ? hang.quyenLoi.split("\n").map((x) => x.trim()).filter(Boolean)
        : QUYEN_LOI_THEO_HANG[data.mucTaiTro] ?? [];
      if (mau.length)
        await prisma.skQuyenLoi.createMany({
          data: mau.map((noiDung, i) => ({ taiTroId: dong.id, noiDung, order: i + 1 })),
        });
    }
  }
  return { dong: tao };
}

/** Hội viên đứng sau các khách (để đồng bộ điểm sau khi xoá / đổi ghép) */
async function hoiVienCuaKhach(ids: string[]) {
  const ds = await prisma.skKhach.findMany({
    where: { id: { in: ids }, memberId: { not: null } },
    select: { memberId: true, sk: { select: { eventId: true } } },
  });
  return ds.map((d) => ({ memberId: d.memberId!, eventId: d.sk.eventId }));
}

async function dongBoNhieu(ds: { memberId: string; eventId: string }[], nguoi: NguoiGhiDiem) {
  const da = new Set<string>();
  for (const d of ds) {
    const k = `${d.eventId}:${d.memberId}`;
    if (da.has(k)) continue;
    da.add(k);
    await dongBoHoiVien(d.eventId, d.memberId, nguoi);
  }
}

export async function suaDong(
  ten: string,
  id: string,
  vao: Record<string, unknown>,
  nguoi: NguoiGhiDiem
): Promise<{ dong: Dong } | { error: string; status?: number }> {
  const b = layBang(ten);
  if (!b) return { error: "Bảng không hợp lệ", status: 404 };
  const { cauHinh: c, db } = b;
  const cu = await db.findFirst({ where: { id, ...phamVi(c) } });
  if (!cu) return { error: "Không tìm thấy dòng", status: 404 };
  const r = await locDuLieu(ten, c, vao);
  if ("error" in r) return { error: r.error, status: 400 };
  if (Object.keys(r.data).length === 0) return { dong: cu };
  const truoc = ten === "khach" ? await hoiVienCuaKhach([id]) : [];
  if (ten === "taitro") {
    const kim = Number("hienKim" in r.data ? r.data.hienKim : cu.hienKim) || 0;
    const tri = Number("giaTri" in r.data ? r.data.giaTri : cu.giaTri) || 0;
    // Trang vinh danh cộng theo "Tổng giá trị" — không để nhỏ hơn tiền mặt cam kết
    if (tri < kim) r.data.giaTri = kim;
  }
  // Màn hình chiếu chỉ một câu hỏi: chiếu câu mới thì câu đang chiếu coi như đã trả lời
  if (ten === "cauhoi" && r.data.trangThai === "CHIEU") {
    await prisma.skCauHoi.updateMany({
      where: { skId: String(cu.skId), trangThai: "CHIEU", id: { not: id } },
      data: { trangThai: "DA_TRA_LOI" },
    });
  }
  const dong = await db.update({ where: { id }, data: r.data });
  if (ten === "khach" && "memberId" in r.data && r.data.memberId !== cu.memberId) {
    await dongBoNhieu([...truoc, ...(await hoiVienCuaKhach([id]))], nguoi);
  }
  return { dong };
}

export async function suaNhieu(
  ten: string,
  ids: string[],
  vao: Record<string, unknown>
): Promise<{ count: number } | { error: string; status?: number }> {
  const b = layBang(ten);
  if (!b) return { error: "Bảng không hợp lệ", status: 404 };
  const { cauHinh: c, db } = b;
  // Sửa hàng loạt chỉ cho cột phân loại — không đổi tên, SĐT, hội viên của nhiều dòng cùng lúc
  const r = await locDuLieu(ten, c, vao, [c.tieuDe, "memberId", "phone", "ten", "hoTen"]);
  if ("error" in r) return { error: r.error, status: 400 };
  if (Object.keys(r.data).length === 0) return { count: 0 };
  return db.updateMany({ where: { id: { in: ids.slice(0, 2000) }, ...phamVi(c) }, data: r.data });
}

export async function xoaNhieu(
  ten: string,
  ids: string[],
  nguoi: NguoiGhiDiem
): Promise<{ count: number } | { error: string; status?: number }> {
  const b = layBang(ten);
  if (!b) return { error: "Bảng không hợp lệ", status: 404 };
  const { cauHinh: c, db } = b;
  const ds = ids.slice(0, 2000);
  // Xoá khách / phiên làm mất lượt check-in → đưa điểm hội viên về đúng
  let anhHuong: { memberId: string; eventId: string }[] = [];
  if (ten === "khach") anhHuong = await hoiVienCuaKhach(ds);
  if (ten === "phien") {
    const k = await prisma.skThamDu.findMany({
      where: { phienId: { in: ds }, checkinLuc: { not: null } },
      select: { khachId: true },
    });
    anhHuong = await hoiVienCuaKhach(k.map((x) => x.khachId));
  }
  const r = await db.deleteMany({ where: { id: { in: ds }, ...phamVi(c) } });
  await dongBoNhieu(anhHuong, nguoi);
  return r;
}
