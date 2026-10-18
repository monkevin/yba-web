import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUserPage, isBackOffice } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import HoSoForm from "./HoSoForm";
import SanPham from "./SanPham";

/**
 * Hội viên tự cập nhật hồ sơ doanh nghiệp công khai.
 * Ban chủ nhiệm / thư ký sửa hộ được bằng `?hoivien=<id>`.
 */
export default async function TrangHoSo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const user = await requireUserPage();

  const yeuCau = typeof sp.hoivien === "string" ? sp.hoivien : "";
  const suaHo = yeuCau && yeuCau !== user.memberId;
  if (suaHo && !isBackOffice(user)) {
    return (
      <ThongBao title="Không có quyền">
        Chỉ Ban Chủ nhiệm và thư ký mới sửa được hồ sơ của hội viên khác.
      </ThongBao>
    );
  }

  const memberId = yeuCau || user.memberId;
  if (!memberId) {
    return (
      <ThongBao title="Tài khoản chưa gắn hồ sơ doanh nghiệp">
        Tài khoản <strong>{user.username}</strong> chưa được gắn với hội viên nào
        nên chưa có hồ sơ để sửa. Nhờ thư ký Chi hội vào{" "}
        <Link href="/quan-tri/tai-khoan" className="text-navy-600 underline">
          Quản trị → Tài khoản
        </Link>{" "}
        gắn giúp.
      </ThongBao>
    );
  }

  const [hoSo, nganhNghe] = await Promise.all([
    prisma.member.findUnique({
      where: { id: memberId },
      include: { products: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    }),
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, icon: true },
    }),
  ]);

  if (!hoSo) {
    return <ThongBao title="Không tìm thấy hồ sơ">Hội viên này không tồn tại.</ThongBao>;
  }

  const choDuyet = hoSo.profileStatus === "CHO_DUYET";

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Hồ sơ doanh nghiệp"
        subtitle={`${tenDoanhNghiep(hoSo.company)} · ${hoSo.code}`}
        action={
          <Link href={`/doanh-nghiep/${hoSo.slug}`} className="btn-ghost">
            Xem trang công khai
          </Link>
        }
      />

      {suaHo && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Anh/chị đang sửa hộ hồ sơ của hội viên khác. Lưu xong hồ sơ được duyệt
          luôn.
        </p>
      )}

      {choDuyet && !suaHo && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Hồ sơ đã hiện công khai và đang <strong>chờ Ban Chủ nhiệm rà lại</strong>.
          Nếu có gì cần chỉnh, Ban Chủ nhiệm sẽ trả hồ sơ về kèm lý do.
        </p>
      )}

      {!hoSo.publicVisible && (
        <p className="mb-4 rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-700">
          Hồ sơ đang <strong>ẩn</strong> khỏi danh bạ công khai. Tích ô “Cho hiển
          thị hồ sơ” bên dưới rồi lưu để hiện lại.
        </p>
      )}

      <div className="space-y-5">
        <HoSoForm
          hoSo={{
            id: hoSo.id,
            slug: hoSo.slug,
            code: hoSo.code,
            company: hoSo.company,
            name: hoSo.name,
            categoryId: hoSo.categoryId,
            intro: hoSo.intro,
            description: hoSo.description,
            offering: hoSo.offering,
            services: hoSo.services,
            history: hoSo.history,
            needing: hoSo.needing,
            capabilities: hoSo.capabilities,
            logo: hoSo.logo,
            coverImage: hoSo.coverImage,
            gallery: hoSo.gallery,
            phone: hoSo.phone,
            email: hoSo.email,
            address: hoSo.address,
            website: hoSo.website,
            facebook: hoSo.facebook,
            zalo: hoSo.zalo,
            linkedin: hoSo.linkedin,
            youtube: hoSo.youtube,
            videoUrl: hoSo.videoUrl,
            taxCode: hoSo.taxCode,
            headcount: hoSo.headcount,
            foundedYear: hoSo.foundedYear,
            publicVisible: hoSo.publicVisible,
          }}
          nganhNghe={nganhNghe}
        />

        <SanPham memberId={hoSo.id} danhSach={hoSo.products} />

        <p className="text-sm text-slate-500">
          Tên doanh nghiệp, tên người đại diện và mã hội viên do Chi hội quản lý.
          Cần sửa thì nhờ thư ký cập nhật ở{" "}
          <Link href="/quan-tri/hoi-vien" className="text-navy-600 underline">
            Quản trị → Hội viên
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

function ThongBao({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Hồ sơ doanh nghiệp" />
      <div className="card p-8 text-center">
        <h2 className="font-bold text-navy-800">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{children}</p>
        <Link href="/tai-khoan" className="btn-ghost mt-6">
          ← Về tổng quan
        </Link>
      </div>
    </div>
  );
}
