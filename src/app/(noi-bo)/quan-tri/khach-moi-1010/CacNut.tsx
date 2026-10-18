"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import MemberPicker from "@/components/MemberPicker";
import {
  boGanHoiVien,
  capNhatBan,
  doiAnDanhSach,
  doiCheckin,
  doiHienQuy,
  dongBoTuSheet,
  ganHoiVien,
  ghepVaTinhLai,
  nhapHangLoat,
  themKhach,
  xoaKhach,
  xoaLuotThu,
  type KetQua,
} from "./actions";

/** Nút kéo xác nhận tham dự từ Google Sheet master của BTC. */
export function NutDongBoSheet() {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(dongBoTuSheet, {});
  return (
    <form action={formAction} className="inline">
      <button
        disabled={pending}
        className="btn-ghost"
        title="Đọc Google Sheet của BTC (cột Tọa đàm / Lễ / Gala) và cập nhật trạng thái xác nhận cho khách khớp tên"
      >
        {pending ? "Đang đối chiếu sheet…" : "🔄 Đồng bộ xác nhận từ Google Sheet"}
      </button>
      {(state.ok || state.error) && (
        <span
          className={`ml-2 inline-block max-w-2xl align-middle text-xs ${state.error ? "text-do-600" : "text-emerald-700"}`}
        >
          {state.ok ?? state.error}
        </span>
      )}
    </form>
  );
}

