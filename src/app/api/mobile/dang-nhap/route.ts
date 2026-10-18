import { doiTokenLaySoDienThoai, taoPhien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

export const OPTIONS = moOptions;

/**
 * Đăng nhập Mini App bằng số điện thoại chính chủ của Zalo.
 * POST /api/mobile/dang-nhap  { tokenSdt, accessToken }
 *
 * SĐT không khớp hội viên nào vẫn tạo phiên (`member: null`) — người đó xem
 * được khu công khai, và Ban Chủ nhiệm biết có ai đang quan tâm để mời vào Hội.
 */
export async function POST(req: Request) {
  let than: { tokenSdt?: string; accessToken?: string };
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  if (!than.tokenSdt || !than.accessToken) {
    return moJson({ error: "Thiếu tokenSdt hoặc accessToken" }, 400);
  }

  let phone: string;
  try {
    phone = await doiTokenLaySoDienThoai(than.tokenSdt, than.accessToken);
  } catch (e) {
    return moJson({ error: (e as Error).message }, 502);
  }

  const { token, memberId } = await taoPhien(phone);

  const member = memberId
    ? await prisma.member.findUnique({
        where: { id: memberId },
        select: {
          code: true,
          slug: true,
          name: true,
          salutation: true,
          company: true,
          position: true,
          hoiRole: true,
          memberType: true,
          avatar: true,
          logo: true,
          category: { select: { name: true, icon: true } },
        },
      })
    : null;

  return moJson({
    phien: token,
    laHoiVien: !!member,
    member: member ? { ...member, company: tenDoanhNghiep(member.company) } : null,
  });
}
