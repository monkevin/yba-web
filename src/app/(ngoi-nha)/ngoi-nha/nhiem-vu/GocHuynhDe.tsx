"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import AnhTaiLen from "@/components/AnhTaiLen";
import MemberPicker from "@/components/MemberPicker";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import { am } from "@/components/ngoi-nha/am-thanh";
import {
  MA_VON,
  NHOM_NHIEM_VU,
  TRANG_THAI_NV,
  VON,
  chuCaiTen,
  soDep,
  type Von,
} from "@/lib/ngoi-nha/luat";
import type { gocHuynhDe, ThuongTuDong } from "@/lib/ngoi-nha/nhiem-vu";
import { aGuiLoiChuc, aGuiNhiemVu, aXacNhanGiup } from "../actions";

type DuLieu = Awaited<ReturnType<typeof gocHuynhDe>>;

const CACH: Record<string, string> = {
  TU_DONG: "Hệ thống tự ghi nhận",
  HOI_VIEN: "Hội viên liên quan xác nhận",
  BAN_DUYET: "Ban phụ trách duyệt",
};

export default function GocHuynhDe({
  tamDung,
  loiChuc,
  nhiemVu,
  lichSu,
  nhoXacNhan,
  sinhNhat,
  thuongMoi,
  coHoiVien,
  muaTinhDiem,
  tenMua,
  myMemberId,
}: DuLieu & {
  thuongMoi: ThuongTuDong[];
  coHoiVien: boolean;
  muaTinhDiem: boolean;
  tenMua: string;
  myMemberId: string | null;
}) {
  const router = useRouter();
  const [moForm, setMoForm] = useState<string | null>(null);
  const [thongBao, setThongBao] = useState<{ ok: boolean; chu: string } | null>(
    null,
  );
  const [dangXuLy, startTransition] = useTransition();

  function baoKetQua(ok: boolean, chu: string) {
    setThongBao({ ok, chu });
    if (ok) am.dung();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="mx-auto max-w-3xl space-y-5 px-4 pt-4">
      <div>
        <h1 className="text-3xl">Góc Huynh đệ</h1>
        <p className="mt-1 text-sm text-white/65">
          Việc làm THẬT ngoài đời — được xác nhận là cộng vốn và điểm.{" "}
          {muaTinhDiem
            ? `Đang tính cho ${tenMua}.`
            : "Nhiệm vụ chỉ ghi nhận khi Ban Điều hành mở mùa giải chính thức — hiện đang chơi thử."}
        </p>
      </div>

      {tamDung && (
        <p className="flex items-start gap-2 rounded-2xl bg-white/10 p-3 text-sm text-white/85">
          <BieuTuong ten="khoa" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Nhiệm vụ Huynh đệ đang tạm dừng: chưa gửi được yêu cầu mới và hệ
            thống tạm chưa tự ghi nhận. Yêu cầu đang chờ vẫn được xử lý bình
            thường.
          </span>
        </p>
      )}

      {!coHoiVien && (
        <p className="rounded-2xl bg-amber-100 p-3 text-sm text-amber-900">
          Tài khoản của bạn chưa gắn với hồ sơ hội viên nên chưa nhận nhiệm vụ
          được. Nhờ thư ký Chi hội gắn giúp.
        </p>
      )}

      {thongBao && (
        <p
          className={`nn-hien rounded-2xl p-3 text-sm font-medium ${thongBao.ok ? "bg-emerald-500 text-white" : "bg-do-600 text-white"}`}
          role="status"
        >
          {thongBao.chu}
        </p>
      )}

      {thuongMoi.length > 0 && (
        <div className="nn-hien rounded-2xl bg-vang-500 p-3 text-navy-900">
          <div className="font-bold">Hệ thống vừa ghi nhận</div>
          <ul className="mt-1 space-y-0.5 text-sm">
            {thuongMoi.map((t, i) => (
              <li key={i}>
                {t.ten}: {t.moTa} <b>+{soDep(t.diem)}</b>
              </li>
            ))}
          </ul>
        </div>
      )}

      {nhoXacNhan.length > 0 && (
        <section className="rounded-3xl bg-white p-4 text-navy-900">
          <h2 className="flex items-center gap-2 text-xl">
            <BieuTuong ten="nguoi" className="h-5 w-5 text-son-600" /> Huynh đệ
            nhờ bạn xác nhận
          </h2>
          <ul className="mt-2 space-y-2">
            {nhoXacNhan.map((n) => (
              <li key={n.id} className="rounded-2xl bg-nga-50 p-3">
                <div className="text-sm">
                  <b>{n.nguoiNho}</b> báo đã làm nhiệm vụ <b>{n.ten}</b> liên
                  quan tới bạn:
                </div>
                <p className="mt-1 text-sm italic text-slate-700">“{n.moTa}”</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    disabled={dangXuLy}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await aXacNhanGiup(n.id, true);
                        baoKetQua(
                          r.ok,
                          r.ok
                            ? "Đã xác nhận giúp huynh đệ. Cảm ơn bạn!"
                            : r.loi,
                        );
                        router.refresh();
                      })
                    }
                    className="min-h-11 flex-1 rounded-full bg-emerald-600 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Đúng, tôi xác nhận
                  </button>
                  <button
                    type="button"
                    disabled={dangXuLy}
                    onClick={() =>
                      startTransition(async () => {
                        const r = await aXacNhanGiup(
                          n.id,
                          false,
                          "Hội viên liên quan không xác nhận",
                        );
                        baoKetQua(r.ok, r.ok ? "Đã báo không đúng." : r.loi);
                        router.refresh();
                      })
                    }
                    className="min-h-11 rounded-full px-4 text-sm font-medium text-slate-600 ring-1 ring-slate-300 disabled:opacity-60"
                  >
                    Không đúng
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {sinhNhat.length > 0 && (
        <section className="rounded-3xl bg-white p-4 text-navy-900">
          <h2 className="flex items-center gap-2 text-xl">
            <BieuTuong ten="banh" className="h-5 w-5 text-son-600" /> Sinh nhật
            hôm nay
          </h2>
          <p className="text-sm text-slate-500">
            {loiChuc
              ? `Gửi một lời chúc — nhiệm vụ “Lời chúc sinh nhật” (+${soDep(loiChuc.diem)} điểm, ${loiChuc.gioiHan.toLowerCase()}).`
              : "Gửi một lời chúc tới huynh đệ có sinh nhật hôm nay."}
          </p>
          <ul className="mt-2 space-y-2">
            {sinhNhat.map((s) => (
              <LoiChuc
                key={s.id}
                s={s}
                coTheChuc={coHoiVien && s.id !== myMemberId}
                gui={(noiDung) =>
                  new Promise<void>((xong) =>
                    startTransition(async () => {
                      const r = await aGuiLoiChuc(s.id, noiDung);
                      const thuong = r.ok
                        ? r.data.reduce((a, t) => a + t.diem, 0)
                        : 0;
                      baoKetQua(
                        r.ok,
                        r.ok
                          ? `Đã gửi lời chúc tới ${s.ten}${thuong ? ` · +${thuong} điểm` : ""}`
                          : r.loi,
                      );
                      router.refresh();
                      xong();
                    }),
                  )
                }
              />
            ))}
          </ul>
        </section>
      )}

      {Object.entries(NHOM_NHIEM_VU).map(([ma, ten]) => (
        <section key={ma}>
          <h2 className="mb-2 text-2xl">{ten}</h2>
          <div className="space-y-2">
            {nhiemVu
              .filter((n) => n.muc === ma)
              .map((n) => {
                const du = n.toiDa > 0 && n.daLamTrongKy >= n.toiDa;
                return (
                  <article
                    key={n.ma}
                    className="rounded-3xl bg-white p-4 text-navy-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold">{n.ten}</h3>
                        <p className="mt-0.5 text-sm text-slate-600">
                          {n.viec}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="nn-so text-lg font-black text-son-700">
                          +{soDep(n.diem)}
                        </div>
                        <div className="text-[11px] text-slate-500">điểm</div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                      {MA_VON.filter((k) => (n.von as Partial<Von>)[k]).map(
                        (k) => (
                          <span
                            key={k}
                            className="rounded-full px-2 py-0.5 font-semibold text-white"
                            style={{ background: VON[k].mau }}
                          >
                            {VON[k].ngan} +{(n.von as Partial<Von>)[k]}
                          </span>
                        ),
                      )}
                      <span className="rounded-full bg-navy-50 px-2 py-0.5 text-navy-700">
                        {n.tuDong && n.thuCong
                          ? `${CACH.TU_DONG} hoặc ${CACH[n.thuCong].toLowerCase()}`
                          : CACH[
                              n.tuDong ? "TU_DONG" : (n.thuCong ?? "BAN_DUYET")
                            ]}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">
                        {n.toiDa > 0
                          ? `${n.daLamTrongKy}/${n.toiDa} ${n.kyTen}`
                          : n.gioiHan}
                      </span>
                      {n.daXacNhan > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                          Đã xong {n.daXacNhan} lần
                        </span>
                      )}
                      {n.dangCho > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800">
                          {n.dangCho} đang chờ
                        </span>
                      )}
                    </div>
                    {n.tuDong && !n.thuCong && (
                      <p className="mt-2 text-xs text-slate-500">
                        {n.xacNhan}. Không cần gửi — làm xong là hệ thống tự
                        cộng khi bạn mở game.
                      </p>
                    )}
                    {n.thuCong && coHoiVien && muaTinhDiem && !tamDung && (
                      <>
                        {moForm === n.ma ? (
                          <FormNhiemVu
                            n={n}
                            huy={() => setMoForm(null)}
                            gui={async (d) => {
                              const r = await aGuiNhiemVu({ maNv: n.ma, ...d });
                              if (r.ok) {
                                setMoForm(null);
                                baoKetQua(
                                  true,
                                  `Đã gửi “${n.ten}”. ${n.thuCong === "HOI_VIEN" ? "Chờ hội viên liên quan xác nhận." : "Chờ Ban phụ trách duyệt."}`,
                                );
                                router.refresh();
                              }
                              return r.ok ? null : r.loi;
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={du}
                            onClick={() => setMoForm(n.ma)}
                            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-son-600 text-sm font-bold text-white hover:bg-son-700 disabled:bg-slate-200 disabled:text-slate-500"
                          >
                            <BieuTuong ten="tay" className="h-4 w-4" />{" "}
                            {du ? `Đã đủ lượt ${n.kyTen}` : "Báo đã làm"}
                          </button>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
          </div>
        </section>
      ))}

      <section className="rounded-3xl bg-white p-4 text-navy-900">
        <h2 className="text-xl">Nhật ký nhiệm vụ</h2>
        {lichSu.length === 0 ? (
          <p className="mt-1 text-sm text-slate-500">
            Chưa có nhiệm vụ nào trong mùa này.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-100">
            {lichSu.map((l) => (
              <li key={l.id} className="flex items-start gap-3 py-2.5 text-sm">
                <span
                  className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                    l.trangThai === "DA_XAC_NHAN"
                      ? "bg-emerald-500"
                      : l.trangThai === "CHO_XAC_NHAN"
                        ? "bg-amber-400"
                        : "bg-slate-300"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">
                    {l.ten}{" "}
                    <span className="font-normal text-slate-500">
                      · {TRANG_THAI_NV[l.trangThai] ?? l.trangThai}
                    </span>
                  </div>
                  {l.moTa && <div className="text-slate-600">{l.moTa}</div>}
                  {l.lienQuan && (
                    <div className="text-xs text-slate-500">
                      Người xác nhận: {l.lienQuan}
                    </div>
                  )}
                  {l.lyDo && (
                    <div className="text-xs text-do-600">{l.lyDo}</div>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  {l.diem > 0 && (
                    <div className="nn-so font-bold text-emerald-600">
                      +{soDep(l.diem)}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400">
                    {new Date(l.ngay).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function FormNhiemVu({
  n,
  huy,
  gui,
}: {
  n: DuLieu["nhiemVu"][number];
  huy: () => void;
  gui: (d: {
    moTa: string;
    anh: string | null;
    lienQuanMemberId: string | null;
  }) => Promise<string | null>;
}) {
  const [loi, setLoi] = useState<string | null>(null);
  const [dangGui, setDangGui] = useState(false);
  return (
    <form
      className="nn-hien mt-3 space-y-3 rounded-2xl bg-nga-50 p-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setDangGui(true);
        setLoi(null);
        const kq = await gui({
          moTa: String(fd.get("moTa") ?? ""),
          anh: String(fd.get("anh") ?? "") || null,
          lienQuanMemberId: String(fd.get("lienQuan") ?? "") || null,
        });
        setDangGui(false);
        if (kq) setLoi(kq);
      }}
    >
      {n.thuCong === "HOI_VIEN" && (
        <MemberPicker
          name="lienQuan"
          label="Hội viên sẽ xác nhận giúp bạn"
          required
          placeholder="Gõ tên công ty hoặc tên hội viên..."
        />
      )}
      <div>
        <label className="lbl" htmlFor={`moTa-${n.ma}`}>
          Bạn đã làm gì?
        </label>
        <textarea
          id={`moTa-${n.ma}`}
          name="moTa"
          rows={3}
          required
          minLength={10}
          maxLength={1000}
          className="inp"
          placeholder={n.goiY}
        />
      </div>
      {n.canAnh && (
        <AnhTaiLen
          name="anh"
          label="Ảnh chụp màn hình"
          tyLe="ngang"
          goiY="Chụp phần bình luận hoặc bài chia sẻ của bạn."
        />
      )}
      {loi && (
        <p
          className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700"
          role="alert"
        >
          {loi}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={huy}
          className="min-h-11 rounded-full px-4 text-sm font-medium text-slate-600 hover:bg-white"
        >
          Để sau
        </button>
        <button
          type="submit"
          disabled={dangGui}
          className="min-h-11 flex-1 rounded-full bg-navy-600 text-sm font-bold text-white disabled:opacity-60"
        >
          {dangGui ? "Đang gửi..." : "Gửi xác nhận"}
        </button>
      </div>
    </form>
  );
}

function LoiChuc({
  s,
  coTheChuc,
  gui,
}: {
  s: DuLieu["sinhNhat"][number];
  coTheChuc: boolean;
  gui: (noiDung: string) => Promise<void>;
}) {
  const [mo, setMo] = useState(false);
  const [noiDung, setNoiDung] = useState("");
  const [dangGui, setDangGui] = useState(false);
  return (
    <li className="rounded-2xl bg-nga-50 p-3">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-son-600 font-bold text-white">
          {s.anh ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={s.anh} alt="" className="h-full w-full object-cover" />
          ) : (
            chuCaiTen(s.ten)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{s.ten}</div>
          <div className="truncate text-xs text-slate-500">{s.congTy}</div>
        </div>
        {s.daChuc ? (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            Đã chúc
          </span>
        ) : coTheChuc ? (
          <button
            type="button"
            onClick={() => setMo((x) => !x)}
            className="min-h-10 rounded-full bg-son-600 px-4 text-sm font-bold text-white"
          >
            Chúc mừng
          </button>
        ) : null}
      </div>
      {mo && !s.daChuc && (
        <div className="mt-2 flex gap-2">
          <input
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
            maxLength={300}
            className="inp"
            placeholder="Chúc anh/chị tuổi mới sức khỏe, thành công..."
          />
          <button
            type="button"
            disabled={dangGui}
            onClick={async () => {
              setDangGui(true);
              await gui(noiDung);
              setDangGui(false);
              setMo(false);
            }}
            className="min-h-10 shrink-0 rounded-full bg-navy-600 px-4 text-sm font-bold text-white disabled:opacity-60"
          >
            Gửi
          </button>
        </div>
      )}
    </li>
  );
}
