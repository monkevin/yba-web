import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QUYEN, co } from "@/lib/quyen";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import {
  FormDauGia,
  FormHotDealCaNhan,
  FormTraGia,
  FormUuDaiDN,
  NutAnDeal,
  NutQuanTam,
} from "./CacNutUuDai";
import { nhanMucDich } from "./muc-dich";

/**
 * ƯU ĐÃI & HOT DEAL hội viên (Chủ tịch chốt 24/09/2026) — CHỈ hội viên
 * đăng nhập xem. Ba tab:
 *  1. Ưu đãi doanh nghiệp — bảng UuDai dùng CHUNG với Zalo Mini App.
 *  2. Hot Deal cá nhân — đồ dùng bán giá ưu tiên hội viên.
 *  3. Đấu giá thiện nguyện — tiền về quỹ NCDN, hết giờ là chốt.
 */

export const dynamic = "force-dynamic";

const TAB = {
  dn: "Ưu đãi doanh nghiệp",
  canhan: "Hot Deal cá nhân",
  daugia: "Đấu giá thiện nguyện",
} as const;

function d(x: Date | null): string {
  return x ? x.toLocaleDateString("vi-VN") : "";
}
function vnd(x: number | null | undefined): string {
  return x ? x.toLocaleString("vi-VN") + "đ" : "";
}

