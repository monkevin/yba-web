"use client";

import { useActionState, useState } from "react";
import MemberPicker from "@/components/MemberPicker";
import { congDiem, luuQuyTacDiem, xoaDiem, type KetQuaDiem } from "./actions";
import { LOAI_DIEM } from "./loai-diem";

/**
 * Form cộng điểm hoạt động — dùng ở đầu trang (chọn hội viên) và ở nút
 * "+" trên từng dòng xếp hạng (member cố định). Điểm cuối = (điểm gốc
 * HOẶC số triệu tài trợ) × hệ số, hiện tạm tính ngay khi gõ.
 */
export function FormCongDiem({
  member,
  dong,
}: {
  /** Cố định hội viên (nút + trên dòng); bỏ trống thì hiện ô chọn */
  member?: { id: string; ten: string };
  dong?: () => void;
}) {
  const [state, formAction, pending] = useActionState<KetQuaDiem, FormData>(
    congDiem,
    {}
  );
  const [diem, setDiem] = useState("");
  const [trieu, setTrieu] = useState("");
  const [heSo, setHeSo] = useState("1");
  const goc = Number(diem) || Number(trieu) || 0;
  const tong = Math.round(goc * (Number(heSo) > 0 ? Math.min(Number(heSo), 10) : 1));

  return (
    <form action={formAction} className="card space-y-3 p-4 ring-2 ring-navy-200">
      {member ? (
        <>
          <input type="hidden" name="memberId" value={member.id} />
          <p className="font-semibold text-navy-800">
            Cộng điểm cho <b>{member.ten}</b>
          </p>
        </>
      ) : (
        <MemberPicker name="memberId" label="Hội viên được cộng điểm" required />
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block">
          <span className="lbl">Loại</span>
          <select name="loai" className="inp" defaultValue="TAI_TRO">
            {Object.entries(LOAI_DIEM).map(([ma, ten]) => (
              <option key={ma} value={ma}>
                {ten}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="lbl">Điểm gốc</span>
          <input
            name="diem"
            type="number"
            value={diem}
            onChange={(e) => setDiem(e.target.value)}
            className="inp"
            placeholder="vd 30"
          />
        </label>
        <label className="block">
          <span className="lbl">Hoặc tiền tài trợ (triệu)</span>
          <input
            name="trieu"
            type="number"
            value={trieu}
            onChange={(e) => setTrieu(e.target.value)}
            className="inp"
            placeholder="vd 50 → 50đ"
          />
        </label>
        <label className="block">
          <span className="lbl">Hệ số quy mô</span>
          <input
            name="heSo"
            type="number"
            step="0.5"
            min="0.5"
            max="10"
            value={heSo}
            onChange={(e) => setHeSo(e.target.value)}
            className="inp"
          />
        </label>
      </div>
      <p className="text-xs text-slate-500">
        Ví dụ Chủ tịch chốt: Trưởng BTC 30đ × hệ số 3 (sự kiện 300 khách) =
        90đ · Tài trợ 50 triệu = 50đ.{" "}
        {tong !== 0 && (
          <b className="text-navy-800">Tạm tính: {tong} điểm.</b>
        )}
      </p>

      <label className="block">
        <span className="lbl">Lý do (để dò lại) *</span>
        <input
          name="lyDo"
          required
          className="inp"
          placeholder="vd: Tài trợ Kim cương chương trình Lễ chuyển giao 10/10"
        />
      </label>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">{state.error}</p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.ok}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu…" : "+ Cộng điểm"}
        </button>
        {dong && (
          <button type="button" onClick={dong} className="btn-ghost">
            Đóng
          </button>
        )}
      </div>
    </form>
  );
}

/** Nút "+" trên từng dòng bảng xếp hạng. */
export function NutCongNhanh({ member }: { member: { id: string; ten: string } }) {
  const [mo, setMo] = useState(false);
  if (!mo) {
    return (
      <button
        type="button"
        onClick={() => setMo(true)}
        title={`Cộng điểm cho ${member.ten}`}
        className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-lg font-bold text-white transition hover:bg-navy-700"
      >
        +
      </button>
    );
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-navy-900/40 p-4">
      <div className="w-full max-w-2xl">
        <FormCongDiem member={member} dong={() => setMo(false)} />
      </div>
    </div>
  );
}

/** Xoá một dòng sổ (cộng nhầm) — chỉ cấp lãnh đạo thấy nút này. */
export function NutXoaDiem({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<KetQuaDiem, FormData>(
    xoaDiem,
    {}
  );
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm("Xoá dòng điểm này?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="px-1 text-xs text-slate-400 hover:text-do-600">
        ✕
      </button>
      {state.error && <span className="text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

/**
 * Ô QUY TẮC CỘNG ĐIỂM TỰ ĐỘNG khi check-in bằng mã QR — chỉ người có quyền
 * Quản lý vinh danh thấy. Lưu là máy tính lại ngay các dòng điểm tự động.
 */
export function FormQuyTacTuDong({
  quyTac,
}: {
  quyTac: { bat: boolean; phien1010: number; suKien: number; dienTap: boolean };
}) {
  const [state, formAction, pending] = useActionState<KetQuaDiem, FormData>(
    luuQuyTacDiem,
    {}
  );
  const [bat, setBat] = useState(quyTac.bat);
  const [phien, setPhien] = useState(String(quyTac.phien1010));
  const [dienTap, setDienTap] = useState(quyTac.dienTap);
  return (
    <form action={formAction} className="card space-y-3 p-4 ring-2 ring-navy-200">
      <label className="flex min-h-11 cursor-pointer items-center gap-2 font-semibold text-navy-800">
        <input
          type="checkbox"
          name="bat"
          value="1"
          checked={bat}
          onChange={(e) => setBat(e.target.checked)}
          className="h-5 w-5"
        />
        Tự cộng điểm “Tham gia hoạt động” khi hội viên check-in bằng mã QR
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Lễ chuyển giao 10/10 — điểm MỖI PHIÊN có mặt</span>
          <input
            name="phien1010"
            type="number"
            min="0"
            max="100"
            value={phien}
            onChange={(e) => setPhien(e.target.value)}
            className="inp"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Ba phiên Tọa đàm · Lễ · Gala — dự đủ cả ba được{" "}
            <b className="text-navy-800">{(Number(phien) || 0) * 3} điểm</b>.
          </span>
        </label>
        <label className="block">
          <span className="lbl">Sự kiện khác — điểm mỗi lần quét thẻ hội viên</span>
          <input
            name="suKien"
            type="number"
            min="0"
            max="100"
            defaultValue={quyTac.suKien}
            className="inp"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Ban Tổ chức quét thẻ hội viên trên Zalo Mini App, sự kiện từ
            10.10.2026.
          </span>
        </label>
      </div>
      <label className="flex min-h-11 cursor-pointer items-start gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="dienTap"
          value="1"
          checked={dienTap}
          onChange={(e) => setDienTap(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span>
          <b className="text-navy-800">Diễn tập</b> — tính điểm cả những lượt
          check-in ghi TRƯỚC ngày 10.10, để Ban Tổ chức thử trọn luồng. Thử
          xong bỏ tích rồi Lưu: điểm của các lượt thử tự biến mất.
        </span>
      </label>
      {dienTap && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Đang để chế độ diễn tập — nhớ tắt trước ngày 10.10.
        </p>
      )}
      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">{state.error}</p>
      )}
      {state.ok && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.ok}
        </p>
      )}
      <button disabled={pending} className="btn-primary">
        {pending ? "Đang lưu & tính lại…" : "Lưu quy tắc & tính lại điểm"}
      </button>
    </form>
  );
}
