/**
 * Soát tĩnh giao diện game "Ngôi nhà Chợ Lớn" theo cấu hình (nhóm giao diện):
 * chữ / số trên màn người chơi phải đọc từ luật & tính năng thay vì ghi cứng,
 * editor quản trị không dùng `<form action>` có ô nhập. Không cần CSDL, không
 * cần bật web.
 *
 *   npx tsx scripts/kiem-tra-giao-dien-game.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import {
  danhHieuTheoLuat,
  LUAT_MAC_DINH,
} from "../src/lib/ngoi-nha/cai-dat/luat-choi";
import {
  HUONG_DAN_MAC_DINH,
  chuanChiaSe,
  chuanHuongDan,
  chuanTheCoHoi,
  type CauChiaSeSua,
  type TheCoHoiSua,
} from "../src/lib/ngoi-nha/cai-dat/noi-dung-sua";
import {
  MO_TA_TINH_NANG,
  TINH_NANG_MAC_DINH,
} from "../src/lib/ngoi-nha/cai-dat/tinh-nang";

let dat = 0;
let hong = 0;
function kiem(ten: string, dung: boolean, chiTiet = "") {
  if (dung) {
    dat++;
    console.log(`  PASS  ${ten}`);
  } else {
    hong++;
    console.log(`  FAIL  ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

const doc = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const GAME = "src/app/(ngoi-nha)";
const QT = "src/app/(noi-bo)/quan-tri/ngoi-nha/_cai-dat";

console.log("── Trang người chơi đọc cấu hình ──");
{
  const layout = doc(`${GAME}/layout.tsx`);
  kiem("Layout đọc docTinhNang", layout.includes("docTinhNang()"));
  kiem(
    "Layout có màn bảo trì cho người không vận hành",
    layout.includes("tinhNang.tamDung && !vanHanh") &&
      layout.includes("thongBaoTamDung"),
  );
  kiem(
    "Layout truyền cờ cho ThanhDuoi",
    /<ThanhDuoi[\s\S]*dauTruong=\{tinhNang\.dauTruong\}[\s\S]*nhiemVu=\{tinhNang\.nhiemVu\}/.test(
      layout,
    ),
  );

  const chu = doc(`${GAME}/ngoi-nha/page.tsx`);
  kiem("Trang chủ bỏ chữ cứng “16 việc thật”", !chu.includes("16 việc thật"));
  kiem("Trang chủ bỏ chữ cứng “/5 câu”", !/\/5 câu|"5 câu/.test(chu));
  kiem(
    "Trang chủ gọi laBaiHomNay khi bật Lá bài",
    /tinhNang\.laBai\s*\?\s*await laBaiHomNay\(nguoi, mua\)/.test(chu),
  );
  kiem(
    "LaBaiMoiNgay nằm trước khối Thử thách hôm nay",
    chu.indexOf("<LaBaiMoiNgay") > 0 &&
      chu.indexOf("<LaBaiMoiNgay") < chu.indexOf("Thử thách hôm nay</span>"),
  );
  kiem(
    "HuongDan chỉ khi bật và chưa xem, nội dung từ docHuongDan",
    /tinhNang\.huongDan && !hs\.daXemHuongDan/.test(chu) &&
      chu.includes("<HuongDan buoc={huongDan.buoc}"),
  );
  kiem(
    "Trang chủ dừng sớm khi game tạm dừng",
    chu.includes("tinhNang.tamDung && !laNguoiVanHanh(user)"),
  );
  kiem(
    "Trang chủ không dùng NGUONG_CAN_BANG cứng",
    !chu.includes("NGUONG_CAN_BANG"),
  );

  const hd = doc("src/components/ngoi-nha/HuongDan.tsx");
  kiem("HuongDan không còn nội dung ghi cứng", !hd.includes("const BUOC"));

  const hs = doc(`${GAME}/ngoi-nha/ho-so/page.tsx`);
  kiem(
    "Hồ sơ không dùng DANH_HIEU / NGUONG_CAN_BANG / DIEU_KIEN_NGON_LUA cứng",
    !/\b(DANH_HIEU|NGUONG_CAN_BANG|DIEU_KIEN_NGON_LUA)\b/.test(hs),
  );
  kiem("Hồ sơ bỏ “+1.000 điểm” cứng", !hs.includes("+1.000 điểm"));
  kiem(
    "Hồ sơ có link Bộ sưu tập lá bài",
    hs.includes('href="/ngoi-nha/la-bai"'),
  );

  const xh = doc(`${GAME}/ngoi-nha/xep-hang/page.tsx`);
  kiem(
    "Xếp hạng không ghi cứng tên giải",
    !/Giải (Người bắc cầu|Người học không ngừng|Chiến binh bền bỉ|Nhà giao thương)/.test(
      xh,
    ),
  );
  kiem(
    "Nút Thách phụ thuộc nutThach và dauTruong",
    xh.includes("tinhNang.nutThach && tinhNang.dauTruong"),
  );

  const pt = doc(`${GAME}/ngoi-nha/phan-thuong/page.tsx`);
  kiem(
    "Phần thưởng có mục Quà may mắn từ Lá bài",
    pt.includes("quaLaBaiCuaToi(") && pt.includes("Quà may mắn từ Lá bài"),
  );

  const td = doc("src/components/ngoi-nha/ThanhDuoi.tsx");
  kiem(
    "ThanhDuoi khai đủ lớp lưới 3–5 cột (Tailwind nhặt được)",
    ["grid-cols-3", "grid-cols-4", "grid-cols-5"].every((c) =>
      td.includes(`"${c}"`),
    ),
  );

  const nn = doc("src/components/ngoi-nha/NgoiNha.tsx");
  kiem(
    "Tắt Nhiệm vụ thì ẩn cả tấm biển Góc Huynh đệ trên sân chợ",
    /\{nhiemVu && \(\s*<g>[\s\S]{0,1600}Góc Huynh đệ[\s\S]{0,120}<\/text>/.test(
      nn,
    ),
  );
}

console.log("── Editor quản trị ──");
for (const f of [
  "SuaTinhNang.tsx",
  "SuaLuatChoi.tsx",
  "GiaoDienSuaTheCoHoi.tsx",
  "GiaoDienSuaChiaSe.tsx",
  "GiaoDienSuaHuongDan.tsx",
  "GiaoDienChung.tsx",
]) {
  const ma = doc(`${QT}/${f}`);
  kiem(`${f}: không dùng <form action>`, !/<form[^>]*\baction=/.test(ma));
  kiem(`${f}: là client component`, ma.startsWith('"use client"'));
}
{
  const act = doc(`${QT}/actions-giao-dien.ts`);
  kiem(
    'actions-giao-dien: có "use server" ở đầu',
    act.startsWith('"use server"'),
  );
  kiem(
    "actions-giao-dien: chỉ export hàm async",
    [...act.matchAll(/^export\s+(\S+)/gm)].every((m) => m[1] === "async"),
  );
  kiem("actions-giao-dien: kiểm quyền cài đặt", act.includes("nguoiCaiDat()"));
  kiem("actions-giao-dien: ghi nhật ký", act.includes("ghiNhatKy("));
}
{
  const tn = doc(`${QT}/SuaTinhNang.tsx`);
  kiem(
    "SuaTinhNang: công tắc chính câu thưởng ở nn.thongSo",
    /muc="thongSo"[\s\S]{0,40}nhom=\{\["cauThuong"\]\}/.test(tn),
  );
  const lc = doc(`${QT}/SuaLuatChoi.tsx`);
  kiem(
    "SuaLuatChoi: khung riêng lượt tính điểm",
    /muc="thongSo"[\s\S]{0,40}nhom=\{\["luotTinhDiemToiDa"\]\}/.test(lc),
  );

  // Soạn nội dung của một tính năng đang tắt thì phải nhắc, như tab Nhiệm vụ
  const tch = doc(`${QT}/NoiDungTheCoHoi.tsx`);
  const tchUi = doc(`${QT}/GiaoDienSuaTheCoHoi.tsx`);
  kiem(
    "Thẻ Cơ hội: nhắc khi tính năng đang tắt",
    tch.includes("dangBat={tinhNang.theCoHoi}") &&
      /!dangBat && \([\s\S]{0,300}Bật \/ tắt tính năng/.test(tchUi),
  );
  const cs = doc(`${QT}/NoiDungChiaSe.tsx`);
  const csUi = doc(`${QT}/GiaoDienSuaChiaSe.tsx`);
  kiem(
    "Câu chia sẻ: nhắc khi công tắc chính hoặc công tắc con đang tắt",
    cs.includes("cauThuongBat={thongSo.cauThuong}") &&
      cs.includes("chiaSeBat={tinhNang.cauThuongChiaSe}") &&
      /!\(cauThuongBat && chiaSeBat\)/.test(csUi),
  );
}

console.log("── Hàm luật dùng cho giao diện ──");
{
  const dh = danhHieuTheoLuat(LUAT_MAC_DINH, 3000, false);
  kiem("3.000 điểm là bậc 2", dh.hienTai.bac === 2 && dh.tiepTheo?.bac === 3);
  const top = danhHieuTheoLuat(LUAT_MAC_DINH, 99_999, false);
  kiem(
    "Bậc 5 có bậc kế là Ngọn lửa (không tính bằng điểm)",
    top.hienTai.bac === 5 &&
      top.tiepTheo !== null &&
      !Number.isFinite(top.tiepTheo.tuDiem),
  );
  kiem(
    "Hướng dẫn mặc định đủ 3 bước, trống thì lấy mặc định",
    chuanHuongDan({ buoc: [{ tieuDe: "", noiDung: "" }] }).buoc[0].tieuDe ===
      HUONG_DAN_MAC_DINH.buoc[0].tieuDe && HUONG_DAN_MAC_DINH.buoc.length === 3,
  );
  kiem(
    "Mọi công tắc (trừ thông báo) có mô tả cho form",
    Object.keys(TINH_NANG_MAC_DINH)
      .filter((k) => k !== "thongBaoTamDung")
      .every((k) => k in MO_TA_TINH_NANG),
  );
  // Điểm tối đa trạm theo luật mặc định (xem trước trong SuaLuatChoi)
  const t = LUAT_MAC_DINH.tram;
  const toiDa = 10 * (t.dung + t.tocDoToiDa) + 2 * t.chuoiTu3 + 6 * t.chuoiTu5;
  kiem("Điểm tối đa trạm thường mặc định 1.840", toiDa === 1840);

  // Mục Ban tự thêm phải gửi lên ĐÚNG thứ tự trường của máy chủ, nếu không
  // `luuCaiDat` so JSON thấy khác và báo "máy chủ đã chỉnh một số ô" oan
  const theGoc: TheCoHoiSua[] = [
    {
      bat: true,
      ten: "Thẻ gốc",
      tinhHuong: "Tình huống gốc",
      lua: [
        { chon: "Khôn ngoan", von: { CN: 1, XH: 2 }, giai: "Vì vậy" },
        { chon: "Vội vàng", von: {}, giai: "Vì vậy" },
      ],
      ma: "CH01",
    },
  ];
  const theGui = {
    ds: [
      ...theGoc,
      {
        bat: true,
        ten: "Thẻ Ban tự thêm",
        tinhHuong: "Tình huống mới",
        lua: [
          { chon: "Khôn ngoan", von: { CN: 1, TS: 2 }, giai: "" },
          { chon: "Vội vàng", von: { XH: -1 }, giai: "" },
        ],
        ma: "CHABC123",
      },
    ],
  };
  kiem(
    "Thẻ Cơ hội mới thêm: bản gửi lên khớp nguyên văn bản máy chủ làm sạch",
    JSON.stringify(chuanTheCoHoi(theGui, theGoc).ds) ===
      JSON.stringify(theGui.ds),
  );

  const chiaSeGoc: CauChiaSeSua[] = [
    { bat: true, hoi: "Câu gốc?", luaChon: ["A", "B"], ma: "cs01" },
  ];
  const chiaSeGui = {
    ds: [
      ...chiaSeGoc,
      { bat: true, hoi: "Câu Ban tự thêm?", luaChon: ["A", "B"], ma: "CSABC1" },
    ],
  };
  kiem(
    "Câu chia sẻ mới thêm: bản gửi lên khớp nguyên văn bản máy chủ làm sạch",
    JSON.stringify(chuanChiaSe(chiaSeGui, chiaSeGoc).ds) ===
      JSON.stringify(chiaSeGui.ds),
  );
}

console.log(
  `\n${hong === 0 ? `Tất cả ${dat} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`,
);
if (hong) process.exit(1);
