/**
 * Nhập 9 bài viết từ website cũ ybacholon.vn sang web mới.
 *
 *   npm run cao-web-cu              (chạy trước để có soat/web-cu/posts.json)
 *   npm run nhap-bai-cu             → xem trước
 *   npm run nhap-bai-cu -- --ghi    → ghi thật + tải ảnh về
 *
 * Nguyên tắc:
 *  - GIỮ NGUYÊN VĂN. Chỉ dọn thẻ HTML thừa của Elementor, không viết lại câu chữ.
 *  - Ghi rõ NGUỒN cho bài của Hội cấp trên, để người đọc không nhầm là hoạt
 *    động do Chi hội Chợ Lớn tổ chức.
 *  - Bài nào trùng với một sự kiện đã có thì nối hai chiều qua `suKienSlug`.
 *  - Ảnh tải hẳn về `public/tin-tuc/<slug>/` — không nhúng link web cũ, vì web
 *    cũ có thể tắt bất cứ lúc nào.
 *
 * Chạy lại nhiều lần an toàn: bài đã nhập thì bỏ qua.
 */
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, extname } from "path";
import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";
import { uniqueSlug } from "../src/lib/slug";
import { readFileSync } from "fs";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
const GHI = process.argv.includes("--ghi");

/**
 * Phân loại từng bài. `nguon` để trống nghĩa là việc của chính Chi hội.
 * `suKien` là slug sự kiện tương ứng trên web mới, để dẫn qua lại.
 */
const PHAN_LOAI: Record<
  string,
  { chuyenMuc: string; noiBat?: boolean; nguon?: string; suKien?: string }
> = {
  "doanh-nghiep-cua-ban-da-san-sang": {
    chuyenMuc: "Kinh tế – Thị trường",
    noiBat: true,
  },
  "trien-lam-quoc-te-dien-tu": {
    chuyenMuc: "Kinh tế – Thị trường",
    noiBat: true,
  },
  "vinh-danh-81-doanh-nhan": {
    chuyenMuc: "Tin tức",
    nguon: "Hội Doanh nhân trẻ TP.HCM",
  },
  "hoi-doanh-nhan-tre-tp-hcm-gianh-cup": {
    chuyenMuc: "Tin tức",
    nguon: "Hội Doanh nhân trẻ TP.HCM",
  },
  "buoi-thao-luan-ve-tiem-nang": {
    chuyenMuc: "Kết nối – Hợp tác",
    nguon: "Hội Doanh nhân trẻ TP.HCM",
  },
  "du-an-yba-thu-vien-container": {
    chuyenMuc: "Dự án",
    nguon: "Hội Doanh nhân trẻ TP.HCM",
  },
  "chuc-mung-12-doanh-nghiep": {
    chuyenMuc: "Chân dung hội viên",
    nguon: "Hội Doanh nhân trẻ TP.HCM",
  },
  "khanh-thanh-cau-can-thao": {
    chuyenMuc: "Dự án",
    nguon: "Hội Doanh nhân trẻ TP.HCM",
  },
  "giai-pickleball-yba-hcm-2025": {
    chuyenMuc: "Tin tức",
    nguon: "Hội Doanh nhân trẻ TP.HCM",
  },
};

/** Tìm khoá phân loại khớp với slug bài. */
function phanLoai(slugCu: string) {
  for (const [k, v] of Object.entries(PHAN_LOAI)) if (slugCu.startsWith(k)) return v;
  return { chuyenMuc: "Tin tức" };
}

