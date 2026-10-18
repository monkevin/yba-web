import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { DAI_TOI_DA, GIOI_HAN_NGAY, LOI_HE_THONG, MODEL, dungNguCanh } from "@/lib/hoi-ai";
import { prisma } from "@/lib/prisma";
import { docHoiVien } from "@/lib/mobile-auth";
import { moJson, moOptions } from "@/lib/mobile-cors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const OPTIONS = moOptions;

/**
 * Trợ lý AI cho Zalo Mini App — dùng chung phần tra dữ liệu và lời hệ thống
 * với `/api/hoi-ai` của website, chỉ khác cách xác thực (phiên Mini App thay
 * vì cookie web) và có header CORS.
 *
 * POST /api/mobile/hoi-ai  { cauHoi }
 */
export async function POST(req: Request) {
  let cauHoi = "";
  try {
    const body = await req.json();
    cauHoi = String(body?.cauHoi ?? "").trim();
  } catch {
    return moJson({ loi: "Dữ liệu gửi lên không hợp lệ." }, 400);
  }

  if (cauHoi.length < 3) return moJson({ loi: "Câu hỏi quá ngắn." }, 400);
  if (cauHoi.length > DAI_TOI_DA) {
    return moJson(
      { loi: `Câu hỏi dài quá ${DAI_TOI_DA} ký tự. Anh/chị viết ngắn lại giúp.` },
      400
    );
  }

  // Chưa cấu hình khoá thì báo bằng lời người dùng hiểu được — KHÔNG nhắc tên
  // biến môi trường: câu này hiện thẳng trong Mini App cho hội viên (và cho
  // đội kiểm duyệt Zalo) đọc, lộ chi tiết kỹ thuật ra là trông như app hỏng.
  if (!process.env.ANTHROPIC_API_KEY) {
    return moJson(
      {
        loi:
          "Trợ lý Chi hội đang tạm nghỉ để nâng cấp. Anh/chị dùng ô tìm kiếm ở " +
          "Danh bạ để tra doanh nghiệp, hoặc liên hệ Ban Thư ký giúp.",
        chuaBat: true,
      },
      503
    );
  }

  const member = await docHoiVien(req);

  // Đếm theo mã hội viên; khách chưa xác thực đếm chung một mức chặt hơn
  const dauMay = createHash("sha256")
    .update((member?.id ?? "khach-mini-app") + (process.env.SESSION_SECRET ?? ""))
    .digest("hex")
    .slice(0, 32);

  if (!member) {
    const tuHomQua = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const daHoi = await prisma.cauHoiAI.count({
      where: { dauMay, createdAt: { gte: tuHomQua } },
    });
    if (daHoi >= GIOI_HAN_NGAY) {
      return moJson(
        {
          loi: `Đã hỏi ${GIOI_HAN_NGAY} câu trong 24 giờ qua. Xác thực hội viên bằng Zalo để hỏi tiếp.`,
        },
        429
      );
    }
  }

  const { vanBan, nguon } = await dungNguCanh(cauHoi);

  try {
    const client = new Anthropic();
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 1600,
      system: [
        { type: "text", text: LOI_HE_THONG, cache_control: { type: "ephemeral" } },
      ],
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `DỮ LIỆU TRA ĐƯỢC TỪ HỆ THỐNG (lúc ${new Date().toLocaleString("vi-VN")}):\n\n${vanBan}\n\n---\n\nCÂU HỎI CỦA HỘI VIÊN: ${cauHoi}`,
        },
      ],
    });

    if (res.stop_reason === "refusal") {
      return moJson({
        loi: "Câu hỏi này trợ lý không trả lời được. Anh/chị hỏi về hoạt động của Chi hội giúp.",
      });
    }

    const traLoi = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!traLoi) {
      return moJson({
        loi: "Trợ lý chưa soạn được câu trả lời. Anh/chị thử hỏi lại bằng cách khác giúp.",
      });
    }

    await prisma.cauHoiAI.create({
      data: {
        cauHoi,
        traLoi,
        dauMay,
        memberId: member?.id ?? null,
        soNguon: nguon.length,
      },
    });

    return moJson({ traLoi, soNguon: nguon.length });
  } catch (e) {
    return moJson(
      { loi: "Trợ lý đang bận. Anh/chị thử lại sau ít phút giúp.", chiTiet: String(e).slice(0, 200) },
      502
    );
  }
}
