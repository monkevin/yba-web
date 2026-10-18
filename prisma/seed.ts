/**
 * Dữ liệu khởi tạo cho website YBA Chợ Lớn.
 *
 *   npm run db:seed
 *
 * Gồm hai phần:
 *   1. DỮ LIỆU THẬT — ngành nghề, nhóm sinh hoạt, Ban Chủ nhiệm (lấy từ Profile
 *      Chi hội) và 20 doanh nghiệp đã xuất hiện trong Profile.
 *   2. DỮ LIỆU MẪU — hội viên, giao dịch, tin mua/bán sinh tự động để xem thử
 *      giao diện. Khi có file danh sách hội viên thật thì chạy
 *      `npm run nhap-hoi-vien` để thay thế.
 */
import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  CATEGORIES,
  CHAPTERS,
  DOANH_NGHIEP_PROFILE,
  LEADERS,
  NHIEM_KY,
} from "./du-lieu-chi-hoi";
import { formatShortVnd } from "../src/lib/format";
import { ngayHetHan } from "../src/lib/listing";
import { buildMemberSearchText, normalizeSearch } from "../src/lib/search";
import { topBuyers, topReferrers, topSellers } from "../src/lib/stats";
import { HANG_MUC } from "../src/lib/vinh-danh";
import { toSlug } from "../src/lib/slug";

const prisma = new PrismaClient();

const QUAN = [
  "Quận 5",
  "Quận 6",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận Bình Tân",
  "Huyện Bình Chánh",
];

const HO = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Đặng", "Bùi", "Đỗ", "Lý"];
const DEM = ["Văn", "Thị", "Minh", "Hoàng", "Quốc", "Thanh", "Hữu", "Ngọc", "Tuấn", "Gia"];
const TEN = ["An", "Bình", "Chi", "Dũng", "Giang", "Hà", "Hải", "Hùng", "Khoa", "Lan", "Linh", "Long", "Mai", "Nam", "Nga", "Phong", "Quân", "Sơn", "Tâm", "Thảo", "Trang", "Tuấn", "Vy", "Yến"];

const LOAI_HINH = ["Công ty TNHH", "Công ty Cổ phần", "Công ty TNHH MTV", "DNTN"];
const THUONG_HIEU = [
  "An Phát", "Bảo Long", "Cát Tường", "Đại Việt", "Đông Á", "Gia Huy", "Hoàng Gia",
  "Hùng Vương", "Khang Thịnh", "Kim Long", "Lộc Phát", "Minh Anh", "Nam Việt",
  "Ngọc Bích", "Phú Cường", "Phương Nam", "Quang Minh", "Sài Gòn", "Tân Tiến",
  "Thành Đạt", "Thiên Phú", "Tiến Phát", "Trung Sơn", "Vạn Xuân", "Việt Thắng",
  "Vinh Quang", "Xuân Mai", "An Khang", "Bình Minh", "Chợ Lớn",
];
const DUOI = ["", " Group", " Việt Nam", " Sài Gòn", " Holdings", " Solutions", " Trading"];

function rnd(max: number) {
  return Math.floor(Math.random() * max);
}
function pick<T>(arr: T[]): T {
  return arr[rnd(arr.length)];
}
function nguoi() {
  return `${pick(HO)} ${pick(DEM)} ${pick(TEN)}`;
}

