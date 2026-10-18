/**
 * Nhập sự kiện Chi hội từ thư mục ảnh hoạt động.
 *
 *   npm run nhap-su-kien -- "E:\...\BÁO CÁO HOẠT ĐỘNG CHỢ LỚN" [--xoa-cu]
 *
 * Mỗi thư mục con là một sự kiện, tên thư mục có dạng:
 *   "(4) 07-08.09.24 Caravan XTTM Đồng Tháp"
 *    ^   ^            ^
 *    |   |            └ tên sự kiện
 *    |   └ ngày (dd.mm.yy, hoặc nhiều ngày "07-08.09.24")
 *    └ mảng hoạt động của Chi hội
 *
 * Ảnh trong thư mục được chép sang `public/su-kien/<slug>/`, ảnh đầu làm ảnh bìa.
 * Chạy lại nhiều lần an toàn: sự kiện trùng slug sẽ được cập nhật.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { toSlug } from "../src/lib/slug";

const prisma = new PrismaClient();

/**
 * Số trong ngoặc ở đầu tên thư mục = mảng hoạt động.
 * ⚠️ Tên các mảng dưới đây do đọc nội dung từng thư mục mà suy ra — nhờ Ban Chủ
 * nhiệm rà lại và đổi cho đúng cách gọi của Chi hội.
 */
const MANG_HOAT_DONG: Record<string, string> = {
  "2": "Kết nối hội viên",
  "3": "Kết nối & hội nhập",
  "4": "Xúc tiến thương mại",
  "5": "Thể thao & gia đình",
  "6": "Trách nhiệm cộng đồng",
};

/** Chương trình định kỳ nhận ra từ tên sự kiện. */
const CHUONG_TRINH: [RegExp, string][] = [
  [/coffee\s*share/i, "Coffee Share"],
  [/coffee\s*connect/i, "Coffee Connect"],
  [/business\s*&?\s*library/i, "Business & Library"],
  [/connect\s*beyond/i, "Connect Beyond"],
  [/caravan/i, "Caravan xúc tiến thương mại"],
  [/pickleball/i, "CLB Pickleball"],
  [/thư viện container/i, "Thư viện Container"],
  [/nhịp c[âầ]u doanh nhân/i, "Nhịp cầu Doanh nhân"],
  [/rạp phim yêu thương/i, "Rạp phim Yêu thương"],
  [/họp mặt hội viên/i, "Họp mặt hội viên"],
  [/ăn trưa cùng hội viên/i, "Ăn trưa cùng hội viên"],
  [/thăm doanh nghiệp/i, "Thăm doanh nghiệp hội viên"],
  [/^yep|yep\s/i, "Tiệc tất niên YEP"],
];

const ANH = /\.(jpe?g|png|webp)$/i;

