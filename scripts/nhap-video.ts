/**
 * Nhập video từ kênh YouTube của Chi hội qua nguồn RSS chính thức của YouTube
 * (không cần khoá API). Nguồn chỉ trả về 15 video mới nhất — video cũ hơn thì
 * thêm tay ở /quan-tri/noi-dung/video.
 *
 *   npm run nhap-video
 */
import { prisma } from "../src/lib/prisma";

/// Mã kênh YouTube "YBA - Chi hội Chợ Lớn" (youtube.com/@yba-chihoicholon1808)
const KENH = "UCyFbdqQ5UuS5DmDwbtrol5g";

/** Trả ký tự thật cho các thực thể XML hay gặp trong tiêu đề video. */
function goXml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function lay(khoi: string, the: string): string | null {
  const m = khoi.match(new RegExp(`<${the}[^>]*>([\\s\\S]*?)</${the}>`));
  return m ? goXml(m[1]) : null;
}

(async () => {
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${KENH}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Không đọc được kênh YouTube (HTTP ${res.status}).`);
    process.exit(1);
  }
  const xml = await res.text();
  const khoi = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

  let them = 0;
  let capNhat = 0;

  for (const [i, e] of khoi.entries()) {
    const youtubeId = lay(e, "yt:videoId");
    const title = lay(e, "title");
    if (!youtubeId || !title) continue;

    const ngay = lay(e, "published");
    const moTa = lay(e, "media:description") ?? "";

    const dulieu = {
      title,
      summary: moTa ? moTa.split(/\n/)[0].slice(0, 300) : null,
      publishedAt: ngay ? new Date(ngay) : null,
      order: i,
    };

    const co = await prisma.video.findUnique({ where: { youtubeId } });
    if (co) {
      await prisma.video.update({ where: { youtubeId }, data: dulieu });
      capNhat++;
    } else {
      // Video mới nhất được ghim sẵn để trang chủ có cái hiện ngay
      await prisma.video.create({
        data: { youtubeId, ...dulieu, featured: i === 0 },
      });
      them++;
    }
  }

  const tong = await prisma.video.count();
  console.log(`Thêm mới ${them} video, cập nhật ${capNhat}. Tổng: ${tong} video.`);
  await prisma.$disconnect();
})();
