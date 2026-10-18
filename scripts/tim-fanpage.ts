/**
 * Dò fanpage Facebook từ WEBSITE CHÍNH THỨC của từng hội viên: mở trang chủ
 * họ tự vận hành, nhặt các liên kết facebook.com doanh nghiệp tự đặt (thường ở
 * chân trang), lọc qua `chuanFanpage` rồi gán vào hồ sơ.
 *
 * Nguyên tắc "ai có thì để người đó":
 *   - CHỈ lấy link nằm trên website của chính doanh nghiệp — không đoán mò,
 *     không tìm kiếm ngoài.
 *   - Hồ sơ đã có fanpage thì GIỮ NGUYÊN, không đè.
 *   - Trang chỉ có nút "chia sẻ lên Facebook" (sharer, dialog…) thì coi như
 *     không có fanpage.
 *
 *   npm run tim-fanpage            → xem trước
 *   npm run tim-fanpage -- --ghi   → ghi thật
 */

// Nhiều website doanh nghiệp nhỏ dùng chứng chỉ HTTPS sai tên miền / hết hạn.
// Ở đây chỉ ĐỌC trang công khai để nhặt liên kết nên bỏ kiểm chứng chỉ được —
// đừng bê dòng này sang script nào có gửi dữ liệu đi.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { chuanFanpage } from "../src/components/web/FanpageHoiVien";
import { prisma } from "../src/lib/prisma";

const GHI = process.argv.includes("--ghi");

/** Link Facebook kỹ thuật, không phải fanpage: nút chia sẻ, pixel, SDK… */
const NHIEU =
  /\/(sharer|dialog|plugins|hashtag|login|l\.php|tr\b|policies|legal|help|badges|messages|flx|2008)/i;

/**
 * Website nhắc nhiều trang Facebook không phải của chính doanh nghiệp
 * (ghi công ty làm web, trang khách hàng, hãng cấp chứng chỉ…) — máy không
 * phân biệt được nên để Ban Chủ nhiệm xem tay, KHÔNG tự ghi.
 */
const XEM_TAY = new Map<string, string>([
  ["HV0030", "trang tìm được là của công ty làm web (Cánh Cam), không phải SACOM"],
  ["HV0053", "site nhắc goldenjsc lẫn dulichdocdao.net — chưa rõ trang chính"],
  ["HV0069", "site liệt kê trang của khách hàng (Highlands, Cheese Coffee…)"],
  ["HV0145", "trang tìm được (Saco Academy) không khớp ngành bao bì"],
  ["HV0152", "trang tìm được là của hãng chứng chỉ LanguageCert, không phải ED2CAREER"],
  ["HV0158", "site dùng theme mẫu, trang tìm được chưa chắc của Bảo Tâm"],
  ["HV0159", "site chỉ gắn trang FlexOffice các nước, không có trang chính công ty"],
]);

