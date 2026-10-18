/**
 * Tải logo doanh nghiệp từ chính website hội viên đã khai.
 *
 *   npm run tai-logo            → xem trước, chỉ báo tìm được bao nhiêu
 *   npm run tai-logo -- --ghi   → tải thật, lưu vào public/logo/ và gán vào hồ sơ
 *   npm run tai-logo -- --ghi --lam-lai   → tải lại cả những hồ sơ đã có logo
 *
 * Thứ tự ưu tiên khi tìm ảnh (cái đầu thường cho logo vuông, nét nhất):
 *   1. apple-touch-icon        — ảnh 180×180 dành cho màn hình iPhone
 *   2. <link rel="icon"> cỡ to — favicon độ phân giải cao
 *   3. og:image                — ảnh chia sẻ mạng xã hội (đôi khi là ảnh bìa)
 *   4. Dịch vụ favicon Google  — luôn có, nhưng nhỏ
 *
 * ⚠️ Logo tải máy móc nên KHÔNG chắc lúc nào cũng đúng. Ban Chủ nhiệm rà lại ở
 * /quan-tri/ho-so, hội viên tự đổi được ở /tai-khoan/ho-so.
 */
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { tenDoanhNghiep } from "../src/lib/ten-doanh-nghiep";

const prisma = new PrismaClient();

const THU_MUC = path.join(process.cwd(), "public", "logo");
const CHO_TOI_DA = 15_000; // ms cho mỗi lần gọi mạng
const CUNG_LUC = 6; // số website tải song song
const NHO_NHAT = 700; // bytes — nhỏ hơn coi như ảnh rác
const LON_NHAT = 3_000_000;

/**
 * Đọc kích thước ảnh từ phần đầu tệp. Cần để loại ảnh bìa ngang — nhiều site
 * khai og:image là banner 1200×630, nhét vào ô logo vuông thì hỏng bố cục.
 */
