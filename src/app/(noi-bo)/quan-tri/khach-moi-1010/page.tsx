import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { KHONG_HOI_VIEN, coHoSo, laNhomChoLon } from "@/lib/checkin-1010";
import { anhKhach1010 } from "@/lib/khach-1010";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import DkChoDuyet from "./DkChoDuyet";
import {
  FormNhapHangLoat,
  FormThemKhach,
  NutAnDanhSach,
  NutChepLink,
  NutCheckin,
  NutDongBoSheet,
  NutGhepTinhLai,
  NutHienQuy,
  NutTaiAnhKhach,
  NutTaiThiep,
  NutXoa,
  OBan,
  OHoiVien,
} from "./CacNut";

/**
 * Quản lý KHÁCH MỜI Lễ chuyển giao 10/10: danh sách + link thư mời riêng
 * từng khách (gửi Zalo), trạng thái xác nhận, xếp bàn, check-in.
 * Màn check-in tại cửa (bản to cho điện thoại): /quan-tri/khach-moi-1010/check-in
 */

const TEN_PHIEN: Record<string, string> = {
  TOA_DAM: "Tọa đàm",
  CHUYEN_GIAO: "Lễ chuyển giao",
  GALA: "Gala",
};

const TEN_NHOM: Record<string, string> = {
  HOI_VIEN: "Hội viên",
  LANH_DAO: "Lãnh đạo",
  TAI_TRO: "Nhà tài trợ",
  KHACH_MOI: "Khách mời",
  BTC: "Ê-kíp BTC",
};

const TEN_TT: Record<string, { nhan: string; lop: string }> = {
  CHO_PHAN_HOI: { nhan: "Chờ phản hồi", lop: "bg-slate-100 text-slate-600" },
  XAC_NHAN: { nhan: "Đã xác nhận", lop: "bg-emerald-100 text-emerald-700" },
  VANG: { nhan: "Xin vắng", lop: "bg-amber-100 text-amber-700" },
};

