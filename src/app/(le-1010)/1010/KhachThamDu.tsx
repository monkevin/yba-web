"use client";

import { useState } from "react";

const VANG = "#e3b94a";

const TEN_PHIEN: Record<string, string> = {
  TOA_DAM: "Tọa đàm",
  CHUYEN_GIAO: "Lễ chuyển giao",
  GALA: "Gala",
};

export type KhachHien = {
  id: string;
  ten: string;
  danhXung: string | null;
  chucDanh: string | null;
  donVi: string | null;
  phien: string | null;
  /** URL ảnh đại diện (đã kiểm tra tồn tại ở máy chủ) hoặc null */
  anh: string | null;
  /** Nhân vật xếp đầu, có vòng vàng bao quanh (anh Phan Tấn Đạt — Chủ
   *  tịch Hội; Chủ nhiệm chốt 24/09) */
  noiBat?: boolean;
};

export type NhomHien = {
  tieuDe: string;
  ghiChu?: string;
  khach: KhachHien[];
};

function tenPhien(phien: string | null): string {
  const ds = (phien ?? "").split(",").filter(Boolean);
  if (ds.length === 0) return "";
  if (ds.length === 3) return "Cả ba phiên";
  return ds.map((p) => TEN_PHIEN[p] ?? p).join(" · ");
}

function VongAnh({ k }: { k: KhachHien }) {
  const co = k.noiBat ? "h-16 w-16" : "h-12 w-12";
  const vien = k.noiBat
    ? "ring-4 ring-amber-400 shadow-[0_0_22px_rgba(227,185,74,0.55)]"
    : k.anh
      ? "ring-2 ring-amber-400/60"
      : "ring-2 ring-white/25";
  if (k.anh) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={k.anh}
        alt={k.ten}
        loading="lazy"
        className={`${co} shrink-0 rounded-full object-cover ${vien}`}
      />
    );
  }
  return (
    <span
      className={`${co} flex shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-extrabold ${vien}`}
      style={{ color: VANG }}
    >
      {k.ten.trim().split(/\s+/).pop()?.charAt(0) ?? "?"}
    </span>
  );
}

function TheKhach({ k }: { k: KhachHien }) {
  return (
    <div
      className={
        "flex items-center gap-3 rounded-xl px-3.5 py-2.5 " +
        (k.noiBat
          ? "border-2 border-amber-400/90 bg-gradient-to-r from-amber-500/20 to-transparent shadow-[0_0_30px_rgba(227,185,74,0.25)]"
          : "border border-white/15 bg-white/5")
      }
    >
      <VongAnh k={k} />
      <div className="min-w-0">
        <p
          className={`truncate font-bold ${k.noiBat ? "text-base" : "text-sm"} text-white`}
        >
          {[k.danhXung, k.ten].filter(Boolean).join(" ")}
        </p>
        <p className="truncate text-xs text-white/60">
          {[k.chucDanh, k.donVi].filter(Boolean).join(" · ")}
        </p>
        {tenPhien(k.phien) && (
          <p className="mt-0.5 text-[11px] font-semibold" style={{ color: VANG }}>
            {tenPhien(k.phien)}
          </p>
        )}
      </div>
    </div>
  );
}

function KhoiNhom({ nhom }: { nhom: NhomHien }) {
  const [moRong, setMoRong] = useState(false);
  const SO_DAU = 24;
  const hien = moRong ? nhom.khach : nhom.khach.slice(0, SO_DAU);
  if (nhom.khach.length === 0) return null;
  return (
    <div className="mt-10 first:mt-0">
      <h3 className="text-center text-lg font-extrabold" style={{ color: VANG }}>
        {nhom.tieuDe}{" "}
        <span className="font-bold text-white/60">({nhom.khach.length})</span>
      </h3>
      {nhom.ghiChu && (
        <p className="mt-1 text-center text-xs text-white/55">{nhom.ghiChu}</p>
      )}
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {hien.map((k) => (
          <TheKhach key={k.id} k={k} />
        ))}
      </div>
      {nhom.khach.length > SO_DAU && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setMoRong((v) => !v)}
            className="rounded-full border border-amber-400/70 px-6 py-2.5 text-sm font-bold transition hover:bg-amber-400/10"
            style={{ color: VANG }}
          >
            {moRong
              ? "Thu gọn ↑"
              : `Xem tất cả ${nhom.khach.length} anh/chị ↓`}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Danh sách CÔNG KHAI trên landing 10/10 — khách ĐÃ XÁC NHẬN chia BA nhóm
 * theo vai vế (Chủ nhiệm chốt 24/09): ① Ban Thường trực & BCH Hội, ② Hội
 * DNT TP.HCM (Chợ Lớn + Văn phòng Hội + các Chi hội), ③ Khách mời của YBA
 * Chợ Lớn (gộp mọi nhóm khác — KHÔNG nêu tên nhóm nội bộ như "khách VIP
 * của…"). Chỉ hiện tên + chức danh + đơn vị + phiên — KHÔNG SĐT/email/bàn.
 */
export default function KhachThamDu({ nhom }: { nhom: NhomHien[] }) {
  const tong = nhom.reduce((s, n) => s + n.khach.length, 0);
  if (tong === 0) return null;
  return (
    <div>
      <p className="text-center text-lg font-extrabold text-white">
        🎉 <span style={{ color: VANG }}>{tong}</span> khách mời đã xác nhận
        có mặt
      </p>
      <p className="mt-1 text-center text-xs text-white/60">
        Danh sách tiếp tục cập nhật theo từng xác nhận gửi về Ban Tổ chức
      </p>
      <div className="mt-8">
        {nhom.map((n) => (
          <KhoiNhom key={n.tieuDe} nhom={n} />
        ))}
      </div>
    </div>
  );
}