/** Bỏ rác Elementor, giữ lại đoạn văn, danh sách, in đậm và ảnh. */
function donHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    // Bỏ mọi thuộc tính trừ src/alt của ảnh và href của liên kết
    .replace(/<(\w+)([^>]*)>/g, (all, the: string, thuoc: string) => {
      const t = the.toLowerCase();
      if (t === "img") {
        const src = thuoc.match(/\ssrc=["']([^"']+)["']/)?.[1] ?? "";
        const alt = thuoc.match(/\salt=["']([^"']*)["']/)?.[1] ?? "";
        return src ? `<img src="${src}" alt="${alt}">` : "";
      }
      if (t === "a") {
        const href = thuoc.match(/\shref=["']([^"']+)["']/)?.[1] ?? "";
        return href ? `<a href="${href}">` : "<span>";
      }
      if (["p", "br", "ul", "ol", "li", "strong", "b", "em", "i", "h2", "h3", "h4", "blockquote"].includes(t))
        return `<${t}>`;
      return "";
    })
    .replace(/<\/(?!p|a|ul|ol|li|strong|b|em|i|h2|h3|h4|blockquote)\w+>/g, "")
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/(\s*<br>\s*){3,}/g, "<br>")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chuThuan(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&#039;|&#39;/g, "'")
    .replace(/&#8211;/g, "–")
    .replace(/&#8230;/g, "…")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Tải một ảnh về public/tin-tuc/<slug>/, trả về đường dẫn dùng trên web mới. */
async function taiAnh(url: string, slug: string, so: number): Promise<string | null> {
  try {
    const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1000) return null;
    let duoi = extname(new URL(url).pathname).toLowerCase();
    if (!/^\.(jpg|jpeg|png|webp|gif)$/.test(duoi)) duoi = ".jpg";
    const thuMuc = join("public", "tin-tuc", slug);
    mkdirSync(thuMuc, { recursive: true });
    const ten = `${so}${duoi}`;
    writeFileSync(join(thuMuc, ten), buf);
    return `/tin-tuc/${slug}/${ten}`;
  } catch {
    return null;
  }
}

(async () => {
  const bai = JSON.parse(readFileSync("soat/web-cu/posts.json", "utf8")) as any[];
  bai.sort((a, b) => (a.date < b.date ? -1 : 1));

  const suKien = await prisma.event.findMany({ select: { slug: true, title: true } });

  /** Tìm sự kiện khớp với bài, dựa trên các từ khoá đặc trưng. */
  function timSuKien(tieuDe: string): string | undefined {
    const k = normalizeSearch(tieuDe);
    const cap: [RegExp, RegExp][] = [
      [/trung hau cup|pickleball yba hcm 2025/, /trung hau/],
      [/cau can thao|nhip cau doanh nhan/, /can thao/],
      [/thu vien container/, /container/],
      [/thi truong cuoi|su kien cuoi/, /wedding|cuoi/],
    ];
    for (const [aBai, aSK] of cap) {
      if (!aBai.test(k)) continue;
      const s = suKien.find((e) => aSK.test(normalizeSearch(e.title)));
      if (s) return s.slug;
    }
    return undefined;
  }

  let them = 0;
  let boQua = 0;

  for (const p of bai) {
    const tieuDe = chuThuan(p.title?.rendered ?? "");
    const daCo = await prisma.post.findFirst({
      where: { title: tieuDe },
      select: { id: true, slug: true },
    });
    if (daCo) {
      boQua++;
      console.log(`  (đã có) ${tieuDe.slice(0, 60)}`);
      continue;
    }

    const slugCu = new URL(p.link).pathname.replace(/\//g, "");
    const pl = phanLoai(slugCu);
    const skSlug = timSuKien(tieuDe);

    let noiDung = donHtml(p.content?.rendered ?? "");
    const slug = await uniqueSlug(tieuDe, async (s) =>
      Boolean(await prisma.post.findUnique({ where: { slug: s }, select: { id: true } }))
    );

    // Ảnh: ảnh đại diện + mọi ảnh trong bài
    let anhBia: string | null = null;
    let soAnh = 0;
    if (GHI) {
      if (p.featured_media) {
        try {
          const m = await fetch(
            `https://ybacholon.vn/wp-json/wp/v2/media/${p.featured_media}`
          ).then((r) => r.json());
          if (m?.source_url) anhBia = await taiAnh(m.source_url, slug, ++soAnh);
        } catch {
          /* không có ảnh đại diện thì thôi */
        }
      }
      const trongBai = [...noiDung.matchAll(/<img src="([^"]+)"/g)].map((m) => m[1]);
      for (const u of trongBai) {
        const moi = await taiAnh(u, slug, ++soAnh);
        if (moi) noiDung = noiDung.split(u).join(moi);
        else noiDung = noiDung.replace(new RegExp(`<img src="${u.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"[^>]*>`, "g"), "");
      }
    }

    const thuan = chuThuan(noiDung);
    const excerpt = thuan.slice(0, 200) + (thuan.length > 200 ? "…" : "");

    console.log(
      `  + ${tieuDe.slice(0, 60)}\n` +
        `      chuyên mục: ${pl.chuyenMuc}${pl.noiBat ? " · NỔI BẬT" : ""}` +
        `${pl.nguon ? ` · nguồn: ${pl.nguon}` : " · việc của Chi hội"}` +
        `${skSlug ? ` · nối sự kiện: /su-kien/${skSlug}` : ""}` +
        `${GHI ? ` · ${soAnh} ảnh` : ""}`
    );

    if (GHI) {
      await prisma.post.create({
        data: {
          slug,
          title: tieuDe,
          type: "TIN_TUC",
          chuyenMuc: pl.chuyenMuc,
          nguon: pl.nguon ?? null,
          suKienSlug: skSlug ?? null,
          excerpt,
          content: noiDung,
          coverImage: anhBia,
          published: true,
          featured: pl.noiBat ?? false,
          publishedAt: new Date(p.date),
          searchText: normalizeSearch(`${tieuDe} ${thuan.slice(0, 3000)} ${pl.chuyenMuc}`),
        },
      });
    }
    them++;
  }

  console.log(
    `\n${them} bài ${GHI ? "đã nhập" : "sẽ nhập"} · ${boQua} bài đã có sẵn.`
  );
  if (!GHI) console.log("Ghi thật: npm run nhap-bai-cu -- --ghi\n");
  await prisma.$disconnect();
})();