function kichThuoc(buf: Buffer, duoi: string): { r: number; c: number } | null {
  try {
    if (duoi === "png" && buf.length > 24) {
      return { r: buf.readUInt32BE(16), c: buf.readUInt32BE(20) };
    }
    if (duoi === "gif" && buf.length > 10) {
      return { r: buf.readUInt16LE(6), c: buf.readUInt16LE(8) };
    }
    if (duoi === "jpg") {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) {
          i++;
          continue;
        }
        const ma = buf[i + 1];
        // Các khối SOF chứa kích thước ảnh
        if (ma >= 0xc0 && ma <= 0xcf && ma !== 0xc4 && ma !== 0xc8 && ma !== 0xcc) {
          return { c: buf.readUInt16BE(i + 5), r: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {
    /* đọc không được thì coi như không biết kích thước */
  }
  return null;
}

/** Ảnh có dùng làm logo được không: phải gần vuông và đủ lớn. */
function hopLamLogo(buf: Buffer, duoi: string): boolean {
  // ICO và SVG gần như luôn là logo, khỏi kiểm
  if (duoi === "ico" || duoi === "svg") return true;
  const kt = kichThuoc(buf, duoi);
  if (!kt || !kt.r || !kt.c) return true; // không đọc được thì cho qua
  if (kt.r < 32 || kt.c < 32) return false;
  const tyLe = Math.max(kt.r, kt.c) / Math.min(kt.r, kt.c);
  return tyLe <= 2.2;
}

/** Nhận dạng ảnh qua vài byte đầu, tránh lưu nhầm trang HTML báo lỗi. */
function doiAnh(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50) return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8) return "jpg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return "webp";
  if (buf[0] === 0x00 && buf[1] === 0x00 && buf[2] === 0x01) return "ico";
  if (buf.toString("utf8", 0, 300).includes("<svg")) return "svg";
  if (buf.toString("ascii", 0, 3) === "GIF") return "gif";
  return null;
}

async function lay(url: string, nhiPhan = false) {
  const dung = AbortSignal.timeout(CHO_TOI_DA);
  const res = await fetch(url, {
    signal: dung,
    redirect: "follow",
    headers: {
      // Một số site chặn nếu không có User-Agent trông giống trình duyệt
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      Accept: nhiPhan ? "image/*,*/*" : "text/html,*/*",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return nhiPhan ? Buffer.from(await res.arrayBuffer()) : await res.text();
}

/** Danh sách địa chỉ ảnh ứng viên, xếp theo thứ tự ưu tiên. */
function timUngVien(html: string, goc: string): string[] {
  const ds: { url: string; diem: number }[] = [];
  const tuyetDoi = (u: string) => {
    try {
      return new URL(u, goc).href;
    } catch {
      return null;
    }
  };

  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const the = m[0];
    const rel = /rel=["']([^"']+)["']/i.exec(the)?.[1]?.toLowerCase() ?? "";
    const href = /href=["']([^"']+)["']/i.exec(the)?.[1];
    if (!href || !/icon/.test(rel)) continue;
    const u = tuyetDoi(href);
    if (!u) continue;

    const co = Number(/sizes=["'](\d+)/i.exec(the)?.[1] ?? 0);
    let diem = 0;
    if (rel.includes("apple-touch-icon")) diem = 100 + co;
    else if (co >= 96) diem = 80 + co;
    else if (co > 0) diem = 40 + co;
    else diem = /\.svg$/i.test(u) ? 70 : 30;
    ds.push({ url: u, diem });
  }

  // og:image xếp sau cùng: phần lớn là ảnh bìa ngang, chỉ dùng khi không còn gì
  const og = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
  if (og) {
    const u = tuyetDoi(og);
    if (u) ds.push({ url: u, diem: 10 });
  }

  ds.sort((a, b) => b.diem - a.diem);
  return [...new Set(ds.map((x) => x.url))].slice(0, 4);
}

type KetQua = {
  code: string;
  ten: string;
  nguon: string | null;
  duongDan: string | null;
  loi: string | null;
};

async function xuLy(m: {
  id: string;
  code: string;
  slug: string;
  company: string;
  website: string;
}): Promise<KetQua> {
  const ten = tenDoanhNghiep(m.company);
  const base: KetQua = { code: m.code, ten, nguon: null, duongDan: null, loi: null };

  let ungVien: string[] = [];
  let mien = "";
  try {
    mien = new URL(m.website).hostname;
  } catch {
    return { ...base, loi: "website không hợp lệ" };
  }

  try {
    const html = (await lay(m.website)) as string;
    ungVien = timUngVien(html, m.website);
  } catch (e) {
    base.loi = `không mở được website (${e instanceof Error ? e.message : e})`;
  }

  // Luôn có phương án dự phòng: dịch vụ favicon của Google
  ungVien.push(`https://www.google.com/s2/favicons?domain=${mien}&sz=128`);

  for (const u of ungVien) {
    try {
      const buf = (await lay(u, true)) as Buffer;
      if (buf.length < NHO_NHAT || buf.length > LON_NHAT) continue;
      const duoi = doiAnh(buf);
      if (!duoi) continue;
      if (!hopLamLogo(buf, duoi)) continue; // ảnh bìa ngang — bỏ qua

      await mkdir(THU_MUC, { recursive: true });
      const ten2 = `${m.slug}.${duoi}`;
      await writeFile(path.join(THU_MUC, ten2), buf);
      return {
        ...base,
        loi: null,
        nguon: u.includes("google.com/s2") ? "favicon Google" : "website",
        duongDan: `/logo/${ten2}`,
      };
    } catch {
      // thử ứng viên tiếp theo
    }
  }

  return { ...base, loi: base.loi ?? "không tìm được ảnh hợp lệ" };
}

/** Chạy song song có giới hạn để không đập cùng lúc quá nhiều website. */
async function chayTheoLo<T, R>(
  ds: T[],
  soLuong: number,
  ham: (x: T) => Promise<R>,
  tienDo?: (xong: number, tong: number) => void
): Promise<R[]> {
  const kq: R[] = new Array(ds.length);
  let i = 0;
  let xong = 0;
  async function congNhan() {
    while (i < ds.length) {
      const j = i++;
      kq[j] = await ham(ds[j]);
      xong++;
      tienDo?.(xong, ds.length);
    }
  }
  await Promise.all(Array.from({ length: Math.min(soLuong, ds.length) }, congNhan));
  return kq;
}

async function main() {
  const ghi = process.argv.includes("--ghi");
  const lamLai = process.argv.includes("--lam-lai");

  const members = await prisma.member.findMany({
    where: {
      website: { not: null },
      ...(lamLai ? {} : { logo: null }),
    },
    select: { id: true, code: true, slug: true, company: true, website: true },
    orderBy: { code: "asc" },
  });

  console.log(
    `Có ${members.length} doanh nghiệp có website${lamLai ? "" : " và chưa có logo"}.`
  );
  if (!members.length) return;
  if (!ghi) {
    console.log("\nĐây là XEM TRƯỚC — sẽ thử 5 doanh nghiệp đầu để anh xem chất lượng.\n");
  }

  const canLam = ghi ? members : members.slice(0, 5);

  const kq = await chayTheoLo(
    canLam.map((m) => ({ ...m, website: m.website! })),
    CUNG_LUC,
    xuLy,
    (xong, tong) => {
      if (xong % 20 === 0 || xong === tong) {
        process.stdout.write(`\r  đã xử lý ${xong}/${tong}...`);
      }
    }
  );
  console.log("");

  const duoc = kq.filter((k) => k.duongDan);
  const tuWeb = duoc.filter((k) => k.nguon === "website").length;
  const tuGoogle = duoc.filter((k) => k.nguon === "favicon Google").length;

  console.log(`\nLấy được logo: ${duoc.length}/${canLam.length}`);
  console.log(`  từ website doanh nghiệp .... ${tuWeb}`);
  console.log(`  từ favicon Google .......... ${tuGoogle}`);
  console.log(`Không lấy được: ${kq.length - duoc.length}`);

  if (!ghi) {
    console.log("\nMẫu:");
    for (const k of kq) {
      console.log(
        `  ${k.code}  ${k.ten.slice(0, 42).padEnd(44)} ${k.duongDan ?? "— " + k.loi}`
      );
    }
    console.log("\nTải thật: npm run tai-logo -- --ghi\n");
    return;
  }

  let daGan = 0;
  for (let i = 0; i < canLam.length; i++) {
    const d = kq[i].duongDan;
    if (!d) continue;
    await prisma.member.update({ where: { id: canLam[i].id }, data: { logo: d } });
    daGan++;
  }

  console.log(`\n✓ Đã gán ${daGan} logo vào hồ sơ doanh nghiệp.`);
  console.log("  Rà lại và sửa cái sai ở /quan-tri/ho-so.");

  const chuaCo = kq.filter((k) => !k.duongDan).slice(0, 15);
  if (chuaCo.length) {
    console.log("\nMột số chưa lấy được (cần thêm tay):");
    for (const k of chuaCo) console.log(`  ${k.code}  ${k.ten.slice(0, 46)} — ${k.loi}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
