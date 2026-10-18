import { createHash } from "crypto";
import { chuanSoDienThoai, laDauVaoSoDienThoai } from "@/lib/so-dien-thoai";

/**
 * Giới hạn số lần đăng nhập sai — đếm trong BỘ NHỚ của tiến trình Node (web chạy
 * một tiến trình; khởi động lại thì đếm lại từ đầu, chấp nhận được).
 *
 * Vì sao khoá theo CẶP (định danh + máy) chứ không khoá tài khoản: tên đăng nhập
 * chạy liền hv0001…hv0257 và ai cũng đoán được, khoá theo tài khoản thì kẻ xấu
 * gõ sai 5 lần cho mỗi tên là khoá được cả Chi hội (kể cả giữa buổi chơi game).
 * Khoá theo cặp chỉ làm chậm đúng máy đang dò; chủ tài khoản ở máy khác vẫn vào
 * bình thường. KHÔNG bao giờ đụng `User.active` ở đây.
 *
 * Thêm một trần theo máy (tính mọi định danh) để chặn kiểu thử "123456" lần lượt
 * cho từng tên đăng nhập.
 *
 * Lưu ý QUAN TRỌNG: địa chỉ máy lấy từ header nên KHÔNG đáng tin. Sau Nginx (máy
 * chủ Docker) Nginx tự nối IP thật vào cuối `X-Forwarded-For` nên lấy phần tử
 * CUỐI là đúng; nhưng khi vào thẳng cổng 3002 (LAN) thì Next chỉ điền IP socket
 * nếu người gửi KHÔNG tự khai header (`req.headers['x-forwarded-for'] ??= …`),
 * nghĩa là kẻ xấu tự gắn một `X-Forwarded-For` khác nhau mỗi lần gửi là mỗi lần
 * thành "một máy mới" — giới hạn theo cặp và theo máy coi như không còn.
 *
 * Vì vậy có thêm TRẦN THEO ĐỊNH DANH (cộng mọi máy): không giả được vì nó khoá
 * theo đúng thứ người dùng gõ. Trần này đặt CAO và thời gian chờ NGẮN, cố định
 * (không nhân đôi) để kẻ xấu không dùng nó làm cách khoá tài khoản người khác:
 * muốn giữ một tài khoản ở trạng thái phải chờ, họ phải liên tục đốt đủ 20 lần
 * sai mỗi phút cho riêng tài khoản đó. KHÔNG bao giờ đụng `User.active`.
 */

export const GIOI_HAN = {
  /** Số lần sai cho một cặp (định danh, máy) trước khi phải chờ */
  soSaiMoiCap: 5,
  /** Quên lịch sử sai sau khoảng lặng này (tính từ lần sai gần nhất / lúc hết chờ) */
  cuaSoMs: 15 * 60 * 1000,
  /** Lần chờ đầu tiên, sau đó gấp đôi mỗi lần tiếp tục sai */
  choDauMs: 30 * 1000,
  choToiDaMs: 15 * 60 * 1000,
  /** Trần số lần sai của một máy trong cửa sổ, cộng mọi định danh */
  soSaiMoiMay: 50,
  /** Trần số lần sai cho MỘT định danh, cộng mọi máy (chặn kiểu giả IP) */
  soSaiMoiDinhDanh: 20,
  /** Chờ khi một định danh chạm trần — cố định, ngắn, rồi đếm lại từ đầu */
  choDinhDanhMs: 60 * 1000,
};

type DemCap = {
  soSai: number;
  lanSaiCuoi: number;
  chanDen: number;
  soLanChan: number;
};
type DemMay = { soSai: number; batDau: number };
type DemDinhDanh = { soSai: number; batDau: number; chanDen: number };
type Kho = {
  cap: Map<string, DemCap>;
  may: Map<string, DemMay>;
  dinhDanh: Map<string, DemDinhDanh>;
};

// Gắn lên globalThis để route đăng nhập và server action đổi mật khẩu (có thể
// nằm ở hai bundle khác nhau) cùng dùng một bộ đếm, và dev HMR không xoá mất.
const g = globalThis as unknown as { __gioiHanDangNhap?: Kho };
const kho: Kho = (g.__gioiHanDangNhap ??= {
  cap: new Map(),
  may: new Map(),
  dinhDanh: new Map(),
});
// Bản cũ chỉ có hai bảng — bổ sung bảng mới khi HMR giữ lại đối tượng cũ
kho.dinhDanh ??= new Map();

