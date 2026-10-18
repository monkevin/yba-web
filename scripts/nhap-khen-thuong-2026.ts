import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";

/**
 * Nhập danh sách đề xuất khen thưởng công tác Hội vào mục Vinh danh.
 *
 * NGUỒN: "[YBA CHỢ LỚN] BẢNG TÓM TẮT BÁO CÁO THÀNH TÍCH" (Mẫu 2) do Ban Thư ký
 * soạn, bản 25/7/2026 — bản MỚI NHẤT. Bản 27/3/2026 cũ hơn và xếp mức khen
 * khác (ví dụ anh Nguyễn Đức Anh: bản cũ đề xuất Bằng khen HLHTN Thành phố,
 * bản mới nâng lên Bằng khen Hội DNT Việt Nam) — KHÔNG trộn hai bản, lấy bản
 * mới làm chuẩn. Chín người chỉ có ở bản cũ xem `soat/khen-thuong-chenh-lech.md`.
 *
 * Kỳ vinh danh tạo ra để `published = false` — Ban Chủ nhiệm tự bật ở
 * /quan-tri/vinh-danh khi muốn công bố cho hội viên xem.
 *
 * Xem trước:  npx tsx scripts/nhap-khen-thuong-2026.ts
 * Ghi thật:   npx tsx scripts/nhap-khen-thuong-2026.ts -- --ghi
 */

const KY = {
  slug: "khen-thuong-cong-tac-hoi-2026",
  name: "Đề xuất khen thưởng công tác Hội 2026",
  from: new Date("2025-01-01"),
  to: new Date("2026-12-31"),
  note:
    "Danh sách cá nhân có thành tích xuất sắc trong công tác Hội, Chi hội Chợ Lớn " +
    "đề xuất khen thưởng. Nguồn: bảng tóm tắt báo cáo thành tích Mẫu 2, bản 25/7/2026.",
};

const BANG_KHEN_TW = "Bằng khen Hội Doanh nhân trẻ Việt Nam";
const BANG_KHEN_TP = "Bằng khen Hội LHTN Việt Nam TP.HCM";

/** `tomTat` giữ ngắn để hiện gọn trên điện thoại; bản đầy đủ nằm ở văn bản gốc. */
const DANH_SACH: {
  ten: string;
  chucVu: string;
  capKhen: string;
  tomTat: string;
  taiTro?: string;
}[] = [
  {
    ten: "Nguyễn Đức Anh",
    chucVu: "Phó Chủ nhiệm Thường trực — Trưởng Ban Xúc tiến Kinh doanh",
    capKhen: BANG_KHEN_TW,
    tomTat:
      "Trưởng BTC 8 chương trình lớn: YBA Chợ Lớn x PSC, Connect Beyond, hợp tác Lãnh sự quán Singapore & ISCA, Toạ đàm gọi vốn Singapore, Du học Singapore, YBA Chợ Lớn x Arobid, Nhịp Cầu Doanh Nhân — Cầu Hữu Duyên, Year End Party 2024.",
    taiTro: "Trên 1 tỷ ₫ · NTT Kim cương nhiều chương trình",
  },
  {
    ten: "Phạm Văn Hoàng",
    chucVu: "Phó Chủ nhiệm — Trưởng Ban Hội viên",
    capKhen: BANG_KHEN_TW,
    tomTat:
      "Gia nhập Hội từ 01/2019, Trưởng ban Hội viên 2 nhiệm kỳ XI–XII. Trưởng BTC thăm doanh nghiệp khai xuân, cố vấn toàn bộ hoạt động hội viên. Tham gia 98% hoạt động Chi hội.",
    taiTro: "Chợ Lớn Cares, YEP 2025, các kỳ Họp mặt Hội viên",
  },
  {
    ten: "Lê Nguyên Tùng",
    chucVu: "Uỷ viên BCH Hội DNT TP.HCM — Phó Chủ nhiệm, Trưởng Ban Truyền thông",
    capKhen: BANG_KHEN_TW,
    tomTat:
      "Trưởng BTC Business & Library số 7, Coffee Share số 1 và số 5. Diễn giả, giảng viên xuyên suốt 3 khoá. Hỗ trợ toàn bộ quay chụp — truyền thông cho các sự kiện Chi hội và Hội.",
    taiTro: "Media, quay chụp, thiết kế cho hầu hết chương trình · nhiều gói NTT Vàng",
  },
  {
    ten: "Ngô Trí Thủy",
    chucVu: "Phó Chủ nhiệm — Trưởng Ban Đào tạo",
    capKhen: BANG_KHEN_TW,
    tomTat:
      "Trưởng BTC Hè xanh cùng con, Coffee Share số 1 và số 2. Biên tập kịch bản và MC hầu hết chương trình Chi hội, MC nhiều chương trình cấp Hội.",
    taiTro: "Nhịp Cầu Doanh Nhân — Cầu An Hoà, Cầu Hữu Duyên",
  },
  {
    ten: "Nguyễn Duy Trung",
    chucVu: "Phó ban Xúc tiến Kinh doanh",
    capKhen: BANG_KHEN_TP,
    tomTat:
      "Phó BTC Toạ đàm Singapore, Họp mặt Quý III/2025, Connect Beyond, Year End Party 2025, Coffee Share số 6. Biểu diễn văn nghệ tại One YBA và YEP tổng hội.",
    taiTro: "Khoảng 45 triệu ₫ tiền mặt và hiện vật",
  },
  {
    ten: "Đỗ Minh Trí",
    chucVu: "Trưởng ban Xúc tiến Kinh doanh (từ 03/2026)",
    capKhen: BANG_KHEN_TP,
    tomTat:
      "Trưởng BTC Họp mặt Quý IV/2025, Coffee Share số 6 & Họp mặt Quý II/2026. Phó BTC Họp mặt Quý III/2025, Connect Beyond, YBA Chợ Lớn x Arobid.",
    taiTro: "48.000.000 ₫",
  },
  {
    ten: "Vũ Thị Hoài Trang",
    chucVu: "Phó ban Hội viên",
    capKhen: BANG_KHEN_TP,
    tomTat:
      "Trưởng BTC Họp mặt Quý II/2025, thăm doanh nghiệp BASE.vn, thăm hội viên mới gia nhập và thẩm định hội viên tháng 5.",
    taiTro: "YEP, Coffee Share, Trung Hậu Cup, Nhịp Cầu Doanh Nhân, One YBA…",
  },
  {
    ten: "Trần Đức An",
    chucVu: "Phó ban Đối ngoại",
    capKhen: BANG_KHEN_TP,
    tomTat: "Tham gia 95% sự kiện Chi hội và Hội.",
    taiTro: "Khoảng 700.000.000 ₫ · rượu đấu giá 185 triệu ₫",
  },
  {
    ten: "Trần Thị Minh Anh",
    chucVu: "Phó ban Hội viên",
    capKhen: BANG_KHEN_TP,
    tomTat:
      "Phó BTC Nhịp Cầu Doanh Nhân — Cầu An Hoà. Trưởng BTC thăm doanh nghiệp khai xuân, thăm doanh nghiệp Giang's, Trưởng đoàn Hội thao Go-Kart 2026. Thành viên BTC hơn 15 chương trình.",
    taiTro: "Chợ Lớn Cares — Hướng Về Miền Trung",
  },
  {
    ten: "Lê Văn Chí Huy",
    chucVu: "Hội viên — Chủ tịch Hội Doanh nghiệp Phường Bình Tân",
    capKhen: BANG_KHEN_TP,
    tomTat:
      "Top 100 Doanh nhân trẻ khởi nghiệp xuất sắc 2026. Tham gia hầu hết hoạt động quan trọng của Chi hội.",
    taiTro: "YEP, Coffee Share số 4 và số 6 · 20.000.000 ₫",
  },
  {
    ten: "Nguyễn Thị Lệ Thủy",
    chucVu: "Tổng Thư ký",
    capKhen: BANG_KHEN_TP,
    tomTat:
      "Trưởng BTC Connect Beyond, Year End Party 2025, Caravan Chợ Lớn x Vũng Tàu – Long Đất. Phó BTC 5 chương trình lớn. Ghi chú của Ban Thư ký: đóng góp nhiều, không dự đại hội lần này.",
    taiTro: "Khoảng 24 triệu ₫ tiền mặt · 150 phần quà ủng hộ Khánh Hoà",
  },
];

