import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { chuanSoDienThoai, laSoDienThoaiVN } from "@/lib/so-dien-thoai";
import {
  BANG,
  LOAI_THU_CHI,
  MOI,
  NGUON_KHACH,
  TRANG_THAI_CAU_HOI,
  TRANG_THAI_HAU_CAN,
  TRANG_THAI_NCC,
  TRANG_THAI_RUI_RO,
  TRANG_THAI_THU_CHI,
  TRANG_THAI_VIEC,
  UU_TIEN,
  VAI_TRO_BTC,
  XAC_NHAN,
  chuan,
  epKieu,
  gioVN,
  ngayVN,
  nhanLuaChon,
} from "@/lib/trung-tam-sk/bang";
import { ghepHoiVien, napChiMucHoiVien } from "@/lib/trung-tam-sk/checkin";
import type { QuyenSk } from "@/lib/trung-tam-sk/may-chu";

/**
 * TRUNG TÂM SỰ KIỆN — Excel: nhập danh sách khách (file BTC đang dùng, cột
 * ghép theo tên tiêu đề) và xuất toàn bộ sự kiện ra một file nhiều sheet.
 */

// ─────────────────────────────── nhập khách ───────────────────────────────

const COT_TEN = ["ho va ten", "ho ten", "ten khach", "khach moi", "ten"];

function ghepCot(tieuDe: string): string | null {
  const n = chuan(tieuDe);
  if (!n) return null;
  for (const [k, t] of Object.entries(BANG.khach.truong)) {
    if (chuan(t.label) === n || t.tenKhac?.some((x) => chuan(x) === n)) return k;
  }
  for (const [k, t] of Object.entries(BANG.khach.truong)) {
    if (n.includes(chuan(t.label)) || t.tenKhac?.some((x) => n.includes(chuan(x)))) return k;
  }
  return null;
}

function docXacNhan(v: string): "CO" | "KHONG" | "CHO" | null {
  const n = chuan(v);
  if (!n) return null;
  if (/(khong|vang|tu choi|^0$)/.test(n)) return "KHONG";
  if (/(^x$|^co$|tham du|xac nhan|^ok$|^1$|^v$|da xn|yes)/.test(n)) return "CO";
  return "CHO";
}

export type KetQuaNhap = { them: number; capNhat: number; boQua: number; ghepHoiVien: number; loi: string[] };

