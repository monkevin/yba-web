/**
 * Nhập danh sách hội viên từ Google Sheet (hoặc file CSV đã tải về).
 *
 *   npm run nhap-hoi-vien -- <link-google-sheet-hoặc-đường-dẫn-file> [--xoa-cu] [--chi-hoi "Tên chi hội"]
 *
 * Script đọc theo TÊN CỘT trong dòng tiêu đề, nên nhập được cả hai định dạng:
 *   - Sheet BCH:      STT | NX | Họ và lót | Tên | Chức vụ tại DN | Tên Doanh Nghiệp | Chức vụ Hội | | KHU VỰC
 *   - Sheet chi hội:  STT | NX | Họ và lót | Tên | Chức vụ | Tên Doanh Nghiệp | SĐT | ... | Loại Hội viên | Chi Hội | ... | Ngành nghề | Sản phẩm/dịch vụ | Thanh toán 20xx...
 *
 * Chạy lại nhiều lần an toàn: người đã có (trùng tên + doanh nghiệp) được
 * CẬP NHẬT, chỉ ghi đè trường nào có dữ liệu mới (không xoá dữ liệu cũ).
 * Dùng --xoa-cu để xoá sạch hội viên trước khi nhập.
 */
import { readFileSync } from "fs";
import { soDienThoaiDeLuu } from "../src/lib/so-dien-thoai";
import { PrismaClient } from "@prisma/client";
import { makeMemberCode } from "../src/lib/deal";
import { buildMemberSearchText } from "../src/lib/search";
import { uniqueSlug } from "../src/lib/slug";

const prisma = new PrismaClient();

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

