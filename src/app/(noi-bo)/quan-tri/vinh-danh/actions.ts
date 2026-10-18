"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { QUYEN, co } from "@/lib/quyen";
import { formatShortVnd } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { uniqueSlug } from "@/lib/slug";
import { topBuyers, topReferrers, topSellers } from "@/lib/stats";
import { HANG_MUC } from "@/lib/vinh-danh";

export type KetQua = { error?: string; ok?: boolean; message?: string };

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

async function banChuNhiem() {
  const user = await requireUser();
  if (!co(user, QUYEN.VINH_DANH_QUAN_LY)) {
    return { error: "Không có quyền quản lý vinh danh" as const };
  }
  return { user };
}

/** Tạo một kỳ vinh danh mới. */
export async function taoKy(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  const ten = chuoi(fd, "name");
  const tu = chuoi(fd, "from");
  const den = chuoi(fd, "to");
  if (!ten) return { error: "Đặt tên kỳ vinh danh, ví dụ “Quý III/2026”" };
  if (!tu || !den) return { error: "Chọn khoảng thời gian của kỳ" };

  const from = new Date(tu);
  const to = new Date(`${den}T23:59:59`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return { error: "Ngày không hợp lệ" };
  }
  if (from > to) return { error: "Ngày bắt đầu phải trước ngày kết thúc" };

  const slug = await uniqueSlug(
    ten,
    async (s) =>
      !!(await prisma.awardPeriod.findUnique({
        where: { slug: s },
        select: { id: true },
      })),
    "ky-vinh-danh"
  );

  await prisma.awardPeriod.create({
    data: { name: ten, slug, from, to, note: chuoi(fd, "note") || null },
  });

  revalidatePath("/quan-tri/vinh-danh");
  return { ok: true, message: `Đã tạo kỳ “${ten}”. Bấm “Đề xuất từ số liệu” để lấy danh sách.` };
}

/**
 * Sinh danh sách vinh danh từ chính số liệu giao thương của kỳ: top 3 mỗi hạng
 * mục. Ban Chủ nhiệm vẫn sửa / xoá / thêm tay được sau đó.
 */
export async function deXuatTuSoLieu(
  _prev: KetQua,
  fd: FormData
): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  const periodId = chuoi(fd, "periodId");
  const ky = await prisma.awardPeriod.findUnique({ where: { id: periodId } });
  if (!ky) return { error: "Không tìm thấy kỳ vinh danh" };

  const period = {
    key: ky.slug,
    label: ky.name,
    from: ky.from,
    to: ky.to,
  };

  const [ban, mua, ketNoi] = await Promise.all([
    topSellers(period, 3),
    topBuyers(period, 3),
    topReferrers(period, 3),
  ]);

  if (!ban.length && !mua.length && !ketNoi.length) {
    return {
      error:
        "Kỳ này chưa có giao dịch nào được duyệt nên chưa đề xuất được. Kiểm tra lại khoảng thời gian.",
    };
  }

  // Xoá đề xuất cũ của ba hạng mục tự động, giữ nguyên hạng mục Ban Chủ nhiệm tự thêm
  await prisma.award.deleteMany({
    where: {
      periodId,
      category: { in: [HANG_MUC.BAN_RA, HANG_MUC.MUA_VAO, HANG_MUC.KET_NOI] },
    },
  });

  const dong = [
    ...ban.map((r, i) => ({
      periodId,
      memberId: r.memberId,
      category: HANG_MUC.BAN_RA,
      rank: i + 1,
      metric: `${formatShortVnd(r.total)} ₫ · ${r.count} giao dịch · ${r.partners} đối tác`,
    })),
    ...mua.map((r, i) => ({
      periodId,
      memberId: r.memberId,
      category: HANG_MUC.MUA_VAO,
      rank: i + 1,
      metric: `${formatShortVnd(r.total)} ₫ · ${r.count} giao dịch · ${r.partners} đối tác`,
    })),
    ...ketNoi.map((r, i) => ({
      periodId,
      memberId: r.memberId,
      category: HANG_MUC.KET_NOI,
      rank: i + 1,
      metric: `${formatShortVnd(r.total)} ₫ đã kết nối · ${r.count} giao dịch`,
    })),
  ];

  await prisma.award.createMany({ data: dong });

  revalidatePath("/quan-tri/vinh-danh");
  revalidatePath("/vinh-danh");
  return { ok: true, message: `Đã đề xuất ${dong.length} lượt vinh danh từ số liệu` };
}

/** Thêm một lượt vinh danh thủ công. */
export async function themVinhDanh(
  _prev: KetQua,
  fd: FormData
): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  const periodId = chuoi(fd, "periodId");
  const memberId = chuoi(fd, "memberId");
  const category = chuoi(fd, "category");
  if (!memberId) return { error: "Chọn hội viên" };
  if (!category) return { error: "Nhập hạng mục vinh danh" };

  await prisma.award.create({
    data: {
      periodId,
      memberId,
      category,
      rank: Number(chuoi(fd, "rank")) || 0,
      metric: chuoi(fd, "metric") || null,
      note: chuoi(fd, "note") || null,
    },
  });

  revalidatePath("/quan-tri/vinh-danh");
  revalidatePath("/vinh-danh");
  return { ok: true, message: "Đã thêm vào bảng vinh danh" };
}

/** Xoá một lượt vinh danh. */
export async function xoaVinhDanh(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await banChuNhiem();
  if ("error" in q) return { error: q.error };

  await prisma.award.delete({ where: { id: chuoi(fd, "id") } });
  revalidatePath("/quan-tri/vinh-danh");
  revalidatePath("/vinh-danh");
  return { ok: true, message: "Đã xoá" };
}

/** Công bố / thu hồi một kỳ vinh danh khỏi trang công khai. */
export async function doiCongBo(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await requireUser();
  if (!co(user, QUYEN.VINH_DANH_QUAN_LY)) {
    return { error: "Không có quyền công bố kỳ vinh danh" };
  }

  const id = chuoi(fd, "id");
  const ky = await prisma.awardPeriod.findUnique({
    where: { id },
    select: { published: true, _count: { select: { awards: true } } },
  });
  if (!ky) return { error: "Không tìm thấy kỳ" };
  if (!ky.published && ky._count.awards === 0) {
    return { error: "Kỳ chưa có ai được vinh danh — thêm người trước khi công bố" };
  }

  await prisma.awardPeriod.update({
    where: { id },
    data: { published: !ky.published },
  });

  revalidatePath("/quan-tri/vinh-danh");
  revalidatePath("/vinh-danh");
  return {
    ok: true,
    message: ky.published ? "Đã thu hồi khỏi trang công khai" : "Đã công bố",
  };
}

/** Xoá hẳn một kỳ vinh danh cùng toàn bộ lượt vinh danh trong đó. */
export async function xoaKy(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const user = await requireUser();
  if (!co(user, QUYEN.VINH_DANH_QUAN_LY)) return { error: "Không có quyền xoá kỳ" };

  await prisma.awardPeriod.delete({ where: { id: chuoi(fd, "id") } });
  revalidatePath("/quan-tri/vinh-danh");
  revalidatePath("/vinh-danh");
  return { ok: true, message: "Đã xoá kỳ vinh danh" };
}
