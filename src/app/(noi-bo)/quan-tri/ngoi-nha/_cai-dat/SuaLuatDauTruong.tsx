"use client";

import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import { GIOI_HAN_LUAT, type LuatChoi } from "@/lib/ngoi-nha/cai-dat/luat-choi";
import { GIOI_HAN_THONG_SO, type ThongSoGame } from "@/lib/ngoi-nha/moc-qua";
import KhungCaiDat from "./KhungCaiDat";
import { OSo } from "./truong";

const CANH_BAO_GIUA_MUA =
  "Mùa giải đang diễn ra — đổi điểm lúc này làm trận trước và sau khác luật. Chỉ lưu khi thật cần và báo hội viên biết.";

const so = (n: number) => n.toLocaleString("vi-VN");

/** Thông số Đấu trường 1-1 (nn.thongSo.dauTruong + nn.luat.dauTruong) và Đấu trí (nn.luat.dauTri). */
export default function SuaLuatDauTruong({
  luat,
  thongSo,
  giuaMua,
}: {
  luat: DuLieuMuc<LuatChoi>;
  thongSo: DuLieuMuc<ThongSoGame>;
  giuaMua: boolean;
}) {
  const canhBao = giuaMua ? CANH_BAO_GIUA_MUA : undefined;
  const g = GIOI_HAN_THONG_SO;
  const gl = GIOI_HAN_LUAT;
  return (
    <section className="max-w-3xl space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-navy-800">
          Đấu trường 1-1 &amp; Đấu trí sự kiện
        </h2>
        <p className="text-sm text-slate-500">
          Số câu và giây mỗi câu áp dụng cho trận / phiên tạo SAU khi lưu (trận
          đang dở giữ nguyên đề). Điểm thắng – hoà – thua, vốn và trần mỗi ngày
          tính lúc trận kết thúc.
        </p>
      </div>

      <KhungCaiDat
        muc="thongSo"
        nhom={["dauTruong"]}
        giaTri={thongSo.giaTri}
        macDinh={thongSo.macDinh}
        canhBao={canhBao}
        tieuDe="Đấu trường: đề và điểm"
        moTa="Mỗi trận hai người cùng một bộ câu. Đúng nhiều hơn thắng, bằng số câu đúng thì ai nhanh hơn thắng."
      >
        {(v, sua) => {
          const d = v.dauTruong;
          const md = thongSo.macDinh.dauTruong;
          const doi = (k: keyof ThongSoGame["dauTruong"]) => (n: number) =>
            sua((x) => ({ ...x, dauTruong: { ...x.dauTruong, [k]: n } }));
          return (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <OSo
                  nhan="Số câu mỗi trận"
                  giaTri={d.soCau}
                  macDinh={md.soCau}
                  gioiHan={g.soCau}
                  donVi="câu"
                  onDoi={doi("soCau")}
                />
                <OSo
                  nhan="Giây mỗi câu"
                  giaTri={d.giay}
                  macDinh={md.giay}
                  gioiHan={g.giay}
                  donVi="giây"
                  onDoi={doi("giay")}
                />
                <OSo
                  nhan="Điểm khi thắng"
                  giaTri={d.thang}
                  macDinh={md.thang}
                  gioiHan={g.thang}
                  donVi="điểm"
                  onDoi={doi("thang")}
                />
                <OSo
                  nhan="Điểm khi hoà"
                  giaTri={d.hoa}
                  macDinh={md.hoa}
                  gioiHan={g.hoa}
                  donVi="điểm"
                  onDoi={doi("hoa")}
                />
                <OSo
                  nhan="Điểm khi thua"
                  giaTri={d.thua}
                  macDinh={md.thua}
                  gioiHan={g.thua}
                  donVi="điểm"
                  onDoi={doi("thua")}
                  goiY="vẫn thưởng để khuyến khích nhận lời"
                />
                <OSo
                  nhan="Điểm mỗi câu đúng"
                  giaTri={d.moiCauDung}
                  macDinh={md.moiCauDung}
                  gioiHan={g.moiCauDung}
                  donVi="điểm"
                  onDoi={doi("moiCauDung")}
                />
              </div>
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Thắng tuyệt đối ({d.soCau}/{d.soCau}) được tối đa{" "}
                <b>{so(d.soCau * d.moiCauDung + d.thang)} điểm</b>; thua trắng
                được <b>{so(d.thua)} điểm</b>.
              </p>
            </div>
          );
        }}
      </KhungCaiDat>

      <KhungCaiDat
        muc="luat"
        nhom={["dauTruong"]}
        giaTri={luat.giaTri}
        macDinh={luat.macDinh}
        canhBao={canhBao}
        tieuDe="Đấu trường: vốn và chống cày điểm"
        moTa="Quá trần mỗi ngày thì trận vẫn tính thắng thua nhưng không cộng điểm, không cộng vốn. Ngày tính từ 0:00 giờ Việt Nam."
      >
        {(v, sua) => {
          const d = v.dauTruong;
          const md = luat.macDinh.dauTruong;
          const doi = (k: keyof LuatChoi["dauTruong"]) => (n: number) =>
            sua((x) => ({ ...x, dauTruong: { ...x.dauTruong, [k]: n } }));
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              <OSo
                nhan="Vốn tri thức mỗi trận (cả hai bên)"
                giaTri={d.vonTT}
                macDinh={md.vonTT}
                gioiHan={gl.dauTruong.vonTT}
                onDoi={doi("vonTT")}
              />
              <OSo
                nhan="Vốn xã hội mỗi trận (cả hai bên)"
                giaTri={d.vonXH}
                macDinh={md.vonXH}
                gioiHan={gl.dauTruong.vonXH}
                onDoi={doi("vonXH")}
              />
              <OSo
                nhan="Số trận có điểm mỗi người / ngày"
                giaTri={d.tranTinhDiemMoiNgay}
                macDinh={md.tranTinhDiemMoiNgay}
                gioiHan={gl.dauTruong.tranTinhDiemMoiNgay}
                donVi="trận"
                onDoi={doi("tranTinhDiemMoiNgay")}
              />
              <OSo
                nhan="Số trận có điểm cùng một đối thủ / ngày"
                giaTri={d.cungDoiThuMoiNgay}
                macDinh={md.cungDoiThuMoiNgay}
                gioiHan={gl.dauTruong.cungDoiThuMoiNgay}
                donVi="trận"
                onDoi={doi("cungDoiThuMoiNgay")}
              />
            </div>
          );
        }}
      </KhungCaiDat>

      <KhungCaiDat
        muc="luat"
        nhom={["dauTri"]}
        giaTri={luat.giaTri}
        macDinh={luat.macDinh}
        canhBao={canhBao}
        tieuDe="Đấu trí sự kiện"
        moTa="Số câu áp dụng cho lựa chọn rút ngẫu nhiên từ 22 trạm (bộ soạn sẵn giữ nguyên số câu). Giây mặc định điền sẵn khi tạo phiên — vẫn đổi được từng phiên."
      >
        {(v, sua) => {
          const d = v.dauTri;
          const md = luat.macDinh.dauTri;
          const doi = (k: keyof LuatChoi["dauTri"]) => (n: number) =>
            sua((x) => ({ ...x, dauTri: { ...x.dauTri, [k]: n } }));
          return (
            <div className="grid gap-4 sm:grid-cols-2">
              <OSo
                nhan="Số câu khi rút ngẫu nhiên"
                giaTri={d.soCau}
                macDinh={md.soCau}
                gioiHan={gl.dauTri.soCau}
                donVi="câu"
                onDoi={doi("soCau")}
              />
              <OSo
                nhan="Giây mặc định mỗi câu"
                giaTri={d.giayMacDinh}
                macDinh={md.giayMacDinh}
                gioiHan={gl.dauTri.giayMacDinh}
                donVi="giây"
                onDoi={doi("giayMacDinh")}
              />
              <OSo
                nhan="Vốn xã hội vì có mặt"
                giaTri={d.vonXH}
                macDinh={md.vonXH}
                gioiHan={gl.dauTri.vonXH}
                onDoi={doi("vonXH")}
              />
              <OSo
                nhan="Vốn tri thức mỗi câu đúng"
                giaTri={d.vonTTMoiCau}
                macDinh={md.vonTTMoiCau}
                gioiHan={gl.dauTri.vonTTMoiCau}
                onDoi={doi("vonTTMoiCau")}
              />
            </div>
          );
        }}
      </KhungCaiDat>
    </section>
  );
}