function toCsvUrl(url: string): string {
  const m = url.match(/\/spreadsheets\/d\/([\w-]+)/);
  if (!m) return url;
  const gid = url.match(/[#&?]gid=(\d+)/)?.[1] ?? "0";
  return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv&gid=${gid}`;
}

async function loadCsv(source: string): Promise<string> {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(toCsvUrl(source));
    if (!res.ok)
      throw new Error(
        `Không tải được sheet (HTTP ${res.status}). Kiểm tra sheet đã chia sẻ "Bất kỳ ai có đường liên kết" chưa.`,
      );
    return res.text();
  }
  return readFileSync(source, "utf8");
}

function norm(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

/** Tìm dòng tiêu đề (dòng có "stt" và "tên doanh nghiệp") và map tên cột → chỉ số. */
function findHeader(rows: string[][]): {
  headerRow: number;
  col: (name: string) => number;
} {
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const cells = rows[i].map(norm);
    if (
      cells.includes("stt") &&
      cells.some((c) => c.includes("doanh nghiệp"))
    ) {
      const map = new Map<string, number>();
      cells.forEach((c, j) => {
        if (c && !map.has(c)) map.set(c, j);
      });
      const col = (needle: string) => {
        const key = norm(needle);
        for (const [name, idx] of map) if (name.includes(key)) return idx;
        return -1;
      };
      return { headerRow: i, col };
    }
  }
  throw new Error(
    'Không tìm thấy dòng tiêu đề (cần có ô "STT" và "Tên Doanh Nghiệp").',
  );
}

/** Chuẩn hoá số điện thoại: bỏ ký tự thừa, thêm 0 nếu bị Excel cắt mất. */
function cleanPhone(raw: string): string | null {
  // Dùng chung bộ chuẩn hoá của đăng nhập (84… → 0…, bỏ dấu chấm / khoảng trắng)
  // — số ghi sai dạng là hội viên đó không đăng nhập bằng SĐT được
  const first = raw.split(/[\s/,;]+/).filter(Boolean)[0] ?? "";
  return soDienThoaiDeLuu(first);
}

function cleanEmail(raw: string): string | null {
  const first = raw.split(/[\s,;]+/).filter(Boolean)[0] ?? "";
  return /@/.test(first) ? first.toLowerCase() : null;
}

function cleanWebsite(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/**
 * Ô ngành nghề trong sheet có dạng "16. Xây dựng – Tư vấn thiết kế..." và có thể
 * chứa NHIỀU dòng khi doanh nghiệp làm nhiều ngành. Giữ nguyên toàn bộ chữ để
 * còn tìm kiếm được, chỉ bỏ mã số ở đầu mỗi dòng cho dễ đọc.
 */
function cleanIndustry(raw: string): string | null {
  const v = raw
    .split(/\r?\n/)
    .map((d) => d.replace(/^\s*\d+\s*[.,]\s*/, "").trim())
    .filter(Boolean)
    .join(" · ");
  return v || null;
}

/** Mã ngành CHÍNH = hai chữ số ở đầu dòng đầu tiên, ví dụ "16". */
function primaryIndustryCode(raw: string): string | null {
  const m = raw.trim().match(/^\s*(\d{1,2})\s*[.,]/);
  return m ? m[1].padStart(2, "0") : null;
}

/** "07/05/1963" → Date, hoặc null. */
function parseDmy(raw: string): Date | null {
  const m = raw.trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "2005" → Date 1/1/2005 (năm gia nhập). */
function parseYear(raw: string): Date | null {
  const y = Number(raw.trim());
  return y >= 1980 && y <= 2100 ? new Date(y, 0, 1) : null;
}

/** Rút gọn tên chi hội dài: "Chi Hội Chợ Lớn (Quận 5-6...)" → "Chi hội Chợ Lớn". */
function shortChapter(raw: string): string {
  const v = raw.replace(/\s*\(.*\)\s*/, "").trim();
  return v || raw.trim();
}

type Parsed = {
  salutation: string | null;
  name: string;
  position: string | null;
  company: string;
  hoiRole: string | null;
  memberType: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  district: string | null;
  industry: string | null;
  /** Mã ngành chính theo danh mục 29 ngành của YBA, ví dụ "16" */
  industryCode: string | null;
  offering: string | null;
  birthday: Date | null;
  headcount: string | null;
  joinedAt: Date | null;
  feeExempt: boolean;
  chapterName: string;
  /** năm → ghi chú thanh toán */
  fees: { year: number; note: string }[];
};

async function main() {
  const argv = process.argv.slice(2);
  const source = argv.find((a) => !a.startsWith("--"));
  const reset = argv.includes("--xoa-cu");
  const chiHoiArg = (() => {
    const i = argv.indexOf("--chi-hoi");
    return i >= 0 ? argv[i + 1] : null;
  })();

  if (!source) {
    console.error(
      "Thiếu nguồn dữ liệu.\nVí dụ: npm run nhap-hoi-vien -- https://docs.google.com/spreadsheets/d/XXX/edit?gid=0",
    );
    process.exit(1);
  }

  const rows = parseCsv(await loadCsv(source));
  const { headerRow, col } = findHeader(rows);

  const c = {
    stt: col("stt"),
    nx: col("nx"),
    holot: col("họ và lót"),
    ten: col("tên") === col("tên doanh nghiệp") ? -1 : col("tên"),
    chucvu: col("chức vụ tại dn") >= 0 ? col("chức vụ tại dn") : col("chức vụ"),
    company: col("tên doanh nghiệp"),
    hoiRole: col("chức vụ hội"),
    memberType: col("loại hội viên"),
    phone: col("sđt"),
    email: col("email hội viên") >= 0 ? col("email hội viên") : col("email"),
    website: col("website"),
    address: col("địa chỉ"),
    district: col("quận"),
    birthday: col("ngày sinh"),
    joinYear: col("năm gia nhập"),
    headcount: col("sl nhân viên"),
    industry: col("ngành nghề"),
    offering: col("sản phẩm"),
    chiHoi: col("chi hội") >= 0 ? col("chi hội") : col("khu vực"),
  };
  // "Tên" đứng ngay sau "Họ và lót"
  const tenIdx = c.holot >= 0 ? c.holot + 1 : col("tên");

  // Các cột "Thanh toán 20xx"
  const feeCols: { year: number; idx: number }[] = [];
  rows[headerRow].forEach((h, j) => {
    const m = norm(h).match(/thanh toán\s*(\d{4})/);
    if (m) feeCols.push({ year: Number(m[1]), idx: j });
  });

  const g = (r: string[], i: number) => (i >= 0 ? (r[i] ?? "").trim() : "");

  const parsed: Parsed[] = [];
  for (const r of rows.slice(headerRow + 1)) {
    if (!/^\d+$/.test(g(r, c.stt))) continue;
    const name = [g(r, c.holot), g(r, tenIdx)].filter(Boolean).join(" ");
    const company = g(r, c.company);
    if (!name || !company) continue;

    const debt = g(r, col("công nợ"));
    const feeExempt = /miễn/i.test(debt) || /miễn/i.test(g(r, c.memberType));

    const fees = feeCols
      .map((fc) => ({ year: fc.year, note: g(r, fc.idx) }))
      .filter((f) => f.note);

    parsed.push({
      salutation: g(r, c.nx) || null,
      name,
      position: g(r, c.chucvu) || null,
      company,
      hoiRole: g(r, c.hoiRole) || null,
      memberType: g(r, c.memberType) || null,
      phone: cleanPhone(g(r, c.phone)),
      email: cleanEmail(g(r, c.email)),
      website: cleanWebsite(g(r, c.website)),
      address: g(r, c.address) || null,
      district: g(r, c.district) || null,
      industry: cleanIndustry(g(r, c.industry)),
      industryCode: primaryIndustryCode(g(r, c.industry)),
      offering: g(r, c.offering) || null,
      birthday: parseDmy(g(r, c.birthday)),
      headcount: g(r, c.headcount) || null,
      joinedAt: parseYear(g(r, c.joinYear)),
      feeExempt,
      chapterName:
        chiHoiArg || (g(r, c.chiHoi) ? shortChapter(g(r, c.chiHoi)) : "TP.HCM"),
      fees,
    });
  }

  console.log(
    `Đọc được ${parsed.length} hội viên (dòng tiêu đề ở hàng ${headerRow + 1}).`,
  );
  if (!parsed.length) {
    console.error("Không đọc được dòng nào — kiểm tra lại sheet.");
    process.exit(1);
  }

  if (reset) {
    console.log(
      "Xoá dữ liệu cũ (hội viên, giao dịch, tài khoản hội viên, hội phí)...",
    );
    await prisma.activityLog.deleteMany();
    await prisma.deal.deleteMany();
    await prisma.feePayment.deleteMany();
    await prisma.user.deleteMany({ where: { role: "MEMBER" } });
    await prisma.member.deleteMany();
  }

  // Tạo chi hội theo tên
  const chapterNames = [...new Set(parsed.map((p) => p.chapterName))];
  const existingChapters = await prisma.chapter.findMany();
  const chapterByName = new Map(existingChapters.map((c) => [c.name, c.id]));
  let chIdx = existingChapters.length;
  for (const name of chapterNames) {
    if (!chapterByName.has(name)) {
      const ch = await prisma.chapter.create({
        data: { code: `CH${String(++chIdx).padStart(2, "0")}`, name },
      });
      chapterByName.set(name, ch.id);
    }
  }

  const last = await prisma.member.findFirst({
    orderBy: { code: "desc" },
    select: { code: true },
  });
  let seq = last ? Number(last.code.replace(/\D/g, "")) : 0;

  const existing = await prisma.member.findMany({
    select: { id: true, name: true, company: true },
  });
  const byKey = new Map(
    existing.map((m) => [`${norm(m.name)}|${norm(m.company)}`, m.id]),
  );

  let created = 0;
  let updated = 0;
  let feeCount = 0;

  // Ngành nghề: khớp theo MÃ SỐ trong danh mục chuẩn (bảng Category)
  const cats = await prisma.category.findMany({
    select: { id: true, code: true },
  });
  const catByCode = new Map(
    cats.filter((c) => c.code).map((c) => [c.code!, c.id]),
  );
  if (!catByCode.size) {
    console.warn(
      "Cảnh báo: bảng Category đang rỗng — chạy `npm run db:seed` trước để có danh mục 29 ngành.",
    );
  }
  let khongKhopNganh = 0;

  for (const p of parsed) {
    // Chỉ đưa vào update những trường có giá trị (merge, không xoá dữ liệu cũ)
    const base: Record<string, unknown> = {
      chapterId: chapterByName.get(p.chapterName) ?? null,
      feeExempt: p.feeExempt,
    };
    const catId = p.industryCode ? catByCode.get(p.industryCode) : undefined;
    if (catId) base.categoryId = catId;
    else if (p.industry) khongKhopNganh++;
    const setIf = (k: string, v: unknown) => {
      if (v !== null && v !== undefined && v !== "") base[k] = v;
    };
    setIf("salutation", p.salutation);
    setIf("position", p.position);
    setIf("hoiRole", p.hoiRole);
    setIf("memberType", p.memberType);
    setIf("phone", p.phone);
    setIf("email", p.email);
    setIf("website", p.website);
    setIf("address", p.address);
    setIf("district", p.district);
    setIf("industry", p.industry);
    setIf("offering", p.offering);
    setIf("birthday", p.birthday);
    setIf("headcount", p.headcount);
    setIf("joinedAt", p.joinedAt);

    // Câu giới thiệu ngắn hiện trên thẻ danh bạ — lấy từ cột "sản phẩm/dịch vụ".
    // Hội viên tự sửa lại sau trong khu /tai-khoan/ho-so.
    if (p.offering) {
      const cau = p.offering.replace(/\s+/g, " ").trim();
      base.intro = cau.length > 160 ? `${cau.slice(0, 157)}…` : cau;
    }

    const key = `${norm(p.name)}|${norm(p.company)}`;
    let id = byKey.get(key);
    if (id) {
      await prisma.member.update({ where: { id }, data: base });
      updated++;
    } else {
      seq++;
      // slug phải duy nhất — dùng làm đường dẫn hồ sơ /doanh-nghiep/<slug>
      const slug = await uniqueSlug(
        p.company || p.name,
        async (s) =>
          !!(await prisma.member.findUnique({
            where: { slug: s },
            select: { id: true },
          })),
        "doanh-nghiep",
      );
      const m = await prisma.member.create({
        data: {
          ...base,
          name: p.name,
          company: p.company,
          code: makeMemberCode(seq),
          slug,
        },
      });
      id = m.id;
      byKey.set(key, id);
      created++;
    }

    // Tính lại searchText từ bản ghi cuối cùng (đúng cả khi merge nhiều phần)
    const saved = await prisma.member.findUnique({ where: { id } });
    if (saved) {
      await prisma.member.update({
        where: { id },
        data: { searchText: buildMemberSearchText(saved) },
      });
    }

    // Hội phí: upsert theo (member, năm)
    for (const f of p.fees) {
      await prisma.feePayment.upsert({
        where: { memberId_year: { memberId: id, year: f.year } },
        create: {
          memberId: id,
          year: f.year,
          note: f.note,
          paidAt: parseDmy(f.note.replace(/^CK\s*/i, "")),
        },
        update: { note: f.note },
      });
      feeCount++;
    }
  }

  console.log(`\nXong: thêm mới ${created}, cập nhật ${updated} hội viên.`);
  console.log(`Bản ghi hội phí đã nhập: ${feeCount}`);
  console.log(`Chi hội: ${chapterNames.join(" | ")}`);
  if (khongKhopNganh)
    console.log(
      `Lưu ý: ${khongKhopNganh} hội viên có ghi ngành nghề nhưng không đọc được mã số ở đầu ô — hồ sơ vẫn nhập, chỉ là chưa gắn vào danh mục ngành.`,
    );
  if (feeCols.length)
    console.log(
      `Cột hội phí đọc được: ${feeCols.map((f) => f.year).join(", ")}`,
    );
  const total = await prisma.member.count();
  console.log(`Tổng số hội viên trong hệ thống: ${total}`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
