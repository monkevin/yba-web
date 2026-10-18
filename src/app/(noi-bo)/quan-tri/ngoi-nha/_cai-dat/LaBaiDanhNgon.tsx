"use client";

/**
 * Danh ngôn của Lá bài: bật / tắt từng câu, sửa, thêm câu mới, dùng lại bộ gốc
 * (gửi `danhNgon: null` — máy chủ đọc lại JSON gốc đã kiểm chứng nguồn).
 */
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import { taoMaMuc } from "@/lib/ngoi-nha/cai-dat/chuan";
import {
  GIOI_HAN_LA_BAI,
  type CauHinhLaBai,
  type DanhNgon,
} from "@/lib/ngoi-nha/la-bai-luat";
import KhungCaiDat from "./KhungCaiDat";
import LaBaiDanhSach from "./LaBaiDanhSach";
import { INP, OChu, OSo } from "./truong";

export default function LaBaiDanhNgon({
  du,
  goc,
  nhom,
}: {
  du: DuLieuMuc<CauHinhLaBai>;
  goc: DanhNgon[];
  nhom: { ma: string; ten: string }[];
}) {
  const cacNhom = [...nhom, { ma: "KHAC", ten: "Chủ đề khác" }];
  const tenNhom = new Map(cacNhom.map((n) => [n.ma, n.ten]));
  const maDaLuu = new Set([
    ...goc.map((d) => d.ma),
    ...(du.giaTri.danhNgon ?? []).map((d) => d.ma),
  ]);

  return (
    <KhungCaiDat
      muc="laBai"
      nhom={["danhNgon", "khongLapDanhNgonNgay"]}
      giaTri={du.giaTri}
      macDinh={du.macDinh}
      tieuDe="Danh ngôn"
      moTa="Câu nói của danh nhân kèm ý nghĩa cho doanh nhân. Bộ gốc đã soát nguồn trích — sửa chữ hay thêm câu mới nhớ ghi rõ nguồn. Câu không dùng nữa thì TẮT (không xoá) để lịch sử lá bài của hội viên vẫn đọc được."
    >
      {(v, sua) => {
        const dangDungGoc = v.danhNgon === null;
        const ds = v.danhNgon ?? goc;
        const doiDs = (moi: DanhNgon[] | null) =>
          sua((x) => ({ ...x, danhNgon: moi }));
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-navy-50 px-3 py-2.5 text-sm text-navy-800">
              <span>
                {dangDungGoc
                  ? `Đang dùng bộ gốc ${goc.length} câu.`
                  : "Đã chỉnh sửa so với bộ gốc."}
              </span>
              {!dangDungGoc && (
                <button
                  type="button"
                  className="min-h-11 rounded-lg px-3 text-sm font-semibold text-navy-700 ring-1 ring-navy-200 hover:bg-white"
                  onClick={() => {
                    if (
                      confirm(
                        "Dùng lại bộ danh ngôn gốc? Mọi câu đã sửa / thêm sẽ mất sau khi bấm Lưu.",
                      )
                    )
                      doiDs(null);
                  }}
                >
                  Dùng lại bộ gốc
                </button>
              )}
            </div>

            <OSo
              nhan="Không lặp lại câu đã gặp trong"
              donVi="ngày"
              giaTri={v.khongLapDanhNgonNgay}
              macDinh={du.macDinh.khongLapDanhNgonNgay}
              gioiHan={GIOI_HAN_LA_BAI.khongLapDanhNgonNgay}
              goiY="hết câu mới thì lấy lại câu cũ"
              onDoi={(n) => sua((x) => ({ ...x, khongLapDanhNgonNgay: n }))}
            />

            <LaBaiDanhSach<DanhNgon>
              ds={ds}
              onDoi={doiDs}
              maDaLuu={maDaLuu}
              tenMuc="danh ngôn"
              toiDa={GIOI_HAN_LA_BAI.soDanhNgon}
              taoMoi={() => ({
                ma: taoMaMuc("DN"),
                bat: true,
                nhom: cacNhom[0].ma,
                noiDung: "",
                tacGia: "",
                moTaTacGia: "",
                nguyenVan: null,
                nguon: "",
                yNghia: "",
              })}
              chuoiTim={(d) =>
                `${d.ma} ${d.noiDung} ${d.tacGia} ${d.moTaTacGia} ${d.yNghia}`
              }
              boLoc={{
                nhan: "Chủ đề",
                luaChon: cacNhom.map((n) => ({ gia: n.ma, nhan: n.ten })),
                khop: (d, gia) => d.nhom === gia,
              }}
              thieu={(d) =>
                !d.noiDung.trim()
                  ? "nội dung"
                  : !d.tacGia.trim()
                    ? "tác giả"
                    : null
              }
              tomTat={(d) => (
                <>
                  <span className="line-clamp-3">
                    “{d.noiDung.trim() || "(chưa có nội dung)"}”
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    {d.tacGia || "(chưa có tác giả)"} ·{" "}
                    {tenNhom.get(d.nhom) ?? d.nhom}
                  </span>
                </>
              )}
              bieuMau={(d, suaMuc) => (
                <div className="space-y-3">
                  <OChu
                    nhan="Câu danh ngôn (tiếng Việt)"
                    giaTri={d.noiDung}
                    dai={220}
                    nhieuDong={3}
                    onDoi={(s) => suaMuc({ noiDung: s })}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <OChu
                      nhan="Tác giả"
                      giaTri={d.tacGia}
                      dai={80}
                      onDoi={(s) => suaMuc({ tacGia: s })}
                    />
                    <OChu
                      nhan="Mô tả tác giả"
                      giaTri={d.moTaTacGia}
                      dai={80}
                      placeholder="vd Nhà tư tưởng, Trung Hoa cổ đại"
                      onDoi={(s) => suaMuc({ moTaTacGia: s })}
                    />
                  </div>
                  <label className="block">
                    <span className="lbl">Chủ đề</span>
                    <select
                      className={`${INP} min-h-11`}
                      value={d.nhom}
                      onChange={(e) => suaMuc({ nhom: e.target.value })}
                    >
                      {cacNhom.map((n) => (
                        <option key={n.ma} value={n.ma}>
                          {n.ten}
                        </option>
                      ))}
                    </select>
                  </label>
                  <OChu
                    nhan="Ý nghĩa cho doanh nhân"
                    giaTri={d.yNghia}
                    dai={200}
                    nhieuDong={2}
                    onDoi={(s) => suaMuc({ yNghia: s })}
                  />
                  <OChu
                    nhan="Nguyên văn (nếu câu được dịch)"
                    giaTri={d.nguyenVan ?? ""}
                    dai={300}
                    nhieuDong={2}
                    onDoi={(s) => suaMuc({ nguyenVan: s || null })}
                  />
                  <OChu
                    nhan="Nguồn trích"
                    giaTri={d.nguon}
                    dai={200}
                    goiY="Tên sách / bài phát biểu / thư, kèm năm nếu có — để hội viên tin cậy."
                    onDoi={(s) => suaMuc({ nguon: s })}
                  />
                </div>
              )}
            />
          </div>
        );
      }}
    </KhungCaiDat>
  );
}
