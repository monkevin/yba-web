/**
 * Nạp danh sách KHÁCH MỜI Lễ chuyển giao 10/10 từ file Excel của BTC
 * ("DANH SACH THU MOI 10-10-2026 (kem ten file).xlsx" — 315 khách, 10 nhóm).
 *
 * Mỗi khách được sinh mã thư mời CL-XXXXX (link /1010/moi/<mã>).
 * Cột "CHỨC DANH IN TRÊN THƯ" là các dòng in trên thiệp nối bằng " / " —
 * dòng viết HOA TOÀN BỘ là tên đơn vị (có thể bị bẻ đôi cho vừa thiệp),
 * dòng thường là chức danh. Tách lại: chức danh nối " · ", đơn vị nối " ".
 *
 * Trùng lặp: cùng tên + cùng SĐT chỉ giữ bản đầu (một người một thiệp xác
 * nhận); cùng tên khác đơn vị (thư tập thể "Ban Điều Hành"…) giữ hết.
 * Chạy lại an toàn — khách đã có thì bỏ qua, không sinh mã mới.
 *
 *   Xem trước :  npx tsx scripts/nhap-khach-moi-1010.ts "<đường dẫn xlsx>"
 *   Ghi thật  :  npx tsx scripts/nhap-khach-moi-1010.ts "<đường dẫn xlsx>" --ghi
 *   Máy chủ   :  sudo docker compose cp danh-sach.xlsx web:/tmp/ds.xlsx
 *                sudo docker compose exec web npx tsx scripts/nhap-khach-moi-1010.ts /tmp/ds.xlsx --ghi
 */
import crypto from "crypto";
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";

const GHI = process.argv.includes("--ghi");
const DUONG_DAN =
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
  "E:/Claude 07 2026 Mon Amie AI/Đại hội BDH Chợ lớn/_THU MOI CA NHAN LE CHUYEN GIAO 10-10/DANH SACH THU MOI 10-10-2026 (kem ten file).xlsx";

function sinhMa(): string {
  const bo = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return "CL-" + Array.from(crypto.randomBytes(5), (b) => bo[b % bo.length]).join("");
}
async function maChuaTrung(): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const ma = sinhMa();
    if (!(await prisma.khachMoi1010.findUnique({ where: { ma } }))) return ma;
  }
  throw new Error("Không sinh được mã");
}

/** "Chủ tịch HĐQT / CTY CP ABC / VÀ XYZ" -> { chucDanh, donVi } */
function tachChucDanh(tho: string): { chucDanh: string | null; donVi: string | null } {
  const doan = tho.split(" / ").map((d) => d.trim()).filter(Boolean);
  const laHoa = (d: string) =>
    /\p{L}/u.test(d) && d === d.toLocaleUpperCase("vi");
  const chuc = doan.filter((d) => !laHoa(d));
  const donVi = doan.filter(laHoa);
  return {
    chucDanh: chuc.join(" · ") || null,
    donVi: donVi.join(" ") || null,
  };
}

async function main() {
  console.log(GHI ? "== CHẠY THẬT (--ghi) ==" : "== XEM TRƯỚC — thêm --ghi để ghi thật ==");
  console.log("File:", DUONG_DAN);

  const wb = XLSX.readFile(DUONG_DAN);
  const ws = wb.Sheets["DANH SACH THU MOI"];
  if (!ws) throw new Error('Không thấy sheet "DANH SACH THU MOI"');
  const dong: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  let them = 0, trung = 0, loi = 0;
  const daThayTrongFile = new Set<string>();

  for (const r of dong.slice(1)) {
    const o = (i: number) => String(r[i] ?? "").trim();
    const soThu = o(0), nhom = o(1), danhXung = o(3), ten = o(4);
    const chucDanhTho = o(6), sdt = o(11).replace(/[^\d+]/g, ""), phuTrach = o(12), ghiChuXuLy = o(14);
    if (!ten || ten.length < 2) { if (soThu) loi++; continue; }

    let { chucDanh, donVi } = tachChucDanh(chucDanhTho);
    // Thư TẬP THỂ ("Ban Điều Hành" các chi hội…) không có cột chức danh —
    // đơn vị nằm trong "DÒNG TÊN IN TRÊN THƯ": "Các Anh/Chị BAN ĐIỀU HÀNH /
    // YBA CHỢ LỚN" → đơn vị = phần sau tên tập thể.
    if (!chucDanhTho) {
      const tenInThu = o(5).replace(/^Các Anh\/Chị\s*/i, "");
      const doan = tenInThu.split(" / ").map((d) => d.trim()).filter(Boolean);
      donVi = doan.slice(1).join(" ") || donVi;
    }
    const khoa = `${ten.toLocaleLowerCase("vi")}|${sdt || donVi?.toLocaleLowerCase("vi") || ""}`;
    if (daThayTrongFile.has(khoa)) { trung++; console.log(`   (trùng trong file) #${soThu} ${ten}`); continue; }
    daThayTrongFile.add(khoa);

    const daCo = await prisma.khachMoi1010.findFirst({
      where: sdt ? { ten, phone: sdt } : { ten, donVi },
    });
    if (daCo) {
      trung++;
      // Khách đã nạp đợt trước: bổ sung số thư (tên file thiệp JPG) nếu thiếu
      if (GHI && !daCo.soThu) {
        await prisma.khachMoi1010.update({
          where: { id: daCo.id },
          data: { soThu },
        });
      }
      continue;
    }

    them++;
    if (them <= 8) console.log(`   + #${soThu} [${nhom}] ${danhXung} ${ten} · ${chucDanh ?? ""} · ${donVi ?? ""} · ${sdt}`);
    if (them === 9) console.log("   … (các dòng sau không in nữa)");
    if (GHI) {
      await prisma.khachMoi1010.create({
        data: {
          ma: await maChuaTrung(),
          ten,
          danhXung: danhXung || null,
          chucDanh,
          donVi,
          phone: sdt || null,
          nhom: nhom || "KHACH_MOI",
          soThu,
          ghiChuBTC:
            [`Thư #${soThu}`, phuTrach && `Phụ trách: ${phuTrach}`, ghiChuXuLy]
              .filter(Boolean)
              .join(" · ") || null,
        },
      });
    }
  }

  console.log(`\nKết quả: thêm ${them} · bỏ qua trùng ${trung} · dòng lỗi ${loi}`);
  if (!GHI) console.log('Chạy lại kèm "--ghi" để ghi thật.');
  else console.log("Vào /quan-tri/khach-moi-1010 để xem danh sách và chép link gửi khách.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
