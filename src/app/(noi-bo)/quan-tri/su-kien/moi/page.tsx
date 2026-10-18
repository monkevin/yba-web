import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { SLUG_1010 } from "@/lib/checkin-1010";
import { prisma } from "@/lib/prisma";
import { gioVN, ngayNhap } from "@/lib/trung-tam-sk/bang";
import { quyenSk } from "@/lib/trung-tam-sk/may-chu";
import TaoSuKien from "./TaoSuKien";

/** Tạo sự kiện theo mẫu loại × quy mô, hoặc bật quản lý cho sự kiện đã có (?eventId=). */
export default async function TaoSuKienPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const [{ eventId }, user] = await Promise.all([searchParams, requireUserPage()]);
  if (!quyenSk(user).quanLy) redirect("/quan-tri/su-kien");

  const ev = eventId
    ? await prisma.event.findUnique({
        where: { id: eventId },
        select: { id: true, slug: true, title: true, startAt: true, location: true, toChuc: { select: { id: true } } },
      })
    : null;
  if (eventId && !ev) notFound();
  if (ev?.toChuc) redirect(`/quan-tri/su-kien/${ev.id}`);
  if (ev?.slug === SLUG_1010) redirect("/quan-tri/su-kien-1010");

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={ev ? "Bật quản lý tổ chức" : "Tạo sự kiện"}
        subtitle={
          ev
            ? `Gắn công cụ tổ chức vào “${ev.title}” — nội dung, album của sự kiện giữ nguyên.`
            : "Chọn loại và quy mô — hệ thống sinh sẵn quy trình chuẩn để Ban tổ chức sửa tiếp."
        }
        action={
          <Link href="/quan-tri/su-kien" className="btn-ghost">
            ← Trung tâm sự kiện
          </Link>
        }
      />
      <TaoSuKien
        suKien={
          ev
            ? {
                id: ev.id,
                title: ev.title,
                ngay: ngayNhap(ev.startAt),
                gio: gioVN(ev.startAt),
                diaDiem: ev.location ?? "",
              }
            : null
        }
      />
    </div>
  );
}
