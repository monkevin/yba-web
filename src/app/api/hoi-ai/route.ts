/**
 * Trợ lý AI của Chi hội — nhận câu hỏi, tra cơ sở dữ liệu, gọi Claude trả lời.
 *
 * Đây là điểm gọi API TÍNH TIỀN và mở công khai, nên phải tự bảo vệ:
 *  - giới hạn số câu mỗi máy mỗi ngày (`GIOI_HAN_NGAY`)
 *  - chặn câu hỏi quá dài
 *  - chỉ trả lời dựa trên dữ liệu tra được, không để mô hình tự nhớ
 *  - lưu lại câu hỏi để Ban Chủ nhiệm xem người ta quan tâm gì
 *
 * Khoá API đọc từ biến môi trường `ANTHROPIC_API_KEY`. Chưa có khoá thì trả về
 * thông báo rõ ràng chứ không đổ lỗi 500.
 */
import Anthropic from "@anthropic-ai/sdk";
import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { DAI_TOI_DA, GIOI_HAN_NGAY, LOI_HE_THONG, MODEL, dungNguCanh } from "@/lib/hoi-ai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
/** Câu trả lời phụ thuộc dữ liệu và người hỏi — không được lưu bộ đệm. */
export const dynamic = "force-dynamic";

/**
 * Băm địa chỉ IP để đếm lượt mà không lưu IP thật vào cơ sở dữ liệu.
 * Trộn thêm SESSION_SECRET để không dò ngược ra IP từ bảng dữ liệu.
 */
function dauMayTu(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "khong-ro";
  return createHash("sha256")
    .update(ip + (process.env.SESSION_SECRET ?? ""))
    .digest("hex")
    .slice(0, 32);
}

export async function POST(req: Request) {
  let cauHoi = "";
  try {
    const body = await req.json();
    cauHoi = String(body?.cauHoi ?? "").trim();
  } catch {
    return NextResponse.json({ loi: "Dữ liệu gửi lên không hợp lệ." }, { status: 400 });
  }

  if (cauHoi.length < 3) {
    return NextResponse.json({ loi: "Câu hỏi quá ngắn." }, { status: 400 });
  }
  if (cauHoi.length > DAI_TOI_DA) {
    return NextResponse.json(
      { loi: `Câu hỏi dài quá ${DAI_TOI_DA} ký tự. Anh/chị viết ngắn lại giúp.` },
      { status: 400 }
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        loi:
          "Trợ lý AI chưa được bật. Ban Chủ nhiệm cần thêm khoá ANTHROPIC_API_KEY " +
          "vào cấu hình máy chủ. Trong lúc chờ, anh/chị dùng ô tìm kiếm hoặc gọi văn phòng Chi hội.",
        chuaBat: true,
      },
      { status: 503 }
    );
  }

  const dauMay = dauMayTu(req);
  const user = await getCurrentUser();

  // Hội viên đã đăng nhập thì không tính vào hạn mức khách vãng lai
  if (!user) {
    const tuHomQua = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const daHoi = await prisma.cauHoiAI.count({
      where: { dauMay, createdAt: { gte: tuHomQua } },
    });
    if (daHoi >= GIOI_HAN_NGAY) {
      return NextResponse.json(
        {
          loi: `Anh/chị đã hỏi ${GIOI_HAN_NGAY} câu trong 24 giờ qua — mức tối đa cho khách. Đăng nhập tài khoản hội viên để hỏi tiếp, hoặc quay lại sau.`,
        },
        { status: 429 }
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
        {
          type: "text",
          text: LOI_HE_THONG,
          // Lời hệ thống không đổi giữa các lượt hỏi nên đệm lại cho rẻ
          cache_control: { type: "ephemeral" },
        },
      ],
      thinking: { type: "adaptive" },
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content: `DỮ LIỆU TRA ĐƯỢC TỪ WEBSITE (lúc ${new Date().toLocaleString("vi-VN")}):\n\n${vanBan}\n\n---\n\nCÂU HỎI CỦA NGƯỜI XEM: ${cauHoi}`,
        },
      ],
    });

    if (res.stop_reason === "refusal") {
      return NextResponse.json(
        { loi: "Câu hỏi này trợ lý không trả lời được. Anh/chị hỏi về hoạt động của Chi hội giúp." },
        { status: 200 }
      );
    }

    const traLoi = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    if (!traLoi) {
      return NextResponse.json(
        { loi: "Trợ lý chưa soạn được câu trả lời. Anh/chị thử hỏi lại bằng cách khác giúp." },
        { status: 200 }
      );
    }

    const luu = await prisma.cauHoiAI.create({
      data: {
        cauHoi,
        traLoi,
        dauMay,
        memberId: user?.memberId ?? null,
        soNguon: nguon.length,
      },
      select: { id: true },
    });

    return NextResponse.json({ id: luu.id, traLoi, nguon });
  } catch (e) {
    console.error("[hoi-ai]", e);
    // Không đẩy chi tiết lỗi ra ngoài — chỉ nói được hay không được
    return NextResponse.json(
      { loi: "Trợ lý đang bận. Anh/chị thử lại sau ít phút giúp." },
      { status: 502 }
    );
  }
}