async function main() {
  const ghi = process.argv.includes("--ghi");

  const hoiVien = await prisma.member.findMany({
    where: { active: true },
    select: { id: true, name: true, company: true },
  });
  const tim = (ten: string) => {
    const c = normalizeSearch(ten);
    return (
      hoiVien.find((m) => normalizeSearch(m.name) === c) ??
      hoiVien.find((m) => normalizeSearch(m.name).includes(c)) ??
      null
    );
  };

  console.log(ghi ? "— GHI THẬT —\n" : "— XEM TRƯỚC (thêm -- --ghi để ghi thật) —\n");

  const thieu: string[] = [];
  const sanSang: { memberId: string; d: (typeof DANH_SACH)[number] }[] = [];

  for (const d of DANH_SACH) {
    const m = tim(d.ten);
    if (!m) {
      thieu.push(d.ten);
      console.log(`  ✗ ${d.ten} — không có hồ sơ hội viên, BỎ QUA`);
      continue;
    }
    sanSang.push({ memberId: m.id, d });
    console.log(`  ✓ ${d.ten.padEnd(22)} ${d.capKhen}`);
  }

  console.log(`\n${sanSang.length}/${DANH_SACH.length} người sẽ được ghi nhận.`);
  if (thieu.length) console.log("Chưa có hồ sơ:", thieu.join(", "));

  if (!ghi) return;

  const ky = await prisma.awardPeriod.upsert({
    where: { slug: KY.slug },
    update: { name: KY.name, from: KY.from, to: KY.to, note: KY.note },
    create: { ...KY, published: false },
  });

  // Xoá giải cũ của đúng kỳ này rồi ghi lại — chạy script nhiều lần không nhân đôi
  await prisma.award.deleteMany({ where: { periodId: ky.id } });

  for (const { memberId, d } of sanSang) {
    await prisma.award.create({
      data: {
        periodId: ky.id,
        memberId,
        category: d.capKhen,
        rank: 0,
        metric: d.taiTro ?? null,
        note: `${d.chucVu}. ${d.tomTat}`,
      },
    });
  }

  console.log(`\nĐã ghi kỳ "${ky.name}" với ${sanSang.length} cá nhân.`);
  console.log("Kỳ đang ở trạng thái CHƯA CÔNG BỐ — bật ở /quan-tri/vinh-danh khi muốn hội viên xem.");
}

main().finally(() => prisma.$disconnect());
