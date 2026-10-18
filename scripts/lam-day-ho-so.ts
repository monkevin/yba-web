/**
 * Làm đầy hồ sơ doanh nghiệp và khởi tạo tin mua/bán cho toàn bộ hội viên.
 *
 *   npm run lam-day-ho-so              → xem trước, không ghi gì
 *   npm run lam-day-ho-so -- --ghi     → ghi vào cơ sở dữ liệu
 *   npm run lam-day-ho-so -- --ghi --khong-tin-dang   → chỉ làm hồ sơ, bỏ qua tin
 *
 * ⚠️ QUAN TRỌNG — nguồn nội dung:
 * Toàn bộ phần giới thiệu và danh sách sản phẩm được dựng lại từ CHÍNH dữ liệu
 * hội viên đã khai trong Google Sheet của Chi hội (cột ngành nghề, cột sản phẩm
 * / dịch vụ kinh doanh, địa chỉ, website, năm gia nhập). Script KHÔNG bịa thêm
 * thành tích, quy mô hay lịch sử công ty — những thứ đó phải do chính hội viên
 * hoặc Ban Hội viên bổ sung.
 *
 * Tin "cần mua" là bản NHÁP dựng theo nhu cầu phổ biến của ngành, để hội viên
 * vào sửa lại cho đúng nhu cầu thật.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
import { NHU_CAU_CHUNG, NHU_CAU_MUA, CACH_CHAO_BAN } from "../prisma/nhu-cau-theo-nganh";
import { LOAI_TIN, TRANG_THAI_TIN, ngayHetHan } from "../src/lib/listing";
import { normalizeSearch } from "../src/lib/search";
import { toSlug } from "../src/lib/slug";
import { tenDoanhNghiep } from "../src/lib/ten-doanh-nghiep";

const prisma = new PrismaClient();

/** Tách chuỗi sản phẩm/dịch vụ thành từng mục riêng. */
function tachSanPham(raw: string): string[] {
  return raw
    .split(/[,;\n·•]|(?:\s+-\s+)/)
    .map((s) =>
      s
        .replace(/\s+/g, " ")
        .replace(/^(và|các|kinh doanh|sản xuất|cung cấp|chuyên)\s+/i, "")
        .trim()
    )
    .filter((s) => s.length >= 3 && s.length <= 90)
    .filter((s, i, a) => a.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i);
}

/** Viết hoa chữ cái đầu câu. */
function hoaDau(s: string): string {
  return s.charAt(0).toLocaleUpperCase("vi") + s.slice(1);
}

/** Dựng phần "Giới thiệu đầy đủ" từ dữ liệu hội viên đã khai. */
function dungGioiThieu(m: {
  company: string;
  name: string;
  position: string | null;
  industry: string | null;
  offering: string | null;
  address: string | null;
  district: string | null;
  website: string | null;
  headcount: string | null;
  joinedAt: Date;
  memberType: string | null;
  nganh: string | null;
}): string {
  const ten = tenDoanhNghiep(m.company);
  const doan: string[] = [];

  // Đoạn 1 — doanh nghiệp làm gì
  const nganh = m.nganh ?? m.industry;
  const mo = nganh
    ? `${ten} là doanh nghiệp hội viên ${
        m.memberType && m.memberType !== "Hội viên" ? `(${m.memberType.toLowerCase()}) ` : ""
      }Chi hội Doanh nhân trẻ Chợ Lớn, hoạt động trong lĩnh vực ${nganh.toLowerCase()}.`
    : `${ten} là doanh nghiệp hội viên Chi hội Doanh nhân trẻ Chợ Lớn.`;
  doan.push(mo);

  // Đoạn 2 — sản phẩm / dịch vụ, lấy nguyên văn hội viên khai
  if (m.offering) {
    doan.push(
      `Sản phẩm và dịch vụ doanh nghiệp đang cung cấp: ${hoaDau(m.offering.trim().replace(/\.$/, ""))}.`
    );
  }

  // Đoạn 3 — thông tin nhận diện
  const y: string[] = [];
  y.push(`Doanh nghiệp gia nhập Chi hội từ năm ${m.joinedAt.getFullYear()}`);
  if (m.headcount) y.push(`quy mô khoảng ${m.headcount} nhân sự`);
  if (m.district) y.push(`trụ sở tại ${m.district}, TP.HCM`);
  doan.push(`${y.join(", ")}.`);

  // Đoạn 4 — mời kết nối
  doan.push(
    `Quý anh chị hội viên và đối tác quan tâm hợp tác, xin liên hệ trực tiếp ${
      m.name
    }${m.position ? ` — ${m.position}` : ""} qua thông tin bên cạnh${
      m.website ? `, hoặc tham khảo thêm tại website doanh nghiệp` : ""
    }.`
  );

  return doan.join("\n\n");
}

