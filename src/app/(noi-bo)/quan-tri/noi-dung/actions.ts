"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { hashPassword, requireUser } from "@/lib/auth";
import { QUYEN, co, type MaQuyen } from "@/lib/quyen";
import { prisma } from "@/lib/prisma";
import { laLoiTrungKhoa, maHoiVienTiepTheo } from "@/lib/dang-nhap";
import { normalizeSearch } from "@/lib/search";
import { uniqueSlug } from "@/lib/slug";
import { laSoDienThoaiVN, soDienThoaiDeLuu } from "@/lib/so-dien-thoai";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/** Kiểm tra đúng quyền cần cho từng nhóm thao tác nội dung. */
async function canQuyen(ma: MaQuyen) {
  const user = await requireUser();
  if (!co(user, ma))
    return { error: "Không có quyền thực hiện thao tác này" as const };
  return { user };
}

// ═══════════════════════════════════════════════════════
// Tin tức
// ═══════════════════════════════════════════════════════

/** Thêm mới hoặc lưu một bài viết. */
export async function luuBaiViet(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen(QUYEN.NOI_DUNG_VIET);
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const tieuDe = chuoi(fd, "title");
  const noiDung = chuoi(fd, "content");
  if (tieuDe.length < 8) return { error: "Tiêu đề quá ngắn" };
  if (noiDung.length < 30) return { error: "Nội dung quá ngắn" };

  const congBo = fd.get("published") !== null;
  const duLieu = {
    title: tieuDe,
    type: chuoi(fd, "type") || "TIN_TUC",
    excerpt: chuoi(fd, "excerpt") || null,
    content: noiDung,
    coverImage: chuoi(fd, "coverImage") || null,
    featured: fd.get("featured") !== null,
    published: congBo,
    searchText: normalizeSearch(`${tieuDe} ${chuoi(fd, "excerpt")} ${noiDung}`),
  };

  if (id) {
    const cu = await prisma.post.findUnique({
      where: { id },
      select: { slug: true, publishedAt: true },
    });
    if (!cu) return { error: "Không tìm thấy bài viết" };

    await prisma.post.update({
      where: { id },
      data: {
        ...duLieu,
        // Lần đầu công bố thì ghi mốc thời gian, các lần sau giữ nguyên
        publishedAt: congBo ? (cu.publishedAt ?? new Date()) : null,
      },
    });
    revalidatePath("/quan-tri/noi-dung/tin-tuc");
    revalidatePath("/tin-tuc");
    revalidatePath(`/tin-tuc/${cu.slug}`);
    return { ok: true, message: "Đã lưu bài viết" };
  }

  const slug = await uniqueSlug(
    tieuDe,
    async (s) =>
      !!(await prisma.post.findUnique({
        where: { slug: s },
        select: { id: true },
      })),
    "bai-viet",
  );

  await prisma.post.create({
    data: {
      ...duLieu,
      slug,
      publishedAt: congBo ? new Date() : null,
      authorUserId: q.user.id,
    },
  });

  revalidatePath("/quan-tri/noi-dung/tin-tuc");
  revalidatePath("/tin-tuc");
  redirect("/quan-tri/noi-dung/tin-tuc");
}

export async function xoaBaiViet(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen(QUYEN.NOI_DUNG_VIET);
  if ("error" in q) return { error: q.error };

  await prisma.post.delete({ where: { id: chuoi(fd, "id") } });
  revalidatePath("/quan-tri/noi-dung/tin-tuc");
  revalidatePath("/tin-tuc");
  return { ok: true, message: "Đã xoá bài viết" };
}

// ═══════════════════════════════════════════════════════
// Sự kiện
// ═══════════════════════════════════════════════════════

