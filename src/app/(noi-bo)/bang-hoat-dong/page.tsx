import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { docQuyTacDiem } from "@/lib/diem-tu-dong";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import {
  FormCongDiem,
  FormQuyTacTuDong,
  NutCongNhanh,
  NutXoaDiem,
} from "./CacNutDiem";
import { LOAI_DIEM } from "./loai-diem";

/**
 * BẢNG HOẠT ĐỘNG HỘI VIÊN (Chủ tịch chốt 24/09/2026) — xếp hạng theo sổ
 * điểm cộng tay, TÍNH TỪ 10.10.2026 (đóng góp cho Lễ chuyển giao trở đi).
 * Thư ký / Ban Điều hành cộng điểm bằng nút "+"; mỗi lần cộng có lý do +
 * người xác nhận, sổ chi tiết hiện ngay dưới bảng để mọi người dò lại.
 *
 * Từ 01/10/2026 có thêm dòng TỰ ĐỘNG: hội viên check-in bằng mã QR ở sự
 * kiện thì máy tự ghi một dòng "Tham gia hoạt động" (cột `nguon` có giá
 * trị). Quy tắc điểm chỉnh ngay tại trang này — src/lib/diem-tu-dong.ts.
 */

export const dynamic = "force-dynamic";

export default async function BangHoatDong() {
  const user = await requireUserPage();
  const laBTC = co(user, QUYEN.VINH_DANH_QUAN_LY);
  const laLanhDao = user.role === "ADMIN";

  const [quyTac, tongTheoNguoi, soGanDay] = await Promise.all([
    docQuyTacDiem(),
    prisma.diemHoatDong.groupBy({
      by: ["memberId"],
      _sum: { diem: true },
      _count: { _all: true },
    }),
    prisma.diemHoatDong.findMany({
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { member: { select: { name: true, code: true } } },
    }),
  ]);

  const members = tongTheoNguoi.length
    ? await prisma.member.findMany({
        where: { id: { in: tongTheoNguoi.map((t) => t.memberId) } },
        select: { id: true, name: true, code: true, company: true },
      })
    : [];
  const theoId = new Map(members.map((m) => [m.id, m]));
  const bang = tongTheoNguoi
    .map((t) => ({
      member: theoId.get(t.memberId),
      diem: t._sum.diem ?? 0,
      soLan: t._count._all,
    }))
    .filter((x) => x.member)
    .sort((a, b) => b.diem - a.diem);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Bảng hoạt động hội viên"
        subtitle="Ghi nhận cống hiến từ 10.10.2026 — tài trợ (1 triệu = 1 điểm), vai trò Ban Tổ chức × hệ số quy mô, giới thiệu hội viên mới, tham gia hoạt động. Bảng này TÁCH BIỆT với điểm game Ngôi nhà Chợ Lớn."
      />

      <p className="mb-4 rounded-xl border border-navy-100 bg-navy-50/60 px-4 py-3 text-sm leading-relaxed text-navy-800">
        ⭐ <b>Check-in bằng mã QR là có điểm:</b>{" "}
        {quyTac.bat ? (
          <>
            Lễ chuyển giao 10.10 — mỗi phiên có mặt <b>+{quyTac.phien1010} điểm</b>{" "}
            (đủ ba phiên {quyTac.phien1010 * 3} điểm); các sự kiện sau đó — mỗi
            lần được Ban Tổ chức quét thẻ hội viên <b>+{quyTac.suKien} điểm</b>.
            Máy tự ghi, không cần thư ký cộng tay.
          </>
        ) : (
          <>hiện Ban Điều hành đang tạm tắt cộng điểm tự động.</>
        )}
      </p>

      {laBTC && (
        <div className="mb-6 space-y-3">
          <details open={bang.length === 0}>
            <summary className="btn-primary inline-flex cursor-pointer">
              + Cộng điểm cho hội viên
            </summary>
            <div className="mt-3">
              <FormCongDiem />
            </div>
          </details>
          <details>
            <summary className="btn-ghost inline-flex cursor-pointer">
              ⚙ Quy tắc cộng điểm tự động khi check-in
              {quyTac.dienTap ? " · ĐANG DIỄN TẬP" : ""}
            </summary>
            <div className="mt-3">
              <FormQuyTacTuDong quyTac={quyTac} />
            </div>
          </details>
        </div>
      )}

      {/* Bảng xếp hạng */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-navy-100 bg-navy-50 text-left text-xs font-bold text-navy-700 uppercase">
              <th className="w-14 px-3 py-2.5 text-center">Hạng</th>
              <th className="px-3 py-2.5">Hội viên</th>
              <th className="px-3 py-2.5 text-right">Điểm</th>
              <th className="px-3 py-2.5 text-center">Lượt ghi nhận</th>
              {laBTC && <th className="w-12 px-3 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {bang.map((x, i) => (
              <tr key={x.member!.id} className="border-b border-navy-50">
                <td className="px-3 py-2.5 text-center text-lg font-extrabold text-navy-800">
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}
                </td>
                <td className="px-3 py-2.5">
                  <p className="font-semibold text-navy-800">
                    {x.member!.name}
                    <span className="ml-1.5 text-xs font-normal text-slate-400">
                      {x.member!.code}
                    </span>
                  </p>
                  {x.member!.company && (
                    <p className="text-xs text-slate-500">
                      {tenDoanhNghiep(x.member!.company)}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right text-lg font-extrabold text-do-600">
                  {x.diem.toLocaleString("vi-VN")}
                </td>
                <td className="px-3 py-2.5 text-center text-slate-500">{x.soLan}</td>
                {laBTC && (
                  <td className="px-3 py-2.5">
                    <NutCongNhanh
                      member={{ id: x.member!.id, ten: x.member!.name }}
                    />
                  </td>
                )}
              </tr>
            ))}
            {bang.length === 0 && (
              <tr>
                <td colSpan={laBTC ? 5 : 4} className="px-3 py-10 text-center text-slate-500">
                  Chưa có điểm nào — sổ bắt đầu ghi từ Lễ chuyển giao 10.10.2026.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sổ chi tiết để dò lại */}
      <h2 className="mt-8 mb-2 font-bold text-navy-800">
        Sổ ghi nhận gần đây ({soGanDay.length})
      </h2>
      <div className="card divide-y divide-navy-50">
        {soGanDay.map((d) => (
          <div key={d.id} className="flex items-start gap-3 px-4 py-3 text-sm">
            <span
              className={`w-16 shrink-0 text-right font-extrabold ${
                d.diem >= 0 ? "text-emerald-600" : "text-do-600"
              }`}
            >
              {d.diem >= 0 ? "+" : ""}
              {d.diem}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-navy-800">
                {d.member.name}
                <span className="ml-2 rounded-full bg-navy-50 px-2 py-0.5 text-[11px] font-medium text-navy-600">
                  {LOAI_DIEM[d.loai] ?? d.loai}
                </span>
                {d.nguon && (
                  <span
                    className="ml-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700"
                    title="Máy tự ghi theo check-in — huỷ check-in thì điểm tự rút"
                  >
                    tự động · check-in QR
                  </span>
                )}
              </p>
              <p className="mt-0.5 leading-relaxed text-slate-600">{d.lyDo}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {d.createdAt.toLocaleDateString("vi-VN")} · ✓ xác nhận:{" "}
                <b className="text-slate-600">{d.nguoiCongTen}</b>
              </p>
            </div>
            {laLanhDao && !d.nguon && <NutXoaDiem id={d.id} />}
          </div>
        ))}
        {soGanDay.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-slate-500">
            Chưa có dòng ghi nhận nào.
          </p>
        )}
      </div>
    </div>
  );
}
