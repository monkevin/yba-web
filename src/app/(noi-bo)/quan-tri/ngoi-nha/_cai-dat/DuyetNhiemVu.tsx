import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { docNhiemVuSua, docTinhNang } from "@/lib/ngoi-nha/cai-dat";
import { soDep } from "@/lib/ngoi-nha/luat";
import { bangNhiemVu, TEN_KY } from "@/lib/ngoi-nha/nhiem-vu";
import { ngayGioDep } from "@/lib/ngoi-nha/thoi-gian";
import DauTruongNutNhiemVu from "./DauTruongNutNhiemVu";

/** Yêu cầu hội viên liên quan để quá số ngày này chưa bấm thì Ban xử lý hộ được. */
const NGAY_CHO_HOI_VIEN = 7;

type YeuCau = Awaited<ReturnType<typeof prisma.nnNhiemVu.findMany>>[number];

/** Duyệt nhiệm vụ BAN_DUYET + xử lý hộ yêu cầu HOI_VIEN chờ quá lâu. */
export default async function DuyetNhiemVu() {
  const bayGio = new Date();
  const moc = new Date(bayGio.getTime() - NGAY_CHO_HOI_VIEN * 86400e3);
  const [tinhNang, sua, choBan, quaHan, choHoiVien] = await Promise.all([
    docTinhNang(),
    docNhiemVuSua(),
    prisma.nnNhiemVu.findMany({
      where: { trangThai: "CHO_XAC_NHAN", cach: "BAN_DUYET" },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.nnNhiemVu.findMany({
      where: {
        trangThai: "CHO_XAC_NHAN",
        cach: "HOI_VIEN",
        createdAt: { lt: moc },
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    }),
    prisma.nnNhiemVu.count({
      where: { trangThai: "CHO_XAC_NHAN", cach: "HOI_VIEN" },
    }),
  ]);
  const bang = bangNhiemVu(sua);

  // Tên người gửi (tài khoản) và hội viên liên quan
  const userIds = [...new Set([...choBan, ...quaHan].map((n) => n.userId))];
  const memberIds = [
    ...new Set(
      quaHan.map((n) => n.lienQuanMemberId).filter((x): x is string => !!x),
    ),
  ];
  const [users, members] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        member: { select: { name: true, company: true, phone: true } },
      },
    }),
    prisma.member.findMany({
      where: { id: { in: memberIds } },
      select: { id: true, name: true, company: true, phone: true },
    }),
  ]);
  const tenUser = new Map(users.map((u) => [u.id, u]));
  const tenMember = new Map(members.map((m) => [m.id, m]));
  const nguoiGui = (id: string) => {
    const u = tenUser.get(id);
    if (!u) return "Hội viên";
    return `${u.member?.name ?? u.name}${u.member?.company ? ` – ${tenDoanhNghiep(u.member.company)}` : ""}`;
  };

  const theYeuCau = (n: YeuCau, hoHoiVien: boolean) => {
    const nd = bang.get(n.maNv);
    const lq = n.lienQuanMemberId ? tenMember.get(n.lienQuanMemberId) : null;
    const soNgay = Math.floor(
      (bayGio.getTime() - n.createdAt.getTime()) / 86400e3,
    );
    return (
      <div key={n.id} className="card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="font-semibold text-navy-800">
              {nd?.ten ?? n.maNv}{" "}
              <span className="font-normal text-slate-500">
                · +{soDep(nd?.diem ?? 0)} điểm
              </span>
              {nd && !nd.bat && (
                <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  nhiệm vụ đang tắt
                </span>
              )}
            </div>
            <div className="text-sm text-slate-600">{nguoiGui(n.userId)}</div>
            <div className="text-xs text-slate-400">
              Gửi lúc {ngayGioDep(n.createdAt)}
              {hoHoiVien && soNgay > 0 ? ` · đã chờ ${soNgay} ngày` : ""}
              {nd?.coGioiHan && nd.ky
                ? ` · giới hạn ${nd.toiDa} lần ${TEN_KY[nd.ky]}`
                : ""}
            </div>
          </div>
          {nd?.xacNhan && (
            <div className="text-xs text-slate-500 sm:max-w-xs sm:text-right">
              {nd.xacNhan}
            </div>
          )}
        </div>
        {hoHoiVien && (
          <p className="mt-2 text-sm text-slate-600">
            Chờ hội viên{" "}
            <b>
              {lq
                ? `${lq.name} – ${tenDoanhNghiep(lq.company)}`
                : "(không còn hồ sơ)"}
            </b>{" "}
            xác nhận
            {lq?.phone ? (
              <>
                {" "}
                ·{" "}
                <a href={`tel:${lq.phone}`} className="text-navy-600 underline">
                  {lq.phone}
                </a>
              </>
            ) : null}
          </p>
        )}
        {n.moTa && (
          <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {n.moTa}
          </p>
        )}
        {n.anh && (
          <a
            href={n.anh}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={n.anh}
              alt="Ảnh minh chứng"
              className="max-h-56 max-w-full rounded-lg ring-1 ring-slate-200"
            />
          </a>
        )}
        <div className="mt-3">
          <DauTruongNutNhiemVu id={n.id} hoHoiVien={hoHoiVien} />
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      {!tinhNang.nhiemVu && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <b>Nhiệm vụ Huynh đệ đang tắt</b>: hội viên chưa gửi được yêu cầu mới,
          hệ thống tạm dừng tự ghi nhận. Các yêu cầu đang chờ dưới đây vẫn xử lý
          được.
        </div>
      )}

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-navy-800">
            Chờ Ban duyệt{" "}
            <span className="text-base font-normal text-slate-500">
              ({choBan.length})
            </span>
          </h2>
          <p className="text-sm text-slate-500">
            Nhiệm vụ cần Ban phụ trách duyệt. Xác nhận xong, hệ thống tự cộng
            điểm và vốn theo mức đang cài ở Nội dung → Nhiệm vụ Huynh đệ.
          </p>
        </div>
        {choBan.length === 0 ? (
          <div className="card px-4 py-10 text-center text-sm text-slate-500">
            Không có yêu cầu nào chờ duyệt.
          </div>
        ) : (
          choBan.map((n) => theYeuCau(n, false))
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-navy-800">
            Chờ hội viên xác nhận quá {NGAY_CHO_HOI_VIEN} ngày{" "}
            <span className="text-base font-normal text-slate-500">
              ({quaHan.length})
            </span>
          </h2>
          <p className="text-sm text-slate-500">
            Nhiệm vụ do hội viên liên quan bấm xác nhận (người được giới thiệu,
            người nhận khách). Hiện {choHoiVien} yêu cầu đang chờ; yêu cầu để
            quá {NGAY_CHO_HOI_VIEN} ngày thì Ban gọi hỏi hội viên rồi xác nhận
            hoặc từ chối hộ.
          </p>
        </div>
        {quaHan.length === 0 ? (
          <div className="card px-4 py-8 text-center text-sm text-slate-500">
            Không có yêu cầu nào chờ quá {NGAY_CHO_HOI_VIEN} ngày.
          </div>
        ) : (
          quaHan.map((n) => theYeuCau(n, true))
        )}
      </section>
    </div>
  );
}
