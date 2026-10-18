import { prisma } from "@/lib/prisma";
import { normalizeSearch } from "@/lib/search";

/**
 * ĐỒNG BỘ XÁC NHẬN từ Google Sheet master của BTC về danh sách khách mời
 * 10/10 (Chủ nhiệm yêu cầu 24/09: đa số khách xác nhận qua Zalo/điện thoại
 * và BTC ghi vào sheet, ít người bấm web — sheet là nguồn ĐỦ nhất).
 *
 * Sheet chia sẻ "ai có link đều xem" nên đọc qua đường xuất CSV công khai,
 * không cần khoá API. Cột dò theo TÊN TIÊU ĐỀ (không theo vị trí) để BTC
 * chèn thêm cột không làm gãy: HỌ VÀ TÊN · SDT · Công Ty · TỌA ĐÀM · LỄ ·
 * GALA, giá trị "Xác nhận tham gia" / "Không tham gia" / "Đang chờ".
 *
 * Luật ghi:
 *  - Ô có chữ "Xác nhận tham gia" ở phiên nào → khách XAC_NHAN phiên đó.
 *  - Có ô "Không tham gia" và KHÔNG phiên nào xác nhận → VANG.
 *  - "Đang chờ" / bỏ trống hết → KHÔNG đụng bản ghi (giữ phản hồi web).
 *  - Khớp theo tên không dấu; trùng tên thì đối chiếu SĐT rồi công ty,
 *    vẫn nhập nhằng thì BỎ QUA và báo ra để BTC xử tay — thà sót còn hơn
 *    ghi nhầm người.
 */

const SHEET_CSV =
  "https://docs.google.com/spreadsheets/d/1PXyDrWG8w1zWj9wm8KHcR31lvEP7ce_IM5KkMPnI1qU/export?format=csv&gid=1096001091";

/**
 * Tab "DS Tiệc & Xếp bàn" — BTC xếp SỐ BÀN ở đây (Chủ tịch chốt 05/10),
 * KHÔNG phải tab đăng ký. Nút đồng bộ kéo thêm cột Bàn từ tab này; các cột
 * xác nhận tham dự vẫn chỉ đọc từ tab đăng ký ở trên.
 */
const SHEET_CSV_XEP_BAN =
  "https://docs.google.com/spreadsheets/d/1PXyDrWG8w1zWj9wm8KHcR31lvEP7ce_IM5KkMPnI1qU/export?format=csv&gid=193854919";

const XAC_NHAN = "xác nhận tham gia";
const KHONG = "không tham gia";

export type KetQuaDongBo = {
  daDoc: number;
  xacNhan: number;
  vang: number;
  giuNguyen: number;
  khongThayTrongWeb: number;
  nhapNhang: string[];
  /** Số khách được ghi/đổi SỐ BÀN theo sheet (04–05/10) */
  banGhi: number;
  /** Tên trên tab xếp bàn có bàn nhưng không khớp được ai trên web */
  banBoQua: string[];
  /** Tab xếp bàn đọc không được (các phần khác vẫn chạy bình thường) */
  loiTabBan?: string;
  loi?: string;
};

/** Tách CSV có ô bọc nháy kép (kể cả xuống dòng trong ô). */
function tachCsv(van: string): string[][] {
  const dong: string[][] = [];
  let o = "", hang: string[] = [], trongNhay = false;
  for (let i = 0; i < van.length; i++) {
    const c = van[i];
    if (trongNhay) {
      if (c === '"') {
        if (van[i + 1] === '"') { o += '"'; i++; }
        else trongNhay = false;
      } else o += c;
    } else if (c === '"') trongNhay = true;
    else if (c === ",") { hang.push(o); o = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && van[i + 1] === "\n") i++;
      hang.push(o); o = "";
      dong.push(hang); hang = [];
    } else o += c;
  }
  if (o || hang.length) { hang.push(o); dong.push(hang); }
  return dong;
}

