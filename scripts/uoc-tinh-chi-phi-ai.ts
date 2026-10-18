import { dungNguCanh, LOI_HE_THONG, MODEL } from "../src/lib/hoi-ai";
import { prisma } from "../src/lib/prisma";

/**
 * Ước tính chi phí mỗi câu hỏi gửi cho trợ lý AI, để Ban Chủ nhiệm biết đường
 * đặt hạn mức chi tiêu trong bảng điều khiển Anthropic.
 *
 * KHÔNG gọi API thật (không tốn tiền) — chỉ dựng đúng phần dữ liệu sẽ gửi đi
 * rồi quy đổi ra token theo tỉ lệ ~3,2 ký tự / token cho tiếng Việt có dấu.
 * Chạy: npx tsx scripts/uoc-tinh-chi-phi-ai.ts
 */

const KY_TU_MOI_TOKEN = 3.2;
const GIA_VAO = 5 / 1_000_000; // USD mỗi token đầu vào (Claude Opus 5)
const GIA_RA = 25 / 1_000_000; // USD mỗi token đầu ra
const TY_GIA = 26_000;

const CAU_HOI_MAU = [
  "Ai trong Chi hội đang làm logistics?",
  "Chi hội có bao nhiêu hội viên ngành xây dựng?",
  "Sự kiện sắp tới của Chi hội là gì?",
  "Tìm giúp tôi doanh nghiệp cung cấp bao bì giấy",
];

async function main() {
  const heThong = Math.round(LOI_HE_THONG.length / KY_TU_MOI_TOKEN);
  console.log("Model:", MODEL);
  console.log("Lời hệ thống:", heThong.toLocaleString("vi-VN"), "token (được lưu đệm, lần sau rẻ hơn nhiều)\n");

  let tongVao = 0;
  for (const ch of CAU_HOI_MAU) {
    const { vanBan, nguon } = await dungNguCanh(ch);
    const nguCanh = Math.round(vanBan.length / KY_TU_MOI_TOKEN);
    tongVao += heThong + nguCanh;
    console.log(`"${ch}"`);
    console.log(`   ngữ cảnh tra được: ${nguCanh.toLocaleString("vi-VN")} token · ${nguon.length} nguồn`);
  }

  const trungBinhVao = Math.round(tongVao / CAU_HOI_MAU.length);
  const traLoiRa = 500; // câu trả lời tiếng Việt thường 350–650 token

  const usd = trungBinhVao * GIA_VAO + traLoiRa * GIA_RA;
  const vnd = Math.round(usd * TY_GIA);

  console.log("\n— Trung bình mỗi câu hỏi —");
  console.log("Đầu vào:", trungBinhVao.toLocaleString("vi-VN"), "token");
  console.log("Đầu ra (ước):", traLoiRa, "token");
  console.log(`Chi phí: ${usd.toFixed(4)} USD ≈ ${vnd.toLocaleString("vi-VN")} đ/câu`);
  console.log(`100 câu/ngày ≈ ${(vnd * 100).toLocaleString("vi-VN")} đ/ngày ≈ ${(vnd * 100 * 30).toLocaleString("vi-VN")} đ/tháng`);
  console.log("\n(Chưa trừ phần tiết kiệm nhờ bộ nhớ đệm — thực tế rẻ hơn con số này.)");
}

main().finally(() => prisma.$disconnect());
