/**
 * Tab vận hành "Người chơi": tìm người, xem sổ điểm, ẩn khỏi bảng xếp hạng,
 * điều chỉnh điểm có lý do, cho xem lại hướng dẫn, đóng lượt bỏ dở.
 * `q` rỗng = 20 người hoạt động gần nhất; `q = "id:<userId>"` = trang chi tiết
 * (trang cha chỉ truyền `q`, nên chi tiết đi chung tham số này).
 */
import type { ReactNode } from "react";
import { MA_VON, VON, soDep, type Von } from "@/lib/ngoi-nha/luat";
import { CHOI_THU, muaHienTai } from "@/lib/ngoi-nha/mua";
import { TRAM } from "@/lib/ngoi-nha/noi-dung";
import { ngayGioDep } from "@/lib/ngoi-nha/thoi-gian";
import { prisma } from "@/lib/prisma";
import NguoiChoiDieuChinh from "./NguoiChoiDieuChinh";
import { LienKetNguoiChoi, TimNguoiChoi } from "./NguoiChoiDieuHuong";
import {
  NutAnXepHangNguoiChoi,
  NutDongLuotBoDo,
  NutXemLaiHuongDan,
} from "./NguoiChoiThaoTac";
import {
  docChiTietNguoiChoi,
  docDanhSachNguoiChoi,
  type DongNguoiChoi,
} from "./nguoi-choi-loi";
import { GIO_LUOT_CU, moTaVon, soCoDau } from "./nguoi-choi-thuan";

const VAI_TRO: Record<string, string> = {
  ADMIN: "Chủ nhiệm",
  STAFF: "Cán bộ ban",
};

/** Tên mùa đang xem + mùa hiện tại (nơi điều chỉnh được ghi). */
async function docMua(muaId: string) {
  const hienTai = await muaHienTai();
  if (muaId === CHOI_THU) return { ten: "Chơi thử", hienTai };
  if (muaId === hienTai.id) return { ten: hienTai.ten, hienTai };
  const m = await prisma.nnMua.findUnique({
    where: { id: muaId },
    select: { ten: true },
  });
  return { ten: m?.ten ?? "Mùa không còn", hienTai };
}

