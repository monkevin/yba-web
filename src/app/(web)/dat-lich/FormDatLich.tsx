"use client";

import { useActionState } from "react";
import { datLich, type KetQuaHen } from "./actions";

export type NguoiNhanHen = {
  slug: string;
  name: string;
  title: string;
};

export default function FormDatLich({
  danhSach,
  chonSan,
  banDau,
}: {
  danhSach: NguoiNhanHen[];
  chonSan?: string;
  banDau?: { name: string; phone: string; company: string; email: string } | null;
}) {
  const [state, formAction, pending] = useActionState<KetQuaHen, FormData>(
    datLich,
    {}
  );

  // Gửi xong thì thay form bằng lời cảm ơn — tránh anh/chị bấm gửi hai lần
  if (state.ok) {
    return (
      <div className="card p-8 text-center">
        <span className="text-4xl">✅</span>
        <h2 className="mt-3 text-lg font-bold text-navy-800">Đã gửi đề nghị</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
          {state.ok}
        </p>
      </div>
    );
  }

  // Ngày sớm nhất cho phép chọn: ngày mai
  const mai = new Date();
  mai.setDate(mai.getDate() + 1);
  const toiThieu = mai.toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-do-50 px-4 py-3 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <O label="Muốn gặp ai">
        <select name="leader" className="inp" defaultValue={chonSan ?? ""}>
          <option value="">Ban Chủ nhiệm sắp xếp người phù hợp</option>
          {danhSach.map((n) => (
            <option key={n.slug} value={n.slug}>
              {n.name} — {n.title}
            </option>
          ))}
        </select>
      </O>

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Họ và tên" batBuoc>
          <input
            name="name"
            className="inp"
            required
            maxLength={60}
            defaultValue={banDau?.name ?? ""}
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
          />
        </O>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <O label="Doanh nghiệp">
          <input
            name="company"
            className="inp"
            maxLength={120}
            defaultValue={banDau?.company ?? ""}
          />
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

      <O label="Nội dung muốn trao đổi" batBuoc>
        <input
          name="chuDe"
          className="inp"
          required
          maxLength={150}
          placeholder="Ví dụ: Xin tư vấn về thủ tục gia nhập Chi hội"
        />
      </O>

      <O label="Trình bày thêm">
        <textarea name="noiDung" rows={4} className="inp" maxLength={1000} />
      </O>

      <div className="grid gap-4 sm:grid-cols-3">
        <O label="Ngày mong muốn">
          <input type="date" name="ngayHen" className="inp" min={toiThieu} />
        </O>
        <O label="Buổi">
          <select name="buoi" className="inp" defaultValue="">
            <option value="">Linh hoạt</option>
            <option value="SANG">Buổi sáng</option>
            <option value="CHIEU">Buổi chiều</option>
            <option value="TOI">Buổi tối</option>
          </select>
        </O>
        <O label="Hình thức">
          <select name="hinhThuc" className="inp" defaultValue="TRUC_TIEP">
            <option value="TRUC_TIEP">Gặp trực tiếp</option>
            <option value="ONLINE">Trực tuyến</option>
          </select>
        </O>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Đang gửi…" : "Gửi đề nghị gặp"}
      </button>

      <p className="text-xs leading-relaxed text-slate-500">
        Ban Chủ nhiệm sẽ liên hệ lại để xác nhận thời gian cụ thể. Đây là đề nghị
        gặp, chưa phải lịch đã chốt.
      </p>
    </form>
  );
}

function O({
  label,
  batBuoc,
  children,
}: {
  label: string;
  batBuoc?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {batBuoc && <span className="ml-0.5 text-do-600">*</span>}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