export async function dongBoXacNhanTuSheet(ghi: boolean): Promise<KetQuaDongBo> {
  const kq: KetQuaDongBo = {
    daDoc: 0, xacNhan: 0, vang: 0, giuNguyen: 0,
    khongThayTrongWeb: 0, nhapNhang: [], banGhi: 0, banBoQua: [],
  };

  let van: string;
  try {
    const r = await fetch(SHEET_CSV, {
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Sheet trả mã ${r.status}`);
    van = await r.text();
  } catch (e) {
    kq.loi =
      "Không đọc được Google Sheet — kiểm tra sheet còn ở chế độ chia sẻ " +
      "'ai có liên kết đều xem được' không. (" +
      (e instanceof Error ? e.message : String(e)) + ")";
    return kq;
  }

  const dong = tachCsv(van);
  const iTieuDe = dong.findIndex((d) =>
    d.some((c) => normalizeSearch(c).includes("ho va ten"))
  );
  if (iTieuDe < 0) {
    kq.loi = "Không tìm thấy hàng tiêu đề có cột HỌ VÀ TÊN trong sheet.";
    return kq;
  }
  const tieuDe = dong[iTieuDe].map((c) => normalizeSearch(c));
  const cot = (ten: string) => tieuDe.findIndex((c) => c.includes(ten));
  const iTen = cot("ho va ten");
  const iSdt = cot("sdt");
  const iCty = cot("cong ty");
  const iToaDam = cot("toa dam");
  const iLe = tieuDe.findIndex((c) => c === "le" || c.startsWith("le "));
  const iGala = cot("gala");
  // Cột SỐ BÀN (Chủ tịch đặt 04/10: BTC xếp bàn ngay trên sheet) — chưa có
  // cột thì bỏ qua, không bắt buộc
  const iBan = tieuDe.findIndex(
    (c) => c === "ban" || c === "so ban" || c.includes("so ban")
  );
  if (iToaDam < 0 || iGala < 0 || iLe < 0) {
    kq.loi = "Sheet thiếu cột TỌA ĐÀM / LỄ / GALA — cấu trúc đã đổi?";
    return kq;
  }

  // Nạp toàn bộ khách một lần, khớp trong bộ nhớ (≈315 người)
  const khachDs = await prisma.khachMoi1010.findMany({
    select: {
      id: true, ten: true, phone: true, donVi: true,
      trangThai: true, phien: true, xacNhanLuc: true, ban: true,
    },
  });
  const theoTen = new Map<string, typeof khachDs>();
  for (const k of khachDs) {
    const key = normalizeSearch(k.ten);
    const nhom = theoTen.get(key) ?? [];
    nhom.push(k);
    theoTen.set(key, nhom);
  }
  const soSach = (s: string) => s.replace(/[^\d]/g, "").replace(/^84/, "0");

  /** Khớp một dòng sheet vào đúng MỘT khách web — dùng cho cả tab đăng ký
   *  lẫn tab xếp bàn. Trả "NHAP_NHANG" khi trùng tên không phân giải được. */
  type KhachGon = (typeof khachDs)[number];
  const timKhach = (
    ten: string,
    sdtTho: string,
    ctyChuan: string
  ): KhachGon | "NHAP_NHANG" | null => {
    const ungVien = theoTen.get(normalizeSearch(ten)) ?? [];
    if (ungVien.length === 1) return ungVien[0];
    if (ungVien.length === 0) return null;
    const sdt = soSach(sdtTho);
    const theoSdt = sdt
      ? ungVien.filter((k) => k.phone && soSach(k.phone) === sdt)
      : [];
    if (theoSdt.length === 1) return theoSdt[0];
    if (ctyChuan) {
      const theoCty = ungVien.filter(
        (k) => k.donVi && normalizeSearch(k.donVi).includes(ctyChuan)
      );
      if (theoCty.length === 1) return theoCty[0];
    }
    return "NHAP_NHANG";
  };

  for (const hang of dong.slice(iTieuDe + 1)) {
    const ten = (hang[iTen] ?? "").trim();
    if (!ten || ten.length < 2) continue;
    const o = (i: number) => normalizeSearch((hang[i] ?? "").trim());
    const trangPhien = [
      ["TOA_DAM", o(iToaDam)],
      ["CHUYEN_GIAO", o(iLe)],
      ["GALA", o(iGala)],
    ] as const;
    const chon = trangPhien
      .filter(([, v]) => v.includes(normalizeSearch(XAC_NHAN)))
      .map(([ma]) => ma);
    const coKhong = trangPhien.some(([, v]) =>
      v.includes(normalizeSearch(KHONG))
    );
    // Số bàn trên sheet (nếu BTC đã thêm cột) — có bàn cũng coi là tín hiệu
    const banSheet = iBan >= 0 ? (hang[iBan] ?? "").trim().slice(0, 30) : "";
    if (chon.length === 0 && !coKhong && !banSheet) continue; // chưa có tín hiệu gì
    kq.daDoc++;

    // Khớp người
    const khop = timKhach(ten, hang[iSdt] ?? "", iCty >= 0 ? o(iCty) : "");
    if (khop === "NHAP_NHANG") {
      kq.nhapNhang.push(ten);
      continue;
    }
    if (!khop) {
      kq.khongThayTrongWeb++;
      continue;
    }
    const khach = khop;

    // Dòng chỉ có SỐ BÀN (chưa tích phản hồi) thì CHỈ ghi bàn, không được
    // đổi khách thành "xin vắng"
    const coPhanHoi = chon.length > 0 || coKhong;
    const trangThaiMoi = chon.length > 0 ? "XAC_NHAN" : "VANG";
    const phienMoi = chon.length > 0 ? chon.join(",") : null;
    const doiPhanHoi =
      coPhanHoi &&
      !(khach.trangThai === trangThaiMoi && (khach.phien ?? null) === phienMoi);
    // Sheet là nguồn xếp bàn: ô có giá trị thì đè bàn trên web; ô trống thì
    // GIỮ bàn web (không xoá)
    const doiBan = !!banSheet && (khach.ban ?? "") !== banSheet;
    if (!doiPhanHoi && !doiBan) {
      kq.giuNguyen++;
      continue;
    }
    if (ghi) {
      await prisma.khachMoi1010.update({
        where: { id: khach.id },
        data: {
          ...(doiPhanHoi
            ? {
                trangThai: trangThaiMoi,
                phien: phienMoi,
                xacNhanLuc: khach.xacNhanLuc ?? new Date(),
              }
            : {}),
          ...(doiBan ? { ban: banSheet } : {}),
        },
      });
    }
    if (doiBan) {
      kq.banGhi++;
      khach.ban = banSheet; // cho lượt tab xếp bàn bên dưới so đúng
    }
    if (doiPhanHoi) {
      if (trangThaiMoi === "XAC_NHAN") kq.xacNhan++;
      else kq.vang++;
    } else {
      kq.giuNguyen++;
    }
  }

  // ───── Kéo SỐ BÀN từ tab "DS Tiệc & Xếp bàn" (05/10) ─────
  // BTC xếp bàn ở tab riêng này (có thêm Hạng, Table Captain). Chỉ đọc cột
  // Bàn: ô có giá trị thì đè bàn web, ô trống giữ nguyên. Tab lỗi thì các
  // phần trên vẫn tính — chỉ báo thêm một dòng.
  try {
    const r2 = await fetch(SHEET_CSV_XEP_BAN, {
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!r2.ok) throw new Error(`tab trả mã ${r2.status}`);
    const dong2 = tachCsv(await r2.text());
    const iTd2 = dong2.findIndex((d) =>
      d.some((c) => normalizeSearch(c).includes("ho va ten"))
    );
    if (iTd2 < 0) throw new Error("không thấy hàng tiêu đề HỌ VÀ TÊN");
    const td2 = dong2[iTd2].map((c) => normalizeSearch(c));
    const iTen2 = td2.findIndex((c) => c.includes("ho va ten"));
    const iSdt2 = td2.findIndex((c) => c.includes("sdt"));
    const iCty2 = td2.findIndex((c) => c.includes("cong ty"));
    const iBan2 = td2.findIndex((c) => c === "ban" || c.includes("so ban"));
    if (iBan2 < 0) throw new Error("chưa có cột BÀN / SỐ BÀN");
    for (const hang of dong2.slice(iTd2 + 1)) {
      const ten = (hang[iTen2] ?? "").trim();
      const ban = (hang[iBan2] ?? "").trim().slice(0, 30);
      if (!ten || ten.length < 2 || !ban) continue;
      const khop = timKhach(
        ten,
        iSdt2 >= 0 ? (hang[iSdt2] ?? "") : "",
        iCty2 >= 0 ? normalizeSearch((hang[iCty2] ?? "").trim()) : ""
      );
      if (khop === "NHAP_NHANG") {
        kq.banBoQua.push(`${ten} (trùng tên)`);
        continue;
      }
      if (!khop) {
        kq.banBoQua.push(ten);
        continue;
      }
      if ((khop.ban ?? "") === ban) continue;
      if (ghi) {
        await prisma.khachMoi1010.update({
          where: { id: khop.id },
          data: { ban },
        });
      }
      khop.ban = ban;
      kq.banGhi++;
    }
  } catch (e) {
    kq.loiTabBan =
      'Chưa kéo được số bàn từ tab "DS Tiệc & Xếp bàn" — ' +
      (e instanceof Error ? e.message : String(e));
  }

  return kq;
}