/**
 * Cặp đã "lặng" đủ lâu thì quên lịch sử sai. Tính từ lúc HẾT CHỜ (không phải lúc
 * sai) để kẻ dò bấm lại ngay khi hết 15 phút chờ vẫn giữ mức chờ cao nhất.
 */
function daQuen(c: DemCap, bayGio: number): boolean {
  return bayGio - Math.max(c.lanSaiCuoi, c.chanDen) > GIOI_HAN.cuaSoMs;
}

/** Quá nhiều mục thì dọn các mục đã hết hạn — chặn bộ nhớ phình khi bị dò. */
const TRAN_MUC = 5000;
function donDep(bayGio: number) {
  if (kho.cap.size > TRAN_MUC) {
    for (const [k, v] of kho.cap) {
      if (daQuen(v, bayGio)) kho.cap.delete(k);
    }
    // Vẫn quá tải (đang bị dò dồn dập): bỏ bớt mục cũ nhất theo thứ tự chèn
    for (const k of kho.cap.keys()) {
      if (kho.cap.size <= TRAN_MUC) break;
      kho.cap.delete(k);
    }
  }
  if (kho.may.size > TRAN_MUC) {
    for (const [k, v] of kho.may) {
      if (bayGio - v.batDau > GIOI_HAN.cuaSoMs) kho.may.delete(k);
    }
    for (const k of kho.may.keys()) {
      if (kho.may.size <= TRAN_MUC) break;
      kho.may.delete(k);
    }
  }
  if (kho.dinhDanh.size > TRAN_MUC) {
    for (const [k, v] of kho.dinhDanh) {
      if (daQuenDinhDanh(v, bayGio)) kho.dinhDanh.delete(k);
    }
    for (const k of kho.dinhDanh.keys()) {
      if (kho.dinhDanh.size <= TRAN_MUC) break;
      kho.dinhDanh.delete(k);
    }
  }
}

/** Định danh lặng đủ lâu (và không còn đang chờ) thì quên lịch sử sai. */
function daQuenDinhDanh(d: DemDinhDanh, bayGio: number): boolean {
  return d.chanDen <= bayGio && bayGio - d.batDau > GIOI_HAN.cuaSoMs;
}

/**
 * Chuẩn hoá chữ người dùng gõ để "HV0018 ", "hv0018" hay "+84 903…", "0903…" đếm
 * chung một khoá.
 */
export function chuanDinhDanh(raw: string): string {
  const t = String(raw ?? "").trim();
  if (laDauVaoSoDienThoai(t)) return `sdt:${chuanSoDienThoai(t)}`;
  return `ten:${t.toLowerCase()}`;
}

/** IP người gửi, ưu tiên phần tử cuối X-Forwarded-For (xem ghi chú đầu file). */
export function layIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const ds = xff
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ds.length) return ds[ds.length - 1];
  }
  return headers.get("x-real-ip")?.trim() || "khong-ro";
}

/** Băm IP trộn SESSION_SECRET (như hoi-ai/route.ts) — không giữ IP thật. */
export function bamIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.SESSION_SECRET ?? ""))
    .digest("hex")
    .slice(0, 32);
}

/**
 * Khoá của "máy không rõ địa chỉ". Không đếm trần theo máy cho khoá này: nó
 * không chỉ ra ai cả, mà gộp mọi người vào chung một xô — 50 lần sai của người
 * lạ là cả Chi hội không đăng nhập được (đúng lúc họp thì hỏng buổi). Hai lớp
 * còn lại (cặp và định danh) vẫn chạy bình thường.
 */
const MAY_KHONG_RO = bamIp("khong-ro");

export type TrangThaiGioiHan =
  { choPhep: true } | { choPhep: false; conLaiGiay: number };

function khoaCap(dinhDanh: string, may: string) {
  return `${dinhDanh}|${may}`;
}

