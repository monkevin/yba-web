import { notFound, redirect } from "next/navigation";
import { requireUserPage } from "@/lib/auth";
import { napSuKien, quyenSk, type QuyenSk } from "@/lib/trung-tam-sk/may-chu";

/**
 * Đầu mỗi trang trong /quan-tri/su-kien/[id]: kiểm đăng nhập + quyền, nạp sự
 * kiện. Sự kiện chưa bật quản lý tổ chức → chuyển sang trang bật.
 * `can` = quyền tối thiểu của trang (thiếu thì về Tổng quan / check-in).
 */
export async function napTrang(id: string, can: keyof Omit<QuyenSk, "vao"> | "vao" = "vao") {
  const user = await requireUserPage();
  const quyen = quyenSk(user);
  if (!quyen.vao) redirect("/quan-tri?thieu-quyen=1");
  const ev = await napSuKien(id);
  if (!ev) notFound();
  if (!ev.toChuc) {
    if (!quyen.quanLy) notFound();
    redirect(`/quan-tri/su-kien/moi?eventId=${ev.id}`);
  }
  if (!quyen[can]) {
    // Tình nguyện viên lễ tân chỉ có màn check-in
    redirect(quyen.checkin && !quyen.quanLy && !quyen.taiChinh ? `/quan-tri/su-kien/${id}/check-in` : `/quan-tri/su-kien/${id}`);
  }
  return { user, quyen, ev, sk: ev.toChuc };
}
