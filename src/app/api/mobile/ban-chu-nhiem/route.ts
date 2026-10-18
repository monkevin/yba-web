import { prisma } from "@/lib/prisma";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Nhân sự Ban Chủ nhiệm và các ban — cùng dữ liệu với /ban-chap-hanh trên web.
 * GET /api/mobile/ban-chu-nhiem
 *
 * Trả về theo NHÓM để Mini App khỏi phải tự gom. Thứ tự nhóm cố định ở
 * `THU_TU_NHOM` chứ không sắp theo bảng chữ cái — Ban Chủ nhiệm phải đứng đầu.
 *
 * Người kiêm nhiệm (Phó Chủ nhiệm kiêm Trưởng ban) có HAI bản ghi trong CSDL;
 * giống trang web, chỉ hiện ảnh ở nhóm đầu tiên gặp, xuống ban của họ chỉ còn
 * dòng chữ — tránh cùng một khuôn mặt lặp hai lần trên màn hình điện thoại.
 */

const THU_TU_NHOM = [
  ["BAN_CHU_NHIEM", "Ban Chủ nhiệm"],
  ["BAN_CO_VAN", "Ban Cố vấn"],
  ["BAN_HOI_VIEN", "Ban Hội viên"],
  ["BAN_XTTM", "Ban Xúc tiến thương mại"],
  ["BAN_DOI_NGOAI", "Ban Đối ngoại"],
  ["BAN_TRUYEN_THONG", "Ban Truyền thông"],
  ["BAN_SU_KIEN", "Ban Sự kiện"],
  ["BAN_DAO_TAO", "Ban Đào tạo"],
  ["BAN_TAI_TRO", "Ban Tài trợ"],
] as const;

export async function GET() {
  const ds = await prisma.leader.findMany({
    where: { active: true },
    orderBy: [{ order: "asc" }, { name: "asc" }],
    select: {
      slug: true,
      name: true,
      title: true,
      position: true,
      company: true,
      photo: true,
      bio: true,
      group: true,
      term: true,
      memberSlug: true,
      nhanHen: true,
    },
  });

  const daHienAnh = new Set<string>();
  const nhom = THU_TU_NHOM.map(([ma, ten]) => ({
    ma,
    ten,
    nguoi: ds
      .filter((n) => n.group === ma)
      .map((n) => {
        const lanDau = !daHienAnh.has(n.name);
        daHienAnh.add(n.name);
        return { ...n, hienAnh: lanDau };
      }),
  })).filter((n) => n.nguoi.length > 0);

  // Nhóm lạ chưa khai trong THU_TU_NHOM thì gom vào cuối, đừng để rơi mất người
  const maDaBiet = new Set(THU_TU_NHOM.map(([ma]) => ma));
  const conLai = ds.filter((n) => !maDaBiet.has(n.group as never));
  if (conLai.length) {
    nhom.push({
      ma: "KHAC" as never,
      ten: "Các ban khác" as never,
      nguoi: conLai.map((n) => {
        const lanDau = !daHienAnh.has(n.name);
        daHienAnh.add(n.name);
        return { ...n, hienAnh: lanDau };
      }),
    });
  }

  return moJson({ tong: ds.length, nhom });
}
