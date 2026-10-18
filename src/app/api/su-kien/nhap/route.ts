import * as XLSX from "xlsx";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { normalizeSearch } from "@/lib/search";
import { uniqueSlug } from "@/lib/slug";

/**
 * Nhận file Excel thư ký khai báo một chương trình (theo mẫu ở /mau) và tạo
 * hoặc cập nhật sự kiện kèm ban tổ chức, người tham dự, nhà tài trợ.
 *
 * Đây là nguồn dữ liệu để chấm điểm hoạt động của hội viên và Ban Chủ nhiệm.
 */

export const runtime = "nodejs";

type Ket = { ok?: string; error?: string; chiTiet?: string[] };

/** Đọc sheet thành mảng object, khoá là tên cột đã bỏ dấu và viết thường. */
function docSheet(wb: XLSX.WorkBook, ten: string): Record<string, string>[] {
  const sheet = wb.Sheets[wb.SheetNames.find((s) => s.includes(ten)) ?? ""];
  if (!sheet) return [];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  return rows.map((r) => {
    const o: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      o[normalizeSearch(String(k))] = String(v ?? "").trim();
    }
    return o;
  });
}

/** Lấy giá trị theo nhiều tên cột có thể có. */
function lay(r: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    const kk = normalizeSearch(k);
    if (r[kk]) return r[kk];
  }
  return "";
}

const soTien = (s: string) => Number(s.replace(/[^\d]/g, "")) || 0;

/** Ngày dạng dd/mm/yyyy hoặc yyyy-mm-dd. */
function docNgay(s: string): Date | null {
  const t = s.trim();
  let m = t.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 9);
  m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 9);
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

const VAI_TRO: Record<string, string> = {
  "truong ban": "TRUONG_BAN",
  "pho ban": "PHO_BAN",
  "ban chi dao": "BAN_CHI_DAO",
  "thanh vien": "THANH_VIEN",
};

