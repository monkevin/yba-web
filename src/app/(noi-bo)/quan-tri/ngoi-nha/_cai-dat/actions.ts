"use server";

/**
 * Lưu một mục cài đặt game (luật, bật tắt, lá bài, nội dung…). Chỉ nhận tên mục
 * có trong sổ đăng ký `MUC_CAI_DAT` — trình duyệt không ghi được khoá tuỳ ý.
 */
import {
  docMucTuoi,
  ghiMuc,
  laTenMuc,
  MUC_CAI_DAT,
  xoaMuc,
} from "@/lib/ngoi-nha/cai-dat";
import { ghiNhatKy } from "@/lib/ngoi-nha/nhat-ky";
import {
  KHONG_QUYEN_CAI_DAT,
  lamMoiGame,
  nguoiCaiDat,
} from "./quyen";

export type KetQuaCaiDat = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** Giá trị ĐẦY ĐỦ của mục sau khi máy chủ làm sạch */
  giaTri?: unknown;
  /** Các trường cấp 1 máy chủ đã chỉnh khác với bản gửi lên (bị chặn giới hạn…) */
  daChinh?: string[];
};

const bang = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * `duLieu` là JSON một phần của mục (vd `{ "tram": {...} }`): máy chủ gộp vào
 * bản đang lưu theo trường cấp 1 rồi làm sạch, nên hai khung sửa hai nhóm khác
 * nhau của cùng một mục không ghi đè lên nhau.
 */
export async function luuCaiDat(
  _prev: KetQuaCaiDat,
  fd: FormData,
): Promise<KetQuaCaiDat> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  const ten = String(fd.get("muc") ?? "");
  if (!laTenMuc(ten)) return { error: "Mục cài đặt không hợp lệ" };
  let phan: unknown;
  try {
    phan = JSON.parse(String(fd.get("duLieu") ?? ""));
  } catch {
    return { error: "Dữ liệu gửi lên bị hỏng — tải lại trang rồi thử lại" };
  }
  if (!phan || typeof phan !== "object" || Array.isArray(phan))
    return { error: "Dữ liệu gửi lên không đúng dạng" };
  try {
    const truoc = await docMucTuoi(ten);
    const gop = { ...(truoc.giaTri as object), ...(phan as object) };
    const { giaTri } = await ghiMuc(ten, gop);
    const doi = Object.keys(phan as object).filter(
      (k) =>
        !bang(
          (truoc.giaTri as Record<string, unknown>)[k],
          (giaTri as Record<string, unknown>)[k],
        ),
    );
    const daChinh = Object.keys(phan as object).filter(
      (k) =>
        !bang(
          (phan as Record<string, unknown>)[k],
          (giaTri as Record<string, unknown>)[k],
        ),
    );
    await ghiNhatKy(user.id, `nn.caiDat:${MUC_CAI_DAT[ten].khoa}`, {
      muc: MUC_CAI_DAT[ten].ten,
      doi,
    });
    lamMoiGame();
    return {
      ok: true,
      message: doi.length
        ? `Đã lưu ${MUC_CAI_DAT[ten].ten}`
        : "Không có gì thay đổi",
      giaTri,
      daChinh,
    };
  } catch (e) {
    console.error("[quan-tri ngoi-nha] luu cai dat", e);
    return { error: "Máy chủ đang bận, chưa lưu được — thử lại sau vài giây" };
  }
}

/** Xoá toàn bộ bản sửa của một mục → game dùng lại bản gốc trong code. */
export async function veBanGoc(
  _prev: KetQuaCaiDat,
  fd: FormData,
): Promise<KetQuaCaiDat> {
  const user = await nguoiCaiDat();
  if (!user) return { error: KHONG_QUYEN_CAI_DAT };
  const ten = String(fd.get("muc") ?? "");
  if (!laTenMuc(ten)) return { error: "Mục cài đặt không hợp lệ" };
  try {
    await xoaMuc(ten);
    await ghiNhatKy(user.id, `nn.veGoc:${MUC_CAI_DAT[ten].khoa}`, {
      muc: MUC_CAI_DAT[ten].ten,
    });
    lamMoiGame();
    const { giaTri } = await docMucTuoi(ten);
    return {
      ok: true,
      message: `Đã đưa ${MUC_CAI_DAT[ten].ten} về bản gốc`,
      giaTri,
    };
  } catch (e) {
    console.error("[quan-tri ngoi-nha] ve ban goc", e);
    return { error: "Máy chủ đang bận — thử lại sau vài giây" };
  }
}