/** Nút chép link thư mời của một khách vào bộ nhớ tạm. */
export function NutChepLink({ ma }: { ma: string }) {
  const [daChep, setDaChep] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(
            `https://ybacholon.vn/1010/moi/${ma}`
          );
          setDaChep(true);
          setTimeout(() => setDaChep(false), 1600);
        } catch {
          window.prompt("Chép link này gửi khách:", `https://ybacholon.vn/1010/moi/${ma}`);
        }
      }}
      className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
        daChep ? "bg-emerald-100 text-emerald-700" : "bg-navy-50 text-navy-700 hover:bg-navy-100"
      }`}
      title="Chép link thư mời để gửi Zalo"
    >
      {daChep ? "Đã chép ✓" : "Chép link"}
    </button>
  );
}

/**
 * Nút tải THIỆP MỜI (ảnh JPG/PNG/WEBP) cho một khách — dùng cho khách mời
 * thêm sau đợt nạp Excel, hoặc thay thiệp đã có. Gửi qua
 * POST /api/khach-moi-1010/thiep-len (route handler, nhận ảnh tới 10 MB).
 */
export function NutTaiThiep({ id, coThiep }: { id: string; coThiep: boolean }) {
  const router = useRouter();
  const [dangTai, setDangTai] = useState(false);
  const [xong, setXong] = useState(false);
  const [loi, setLoi] = useState("");
  return (
    <span className="inline-block">
      <label
        className={`inline-block cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold transition ${
          xong
            ? "bg-emerald-100 text-emerald-700"
            : coThiep
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-amber-100 text-amber-800 hover:bg-amber-200"
        }`}
        title="Chọn ảnh thiệp mời trong máy để gắn cho khách này"
      >
        {dangTai ? "Đang tải…" : xong ? "Đã có thiệp ✓" : coThiep ? "Đổi thiệp" : "⬆ Tải thiệp lên"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={dangTai}
          onChange={async (e) => {
            const f = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (!f) return;
            setLoi("");
            setDangTai(true);
            try {
              const fd = new FormData();
              fd.set("id", id);
              fd.set("file", f);
              const r = await fetch("/api/khach-moi-1010/thiep-len", {
                method: "POST",
                body: fd,
              });
              const j = await r.json().catch(() => ({}));
              if (!r.ok) {
                setLoi(j.error || "Tải lên không được — thử lại.");
                return;
              }
              setXong(true);
              router.refresh();
              setTimeout(() => setXong(false), 2500);
            } catch {
              setLoi("Mạng trục trặc — thử lại.");
            } finally {
              setDangTai(false);
            }
          }}
        />
      </label>
      {loi && <span className="mt-0.5 block text-xs text-do-600">{loi}</span>}
    </span>
  );
}

/**
 * Cắt vuông + thu về 320×320 WEBP ngay trên trình duyệt trước khi gửi, để
 * ảnh chân dung chỉ nặng vài chục KB (danh sách landing hiện cả trăm ảnh).
 * Lấy phần giữa theo chiều ngang và hơi lệch lên trên cho vừa khuôn mặt.
 */
async function thuNhoVuong(f: File, canh = 320): Promise<Blob> {
  const bm = await createImageBitmap(f);
  const c = Math.min(bm.width, bm.height);
  const sx = (bm.width - c) / 2;
  const sy = Math.max(0, Math.min((bm.height - c) / 2, bm.height * 0.06));
  const cv = document.createElement("canvas");
  cv.width = canh;
  cv.height = canh;
  const ctx = cv.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không cắt được ảnh");
  ctx.fillStyle = "#1b274c"; // nền navy giống bộ ảnh nạp từ Excel
  ctx.fillRect(0, 0, canh, canh);
  ctx.drawImage(bm, sx, sy, c, c, 0, 0, canh, canh);
  bm.close?.();
  return await new Promise<Blob>((ok, hong) =>
    cv.toBlob(
      (b) => (b ? ok(b) : hong(new Error("Không tạo được ảnh"))),
      "image/webp",
      0.86
    )
  );
}

/**
 * Nút tải ẢNH CHÂN DUNG cho một khách — ảnh tròn hiện trong danh sách
 * "Những gương mặt sẽ hội tụ" trên landing /1010. Khách nạp từ Excel đã có
 * ảnh sẵn; nút này dành cho khách BTC thêm tay sau đó.
 */
export function NutTaiAnhKhach({ id, coAnh }: { id: string; coAnh: boolean }) {
  const router = useRouter();
  const [dangTai, setDangTai] = useState(false);
  const [xong, setXong] = useState(false);
  const [loi, setLoi] = useState("");
  return (
    <span className="inline-block">
      <label
        className={`inline-block cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold transition ${
          xong
            ? "bg-emerald-100 text-emerald-700"
            : coAnh
              ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
              : "bg-sky-100 text-sky-800 hover:bg-sky-200"
        }`}
        title="Chọn ảnh chân dung của khách — máy tự cắt vuông 320×320 rồi gắn vào danh sách trên landing"
      >
        {dangTai
          ? "Đang tải…"
          : xong
            ? "Đã có ảnh ✓"
            : coAnh
              ? "Đổi ảnh chân dung"
              : "⬆ Tải ảnh chân dung"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={dangTai}
          onChange={async (e) => {
            const f = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (!f) return;
            setLoi("");
            setDangTai(true);
            try {
              const nho = await thuNhoVuong(f);
              const fd = new FormData();
              fd.set("id", id);
              fd.set("file", new File([nho], "anh.webp", { type: "image/webp" }));
              const r = await fetch("/api/khach-moi-1010/anh-len", {
                method: "POST",
                body: fd,
              });
              const j = await r.json().catch(() => ({}));
              if (!r.ok) {
                setLoi(j.error || "Tải lên không được — thử lại.");
                return;
              }
              setXong(true);
              router.refresh();
              setTimeout(() => setXong(false), 2500);
            } catch {
              setLoi("Không đọc được ảnh này — thử ảnh khác.");
            } finally {
              setDangTai(false);
            }
          }}
        />
      </label>
      {loi && <span className="mt-0.5 block text-xs text-do-600">{loi}</span>}
    </span>
  );
}

/** Ô sửa bàn ngay trên dòng. */
export function OBan({ id, ban }: { id: string; ban: string | null }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(capNhatBan, {});
  return (
    <form action={formAction} className="flex items-center gap-1">
      <input type="hidden" name="id" value={id} />
      <input
        name="ban"
        defaultValue={ban ?? ""}
        placeholder="—"
        title="Một số bàn (vd 5) hoặc khu bàn (vd 1-2-3-4)"
        className="w-28 rounded-lg border border-navy-100 bg-white px-2 py-1 text-center text-sm"
      />
      <button disabled={pending} className="rounded-lg bg-navy-50 px-2 py-1 text-xs font-semibold text-navy-700 hover:bg-navy-100">
        {pending ? "…" : "Lưu"}
      </button>
      {state.error && <span className="text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

/** Một nút check-in cho MỘT phiên (Tọa đàm / Lễ / Gala). */
function NutMotLan({
  id,
  lan,
  nhan,
  daVao,
  lon,
}: {
  id: string;
  lan: "TOA_DAM" | "LE" | "GALA";
  nhan: string;
  daVao: boolean;
  lon: boolean;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(doiCheckin, {});
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="lan" value={lan} />
      <button
        disabled={pending}
        title={daVao ? `Bấm lần nữa để huỷ check-in ${nhan}` : `Check-in ${nhan}`}
        className={`${lon ? "min-h-12 px-4 text-base" : "px-2.5 py-1 text-xs"} rounded-lg font-bold transition ${
          daVao
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-do-600 text-white hover:bg-do-700"
        }`}
      >
        {pending ? "…" : daVao ? `${nhan} ✓` : nhan}
      </button>
      {state.error && <span className="ml-1 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

/**
 * BỘ BA nút check-in tách riêng từng phiên (Chủ tịch chốt sáng 25/09):
 * Tọa đàm · Lễ · Gala — khách về rồi quay lại vẫn đếm đúng từng phiên.
 */
export function NutCheckin({
  id,
  daVao,
  daVaoLe,
  daVaoGala,
  lon = false,
}: {
  id: string;
  daVao: boolean;
  daVaoLe: boolean;
  daVaoGala: boolean;
  lon?: boolean;
}) {
  return (
    <span className={`inline-flex flex-wrap gap-1 ${lon ? "flex-col" : ""}`}>
      <NutMotLan id={id} lan="TOA_DAM" nhan="Tọa đàm" daVao={daVao} lon={lon} />
      <NutMotLan id={id} lan="LE" nhan="Lễ" daVao={daVaoLe} lon={lon} />
      <NutMotLan id={id} lan="GALA" nhan="Gala" daVao={daVaoGala} lon={lon} />
    </span>
  );
}

/** Ẩn / hiện khách trên danh sách công khai "Những gương mặt sẽ hội tụ". */
export function NutAnDanhSach({ id, dangAn }: { id: string; dangAn: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(doiAnDanhSach, {});
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        title="Ẩn / hiện khách này trong danh sách công khai trên landing"
        className={
          "rounded-lg px-2 py-1 text-xs font-semibold transition " +
          (dangAn
            ? "bg-slate-200 text-slate-600 hover:bg-slate-300"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200")
        }
      >
        {pending ? "…" : dangAn ? "🙈 Đang ẩn trên landing" : "Ẩn khỏi landing"}
      </button>
      {state.error && <span className="ml-1 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}

/** Nút xoá khách, hỏi lại trước khi xoá. */
export function NutXoa({ id, ten }: { id: string; ten: string }) {
  const [, formAction, pending] = useActionState<KetQua, FormData>(xoaKhach, {});
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (!confirm(`Xoá khách "${ten}" khỏi danh sách mời?`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button disabled={pending} className="px-1.5 text-xs text-slate-400 hover:text-do-600" title="Xoá">
        ✕
      </button>
    </form>
  );
}

/** Form thêm một khách. */
export function FormThemKhach() {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(themKhach, {});
  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      <select name="danhXung" className="inp" defaultValue="Anh">
        {["Anh", "Chị", "Ông", "Bà", ""].map((d) => (
          <option key={d} value={d}>
            {d || "(không danh xưng)"}
          </option>
        ))}
      </select>
      <input name="ten" required placeholder="Họ tên *" className="inp" />
      <input name="chucDanh" placeholder="Chức danh" className="inp" />
      <input name="donVi" placeholder="Doanh nghiệp / đơn vị" className="inp" />
      <input name="phone" placeholder="Số điện thoại" className="inp" />
      <select name="nhom" className="inp" defaultValue="KHACH_MOI">
        <option value="KHACH_MOI">Khách mời</option>
        <option value="HOI_VIEN">Hội viên</option>
        <option value="LANH_DAO">Lãnh đạo</option>
        <option value="TAI_TRO">Nhà tài trợ</option>
        <option value="BTC">Ê-kíp BTC (PG, lễ tân, photo…)</option>
      </select>
      <div className="sm:col-span-2 lg:col-span-3 flex items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang thêm…" : "+ Thêm khách mời"}
        </button>
        {state.ok && <span className="text-sm text-emerald-700">{state.ok}</span>}
        {state.error && <span className="text-sm text-do-600">{state.error}</span>}
      </div>
    </form>
  );
}

/** Form dán hàng loạt từ Excel. */
export function FormNhapHangLoat() {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(nhapHangLoat, {});
  return (
    <form action={formAction} className="space-y-2">
      <textarea
        name="danhSach"
        rows={5}
        className="inp font-mono text-xs"
        placeholder={
          "Dán từ Excel — mỗi dòng một khách, các cột theo thứ tự:\n" +
          "Danh xưng ; Họ tên ; Chức danh ; Đơn vị ; SĐT ; Nhóm\n" +
          "Ví dụ:  Anh\tNguyễn Văn A\tCEO\tCông ty ABC\t0903xxxxxx\tKHACH_MOI"
        }
      />
      <div className="flex items-center gap-3">
        <button disabled={pending} className="btn-ghost">
          {pending ? "Đang nhập…" : "Nhập danh sách"}
        </button>
        {state.ok && <span className="text-sm text-emerald-700">{state.ok}</span>}
        {state.error && <span className="text-sm text-do-600">{state.error}</span>}
      </div>
    </form>
  );
}


/** Nút duyệt hiện / ẩn khách trên bảng vàng quỹ NCDN của landing. */
export function NutHienQuy({ id, dangHien }: { id: string; dangHien: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(doiHienQuy, {});
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        title="Hiện / ẩn trên bảng vàng quỹ NCDN của landing"
        className={
          "rounded-lg px-2 py-1 text-xs font-semibold transition " +
          (dangHien
            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
            : "bg-slate-100 text-slate-500 hover:bg-slate-200")
        }
      >
        {pending ? "…" : dangHien ? "★ Đang trên bảng vàng" : "Duyệt lên bảng vàng"}
      </button>
      {state.error && <span className="ml-1 text-xs text-do-600">{state.error}</span>}
    </form>
  );
}


// ─────────── Ghép khách ↔ hồ sơ hội viên (để check-in cộng điểm) ───────────

/**
 * Dòng "hội viên" dưới tên khách: cho biết khách đã ghép với hồ sơ hội
 * viên nào (check-in sẽ tự cộng điểm hoạt động cho hồ sơ đó), và cho BTC
 * ghép tay / đổi / đánh dấu không phải hội viên khi máy không tự ghép được.
 */
export function OHoiVien({
  id,
  hoiVien,
  khongPhai,
  nhomChoLon,
}: {
  id: string;
  hoiVien: { code: string; name: string } | null;
  /** BTC đã đánh dấu "không phải hội viên" */
  khongPhai: boolean;
  /** Khách thuộc nhóm Chợ Lớn — chưa ghép thì cần nhắc */
  nhomChoLon: boolean;
}) {
  const [gan, ganAction, dangGan] = useActionState<KetQua, FormData>(ganHoiVien, {});
  const [bo, boAction, dangBo] = useActionState<KetQua, FormData>(boGanHoiVien, {});
  // Ô ghép đang mở "cho" cặp kết quả nào: ghép / gỡ THÀNH CÔNG (kết quả mới
  // có ok) thì ô tự đóng; báo lỗi thì vẫn mở để sửa. Tính từ state, không
  // cần useEffect.
  const [moTu, setMoTu] = useState<{ gan: KetQua; bo: KetQua } | null>(null);
  const mo =
    moTu !== null &&
    !((gan !== moTu.gan && !!gan.ok) || (bo !== moTu.bo && !!bo.ok));
  const setMo = (x: boolean) => setMoTu(x ? { gan, bo } : null);

  const nhan = hoiVien
    ? { chu: `Hội viên ${hoiVien.code}`, lop: "bg-navy-600 text-white" }
    : khongPhai
      ? { chu: "không phải hội viên", lop: "bg-slate-100 text-slate-500" }
      : nhomChoLon
        ? { chu: "chưa ghép hội viên", lop: "bg-amber-100 text-amber-800" }
        : null;

  return (
    <div className="mt-1">
      <span className="inline-flex flex-wrap items-center gap-1">
        {nhan && (
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${nhan.lop}`}
            title={
              hoiVien
                ? `Đã ghép với hồ sơ ${hoiVien.code} · ${hoiVien.name} — check-in sẽ tự cộng điểm hoạt động`
                : undefined
            }
          >
            {nhan.chu}
          </span>
        )}
        <button
          type="button"
          onClick={() => setMo(!mo)}
          className="rounded px-1 text-[11px] font-semibold text-navy-600 underline decoration-navy-200 underline-offset-2 hover:text-navy-800"
        >
          {mo ? "đóng" : hoiVien || khongPhai ? "đổi" : "ghép hội viên"}
        </button>
      </span>

      {mo && (
        <div className="mt-2 w-72 max-w-full space-y-2 rounded-xl border border-navy-100 bg-white p-3 shadow-sm">
          <form action={ganAction} className="space-y-2">
            <input type="hidden" name="id" value={id} />
            <MemberPicker
              name="memberId"
              label="Hồ sơ hội viên của khách này"
              placeholder="Gõ tên người, công ty hoặc mã HV…"
            />
            <button disabled={dangGan} className="btn-primary w-full">
              {dangGan ? "Đang ghép…" : "Ghép với hồ sơ này"}
            </button>
          </form>
          <form action={boAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="id" value={id} />
            {!khongPhai && (
              <button
                disabled={dangBo}
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                title="Khách này không phải hội viên Chợ Lớn — máy sẽ không tự ghép nữa"
              >
                Không phải hội viên
              </button>
            )}
            {(hoiVien || khongPhai) && (
              <button
                disabled={dangBo}
                name="che"
                value="tra"
                className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                title="Gỡ ghép và để máy dò lại theo SĐT / tên"
              >
                Trả về chưa ghép
              </button>
            )}
          </form>
          {(gan.error || bo.error) && (
            <p className="text-xs text-do-600">{gan.error ?? bo.error}</p>
          )}
        </div>
      )}
      {!mo && (gan.ok || bo.ok) && (
        <p className="mt-0.5 text-[11px] text-emerald-700">{gan.ok ?? bo.ok}</p>
      )}
    </div>
  );
}