export default async function QuanLyNguoiChoi({
  muaId,
  q,
}: {
  muaId: string;
  q: string;
}) {
  const tuKhoa = q.trim();
  // Cắt độ dài ngay ở đây: `q` tới thẳng từ thanh địa chỉ
  if (tuKhoa.startsWith("id:"))
    return <ChiTiet userId={tuKhoa.slice(3, 103).trim()} muaId={muaId} />;

  const [mua, { cheDo, ds }] = await Promise.all([
    docMua(muaId),
    docDanhSachNguoiChoi(tuKhoa, muaId),
  ]);

  return (
    <div className="space-y-4">
      <div className="card space-y-3 p-4">
        <div>
          <h2 className="font-semibold text-navy-800">Tìm người chơi</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Gõ tên, doanh nghiệp, tên đăng nhập, mã hội viên hoặc số điện thoại
            (không cần dấu). Bấm vào tên để xem sổ điểm, điều chỉnh điểm, cho
            xem lại hướng dẫn. Số liệu tính trong <b>{mua.ten}</b>.
          </p>
        </div>
        <TimNguoiChoi q={tuKhoa} />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-slate-600">
        <span>
          {cheDo === "tim"
            ? `${ds.length} người khớp “${tuKhoa}”${ds.length >= 30 ? " — hiện 30 người khớp nhất, gõ cụ thể hơn nếu chưa thấy" : ""}`
            : `${ds.length} người hoạt động gần nhất · ${mua.ten}`}
        </span>
        {cheDo === "tim" && (
          <LienKetNguoiChoi
            q=""
            className="inline-flex min-h-11 items-center text-navy-600 underline"
          >
            Xoá tìm kiếm
          </LienKetNguoiChoi>
        )}
      </div>

      {ds.length === 0 ? (
        <div className="card px-4 py-10 text-center text-sm text-slate-500">
          {cheDo === "tim"
            ? "Không tìm thấy tài khoản nào khớp. Thử gõ ít chữ hơn, hoặc số điện thoại."
            : `Chưa ai chơi trong ${mua.ten}. Vẫn tìm được hội viên ở ô trên — ví dụ để ẩn Ban soạn đề khỏi bảng xếp hạng trước khi mở mùa.`}
        </div>
      ) : (
        <>
          {/* Điện thoại, máy tính bảng: dạng thẻ */}
          <ul className="grid gap-3 sm:grid-cols-2 lg:hidden">
            {ds.map((n) => (
              <TheNguoiChoi key={n.id} n={n} />
            ))}
          </ul>
          {/* Màn rộng: bảng */}
          <div className="card hidden overflow-x-auto lg:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2 font-medium">Người chơi</th>
                  <th className="px-2 py-2 text-right font-medium">Điểm</th>
                  <th className="px-2 py-2 font-medium">Vốn</th>
                  <th className="px-2 py-2 text-right font-medium">Trạm</th>
                  <th className="px-2 py-2 font-medium">Huy hiệu</th>
                  <th className="px-2 py-2 font-medium">Hoạt động cuối</th>
                  <th className="px-4 py-2 font-medium">Bảng xếp hạng</th>
                </tr>
              </thead>
              <tbody>
                {ds.map((n) => (
                  <tr
                    key={n.id}
                    className="border-t border-slate-100 align-top"
                  >
                    <td className="px-4 py-2.5">
                      <TenNguoiChoi n={n} />
                    </td>
                    <td className="px-2 py-2.5 text-right font-semibold text-navy-700">
                      {soDep(n.tomTat.diem)}
                    </td>
                    <td className="px-2 py-2.5">
                      <ChipVon von={n.tomTat.von} />
                    </td>
                    <td className="px-2 py-2.5 text-right text-slate-700">
                      {n.tomTat.soTramQua}/{TRAM.length}
                    </td>
                    <td className="max-w-48 px-2 py-2.5 text-xs text-slate-600">
                      {n.tomTat.huyHieu.length
                        ? n.tomTat.huyHieu.map((h) => h.ten).join(", ")
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-2.5 text-xs text-slate-600">
                      {n.tomTat.hoatDongCuoi
                        ? ngayGioDep(n.tomTat.hoatDongCuoi)
                        : "Chưa chơi mùa này"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        {n.tomTat.anXepHang && <Nhan mau="vang">Đang ẩn</Nhan>}
                        <NutAnXepHangNguoiChoi
                          userId={n.id}
                          dangAn={n.tomTat.anXepHang}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Nhan({
  mau,
  children,
}: {
  mau: "vang" | "xam" | "do" | "xanh";
  children: ReactNode;
}) {
  const lop = {
    vang: "bg-amber-100 text-amber-800",
    xam: "bg-slate-100 text-slate-600",
    do: "bg-do-50 text-do-700",
    xanh: "bg-emerald-50 text-emerald-700",
  }[mau];
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${lop}`}
    >
      {children}
    </span>
  );
}

function ChipVon({ von }: { von: Von }) {
  return (
    <div className="flex flex-wrap gap-1">
      {MA_VON.map((k) => (
        <span
          key={k}
          title={VON[k].ten}
          className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-slate-50 px-1.5 py-0.5 text-xs text-slate-600 ring-1 ring-slate-100"
        >
          <span
            aria-hidden
            className="h-2 w-2 rounded-full"
            style={{ background: VON[k].mau }}
          />
          {VON[k].ngan} <b className="text-navy-800">{von[k]}</b>
        </span>
      ))}
    </div>
  );
}

function TenNguoiChoi({ n }: { n: DongNguoiChoi }) {
  return (
    <div className="min-w-0">
      <LienKetNguoiChoi
        q={`id:${n.id}`}
        className="font-semibold text-navy-800 underline-offset-2 hover:underline"
      >
        {n.ten}
      </LienKetNguoiChoi>
      {n.congTyDep && (
        <div className="text-xs text-slate-500">{n.congTyDep}</div>
      )}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
        <span>{n.username}</span>
        {n.ma && <span>· {n.ma}</span>}
        {VAI_TRO[n.vaiTro] && <Nhan mau="xam">{VAI_TRO[n.vaiTro]}</Nhan>}
        {n.khoa && <Nhan mau="do">Tài khoản đã khoá</Nhan>}
        {!n.tomTat.daVaoGame && <Nhan mau="xam">Chưa vào game</Nhan>}
        {n.tomTat.soLuotDangDo > 0 && (
          <Nhan mau="xanh">{n.tomTat.soLuotDangDo} lượt đang dở</Nhan>
        )}
      </div>
    </div>
  );
}

function TheNguoiChoi({ n }: { n: DongNguoiChoi }) {
  const t = n.tomTat;
  return (
    <li className="card flex flex-col gap-2 p-3">
      <div className="flex items-start justify-between gap-3">
        <TenNguoiChoi n={n} />
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold leading-tight text-navy-700">
            {soDep(t.diem)}
          </div>
          <div className="text-[11px] text-slate-500">điểm</div>
        </div>
      </div>
      <ChipVon von={t.von} />
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
        <span>
          {t.soTramQua}/{TRAM.length} trạm
        </span>
        <span>
          {t.huyHieu.length} huy hiệu
          {t.huyHieu.length
            ? ` (${t.huyHieu.map((h) => h.ten).join(", ")})`
            : ""}
        </span>
        <span>
          {t.hoatDongCuoi
            ? `Hoạt động ${ngayGioDep(t.hoatDongCuoi)}`
            : "Chưa chơi mùa này"}
        </span>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2">
        {t.anXepHang && <Nhan mau="vang">Đang ẩn khỏi BXH</Nhan>}
        <NutAnXepHangNguoiChoi userId={n.id} dangAn={t.anXepHang} />
        <LienKetNguoiChoi q={`id:${n.id}`} className="btn-ghost min-h-11">
          Xem chi tiết
        </LienKetNguoiChoi>
      </div>
    </li>
  );
}

async function ChiTiet({ userId, muaId }: { userId: string; muaId: string }) {
  const [mua, ct] = await Promise.all([
    docMua(muaId),
    docChiTietNguoiChoi(userId, muaId),
  ]);
  const quayLai = (
    <LienKetNguoiChoi
      q=""
      className="inline-flex min-h-11 items-center text-sm text-navy-600 underline"
    >
      ← Danh sách người chơi
    </LienKetNguoiChoi>
  );
  if (!ct)
    return (
      <div className="space-y-3">
        {quayLai}
        <div className="card px-4 py-10 text-center text-sm text-slate-500">
          Không tìm thấy tài khoản này — có thể đã bị xoá.
        </div>
      </div>
    );

  const { nguoi: n, soCai, luotDangDo } = ct;
  const t = n.tomTat;
  const soLuotCu = luotDangDo.filter((l) => l.quaCu).length;
  const ht = mua.hienTai;

  return (
    <div className="space-y-4">
      {quayLai}

      <div className="card space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-navy-800">{n.ten}</h2>
            {n.congTyDep && (
              <div className="text-sm text-slate-600">{n.congTyDep}</div>
            )}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
              <span>Tên đăng nhập: {n.username}</span>
              {n.ma && <span>· Mã {n.ma}</span>}
              {n.dienThoai && <span>· {n.dienThoai}</span>}
              {VAI_TRO[n.vaiTro] && <Nhan mau="xam">{VAI_TRO[n.vaiTro]}</Nhan>}
              {n.khoa && <Nhan mau="do">Tài khoản đã khoá</Nhan>}
              {!t.daVaoGame && <Nhan mau="xam">Chưa vào game</Nhan>}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold leading-tight text-navy-700">
              {soDep(t.diem)}
            </div>
            <div className="text-xs text-slate-500">điểm · {mua.ten}</div>
          </div>
        </div>
        <ChipVon von={t.von} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <span>
            {t.anXepHang ? (
              <Nhan mau="vang">Đang ẩn khỏi bảng xếp hạng</Nhan>
            ) : ct.hang ? (
              <>
                Hạng <b className="text-navy-800">{ct.hang}</b>/{ct.tongXepHang}
              </>
            ) : (
              "Chưa có trên bảng xếp hạng"
            )}
          </span>
          <span>
            {t.soTramQua}/{TRAM.length} trạm đã qua
          </span>
          <span>
            {t.hoatDongCuoi
              ? `Hoạt động cuối ${ngayGioDep(t.hoatDongCuoi)}`
              : "Chưa chơi mùa này"}
          </span>
          <span>
            {t.daXemHuongDan ? "Đã xem hướng dẫn" : "Chưa xem hướng dẫn"}
          </span>
        </div>
        {t.huyHieu.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {t.huyHieu.map((h) => (
              <Nhan key={h.ma} mau="xanh">
                {h.ten}
              </Nhan>
            ))}
          </div>
        )}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* Cột thao tác: trên điện thoại hiện trước sổ điểm */}
        <div className="space-y-4 lg:col-start-3 lg:row-start-1">
          <div className="card space-y-3 p-4">
            <h2 className="font-semibold text-navy-800">Thao tác nhanh</h2>
            <div>
              <p className="mb-1.5 text-sm text-slate-600">
                Người trong Ban soạn đề / Ban vận hành: ẩn khỏi bảng xếp hạng —
                vẫn chơi, vẫn nhận quà mốc, không nhận giải.
              </p>
              <NutAnXepHangNguoiChoi
                userId={n.id}
                dangAn={t.anXepHang}
                hienThongBao
              />
            </div>
            <div className="border-t border-slate-100 pt-3">
              <NutXemLaiHuongDan userId={n.id} daXem={t.daXemHuongDan} />
            </div>
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="text-sm font-medium text-slate-700">
                Lượt đang dở
              </div>
              {luotDangDo.length === 0 ? (
                <p className="text-sm text-slate-500">Không có lượt nào dở.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {luotDangDo.map((l) => (
                    <li key={l.id} className="rounded-lg bg-slate-50 px-3 py-2">
                      <div className="font-medium text-navy-800">{l.ten}</div>
                      <div className="text-xs text-slate-600">
                        {l.cheDo} ·{" "}
                        {l.tongCau > 0 && l.viTri >= l.tongCau
                          ? "đang ở câu thưởng"
                          : `câu ${l.viTri + 1}/${l.tongCau || "?"}`}{" "}
                        · bắt đầu {ngayGioDep(l.batDau)}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {l.quaCu && (
                          <Nhan mau="vang">Quá {GIO_LUOT_CU} giờ</Nhan>
                        )}
                        {l.khacMua && <Nhan mau="xam">Mùa khác</Nhan>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {luotDangDo.length > soLuotCu && (
                <p className="text-xs text-slate-500">
                  Lượt dở chưa quá {GIO_LUOT_CU} giờ để người chơi tự làm nốt.
                </p>
              )}
              <NutDongLuotBoDo userId={n.id} soLuot={soLuotCu} />
            </div>
          </div>

          <NguoiChoiDieuChinh
            key={`${n.id}:${ht.id}`}
            userId={n.id}
            tenNguoi={n.ten}
            mua={{
              id: ht.id,
              ten: ht.id === CHOI_THU ? "Chơi thử" : ht.ten,
              tinhDiem: ht.tinhDiem,
              choiThu: ht.id === CHOI_THU,
            }}
            // Số trên trang là của MÙA ĐANG XEM; lệch mùa hiện tại thì không
            // đưa xuống (đưa 0 xuống là bản xem lại nói sai "Điểm mùa: 0 → …")
            diemHienTai={ht.id === muaId ? t.diem : null}
            vonHienTai={ht.id === muaId ? t.von : null}
          />
        </div>

        <div className="card p-4 lg:col-span-2 lg:row-start-1">
          <h2 className="font-semibold text-navy-800">
            Sổ điểm {mua.ten}{" "}
            <span className="text-sm font-normal text-slate-500">
              (
              {soCai.length >= 50 ? "50 dòng gần nhất" : `${soCai.length} dòng`}
              )
            </span>
          </h2>
          {soCai.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Chưa có dòng nào trong mùa này.
            </p>
          ) : (
            <>
              <ul className="mt-2 divide-y divide-slate-100 md:hidden">
                {soCai.map((s) => (
                  <li
                    key={s.id}
                    className={`py-2.5 ${s.loai === "DIEU_CHINH" ? "-mx-2 rounded-lg bg-amber-50 px-2" : ""}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-navy-800">
                        {s.tenLoai}
                      </span>
                      <b
                        className={s.diem < 0 ? "text-do-700" : "text-navy-700"}
                      >
                        {soCoDau(s.diem)}
                      </b>
                    </div>
                    <div className="text-xs text-slate-600">{s.nguon}</div>
                    {moTaVon(s.von) && (
                      <div className="text-xs text-slate-600">
                        Vốn: {moTaVon(s.von)}
                      </div>
                    )}
                    {s.ghiChu && (
                      <div className="break-words text-xs text-slate-500">
                        {s.ghiChu}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      {ngayGioDep(s.luc)}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-2 hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="py-1.5 pr-2 font-medium">Thời gian</th>
                      <th className="py-1.5 pr-2 font-medium">Loại · nguồn</th>
                      <th className="py-1.5 pr-2 text-right font-medium">
                        Điểm
                      </th>
                      <th className="py-1.5 pr-2 font-medium">Vốn</th>
                      <th className="py-1.5 font-medium">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {soCai.map((s) => (
                      <tr
                        key={s.id}
                        className={`border-t border-slate-100 align-top ${s.loai === "DIEU_CHINH" ? "bg-amber-50" : ""}`}
                      >
                        <td className="whitespace-nowrap py-2 pr-2 text-xs text-slate-500">
                          {ngayGioDep(s.luc)}
                        </td>
                        <td className="py-2 pr-2">
                          <div className="font-medium text-navy-800">
                            {s.tenLoai}
                          </div>
                          <div className="text-xs text-slate-500">
                            {s.nguon}
                          </div>
                        </td>
                        <td
                          className={`whitespace-nowrap py-2 pr-2 text-right font-semibold ${s.diem < 0 ? "text-do-700" : "text-navy-700"}`}
                        >
                          {soCoDau(s.diem)}
                        </td>
                        <td className="py-2 pr-2 text-xs text-slate-600">
                          {moTaVon(s.von) || "—"}
                        </td>
                        <td className="max-w-72 break-words py-2 text-xs text-slate-600">
                          {s.ghiChu || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
