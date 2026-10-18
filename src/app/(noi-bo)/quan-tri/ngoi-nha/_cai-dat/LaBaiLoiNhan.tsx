"use client";

/**
 * Lời nhắn nhủ của Lá bài: bật / tắt, sửa, thêm, hẹn khoảng ngày hiện, dùng lại
 * bộ gốc (gửi `loiNhan: null`). Người ký mặc định "Ban Chủ nhiệm Chi hội" —
 * không tự điền tên người thật khi chưa được người đó đồng ý.
 */
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import { taoMaMuc } from "@/lib/ngoi-nha/cai-dat/chuan";
import {
  GIOI_HAN_LA_BAI,
  NGUOI_KY_MAC_DINH,
  type CauHinhLaBai,
  type LoiNhan,
} from "@/lib/ngoi-nha/la-bai-luat";
import KhungCaiDat from "./KhungCaiDat";
import LaBaiDanhSach, { LaBaiNhan } from "./LaBaiDanhSach";
import { OChu, ONgay } from "./truong";

/** Tên dễ đọc cho chủ đề có sẵn trong bộ gốc; chủ đề Ban tự gõ thì hiện nguyên chữ. */
const TEN_CHU_DE: Record<string, string> = {
  "ket-noi": "Kết nối",
  "kinh-doanh": "Kinh doanh",
  "suc-khoe": "Sức khoẻ",
  "hoc-hoi": "Học hỏi",
  "gia-dinh": "Gia đình",
  "tri-an": "Tri ân",
  chung: "Chung",
};
const tenChuDe = (c: string) => TEN_CHU_DE[c] ?? c;

export default function LaBaiLoiNhan({
  du,
  goc,
}: {
  du: DuLieuMuc<CauHinhLaBai>;
  goc: LoiNhan[];
}) {
  const maDaLuu = new Set([
    ...goc.map((l) => l.ma),
    ...(du.giaTri.loiNhan ?? []).map((l) => l.ma),
  ]);

  return (
    <KhungCaiDat
      muc="laBai"
      nhom={["loiNhan"]}
      giaTri={du.giaTri}
      macDinh={du.macDinh}
      tieuDe="Lời nhắn nhủ"
      moTa="Lời nhắn ngắn của Chi hội kèm một việc nhỏ làm được trong ngày. Lời nhắn theo dịp (Trung thu, Tết, lễ chuyển giao…) thì đặt khoảng ngày hiện."
    >
      {(v, sua) => {
        const dangDungGoc = v.loiNhan === null;
        const ds = v.loiNhan ?? goc;
        const doiDs = (moi: LoiNhan[] | null) =>
          sua((x) => ({ ...x, loiNhan: moi }));
        const cacChuDe = [...new Set([...goc, ...ds].map((l) => l.chuDe))];
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-navy-50 px-3 py-2.5 text-sm text-navy-800">
              <span>
                {dangDungGoc
                  ? `Đang dùng bộ gốc ${goc.length} lời nhắn.`
                  : "Đã chỉnh sửa so với bộ gốc."}
              </span>
              {!dangDungGoc && (
                <button
                  type="button"
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-navy-700 ring-1 ring-navy-200 hover:bg-white"
                  onClick={() => {
                    if (
                      confirm(
                        "Dùng lại bộ lời nhắn gốc? Mọi lời nhắn đã sửa / thêm sẽ mất sau khi bấm Lưu.",
                      )
                    )
                      doiDs(null);
                  }}
                >
                  Dùng lại bộ gốc
                </button>
              )}
            </div>

            <LaBaiDanhSach<LoiNhan>
              ds={ds}
              onDoi={doiDs}
              maDaLuu={maDaLuu}
              tenMuc="lời nhắn"
              toiDa={GIOI_HAN_LA_BAI.soLoiNhan}
              taoMoi={() => ({
                ma: taoMaMuc("LN"),
                bat: true,
                noiDung: "",
                goiY: null,
                chuDe: cacChuDe[0] ?? "chung",
                nguoiKy: NGUOI_KY_MAC_DINH,
                tuNgay: null,
                denNgay: null,
              })}
              chuoiTim={(l) =>
                `${l.ma} ${l.noiDung} ${l.goiY ?? ""} ${l.nguoiKy} ${tenChuDe(l.chuDe)}`
              }
              boLoc={{
                nhan: "Chủ đề",
                luaChon: cacChuDe.map((c) => ({ gia: c, nhan: tenChuDe(c) })),
                khop: (l, gia) => l.chuDe === gia,
              }}
              thieu={(l) => (!l.noiDung.trim() ? "nội dung" : null)}
              tomTat={(l) => (
                <>
                  <span className="line-clamp-3">
                    {l.noiDung.trim() || "(chưa có nội dung)"}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-slate-500">
                    {tenChuDe(l.chuDe)} · {l.nguoiKy || NGUOI_KY_MAC_DINH}
                    {(l.tuNgay || l.denNgay) && (
                      <LaBaiNhan mau="navy">
                        {l.tuNgay ? `từ ${l.tuNgay}` : ""}
                        {l.tuNgay && l.denNgay ? " " : ""}
                        {l.denNgay ? `đến ${l.denNgay}` : ""}
                      </LaBaiNhan>
                    )}
                  </span>
                </>
              )}
              bieuMau={(l, suaMuc) => (
                <div className="space-y-3">
                  <OChu
                    nhan="Lời nhắn"
                    giaTri={l.noiDung}
                    dai={300}
                    nhieuDong={3}
                    onDoi={(s) => suaMuc({ noiDung: s })}
                  />
                  <OChu
                    nhan="Việc nhỏ cho hôm nay (gợi ý hành động)"
                    giaTri={l.goiY ?? ""}
                    dai={160}
                    nhieuDong={2}
                    onDoi={(s) => suaMuc({ goiY: s || null })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="lbl">Chủ đề</span>
                      <input
                        className="inp min-h-11 text-base sm:text-sm"
                        list="la-bai-chu-de"
                        value={l.chuDe}
                        maxLength={30}
                        onChange={(e) => suaMuc({ chuDe: e.target.value })}
                      />
                      <datalist id="la-bai-chu-de">
                        {cacChuDe.map((c) => (
                          <option key={c} value={c}>
                            {tenChuDe(c)}
                          </option>
                        ))}
                      </datalist>
                    </label>
                    <OChu
                      nhan="Người ký"
                      giaTri={l.nguoiKy}
                      dai={80}
                      placeholder={NGUOI_KY_MAC_DINH}
                      goiY="Để trống = Ban Chủ nhiệm Chi hội. Chỉ ghi tên người khi họ đã đồng ý."
                      onDoi={(s) => suaMuc({ nguoiKy: s })}
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <ONgay
                      nhan="Hiện từ ngày (trống = luôn)"
                      giaTri={l.tuNgay}
                      onDoi={(d) => suaMuc({ tuNgay: d })}
                    />
                    <ONgay
                      nhan="Đến ngày (trống = không hạn)"
                      giaTri={l.denNgay}
                      onDoi={(d) => suaMuc({ denNgay: d })}
                    />
                  </div>
                  {l.tuNgay && l.denNgay && l.tuNgay > l.denNgay && (
                    <p className="text-xs text-do-600">
                      Ngày bắt đầu đang sau ngày kết thúc — lời nhắn này sẽ
                      không bao giờ hiện.
                    </p>
                  )}
                </div>
              )}
            />
          </div>
        );
      }}
    </KhungCaiDat>
  );
}
