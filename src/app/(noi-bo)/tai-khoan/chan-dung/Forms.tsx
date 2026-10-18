"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { luuNgaySinh, luuTinhCach, luuKhiChat, lamLai } from "./actions";
import type { TinhCachKey } from "@/lib/chan-dung";
import type { KhiChatKey } from "@/lib/khi-chat-noi-dung";

/**
 * 12 khung giờ theo địa chi — người Việt quen nói "giờ Tý", "giờ Ngọ" hơn là
 * giờ đồng hồ, nên hiện cả hai cách cho dễ chọn.
 */
const GIO_CHI = [
  { gio: 0, nhan: "Giờ Tý (23h – 01h)" },
  { gio: 2, nhan: "Giờ Sửu (01h – 03h)" },
  { gio: 4, nhan: "Giờ Dần (03h – 05h)" },
  { gio: 6, nhan: "Giờ Mão (05h – 07h)" },
  { gio: 8, nhan: "Giờ Thìn (07h – 09h)" },
  { gio: 10, nhan: "Giờ Tỵ (09h – 11h)" },
  { gio: 12, nhan: "Giờ Ngọ (11h – 13h)" },
  { gio: 14, nhan: "Giờ Mùi (13h – 15h)" },
  { gio: 16, nhan: "Giờ Thân (15h – 17h)" },
  { gio: 18, nhan: "Giờ Dậu (17h – 19h)" },
  { gio: 20, nhan: "Giờ Tuất (19h – 21h)" },
  { gio: 22, nhan: "Giờ Hợi (21h – 23h)" },
];

export type ThongTinGoc = {
  ngaySinh: Date | null;
  gioSinh: number | null;
  noiSinh: string;
  hoTen: string;
};