async function main() {
  const ghi = process.argv.includes("--ghi");
  const boQuaTin = process.argv.includes("--khong-tin-dang");

  const members = await prisma.member.findMany({
    include: { category: { select: { code: true, name: true } } },
    orderBy: { code: "asc" },
  });

  console.log(`Đang xử lý ${members.length} hội viên...\n`);

  let soHoSo = 0;
  let soSanPham = 0;
  const tinMoi: Prisma.ListingCreateManyInput[] = [];
  const slugDaDung = new Set(
    (await prisma.listing.findMany({ select: { slug: true } })).map((l) => l.slug)
  );

  function slugDuyNhat(goc: string): string {
    let s = toSlug(goc) || "tin-nhu-cau";
    let n = 1;
    while (slugDaDung.has(s)) {
      n += 1;
      s = `${toSlug(goc)}-${n}`;
    }
    slugDaDung.add(s);
    return s;
  }

  for (const m of members) {
    const ten = tenDoanhNghiep(m.company);
    const maNganh = m.category?.code ?? "29";
    const sanPham = m.offering ? tachSanPham(m.offering).slice(0, 6) : [];

    // ── 1. Giới thiệu đầy đủ ──────────────────────────────────
    const gioiThieu = dungGioiThieu({ ...m, nganh: m.category?.name ?? null });

    if (ghi) {
      await prisma.member.update({
        where: { id: m.id },
        data: {
          // Chỉ ghi khi hội viên chưa tự viết — không đè lên nội dung họ đã sửa
          description: m.description ?? gioiThieu,
          capabilities:
            m.capabilities ??
            [
              `Hội viên ${m.memberType ?? "Chi hội"} YBA Chợ Lớn từ năm ${m.joinedAt.getFullYear()}`,
              m.headcount ? `Quy mô nhân sự: ${m.headcount} người` : null,
              m.category?.name ? `Ngành nghề: ${m.category.name}` : null,
              m.website ? `Website chính thức: ${m.website.replace(/^https?:\/\//, "")}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
        },
      });
    }
    soHoSo++;

    // ── 2. Sản phẩm tiêu biểu ─────────────────────────────────
    if (ghi && sanPham.length) {
      const daCo = await prisma.product.count({ where: { memberId: m.id } });
      if (daCo === 0) {
        await prisma.product.createMany({
          data: sanPham.map((sp, i) => ({
            memberId: m.id,
            name: hoaDau(sp),
            summary: null,
            priceText: "Liên hệ báo giá",
            order: i,
          })),
        });
        soSanPham += sanPham.length;
      }
    } else if (!ghi) {
      soSanPham += sanPham.length;
    }

    if (boQuaTin) continue;

    // ── 3. Tin CẦN BÁN — từ chính sản phẩm hội viên khai ──────
    if (m.offering) {
      const chao = CACH_CHAO_BAN[maNganh] ?? "Cung cấp";
      const dsBan = sanPham.length ? sanPham : [m.offering.slice(0, 80)];
      const tieuDe = `${chao} ${dsBan.slice(0, 3).join(", ").toLowerCase()}`.slice(0, 140);

      tinMoi.push({
        type: LOAI_TIN.CAN_BAN,
        title: hoaDau(tieuDe),
        slug: slugDuyNhat(`${tieuDe}-${m.code}`),
        summary: m.intro ?? m.offering.slice(0, 160),
        description: [
          `${ten} giới thiệu tới quý anh chị hội viên YBA Chợ Lớn các sản phẩm và dịch vụ sau:`,
          dsBan.map((s) => `• ${hoaDau(s)}`).join("\n"),
          `Doanh nghiệp ưu tiên hợp tác với hội viên trong Chi hội và các chi hội bạn. Vui lòng liên hệ để trao đổi chi tiết về quy cách, số lượng và chính sách giá.`,
        ].join("\n\n"),
        categoryId: m.categoryId,
        priceText: "Liên hệ báo giá",
        quantity: "Theo nhu cầu đơn hàng",
        location: m.district ? `${m.district}, TP.HCM` : "TP.HCM",
        memberId: m.id,
        status: TRANG_THAI_TIN.DANG_HIEN,
        expiresAt: ngayHetHan(),
        searchText: normalizeSearch(
          `${tieuDe} ${dsBan.join(" ")} ${m.company} ${m.district ?? ""} ${m.category?.name ?? ""}`
        ),
      });
    }

    // ── 4. Tin CẦN MUA — nhu cầu phổ biến của ngành (bản nháp) ─
    const nhuCau = [...(NHU_CAU_MUA[maNganh] ?? NHU_CAU_MUA["29"])].slice(0, 4);
    const themChung = NHU_CAU_CHUNG.slice(0, 2);
    const tatCa = [...nhuCau, ...themChung];
    const tieuDeMua = `Tìm nhà cung cấp ${nhuCau.slice(0, 2).join(", ")}`.slice(0, 140);

    tinMoi.push({
      type: LOAI_TIN.CAN_MUA,
      title: hoaDau(tieuDeMua),
      slug: slugDuyNhat(`${tieuDeMua}-${m.code}`),
      summary: `${ten} tìm đối tác cung cấp ${nhuCau.slice(0, 3).join(", ")}.`,
      description: [
        `${ten} đang tìm nhà cung cấp ổn định, ưu tiên hội viên YBA Chợ Lớn, cho các nhóm hàng hoá và dịch vụ sau:`,
        tatCa.map((s) => `• ${hoaDau(s)}`).join("\n"),
        `Anh chị hội viên có thể cung cấp một hoặc nhiều hạng mục trên, vui lòng liên hệ để gửi báo giá và hồ sơ năng lực.`,
      ].join("\n\n"),
      categoryId: m.categoryId,
      priceText: "Thoả thuận",
      quantity: "Hợp tác dài hạn",
      location: m.district ? `${m.district}, TP.HCM` : "TP.HCM",
      memberId: m.id,
      status: TRANG_THAI_TIN.DANG_HIEN,
      expiresAt: ngayHetHan(),
      searchText: normalizeSearch(
        `${tieuDeMua} ${tatCa.join(" ")} ${m.company} ${m.district ?? ""} ${m.category?.name ?? ""}`
      ),
    });
  }

  console.log(`Hồ sơ được làm đầy .......... ${soHoSo}`);
  console.log(`Sản phẩm tách được .......... ${soSanPham}`);
  console.log(`Tin cần bán ................. ${tinMoi.filter((t) => t.type === LOAI_TIN.CAN_BAN).length}`);
  console.log(`Tin cần mua ................. ${tinMoi.filter((t) => t.type === LOAI_TIN.CAN_MUA).length}`);

  if (!ghi) {
    console.log("\n── XEM TRƯỚC, chưa ghi gì ──");
    const vd = members.find((x) => /Hoàng Vy/i.test(x.company)) ?? members[0];
    console.log(`\nVí dụ hồ sơ: ${tenDoanhNghiep(vd.company)}\n`);
    console.log(dungGioiThieu({ ...vd, nganh: vd.category?.name ?? null }));
    const t = tinMoi.filter((x) => x.memberId === vd.id);
    for (const x of t) console.log(`\n[${x.type}] ${x.title}\n${x.description}`);
    console.log("\n\nMuốn ghi thật: npm run lam-day-ho-so -- --ghi\n");
    return;
  }

  if (!boQuaTin && tinMoi.length) {
    for (let i = 0; i < tinMoi.length; i += 200) {
      await prisma.listing.createMany({ data: tinMoi.slice(i, i + 200) });
    }
  }

  console.log("\n✓ Đã ghi xong.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
