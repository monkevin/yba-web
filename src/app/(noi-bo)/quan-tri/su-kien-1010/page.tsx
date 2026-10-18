import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { thongKeCheckin1010 } from "@/lib/checkin-1010";
import { docQuyTacDiem } from "@/lib/diem-tu-dong";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { docNhaTaiTro1010 } from "@/lib/tai-tro-1010";
import NutDuyetMoi from "./NutDuyetMoi";
import ONhaTaiTro from "./ONhaTaiTro";

/**
 * TRUNG TÂM ĐIỀU HÀNH SỰ KIỆN 10/10 — một cửa cho Ban Tổ chức:
 * khách mời & thiệp, đăng ký từng phiên, check-in theo giờ, tài trợ & số
 * tiền, đăng ký tham dự tự do, quỹ NCDN và các lối sửa nội dung.
 *
 * Đây là NGUYÊN MẪU cho "nút tạo sự kiện" sau này (Chủ nhiệm đặt hàng
 * 23/09/2026): sau sự kiện 10/10 sẽ tổng quát hoá thành nền tảng nhiều sự
 * kiện — mỗi sự kiện một tên miền con, dữ liệu tách theo sự kiện. Khi làm
 * việc đó, bảng KhachMoi1010 thêm cột suKienId thay vì tạo bảng mới.
 */

const SLUG = "le-chuyen-giao-10-10-2026";

const TEN_PHIEN: Record<string, string> = {
  TOA_DAM: "Tọa đàm",
  CHUYEN_GIAO: "Lễ chuyển giao",
  GALA: "Gala",
};

const TEN_TT: Record<string, string> = {
  CHO_DUYET: "Chờ duyệt",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
};

