import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { khiChatCua } from "@/lib/chan-dung";
import { KHI_CHAT, KHI_CHAT_CAU_HOI, type KhiChatKey } from "@/lib/khi-chat-noi-dung";
import { prisma } from "@/lib/prisma";
import { DieuHuongChanDung, Muc, DanhSach } from "../Dieu";
import { BaiKhiChat, NutLamLai } from "../Forms";

export const dynamic = "force-dynamic";

/** Đọc chuỗi JSON tỉ lệ % 5 khí chất; hỏng thì coi như chưa có. */
function docTyLe(s: string | null): Partial<Record<KhiChatKey, number>> {
  if (!s) return {};
  try {
    const o = JSON.parse(s);
    return o && typeof o === "object" ? o : {};
  } catch {
    return {};
  }
}

export default async function KhiChat() {
  const user = await requireUserPage();
  const cd = user.memberId
    ? await prisma.chanDung.findUnique({ where: { memberId: user.memberId } })
    : null;

  const kc = cd?.khiChat ? khiChatCua(cd.khiChat) : null;
  const tyLe = docTyLe(cd?.khiChatTyLe ?? null);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Khí chất doanh nhân"
        subtitle="Ưng · Hổ · Xà · Hồ · Long — 15 câu để nhận diện phong cách lãnh đạo theo góc nhìn Đông phương."
      />
      <DieuHuongChanDung dang="/tai-khoan/chan-dung/khi-chat" />

      {!kc ? (
        <div className="card p-5">
          <BaiKhiChat cauHoi={KHI_CHAT_CAU_HOI} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="bg-navy-900 px-6 py-6 text-white">
              <div className="flex flex-wrap items-center gap-5">
                <span className="text-6xl">{kc.emoji}</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-do-300">
                    Khí chất của anh/chị
                  </p>
                  <h2 className="mt-1 text-3xl font-extrabold tracking-tight">
                    {kc.ten}
                  </h2>
                  <p className="mt-1 font-medium text-do-200">{kc.danhHieu}</p>
                </div>
              </div>
              <p className="mt-5 border-l-2 border-do-500 pl-4 italic leading-relaxed text-navy-100">
                “{kc.cauNoi}”
              </p>
            </div>
            <p className="px-6 py-5 leading-relaxed text-slate-700">
              {kc.tongQuan}
            </p>
          </div>

          {/* Tỉ lệ 5 khí chất — ai cũng có cả 5, chỉ khác đậm nhạt */}
          {Object.keys(tyLe).length > 0 && (
            <Muc tieuDe="Tỉ lệ 5 khí chất trong anh/chị">
              <div className="space-y-2.5">
                {KHI_CHAT.map((t) => {
                  const p = tyLe[t.key] ?? 0;
                  return (
                    <div key={t.key} className="flex items-center gap-3">
                      <span className="w-24 shrink-0 text-sm font-medium text-navy-800">
                        {t.emoji} {t.ten}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-navy-100">
                        <div
                          className={`h-full rounded-full ${
                            t.key === kc.key ? "bg-do-500" : "bg-navy-300"
                          }`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm text-slate-600">
                        {p}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </Muc>
          )}

          <Muc tieuDe="Thế mạnh">
            <DanhSach y={kc.theManh} />
          </Muc>

          <Muc tieuDe="Điểm cần lưu ý">
            <DanhSach y={kc.luuY} dau="!" mau="text-amber-600" />
          </Muc>

          <Muc tieuDe="Vai trò phù hợp">
            <div className="flex flex-wrap gap-1.5">
              {kc.vaiTro.map((v) => (
                <span key={v} className="chip">
                  {v}
                </span>
              ))}
            </div>
          </Muc>

          {(() => {
            const bo = khiChatCua(kc.ketHopVoi.key);
            if (!bo) return null;
            return (
              <div className="rounded-2xl bg-do-50 p-5">
                <h2 className="font-bold text-do-800">
                  Nên bắt tay với khí chất {bo.emoji} {bo.ten}
                </h2>
                <p className="mt-2 leading-relaxed text-slate-700">
                  {kc.ketHopVoi.vi}
                </p>
              </div>
            );
          })()}

          <Muc tieuDe="Đóng góp phù hợp trong Chi hội">
            <p className="leading-relaxed text-slate-700">{kc.trongHoi}</p>
          </Muc>

          <Muc tieuDe="Sơ đồ khí chất đầy đủ">
            {/* Poster do Ban Chủ nhiệm biên soạn cho cộng đồng doanh nhân */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={kc.anh}
              alt={`Khí chất ${kc.ten} — ${kc.danhHieu}`}
              className="w-full rounded-xl ring-1 ring-navy-100"
            />
          </Muc>

          <div className="pt-2">
            <NutLamLai bai="khi-chat" />
          </div>
        </div>
      )}
    </div>
  );
}
