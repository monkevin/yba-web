"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import BieuTuong from "@/components/ngoi-nha/BieuTuong";
import type { bangDauTri } from "@/lib/ngoi-nha/dau-tri";
import { chuCaiTen, soDep } from "@/lib/ngoi-nha/luat";
import { aBangDauTri } from "../../../actions";

type Bang = Awaited<ReturnType<typeof bangDauTri>>;

export default function BangDauTri({
  phien,
  banDau,
  sanKhau,
}: {
  phien: {
    id: string;
    ten: string;
    moTa: string | null;
    maThamGia: string;
    trangThai: string;
    giay: number;
  };
  banDau: Bang;
  sanKhau: boolean;
}) {
  const [bang, setBang] = useState<Bang>(banDau);
  const [lucCapNhat, setLucCapNhat] = useState<Date | null>(null);
  // Tên miền chỉ biết được ở trình duyệt (chiếu ở sự kiện có khi là
  // http://<IP laptop>:3002). Đọc qua useSyncExternalStore để máy chủ dựng
  // chuỗi rỗng rồi trình duyệt điền sau khi gắn — không lệch lúc hydrate.
  const goc = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => "",
  );
  const url = `${goc}/ngoi-nha/dau-tri/${phien.id}`;

  // Tự làm mới mỗi 5 giây — đủ nhanh cho sân khấu, không dồn máy chủ
  useEffect(() => {
    let dung = false;
    const id = setInterval(async () => {
      const r = await aBangDauTri(phien.id);
      if (!dung && r.ok) {
        setBang(r.data);
        setLucCapNhat(new Date());
      }
    }, 5000);
    return () => {
      dung = true;
      clearInterval(id);
    };
  }, [phien.id]);

  const top3 = bang.dong.slice(0, 3);
  const conLai = bang.dong.slice(3, sanKhau ? 15 : 50);

  if (sanKhau) {
    return (
      <main className="mx-auto max-w-6xl px-6 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.3em] text-son-300">
              Đấu trí doanh nhân · YBA Chợ Lớn
            </div>
            <h1 className="text-4xl lg:text-5xl">{phien.ten}</h1>
            {phien.moTa && (
              <p className="mt-1 text-lg text-white/70">{phien.moTa}</p>
            )}
          </div>
          <div className="rounded-3xl bg-white px-6 py-4 text-center text-navy-900">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
              Mã tham gia
            </div>
            <div className="nn-so text-5xl font-black tracking-[0.2em] text-son-700">
              {phien.maThamGia}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              ybacholon.vn → Khu hội viên → Ngôi nhà Chợ Lớn → Đấu trí
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
          <section>
            <div className="grid grid-cols-3 items-end gap-3">
              {[top3[1], top3[0], top3[2]].map((d, i) =>
                d ? (
                  <div key={d.userId} className="text-center">
                    <span
                      className={`mx-auto grid place-items-center overflow-hidden rounded-full bg-navy-600 font-bold text-white ${i === 1 ? "h-24 w-24 text-3xl ring-4 ring-vang-400" : "h-16 w-16 text-xl ring-2 ring-white/60"}`}
                    >
                      {d.anh ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={d.anh}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        chuCaiTen(d.ten)
                      )}
                    </span>
                    <div className="mt-2 text-xl font-bold">{d.ten}</div>
                    {d.congTy && (
                      <div className="line-clamp-1 text-sm text-white/60">
                        {d.congTy}
                      </div>
                    )}
                    <div className="nn-so text-3xl font-black text-vang-400">
                      {soDep(d.diem)}
                    </div>
                    <div
                      className={`mt-2 grid place-items-center rounded-t-2xl text-4xl font-black ${i === 1 ? "h-28 bg-gradient-to-b from-vang-400 to-vang-600 text-navy-900" : i === 0 ? "h-20 bg-white/15" : "h-14 bg-white/15"}`}
                    >
                      {d.hang}
                    </div>
                  </div>
                ) : (
                  <div key={i} />
                ),
              )}
            </div>
            {conLai.length > 0 && (
              <ol className="mt-4 grid gap-2 sm:grid-cols-2">
                {conLai.map((d) => (
                  <li
                    key={d.userId}
                    className="nn-kinh flex items-center gap-3 rounded-2xl px-4 py-2 text-lg"
                  >
                    <span className="nn-so w-8 text-center font-bold text-white/60">
                      {d.hang}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-semibold">
                      {d.ten}
                    </span>
                    <span className="nn-so font-black text-vang-400">
                      {soDep(d.diem)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            {bang.dong.length === 0 && (
              <p className="mt-8 text-center text-2xl text-white/60">
                Chưa có ai nộp bài — quét mã và bắt đầu nào!
              </p>
            )}
          </section>
          <aside className="nn-kinh rounded-3xl p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl">Có mặt</h2>
              <span className="nn-so text-3xl font-black text-vang-400">
                {bang.soNguoi}
              </span>
            </div>
            <p className="text-sm text-white/60">
              {bang.dangChoi.length} người đang chơi · {bang.dong.length} đã nộp
              bài
            </p>
            <ul className="mt-3 max-h-[52vh] space-y-1 overflow-y-auto text-base">
              {[
                ...bang.dangChoi.map((d) => ({ ...d, dang: true })),
                ...bang.dong.map((d) => ({
                  userId: d.userId,
                  ten: d.ten,
                  congTy: d.congTy,
                  dang: false,
                })),
              ].map((d) => (
                <li key={d.userId} className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${d.dang ? "bg-vang-400 nn-lap-lanh" : "bg-emerald-400"}`}
                  />
                  <span className="truncate">{d.ten}</span>
                  {d.congTy && (
                    <span className="truncate text-xs text-white/50">
                      · {d.congTy}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-white/40">
              Tự làm mới mỗi 5 giây
              {lucCapNhat ? ` · ${lucCapNhat.toLocaleTimeString("vi-VN")}` : ""}
            </p>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pt-4">
      <Link
        href="/ngoi-nha/dau-tri"
        className="inline-flex min-h-11 items-center gap-1.5 text-sm text-white/70 hover:text-white"
      >
        <BieuTuong ten="quay-lai" className="h-4 w-4" /> Đấu trí sự kiện
      </Link>
      <h1 className="text-3xl">{phien.ten}</h1>
      <p className="text-sm text-white/65">
        Mã {phien.maThamGia} · {bang.soNguoi} người tham gia ·{" "}
        {phien.trangThai === "DANG_MO"
          ? "đang diễn ra"
          : phien.trangThai === "SAP_MO"
            ? "chưa mở"
            : "đã kết thúc"}
      </p>
      {bang.cuaToi && (
        <div className="mt-3 rounded-2xl bg-son-600 p-3 text-sm">
          Bạn đang hạng <b className="text-lg">{bang.cuaToi.hang}</b>/
          {bang.dong.length} với {soDep(bang.cuaToi.diem)} điểm · đúng{" "}
          {bang.cuaToi.soDung} câu
        </div>
      )}
      {phien.trangThai === "DANG_MO" && !bang.cuaToi && (
        <Link
          href={`/ngoi-nha/dau-tri/${phien.id}`}
          className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-son-600 font-bold text-white"
        >
          Vào chơi ngay
        </Link>
      )}
      <ol className="mt-4 overflow-hidden rounded-3xl bg-white text-navy-900">
        {bang.dong.length === 0 && (
          <li className="px-4 py-8 text-center text-sm text-slate-500">
            Chưa có ai nộp bài.
          </li>
        )}
        {bang.dong.slice(0, 50).map((d) => (
          <li
            key={d.userId}
            className={`flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 last:border-0 ${d.laToi ? "bg-son-50" : ""}`}
          >
            <span
              className={`nn-so grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${d.hang === 1 ? "bg-vang-500 text-navy-900" : "bg-slate-100 text-slate-600"}`}
            >
              {d.hang}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {d.ten}
              </span>
              {d.congTy && (
                <span className="block truncate text-xs text-slate-500">
                  {d.congTy}
                </span>
              )}
            </span>
            <span className="text-right">
              <span className="nn-so block font-bold">{soDep(d.diem)}</span>
              <span className="block text-xs text-slate-500">
                {d.soDung} đúng · {(d.ms / 1000).toFixed(0)}s
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-center text-xs text-white/50">
        Ban Tổ chức chiếu bảng này lên màn hình:{" "}
        <Link
          href={`/ngoi-nha/dau-tri/${phien.id}/bang?san-khau=1`}
          className="underline"
        >
          bản sân khấu
        </Link>
        {" · "}
        {url}
      </p>
    </main>
  );
}
