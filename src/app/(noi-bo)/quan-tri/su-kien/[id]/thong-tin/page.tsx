import { prisma } from "@/lib/prisma";
import { gioVN, ngayNhap, ngayVN } from "@/lib/trung-tam-sk/bang";
import { napTrang } from "@/lib/trung-tam-sk/trang";
import NoiLich from "./NoiLich";
import ThongTinClient from "./ThongTinClient";

export default async function ThongTinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sk, ev } = await napTrang(id, "quanLy");
  const MOT_THANG = 31 * 86_400_000;
  const [phien, lich, goiY] = await Promise.all([
    prisma.skPhien.findMany({
      where: { skId: sk.id },
      orderBy: { order: "asc" },
    }),
    sk.lichId
      ? prisma.lichHoatDong.findUnique({
          where: { id: sk.lichId },
          select: {
            id: true,
            tieuDe: true,
            slug: true,
            published: true,
            tuNgay: true,
            dangKy: { select: { status: true } },
          },
        })
      : null,
    // Mục lịch quanh ngày diễn ra chưa gắn sự kiện nào — gợi ý gắn
    prisma.lichHoatDong.findMany({
      where: {
        tuNgay: {
          gte: new Date(ev.startAt.getTime() - MOT_THANG),
          lte: new Date(ev.startAt.getTime() + MOT_THANG),
        },
      },
      select: { id: true, tieuDe: true, tuNgay: true },
      orderBy: { tuNgay: "asc" },
      take: 20,
    }),
  ]);
  const daGan = new Set(
    (
      await prisma.skSuKien.findMany({
        where: { lichId: { in: goiY.map((g) => g.id) } },
        select: { lichId: true },
      })
    ).map((x) => x.lichId),
  );
  return (
    <div className="space-y-6">
      <ThongTinClient
        eventId={ev.id}
        slug={ev.slug}
        phien={phien}
        dau={{
          title: ev.title,
          ngay: ngayNhap(ev.startAt),
          gio: gioVN(ev.startAt),
          location: ev.location ?? "",
          summary: ev.summary ?? "",
          published: ev.published,
          loai: sk.loai,
          quyMo: sk.quyMo,
          trangThai: sk.trangThai,
          mucTieuKhach: sk.mucTieuKhach ? String(sk.mucTieuKhach) : "",
          mucTieuThu: sk.mucTieuThu ? String(sk.mucTieuThu) : "",
          ghiChu: sk.ghiChu ?? "",
          baiHocTot: sk.baiHocTot ?? "",
          baiHocCaiThien: sk.baiHocCaiThien ?? "",
        }}
      />
      <NoiLich
        eventId={ev.id}
        lich={
          lich
            ? {
                id: lich.id,
                tieuDe: lich.tieuDe,
                slug: lich.slug,
                published: lich.published,
                ngay: ngayVN(lich.tuNgay),
                daDuyet: lich.dangKy.filter((d) => d.status === "DA_DUYET").length,
                choDuyet: lich.dangKy.filter((d) => d.status === "CHO_DUYET").length,
              }
            : null
        }
        goiY={goiY.filter((g) => !daGan.has(g.id)).map((g) => ({ id: g.id, tieuDe: g.tieuDe, ngay: ngayVN(g.tuNgay) }))}
      />
    </div>
  );
}