export default async function TrungTam1010() {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const lich = await prisma.lichHoatDong.findUnique({
    where: { slug: SLUG },
    select: { id: true, gioText: true, diaDiem: true, hanDangKy: true },
  });

  const [
    tongMoi, xacNhan, vang, duToaDam, duLe, duGala, daVao, daVaoLe, daVaoGala,
    soEKip, khachDiCung,
    quyNguoi, quyTien, quyDaDuyet, dkThamDu, dkTaiTro, tienTaiTro,
  ] = await Promise.all([
    prisma.khachMoi1010.count(),
    prisma.khachMoi1010.count({ where: { trangThai: "XAC_NHAN" } }),
    prisma.khachMoi1010.count({ where: { trangThai: "VANG" } }),
    prisma.khachMoi1010.count({ where: { phien: { contains: "TOA_DAM" } } }),
    prisma.khachMoi1010.count({ where: { phien: { contains: "CHUYEN_GIAO" } } }),
    prisma.khachMoi1010.count({ where: { phien: { contains: "GALA" } } }),
    prisma.khachMoi1010.count({ where: { checkinLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinLeLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { checkinGalaLuc: { not: null } } }),
    prisma.khachMoi1010.count({ where: { nhom: "BTC" } }),
    prisma.khachMoi1010.aggregate({
      _sum: { soKhachDiCung: true },
      where: { trangThai: "XAC_NHAN" },
    }),
    prisma.khachMoi1010.count({ where: { dongGopQuy: true } }),
    prisma.khachMoi1010.aggregate({
      _sum: { dongGopSoTien: true },
      where: { dongGopQuy: true },
    }),
    prisma.khachMoi1010.count({ where: { dongGopQuy: true, quyCongKhai: true } }),
    lich
      ? prisma.dangKyHoatDong.findMany({
          where: { lichId: lich.id, loai: "THAM_GIA" },
          orderBy: { createdAt: "desc" },
          take: 8,
        })
      : [],
    lich
      ? prisma.dangKyHoatDong.findMany({
          where: { lichId: lich.id, loai: "TAI_TRO" },
          orderBy: { createdAt: "desc" },
        })
      : [],
    lich
      ? prisma.dangKyHoatDong.aggregate({
          _sum: { soTien: true },
          where: { lichId: lich.id, loai: "TAI_TRO", status: { not: "TU_CHOI" } },
        })
      : { _sum: { soTien: 0 } },
  ]);

  const nhaTaiTro = await docNhaTaiTro1010();
  const [tkCheckin, quyTac] = await Promise.all([
    thongKeCheckin1010(),
    docQuyTacDiem(),
  ]);
  const duKien = xacNhan + (khachDiCung._sum.soKhachDiCung ?? 0);
  const tr = (n: number | null | undefined) =>
    ((n ?? 0) / 1_000_000).toLocaleString("vi-VN");

  const O_SO = [
    ["Khách đã mời", tongMoi],
    ["Đã xác nhận", xacNhan],
    ["Xin vắng", vang],
    ["Dự kiến có mặt", duKien],
    // Ba lần check-in tách phiên (Chủ tịch chốt 25/09) — tính cả ê-kíp BTC
    ["Đã vào TĐ · Lễ · Gala", daVao + " · " + daVaoLe + " · " + daVaoGala],
    ["Ê-kíp BTC (PG, lễ tân…)", soEKip],
    ["Dự Tọa đàm", duToaDam],
    ["Dự Lễ chuyển giao", duLe],
    ["Dự Gala", duGala],
  ] as const;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Trung tâm sự kiện · Lễ chuyển giao 10/10"
        subtitle={`${lich?.gioText ?? ""} · ${lich?.diaDiem ?? ""}`}
      />

      {/* Số liệu sống — 9 ô xếp 3×3 */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {O_SO.map(([nhan, so]) => (
          <div key={nhan} className="card p-4 text-center">
            <p className="text-2xl font-extrabold text-navy-800">{so}</p>
            <p className="mt-0.5 text-xs font-medium text-slate-500">{nhan}</p>
          </div>
        ))}
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <div className="card border-l-4 border-l-amber-400 p-4">
          <p className="text-sm font-bold text-navy-800">❤️ Quỹ Nhịp Cầu Doanh Nhân</p>
          <p className="mt-1 text-2xl font-extrabold text-amber-600">
            {tr(quyTien._sum.dongGopSoTien)} triệu
          </p>
          <p className="text-xs text-slate-500">
            {quyNguoi} cam kết · {quyDaDuyet} đã duyệt hiện bảng vàng
          </p>
        </div>
        <div className="card border-l-4 border-l-do-500 p-4">
          <p className="text-sm font-bold text-navy-800">🤝 Đăng ký tài trợ từ landing</p>
          <p className="mt-1 text-2xl font-extrabold text-do-600">
            {tr(tienTaiTro._sum.soTien)} triệu
          </p>
          <p className="text-xs text-slate-500">{dkTaiTro.length} lượt đăng ký gói</p>
        </div>
      </div>

      {/* Các khu làm việc */}
      <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["/quan-tri/khach-moi-1010", "1 · Danh sách khách mời & thiệp", "Thêm khách, chép link thiệp, xếp bàn, tab theo phiên"],
          ["/quan-tri/khach-moi-1010?phien=TOA_DAM", "2 · Danh sách từng phiên", "Tọa đàm · Lễ chuyển giao · Gala — kèm trạng thái đã tới"],
          ["/quan-tri/khach-moi-1010/check-in", "3 · Quét mã QR / check-in tại cửa", "Lễ tân bật camera quét mã QR trên thư mời hoặc thẻ hội viên; có ô tìm tên dự phòng"],
          ["/quan-tri/lich-hoat-dong", "4+5 · Duyệt tài trợ & đăng ký tự do", "Đăng ký từ landing (mục Lễ chuyển giao) — duyệt tại đây"],
          ["/quan-tri/lich-hoat-dong", "6 · Sửa giờ / địa điểm / hạn đăng ký", "Sửa bản ghi lịch là landing + thiệp đổi theo"],
          ["/1010", "Xem landing 10/10 →", "Trang khách nhìn thấy — mở tab mới"],
        ].map(([href, ten, mo]) => (
          <Link key={ten} href={href} className="tile p-4" target={href === "/1010" ? "_blank" : undefined}>
            <p className="font-bold text-navy-800">{ten}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{mo}</p>
          </Link>
        ))}
      </div>

      {/* Check-in bằng mã QR → điểm hoạt động (Chủ tịch đặt hàng 01/10/2026) */}
      <div className="card mb-8 border-l-4 border-l-navy-500 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-bold text-navy-800">
              ⭐ Check-in bằng mã QR → điểm hoạt động hội viên
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {quyTac.bat ? (
                <>
                  Hội viên Chợ Lớn có mặt phiên nào được{" "}
                  <b className="text-navy-800">+{quyTac.phien1010} điểm</b> phiên
                  đó (đủ ba phiên {quyTac.phien1010 * 3} điểm), máy tự ghi vào
                  Bảng hoạt động. Khách ngoài Chi hội được ghi nhận có mặt,
                  không có điểm.
                </>
              ) : (
                <b className="text-do-600">Đang TẮT cộng điểm tự động.</b>
              )}
              {quyTac.dienTap && (
                <b className="text-amber-700">
                  {" "}
                  Đang bật DIỄN TẬP — nhớ tắt trước ngày 10.10.
                </b>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/quan-tri/khach-moi-1010/check-in" className="btn-danger">
              📷 Mở máy quét
            </Link>
            <Link href="/bang-hoat-dong" className="btn-ghost">
              Bảng hoạt động &amp; quy tắc điểm →
            </Link>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["Hội viên Chợ Lớn có mặt", tkCheckin.hoiVienCoMat, ""],
              ["Điểm đã cộng", tkCheckin.tongDiem, "/bang-hoat-dong"],
              ["Khách ngoài Chi hội có mặt", tkCheckin.khachNgoaiCoMat, ""],
              [
                "Khách nhóm Chợ Lớn chưa ghép hồ sơ",
                tkCheckin.chuaGhepChoLon,
                "/quan-tri/khach-moi-1010?hv=chua",
              ],
            ] as const
          ).map(([nhan, so, duong]) => (
            <div key={nhan} className="rounded-xl bg-navy-50/70 p-3 text-center">
              <p className="text-xl font-extrabold text-navy-800">{so}</p>
              {duong ? (
                <Link href={duong} className="text-xs font-medium text-navy-600 underline">
                  {nhan}
                </Link>
              ) : (
                <p className="text-xs font-medium text-slate-500">{nhan}</p>
              )}
            </div>
          ))}
        </div>
        {tkCheckin.luotThu > 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Còn <b>{tkCheckin.luotThu} lượt check-in thử</b> ghi trước ngày 10.10
            — xoá ở{" "}
            <Link href="/quan-tri/khach-moi-1010/check-in" className="font-semibold underline">
              màn check-in
            </Link>{" "}
            trước khi đón khách.
          </p>
        )}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-semibold text-navy-700">
            Khách có mặt theo người phụ trách mời
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[360px] text-sm">
              <thead>
                <tr className="border-b border-navy-100 text-left text-xs font-bold text-navy-700 uppercase">
                  <th className="px-3 py-2">Người phụ trách</th>
                  <th className="px-3 py-2 text-right">Đã mời</th>
                  <th className="px-3 py-2 text-right">Có mặt</th>
                </tr>
              </thead>
              <tbody>
                {tkCheckin.theoPhuTrach.map((p) => (
                  <tr key={p.ten} className="border-b border-navy-50">
                    <td className="px-3 py-2 font-semibold text-navy-800">{p.ten}</td>
                    <td className="px-3 py-2 text-right text-slate-600">{p.moi}</td>
                    <td className="px-3 py-2 text-right font-bold text-emerald-700">
                      {p.coMat}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">
            Bảng này để Ban Điều hành ghi nhận công mời khách — máy KHÔNG tự
            cộng điểm cho người mời; muốn cộng thì dùng nút “+ Cộng điểm” ở
            Bảng hoạt động.
          </p>
        </details>
      </div>

      {/* Danh sách NTT chính thức cho khung tri ân trên landing */}
      <details className="card mb-8 p-5">
        <summary className="cursor-pointer font-bold text-navy-800">
          🙏 Nhà tài trợ &amp; đối tác đồng hành — khung tri ân trên landing
          ({nhaTaiTro.goi.length} gói)
        </summary>
        <div className="mt-4">
          <ONhaTaiTro van={nhaTaiTro.van} />
        </div>
      </details>

      {/* Tài trợ mới nhất */}
      <h2 className="mb-2 font-bold text-navy-800">Đăng ký tài trợ (từ nút bấm gói trên landing)</h2>
      <div className="card mb-6 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50 text-left text-xs font-bold text-navy-700 uppercase">
              <th className="px-3 py-2">Người đăng ký</th>
              <th className="px-3 py-2">Gói</th>
              <th className="px-3 py-2">Số tiền</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {dkTaiTro.map((d) => (
              <tr key={d.id} className="border-b border-navy-50">
                <td className="px-3 py-2">
                  <p className="font-semibold text-navy-800">{d.name}</p>
                  <p className="text-xs text-slate-500">
                    {[d.company, d.phone].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-3 py-2">{d.mucTaiTro ?? d.hienVat ?? "—"}</td>
                <td className="px-3 py-2 font-bold text-do-600">
                  {d.soTien ? d.soTien.toLocaleString("vi-VN") + "đ" : "hiện vật"}
                </td>
                <td className="px-3 py-2 text-xs">{TEN_TT[d.status] ?? d.status}</td>
              </tr>
            ))}
            {dkTaiTro.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-500">
                  Chưa có đăng ký tài trợ nào từ landing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Đăng ký tham dự tự do mới nhất */}
      <h2 className="mb-2 font-bold text-navy-800">
        Đăng ký tham dự tự do mới nhất (người chưa có thư mời)
      </h2>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <tbody>
            {dkThamDu.map((d) => (
              <tr key={d.id} className="border-b border-navy-50">
                <td className="px-3 py-2">
                  <p className="font-semibold text-navy-800">{d.name}</p>
                  <p className="text-xs text-slate-500">
                    {[d.company, d.chucVu, d.phone].filter(Boolean).join(" · ")}
                  </p>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {[
                    d.soNguoi > 1 ? `${d.soNguoi} người` : "",
                    (d.phien ?? "")
                      .split(",")
                      .filter(Boolean)
                      .map((p) => TEN_PHIEN[p] ?? p)
                      .join(" · "),
                    d.phien?.includes("GALA")
                      ? `phí Gala ${(d.soNguoi * 1_100_000).toLocaleString("vi-VN")}đ`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" — ")}
                </td>
                <td className="px-3 py-2 text-xs">
                  {d.status === "CHO_DUYET" ? (
                    <NutDuyetMoi id={d.id} />
                  ) : (
                    (TEN_TT[d.status] ?? d.status)
                  )}
                </td>
              </tr>
            ))}
            {dkThamDu.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-slate-500">
                  Chưa có đăng ký tự do nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Duyệt / từ chối các đăng ký này ở{" "}
        <Link href="/quan-tri/lich-hoat-dong" className="font-semibold text-navy-600 underline">
          Lịch hoạt động → Lễ chuyển giao
        </Link>
        . Thiệp JPG và ảnh proposal muốn thay thì gửi file cho kỹ thuật (nằm
        trong mã nguồn, đổi 5 phút).
      </p>
    </div>
  );
}