export async function POST(req: Request): Promise<Response> {
  const user = await getCurrentUser();
  if (!co(user, QUYEN.SU_KIEN_QUAN_LY)) {
    return Response.json({ error: "Không có quyền" } satisfies Ket, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Chưa chọn file" } satisfies Ket, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return Response.json({ error: "File quá lớn (tối đa 10 MB)" } satisfies Ket, {
      status: 400,
    });
  }

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(await file.arrayBuffer(), { type: "buffer" });
  } catch {
    return Response.json(
      { error: "Không đọc được file — anh/chị dùng đúng mẫu .xlsx giúp" } satisfies Ket,
      { status: 400 }
    );
  }

  // ── Sheet 1: thông tin chương trình (dạng MỤC | NỘI DUNG) ──────
  const s1 = wb.Sheets[wb.SheetNames.find((s) => s.includes("Thông tin")) ?? ""];
  if (!s1) {
    return Response.json(
      { error: 'File thiếu sheet "1. Thông tin chương trình"' } satisfies Ket,
      { status: 400 }
    );
  }
  const oS1 = XLSX.utils.sheet_to_json<string[]>(s1, { header: 1, defval: "" });
  const tt = new Map<string, string>();
  for (const r of oS1) {
    const k = normalizeSearch(String(r?.[0] ?? ""));
    const v = String(r?.[1] ?? "").trim();
    if (k && v) tt.set(k, v);
  }
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = tt.get(normalizeSearch(k));
      if (v) return v;
    }
    return "";
  };

  const tieuDe = get("Tên chương trình");
  if (!tieuDe) {
    return Response.json(
      { error: "Chưa điền Tên chương trình ở sheet 1" } satisfies Ket,
      { status: 400 }
    );
  }
  const ngay = docNgay(get("Ngày tổ chức")) ?? new Date();

  // ── Tạo hoặc cập nhật sự kiện ─────────────────────────────────
  const daCo = await prisma.event.findFirst({
    where: { title: tieuDe },
    select: { id: true },
  });

  const duLieu = {
    title: tieuDe,
    startAt: ngay,
    location: get("Địa điểm tổ chức") || null,
    activityGroup: get("Mảng hoạt động") || null,
    seriesName: get("Chương trình định kỳ") || null,
    content: get("Nội dung chương trình") || null,
    yNghia: get("Ý nghĩa chương trình") || null,
    tongKinhPhi: soTien(get("Tổng kinh phí (VNĐ)", "Tổng kinh phí")),
    summary: get("Nội dung chương trình").slice(0, 300) || null,
  };

  const eventId = daCo
    ? (await prisma.event.update({ where: { id: daCo.id }, data: duLieu })).id
    : (
        await prisma.event.create({
          data: {
            ...duLieu,
            published: false,
            slug: await uniqueSlug(
              tieuDe,
              async (s) => !!(await prisma.event.findUnique({ where: { slug: s } }))
            ),
          },
        })
      ).id;

  // ── Tra hội viên theo mã và theo tên doanh nghiệp ─────────────
  const members = await prisma.member.findMany({
    select: { id: true, code: true, company: true, name: true },
  });
  const theoMa = new Map(members.map((m) => [m.code.toUpperCase(), m.id]));
  const theoCty = new Map<string, string>();
  const theoTen = new Map<string, string>();
  for (const m of members) {
    const kc = normalizeSearch(m.company);
    const kt = normalizeSearch(m.name);
    if (!theoCty.has(kc)) theoCty.set(kc, m.id);
    if (!theoTen.has(kt)) theoTen.set(kt, m.id);
  }
  const timHV = (ma: string, cty: string, ten: string) =>
    theoMa.get(ma.trim().toUpperCase()) ??
    theoCty.get(normalizeSearch(cty)) ??
    theoTen.get(normalizeSearch(ten)) ??
    null;

  // Nhập lại cùng một chương trình thì thay hẳn, tránh nhân đôi danh sách
  await Promise.all([
    prisma.banToChuc.deleteMany({ where: { eventId } }),
    prisma.nguoiThamDu.deleteMany({ where: { eventId } }),
    prisma.taiTroSuKien.deleteMany({ where: { eventId } }),
  ]);

  // ── Sheet 2: ban tổ chức ──────────────────────────────────────
  const btc = docSheet(wb, "Ban tổ chức");
  let soBTC = 0;
  for (const r of btc) {
    const hoTen = lay(r, "Họ và tên");
    if (!hoTen) continue;
    const cty = lay(r, "Doanh nghiệp");
    const ma = lay(r, "Mã hội viên");
    await prisma.banToChuc.create({
      data: {
        eventId,
        hoTen,
        vaiTro: VAI_TRO[normalizeSearch(lay(r, "Vai trò"))] ?? "THANH_VIEN",
        memberId: timHV(ma, cty, hoTen),
        ghiChu: lay(r, "Ghi chú") || null,
      },
    });
    soBTC++;
  }

  // ── Sheet 3: người tham gia ───────────────────────────────────
  const td = docSheet(wb, "Người tham gia");
  let soTD = 0;
  for (const r of td) {
    const hoTen = lay(r, "Họ và tên");
    if (!hoTen) continue;
    const donVi = lay(r, "Doanh nghiệp / đơn vị", "Doanh nghiệp");
    await prisma.nguoiThamDu.create({
      data: {
        eventId,
        hoTen,
        donVi: donVi || null,
        soDienThoai: lay(r, "Số điện thoại") || null,
        memberId: timHV(lay(r, "Mã hội viên"), donVi, hoTen),
        ghiChu: lay(r, "Ghi chú") || null,
      },
    });
    soTD++;
  }

  // ── Sheet 4: nhà tài trợ ──────────────────────────────────────
  const tt4 = docSheet(wb, "Nhà tài trợ");
  let soTT = 0;
  let tongTaiTro = 0;
  for (const r of tt4) {
    const nhaTaiTro = lay(r, "Nhà tài trợ");
    if (!nhaTaiTro) continue;
    const hienKim = soTien(lay(r, "Hiện kim (VNĐ)", "Hiện kim"));
    const giaTriHV = soTien(lay(r, "Giá trị hiện vật (VNĐ)", "Giá trị hiện vật"));
    tongTaiTro += hienKim + giaTriHV;
    await prisma.taiTroSuKien.create({
      data: {
        suKien: tieuDe,
        eventId,
        nhaTaiTro,
        memberId: timHV(lay(r, "Mã hội viên"), nhaTaiTro, ""),
        mucTaiTro: lay(r, "Mức tài trợ") || null,
        hienKim,
        hienVat: lay(r, "Hiện vật — mô tả", "Hiện vật") || null,
        giaTri: hienKim + giaTriHV,
        trangThai: lay(r, "Trạng thái") || "Hoàn tất",
        ghiChu: lay(r, "Ghi chú") || null,
      },
    });
    soTT++;
  }

  return Response.json({
    ok: daCo ? `Đã cập nhật chương trình "${tieuDe}".` : `Đã tạo chương trình "${tieuDe}".`,
    chiTiet: [
      `${soBTC} thành viên ban tổ chức`,
      `${soTD} người tham dự`,
      `${soTT} nhà tài trợ · tổng ${(tongTaiTro / 1_000_000).toLocaleString("vi")} triệu ₫`,
      daCo ? "Sự kiện đã có sẵn nên được cập nhật lại." : "Sự kiện mới đang ở trạng thái nháp — vào sửa và công bố khi sẵn sàng.",
    ],
  } satisfies Ket);
}