export async function nhapKhachExcel(eventId: string, buf: ArrayBuffer): Promise<KetQuaNhap> {
  const sk = await prisma.skSuKien.findUnique({
    where: { eventId },
    select: { id: true, phien: { select: { id: true, ten: true } } },
  });
  if (!sk) throw new Error("Sự kiện chưa bật quản lý ở Trung tâm");

  const wb = XLSX.read(buf, { type: "array" });
  // Sheet có nhiều dòng nhất — file BTC thường có sheet hướng dẫn ở đầu
  const sheet = wb.SheetNames.map((n) => wb.Sheets[n]).sort(
    (a, b) =>
      XLSX.utils.sheet_to_json(b, { header: 1 }).length - XLSX.utils.sheet_to_json(a, { header: 1 }).length
  )[0];
  if (!sheet) throw new Error("File không có dữ liệu");
  const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", raw: false });

  const hdrIdx = rows.slice(0, 20).findIndex((r) => r.some((c) => COT_TEN.includes(chuan(String(c)))));
  if (hdrIdx < 0) throw new Error('Không thấy dòng tiêu đề có cột "Họ và tên"');
  const hdr = rows[hdrIdx].map(String);
  const cot = hdr.map((h) => {
    const p = sk.phien.find((x) => chuan(x.ten) === chuan(h));
    return p ? `phien:${p.id}` : ghepCot(h);
  });
  if (!cot.includes("ten")) throw new Error('Không thấy cột "Họ và tên"');

  const cu = await prisma.skKhach.findMany({
    where: { skId: sk.id },
    select: { id: true, ten: true, donVi: true, phone: true, chucDanh: true, email: true, nhom: true, nguoiMoi: true, ban: true, danhXung: true },
  });
  const theoSdt = new Map<string, (typeof cu)[number]>();
  const theoTen = new Set<string>();
  for (const k of cu) {
    const s = chuanSoDienThoai(k.phone);
    if (laSoDienThoaiVN(s)) theoSdt.set(s, k);
    theoTen.add(`${chuan(k.ten)}|${chuan(k.donVi ?? "")}`);
  }

  const cm = await napChiMucHoiVien();
  const max = await prisma.skKhach.aggregate({ where: { skId: sk.id }, _max: { order: true } });
  let order = max._max.order ?? 0;
  const kq: KetQuaNhap = { them: 0, capNhat: 0, boQua: 0, ghepHoiVien: 0, loi: [] };
  let nhomHienTai: string | null = null;
  const coCotNhom = cot.includes("nhom");

  for (const [i, r] of rows.slice(hdrIdx + 1).entries()) {
    const dong: Record<string, unknown> = {};
    const xacNhan: Record<string, string> = {};
    cot.forEach((k, j) => {
      const v = String(r[j] ?? "").trim();
      if (!k || !v) return;
      if (k.startsWith("phien:")) {
        const x = docXacNhan(v);
        if (x) xacNhan[k.slice(6)] = x;
      } else dong[k] = v;
    });
    const ten = String(dong.ten ?? "").replace(/\s+/g, " ").trim();
    if (!ten) continue;
    // Dòng tiêu đề nhóm ("CHI HỘI CHỢ LỚN", "VĂN PHÒNG HỘI"…): chữ HOA, không SĐT / đơn vị
    const coDuLieu = ["phone", "donVi", "chucDanh", "email"].some((k) => dong[k]);
    if (!coDuLieu && ten.length > 4 && ten === ten.toUpperCase() && /[A-ZĐ]/.test(ten)) {
      nhomHienTai = ten;
      continue;
    }
    if (!/[a-zA-ZÀ-ỹ]/.test(ten) || /^\d+$/.test(ten)) continue;

    const data: Record<string, unknown> = {};
    for (const [k, t] of Object.entries(BANG.khach.truong)) {
      if (!(k in dong)) continue;
      const v = epKieu(t, dong[k]);
      if (v !== undefined && v !== null) data[k] = v;
    }
    data.ten = ten.slice(0, 200);
    if (!coCotNhom && nhomHienTai && !data.nhom) data.nhom = nhomHienTai;

    try {
      const sdt = chuanSoDienThoai(data.phone as string | undefined);
      const trung = laSoDienThoaiVN(sdt) ? theoSdt.get(sdt) : undefined;
      if (trung) {
        // Đã có (trùng SĐT): chỉ điền ô đang trống, KHÔNG đè thông tin BTC đã sửa tay
        const bu: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(data)) {
          if (k === "ten") continue;
          if (!(trung as Record<string, unknown>)[k]) bu[k] = v;
        }
        if (Object.keys(bu).length) await prisma.skKhach.update({ where: { id: trung.id }, data: bu });
        await ghiXacNhan(trung.id, xacNhan);
        kq.capNhat++;
        continue;
      }
      const khoaTen = `${chuan(String(data.ten))}|${chuan(String(data.donVi ?? ""))}`;
      if (theoTen.has(khoaTen)) {
        kq.boQua++;
        continue;
      }
      const memberId = ghepHoiVien(
        { ten: String(data.ten), phone: (data.phone as string) ?? null, donVi: (data.donVi as string) ?? null, nhom: (data.nhom as string) ?? null },
        cm
      );
      if (memberId) kq.ghepHoiVien++;
      const moi = await prisma.skKhach.create({
        data: { ...data, ten: String(data.ten), skId: sk.id, memberId, nguon: "EXCEL", order: ++order },
        select: { id: true },
      });
      await ghiXacNhan(moi.id, xacNhan);
      theoTen.add(khoaTen);
      if (laSoDienThoaiVN(sdt)) theoSdt.set(sdt, { id: moi.id, ten: String(data.ten), donVi: null, phone: sdt, chucDanh: null, email: null, nhom: null, nguoiMoi: null, ban: null, danhXung: null });
      kq.them++;
    } catch (e) {
      if (kq.loi.length < 10) kq.loi.push(`Dòng ${hdrIdx + i + 2}: ${e instanceof Error ? e.message : "lỗi"}`);
    }
  }
  return kq;
}

