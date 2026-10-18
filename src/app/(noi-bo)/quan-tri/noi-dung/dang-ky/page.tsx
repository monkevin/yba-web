import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { DoiTrangThai, NutDaXuLy, NutKetNap } from "../Forms";

const TT_LABEL: Record<string, string> = {
  MOI: "Mới",
  DANG_XU_LY: "Đang xử lý",
  DA_DUYET: "Đã duyệt",
  TU_CHOI: "Từ chối",
};

const TT_CLASS: Record<string, string> = {
  MOI: "bg-do-50 text-do-700 ring-do-200",
  DANG_XU_LY: "bg-amber-50 text-amber-700 ring-amber-200",
  DA_DUYET: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  TU_CHOI: "bg-slate-100 text-slate-600 ring-slate-200",
};

/** Hồ sơ đăng ký hội viên và tin nhắn liên hệ gửi từ website. */
export default async function HoSoVaTinNhan({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireQuyen(QUYEN.BIEU_MAU_XU_LY);

  const sp = await searchParams;
  const tab = typeof sp.tab === "string" ? sp.tab : "dang-ky";

  const [hoSo, tinNhan, hoSoMoi, tinChuaXuLy] = await Promise.all([
    prisma.membershipApplication.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.membershipApplication.count({ where: { status: "MOI" } }),
    prisma.contactMessage.count({ where: { handled: false } }),
  ]);

  const TAB = [
    { key: "dang-ky", label: "Hồ sơ đăng ký hội viên", so: hoSoMoi, tong: hoSo.length },
    { key: "lien-he", label: "Tin nhắn liên hệ", so: tinChuaXuLy, tong: tinNhan.length },
  ];

  return (
    <div>
      <PageHeader
        title="Hồ sơ & tin nhắn từ website"
        subtitle="Người quan tâm gửi về từ trang Đăng ký hội viên và trang Liên hệ"
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {TAB.map((t) => (
          <Link
            key={t.key}
            href={`/quan-tri/noi-dung/dang-ky?tab=${t.key}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              t.key === tab
                ? "bg-navy-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-navy-100 hover:bg-navy-50"
            }`}
          >
            {t.label}
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                t.so > 0
                  ? "bg-do-500 text-white"
                  : t.key === tab
                    ? "bg-white/20"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {t.so > 0 ? `${t.so} mới` : t.tong}
            </span>
          </Link>
        ))}
      </div>

      {tab === "lien-he" ? (
        tinNhan.length === 0 ? (
          <Trong>Chưa có tin nhắn nào gửi từ trang Liên hệ.</Trong>
        ) : (
          <ul className="space-y-3">
            {tinNhan.map((t) => (
              <li
                key={t.id}
                className={`card p-4 ${t.handled ? "" : "ring-2 ring-do-100"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy-800">
                      {t.name}
                      {!t.handled && (
                        <span className="ml-2 inline-block rounded-full bg-do-500 px-1.5 py-0.5 align-middle text-[11px] font-bold text-white">
                          MỚI
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-sm text-slate-600">
                      {t.phone && (
                        <a href={`tel:${t.phone}`} className="hover:underline">
                          {t.phone}
                        </a>
                      )}
                      {t.phone && t.email && " · "}
                      {t.email && (
                        <a href={`mailto:${t.email}`} className="hover:underline">
                          {t.email}
                        </a>
                      )}
                    </p>
                    {t.subject && (
                      <p className="mt-1.5 text-sm font-medium text-navy-700">
                        {t.subject}
                      </p>
                    )}
                    <p className="mt-1.5 whitespace-pre-line leading-relaxed text-slate-700">
                      {t.message}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-slate-400">
                      {formatDateTime(t.createdAt)}
                    </span>
                    <NutDaXuLy id={t.id} daXuLy={t.handled} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : hoSo.length === 0 ? (
        <Trong>
          Chưa có hồ sơ đăng ký nào. Khi có người điền biểu mẫu ở trang{" "}
          <Link href="/dang-ky-hoi-vien" className="text-navy-600 underline">
            Đăng ký hội viên
          </Link>
          , hồ sơ sẽ hiện tại đây.
        </Trong>
      ) : (
        <ul className="space-y-3">
          {hoSo.map((h) => (
            <li key={h.id} className="card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${TT_CLASS[h.status]}`}
                  >
                    {TT_LABEL[h.status] ?? h.status}
                  </span>
                  <p className="mt-1.5 font-semibold text-navy-800">{h.company}</p>
                  <p className="mt-0.5 text-sm text-slate-600">
                    {h.name}
                    {h.position ? ` · ${h.position}` : ""} ·{" "}
                    <a href={`tel:${h.phone}`} className="hover:underline">
                      {h.phone}
                    </a>
                    {h.email && (
                      <>
                        {" · "}
                        <a href={`mailto:${h.email}`} className="hover:underline">
                          {h.email}
                        </a>
                      </>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {[h.industry, h.address, h.website].filter(Boolean).join(" · ") ||
                      "—"}
                  </p>
                  {h.referrer && (
                    <p className="mt-1 text-sm text-slate-600">
                      Người giới thiệu: <strong>{h.referrer}</strong>
                    </p>
                  )}
                  {h.note && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                      {h.note}
                    </p>
                  )}
                  {h.handledNote && (
                    <p className="mt-2 text-xs text-slate-500">
                      Ghi chú xử lý: {h.handledNote}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-slate-400">
                  {formatDateTime(h.createdAt)}
                </span>
              </div>

              <div className="mt-3 space-y-3 border-t border-navy-100 pt-3">
                {/* Chưa duyệt thì hiện nút kết nạp một-bấm: tạo hồ sơ hội viên
                    + tài khoản đăng nhập, mật khẩu hiện một lần */}
                {h.status !== "DA_DUYET" && h.status !== "TU_CHOI" && (
                  <NutKetNap id={h.id} />
                )}
                <DoiTrangThai id={h.id} hienTai={h.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Trong({ children }: { children: React.ReactNode }) {
  return (
    <div className="card px-4 py-14 text-center text-sm text-slate-500">
      {children}
    </div>
  );
}