/** Nhặt mọi liên kết facebook trong HTML, trả về danh sách đã chuẩn hoá. */
function nhatLink(html: string): string[] {
  const raw = html.match(
    /https?:\/\/(?:www\.|m\.|web\.)?(?:facebook|fb)\.com\/[^"'\\\s<>()]+/gi
  );
  if (!raw) return [];
  const ra: string[] = [];
  for (const r of raw) {
    // Bỏ thực thể HTML dính đuôi (&quot; …) và dấu câu cuối
    const sach = r.replace(/&[a-z]+;.*$/i, "").replace(/[.,;:!?]+$/, "");
    if (NHIEU.test(sach)) continue;
    const chuan = chuanFanpage(sach);
    if (!chuan) continue;
    // facebook.com/facebook là trang của chính Facebook — mẫu footer hay gắn sẵn
    if (/facebook\.com\/facebook$/i.test(chuan)) continue;
    ra.push(chuan);
  }
  return ra;
}

/** Tải trang chủ với hạn giờ — website hội viên có trang chậm, trang chết. */
async function taiTrang(url: string): Promise<string | null> {
  const ctl = new AbortController();
  const hen = setTimeout(() => ctl.abort(), 12000);
  try {
    const r = await fetch(url, {
      signal: ctl.signal,
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
    });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") ?? "";
    if (ct && !ct.includes("html")) return null;
    return (await r.text()).slice(0, 800_000);
  } catch {
    return null;
  } finally {
    clearTimeout(hen);
  }
}

type KetQua = {
  code: string;
  company: string;
  website: string;
  fanpage?: string;
  khac?: string[];
  loi?: "KHONG_TAI_DUOC" | "KHONG_CO_LINK";
};

async function doMot(m: {
  id: string;
  code: string;
  company: string;
  website: string;
}): Promise<KetQua> {
  const goc = { code: m.code, company: m.company, website: m.website };

  // Có hội viên khai website chính là trang Facebook — lấy luôn, khỏi tải
  const truc = chuanFanpage(m.website);
  if (truc) return { ...goc, fanpage: truc };

  const url = /^https?:\/\//i.test(m.website) ? m.website : `https://${m.website}`;
  const html = (await taiTrang(url)) ?? (await taiTrang(url.replace(/^https:/, "http:")));
  if (!html) return { ...goc, loi: "KHONG_TAI_DUOC" };

  const links = nhatLink(html);
  if (!links.length) return { ...goc, loi: "KHONG_CO_LINK" };

  // Trang có thể nhắc nhiều fanpage — lấy cái xuất hiện nhiều nhất,
  // các cái khác in ra để soát tay
  const dem = new Map<string, number>();
  for (const l of links) {
    const k = l.toLowerCase();
    dem.set(k, (dem.get(k) ?? 0) + 1);
  }
  const sap = [...dem.entries()].sort((a, b) => b[1] - a[1]);
  const chinh = links.find((l) => l.toLowerCase() === sap[0][0])!;
  const khac = sap.slice(1).map(([k]) => links.find((l) => l.toLowerCase() === k)!);

  return { ...goc, fanpage: chinh, ...(khac.length ? { khac } : {}) };
}

(async () => {
  const members = await prisma.member.findMany({
    where: { website: { not: null }, facebook: null },
    select: { id: true, code: true, company: true, website: true },
    orderBy: { code: "asc" },
  });
  console.log(`Sẽ dò ${members.length} website (bỏ qua hồ sơ đã có fanpage)…\n`);

  const hang = members.map((m) => ({ ...m, website: m.website! }));
  const ketQua: KetQua[] = [];
  let xong = 0;

  // 8 trang một lượt cho nhanh mà không dội vào site nào quá tay
  const CUNG_LUC = 8;
  await Promise.all(
    Array.from({ length: CUNG_LUC }, async () => {
      while (hang.length) {
        const m = hang.shift()!;
        const kq = await doMot(m);
        ketQua.push(kq);
        xong++;
        if (xong % 25 === 0) console.log(`  … ${xong}/${members.length}`);
      }
    })
  );

  ketQua.sort((a, b) => a.code.localeCompare(b.code));
  const canXemTay = ketQua.filter((k) => k.fanpage && XEM_TAY.has(k.code));
  const thay = ketQua.filter((k) => k.fanpage && !XEM_TAY.has(k.code));
  const trangChet = ketQua.filter((k) => k.loi === "KHONG_TAI_DUOC");
  const khongCo = ketQua.filter((k) => k.loi === "KHONG_CO_LINK");

  console.log(`\n── Tìm thấy fanpage: ${thay.length} ──`);
  for (const k of thay) {
    console.log(`  ${k.code} ${k.company.slice(0, 40)}`);
    console.log(`        ${k.fanpage}`);
    if (k.khac?.length) console.log(`        (trang còn nhắc: ${k.khac.join(" · ")})`);
  }

  console.log(`\n── Cần Ban Chủ nhiệm xem tay, KHÔNG tự ghi: ${canXemTay.length} ──`);
  for (const k of canXemTay) {
    console.log(`  ${k.code} ${k.company.slice(0, 40)}`);
    console.log(`        lý do: ${XEM_TAY.get(k.code)}`);
    console.log(`        máy thấy: ${[k.fanpage, ...(k.khac ?? [])].join(" · ")}`);
  }

  console.log(`\n── Website không mở được: ${trangChet.length} ──`);
  for (const k of trangChet) console.log(`  ${k.code} ${k.company.slice(0, 36)} · ${k.website}`);

  console.log(`\n── Website không gắn Facebook: ${khongCo.length} ──`);
  for (const k of khongCo) console.log(`  ${k.code} ${k.company.slice(0, 44)}`);

  if (GHI) {
    for (const k of thay) {
      await prisma.member.updateMany({
        where: { code: k.code, facebook: null },
        data: { facebook: k.fanpage },
      });
    }
    console.log(`\n✓ Đã ghi ${thay.length} fanpage vào hồ sơ.`);
  } else {
    console.log(`\nXem ổn thì ghi thật: npm run tim-fanpage -- --ghi\n`);
  }

  await prisma.$disconnect();
})();