/** Lưu thông tin một sự kiện (thường là sửa lại sau khi nhập từ thư mục ảnh). */
export async function luuSuKien(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen(QUYEN.SU_KIEN_QUAN_LY);
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const tieuDe = chuoi(fd, "title");
  const batDau = chuoi(fd, "startAt");
  if (tieuDe.length < 5) return { error: "Nhập tên sự kiện" };
  if (!batDau) return { error: "Chọn ngày diễn ra" };

  const startAt = new Date(batDau);
  if (Number.isNaN(startAt.getTime())) return { error: "Ngày không hợp lệ" };

  const ketThucRaw = chuoi(fd, "endAt");
  const endAt = ketThucRaw ? new Date(ketThucRaw) : null;
  if (endAt && endAt < startAt) {
    return { error: "Ngày kết thúc phải sau ngày bắt đầu" };
  }

  const soCho = Number(chuoi(fd, "capacity"));
  const duLieu = {
    title: tieuDe,
    summary: chuoi(fd, "summary") || null,
    content: chuoi(fd, "content") || null,
    location: chuoi(fd, "location") || null,
    seriesName: chuoi(fd, "seriesName") || null,
    activityGroup: chuoi(fd, "activityGroup") || null,
    coverImage: chuoi(fd, "coverImage") || null,
    gallery: chuoi(fd, "gallery") || null,
    startAt,
    endAt,
    allowSignup: fd.get("allowSignup") !== null,
    capacity: soCho > 0 ? soCho : null,
    published: fd.get("published") !== null,
  };

  if (id) {
    const cu = await prisma.event.findUnique({
      where: { id },
      select: { slug: true },
    });
    if (!cu) return { error: "Không tìm thấy sự kiện" };

    await prisma.event.update({ where: { id }, data: duLieu });
    revalidatePath("/quan-tri/noi-dung/su-kien");
    revalidatePath("/su-kien");
    revalidatePath(`/su-kien/${cu.slug}`);
    return { ok: true, message: "Đã lưu sự kiện" };
  }

  const slug = await uniqueSlug(
    `${tieuDe} ${startAt.getFullYear()}`,
    async (s) =>
      !!(await prisma.event.findUnique({
        where: { slug: s },
        select: { id: true },
      })),
    "su-kien",
  );

  await prisma.event.create({ data: { ...duLieu, slug } });
  revalidatePath("/quan-tri/noi-dung/su-kien");
  revalidatePath("/su-kien");
  redirect("/quan-tri/noi-dung/su-kien");
}

export async function xoaSuKien(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await canQuyen(QUYEN.SU_KIEN_QUAN_LY);
  if ("error" in q) return { error: q.error };

  await prisma.event.delete({ where: { id: chuoi(fd, "id") } });
  revalidatePath("/quan-tri/noi-dung/su-kien");
  revalidatePath("/su-kien");
  return { ok: true, message: "Đã xoá sự kiện" };
}

// ═══════════════════════════════════════════════════════
// Hồ sơ đăng ký & tin nhắn liên hệ
// ═══════════════════════════════════════════════════════

/** Đổi trạng thái xử lý một hồ sơ đăng ký hội viên. */
export async function doiTrangThaiHoSo(
  _prev: KetQua,
  fd: FormData,
): Promise<KetQua> {
  const q = await canQuyen(QUYEN.BIEU_MAU_XU_LY);
  if ("error" in q) return { error: q.error };

  const trangThai = chuoi(fd, "trangThai");
  if (!["MOI", "DANG_XU_LY", "DA_DUYET", "TU_CHOI"].includes(trangThai)) {
    return { error: "Trạng thái không hợp lệ" };
  }

  await prisma.membershipApplication.update({
    where: { id: chuoi(fd, "id") },
    data: { status: trangThai, handledNote: chuoi(fd, "ghiChu") || undefined },
  });

  revalidatePath("/quan-tri/noi-dung/dang-ky");
  return { ok: true, message: "Đã cập nhật" };
}

/**
 * Duyệt hồ sơ đăng ký VÀ kết nạp luôn: tạo hồ sơ hội viên + tài khoản đăng nhập.
 * Mật khẩu ban đầu chỉ hiện MỘT LẦN trong thông báo trả về — hệ thống chỉ lưu
 * bản mã hoá, Ban Hội viên chép lại và gửi cho hội viên mới.
 */