/** "04.03.25" → 04/03/2025 · "07-08.09.24" → 07/09/2024 (lấy ngày đầu). */
function docNgay(raw: string): Date | null {
  const m = raw.match(/^([\d-]+)\.(\d{1,2})\.(\d{2,4})$/);
  if (!m) return null;
  const ngay = Number(m[1].split("-")[0]);
  const thang = Number(m[2]);
  let nam = Number(m[3]);
  if (nam < 100) nam += 2000;
  if (!ngay || !thang || thang > 12 || ngay > 31) return null;
  const d = new Date(nam, thang - 1, ngay);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Ngày kết thúc khi tên thư mục ghi nhiều ngày: "24-25-26.09.25" → 26/09/2025. */
function docNgayKetThuc(raw: string): Date | null {
  const m = raw.match(/^([\d-]+)\.(\d{1,2})\.(\d{2,4})$/);
  if (!m) return null;
  const cac = m[1].split("-");
  if (cac.length < 2) return null;
  const ngay = Number(cac[cac.length - 1]);
  const thang = Number(m[2]);
  let nam = Number(m[3]);
  if (nam < 100) nam += 2000;
  const d = new Date(nam, thang - 1, ngay);
  return Number.isNaN(d.getTime()) ? null : d;
}

type DaDoc = {
  tenGoc: string;
  tieuDe: string;
  ngay: Date | null;
  ngayKetThuc: Date | null;
  mang: string | null;
  chuongTrinh: string | null;
  anh: string[];
};

function docThuMuc(duongDan: string, ten: string): DaDoc {
  // "(4) 07-08.09.24 Caravan XTTM Đồng Tháp" hoặc "(2)12.02.24 - Tên sự kiện"
  const m = ten.match(/^\((\d)\)\s*(.*)$/);
  const mang = m ? (MANG_HOAT_DONG[m[1]] ?? null) : null;
  let conLai = (m ? m[2] : ten).trim();

  // Tách cụm ngày ở đầu (nếu có)
  const mNgay = conLai.match(/^([\d.\-]+)\s*[-–]?\s*(.*)$/);
  let ngay: Date | null = null;
  let ngayKetThuc: Date | null = null;
  let tieuDe = conLai;

  if (mNgay) {
    const thu = docNgay(mNgay[1]);
    if (thu) {
      ngay = thu;
      ngayKetThuc = docNgayKetThuc(mNgay[1]);
      tieuDe = mNgay[2].trim();
    }
  }
  tieuDe = tieuDe.replace(/^[-–\s]+/, "").trim() || conLai;

  const chuongTrinh =
    CHUONG_TRINH.find(([re]) => re.test(tieuDe))?.[1] ?? null;

  const anh = existsSync(duongDan)
    ? readdirSync(duongDan)
        .filter((f) => ANH.test(f) && statSync(path.join(duongDan, f)).isFile())
        .sort()
    : [];

  return { tenGoc: ten, tieuDe, ngay, ngayKetThuc, mang, chuongTrinh, anh };
}

async function main() {
  const argv = process.argv.slice(2);
  const nguon = argv.find((a) => !a.startsWith("--"));
  const xoaCu = argv.includes("--xoa-cu");

  if (!nguon || !existsSync(nguon)) {
    console.error(
      'Thiếu thư mục nguồn.\nVí dụ: npm run nhap-su-kien -- "E:\\...\\BÁO CÁO HOẠT ĐỘNG CHỢ LỚN"'
    );
    process.exit(1);
  }

  const thuMuc = readdirSync(nguon).filter((f) =>
    statSync(path.join(nguon, f)).isDirectory()
  );
  console.log(`Tìm thấy ${thuMuc.length} thư mục sự kiện.`);

  if (xoaCu) {
    console.log("Xoá sự kiện cũ...");
    await prisma.eventRegistration.deleteMany();
    await prisma.event.deleteMany();
  }

  const goc = path.join(process.cwd(), "public", "su-kien");
  mkdirSync(goc, { recursive: true });

  // Đọc trước toàn bộ để phát hiện slug trùng. Chi hội tổ chức cùng một chương
  // trình nhiều lần trong năm (ví dụ "YBA Chợ Lớn x CLB CF DN Phú Yên" hai đợt),
  // nếu chỉ lấy tên + năm thì hai đợt đè lên nhau và mất một sự kiện.
  const daDoc = thuMuc.map((ten) => ({
    ten,
    d: docThuMuc(path.join(nguon, ten), ten),
  }));

  const slugCoBan = new Map<string, number>();
  for (const { ten, d } of daDoc) {
    const s = toSlug(`${d.tieuDe} ${d.ngay ? d.ngay.getFullYear() : ""}`) || toSlug(ten);
    slugCoBan.set(s, (slugCoBan.get(s) ?? 0) + 1);
  }

  let them = 0;
  let capNhat = 0;
  let khongCoNgay = 0;
  let tongAnh = 0;

  for (const { ten, d } of daDoc) {
    // Không đọc được ngày thì vẫn nhập, tạm xếp vào 01/01/2024 để sửa sau
    if (!d.ngay) khongCoNgay++;
    const startAt = d.ngay ?? new Date(2024, 0, 1);

    const coBan =
      toSlug(`${d.tieuDe} ${d.ngay ? d.ngay.getFullYear() : ""}`) || toSlug(ten);
    // Trùng thì thêm ngày-tháng vào cuối — vẫn cố định qua các lần chạy lại
    const slug =
      (slugCoBan.get(coBan) ?? 0) > 1 && d.ngay
        ? `${coBan}-${String(d.ngay.getDate()).padStart(2, "0")}${String(
            d.ngay.getMonth() + 1
          ).padStart(2, "0")}`
        : coBan;

    // Chép ảnh sang public/su-kien/<slug>/
    const thuMucAnh = path.join(goc, slug);
    const duongDanAnh: string[] = [];
    if (d.anh.length) {
      mkdirSync(thuMucAnh, { recursive: true });
      d.anh.forEach((f, i) => {
        const duoi = path.extname(f).toLowerCase();
        const tenMoi = `${String(i + 1).padStart(2, "0")}${duoi}`;
        copyFileSync(path.join(nguon, ten, f), path.join(thuMucAnh, tenMoi));
        duongDanAnh.push(`/su-kien/${slug}/${tenMoi}`);
      });
      tongAnh += d.anh.length;
    }

    const duLieu = {
      title: d.tieuDe,
      summary: [d.chuongTrinh, d.mang].filter(Boolean).join(" · ") || null,
      startAt,
      endAt: d.ngayKetThuc,
      seriesName: d.chuongTrinh,
      activityGroup: d.mang,
      coverImage: duongDanAnh[0] ?? null,
      gallery: duongDanAnh.length ? JSON.stringify(duongDanAnh) : null,
      published: true,
    };

    const daCo = await prisma.event.findUnique({
      where: { slug },
      select: { id: true },
    });

    if (daCo) {
      await prisma.event.update({ where: { slug }, data: duLieu });
      capNhat++;
    } else {
      await prisma.event.create({ data: { ...duLieu, slug } });
      them++;
    }
  }

  console.log("");
  console.log(`✓ Thêm mới ${them}, cập nhật ${capNhat} sự kiện · ${tongAnh} ảnh đã chép.`);
  if (khongCoNgay) {
    console.log(
      `⚠ ${khongCoNgay} thư mục không đọc được ngày trong tên — đã tạm để 01/01/2024, sửa lại trong trang quản trị.`
    );
  }

  const theoMang = await prisma.event.groupBy({
    by: ["activityGroup"],
    _count: { _all: true },
  });
  console.log("\nSố sự kiện theo mảng hoạt động:");
  for (const m of theoMang) {
    console.log(`  ${m.activityGroup ?? "(chưa phân mảng)"}: ${m._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