/** Gọi TRƯỚC khi so mật khẩu: đang bị chặn thì trả số giây còn phải chờ. */
export function kiemTraGioiHan(
  dinhDanh: string,
  may: string,
  bayGio = Date.now(),
): TrangThaiGioiHan {
  const m = may === MAY_KHONG_RO ? undefined : kho.may.get(may);
  if (m) {
    if (bayGio - m.batDau > GIOI_HAN.cuaSoMs) kho.may.delete(may);
    else if (m.soSai >= GIOI_HAN.soSaiMoiMay) {
      return {
        choPhep: false,
        conLaiGiay: Math.max(
          1,
          Math.ceil((m.batDau + GIOI_HAN.cuaSoMs - bayGio) / 1000),
        ),
      };
    }
  }

  // Trần theo ĐỊNH DANH: lớp duy nhất kẻ xấu không lách được bằng cách giả IP
  const d = kho.dinhDanh.get(dinhDanh);
  if (d) {
    if (d.chanDen > bayGio) {
      return {
        choPhep: false,
        conLaiGiay: Math.max(1, Math.ceil((d.chanDen - bayGio) / 1000)),
      };
    }
    if (daQuenDinhDanh(d, bayGio)) kho.dinhDanh.delete(dinhDanh);
  }

  const k = khoaCap(dinhDanh, may);
  const c = kho.cap.get(k);
  if (!c) return { choPhep: true };
  if (c.chanDen > bayGio) {
    return {
      choPhep: false,
      conLaiGiay: Math.max(1, Math.ceil((c.chanDen - bayGio) / 1000)),
    };
  }
  if (daQuen(c, bayGio)) kho.cap.delete(k);
  return { choPhep: true };
}

/**
 * Ghi một lần sai. Trả số giây phải chờ nếu lần sai này làm bị chặn (0 nếu
 * chưa) — lấy mức chờ LỚN NHẤT trong các lớp (cặp, định danh).
 */
export function ghiThatBai(
  dinhDanh: string,
  may: string,
  bayGio = Date.now(),
): number {
  donDep(bayGio);

  if (may !== MAY_KHONG_RO) {
    const m = kho.may.get(may);
    if (!m || bayGio - m.batDau > GIOI_HAN.cuaSoMs) {
      kho.may.set(may, { soSai: 1, batDau: bayGio });
    } else {
      m.soSai += 1;
    }
  }

  let choDinhDanh = 0;
  let d = kho.dinhDanh.get(dinhDanh);
  if (!d || daQuenDinhDanh(d, bayGio)) {
    d = { soSai: 0, batDau: bayGio, chanDen: 0 };
    kho.dinhDanh.set(dinhDanh, d);
  }
  d.soSai += 1;
  if (d.soSai >= GIOI_HAN.soSaiMoiDinhDanh) {
    // Chờ cố định rồi đếm lại từ 0: muốn giữ người khác ở trạng thái phải chờ
    // thì kẻ xấu phải đốt tiếp đủ số lần sai, không "khoá" được lâu dài
    d.soSai = 0;
    d.batDau = bayGio;
    d.chanDen = bayGio + GIOI_HAN.choDinhDanhMs;
    choDinhDanh = Math.ceil(GIOI_HAN.choDinhDanhMs / 1000);
  }

  const k = khoaCap(dinhDanh, may);
  let c = kho.cap.get(k);
  if (!c || daQuen(c, bayGio)) {
    c = { soSai: 0, lanSaiCuoi: bayGio, chanDen: 0, soLanChan: 0 };
    kho.cap.set(k, c);
  }
  c.soSai += 1;
  c.lanSaiCuoi = bayGio;
  if (c.soSai >= GIOI_HAN.soSaiMoiCap) {
    // Chờ lùi dần 30s, 60s, 120s… tối đa 15 phút. Sau khi hết chờ, sai thêm một
    // lần là bị chặn tiếp với mức chờ gấp đôi.
    const cho = Math.min(
      GIOI_HAN.choDauMs * 2 ** c.soLanChan,
      GIOI_HAN.choToiDaMs,
    );
    c.soLanChan += 1;
    c.chanDen = bayGio + cho;
    return Math.max(Math.ceil(cho / 1000), choDinhDanh);
  }
  return choDinhDanh;
}

/**
 * Đăng nhập đúng: xoá đếm của cặp này VÀ của định danh — người gõ đúng mật khẩu
 * là chính chủ, không để lịch sử kẻ khác dò tên mình làm mình phải chờ. Trần
 * theo máy giữ nguyên (tự hết hạn) vì một máy có thể đang dò nhiều tài khoản.
 */
export function ghiThanhCong(dinhDanh: string, may: string) {
  kho.cap.delete(khoaCap(dinhDanh, may));
  kho.dinhDanh.delete(dinhDanh);
}

/** Chỉ dùng trong script kiểm thử. */
export function datLaiGioiHan() {
  kho.cap.clear();
  kho.may.clear();
  kho.dinhDanh.clear();
}

/** "45 giây", "2 phút", "15 phút" — hiện trong thông báo chờ. */
export function moTaThoiGianCho(giay: number): string {
  if (giay < 60) return `${giay} giây`;
  return `${Math.ceil(giay / 60)} phút`;
}