/** Ô nhập thông tin gốc — dùng chung cho cả bốn bài. */
export function FormNgaySinh({ banDau }: { banDau: ThongTinGoc | null }) {
  const router = useRouter();
  const [dangLuu, batDau] = useTransition();
  const [loi, datLoi] = useState("");

  const ns = banDau?.ngaySinh ?? null;
  const namNay = new Date().getFullYear();
  const [ngay, datNgay] = useState(ns?.getDate() ?? 1);
  const [thang, datThang] = useState((ns?.getMonth() ?? 0) + 1);
  const [nam, datNam] = useState(ns?.getFullYear() ?? 1985);
  const [gio, datGio] = useState<string>(
    banDau?.gioSinh != null ? String(banDau.gioSinh) : ""
  );
  const [noiSinh, datNoiSinh] = useState(banDau?.noiSinh ?? "");
  const [hoTen, datHoTen] = useState(banDau?.hoTen ?? "");

  const soNgay = new Date(nam, thang, 0).getDate();

  return (
    <div>
      {/* Điện thoại: ngày + tháng một hàng, năm xuống hàng dưới cho đỡ chật */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs text-slate-500">Ngày</span>
          <select
            className="inp mt-1"
            value={Math.min(ngay, soNgay)}
            onChange={(e) => datNgay(Number(e.target.value))}
          >
            {Array.from({ length: soNgay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Tháng</span>
          <select
            className="inp mt-1"
            value={thang}
            onChange={(e) => datThang(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
        </label>
        <label className="col-span-2 block sm:col-span-1">
          <span className="text-xs text-slate-500">Năm</span>
          <select
            className="inp mt-1"
            value={nam}
            onChange={(e) => datNam(Number(e.target.value))}
          >
            {Array.from({ length: namNay - 1930 + 1 }, (_, i) => namNay - i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              )
            )}
          </select>
        </label>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs text-slate-500">Giờ sinh</span>
          <select
            className="inp mt-1"
            value={gio}
            onChange={(e) => datGio(e.target.value)}
          >
            <option value="">Không nhớ giờ sinh</option>
            {GIO_CHI.map((g) => (
              <option key={g.gio} value={g.gio}>
                {g.nhan}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">Nơi sinh</span>
          <input
            className="inp mt-1"
            value={noiSinh}
            maxLength={80}
            onChange={(e) => datNoiSinh(e.target.value)}
            placeholder="Tỉnh / thành phố"
          />
        </label>
      </div>

      <label className="mt-3 block">
        <span className="text-xs text-slate-500">Họ tên khai sinh</span>
        <input
          className="inp mt-1"
          value={hoTen}
          maxLength={60}
          onChange={(e) => datHoTen(e.target.value)}
          placeholder="Ví dụ: Đặng Viên Khang"
        />
        <span className="mt-1 block text-xs text-slate-500">
          Dùng để tính Số sứ mệnh, Số linh hồn và Số nhân cách.
        </span>
      </label>

      <button
        type="button"
        disabled={dangLuu}
        onClick={() =>
          batDau(async () => {
            try {
              datLoi("");
              await luuNgaySinh(
                Math.min(ngay, soNgay),
                thang,
                nam,
                gio === "" ? null : Number(gio),
                noiSinh,
                hoTen
              );
              router.refresh();
            } catch (e) {
              datLoi(e instanceof Error ? e.message : "Có lỗi khi lưu");
            }
          })
        }
        className="btn-primary mt-4 w-full"
      >
        {dangLuu ? "Đang lưu…" : banDau?.ngaySinh ? "Cập nhật thông tin" : "Xem kết quả"}
      </button>

      {loi && <p className="mt-2 text-sm text-do-600">{loi}</p>}
      <p className="mt-2 text-xs leading-relaxed text-slate-500">
        Thông tin này chỉ hiện với riêng anh/chị, không xuất hiện ở hồ sơ doanh
        nghiệp công khai.
      </p>
    </div>
  );
}

type CauHoi<K> = { q: string; options: { text: string; type: K }[] };

/**
 * Bộ trắc nghiệm dùng chung cho cả tính cách (12 câu, 4 lựa chọn) và khí chất
 * (15 câu, 5 lựa chọn): hiện từng câu một, chọn xong câu cuối là tự nộp.
 */
function TracNghiem<K extends string>({
  cauHoi,
  nop,
  dangCham,
}: {
  cauHoi: CauHoi<K>[];
  nop: (traLoi: K[]) => Promise<unknown>;
  dangCham: string;
}) {
  const router = useRouter();
  const [i, datI] = useState(0);
  const [traLoi, datTraLoi] = useState<K[]>([]);
  const [dangGui, batDau] = useTransition();
  const [loi, datLoi] = useState("");

  const tong = cauHoi.length;
  const q = cauHoi[i];

  function chon(type: K) {
    const tiep = [...traLoi, type];
    if (tiep.length < tong) {
      datTraLoi(tiep);
      datI(i + 1);
      return;
    }
    batDau(async () => {
      try {
        datLoi("");
        await nop(tiep);
        router.refresh();
      } catch (e) {
        datLoi(e instanceof Error ? e.message : "Có lỗi khi lưu, thử lại nhé");
        datTraLoi([]);
        datI(0);
      }
    });
  }

  if (dangGui) {
    return (
      <p className="animate-pulse py-10 text-center text-slate-500">
        {dangCham}
      </p>
    );
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-navy-100">
          <div
            className="h-full rounded-full bg-do-500 transition-all"
            style={{ width: `${(i / tong) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-slate-500">
          {i + 1}/{tong}
        </span>
      </div>

      <p className="font-semibold text-navy-800">{q.q}</p>
      <div className="mt-4 space-y-2">
        {q.options.map((o, k) => (
          <button
            key={k}
            type="button"
            onClick={() => chon(o.type)}
            className="min-h-11 w-full rounded-xl border border-navy-100 px-4 py-3 text-left text-sm leading-relaxed text-slate-700 transition hover:border-do-300 hover:bg-do-50"
          >
            {o.text}
          </button>
        ))}
      </div>

      {i > 0 && (
        <button
          type="button"
          onClick={() => {
            datI(i - 1);
            datTraLoi(traLoi.slice(0, -1));
          }}
          className="mt-4 text-xs text-slate-500 hover:text-navy-700"
        >
          ← Quay lại câu trước
        </button>
      )}
      {loi && <p className="mt-3 text-sm text-do-600">{loi}</p>}
    </div>
  );
}

export function BaiTinhCach({ cauHoi }: { cauHoi: CauHoi<TinhCachKey>[] }) {
  return (
    <TracNghiem
      cauHoi={cauHoi}
      nop={(t) => luuTinhCach(t)}
      dangCham="Đang tổng hợp nhóm tính cách của anh/chị…"
    />
  );
}

export function BaiKhiChat({ cauHoi }: { cauHoi: CauHoi<KhiChatKey>[] }) {
  return (
    <TracNghiem
      cauHoi={cauHoi}
      nop={(t) => luuKhiChat(t)}
      dangCham="Đang chấm khí chất doanh nhân…"
    />
  );
}

export function NutLamLai({ bai }: { bai: "tinh-cach" | "khi-chat" }) {
  const router = useRouter();
  const [dangChay, batDau] = useTransition();

  return (
    <button
      type="button"
      disabled={dangChay}
      onClick={() => {
        if (!confirm("Làm lại bài này? Kết quả cũ sẽ bị xoá.")) return;
        batDau(async () => {
          await lamLai(bai);
          router.refresh();
        });
      }}
      className="btn-ghost"
    >
      {dangChay ? "…" : "Làm lại bài"}
    </button>
  );
}