export default async function UuDaiHotDeal({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUserPage();
  const sp = await searchParams;
  const tab = (typeof sp.tab === "string" && sp.tab in TAB ? sp.tab : "dn") as keyof typeof TAB;
  const laBTC = co(user, QUYEN.SU_KIEN_QUAN_LY);
  const now = new Date();

  const [uuDaiDN, hotDeals, suKienList] = await Promise.all([
    tab === "dn"
      ? prisma.uuDai.findMany({
          where: { status: "DANG_HIEN" },
          orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
          take: 100,
          include: {
            member: { select: { name: true, company: true } },
            leads: { select: { memberId: true, hanhDong: true } },
          },
        })
      : [],
    tab !== "dn"
      ? prisma.hotDeal.findMany({
          where: { loai: tab === "canhan" ? "CA_NHAN" : "DAU_GIA", an: false },
          orderBy: { createdAt: "desc" },
          take: 100,
          include: {
            quanTam: { select: { userId: true } },
            traGia: { orderBy: { soTien: "desc" }, take: 3 },
          },
        })
      : [],
    // Danh sách sự kiện để BTC gắn phiên đấu giá
    tab === "daugia"
      ? prisma.lichHoatDong.findMany({
          where: { published: true },
          orderBy: { tuNgay: "desc" },
          take: 12,
          select: { slug: true, tieuDe: true },
        })
      : [],
  ]);
  // LichHoatDong.slug có thể null (mục cũ chưa sinh slug) — chỉ lấy mục có slug
  const suKienCoSlug: { slug: string; tieuDe: string }[] = [];
  for (const s of suKienList) {
    if (s.slug) suKienCoSlug.push({ slug: s.slug, tieuDe: s.tieuDe });
  }
  // Tên sự kiện của các phiên đã gắn (hiện trên thẻ)
  const tenSuKien = new Map(suKienCoSlug.map((s) => [s.slug, s.tieuDe]));
  const slugThieu = hotDeals
    .map((h) => h.suKienSlug)
    .filter((s): s is string => !!s && !tenSuKien.has(s));
  if (slugThieu.length) {
    const them = await prisma.lichHoatDong.findMany({
      where: { slug: { in: slugThieu } },
      select: { slug: true, tieuDe: true },
    });
    for (const t of them) if (t.slug) tenSuKien.set(t.slug, t.tieuDe);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Ưu đãi & Hot Deal hội viên"
        subtitle="Đặc quyền nội bộ — chỉ hội viên đăng nhập xem được. Ưu đãi doanh nghiệp hiển thị cả trên Zalo Mini App của Chi hội."
      />

      <div className="mb-5 flex flex-wrap gap-1.5">
        {(Object.keys(TAB) as (keyof typeof TAB)[]).map((t) => (
          <Link
            key={t}
            href={`/uu-dai?tab=${t}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === t
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
            }`}
          >
            {TAB[t]}
          </Link>
        ))}
      </div>

      {/* Form đăng theo tab */}
      {tab === "dn" && (
        <details className="mb-6">
          <summary className="btn-primary inline-flex cursor-pointer">
            + Đăng ưu đãi của doanh nghiệp tôi
          </summary>
          <div className="mt-3">
            <FormUuDaiDN />
          </div>
        </details>
      )}
      {tab === "canhan" && (
        <details className="mb-6">
          <summary className="btn-primary inline-flex cursor-pointer">
            + Đăng Hot Deal cá nhân
          </summary>
          <div className="mt-3">
            <FormHotDealCaNhan />
          </div>
        </details>
      )}
      {tab === "daugia" && laBTC && (
        <details className="mb-6">
          <summary className="btn-primary inline-flex cursor-pointer">
            + Mở phiên đấu giá thiện nguyện
          </summary>
          <div className="mt-3">
            <FormDauGia suKien={suKienCoSlug} />
          </div>
        </details>
      )}

      {/* ── Tab 1: Ưu đãi doanh nghiệp ── */}
      {tab === "dn" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {uuDaiDN.map((u) => {
            const hetHan = !!u.expiresAt && u.expiresAt < now;
            const soQT = u.leads.length;
            const daQT = !!user.memberId &&
              u.leads.some(
                (l) => l.memberId === user.memberId && l.hanhDong === "QUAN_TAM"
              );
            return (
              <div key={u.id} className={`card p-5 ${hetHan ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-navy-800">{u.title}</p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      hetHan
                        ? "bg-slate-100 text-slate-500"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {hetHan
                      ? "Hết hạn"
                      : u.expiresAt
                        ? `Còn hạn đến ${d(u.expiresAt)}`
                        : "Đang áp dụng"}
                  </span>
                </div>
                <p className="mt-1 text-lg font-extrabold text-do-600">{u.mucUuDai}</p>
                {u.member && (
                  <p className="mt-1 text-sm text-slate-600">
                    {u.member.name}
                    {u.member.company ? ` · ${tenDoanhNghiep(u.member.company)}` : ""}
                  </p>
                )}
                {u.summary && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{u.summary}</p>
                )}
                {u.dieuKien && (
                  <p className="mt-1 text-xs text-slate-500">Áp dụng: {u.dieuKien}</p>
                )}
                {(u.startAt || u.expiresAt) && (
                  <p className="mt-1 text-xs text-slate-500">
                    Thời gian: {d(u.startAt) || "nay"} – {d(u.expiresAt) || "khi hết ưu đãi"}
                  </p>
                )}
                {!hetHan && (
                  <div className="mt-3">
                    <NutQuanTam id={u.id} loai="dn" daQuanTam={daQT} soQuanTam={soQT} />
                  </div>
                )}
              </div>
            );
          })}
          {uuDaiDN.length === 0 && (
            <p className="card p-8 text-center text-slate-500 sm:col-span-2">
              Chưa có ưu đãi nào — anh/chị đăng ưu đãi của doanh nghiệp mình ở nút trên.
            </p>
          )}
        </div>
      )}

      {/* ── Tab 2: Hot Deal cá nhân ── */}
      {tab === "canhan" && (
        <div className="grid gap-4 sm:grid-cols-2">
          {hotDeals.map((h) => {
            const hetHan = !!h.denNgay && h.denNgay < now;
            const daQT = h.quanTam.some((q) => q.userId === user.id);
            const laChu = h.nguoiTaoId === user.id;
            return (
              <div key={h.id} className={`card p-5 ${hetHan ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-navy-800">{h.tieuDe}</p>
                  {hetHan && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500">
                      Hết hạn
                    </span>
                  )}
                </div>
                <p className="mt-1">
                  {h.giaGoc && (
                    <span className="mr-2 text-sm text-slate-400 line-through">
                      {vnd(h.giaGoc)}
                    </span>
                  )}
                  <span className="text-xl font-extrabold text-do-600">{vnd(h.giaHV)}</span>
                  <span className="ml-1 text-xs text-slate-500">giá ưu tiên hội viên</span>
                </p>
                {h.moTa && (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{h.moTa}</p>
                )}
                <p className="mt-1 text-xs text-slate-500">
                  Người đăng: <b>{h.tenNguoiDang}</b>
                  {h.lienHe ? ` · ${h.lienHe}` : ""}
                  {h.denNgay ? ` · đến ${d(h.denNgay)}` : ""}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {!hetHan && (
                    <NutQuanTam
                      id={h.id}
                      loai="deal"
                      daQuanTam={daQT}
                      soQuanTam={h.quanTam.length}
                    />
                  )}
                  {laChu && <NutAnDeal id={h.id} dangAn={h.an} />}
                </div>
                {laChu && h.quanTam.length > 0 && (
                  <p className="mt-2 text-xs text-emerald-700">
                    {h.quanTam.length} hội viên đang quan tâm — anh/chị chủ động liên hệ nhé.
                  </p>
                )}
              </div>
            );
          })}
          {hotDeals.length === 0 && (
            <p className="card p-8 text-center text-slate-500 sm:col-span-2">
              Chưa có Hot Deal nào — món đồ tốt không dùng tới, đăng lên nhường
              giá đẹp cho anh em Chợ Lớn!
            </p>
          )}
        </div>
      )}

      {/* ── Tab 3: Đấu giá thiện nguyện ── */}
      {tab === "daugia" && (
        <div className="space-y-4">
          {hotDeals.map((h) => {
            const ketThuc = !!h.denNgay && h.denNgay < now;
            const caoNhat = h.traGia[0];
            const toiThieu = Math.max(
              h.giaKhoiDiem ?? 0,
              (caoNhat?.soTien ?? 0) + (h.buocGia ?? 0)
            );
            const md = nhanMucDich(h);
            return (
              <div key={h.id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-navy-800">🔨 {h.tieuDe}</p>
                    <p className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${md.lop}`}>
                        {md.nhan}
                      </span>
                      {h.suKienSlug && tenSuKien.get(h.suKienSlug) && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                          📅 {tenSuKien.get(h.suKienSlug)}
                        </span>
                      )}
                      {h.congKhai && (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                          Đang công khai trên /dau-gia
                        </span>
                      )}
                    </p>
                    {h.moTa && (
                      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600">
                        {h.moTa}
                      </p>
                    )}
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      ketThuc
                        ? "bg-slate-100 text-slate-500"
                        : "bg-do-600 text-white"
                    }`}
                  >
                    {ketThuc
                      ? "Đã kết thúc"
                      : `Đến ${h.denNgay?.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}`}
                  </span>
                </div>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-navy-50 p-4">
                    <p className="text-xs font-semibold text-slate-500 uppercase">
                      {ketThuc ? "Giá chốt" : "Giá cao nhất hiện tại"}
                    </p>
                    <p className="mt-1 text-2xl font-extrabold text-do-600">
                      {vnd(caoNhat?.soTien ?? h.giaKhoiDiem)}
                    </p>
                    {caoNhat && (
                      <p className="text-sm text-slate-600">
                        {ketThuc ? "🏆 " : ""}
                        {caoNhat.tenHien}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">
                      Khởi điểm {vnd(h.giaKhoiDiem)} · bước giá {vnd(h.buocGia)}
                    </p>
                    {h.traGia.length > 1 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Kế tiếp:{" "}
                        {h.traGia
                          .slice(1)
                          .map((b) => `${b.tenHien} ${vnd(b.soTien)}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                  <div>
                    {ketThuc ? (
                      <div className="rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800">
                        <p>
                          Phiên đã chốt.{" "}
                          {caoNhat
                            ? `Chúc mừng ${caoNhat.tenHien} — BTC sẽ liên hệ để hoàn tất.`
                            : "Chưa có lượt trả giá nào."}
                          {h.lienHe ? ` Liên hệ: ${h.lienHe}.` : ""}
                        </p>
                        {caoNhat && h.mucDich === "CA_NHAN" && (
                          <p className="mt-1.5 font-bold">
                            Trích {h.trichPhanTram ?? 0}% ={" "}
                            {vnd(
                              Math.round(
                                (caoNhat.soTien * (h.trichPhanTram ?? 0)) / 100
                              )
                            )}{" "}
                            về quỹ Chi hội.
                          </p>
                        )}
                        {caoNhat && h.mucDich !== "CA_NHAN" && (
                          <p className="mt-1.5 font-bold">
                            Toàn bộ {vnd(caoNhat.soTien)} về{" "}
                            {h.mucDich === "QUY_CHI_HOI"
                              ? "quỹ Chi hội"
                              : h.mucDichGhiChu || "quỹ thiện nguyện"}
                            .
                          </p>
                        )}
                      </div>
                    ) : (
                      <>
                        <p className="lbl">Trả giá của anh/chị (VNĐ)</p>
                        <FormTraGia id={h.id} toiThieu={toiThieu} />
                        <p className="mt-2 text-xs text-slate-500">
                          Hết giờ là chốt, không gia hạn.{" "}
                          {h.mucDich === "CA_NHAN"
                            ? `${h.trichPhanTram ?? 0}% số tiền chốt được trích về quỹ Chi hội.`
                            : h.mucDich === "QUY_CHI_HOI"
                              ? "Toàn bộ số tiền về quỹ Chi hội."
                              : `Toàn bộ số tiền về ${h.mucDichGhiChu || "quỹ thiện nguyện"}.`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {hotDeals.length === 0 && (
            <p className="card p-8 text-center text-slate-500">
              Chưa có phiên đấu giá nào đang mở.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
