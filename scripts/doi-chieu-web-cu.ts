/**
 * Đối chiếu nội dung website CŨ (đã cào vào soat/web-cu/) với web MỚI,
 * chỉ ra chính xác cái gì còn thiếu.
 *
 *   npm run cao-web-cu        (chạy trước để lấy dữ liệu)
 *   npm run doi-chieu-cu
 */
import { readFileSync, writeFileSync } from "fs";
import { boThe } from "./cao-web-cu";
import { prisma } from "../src/lib/prisma";
import { normalizeSearch } from "../src/lib/search";

const doc = (t: string) => JSON.parse(readFileSync(`soat/web-cu/${t}.json`, "utf8")) as any[];

/** So tên người: bỏ dấu, bỏ khoảng trắng thừa. */
const chuan = (s: string) => normalizeSearch(boThe(s)).replace(/\s+/g, " ").trim();

(async () => {
  const ra: string[] = ["# Web cũ có gì mà web mới chưa có\n"];

  // ── 1. Hồ sơ thành viên ──────────────────────────────────
  const tvCu = doc("thanhvien-yba");
  const hvMoi = await prisma.member.findMany({
    select: { code: true, name: true, company: true, slug: true },
  });
  const leaderMoi = await prisma.leader.findMany({ select: { name: true } });

  const tenMoi = new Set([
    ...hvMoi.map((m) => chuan(m.name ?? "")),
    ...leaderMoi.map((l) => chuan(l.name)),
  ]);

  const thieuNguoi = tvCu
    .map((t) => ({ ten: boThe(t.title?.rendered ?? ""), link: t.link }))
    .filter((t) => t.ten && !tenMoi.has(chuan(t.ten)));

  ra.push(
    `\n## Người có hồ sơ trên web cũ nhưng KHÔNG tìm thấy trên web mới — ${thieuNguoi.length}/${tvCu.length}\n`
  );
  if (!thieuNguoi.length) ra.push("Không thiếu ai.\n");
  for (const t of thieuNguoi) ra.push(`- **${t.ten}** — ${t.link}`);

  // ── 2. Bài viết / bản tin ────────────────────────────────
  const baiCu = doc("posts");
  const postMoi = await prisma.post.findMany({ select: { title: true } });
  const eventMoi = await prisma.event.findMany({ select: { title: true } });
  const tieuDeMoi = [...postMoi, ...eventMoi].map((p) => chuan(p.title));

  const thieuBai = baiCu
    .map((b) => ({
      ten: boThe(b.title?.rendered ?? ""),
      link: b.link,
      ngay: (b.date ?? "").slice(0, 10),
      dai: boThe(b.content?.rendered ?? "").length,
    }))
    .filter((b) => {
      const k = chuan(b.ten).slice(0, 40);
      return !tieuDeMoi.some((t) => t.includes(k) || k.includes(t.slice(0, 40)));
    });

  ra.push(`\n## Bài viết trên web cũ chưa có trên web mới — ${thieuBai.length}/${baiCu.length}\n`);
  for (const b of thieuBai)
    ra.push(`- **${b.ten}** (${b.ngay}, ${b.dai} ký tự)\n  ${b.link}`);

  // ── 3. Sự kiện ───────────────────────────────────────────
  const skCu = doc("event-ybacholon");
  const thieuSK = skCu
    .map((s) => ({ ten: boThe(s.title?.rendered ?? ""), link: s.link }))
    .filter((s) => {
      const k = chuan(s.ten).slice(0, 30);
      return !tieuDeMoi.some((t) => t.includes(k) || k.includes(t.slice(0, 30)));
    });

  ra.push(`\n## Sự kiện trên web cũ chưa có trên web mới — ${thieuSK.length}/${skCu.length}\n`);
  for (const s of thieuSK) ra.push(`- **${s.ten}** — ${s.link}`);

  // ── 4. Trang tĩnh ────────────────────────────────────────
  const trangCu = doc("pages");
  const trangMoi = await prisma.page.findMany({ select: { slug: true, title: true } });

  // Trang giỏ hàng / thanh toán của plugin bán vé — không cần bê sang
  const BO_QUA = /tickets-|thanh-toan|tai-khoan|header-main/;

  ra.push(`\n## Trang tĩnh trên web cũ\n`);
  ra.push(`Web mới đang có ${trangMoi.length} trang tĩnh: ${trangMoi.map((t) => t.slug).join(", ")}\n`);
  for (const t of trangCu) {
    const duong = new URL(t.link).pathname.replace(/\//g, "");
    const noi = boThe(t.content?.rendered ?? "");
    const boQua = BO_QUA.test(duong);
    ra.push(
      `- ${boQua ? "~~" : "**"}${boThe(t.title?.rendered ?? "")}${boQua ? "~~ (trang kỹ thuật của plugin bán vé, bỏ)" : `** — ${noi.length} ký tự — ${t.link}`}`
    );
  }

  writeFileSync("soat/web-cu/con-thieu.md", ra.join("\n"));
  console.log(ra.join("\n"));
  await prisma.$disconnect();
})();
