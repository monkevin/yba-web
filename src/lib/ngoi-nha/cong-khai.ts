/**
 * Số liệu game "Ngôi nhà Chợ Lớn" cho trang CÔNG KHAI (dải game ở trang chủ)
 * — CHỈ MÁY CHỦ.
 *
 * Chỉ trả chuỗi và số tổng. KHÔNG tên người chơi, không điểm từng người,
 * không tên nhà đồng hành: bảng xếp hạng và cơ cấu quà chi tiết là chuyện nội
 * bộ của hội viên trong game.
 *
 * Trang chủ dựng lại ở MỖI request mà SQLite chỉ có một kết nối (truy vấn xếp
 * hàng sau các lượt ghi của game), nên hàm này tối đa 3 truy vấn nhẹ:
 *  1. Các mùa DANG_MO / SAP_MO — một `findMany` thay cho `muaHienTai()` +
 *     `coCauHienTai()` (hai hàm đó cộng lại tốn 2–3 truy vấn).
 *  2. Cài đặt `nn.*` — `docTinhNang()` và `docCauHinhLaBai()` dùng chung một
 *     truy vấn (React `cache` trong `cai-dat/index.ts`).
 *  3. MỘT trong hai: đếm người đã thắp sáng trạm (khi mùa chính thức đã bắt
 *     đầu — cơ cấu quà đọc luôn từ mùa) HOẶC đọc cơ cấu quà mẫu (khi chưa có
 *     mùa nào). Đang chơi thử thì không đếm: số đó gồm cả tài khoản Ban thử
 *     game và về 0 khi mở mùa chính thức.
 *
 * Lỗi gì cũng trả giá trị mặc định — trang chủ không được sập vì game.
 * Không bọc `unstable_cache` ở đây (script tsx import file này sẽ vỡ).
 */
import { prisma } from "@/lib/prisma";
import { docCauHinhLaBai, docTinhNang } from "./cai-dat";
import { CHOI_THU, coCauMau, docCoCau, tongQua } from "./mua";
import { CAU_HOI, CHANG, TRAM } from "./noi-dung";
import danhNgonGoc from "./noi-dung/la-bai/danh-ngon.json";
import { ngayDep } from "./thoi-gian";

/** Dưới ngưỡng này không hiện số người chơi — ít quá trông vắng. */
export const NGUONG_SO_NGUOI_CONG_KHAI = 20;

export type NgoiNhaCongKhai = {
  /** Dòng trạng thái mùa giải; null khi không đọc được */
  dongMua: string | null;
  /** Mùa giải chính thức đang trong khoảng ngày thi đấu */
  dangDienRa: boolean;
  /** Ban Điều hành đang tạm dừng game */
  tamDung: boolean;
  /** Số phần quà giải mùa (đếm được); null khi không có / không đọc được */
  soQua: number | null;
  /** Số hội viên đã qua ít nhất một trạm trong mùa; null khi dưới ngưỡng */
  soNguoiChoi: number | null;
  /** Số danh ngôn đang bật trong Lá bài mỗi ngày; null khi tính năng tắt */
  soDanhNgon: number | null;
  coDauTruong: boolean;
  coDauTri: boolean;
  soChang: number;
  soTram: number;
  soCau: number;
  cauMoiTram: number;
  chang: { so: number; ten: string; tieuDe: string }[];
};

// Nội dung tĩnh trong mã — không tốn truy vấn
const NOI_DUNG = {
  soChang: CHANG.length,
  soTram: TRAM.length,
  soCau: CAU_HOI.length,
  cauMoiTram: TRAM.length ? Math.round(CAU_HOI.length / TRAM.length) : 0,
  chang: CHANG.map((c) => ({ so: c.so, ten: c.ten, tieuDe: c.tieuDe })),
};

const MAC_DINH: NgoiNhaCongKhai = {
  dongMua: null,
  dangDienRa: false,
  tamDung: false,
  soQua: null,
  soNguoiChoi: null,
  soDanhNgon: null,
  coDauTruong: true,
  coDauTri: true,
  ...NOI_DUNG,
};

const soDuong = (n: number) => (n > 0 ? n : null);

