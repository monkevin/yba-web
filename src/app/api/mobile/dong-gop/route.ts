import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";
import {
  MO_TA_CHI_SO,
  TEN_CHI_SO,
  thongKeHoiVien,
  tongDiem,
} from "@/lib/diem-hoat-dong";

export const OPTIONS = moOptions;

/**
 * Dashboard đóng góp của chính hội viên (mục 7 + 8 trong đặc tả).
 * GET /api/mobile/dong-gop?nam=2026
 */
export async function GET(req: Request) {
  const member = await docHoiVien(req);
  if (!member) return moJson({ error: "Cần xác thực hội viên" }, 401);

  const nam =
    Number(new URL(req.url).searchParams.get("nam")) || new Date().getFullYear();

  const tk = await thongKeHoiVien(member.id, nam);

  return moJson({
    ...tk,
    tong: tongDiem(tk.diem),
    tenChiSo: TEN_CHI_SO,
    moTaChiSo: MO_TA_CHI_SO,
    member: { code: member.code, name: member.name, company: member.company },
  });
}
