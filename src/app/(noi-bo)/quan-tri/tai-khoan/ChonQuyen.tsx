"use client";

import { useState } from "react";
import { BO_QUYEN_MAU, NHOM_QUYEN, type MaQuyen } from "@/lib/quyen";

/** Bốn vai trò cấp lãnh đạo — mặc định toàn quyền, tích = giới hạn bớt. */
const LANH_DAO = ["ADMIN", "CHU_TICH", "PHO_CHU_TICH", "THU_KY"];

/**
 * Checklist phân quyền theo 6 vai trò (Chủ nhiệm chốt 24/09/2026):
 *  - Cấp lãnh đạo (Admin/Chủ tịch/Phó CT/Thư ký): KHÔNG tích gì = toàn
 *    quyền; tích = chỉ còn đúng các mục đã tích ("muốn xem ít thôi").
 *  - Ban Điều hành (BDH): phải tích mới có quyền.
 *  - Hội viên: không có quyền quản trị.
 */
export default function ChonQuyen({
  vaiTro,
  quyenBanDau,
}: {
  vaiTro: string;
  quyenBanDau: string[];
}) {
  const [chon, setChon] = useState<Set<string>>(new Set(quyenBanDau));
  const laLanhDao = LANH_DAO.includes(vaiTro);

  if (vaiTro === "MEMBER") {
    return (
      <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Hội viên thường chỉ quản lý được hồ sơ và tin đăng của chính doanh nghiệp
        mình, không vào khu quản trị.
      </p>
    );
  }

  function bat(ma: string) {
    setChon((cu) => {
      const moi = new Set(cu);
      if (moi.has(ma)) moi.delete(ma);
      else moi.add(ma);
      return moi;
    });
  }

  function apBoMau(ds: MaQuyen[]) {
    setChon(new Set(ds));
  }

  return (
    <div className="space-y-4">
      {laLanhDao && (
        <p className="rounded-lg bg-navy-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
          Vai trò cấp lãnh đạo <b className="text-navy-800">mặc định TOÀN QUYỀN
          khi không tích ô nào</b>. Muốn tài khoản này “xem ít thôi” thì tích
          đúng các mục được phép — lưu xong tài khoản chỉ còn các mục đã tích.
        </p>
      )}
      <div>
        <p className="lbl">Chọn nhanh theo ban</p>
        <div className="flex flex-wrap gap-2">
          {BO_QUYEN_MAU.map((b) => (
            <button
              key={b.ten}
              type="button"
              title={b.mo}
              onClick={() => apBoMau(b.quyen)}
              className="rounded-full bg-navy-50 px-3 py-1.5 text-sm font-medium text-navy-700 transition hover:bg-navy-100"
            >
              {b.ten}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setChon(new Set())}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-do-600 hover:bg-do-50"
          >
            Bỏ chọn hết
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          Bấm một ban để tích sẵn bộ quyền thường dùng, sau đó chỉnh thêm bớt bên dưới.
        </p>
      </div>

      <div className="space-y-4">
        {NHOM_QUYEN.map((n) => (
          <fieldset key={n.nhom} className="rounded-xl bg-slate-50 p-4">
            <legend className="px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
              {n.nhom}
            </legend>
            <div className="mt-1 space-y-2">
              {n.quyen.map((q) => (
                <label
                  key={q.ma}
                  className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-white p-3 ring-1 ring-slate-200 transition hover:ring-navy-300"
                >
                  <input
                    type="checkbox"
                    name="quyen"
                    value={q.ma}
                    checked={chon.has(q.ma)}
                    onChange={() => bat(q.ma)}
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span className="text-sm">
                    <span className="font-medium text-navy-800">{q.ten}</span>
                    <span className="mt-0.5 block leading-relaxed text-slate-600">
                      {q.mo}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <p className="text-sm text-slate-600">
        Đang chọn <strong className="text-navy-800">{chon.size}</strong> quyền.
        {chon.size === 0 &&
          (laLanhDao
            ? " Không tích gì = tài khoản này TOÀN QUYỀN."
            : " Chưa có quyền nào thì tài khoản không vào được khu quản trị.")}
      </p>
    </div>
  );
}