export async function ngoiNhaCongKhai(
  now = new Date(),
): Promise<NgoiNhaCongKhai> {
  try {
    const [dsMua, tinhNang, laBai] = await Promise.all([
      prisma.nnMua.findMany({
        where: { trangThai: { in: ["DANG_MO", "SAP_MO"] } },
        select: {
          id: true,
          ten: true,
          batDau: true,
          ketThuc: true,
          trangThai: true,
          phanThuong: true,
        },
      }),
      docTinhNang(),
      docCauHinhLaBai(),
    ]);

    // Chọn mùa GIỐNG HỆT muaHienTai() / muaDuKien() trong mua.ts: mùa DANG_MO
    // mới nhất; không có thì mùa SAP_MO sớm nhất. Sửa bên đó thì sửa cả đây.
    const dangMo = dsMua
      .filter((m) => m.trangThai === "DANG_MO")
      .sort((a, b) => b.batDau.getTime() - a.batDau.getTime())[0];
    const sapMo = dsMua
      .filter((m) => m.trangThai === "SAP_MO")
      .sort((a, b) => a.batDau.getTime() - b.batDau.getTime())[0];
    const duKien = dangMo ?? sapMo;

    let muaId = CHOI_THU;
    let dangDienRa = false;
    let dongMua: string;
    if (dangMo && now < dangMo.batDau) {
      dongMua = `${dangMo.ten} khởi tranh ngày ${ngayDep(dangMo.batDau)} · đang mở chơi thử`;
    } else if (dangMo && now > dangMo.ketThuc) {
      muaId = dangMo.id;
      dongMua = `${dangMo.ten} đã khép lại · chờ Ban Điều hành công bố kết quả`;
    } else if (dangMo) {
      muaId = dangMo.id;
      dangDienRa = true;
      dongMua = `${dangMo.ten} đang diễn ra đến ngày ${ngayDep(dangMo.ketThuc)}`;
    } else if (sapMo) {
      // Mùa đã tạo mà Ban chưa bấm mở: ngày dự kiến đã qua thì đừng in ngày cũ
      dongMua =
        sapMo.batDau > now
          ? `${sapMo.ten} dự kiến khởi tranh ngày ${ngayDep(sapMo.batDau)} · đang mở chơi thử`
          : `${sapMo.ten} sắp khởi tranh · đang mở chơi thử`;
    } else {
      dongMua = "Đang mở chơi thử · mùa giải chính thức sẽ sớm công bố";
    }
    if (tinhNang.tamDung) {
      dongMua = "Game đang tạm dừng để bảo trì · anh/chị quay lại sau nhé";
    }

    // Truy vấn thứ 3 là MỘT trong hai: cơ cấu quà mẫu (chỉ khi chưa có mùa /
    // JSON quà của mùa hỏng) hoặc đếm người chơi (chỉ khi mùa đã bắt đầu).
    const coCauMua = duKien ? docCoCau(duKien.phanThuong) : null;
    const [coCau, daThap] = await Promise.all([
      coCauMua ?? coCauMau(),
      coCauMua && muaId !== CHOI_THU
        ? prisma.nnTienDo.groupBy({
            by: ["userId"],
            where: { muaId, daQua: true },
          })
        : null,
    ]);
    const soQua = soDuong(tongQua(coCau.giai));
    const soNguoiChoi =
      daThap && daThap.length >= NGUONG_SO_NGUOI_CONG_KHAI
        ? daThap.length
        : null;

    const soDanhNgon = tinhNang.laBai
      ? soDuong(
          laBai.danhNgon
            ? laBai.danhNgon.filter((d) => d.bat).length
            : danhNgonGoc.danhNgon.length,
        )
      : null;

    return {
      dongMua,
      dangDienRa,
      tamDung: tinhNang.tamDung,
      soQua,
      soNguoiChoi,
      soDanhNgon,
      coDauTruong: tinhNang.dauTruong,
      coDauTri: tinhNang.dauTri,
      ...NOI_DUNG,
    };
  } catch (e) {
    console.error("[ngoiNhaCongKhai] không đọc được số liệu game:", e);
    return MAC_DINH;
  }
}
