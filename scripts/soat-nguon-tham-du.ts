import { prisma } from "../src/lib/prisma";

/**
 * Xem hệ thống đang có bao nhiêu bản ghi tham dự sự kiện từ mỗi nguồn — để
 * biết chỉ số "Hoạt động" có thể lấy thêm từ đâu ngoài check-in qua app.
 *
 * Chạy: npx tsx scripts/soat-nguon-tham-du.ts
 */
async function main() {
  const [checkin, ghiDanh, thuKyNhap, thuKyNhapCoMember, dangKyWeb, banToChuc, taiTro] =
    await Promise.all([
      prisma.thamDuSuKien.count({ where: { trangThai: "DA_CHECKIN" } }),
      prisma.thamDuSuKien.count(),
      prisma.nguoiThamDu.count(),
      prisma.nguoiThamDu.count({ where: { memberId: { not: null } } }),
      prisma.eventRegistration.count(),
      prisma.banToChuc.count(),
      prisma.taiTroSuKien.count(),
    ]);

  const coMat = checkin + thuKyNhapCoMember;

  console.log("— Nguồn dữ liệu tham dự / đóng góp trong hệ thống —\n");
  console.log(`  ThamDuSuKien (ghi danh qua app)      ${String(ghiDanh).padStart(6)}`);
  console.log(`     trong đó đã check-in QR           ${String(checkin).padStart(6)}  ← TÍNH vào chỉ số Hoạt động`);
  console.log(`  NguoiThamDu (Ban Thư ký nhập tay)    ${String(thuKyNhap).padStart(6)}`);
  console.log(`     trong đó gắn được vào hội viên    ${String(thuKyNhapCoMember).padStart(6)}  ← TÍNH vào chỉ số Hoạt động`);
  console.log(`  EventRegistration (khách đăng ký web)${String(dangKyWeb).padStart(6)}`);
  console.log(`  BanToChuc (vai trò trong BTC)        ${String(banToChuc).padStart(6)}`);
  console.log(`  TaiTroSuKien (tài trợ)               ${String(taiTro).padStart(6)}`);

  if (coMat === 0) {
    console.log(
      `\n→ Chưa có lượt có mặt nào. Muốn chỉ số Hoạt động phản ánh đúng thực tế thì\n` +
        `  Ban Thư ký cần nhập danh sách tham dự sau mỗi sự kiện.`
    );
  } else {
    console.log(
      `\n→ ${coMat} lượt có mặt đang được tính điểm (${checkin} tự quét QR + ${thuKyNhapCoMember} thư ký nhập).\n` +
        `  Một sự kiện có cả hai nguồn chỉ được tính MỘT lần — xem ghi chú trong\n` +
        `  src/lib/diem-hoat-dong.ts. Hội viên chưa gắn được vào hồ sơ thì không tính.`
    );
  }
}

main().finally(() => prisma.$disconnect());
