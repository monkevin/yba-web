import { prisma } from "@/lib/prisma";

/**
 * Các trang nội dung cố định mà Ban Chủ nhiệm sửa được từ /quan-tri/trang.
 *
 * Cách hoạt động: trang công khai đọc bản ghi `Page` theo slug. Chưa có bản ghi
 * thì hiện nội dung mặc định viết sẵn trong mã nguồn — nên web luôn có nội dung,
 * kể cả khi chưa ai vào sửa gì.
 */

export const TRANG_TINH: {
  slug: string;
  ten: string;
  duongDan: string;
  mo: string;
}[] = [
  {
    slug: "gioi-thieu",
    ten: "Giới thiệu Chi hội",
    duongDan: "/gioi-thieu",
    mo: "Phần mở đầu trang Giới thiệu. Bỏ trống thì dùng nội dung lấy từ Profile Chi hội.",
  },
  {
    slug: "quyen-loi-hoi-vien",
    ten: "Quyền lợi hội viên",
    duongDan: "/dang-ky-hoi-vien",
    mo: "Đoạn mô tả quyền lợi hiện ở trang Đăng ký hội viên.",
  },
  {
    slug: "ban-chap-hanh",
    ten: "Ban Chủ nhiệm — lời giới thiệu",
    duongDan: "/ban-chap-hanh",
    mo: "Đoạn mở đầu trang Ban Chủ nhiệm, phía trên danh sách nhân sự.",
  },
  {
    slug: "dieu-le",
    ten: "Điều lệ & quy định",
    duongDan: "/dieu-le",
    mo: "Trang riêng cho điều lệ Chi hội. Chưa nhập nội dung thì trang này chưa hiện.",
  },
];

export type NoiDungTrang = {
  title: string;
  content: string;
  metaDesc: string | null;
  coverImage: string | null;
  /** true = Ban Chủ nhiệm đã tự soạn, false = đang dùng nội dung mặc định */
  tuySua: boolean;
};

/** Đọc nội dung một trang tĩnh; chưa có thì trả về null để trang dùng mặc định. */
export async function docTrang(slug: string): Promise<NoiDungTrang | null> {
  const p = await prisma.page.findUnique({ where: { slug } });
  if (!p) return null;
  return {
    title: p.title,
    content: p.content,
    metaDesc: p.metaDesc,
    coverImage: p.coverImage,
    tuySua: true,
  };
}

/** Tách nội dung thành các đoạn để render — cách nhau bằng một dòng trống. */
export function tachDoan(content: string): string[] {
  return content
    .split(/\n{2,}/)
    .map((d) => d.trim())
    .filter(Boolean);
}
