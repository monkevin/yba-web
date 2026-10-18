"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  batDauTest,
  guiTinhCach,
  guiKhiChat,
  lamLaiKhach,
  type KetQuaGui,
} from "./actions";
import type { TinhCachKey } from "@/lib/chan-dung";
import type { KhiChatKey } from "@/lib/khi-chat-noi-dung";

export type ThongTinKhach = {
  name: string;
  phone: string;
  email: string | null;
  ngheNghiep: string | null;
  congTy: string | null;
  nganhNghe: string | null;
  noiSinh: string | null;
  birthDate: Date | null;
  gioSinh: number | null;
};

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

/**
 * Biểu mẫu khai thông tin trước khi làm bài. Đây vừa là điều kiện để tính được
 * phần tử vi/thần số học, vừa là cách Chi hội biết ai đang quan tâm tới mình.
 */
export function FormThongTin({
  banDau,
  nganhNghe,
}: {
  banDau: ThongTinKhach | null;
  nganhNghe: string[];
}) {
  const [state, formAction, pending] = useActionState<KetQuaGui, FormData>(
    batDauTest,
    {}
  );

  const namNay = new Date().getFullYear();
  const [thang, datThang] = useState((banDau?.birthDate?.getMonth() ?? 0) + 1);
  const [nam, datNam] = useState(banDau?.birthDate?.getFullYear() ?? 1985);
  const soNgay = new Date(nam, thang, 0).getDate();

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-do-50 px-4 py-3 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Họ và tên" batBuoc>
          <input
            name="name"
            className="inp"
            required
            maxLength={60}
            defaultValue={banDau?.name ?? ""}
            placeholder="Nguyễn Văn A"
          />
        </O>
        <O label="Số điện thoại" batBuoc>
          <input
            name="phone"
            type="tel"
            className="inp"
            required
            maxLength={20}
            defaultValue={banDau?.phone ?? ""}
            placeholder="0903 000 000"
          />
        </O>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Nghề nghiệp / chức vụ">
          <input
            name="ngheNghiep"
            className="inp"
            maxLength={80}
            defaultValue={banDau?.ngheNghiep ?? ""}
            placeholder="Giám đốc, chủ doanh nghiệp…"
          />
        </O>
        <O label="Tên công ty">
          <input
            name="congTy"
            className="inp"
            maxLength={120}
            defaultValue={banDau?.congTy ?? ""}
          />
        </O>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Ngành nghề">
          <input
            name="nganhNghe"
            className="inp"
            list="ds-nganh"
            maxLength={80}
            defaultValue={banDau?.nganhNghe ?? ""}
            placeholder="Chọn hoặc tự nhập"
          />
          <datalist id="ds-nganh">
            {nganhNghe.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </O>
        <O label="Email">
          <input
            name="email"
            type="email"
            className="inp"
            maxLength={120}
            defaultValue={banDau?.email ?? ""}
          />
        </O>
      </div>

      <O label="Ngày tháng năm sinh" batBuoc goiY="Dùng để tính thần số học và tử vi.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <select
            name="ngay"
            className="inp"
            defaultValue={banDau?.birthDate?.getDate() ?? 1}
          >
            {Array.from({ length: soNgay }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                Ngày {d}
              </option>
            ))}
          </select>
          <select
            name="thang"
            className="inp"
            value={thang}
            onChange={(e) => datThang(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                Tháng {m}
              </option>
            ))}
          </select>
          <select
            name="nam"
            className="inp col-span-2 sm:col-span-1"
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
        </div>
      </O>

      <div className="grid gap-4 sm:grid-cols-2">
        <O
          label="Giờ sinh"
          goiY="Có giờ sinh mới lập được lá số tử vi 12 cung. Không nhớ thì để trống."
        >
          <select
            name="gioSinh"
            className="inp"
            defaultValue={banDau?.gioSinh ?? ""}
          >
            <option value="">Không nhớ giờ sinh</option>
            {GIO_CHI.map((g) => (
              <option key={g.gio} value={g.gio}>
                {g.nhan}
              </option>
            ))}
          </select>
        </O>
        <O label="Nơi sinh">
          <input
            name="noiSinh"
            className="inp"
            maxLength={80}
            defaultValue={banDau?.noiSinh ?? ""}
            placeholder="Tỉnh / thành phố"
          />
        </O>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Đang xử lý…" : banDau ? "Cập nhật thông tin" : "Xem chân dung của tôi →"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        Thông tin của anh/chị được Chi hội Doanh nhân trẻ Chợ Lớn lưu để gửi kết
        quả và giới thiệu các hoạt động phù hợp. Chúng tôi không chia sẻ cho bên
        thứ ba.
      </p>
    </form>
  );
}

function O({
  label,
  batBuoc,
  goiY,
  children,
}: {
  label: string;
  batBuoc?: boolean;
  goiY?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {batBuoc && <span className="ml-0.5 text-do-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
      {goiY && <span className="mt-1 block text-xs text-slate-500">{goiY}</span>}
    </label>
  );
}

type CauHoi<K> = { q: string; options: { text: string; type: K }[] };

function TracNghiemKhach<K extends string>({
  cauHoi,
  nop,
  dangCham,
}: {
  cauHoi: CauHoi<K>[];
  nop: (t: K[]) => Promise<unknown>;
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
        datLoi(e instanceof Error ? e.message : "Có lỗi, anh/chị thử lại nhé");
        datTraLoi([]);
        datI(0);
      }
    });
  }

  if (dangGui) {
    return <p className="animate-pulse py-12 text-center text-slate-500">{dangCham}</p>;
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

      <p className="text-lg font-semibold leading-snug text-navy-800">{q.q}</p>
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

export function BaiTinhCachKhach({ cauHoi }: { cauHoi: CauHoi<TinhCachKey>[] }) {
  return (
    <TracNghiemKhach
      cauHoi={cauHoi}
      nop={(t) => guiTinhCach(t)}
      dangCham="Đang tổng hợp nhóm tính cách của anh/chị…"
    />
  );
}

export function BaiKhiChatKhach({ cauHoi }: { cauHoi: CauHoi<KhiChatKey>[] }) {
  return (
    <TracNghiemKhach
      cauHoi={cauHoi}
      nop={(t) => guiKhiChat(t)}
      dangCham="Đang chấm khí chất doanh nhân…"
    />
  );
}

export function NutLamLaiKhach({ bai }: { bai: "tinh-cach" | "khi-chat" }) {
  const router = useRouter();
  const [dangChay, batDau] = useTransition();

  return (
    <button
      type="button"
      disabled={dangChay}
      onClick={() => {
        if (!confirm("Làm lại bài này? Kết quả cũ sẽ bị xoá.")) return;
        batDau(async () => {
          await lamLaiKhach(bai);
          router.refresh();
        });
      }}
      className="btn-ghost"
    >
      {dangChay ? "…" : "Làm lại bài"}
    </button>
  );
}