export async function duyetVaKetNap(
  _prev: KetQua,
  fd: FormData,
): Promise<KetQua> {
  const q = await canQuyen(QUYEN.BIEU_MAU_XU_LY);
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const hoSo = await prisma.membershipApplication.findUnique({ where: { id } });
  if (!hoSo) return { error: "Không tìm thấy hồ sơ" };
  if (hoSo.status === "DA_DUYET")
    return { error: "Hồ sơ này đã được duyệt rồi" };

  // SĐT trong đơn khách tự gõ (có chấm, +84…) → chuẩn hoá trước khi so trùng và
  // lưu, vì SĐT là một cách đăng nhập web
  const phone = soDienThoaiDeLuu(hoSo.phone);

  // Tránh kết nạp trùng: cùng tên doanh nghiệp hoặc cùng số điện thoại (so cả
  // dạng chuẩn lẫn chữ gốc cho hồ sơ cũ chưa chuẩn hoá)
  const trung = await prisma.member.findFirst({
    where: {
      OR: [
        { company: { equals: hoSo.company } },
        ...(phone ? [{ phone }] : []),
        ...(hoSo.phone && hoSo.phone !== phone ? [{ phone: hoSo.phone }] : []),
      ],
    },
    select: { code: true, company: true },
  });
  if (trung) {
    return {
      error: `Đã có hội viên trùng (${trung.code} — ${trung.company}). Kiểm tra lại trước khi kết nạp.`,
    };
  }

  // Mã kế tiếp CHỈ xét mã HV + số (bản cũ vớ phải KDZ003 → hv0004 đã tồn tại) và
  // bảo đảm tên đăng nhập cùng số cũng còn trống
  const code = await maHoiVienTiepTheo(true);
  const username = code.toLowerCase();

  if (await prisma.user.findUnique({ where: { username } })) {
    return {
      error: `Tên đăng nhập ${username} đã tồn tại — kiểm tra dữ liệu tài khoản.`,
    };
  }

  const slug = await uniqueSlug(
    hoSo.company,
    async (s) =>
      !!(await prisma.member.findUnique({
        where: { slug: s },
        select: { id: true },
      })),
    "doanh-nghiep",
  );

  // Mật khẩu 8 ký tự dễ đọc, bỏ ký tự dễ nhầm (O/0, l/1)
  const bang = "abcdefghijkmnpqrstuvwxyz23456789";
  const matKhau = [...randomBytes(8)]
    .map((b) => bang[b % bang.length])
    .join("");

  const passwordHash = await hashPassword(matKhau);
  try {
    // Hồ sơ + tài khoản tạo cùng một giao dịch: trùng tên đăng nhập thì không để
    // lại hồ sơ mồ côi không có tài khoản. Chỉ dùng tx.* trong callback (SQLite
    // một kết nối).
    await prisma.$transaction(
      async (tx) => {
        const member = await tx.member.create({
          data: {
            code,
            slug,
            company: hoSo.company,
            name: hoSo.name,
            position: hoSo.position,
            industry: hoSo.industry,
            phone,
            email: hoSo.email,
            address: hoSo.address,
            website: hoSo.website,
            memberType: "Hội viên",
            note: hoSo.referrer ? `Người giới thiệu: ${hoSo.referrer}` : null,
            searchText: normalizeSearch(
              [code, hoSo.name, hoSo.company, hoSo.industry, phone, hoSo.email]
                .filter(Boolean)
                .join(" "),
            ),
          },
        });

        await tx.user.create({
          data: {
            username,
            name: hoSo.name,
            role: "MEMBER",
            memberId: member.id,
            passwordHash,
          },
        });
      },
      { maxWait: 10_000, timeout: 30_000 },
    );
  } catch (e) {
    if (laLoiTrungKhoa(e)) {
      return {
        error: `Mã ${code} hoặc tên đăng nhập vừa bị trùng (có thể người khác cũng đang kết nạp) — bấm kết nạp lại một lần nữa.`,
      };
    }
    return { error: "Chưa kết nạp được — vui lòng thử lại sau ít phút." };
  }

  await prisma.membershipApplication.update({
    where: { id },
    data: {
      status: "DA_DUYET",
      handledNote: `Đã kết nạp thành hội viên ${code}, tài khoản ${username} (${new Date().toLocaleDateString("vi-VN")})`,
    },
  });

  revalidatePath("/quan-tri/noi-dung/dang-ky");
  revalidatePath("/quan-tri/hoi-vien");
  revalidatePath("/doanh-nghiep");

  return {
    ok: true,
    message: `Đã kết nạp ${hoSo.company} thành hội viên ${code}. Tài khoản: ${username} — Mật khẩu: ${matKhau} (chỉ hiện một lần, chép lại và gửi cho hội viên).${phone && laSoDienThoaiVN(phone) ? " Hội viên cũng đăng nhập được bằng số điện thoại đã đăng ký thay cho tên đăng nhập." : ""}`,
  };
}

/** Đánh dấu một tin nhắn liên hệ là đã xử lý. */
export async function danhDauDaXuLy(
  _prev: KetQua,
  fd: FormData,
): Promise<KetQua> {
  const q = await canQuyen(QUYEN.BIEU_MAU_XU_LY);
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const hienTai = await prisma.contactMessage.findUnique({
    where: { id },
    select: { handled: true },
  });
  if (!hienTai) return { error: "Không tìm thấy tin nhắn" };

  await prisma.contactMessage.update({
    where: { id },
    data: { handled: !hienTai.handled },
  });

  revalidatePath("/quan-tri/noi-dung/dang-ky");
  return { ok: true };
}
