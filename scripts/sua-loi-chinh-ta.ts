/**
 * Sửa các lỗi chính tả CHẮC CHẮN trong dữ liệu hội viên nhập từ Google Sheet
 * (thiếu dấu, gõ nhầm phím, dính chữ). Mỗi mục sửa phải ghi rõ mã hội viên để
 * không đụng nhầm doanh nghiệp khác — tuyệt đối KHÔNG thay thế toàn cục, vì
 * "giay" ở hồ sơ này là "giấy" nhưng ở hồ sơ khác lại là "giày".
 *
 *   npm run sua-chinh-ta            → xem trước
 *   npm run sua-chinh-ta -- --ghi   → ghi thật
 *
 * Chạy lại nhiều lần an toàn: chỗ nào đã sửa rồi thì bỏ qua.
 */
import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";

const GHI = process.argv.includes("--ghi");

type Sua = { code: string; truong: "offering" | "services" | "needing"; sai: string; dung: string };

const DANH_SACH: Sua[] = [
  // "giay" đứng riêng: trong hồ sơ đã sửa rồi, nhưng tin đăng dựng sẵn còn giữ
  // dạng gạch đầu dòng "• Giay" nên vẫn cần mục này
  { code: "HV0033", truong: "offering", sai: "giay", dung: "giấy" },
  { code: "HV0053", truong: "offering", sai: "leambuilding", dung: "teambuilding" },
  { code: "HV0092", truong: "offering", sai: "trang sứctheo", dung: "trang sức theo" },
  { code: "HV0107", truong: "offering", sai: "logictics", dung: "logistics" },
  { code: "HV0125", truong: "offering", sai: "Vạn hành", dung: "Vận hành" },
  { code: "HV0133", truong: "offering", sai: "sửa chửa", dung: "sửa chữa" },
  { code: "HV0133", truong: "offering", sai: "sản phẩm ô to", dung: "sản phẩm ô tô" },
  { code: "HV0238", truong: "offering", sai: "xương phớp", dung: "xương khớp" },
];

(async () => {
  let soSua = 0;
  let soBoQua = 0;

  for (const s of DANH_SACH) {
    const m = await prisma.member.findFirst({
      where: { code: s.code },
      select: { id: true, code: true, company: true, offering: true, services: true, needing: true },
    });
    if (!m) {
      console.log(`  ✗ Không có hội viên ${s.code}`);
      continue;
    }

    const cu = m[s.truong] ?? "";
    if (!cu.includes(s.sai)) {
      soBoQua++;
      continue;
    }

    const moi = cu.split(s.sai).join(s.dung);
    console.log(`  ${m.code} ${m.company.slice(0, 34)}`);
    console.log(`      "${s.sai}"  →  "${s.dung}"`);
    if (GHI) {
      await prisma.member.update({ where: { id: m.id }, data: { [s.truong]: moi } });
    }
    soSua++;
  }

  console.log(
    `\n${soSua} chỗ ${GHI ? "đã sửa" : "sẽ sửa"} · ${soBoQua} chỗ đã đúng sẵn (bỏ qua).`
  );

  // Tin đăng trên chợ nhu cầu dựng sẵn từ `offering` nên giữ nguyên chữ sai cũ.
  // Sửa luôn ở đây, không phân biệt hoa thường vì tiêu đề tin đã hạ chữ.
  console.log("\n── Tin đăng trên chợ nhu cầu ──");
  let soTin = 0;
  for (const s of DANH_SACH) {
    const tin = await prisma.listing.findMany({
      where: { member: { code: s.code } },
      select: {
        id: true,
        title: true,
        summary: true,
        description: true,
        searchText: true,
        location: true,
      },
    });
    for (const t of tin) {
      function thay<T extends string | null>(v: T): T {
        if (!v) return v;
        return v.replace(new RegExp(s.sai.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (khop) =>
          // Giữ đúng kiểu hoa/thường của chỗ đang có
          khop[0] === khop[0].toUpperCase()
            ? s.dung.charAt(0).toLocaleUpperCase("vi") + s.dung.slice(1)
            : s.dung.charAt(0).toLocaleLowerCase("vi") + s.dung.slice(1)
        ) as T;
      }
      const moi = {
        title: thay(t.title),
        summary: thay(t.summary),
        description: thay(t.description),
        // searchText phải luôn là chữ KHÔNG DẤU đã chuẩn hoá — thay chữ thẳng
        // vào đây là hỏng tìm kiếm không dấu, nên dựng lại từ đầu
        searchText: normalizeSearch(
          [thay(t.title), thay(t.summary), thay(t.description), t.location]
            .filter(Boolean)
            .join(" ")
        ),
      };
      if (
        moi.title === t.title &&
        moi.summary === t.summary &&
        moi.description === t.description
      ) {
        continue;
      }
      console.log(`  ${s.code} · ${moi.title.slice(0, 70)}`);
      if (GHI) await prisma.listing.update({ where: { id: t.id }, data: moi });
      soTin++;
    }
  }
  console.log(`${soTin} tin đăng ${GHI ? "đã sửa" : "sẽ sửa"}.`);
  if (!GHI) console.log("Ghi thật: npm run sua-chinh-ta -- --ghi\n");
  else console.log("✓ Xong. Chạy lại npm run viet-lai-gioi-thieu -- --ghi để bài giới thiệu cập nhật theo.");

  await prisma.$disconnect();
})();