/** Nút ghép mọi khách với hồ sơ hội viên rồi tính lại điểm check-in. */
export function NutGhepTinhLai() {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(ghepVaTinhLai, {});
  return (
    <form action={formAction} className="inline">
      <button
        disabled={pending}
        className="btn-ghost"
        title="Máy dò từng khách theo SĐT / tên để tìm hồ sơ hội viên Chợ Lớn, rồi tính lại điểm hoạt động theo check-in. Bấm nhiều lần cũng an toàn."
      >
        {pending ? "Đang ghép & tính…" : "🔗 Ghép hội viên & tính lại điểm"}
      </button>
      {(state.ok || state.error) && (
        <span
          className={`ml-2 inline-block max-w-2xl align-middle text-xs ${state.error ? "text-do-600" : "text-emerald-700"}`}
        >
          {state.ok ?? state.error}
        </span>
      )}
    </form>
  );
}

/** Xoá các lượt check-in bấm thử trước ngày sự kiện. */
export function NutXoaLuotThu({ so }: { so: number }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(xoaLuotThu, {});
  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        if (
          !confirm(
            `Xoá ${so} lượt check-in thử (ghi trước ngày 10.10)? Các lượt ghi từ ngày 10.10 không bị đụng tới.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button disabled={pending} className="btn-danger">
        {pending ? "Đang xoá…" : `🧹 Xoá ${so} lượt thử`}
      </button>
      {(state.ok || state.error) && (
        <span className={`ml-2 text-xs ${state.error ? "text-do-600" : "text-emerald-700"}`}>
          {state.ok ?? state.error}
        </span>
      )}
    </form>
  );
}
