import { PageHeader } from "@/components/ui";
import { requireQuyen } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN } from "@/lib/quyen";
import { TRANG_TINH } from "@/lib/trang-tinh";
import { FormTrang, QuanLyNhanSu, type TrangValues } from "./TrangForms";

export default async function QuanTriTrang({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.TRANG_TINH_SUA);
  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "trang";

  const [daLuu, nhanSu] = await Promise.all([
    prisma.page.findMany(),
    prisma.leader.findMany({ orderBy: [{ group: "asc" }, { order: "asc" }] }),
  ]);
  const theoSlug = new Map(daLuu.map((p) => [p.slug, p]));

  const ds: TrangValues[] = TRANG_TINH.map((t) => {
    const p = theoSlug.get(t.slug);
    return {
      ...t,
      title: p?.title ?? t.ten,
      content: p?.content ?? "",
      metaDesc: p?.metaDesc ?? null,
      coverImage: p?.coverImage ?? null,
      daSua: !!p,
    };
  });

  const TAB = [
    { key: "trang", label: "Nội dung các trang", so: ds.filter((t) => t.daSua).length },
    { key: "nhan-su", label: "Nhân sự các ban", so: nhanSu.length },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Trang giới thiệu & Ban Chủ nhiệm"
        subtitle="Sửa nội dung các trang cố định và danh sách nhân sự hiển thị trên website"
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TAB.map((t) => (
          <a
            key={t.key}
            href={`/quan-tri/trang?tab=${t.key}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              t.key === tab
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                t.key === tab ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {t.so}
            </span>
          </a>
        ))}
      </div>

      {tab === "nhan-su" ? (
        <QuanLyNhanSu danhSach={nhanSu} />
      ) : (
        <div className="space-y-3">
          <p className="rounded-lg bg-navy-50 px-4 py-3 text-sm text-slate-700">
            Trang nào chưa soạn thì web tự dùng nội dung mặc định viết sẵn. Soạn
            xong bấm <strong>Lưu</strong> là nội dung mới thay thế ngay.
          </p>
          {/* Ranh giới sửa-được / phải-nhắn-dev — không ghi rõ thì thư ký
              loay hoay tìm nút sửa không tồn tại, hoặc nhờ người ngoài sửa
              lung tung vào mã nguồn */}
          <div className="rounded-lg border border-navy-100 bg-white px-4 py-3 text-sm text-slate-600">
            <p className="font-semibold text-navy-800">
              Chữ nào không sửa được ở đây?
            </p>
            <p className="mt-1 leading-relaxed">
              Sửa tại trang này: các đoạn giới thiệu bên dưới. Sửa ở{" "}
              <a href="/quan-tri/giao-dien" className="font-medium text-navy-600 underline">
                Giao diện
              </a>
              : banner, logo, KV, màu, hotline, email, địa chỉ, khẩu hiệu. Còn{" "}
              <strong>
                nhiệm kỳ, khu vực hoạt động, điều kiện gia nhập, mục tiêu nhiệm
                kỳ, phần giới thiệu YBA HCM
              </strong>{" "}
              là nội dung cố định trong mã nguồn — cần đổi thì nhắn người phụ
              trách kỹ thuật kèm tên mục, đừng tự tìm nút sửa (không có đâu).
            </p>
          </div>
          {ds.map((t) => (
            <FormTrang key={t.slug} t={t} />
          ))}
        </div>
      )}
    </div>
  );
}
