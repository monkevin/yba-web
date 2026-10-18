import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const OPTIONS = moOptions;

/**
 * Danh sách Ban Chủ nhiệm nhận đặt lịch gặp (mục 13).
 * GET /api/mobile/dat-lich
 */
export async function GET(req: Request) {
  const member = await docHoiVien(req);

  const [nguoi, cuaToi] = await Promise.all([
    prisma.leader.findMany({
      where: { active: true, nhanHen: true },
      orderBy: [{ order: "asc" }, { name: "asc" }],
      select: {
        id: true,
        slug: true,
        name: true,
        title: true,
        position: true,
        company: true,
        photo: true,
        group: true,
      },
    }),
    member
      ? prisma.lichHen.findMany({
          where: { memberId: member.id },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            chuDe: true,
            ngayHen: true,
            buoi: true,
            hinhThuc: true,
            status: true,
            createdAt: true,
            leader: { select: { name: true, title: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  return moJson({ nguoi, cuaToi, laHoiVien: !!member });
}

/**
 * Hội viên xin lịch gặp một thành viên Ban Chủ nhiệm.
 * POST /api/mobile/dat-lich  { leaderId, chuDe, noiDung, ngayHen, buoi, hinhThuc }
 *
 * Đơn vào trạng thái MOI, Ban Thư ký sắp lịch rồi xác nhận — Mini App không
 * tự chốt lịch thay người ta được.
 */
export async function POST(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  let than: Record<string, unknown>;
  try {
    than = await req.json();
  } catch {
    return moJson({ error: "Dữ liệu gửi lên không hợp lệ" }, 400);
  }

  const chuDe = String(than.chuDe ?? "").trim();
  if (chuDe.length < 3) return moJson({ error: "Ghi rõ chủ đề muốn trao đổi" }, 400);

  if (than.leaderId) {
    const co = await prisma.leader.count({
      where: { id: String(than.leaderId), active: true, nhanHen: true },
    });
    if (!co) return moJson({ error: "Người này hiện không nhận đặt lịch" }, 400);
  }

  const ngayHen = than.ngayHen ? new Date(String(than.ngayHen)) : null;
  if (ngayHen && Number.isNaN(ngayHen.getTime())) {
    return moJson({ error: "Ngày hẹn không hợp lệ" }, 400);
  }

  await prisma.lichHen.create({
    data: {
      leaderId: than.leaderId ? String(than.leaderId) : null,
      memberId: member.id,
      // Điền sẵn từ hồ sơ — hội viên không phải gõ lại tên, SĐT
      name: member.name,
      phone: member.phone ?? "",
      email: member.email ?? null,
      company: member.company,
      chuDe,
      noiDung: than.noiDung ? String(than.noiDung).slice(0, 1000) : null,
      ngayHen,
      buoi: than.buoi ? String(than.buoi) : null,
      hinhThuc: than.hinhThuc === "ONLINE" ? "ONLINE" : "TRUC_TIEP",
      status: "MOI",
    },
  });

  return moJson({ ok: true });
}