export default async function KhachMoi1010({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const loc = typeof sp.tt === "string" ? sp.tt : "";
  const phienLoc = typeof sp.phien === "string" ? sp.phien : "";
  const nhomLoc = typeof sp.nhom === "string" ? sp.nhom : "";

  const where: Record<string, unknown> = {};
  if (q) {
    where.OR = [
      { ten: { contains: q } },
      { donVi: { contains: q } },
      { phone: { contains: q } },
      { ma: { contains: q.toUpperCase() } },
    ];
  }
  if (loc) where.trangThai = loc;
  // Tab theo phiên: cột phien lưu "TOA_DAM,CHUYEN_GIAO,GALA" — contains đủ
  // vì ba mã không mã nào là chuỗi con của mã nào
  if (phienLoc) where.phien = { contains: phienLoc };
  if (nhomLoc) where.nhom = nhomLoc;
  // Bấm vào ô số "Quan tâm tài trợ" / "Góp quỹ NCDN" để lọc đúng nhóm đó
  const dhLoc = typeof sp.dh === "string" ? sp.dh : "";
  if (dhLoc === "taitro") where.quanTamTaiTro = true;
  if (dhLoc === "quy") where.dongGopQuy = true;
  // Lọc theo việc ghép hồ sơ hội viên (check-in cộng điểm cần bước ghép này)
  const hvLoc = typeof sp.hv === "string" ? sp.hv : "";
  const NHOM_CHO_LON = [{ nhom: "HOI_VIEN" }, { nhom: { contains: "CHỢ LỚN" } }];
  if (hvLoc === "chua") {
    where.memberId = null;
    where.AND = [{ OR: NHOM_CHO_LON }];
  }
  if (hvLoc === "co") {
    where.AND = [{ memberId: { not: null } }, { memberId: { not: KHONG_HOI_VIEN } }];
  }

  const [khach, tong, xacNhan, vang, daVao, khachDiCung, soTaiTro, soGopQuy] = await Promise.all([
    prisma.khachMoi1010.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
    }),
    prisma.khachMoi1010.count(),
    prisma.khachMoi1010.count({ where: { trangThai: "XAC_NHAN" } }),
    prisma.khachMoi1010.count({ where: { trangThai: "VANG" } }),
    prisma.khachMoi1010.count({ where: { checkinLuc: { not: null } } }),
    prisma.khachMoi1010.aggregate({
      _sum: { soKhachDiCung: true },
      where: { trangThai: "XAC_NHAN" },
    }),
    prisma.khachMoi1010.count({ where: { quanTamTaiTro: true } }),
    prisma.khachMoi1010.count({ where: { dongGopQuy: true } }),
  ]);
  const [duToaDam, duLe, duGala, quyTong, daVaoLe, daVaoGala, soEKip] =
    await Promise.all([
      prisma.khachMoi1010.count({ where: { phien: { contains: "TOA_DAM" } } }),
      prisma.khachMoi1010.count({ where: { phien: { contains: "CHUYEN_GIAO" } } }),
      prisma.khachMoi1010.count({ where: { phien: { contains: "GALA" } } }),
      prisma.khachMoi1010.aggregate({ _sum: { dongGopSoTien: true } }),
      prisma.khachMoi1010.count({ where: { checkinLeLuc: { not: null } } }),
      prisma.khachMoi1010.count({ where: { checkinGalaLuc: { not: null } } }),
      prisma.khachMoi1010.count({ where: { nhom: "BTC" } }),
    ]);
  const tienQuy = quyTong._sum.dongGopSoTien ?? 0;
  const tongNguoiDuKien = xacNhan + (khachDiCung._sum.soKhachDiCung ?? 0);

  // Hồ sơ hội viên của các khách đang hiện + số liệu ghép
  const idHoiVien = [...new Set(khach.map((k) => k.memberId).filter(coHoSo))];
  const [dsHoiVien, soDaGhep, soChuaGhep] = await Promise.all([
    idHoiVien.length
      ? prisma.member.findMany({
          where: { id: { in: idHoiVien } },
          select: { id: true, code: true, name: true },
        })
      : [],
    prisma.khachMoi1010.count({
      where: {
        AND: [{ memberId: { not: null } }, { memberId: { not: KHONG_HOI_VIEN } }],
      },
    }),
    prisma.khachMoi1010.count({ where: { memberId: null, OR: NHOM_CHO_LON } }),
  ]);
  const hoiVienTheoId = new Map(dsHoiVien.map((m) => [m.id, m]));

  // Đăng ký tự do từ landing đang chờ duyệt — hiện ngay tại đây (Chủ tịch
  // chốt 25/09: một cửa cho BTC, khỏi chạy sang trang lịch hoạt động)
  const lich1010 = await prisma.lichHoatDong.findUnique({
    where: { slug: "le-chuyen-giao-10-10-2026" },
    select: { id: true },
  });
  const dkChoDuyet = lich1010
    ? await prisma.dangKyHoatDong.findMany({
        where: { lichId: lich1010.id, loai: "THAM_GIA", status: "CHO_DUYET" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, phone: true, company: true, chucVu: true,
          soNguoi: true, phien: true, ghiChu: true,
        },
      })
    : [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Khách mời Lễ chuyển giao 10/10"
        subtitle="Mỗi khách một link thư mời riêng — gửi qua Zalo, khách tự xác nhận; BTC xếp bàn và check-in tại đây"
      />

      {/* Số liệu nhanh — ô có gạch chân bấm được để lọc đúng danh sách đó */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {(
          [
            ["Đã mời", tong, ""],
            ["Đã xác nhận", xacNhan, "?tt=XAC_NHAN"],
            ["Xin vắng", vang, "?tt=VANG"],
            ["Dự kiến có mặt", tongNguoiDuKien, ""],
            ["Đã vào TĐ · Lễ · Gala", daVao + " · " + daVaoLe + " · " + daVaoGala, ""],
            ["Quan tâm tài trợ", soTaiTro, "?dh=taitro"],
            [
              "Góp quỹ NCDN",
              tienQuy
                ? soGopQuy + " ng · " + (tienQuy / 1_000_000).toLocaleString("vi-VN") + " tr"
                : soGopQuy,
              "?dh=quy",
            ],
          ] as const
        ).map(([nhan, so, duong]) =>
          duong ? (
            <Link
              key={nhan}
              href={"/quan-tri/khach-moi-1010" + duong}
              className="card p-4 text-center transition hover:shadow-md hover:ring-2 hover:ring-navy-200"
              title={`Bấm để xem danh sách: ${nhan}`}
            >
              <p className="text-2xl font-extrabold text-navy-800">{so}</p>
              <p className="mt-0.5 text-xs font-medium text-navy-600 underline decoration-navy-300 underline-offset-2">
                {nhan}
              </p>
            </Link>
          ) : (
            <div key={nhan} className="card p-4 text-center">
              <p className="text-2xl font-extrabold text-navy-800">{so}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-500">{nhan}</p>
            </div>
          )
        )}
      </div>
      {dhLoc && (
        <p className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          Đang lọc:{" "}
          {dhLoc === "taitro" ? "khách quan tâm tài trợ / đồng hành" : "khách góp quỹ NCDN"}{" "}
          ({khach.length}) ·{" "}
          <Link href="/quan-tri/khach-moi-1010" className="underline">
            Bỏ lọc
          </Link>
        </p>
      )}

      <div className="mb-5 flex flex-wrap gap-2">
        <Link href="/quan-tri/khach-moi-1010/check-in" className="btn-danger">
          📷 Quét mã QR / check-in tại cửa
        </Link>
        <Link href="/quan-tri/khach-moi-1010/da-checkin" className="btn-primary">
          ✅ Danh sách đã check-in
        </Link>
        <Link href="/quan-tri/khach-moi-1010/boc-tham" className="btn-ghost">
          🎁 Bốc thăm may mắn
        </Link>
        <Link href="/quan-tri/khach-moi-1010/chao-mung" className="btn-ghost">
          📺 Màn chào mừng ở sảnh
        </Link>
        <a href="/api/khach-moi-1010/csv" className="btn-ghost">
          ⬇ Tải Excel danh sách
        </a>
        <NutDongBoSheet />
        <Link href="/1010" className="btn-ghost" target="_blank">
          Xem landing 10/10 →
        </Link>
      </div>

      {/* Ghép khách ↔ hồ sơ hội viên: check-in của hội viên tự cộng điểm */}
      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3 text-sm text-navy-800">
        <span>
          ⭐ Check-in của hội viên Chợ Lớn tự cộng{" "}
          <Link href="/bang-hoat-dong" className="font-semibold underline">
            điểm hoạt động
          </Link>
          :{" "}
          <Link href="/quan-tri/khach-moi-1010?hv=co" className="font-bold underline">
            {soDaGhep} khách đã ghép hồ sơ hội viên
          </Link>
          {soChuaGhep > 0 && (
            <>
              {" · "}
              <Link
                href="/quan-tri/khach-moi-1010?hv=chua"
                className="font-bold text-amber-700 underline"
              >
                {soChuaGhep} khách nhóm Chợ Lớn chưa ghép
              </Link>
            </>
          )}
        </span>
        <NutGhepTinhLai />
      </div>
      {hvLoc && (
        <p className="mb-3 rounded-xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
          Đang lọc:{" "}
          {hvLoc === "chua"
            ? "khách nhóm Chợ Lớn CHƯA ghép hồ sơ hội viên — bấm “ghép hội viên” dưới tên từng người"
            : "khách đã ghép hồ sơ hội viên"}{" "}
          ({khach.length}) ·{" "}
          <Link href="/quan-tri/khach-moi-1010" className="underline">
            Bỏ lọc
          </Link>
        </p>
      )}

      {/* Đăng ký từ landing chờ duyệt — một cửa ngay tại đây */}
      <DkChoDuyet ds={dkChoDuyet} />

      {/* Thêm khách */}
      <details className="card mb-3 p-5" open={tong === 0}>
        <summary className="cursor-pointer font-bold text-navy-800">
          + Thêm một khách mời
        </summary>
        <div className="mt-4">
          <FormThemKhach />
        </div>
      </details>
      <details className="card mb-5 p-5">
        <summary className="cursor-pointer font-bold text-navy-800">
          📋 Dán danh sách từ Excel (nhiều khách một lần)
        </summary>
        <div className="mt-4">
          <FormNhapHangLoat />
        </div>
      </details>

      {/* Tab danh sách theo phiên — Chủ nhiệm chốt 23/09 */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {[
          ["", "Tất cả (" + tong + ")"],
          ["TOA_DAM", "Dự Tọa đàm (" + duToaDam + ")"],
          ["CHUYEN_GIAO", "Dự Lễ chuyển giao (" + duLe + ")"],
          ["GALA", "Dự Gala (" + duGala + ")"],
        ].map(([ma, nhan]) => (
          <Link
            key={ma}
            href={ma ? "/quan-tri/khach-moi-1010?phien=" + ma : "/quan-tri/khach-moi-1010"}
            className={
              "rounded-lg px-3 py-2 text-sm font-medium transition " +
              (phienLoc === ma && !nhomLoc
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50")
            }
          >
            {nhan}
          </Link>
        ))}
        <Link
          href="/quan-tri/khach-moi-1010?nhom=BTC"
          className={
            "rounded-lg px-3 py-2 text-sm font-medium transition " +
            (nhomLoc === "BTC"
              ? "bg-navy-600 text-white"
              : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50")
          }
          title="PG, lễ tân, photo, sinh viên hỗ trợ… — thêm ở ô '+ Thêm một khách mời', chọn nhóm Ê-kíp BTC"
        >
          {"Ê-kíp BTC (" + soEKip + ")"}
        </Link>
      </div>

      {/* Lọc */}
      <form className="mb-3 flex flex-wrap gap-2">
        {phienLoc && <input type="hidden" name="phien" value={phienLoc} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Tìm tên, đơn vị, SĐT, mã thư mời…"
          className="inp max-w-xs"
        />
        <select name="tt" defaultValue={loc} className="inp max-w-[180px]">
          <option value="">Mọi trạng thái</option>
          <option value="CHO_PHAN_HOI">Chờ phản hồi</option>
          <option value="XAC_NHAN">Đã xác nhận</option>
          <option value="VANG">Xin vắng</option>
        </select>
        <button className="btn-primary">Lọc</button>
      </form>

      {/* Bảng khách */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50 text-left text-xs font-bold text-navy-700 uppercase">
              <th className="px-3 py-2.5">Khách mời</th>
              <th className="px-3 py-2.5">Nhóm</th>
              <th className="px-3 py-2.5">Thư mời</th>
              <th className="px-3 py-2.5">Phản hồi</th>
              <th className="px-3 py-2.5">Bàn</th>
              <th className="px-3 py-2.5">Check-in</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {khach.map((k) => {
              const tt = TEN_TT[k.trangThai] ?? TEN_TT.CHO_PHAN_HOI;
              return (
                <tr key={k.id} className="border-b border-navy-50 align-top">
                  <td className="px-3 py-2.5">
                    <p className="font-semibold text-navy-800">
                      {[k.danhXung, k.ten].filter(Boolean).join(" ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {[k.chucDanh, k.donVi].filter(Boolean).join(" · ")}
                    </p>
                    {k.phone && <p className="text-xs text-slate-400">{k.phone}</p>}
                    {k.ghiChu && (
                      <p className="mt-0.5 text-xs text-amber-700">💬 {k.ghiChu}</p>
                    )}
                    {k.nhom !== "BTC" && (
                      <OHoiVien
                        id={k.id}
                        hoiVien={
                          coHoSo(k.memberId)
                            ? (hoiVienTheoId.get(k.memberId) ?? null)
                            : null
                        }
                        khongPhai={k.memberId === KHONG_HOI_VIEN}
                        nhomChoLon={laNhomChoLon(k.nhom)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-slate-600">
                    {TEN_NHOM[k.nhom] ?? k.nhom}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-xs font-bold text-navy-700">{k.ma}</p>
                    <div className="mt-0.5 flex flex-col items-start gap-1">
                      <NutChepLink ma={k.ma} />
                      <NutTaiThiep id={k.id} coThiep={!!k.soThu} />
                      <NutTaiAnhKhach
                        id={k.id}
                        coAnh={!!anhKhach1010(k.soThu, k.ma)}
                      />
                      {!k.soThu && (
                        <span className="text-[11px] text-amber-700">
                          chưa có ảnh thiệp
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tt.lop}`}>
                      {tt.nhan}
                    </span>
                    {k.trangThai === "XAC_NHAN" && k.soKhachDiCung > 0 && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        +{k.soKhachDiCung} khách đi cùng
                      </p>
                    )}
                    {k.phien && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {k.phien.split(",").map((p) => TEN_PHIEN[p] ?? p).join(" · ")}
                      </p>
                    )}
                    {k.phienDuocMoi && (
                      <p className="mt-0.5 text-[11px] font-semibold text-sky-700">
                        Suất mời:{" "}
                        {k.phienDuocMoi
                          .split(",")
                          .map((p) => TEN_PHIEN[p] ?? p)
                          .join(" · ")}
                      </p>
                    )}
                    {(k.quanTamTaiTro || k.dongGopQuy) && (
                      <p className="mt-0.5 text-xs font-semibold text-amber-700">
                        {[
                          k.quanTamTaiTro && "💛 Quan tâm tài trợ",
                          k.dongGopQuy &&
                            "❤️ Góp quỹ NCDN" +
                              (k.dongGopSoTien
                                ? " " + k.dongGopSoTien.toLocaleString("vi-VN") + "đ"
                                : ""),
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                        {k.dongHanhGhiChu ? ` — ${k.dongHanhGhiChu}` : ""}
                      </p>
                    )}
                    {k.dongGopQuy && (
                      <div className="mt-1">
                        <NutHienQuy id={k.id} dangHien={k.quyCongKhai} />
                      </div>
                    )}
                    {(k.trangThai === "XAC_NHAN" || k.nhom === "TAI_TRO") && (
                      <div className="mt-1">
                        <NutAnDanhSach id={k.id} dangAn={k.anKhoiDanhSach} />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    <OBan id={k.id} ban={k.ban} />
                  </td>
                  <td className="px-3 py-2.5">
                    {(k.checkinLuc || k.checkinLeLuc || k.checkinGalaLuc) && (
                      <p className="mb-1 text-xs font-bold text-emerald-700">
                        {[
                          ["TĐ", k.checkinLuc] as const,
                          ["Lễ", k.checkinLeLuc] as const,
                          ["Gala", k.checkinGalaLuc] as const,
                        ]
                          .filter(([, d]) => d)
                          .map(
                            ([n, d]) =>
                              n +
                              " " +
                              d!.toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                timeZone: "Asia/Ho_Chi_Minh",
                              })
                          )
                          .join(" · ")}
                      </p>
                    )}
                    <NutCheckin
                      id={k.id}
                      daVao={!!k.checkinLuc}
                      daVaoLe={!!k.checkinLeLuc}
                      daVaoGala={!!k.checkinGalaLuc}
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <NutXoa id={k.id} ten={k.ten} />
                  </td>
                </tr>
              );
            })}
            {khach.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-slate-500">
                  {tong === 0
                    ? "Chưa có khách mời nào — thêm một khách hoặc dán danh sách từ Excel ở trên."
                    : "Không có khách nào khớp bộ lọc."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-slate-500">
        Link thư mời dạng <span className="font-mono">ybacholon.vn/1010/moi/CL-XXXXX</span>{" "}
        — bấm “Chép link” rồi gửi Zalo cho đúng người; ai giữ link là chủ thư
        mời, đừng đăng link lên nhóm chung.
      </p>
    </div>
  );
}