async function main() {
  // ── PHANH AN TOÀN (25/09/2026) ─────────────────────────────────
  // Seed XOÁ SẠCH tài khoản, giao dịch, tin đăng, bài viết, Ban Chủ
  // nhiệm… nên TUYỆT ĐỐI không được chạy trên máy chủ thật. Đêm 24/09
  // docker-entrypoint.sh trên server lỡ gọi seed sau mỗi lần build →
  // xoá tài khoản thật (kimngan, ~65 tài khoản hội viên vừa cấp…) và đổ
  // 115 giao dịch mẫu đè lên web đang chạy. Từ nay: thấy CSDL có dấu
  // hiệu dữ liệu THẬT (nhiều tài khoản, có khách mời 10/10) hoặc
  // NODE_ENV=production thì DỪNG NGAY — chỉ chạy khi cố tình thêm cờ
  // --cho-phep-xoa.
  const choPhepXoa = process.argv.includes("--cho-phep-xoa");
  const soUser = await prisma.user.count();
  const soKhach1010 = await prisma.khachMoi1010.count().catch(() => 0);
  if (
    !choPhepXoa &&
    (process.env.NODE_ENV === "production" || soUser > 40 || soKhach1010 > 0)
  ) {
    console.error(
      `⛔ DỪNG SEED: CSDL này trông là dữ liệu THẬT (${soUser} tài khoản, ` +
        `${soKhach1010} khách mời 10/10, NODE_ENV=${process.env.NODE_ENV ?? ""}). ` +
        "Seed sẽ xoá sạch tài khoản/giao dịch/tin đăng/bài viết. " +
        "Nếu thật sự muốn chạy: npx tsx prisma/seed.ts --cho-phep-xoa"
    );
    process.exit(1);
  }

  // Chỉ xoá dữ liệu MẪU. Hội viên thật (nhập từ Google Sheet) được giữ nguyên —
  // chạy lại seed nhiều lần không làm mất danh sách hội viên.
  console.log("→ Xoá dữ liệu mẫu cũ...");
  await prisma.listingContact.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.award.deleteMany();
  await prisma.awardPeriod.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.post.deleteMany();

  // ── 1. Ngành nghề & nhóm sinh hoạt (dữ liệu thật, cập nhật tại chỗ) ──
  console.log("→ Ngành nghề...");
  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: { ...c, order: i },
      update: { ...c, order: i },
    });
  }
  const cats = await prisma.category.findMany();
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  console.log("→ Nhóm sinh hoạt...");
  for (const ch of CHAPTERS) {
    await prisma.chapter.upsert({
      where: { code: ch.code },
      create: ch,
      update: { name: ch.name },
    });
  }
  const chapters = await prisma.chapter.findMany();

  // ── 2. Ban Chủ nhiệm & các ban chuyên môn ─────────────────────
  console.log("→ Ban Chủ nhiệm...");
  await prisma.leader.deleteMany();
  await prisma.leader.createMany({
    data: LEADERS.map((l) => ({ ...l, term: NHIEM_KY })),
  });

  // ── 3. Doanh nghiệp hội viên ──────────────────────────────────
  // Đã có hội viên thật thì dùng luôn, không sinh dữ liệu giả đè lên.
  const daCoThat = await prisma.member.count();
  if (daCoThat > 0) {
    console.log(`→ Giữ nguyên ${daCoThat} hội viên đã có trong hệ thống.`);
    await taoDuLieuMau(cats, catBySlug);
    return;
  }

  console.log("→ Hội viên (dữ liệu mẫu)...");
  const daDung = new Set<string>();
  function slugDuyNhat(ten: string) {
    const goc = toSlug(ten) || "doanh-nghiep";
    let s = goc;
    let n = 1;
    while (daDung.has(s)) {
      n += 1;
      s = `${goc}-${n}`;
    }
    daDung.add(s);
    return s;
  }

  const rows: Prisma.MemberCreateManyInput[] = [];
  let stt = 0;

  // 3a. 20 doanh nghiệp có thật trong Profile Chi hội — cho hiển thị nổi bật
  for (const dn of DOANH_NGHIEP_PROFILE) {
    stt += 1;
    const cat = catBySlug.get(dn.category);
    const nganh = cat?.name ?? "Ngành nghề khác";
    const ten = nguoi();
    const quan = pick(QUAN);
    rows.push({
      code: `HV${String(stt).padStart(4, "0")}`,
      slug: slugDuyNhat(dn.company),
      name: ten,
      company: dn.company,
      position: pick(["Giám đốc", "Tổng Giám đốc", "Chủ tịch HĐQT", "Phó Tổng Giám đốc"]),
      memberType: "Hội viên",
      industry: nganh,
      categoryId: cat?.id ?? null,
      phone: dn.phone ?? null,
      website: dn.website ?? null,
      district: quan,
      address: `${quan}, TP.HCM`,
      chapterId: chapters[stt % chapters.length].id,
      intro: `Doanh nghiệp hội viên YBA Chợ Lớn, hoạt động trong lĩnh vực ${nganh.toLowerCase()}.`,
      offering: `Sản phẩm / dịch vụ ngành ${nganh.toLowerCase()}`,
      featured: stt <= 8,
      sortOrder: stt,
      joinedAt: new Date(2018 + rnd(7), rnd(12), 1 + rnd(28)),
      searchText: buildMemberSearchText({
        code: `HV${String(stt).padStart(4, "0")}`,
        name: ten,
        company: dn.company,
        industry: nganh,
        district: quan,
      }),
    });
  }

  // 3b. Hội viên mẫu cho đủ quy mô ~150 như Profile mô tả
  const TONG = 150;
  while (stt < TONG) {
    stt += 1;
    const cat = pick(cats);
    const congTy = `${pick(LOAI_HINH)} ${pick(THUONG_HIEU)}${pick(DUOI)} ${stt}`;
    const ten = nguoi();
    const quan = pick(QUAN);
    const code = `HV${String(stt).padStart(4, "0")}`;
    rows.push({
      code,
      slug: slugDuyNhat(congTy),
      name: ten,
      company: congTy,
      position: pick(["Giám đốc", "Tổng Giám đốc", "Chủ tịch HĐQT", "Nhà sáng lập"]),
      memberType: pick(["Hội viên", "Hội viên", "Hội viên", "Hội viên vàng"]),
      industry: cat.name,
      categoryId: cat.id,
      phone: `09${String(10000000 + rnd(89999999)).slice(0, 8)}`,
      email: `lienhe${stt}@doanhnghiep.vn`,
      district: quan,
      address: `${quan}, TP.HCM`,
      chapterId: chapters[stt % chapters.length].id,
      intro: `Doanh nghiệp hội viên hoạt động trong lĩnh vực ${cat.name.toLowerCase()} tại khu vực Chợ Lớn.`,
      offering: `Cung cấp sản phẩm / dịch vụ ngành ${cat.name.toLowerCase()}`,
      needing: `Tìm đối tác ngành ${pick(cats).name.toLowerCase()}`,
      joinedAt: new Date(2018 + rnd(7), rnd(12), 1 + rnd(28)),
      searchText: buildMemberSearchText({
        code,
        name: ten,
        company: congTy,
        industry: cat.name,
        district: quan,
      }),
    });
  }

  await prisma.member.createMany({ data: rows });
  await taoDuLieuMau(cats, catBySlug);
}

