import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { docBoCauAn, docMuc, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import {
  GIOI_HAN_GIAY_DAU_TRI,
  nhomBoCauDauTri,
  soCauDeBai,
} from "@/lib/ngoi-nha/dau-tri";
import { tenNguoiChoi } from "@/lib/ngoi-nha/dau-truong";
import { TIEN_TO_DAU } from "@/lib/ngoi-nha/dong-co";
import { soDep } from "@/lib/ngoi-nha/luat";
import { ngayGioDep } from "@/lib/ngoi-nha/thoi-gian";
import DauTruongFormDauTri from "./DauTruongFormDauTri";
import DauTruongNutPhien from "./DauTruongNutPhien";

const TRANG_THAI_PHIEN: Record<string, { ten: string; mau: string }> = {
  SAP_MO: { ten: "Chưa mở", mau: "bg-slate-100 text-slate-600" },
  DANG_MO: { ten: "Đang mở", mau: "bg-emerald-100 text-emerald-700" },
  DA_DONG: { ten: "Đã đóng", mau: "bg-slate-100 text-slate-500" },
};

/** Phiên Đấu trí sự kiện: tạo, mở, đóng, mở lại, xoá phiên chưa ai chơi, kết quả. */
export default async function QuanTriDauTri() {
  const [tinhNang, luat, an] = await Promise.all([
    docTinhNang(),
    docMuc("luat"),
    docBoCauAn(),
  ]);
  const phien = await prisma.nnDauTri.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const tramMa = phien.map((p) => `${TIEN_TO_DAU}${p.id}`);
  // Đếm người + người dẫn đầu của cả 20 phiên bằng 2 truy vấn (không gọi bảng
  // xếp hạng từng phiên — SQLite một kết nối)
  const [dem, dauBang] = await Promise.all([
    prisma.nnLuot.groupBy({
      by: ["tramMa"],
      where: { tramMa: { in: tramMa } },
      _count: { _all: true },
    }),
    prisma.nnLuot.findMany({
      where: { tramMa: { in: tramMa }, trangThai: "XONG" },
      orderBy: [{ diem: "desc" }, { createdAt: "asc" }],
      select: { tramMa: true, userId: true, diem: true },
    }),
  ]);
  const soNguoi = new Map(dem.map((d) => [d.tramMa, d._count._all]));
  const top = new Map<string, { userId: string; diem: number }>();
  for (const l of dauBang) if (!top.has(l.tramMa)) top.set(l.tramMa, l);
  const ten = await tenNguoiChoi([
    ...new Set([...top.values()].map((t) => t.userId)),
  ]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-navy-800">Đấu trí sự kiện</h2>
        <p className="text-sm text-slate-500">
          Cách chạy tại sự kiện: <b>tạo phiên</b> → chiếu <b>bảng sân khấu</b>{" "}
          lên màn hình (có mã tham gia) → bấm <b>Mở phiên</b> khi MC hô bắt đầu
          → hội viên vào Ngôi nhà Chợ Lớn → Đấu trí, nhập mã → bảng tự cập nhật
          mỗi 5 giây → <b>Đóng phiên</b> khi trao giải. Điểm và vốn cộng ngay
          vào game.
        </p>
      </div>

      {!tinhNang.dauTri && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <b>Đấu trí đang tắt</b> ở mục Cài đặt → Bật / tắt tính năng: hội viên
          chưa vào được phiên mới (người đang chơi dở vẫn chơi nốt). Vẫn tạo
          phiên trước được — nhớ bật lại trước giờ sự kiện.
        </div>
      )}

      <div className="card p-4">
        <h3 className="mb-3 font-semibold text-navy-800">Tạo phiên mới</h3>
        <DauTruongFormDauTri
          nhom={nhomBoCauDauTri(an, luat.dauTri.soCau)}
          giayMacDinh={luat.dauTri.giayMacDinh}
          gioiHanGiay={GIOI_HAN_GIAY_DAU_TRI}
        />
      </div>

      {phien.length === 0 ? (
        <div className="card px-4 py-10 text-center text-sm text-slate-500">
          Chưa có phiên nào.
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {phien.map((p) => {
            const ma = `${TIEN_TO_DAU}${p.id}`;
            const so = soNguoi.get(ma) ?? 0;
            const dan = top.get(ma);
            const tt =
              TRANG_THAI_PHIEN[p.trangThai] ?? TRANG_THAI_PHIEN.DA_DONG;
            return (
              <div key={p.id} className="space-y-2 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-semibold text-navy-800">
                    {p.ten}{" "}
                    <span
                      className={`ml-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${tt.mau}`}
                    >
                      {tt.ten}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    Mã <b className="font-mono text-navy-700">{p.maThamGia}</b>{" "}
                    · {soCauDeBai(p.deBai)} câu × {p.giayMoiCau} giây · {so}{" "}
                    người chơi
                    {dan
                      ? ` · dẫn đầu: ${ten.get(dan.userId)?.ten ?? "Hội viên"} (${soDep(dan.diem)})`
                      : ""}
                  </div>
                  <div className="text-xs text-slate-400">
                    Tạo {ngayGioDep(p.createdAt)}
                    {p.dongLuc && p.trangThai === "DA_DONG"
                      ? ` · đóng ${ngayGioDep(p.dongLuc)}`
                      : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/ngoi-nha/dau-tri/${p.id}/bang?san-khau=1`}
                    target="_blank"
                    className="btn-ghost flex min-h-11 items-center"
                  >
                    Bảng sân khấu
                  </Link>
                  <Link
                    href={`/ngoi-nha/dau-tri/${p.id}/bang`}
                    className="btn-ghost flex min-h-11 items-center"
                  >
                    Kết quả
                  </Link>
                  <DauTruongNutPhien
                    id={p.id}
                    trangThai={p.trangThai}
                    soNguoi={so}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
