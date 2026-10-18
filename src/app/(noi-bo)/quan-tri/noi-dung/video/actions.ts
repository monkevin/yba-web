"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";

export type KetQuaVideo = { error?: string; ok?: string };

/** Video dùng chung quyền với tin tức — đều là nội dung Ban Truyền thông đăng. */
async function canQuyen() {
  const user = await requireUser();
  if (!co(user, QUYEN.NOI_DUNG_VIET))
    return { error: "Không có quyền thực hiện thao tác này" as const };
  return { user };
}

/**
 * Nhận mọi kiểu dán link YouTube mà anh chị hay dùng và rút ra mã 11 ký tự:
 * watch?v=…, youtu.be/…, /embed/…, /shorts/…, hoặc dán thẳng mã.
 */
function docMaVideo(s: string): string | null {
  const t = s.trim();
  if (/^[\w-]{11}$/.test(t)) return t;
  const m = t.match(
    /(?:v=|youtu\.be\/|\/embed\/|\/shorts\/|\/live\/)([\w-]{11})/
  );
  return m ? m[1] : null;
}

function chuoi(fd: FormData, k: string): string {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}

/** Thêm video mới hoặc sửa video đã có. */
export async function luuVideo(
  _prev: KetQuaVideo,
  fd: FormData
): Promise<KetQuaVideo> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const youtubeId = docMaVideo(chuoi(fd, "link"));
  const title = chuoi(fd, "title");

  if (!youtubeId) {
    return {
      error:
        "Chưa đọc được mã video. Anh chị dán nguyên đường dẫn YouTube, ví dụ https://www.youtube.com/watch?v=abc123XYZ90",
    };
  }
  if (!title) return { error: "Chưa nhập tiêu đề video" };

  const trung = await prisma.video.findUnique({ where: { youtubeId } });
  if (trung && trung.id !== id) {
    return { error: `Video này đã có trong danh sách: "${trung.title}"` };
  }

  const ngay = chuoi(fd, "publishedAt");
  const dulieu = {
    youtubeId,
    title,
    summary: chuoi(fd, "summary") || null,
    publishedAt: ngay ? new Date(ngay) : null,
    featured: fd.get("featured") !== null,
    published: fd.get("published") !== null,
  };

  if (id) {
    await prisma.video.update({ where: { id }, data: dulieu });
  } else {
    await prisma.video.create({ data: dulieu });
  }

  revalidatePath("/quan-tri/noi-dung/video");
  revalidatePath("/video");
  revalidatePath("/");
  return { ok: id ? "Đã lưu video." : "Đã thêm video." };
}

/** Xoá một video khỏi website (không đụng tới video trên YouTube). */
export async function xoaVideo(
  _prev: KetQuaVideo,
  fd: FormData
): Promise<KetQuaVideo> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  if (!id) return { error: "Thiếu mã video" };

  await prisma.video.delete({ where: { id } }).catch(() => {});
  revalidatePath("/quan-tri/noi-dung/video");
  revalidatePath("/video");
  return { ok: "Đã xoá video khỏi website." };
}

/** Lấy lại 15 video mới nhất từ kênh YouTube của Chi hội. */
export async function napTuYoutube(): Promise<KetQuaVideo> {
  const q = await canQuyen();
  if ("error" in q) return { error: q.error };

  const KENH = "UCyFbdqQ5UuS5DmDwbtrol5g";
  let xml: string;
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${KENH}`,
      { cache: "no-store" }
    );
    if (!res.ok) return { error: `YouTube trả về lỗi ${res.status}` };
    xml = await res.text();
  } catch {
    return { error: "Không kết nối được tới YouTube. Anh chị thử lại sau." };
  }

  const goXml = (s: string) =>
    s
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .trim();
  const lay = (khoi: string, the: string) => {
    const m = khoi.match(new RegExp(`<${the}[^>]*>([\\s\\S]*?)</${the}>`));
    return m ? goXml(m[1]) : null;
  };

  let them = 0;
  for (const e of xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? []) {
    const youtubeId = lay(e, "yt:videoId");
    const title = lay(e, "title");
    if (!youtubeId || !title) continue;
    if (await prisma.video.findUnique({ where: { youtubeId } })) continue;

    const ngay = lay(e, "published");
    const moTa = lay(e, "media:description") ?? "";
    await prisma.video.create({
      data: {
        youtubeId,
        title,
        summary: moTa ? moTa.split(/\n/)[0].slice(0, 300) : null,
        publishedAt: ngay ? new Date(ngay) : null,
      },
    });
    them++;
  }

  revalidatePath("/quan-tri/noi-dung/video");
  revalidatePath("/video");
  return {
    ok: them
      ? `Đã lấy thêm ${them} video mới từ kênh YouTube.`
      : "Kênh YouTube không có video nào mới.",
  };
}