type Cat = { id: string; slug: string; name: string };

/**
 * Sinh phần dữ liệu MẪU dựa trên danh sách hội viên hiện có (thật hoặc mẫu):
 * tài khoản đăng nhập, giao dịch giao thương, tin mua/bán, doanh nghiệp tiêu biểu.
 */
async function taoDuLieuMau(cats: Cat[], catBySlug: Map<string, Cat>) {
  const members = await prisma.member.findMany({
    select: { id: true, code: true, company: true, slug: true, categoryId: true },
    orderBy: { code: "asc" },
  });
  if (!members.length) throw new Error("Chưa có hội viên nào để sinh dữ liệu mẫu.");

  // Nối nhân sự ban với hồ sơ doanh nghiệp của họ (nếu doanh nghiệp có trong
  // danh bạ) để bấm vào thẻ ở /ban-chap-hanh là mở được hồ sơ.
  for (const l of LEADERS) {
    if (!l.company) continue;
    const dn = members.find((m) => m.company === l.company);
    if (dn) {
      await prisma.leader.updateMany({
        where: { name: l.name },
        data: { memberSlug: dn.slug },
      });
    }
  }

  // Doanh nghiệp tiêu biểu trên trang chủ — 8 hội viên đầu danh sách.
  await prisma.member.updateMany({ data: { featured: false } });
  await prisma.member.updateMany({
    where: { id: { in: members.slice(0, 8).map((m) => m.id) } },
    data: { featured: true },
  });

  // ── 4. Tài khoản ──────────────────────────────────────────────
  console.log("→ Tài khoản...");
  await prisma.user.deleteMany();
  const mk = await bcrypt.hash("123456", 10);
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      name: "Ban Chủ nhiệm",
      role: "ADMIN",
      passwordHash: mk,
    },
  });
  await prisma.user.create({
    data: { username: "thuky", name: "Thư ký Chi hội", role: "STAFF", passwordHash: mk },
  });
  for (let i = 0; i < 30; i++) {
    await prisma.user.create({
      data: {
        username: `hv${String(i + 1).padStart(4, "0")}`,
        name: nguoi(),
        role: "MEMBER",
        memberId: members[i].id,
        passwordHash: mk,
      },
    });
  }

  // ── 5. Giao dịch giao thương ──────────────────────────────────
  console.log("→ Giao dịch...");
  const SCOPES = [
    "NOI_CHI_HOI", "NOI_CHI_HOI", "NOI_CHI_HOI", "NOI_CHI_HOI", "NOI_CHI_HOI",
    "LIEN_CHI_HOI", "LIEN_CHI_HOI", "LIEN_HOI", "NGOAI_HOI",
  ];
  const TRANG_THAI = [
    "DA_DUYET", "DA_DUYET", "DA_DUYET", "DA_DUYET", "DA_DUYET",
    "DA_DUYET", "DA_DUYET", "CHO_DUYET", "CHO_DOI_TAC", "TU_CHOI",
  ];
  const HOI_BAN = ["YBA Sài Gòn", "YBA Gia Định", "YBA Tân Sơn Nhất", "YBA Thủ Đức", "Hội DNT Đồng Tháp", "Hội DNT Gia Lai", "Hội DNT Khánh Hoà"];

  const deals: Prisma.DealCreateManyInput[] = [];
  for (let i = 0; i < 1200; i++) {
    const a = rnd(members.length);
    let b = rnd(members.length);
    if (b === a) b = (b + 1) % members.length;
    const status = pick(TRANG_THAI);
    const scope = pick(SCOPES);
    const nam = 2025 + rnd(2);
    const dealDate = new Date(nam, rnd(nam === 2026 ? 7 : 12), 1 + rnd(28));

    deals.push({
      code: `GT${nam}-${String(i + 1).padStart(4, "0")}`,
      sellerId: members[a].id,
      buyerId: members[b].id,
      referrerId: Math.random() < 0.3 ? members[rnd(members.length)].id : null,
      amount: (5 + rnd(500)) * 1_000_000,
      dealDate,
      description: "Hợp đồng cung cấp hàng hoá / dịch vụ",
      status,
      partnerScope: scope,
      externalOrg: scope === "NOI_CHI_HOI" ? null : pick(HOI_BAN),
      createdByUserId: admin.id,
      createdSide: Math.random() < 0.5 ? "SELLER" : "BUYER",
      confirmedAt: status === "CHO_DOI_TAC" ? null : dealDate,
      reviewedAt: status === "DA_DUYET" ? dealDate : null,
      reviewedByUserId: status === "DA_DUYET" ? admin.id : null,
    });
  }
  for (let i = 0; i < deals.length; i += 300) {
    await prisma.deal.createMany({ data: deals.slice(i, i + 300) });
  }

  // ── 6. Tin nhu cầu mua / bán mẫu ──────────────────────────────
  console.log("→ Tin mua / bán...");
  // Mỗi tin gắn đúng ngành nghề của nó, không lấy ngẫu nhiên — để bản demo đọc
  // vào thấy hợp lý chứ không lệch kiểu "phần mềm kế toán" nằm trong ngành y tế.
  const MAU_BAN: [string, string][] = [
    ["Nhận gia công may đồng phục doanh nghiệp số lượng lớn", "det-may-thoi-trang"],
    ["Cung cấp ống nhựa uPVC - HDPE cho công trình dân dụng", "cao-su-nhua"],
    ["Dịch vụ thẩm định giá tài sản, máy móc thiết bị", "ke-toan-kiem-toan-luat"],
    ["Nhận thi công nội thất văn phòng trọn gói", "xay-dung-thiet-ke-noi-that"],
    ["Cung cấp dừa tươi và sản phẩm từ dừa xuất khẩu", "nong-lam-thuy-hai-san"],
    ["Phần mềm kế toán, hoá đơn điện tử cho doanh nghiệp SME", "website-phan-mem-thuong-mai-dien-tu"],
    ["Dịch vụ vận chuyển container nội địa Bắc - Nam", "van-chuyen-giao-nhan-xnk"],
    ["Nhận in ấn bao bì giấy, hộp cứng cao cấp", "giay-in-an-bao-bi"],
  ];
  const MAU_MUA: [string, string][] = [
    ["Cần tìm nhà cung cấp vải suit nhập khẩu ổn định", "det-may-thoi-trang"],
    ["Tìm đơn vị thi công điện nước cho nhà xưởng 2.000 m²", "dien-dien-tu-dien-lanh"],
    ["Cần mua nông sản sấy khô số lượng lớn, giao hàng tháng", "nong-lam-thuy-hai-san"],
    ["Tìm đối tác cung cấp suất ăn công nghiệp khu vực Bình Tân", "luong-thuc-thuc-pham-do-uong"],
    ["Cần tìm đơn vị truyền thông chạy quảng cáo đa kênh", "truyen-thong-su-kien"],
    ["Tìm nhà cung cấp thiết bị y tế nha khoa chính hãng", "duoc-pham-y-te"],
  ];

  const slugTin = new Set<string>();
  function slugTinDuyNhat(t: string) {
    const goc = toSlug(t);
    let s = goc;
    let n = 1;
    while (slugTin.has(s)) {
      n += 1;
      s = `${goc}-${n}`;
    }
    slugTin.add(s);
    return s;
  }

  const listings: Prisma.ListingCreateManyInput[] = [];
  const tao = (
    title: string,
    catSlug: string,
    type: "CAN_MUA" | "CAN_BAN",
    i: number
  ) => {
    // Ưu tiên chọn hội viên đúng ngành để tin đăng khớp với hồ sơ doanh nghiệp
    const cat = catBySlug.get(catSlug);
    const cungNganh = members.filter((m) => m.categoryId === cat?.id);
    const m = cungNganh.length ? pick(cungNganh) : members[rnd(members.length)];
    const quan = pick(QUAN);
    listings.push({
      type,
      title,
      slug: slugTinDuyNhat(title),
      summary: title,
      description: `${title}.\n\nDoanh nghiệp hội viên YBA Chợ Lớn ${m.company} đăng tin tìm đối tác. Ưu tiên hợp tác với hội viên trong Chi hội và các chi hội bạn.\n\nLiên hệ qua trang hồ sơ doanh nghiệp để trao đổi chi tiết.`,
      categoryId: cat?.id ?? m.categoryId,
      priceText: type === "CAN_BAN" ? pick(["Thoả thuận", "Liên hệ báo giá", "Theo khối lượng"]) : "Thoả thuận",
      quantity: pick(["Số lượng lớn", "Theo đơn hàng", "Dài hạn", "1-2 đợt/tháng"]),
      location: `${quan}, TP.HCM`,
      memberId: m.id,
      status: i % 7 === 0 ? "CHO_DUYET" : "DANG_HIEN",
      expiresAt: ngayHetHan(),
      pinned: i === 0,
      views: rnd(200),
      searchText: normalizeSearch(`${title} ${m.company} ${quan}`),
    });
  };
  MAU_BAN.forEach(([t, c], i) => tao(t, c, "CAN_BAN", i));
  MAU_MUA.forEach(([t, c], i) => tao(t, c, "CAN_MUA", i + 100));

  await prisma.listing.createMany({ data: listings });

  // ── 7. Một kỳ vinh danh mẫu, dựng từ chính số liệu giao thương ─
  console.log("→ Kỳ vinh danh...");
  const namNay = new Date().getFullYear();
  const ky = await prisma.awardPeriod.create({
    data: {
      name: `Năm ${namNay}`,
      slug: `nam-${namNay}`,
      from: new Date(namNay, 0, 1),
      to: new Date(namNay, 11, 31, 23, 59, 59),
      note: "Tổng kết giao thương cả năm",
      published: true,
    },
  });

  const period = { key: ky.slug, label: ky.name, from: ky.from, to: ky.to };
  const [topBan, topMua, topKetNoi] = await Promise.all([
    topSellers(period, 3),
    topBuyers(period, 3),
    topReferrers(period, 3),
  ]);

  const soLieu = (r: { total: number; count: number; partners: number }) =>
    `${formatShortVnd(r.total)} ₫ · ${r.count} giao dịch · ${r.partners} đối tác`;

  await prisma.award.createMany({
    data: [
      ...topBan.map((r, i) => ({
        periodId: ky.id,
        memberId: r.memberId,
        category: HANG_MUC.BAN_RA,
        rank: i + 1,
        metric: soLieu(r),
      })),
      ...topMua.map((r, i) => ({
        periodId: ky.id,
        memberId: r.memberId,
        category: HANG_MUC.MUA_VAO,
        rank: i + 1,
        metric: soLieu(r),
      })),
      ...topKetNoi.map((r, i) => ({
        periodId: ky.id,
        memberId: r.memberId,
        category: HANG_MUC.KET_NOI,
        rank: i + 1,
        metric: `${formatShortVnd(r.total)} ₫ đã kết nối · ${r.count} giao dịch`,
      })),
    ],
  });

  console.log("");
  console.log("✓ Xong.");
  console.log(
    `  ${members.length} hội viên · ${LEADERS.length} nhân sự ban · ${deals.length} giao dịch · ${listings.length} tin mua-bán`
  );
  console.log("  Đăng nhập: admin / 123456 · thuky / 123456 · hv0001 / 123456");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
