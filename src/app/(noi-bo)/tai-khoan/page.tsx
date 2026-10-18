import Link from "next/link";
import { requireUserPage, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DEAL_STATUS, pendingConfirmMemberId } from "@/lib/deal";
import { resolvePeriod } from "@/lib/period";
import { overview, topSellers, topBuyers } from "@/lib/stats";
import { formatShortVnd, formatVnd, formatDate } from "@/lib/format";
import { StatCard, StatusBadge, PageHeader, EmptyState } from "@/components/ui";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { daLatLaBaiHomNay } from "@/lib/ngoi-nha/la-bai";
import { soHoSoCungSdt } from "@/lib/dang-nhap";
import {
  cheSoDienThoai,
  chuanSoDienThoai,
  laSoDienThoaiVN,
} from "@/lib/so-dien-thoai";

export default async function DashboardPage() {
  const user = await requireUserPage();
  const period = resolvePeriod("thang-nay");

  const [stats, sellers, buyers, recent, dangNhap, laBai] = await Promise.all([
    overview(period),
    topSellers(period, 5),
    topBuyers(period, 5),
    prisma.deal.findMany({
      where:
        user.memberId && !isAdmin(user)
          ? {
              OR: [{ sellerId: user.memberId }, { buyerId: user.memberId }],
            }
          : {},
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        seller: { select: { company: true } },
        buyer: { select: { company: true } },
      },
    }),
    thongTinDangNhap(user.memberId),
    // Thẻ game chỉ là lời mời — lỗi phía game không được làm hỏng trang tổng quan
    daLatLaBaiHomNay(user.id).catch(() => null),
  ]);

  // Việc chờ chính người này xử lý
  const todo = isAdmin(user)
    ? await prisma.deal.findMany({
        where: { status: DEAL_STATUS.CHO_DUYET },
        orderBy: { createdAt: "asc" },
        take: 6,
        include: {
          seller: { select: { company: true } },
          buyer: { select: { company: true } },
        },
      })
    : user.memberId
      ? (
          await prisma.deal.findMany({
            where: {
              status: DEAL_STATUS.CHO_DOI_TAC,
              OR: [{ sellerId: user.memberId }, { buyerId: user.memberId }],
            },
            orderBy: { createdAt: "asc" },
            include: {
              seller: { select: { company: true } },
              buyer: { select: { company: true } },
            },
          })
        ).filter((d) => pendingConfirmMemberId(d) === user.memberId)
      : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Chào ${user.memberName ?? user.name}`}
        subtitle={`Số liệu ${period.label.toLowerCase()}`}
        action={
          <Link href="/giao-dich/moi" className="btn-primary">
            + Khai giao dịch
          </Link>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TheDangNhap
          tenDangNhap={user.username}
          maHoiVien={user.memberCode}
          coHoSo={!!user.memberId}
          {...dangNhap}
        />
        <TheNgoiNha daLat={laBai} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Doanh số đã duyệt"
          value={formatShortVnd(stats.total)}
          hint={formatVnd(stats.total)}
          tone="navy"
        />
        <StatCard
          label="Số giao dịch"
          value={String(stats.count)}
          hint={`${stats.pairs} cặp hội viên giao thương`}
        />
        <StatCard
          label="Hội viên có giao dịch"
          value={`${stats.activeMembers}/${stats.memberCount}`}
          hint="trong kỳ này"
          tone="emerald"
        />
        <StatCard
          label="Đang chờ xử lý"
          value={String(stats.pendingPartner + stats.pendingAdmin)}
          hint={`${stats.pendingPartner} chờ đối tác · ${stats.pendingAdmin} chờ duyệt`}
          tone="amber"
        />
      </div>

      <section className="card">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">
            {isAdmin(user) ? "Chờ bạn duyệt" : "Chờ bạn xác nhận"}
          </h2>
          <Link
            href="/giao-dich"
            className="text-sm text-navy-600 hover:underline"
          >
            Xem tất cả
          </Link>
        </div>
        {todo.length === 0 ? (
          <EmptyState text="Không có việc nào đang chờ bạn. 🎉" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {todo.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/giao-dich/${d.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-mono text-xs text-slate-400">
                      {d.code}
                    </span>
                    <StatusBadge status={d.status} />
                    <span className="ml-auto font-semibold text-slate-800">
                      {formatVnd(d.amount)}
                    </span>
                  </span>
                  {/* Tên doanh nghiệp dài — cho xuống dòng thay vì đẩy tràn ngang */}
                  <span className="mt-1 block break-words text-sm text-slate-800">
                    {tenDoanhNghiep(d.seller.company)}
                    <span className="mx-1.5 text-slate-400">→</span>
                    {tenDoanhNghiep(d.buyer.company)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <TopTable title="Top bán ra" rows={sellers} />
        <TopTable title="Top mua vào" rows={buyers} />
      </div>

      <section className="card">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-800">Giao dịch gần đây</h2>
        </div>
        {recent.length === 0 ? (
          <EmptyState text="Chưa có giao dịch nào." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/giao-dich/${d.id}`}
                  className="block px-4 py-3 hover:bg-slate-50"
                >
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-xs text-slate-400">
                      {formatDate(d.dealDate)}
                    </span>
                    <StatusBadge status={d.status} />
                    <span className="ml-auto font-semibold text-slate-800">
                      {formatVnd(d.amount)}
                    </span>
                  </span>
                  <span className="mt-1 block break-words text-sm text-slate-800">
                    {tenDoanhNghiep(d.seller.company)}
                    <span className="mx-1.5 text-slate-400">→</span>
                    {tenDoanhNghiep(d.buyer.company)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/**
 * SĐT dùng đăng nhập của hội viên (đã che giữa) và nó có đăng nhập được không:
 * SĐT phải là di động hợp lệ và chỉ thuộc MỘT hội viên đang sinh hoạt.
 */
async function thongTinDangNhap(memberId: string | null) {
  if (!memberId) return { sdtChe: null, sdtDungDuoc: false, sdtTrung: false };
  const hv = await prisma.member.findUnique({
    where: { id: memberId },
    select: { phone: true },
  });
  const so = chuanSoDienThoai(hv?.phone);
  if (!laSoDienThoaiVN(so))
    return { sdtChe: null, sdtDungDuoc: false, sdtTrung: false };
  // Đếm bằng đúng hàm lõi đăng nhập dùng, để thẻ này không báo sai
  const soHoSo = await soHoSoCungSdt(so);
  return {
    sdtChe: cheSoDienThoai(so),
    sdtDungDuoc: soHoSo === 1,
    sdtTrung: soHoSo > 1,
  };
}

/**
 * Hội viên hay quên tên đăng nhập (dạng hv0xxx, KHÔNG trùng mã hội viên) — hiện
 * rõ cả hai ngay trang đầu sau khi đăng nhập để họ chép lại.
 */
function TheDangNhap({
  tenDangNhap,
  maHoiVien,
  coHoSo,
  sdtChe,
  sdtDungDuoc,
  sdtTrung,
}: {
  tenDangNhap: string;
  maHoiVien: string | null;
  coHoSo: boolean;
  sdtChe: string | null;
  sdtDungDuoc: boolean;
  sdtTrung: boolean;
}) {
  return (
    <section className="card min-w-0 p-4">
      <h2 className="font-semibold text-slate-800">Thông tin đăng nhập</h2>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[auto_minmax(0,1fr)]">
        <dt className="text-slate-500">Tên đăng nhập</dt>
        <dd className="font-mono font-semibold break-all text-navy-800">
          {tenDangNhap}
        </dd>
        <dt className="text-slate-500">Mã hội viên</dt>
        <dd className="text-slate-800">
          {maHoiVien ? (
            <>
              <span className="font-mono font-semibold">{maHoiVien}</span>{" "}
              <span className="text-xs text-slate-500">
                (không dùng để đăng nhập)
              </span>
            </>
          ) : (
            <span className="text-slate-500">
              Tài khoản chưa gắn hồ sơ hội viên
            </span>
          )}
        </dd>
        {coHoSo && (
          <>
            <dt className="text-slate-500">SĐT dùng đăng nhập</dt>
            <dd className="text-slate-800">
              {sdtChe ? (
                <>
                  <span className="font-mono">{sdtChe}</span>
                  {sdtDungDuoc ? (
                    <span className="block text-xs text-slate-500">
                      Có thể gõ số này thay cho tên đăng nhập.
                    </span>
                  ) : sdtTrung ? (
                    <span className="block text-xs text-amber-700">
                      Số này đang trùng với hồ sơ khác nên chưa dùng đăng nhập
                      được — liên hệ Văn phòng Chi hội.
                    </span>
                  ) : null}
                </>
              ) : (
                <span className="text-slate-500">
                  Chưa có số di động hợp lệ — cập nhật ở Hồ sơ doanh nghiệp hoặc
                  nhờ Văn phòng Chi hội.
                </span>
              )}
            </dd>
          </>
        )}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/tai-khoan/doi-mat-khau" className="btn-primary min-h-11">
          Đổi mật khẩu
        </Link>
        <Link href="/huong-dan-dang-nhap" className="btn-ghost min-h-11">
          Hướng dẫn đăng nhập
        </Link>
      </div>
    </section>
  );
}

/** Lời mời vào game kèm trạng thái lá bài hôm nay (null = tính năng đang tắt). */
function TheNgoiNha({ daLat }: { daLat: boolean | null }) {
  return (
    <section className="card min-w-0 p-4">
      <h2 className="font-semibold text-slate-800">Ngôi nhà Chợ Lớn</h2>
      <p className="mt-2 text-sm text-slate-600">
        {daLat === true
          ? "Hôm nay anh/chị đã lật lá bài. Hẹn gặp lại ngày mai!"
          : daLat === false
            ? "Lá bài hôm nay đang chờ anh/chị lật. Mỗi ngày được lật một lá."
            : "Hành trình khám phá Chi hội qua 22 trạm, thử thách mỗi ngày và bảng xếp hạng."}
      </p>
      <div className="mt-4">
        <Link href="/ngoi-nha" className="btn-primary min-h-11">
          {daLat === false ? "Vào lật lá bài" : "Vào game"}
        </Link>
      </div>
    </section>
  );
}

function TopTable({
  title,
  rows,
}: {
  title: string;
  rows: { memberId: string; company: string; total: number; count: number }[];
}) {
  return (
    // `min-w-0` bắt buộc: ô trong lưới mặc định không co nhỏ hơn nội dung, nên
    // tên doanh nghiệp dài sẽ nong rộng cả trang thay vì bị cắt gọn.
    <section className="card min-w-0">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="font-semibold text-slate-800">{title}</h2>
      </div>
      {rows.length === 0 ? (
        <EmptyState text="Chưa có dữ liệu trong kỳ." />
      ) : (
        <ol className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <li
              key={r.memberId}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <span
                className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${
                  i === 0
                    ? "bg-amber-100 text-amber-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {i + 1}
              </span>
              {/* min-w-0 để tên dài bị cắt gọn thay vì nong rộng cả hàng */}
              <Link
                href={`/hoi-vien/${r.memberId}`}
                className="min-w-0 flex-1 truncate text-sm text-slate-800 hover:text-navy-600"
              >
                {tenDoanhNghiep(r.company)}
              </Link>
              <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-slate-800">
                {formatShortVnd(r.total)}
              </span>
              <span className="w-12 shrink-0 text-right text-xs text-slate-400">
                {r.count} đơn
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
