"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Tải file Excel thư ký khai báo chương trình lên hệ thống.
 * Server đọc 4 sheet trong file mẫu rồi tạo/cập nhật sự kiện kèm ban tổ chức,
 * người tham dự và nhà tài trợ.
 */
export default function NhapFile() {
  const router = useRouter();
  const oFile = useRef<HTMLInputElement>(null);
  const [dangGui, datDangGui] = useState(false);
  const [ket, datKet] = useState<{
    ok?: string;
    error?: string;
    chiTiet?: string[];
  } | null>(null);

  async function gui(file: File) {
    datDangGui(true);
    datKet(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/su-kien/nhap", { method: "POST", body: fd });
      const j = await r.json();
      datKet(j);
      if (j.ok) router.refresh();
    } catch {
      datKet({ error: "Không gửi được file, anh/chị thử lại nhé." });
    } finally {
      datDangGui(false);
      if (oFile.current) oFile.current.value = "";
    }
  }

  return (
    <div className="card p-5">
      <h2 className="font-bold text-navy-800">
        📥 Nhập chương trình từ file Excel của thư ký
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-slate-600">
        Thư ký điền theo file mẫu (thông tin chương trình · ban tổ chức · người
        tham gia · nhà tài trợ), tải lên đây là hệ thống tự tạo sự kiện và ghi
        nhận số liệu để chấm điểm hoạt động.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <a
          href="/mau/mau-bao-cao-su-kien-yba-cho-lon.xlsx"
          className="btn-ghost"
          download
        >
          ⤓ Tải file mẫu
        </a>

        <input
          ref={oFile}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) gui(f);
          }}
        />
        <button
          type="button"
          disabled={dangGui}
          onClick={() => oFile.current?.click()}
          className="btn-primary"
        >
          {dangGui ? "Đang xử lý…" : "Chọn file đã điền để tải lên"}
        </button>
      </div>

      {ket?.error && (
        <p className="mt-4 rounded-lg bg-do-50 px-4 py-3 text-sm text-do-700">
          {ket.error}
        </p>
      )}
      {ket?.ok && (
        <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3">
          <p className="font-semibold text-emerald-800">{ket.ok}</p>
          {ket.chiTiet && (
            <ul className="mt-2 space-y-1 text-sm text-emerald-800">
              {ket.chiTiet.map((c, i) => (
                <li key={i}>· {c}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