async function ghiXacNhan(khachId: string, xn: Record<string, string>) {
  for (const [phienId, xacNhan] of Object.entries(xn)) {
    await prisma.skThamDu.upsert({
      where: { khachId_phienId: { khachId, phienId } },
      create: { khachId, phienId, xacNhan },
      update: { xacNhan },
    });
  }
}

// ─────────────────────────────── xuất file ───────────────────────────────

const tien = (n: number) => Math.round(n);

export async function xuatExcel(eventId: string, q: QuyenSk): Promise<{ ten: string; buf: Buffer }> {
  const ev = await prisma.event.findUnique({
    where: { id: eventId },
    select: { title: true, slug: true, startAt: true, location: true, toChuc: { select: { id: true } } },
  });
  if (!ev?.toChuc) throw new Error("Sự kiện chưa bật quản lý ở Trung tâm");
  const skId = ev.toChuc.id;
  const phien = await prisma.skPhien.findMany({ where: { skId }, orderBy: { order: "asc" } });
  const wb = XLSX.utils.book_new();
  const them = (ten: string, ds: Record<string, unknown>[]) =>
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ds.length ? ds : [{ "": "(trống)" }]), ten);

  if (q.quanLy) {
    const khach = await prisma.skKhach.findMany({
      where: { skId },
      orderBy: [{ order: "asc" }],
      include: { thamDu: true },
    });
    const ma = new Map(
      (
        await prisma.member.findMany({
          where: { id: { in: khach.map((k) => k.memberId).filter((x): x is string => !!x) } },
          select: { id: true, code: true },
        })
      ).map((m) => [m.id, m.code])
    );
    them(
      "Khách mời",
      khach.map((k, i) => {
        const o: Record<string, unknown> = {
          STT: i + 1,
          "Danh xưng": k.danhXung ?? "",
          "Họ và tên": k.ten,
          "Chức danh": k.chucDanh ?? "",
          "Đơn vị": k.donVi ?? "",
          SĐT: k.phone ?? "",
          Email: k.email ?? "",
          "Nhóm khách": k.nhom ?? "",
          "Người mời": k.nguoiMoi ?? "",
          "Tình trạng mời": nhanLuaChon(MOI, k.moi),
          VIP: k.vip ? "x" : "",
          Bàn: k.ban ?? "",
          "Mã hội viên": k.memberId ? ma.get(k.memberId) ?? "" : "",
          Nguồn: nhanLuaChon(NGUON_KHACH, k.nguon),
        };
        for (const p of phien) {
          const t = k.thamDu.find((x) => x.phienId === p.id);
          o[p.ten] = nhanLuaChon(XAC_NHAN, t?.xacNhan ?? "CHO");
          o[`Check-in ${p.ten}`] = t?.checkinLuc ? `${gioVN(t.checkinLuc)} ${ngayVN(t.checkinLuc)}` : "";
        }
        o["Ghi chú"] = k.ghiChu ?? "";
        return o;
      })
    );
    const btc = await prisma.banToChuc.findMany({ where: { eventId }, orderBy: [{ order: "asc" }] });
    them(
      "Ban tổ chức",
      btc.map((b) => ({
        Ban: b.ban ?? "",
        "Họ và tên": b.hoTen,
        "Vai trò": nhanLuaChon(VAI_TRO_BTC, b.vaiTro),
        "Nhiệm vụ": b.nhiemVu ?? "",
        SĐT: b.soDienThoai ?? "",
        "Ca trực": b.caTruc ?? "",
        "Ghi chú": b.ghiChu ?? "",
      }))
    );
    const viec = await prisma.skViec.findMany({ where: { skId }, orderBy: [{ hanChot: "asc" }, { order: "asc" }] });
    them(
      "Công việc",
      viec.map((v) => ({
        Ban: v.ban ?? "",
        "Công việc": v.tieuDe,
        "Người làm": v.nguoiLam ?? "",
        "Hạn chót": ngayVN(v.hanChot),
        "Ưu tiên": nhanLuaChon(UU_TIEN, v.uuTien),
        "Trạng thái": nhanLuaChon(TRANG_THAI_VIEC, v.trangThai),
        "Ghi chú": v.ghiChu ?? "",
      }))
    );
    const kb = await prisma.skKichBan.findMany({ where: { skId }, orderBy: { order: "asc" } });
    them(
      "Kịch bản",
      kb.map((k) => ({
        Phiên: phien.find((p) => p.id === k.phienId)?.ten ?? "",
        Giờ: k.gio ?? "",
        Phút: k.thoiLuong ?? "",
        "Nội dung": k.noiDung,
        "Phụ trách": k.phuTrach ?? "",
        "Âm thanh / LED": k.kyThuat ?? "",
        "Nội bộ": k.noiBo ? "x" : "",
        "Ghi chú": k.ghiChu ?? "",
      }))
    );
    const hc = await prisma.skHauCan.findMany({ where: { skId }, orderBy: { order: "asc" } });
    them(
      "Hậu cần",
      hc.map((h) => ({
        Nhóm: h.nhom ?? "",
        "Hạng mục": h.ten,
        SL: h.soLuong ?? "",
        ĐVT: h.donVi ?? "",
        "Phụ trách": h.phuTrach ?? "",
        Hạn: ngayVN(h.hanChot),
        "Trạng thái": nhanLuaChon(TRANG_THAI_HAU_CAN, h.trangThai),
        "Ghi chú": h.ghiChu ?? "",
      }))
    );
    const [ncc, ruiRo, taiLieu, baiDang, giai, cauHoi, danhGia] = await Promise.all([
      prisma.skNhaCungCap.findMany({ where: { skId }, orderBy: { order: "asc" } }),
      prisma.skRuiRo.findMany({ where: { skId }, orderBy: { order: "asc" } }),
      prisma.skTaiLieu.findMany({ where: { skId }, orderBy: { order: "asc" } }),
      prisma.skBaiDang.findMany({ where: { skId }, orderBy: [{ ngay: "asc" }, { order: "asc" }] }),
      prisma.skGiai.findMany({
        where: { skId },
        orderBy: { order: "asc" },
        include: { trung: { orderBy: { luc: "asc" }, include: { khach: { select: { ten: true, donVi: true } } } } },
      }),
      prisma.skCauHoi.findMany({ where: { skId }, orderBy: { createdAt: "asc" } }),
      prisma.skDanhGia.findMany({ where: { skId }, orderBy: { createdAt: "asc" } }),
    ]);
    them(
      "NCC",
      ncc.map((n) => ({
        "Hạng mục": n.hangMuc,
        "Nhà cung cấp": n.ten ?? "",
        "Liên hệ": n.lienHe ?? "",
        "Giá trị HĐ": tien(n.giaTri),
        "Đã cọc": tien(n.daCoc),
        "Trạng thái": nhanLuaChon(TRANG_THAI_NCC, n.trangThai),
        "Ghi chú": n.ghiChu ?? "",
      }))
    );
    them(
      "Rủi ro",
      ruiRo.map((r) => ({
        "Rủi ro": r.ruiRo,
        "Khả năng": r.khaNang,
        "Tác động": r.tacDong,
        Mức: r.khaNang * r.tacDong,
        "Phương án": r.phuongAn ?? "",
        "Người xử lý": r.nguoiXuLy ?? "",
        "Trạng thái": nhanLuaChon(TRANG_THAI_RUI_RO, r.trangThai),
      }))
    );
    them(
      "Truyền thông",
      [
        ...taiLieu.map((t) => ({ Loại: "Link", Ngày: "", Nhóm: t.nhom ?? "", Tên: t.ten, Link: t.url ?? "", Reach: "", "Tương tác": "" })),
        ...baiDang.map((b) => ({
          Loại: "Bài đăng",
          Ngày: ngayVN(b.ngay),
          Nhóm: b.kenh ?? "",
          Tên: b.tieuDe,
          Link: b.link ?? "",
          Reach: b.reach,
          "Tương tác": b.tuongTac,
        })),
      ]
    );
    them(
      "Bốc thăm",
      giai.flatMap((g) =>
        g.trung.length
          ? g.trung.map((t) => ({
              Giải: g.ten,
              "Phần quà": g.phanQua ?? "",
              "Nhà tài trợ giải": g.nhaTaiTro ?? "",
              "Người trúng": t.khach.ten,
              "Đơn vị": t.khach.donVi ?? "",
              "Trạng thái": t.trangThai === "VANG" ? "Vắng — đã quay lại" : "Trúng",
              Lúc: `${gioVN(t.luc)} ${ngayVN(t.luc)}`,
            }))
          : [{ Giải: g.ten, "Phần quà": g.phanQua ?? "", "Nhà tài trợ giải": g.nhaTaiTro ?? "", "Người trúng": "", "Đơn vị": "", "Trạng thái": "", Lúc: "" }]
      )
    );
    them(
      "Hỏi đáp",
      cauHoi.map((c) => ({
        "Câu hỏi": c.noiDung,
        "Người hỏi": c.ten ?? "Ẩn danh",
        "Trạng thái": nhanLuaChon(TRANG_THAI_CAU_HOI, c.trangThai),
        Lúc: `${gioVN(c.createdAt)} ${ngayVN(c.createdAt)}`,
      }))
    );
    them(
      "Đánh giá",
      danhGia.map((d) => ({
        "Hài lòng (1–5)": d.haiLong,
        "NPS (0–10)": d.nps ?? "",
        "Thích nhất": d.thichNhat ?? "",
        "Góp ý": d.gopY ?? "",
        Tên: d.ten ?? "",
        Lúc: `${gioVN(d.createdAt)} ${ngayVN(d.createdAt)}`,
      }))
    );
  }

  if (q.taiChinh) {
    const hang = await prisma.skHangTaiTro.findMany({ where: { skId }, orderBy: { order: "asc" } });
    them(
      "Hạng tài trợ",
      hang.map((h) => ({ Hạng: h.ten, "Mức tài trợ": tien(h.mucTien), "Số suất": h.soSuat ?? "", "Quyền lợi": h.quyenLoi ?? "" }))
    );
    const tt = await prisma.taiTroSuKien.findMany({
      where: { eventId },
      orderBy: [{ order: "asc" }],
      include: { quyenLoi: true },
    });
    them(
      "Tài trợ",
      tt.map((t) => ({
        "Nhà tài trợ": t.nhaTaiTro,
        Hạng: t.mucTaiTro ?? "",
        "Tiền mặt cam kết": tien(t.hienKim),
        "Hiện vật": t.hienVat ?? "",
        "Tổng giá trị": tien(t.giaTri),
        "Đã thu": tien(t.daThu),
        "Ngày thu": ngayVN(t.ngayThu),
        "Trạng thái": t.trangThai,
        "Người vận động": t.nguoiVanDong ?? "",
        "Quyền lợi đã thực hiện": `${t.quyenLoi.filter((x) => x.xong).length}/${t.quyenLoi.length}`,
        "Ghi chú": t.ghiChu ?? "",
      }))
    );
    const tc = await prisma.skThuChi.findMany({ where: { skId }, orderBy: [{ loai: "asc" }, { order: "asc" }] });
    them(
      "Thu chi",
      tc.map((t) => ({
        Loại: nhanLuaChon(LOAI_THU_CHI, t.loai),
        "Hạng mục": t.hangMuc,
        Ban: t.ban ?? "",
        "Dự trù": tien(t.duTru),
        "Thực tế": tien(t.thucTe),
        "Trạng thái": nhanLuaChon(TRANG_THAI_THU_CHI, t.trangThai),
        "Phụ trách": t.phuTrach ?? "",
        Ngày: ngayVN(t.ngay),
        "Ghi chú": t.ghiChu ?? "",
      }))
    );
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
  return { ten: `${ev.slug}-${ngayVN(ev.startAt).replace(/\//g, "-")}.xlsx`, buf };
}
