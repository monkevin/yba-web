"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import MemberPicker from "@/components/MemberPicker";
import { TEN_QUYEN, VAI_TRO_CHON, docQuyen, maVaiTro, tenVaiTro } from "@/lib/quyen";
import ChonQuyen from "./ChonQuyen";
import { normalizeSearch } from "@/lib/search";
import { chuanSoDienThoai } from "@/lib/so-dien-thoai";
import {
  datLaiMatKhau,
  doiKhoa,
  doiTen,
  ganHoiVien,
  kiemTraMatKhauMacDinh,
  luuQuyen,
  taoTaiKhoan,
  type KetQua,
  type KetQuaKiemTraMatKhau,
} from "./actions";

export type TaiKhoan = {
  id: string;
  username: string;
  name: string;
  role: string;
  chucVu: string | null;
  permissions: string | null;
  active: boolean;
  memberCompany: string | null;
  memberId: string | null;
  memberName: string | null;
  memberCode: string | null;
  /** SĐT hồ sơ hội viên — hội viên quên tên đăng nhập thì thư ký tìm theo số này */
  memberPhone: string | null;
};

/** Ô chọn 6 vai trò dùng chung cho form tạo mới và form sửa. */
function ChonVaiTro({
  giaTri,
  onDoi,
  laChuNhiem,
}: {
  giaTri: string;
  onDoi: (ma: string) => void;
  laChuNhiem: boolean;
}) {
  return (
    <select
      name="role"
      className="inp"
      value={giaTri}
      onChange={(e) => onDoi(e.target.value)}
    >
      {VAI_TRO_CHON.map((v) => {
        // Chỉ cấp lãnh đạo mới được cấp các vai trò lãnh đạo
        if (v.role === "ADMIN" && !laChuNhiem) return null;
        return (
          <option key={v.ma} value={v.ma}>
            {v.ten}
          </option>
        );
      })}
    </select>
  );
}

export default function TaiKhoanPanel({
  danhSach,
  laChuNhiem,
}: {
  danhSach: TaiKhoan[];
  laChuNhiem: boolean;
}) {
  const [moTao, setMoTao] = useState(false);
  const [dangSua, setDangSua] = useState<string | null>(null);
  const [dangGan, setDangGan] = useState<string | null>(null);
  const [dangDoiTen, setDangDoiTen] = useState<string | null>(null);
  const [tim, setTim] = useState("");

  const quanTri = danhSach.filter((a) => a.role !== "MEMBER");
  const hoiVien = danhSach.filter((a) => a.role === "MEMBER");
  const tu = normalizeSearch(tim.trim());
  // Gõ toàn số (có thể kèm + . khoảng trắng) → tìm theo SĐT, chấp nhận +84 / 84 /
  // thiếu số 0 đầu và gõ một phần số
  const laTimSo =
    /^[+\d\s.\-()]+$/.test(tim.trim()) && tim.replace(/\D/g, "").length >= 3;
  let soTim = laTimSo ? chuanSoDienThoai(tim) : "";
  // Gõ dở "+84 903…" chưa đủ số thì chuanSoDienThoai chưa đổi được 84 → 0
  if (soTim && /^\s*\+84/.test(tim) && !soTim.startsWith("0")) {
    soTim = "0" + soTim.slice(2);
  }
  const hoiVienLoc = tu
    ? hoiVien.filter(
        (a) =>
          normalizeSearch(
            [a.username, a.memberName, a.memberCompany, a.memberCode]
              .filter(Boolean)
              .join(" "),
          ).includes(tu) ||
          (!!soTim &&
            !!a.memberPhone &&
            a.memberPhone.replace(/\D/g, "").includes(soTim)),
      )
    : hoiVien;
  const tenHoiVien = new Set(hoiVien.map((a) => a.username));
  const bangRef = useRef<HTMLDivElement>(null);
  const dangSuaHoiVien = hoiVien.find((a) => a.id === dangSua) ?? null;

  return (
    <div className="space-y-6">
      {moTao ? (
        <FormTao laChuNhiem={laChuNhiem} dong={() => setMoTao(false)} />
      ) : (
        <button onClick={() => setMoTao(true)} className="btn-primary">
          + Tạo tài khoản mới
        </button>
      )}

      <KiemTraMatKhau
        laHoiVien={(ten) => tenHoiVien.has(ten)}
        onChon={(ten) => {
          setTim(ten);
          bangRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      />

      <section>
        <h2 className="mb-3 font-bold text-navy-800">
          Tài khoản quản trị ({quanTri.length})
        </h2>
        <ul className="space-y-3">
          {quanTri.map((a) =>
            dangSua === a.id ? (
              <li key={a.id}>
                <FormSua
                  taiKhoan={a}
                  laChuNhiem={laChuNhiem}
                  dong={() => setDangSua(null)}
                />
              </li>
            ) : (
              <li key={a.id} className="space-y-2">
                <The
                  taiKhoan={a}
                  onSua={() => setDangSua(a.id)}
                  onGan={() => setDangGan(dangGan === a.id ? null : a.id)}
                  onDoiTen={() =>
                    setDangDoiTen(dangDoiTen === a.id ? null : a.id)
                  }
                />
                {dangDoiTen === a.id && (
                  <FormDoiTen taiKhoan={a} dong={() => setDangDoiTen(null)} />
                )}
                {dangGan === a.id && (
                  <FormGanHoiVien taiKhoan={a} dong={() => setDangGan(null)} />
                )}
              </li>
            ),
          )}
        </ul>
      </section>

      {hoiVien.length > 0 && (
        <section>
          <h2 className="mb-1 font-bold text-navy-800">
            Tài khoản hội viên ({hoiVien.length})
          </h2>
          <p className="mb-3 text-sm text-slate-500">
            Muốn một hội viên (ví dụ Chủ nhiệm) vừa dùng tài khoản của mình vừa
            có quyền quản trị: bấm <b>Quyền</b> ở dòng của họ và chọn vai trò.
          </p>
          <div ref={bangRef} className="scroll-mt-4">
            <input
              value={tim}
              onChange={(e) => setTim(e.target.value)}
              placeholder="Tìm tên đăng nhập, người đại diện, doanh nghiệp, mã HV, số điện thoại…"
              className="inp mb-3 min-h-11 max-w-md text-base sm:text-sm"
            />
          </div>
          {dangSuaHoiVien && (
            <KhungCuonToi key={dangSuaHoiVien.id} className="mb-3">
              <FormSua
                taiKhoan={dangSuaHoiVien}
                laChuNhiem={laChuNhiem}
                dong={() => setDangSua(null)}
              />
            </KhungCuonToi>
          )}
          <div className="card overflow-hidden">
            {/* Cần cả hai chiều cuộn: dọc vì danh sách dài, ngang vì bảng rộng
                hơn màn hình điện thoại */}
            <div className="max-h-96 overflow-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2.5">Đăng nhập</th>
                    <th className="px-3 py-2.5">Người đại diện</th>
                    <th className="px-3 py-2.5">Doanh nghiệp</th>
                    <th className="px-3 py-2.5">Trạng thái</th>
                    <th className="px-3 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hoiVienLoc.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-6 text-center text-slate-500"
                      >
                        Không có tài khoản khớp “{tim}”.
                      </td>
                    </tr>
                  )}
                  {hoiVienLoc.map((a) => (
                    <tr key={a.id}>
                      <td className="px-3 py-2 font-mono text-xs text-slate-700">
                        {a.username}
                        {a.memberPhone && (
                          <span className="block text-slate-400">
                            {a.memberPhone}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {a.memberName ?? "—"}
                        {a.memberCode && (
                          <span className="ml-1 text-xs text-slate-400">
                            {a.memberCode}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {a.memberCompany ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        <TrangThai active={a.active} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right">
                        <button
                          type="button"
                          onClick={() => setDangSua(a.id)}
                          className="px-2 text-sm text-navy-600 hover:underline"
                        >
                          Quyền
                        </button>
                        <NutMatKhau id={a.id} ten={a.username} />
                        <NutKhoa id={a.id} active={a.active} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function The({
  taiKhoan: a,
  onSua,
  onGan,
  onDoiTen,
}: {
  taiKhoan: TaiKhoan;
  onSua: () => void;
  onGan: () => void;
  onDoiTen: () => void;
}) {
  const quyen = docQuyen(a.permissions);

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-navy-800">
            {a.name}
            <span className="ml-2 font-mono text-xs font-normal text-slate-500">
              {a.username}
            </span>
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {tenVaiTro(a.role, a.chucVu, a.permissions)}
          </p>
          {a.memberId ? (
            <p className="mt-0.5 break-words text-sm text-slate-600">
              Hồ sơ: <b>{a.memberName}</b>
              {a.memberCompany ? ` – ${a.memberCompany}` : ""}
              {a.memberCode ? ` (${a.memberCode})` : ""}
            </p>
          ) : (
            <p className="mt-0.5 text-sm text-amber-700">
              Chưa gắn hồ sơ hội viên — trong game hiện tên “{a.name}”, không có
              doanh nghiệp
            </p>
          )}
        </div>
        {/* Trên điện thoại hàng nút chiếm nguyên bề ngang và tự xuống dòng —
            để nguyên `shrink-0` sẽ đẩy tràn ra ngoài màn hình */}
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0">
          <TrangThai active={a.active} />
          <button onClick={onSua} className="btn-ghost py-1.5">
            Sửa quyền
          </button>
          <button onClick={onDoiTen} className="btn-ghost py-1.5">
            Đổi tên
          </button>
          <button onClick={onGan} className="btn-ghost py-1.5">
            {a.memberId ? "Đổi hồ sơ" : "Gắn hồ sơ hội viên"}
          </button>
          <NutMatKhau id={a.id} ten={a.username} />
          <NutKhoa id={a.id} active={a.active} />
        </div>
      </div>

      {a.role === "ADMIN" && quyen.length === 0 ? (
        <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
          Toàn quyền trên hệ thống.
        </p>
      ) : a.role === "ADMIN" ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
            Đã giới hạn — chỉ còn:
          </span>
          {quyen.map((q) => (
            <span key={q} className="chip">
              {TEN_QUYEN[q] ?? q}
            </span>
          ))}
        </div>
      ) : a.role === "STAFF" ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {quyen.length === 0 ? (
            <span className="rounded-lg bg-amber-50 px-3 py-1.5 text-sm text-amber-800">
              Chưa cấp quyền nào — chưa vào được khu quản trị.
            </span>
          ) : (
            quyen.map((q) => (
              <span key={q} className="chip">
                {TEN_QUYEN[q] ?? q}
              </span>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}

function FormTao({
  laChuNhiem,
  dong,
}: {
  laChuNhiem: boolean;
  dong: () => void;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (p, fd) => {
      const kq = await taoTaiKhoan(p, fd);
      if (kq.ok) dong();
      return kq;
    },
    {},
  );
  const [vaiTro, setVaiTro] = useState("BDH");

  return (
    <form onSubmit={guiGiuForm(formAction)} className="card space-y-4 p-5">
      <h2 className="font-bold text-navy-800">Tạo tài khoản mới</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Tên đăng nhập *</span>
          <input
            name="username"
            className="inp"
            required
            placeholder="vd: bantruyenthong"
          />
        </label>
        <label className="block">
          <span className="lbl">Họ tên *</span>
          <input name="name" className="inp" required />
        </label>
        <label className="block">
          <span className="lbl">Mật khẩu ban đầu *</span>
          <input
            name="password"
            className="inp"
            required
            placeholder="tối thiểu 6 ký tự"
          />
        </label>
        <label className="block">
          <span className="lbl">Vai trò *</span>
          <ChonVaiTro giaTri={vaiTro} onDoi={setVaiTro} laChuNhiem={laChuNhiem} />
        </label>
      </div>

      <MemberPicker
        name="memberId"
        label="Gắn với hồ sơ doanh nghiệp"
        placeholder="Để trống nếu là tài khoản thuần quản trị"
      />

      <ChonQuyen vaiTro={vaiTro} quyenBanDau={[]} />

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang tạo..." : "Tạo tài khoản"}
        </button>
        <button type="button" onClick={dong} className="btn-ghost">
          Huỷ
        </button>
      </div>
    </form>
  );
}

function FormSua({
  taiKhoan: a,
  laChuNhiem,
  dong,
}: {
  taiKhoan: TaiKhoan;
  laChuNhiem: boolean;
  dong: () => void;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (p, fd) => {
      const kq = await luuQuyen(p, fd);
      if (kq.ok) dong();
      return kq;
    },
    {},
  );
  const [vaiTro, setVaiTro] = useState(maVaiTro(a.role, a.chucVu));

  return (
    <form
      onSubmit={guiGiuForm(formAction)}
      className="card space-y-4 p-5 ring-2 ring-navy-300"
    >
      <input type="hidden" name="id" value={a.id} />
      <h2 className="font-bold text-navy-800">
        Phân quyền: {a.name}{" "}
        <span className="font-mono text-sm font-normal text-slate-500">
          {a.username}
        </span>
      </h2>

      <label className="block max-w-md">
        <span className="lbl">Vai trò</span>
        <ChonVaiTro giaTri={vaiTro} onDoi={setVaiTro} laChuNhiem={laChuNhiem} />
      </label>

      <ChonQuyen vaiTro={vaiTro} quyenBanDau={docQuyen(a.permissions)} />

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Lưu quyền"}
        </button>
        <button type="button" onClick={dong} className="btn-ghost">
          Huỷ
        </button>
      </div>
    </form>
  );
}

/** Đổi tên hiển thị + tên đăng nhập (sửa chính tả, đổi cách gọi). */
function FormDoiTen({
  taiKhoan: a,
  dong,
}: {
  taiKhoan: TaiKhoan;
  dong: () => void;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    async (p, fd) => {
      const kq = await doiTen(p, fd);
      if (kq.ok) dong();
      return kq;
    },
    {},
  );
  return (
    <form
      onSubmit={guiGiuForm(formAction)}
      className="card space-y-3 p-4 ring-2 ring-navy-300"
    >
      <input type="hidden" name="id" value={a.id} />
      <h3 className="font-semibold text-navy-800">
        Đổi tên: <span className="font-mono text-sm">{a.username}</span>
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="lbl">Tên hiển thị</span>
          <input name="name" defaultValue={a.name} className="inp" required />
        </label>
        <label className="block">
          <span className="lbl">Tên đăng nhập</span>
          <input
            name="username"
            defaultValue={a.username}
            className="inp font-mono"
            required
          />
        </label>
      </div>
      <p className="text-xs leading-relaxed text-slate-500">
        Đổi tên đăng nhập xong nhớ báo người dùng — họ phải gõ tên mới (hoặc
        số điện thoại) để vào. Tài khoản gắn hồ sơ hội viên sẽ bị lệnh đồng
        bộ tài khoản đặt lại theo hồ sơ khi chạy.
      </p>
      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Lưu tên mới"}
        </button>
        <button type="button" onClick={dong} className="btn-ghost">
          Huỷ
        </button>
      </div>
    </form>
  );
}

/** Gắn tài khoản với hồ sơ hội viên để hiện tên người + doanh nghiệp. */
function FormGanHoiVien({
  taiKhoan: a,
  dong,
}: {
  taiKhoan: TaiKhoan;
  dong: () => void;
}) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    ganHoiVien,
    {},
  );
  const [boState, boAction, boPending] = useActionState<KetQua, FormData>(
    ganHoiVien,
    {},
  );

  return (
    <div className="card space-y-3 p-4 ring-2 ring-navy-300">
      <h3 className="font-semibold text-navy-800">
        Gắn hồ sơ hội viên cho{" "}
        <span className="font-mono text-sm">{a.username}</span>
      </h3>
      <p className="text-sm text-slate-600">
        Gắn xong, tài khoản này hiện tên người và doanh nghiệp trong game, bảng
        xếp hạng, giao dịch, và nhận được Nhiệm vụ Huynh đệ. Mỗi hồ sơ chỉ gắn
        một tài khoản.
      </p>
      <form onSubmit={guiGiuForm(formAction)} className="space-y-3">
        <input type="hidden" name="id" value={a.id} />
        <MemberPicker
          name="memberId"
          label="Hồ sơ hội viên"
          required
          initial={
            a.memberId
              ? {
                  id: a.memberId,
                  code: a.memberCode ?? "",
                  name: a.memberName ?? "",
                  company: a.memberCompany ?? "",
                }
              : null
          }
        />
        {state.canChuyen && (
          <label
            key={state.chuyenTuId}
            className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900"
          >
            <input
              type="hidden"
              name="chuyenTu"
              value={state.chuyenTuId ?? ""}
            />
            <input
              type="checkbox"
              name="chuyen"
              value="1"
              className="mt-1 h-4 w-4"
            />
            <span>
              Chuyển hồ sơ từ tài khoản <b>{state.tuTaiKhoan}</b> sang{" "}
              <b>{a.username}</b>. {state.tuTaiKhoan} vẫn đăng nhập được nhưng
              không còn gắn doanh nghiệp.
            </span>
          </label>
        )}
        {state.error && (
          <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
            {state.error}
          </p>
        )}
        {state.ok && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.message}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="btn-primary">
            {pending ? "Đang lưu..." : "Lưu"}
          </button>
          <button type="button" onClick={dong} className="btn-ghost">
            Đóng
          </button>
        </div>
      </form>
      {a.memberId && (
        <form action={boAction} className="border-t border-slate-100 pt-3">
          <input type="hidden" name="id" value={a.id} />
          <input type="hidden" name="memberId" value="" />
          <button
            disabled={boPending}
            className="text-sm text-do-600 hover:underline"
          >
            {boPending ? "..." : "Bỏ gắn hồ sơ"}
          </button>
          {boState.message && (
            <span className="ml-2 text-sm text-emerald-700">
              {boState.message}
            </span>
          )}
          {boState.error && (
            <span className="ml-2 text-sm text-do-600">{boState.error}</span>
          )}
        </form>
      )}
    </div>
  );
}

/**
 * `<form action>` bị React 19 tự reset sau mỗi lần gửi — máy chủ báo lỗi thì chữ
 * đã gõ mất trắng và ô chọn vai trò nhảy về mặc định trong khi state vẫn giữ
 * vai trò cũ (lần gửi sau gửi sai quyền). Gửi qua onSubmit để giữ nguyên form.
 */
function guiGiuForm(action: (fd: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
}

/** Bọc form sửa để cuộn tới ngay khi mở (form nằm trên bảng dài). */
function KhungCuonToi({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

function TrangThai({ active }: { active: boolean }) {
  return active ? (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
      Đang dùng
    </span>
  ) : (
    <span className="rounded-full bg-do-100 px-2 py-0.5 text-xs font-medium text-do-700">
      Đã khoá
    </span>
  );
}

function NutMatKhau({ id, ten }: { id: string; ten: string }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    datLaiMatKhau,
    {},
  );

  return (
    <form
      action={formAction}
      className="inline"
      onSubmit={(e) => {
        const mk = prompt(
          `Mật khẩu mới cho ${ten} (tối thiểu 6 ký tự, không dùng mật khẩu dễ đoán như 123456):`,
        );
        if (!mk) {
          e.preventDefault();
          return;
        }
        const o = e.currentTarget.elements.namedItem(
          "matKhau",
        ) as HTMLInputElement;
        o.value = mk;
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="matKhau" />
      <button
        disabled={pending}
        className="px-2 text-sm text-navy-600 hover:underline"
      >
        {pending ? "..." : "Đổi mật khẩu"}
      </button>
      {state.error && (
        <span className="text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}

function NutKhoa({ id, active }: { id: string; active: boolean }) {
  const [state, formAction, pending] = useActionState<KetQua, FormData>(
    doiKhoa,
    {},
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <button
        disabled={pending}
        className="px-2 text-sm text-slate-500 hover:underline"
      >
        {pending ? "..." : active ? "Khoá" : "Mở khoá"}
      </button>
      {state.error && (
        <span className="text-xs text-do-600">{state.error}</span>
      )}
    </form>
  );
}

/**
 * Thẻ cảnh báo tài khoản còn mật khẩu mặc định 123456 (từ dữ liệu mẫu). Chỉ chạy
 * khi bấm — so bcrypt lần lượt ~20 giây, không để mỗi lần mở trang đều chạy.
 */
function KiemTraMatKhau({
  laHoiVien,
  onChon,
}: {
  laHoiVien: (ten: string) => boolean;
  onChon: (ten: string) => void;
}) {
  const [kq, setKq] = useState<KetQuaKiemTraMatKhau | null>(null);
  const [dangChay, startChay] = useTransition();

  function chay() {
    startChay(async () => {
      try {
        setKq(await kiemTraMatKhauMacDinh());
      } catch {
        setKq({ error: "Mất kết nối trong lúc kiểm tra — thử lại" });
      }
    });
  }

  const ds = kq?.danhSach ?? [];

  return (
    <section className="card space-y-3 p-4 ring-1 ring-amber-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-bold text-navy-800">
            Tài khoản còn mật khẩu mặc định
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Mật khẩu 123456 của dữ liệu mẫu ai cũng đoán được. Bấm Kiểm tra để
            biết tài khoản nào chưa đổi.
          </p>
        </div>
        <button
          type="button"
          onClick={chay}
          disabled={dangChay}
          className="btn-ghost min-h-11 shrink-0"
        >
          {dangChay ? "Đang kiểm tra…" : "Kiểm tra"}
        </button>
      </div>

      {dangChay && (
        <p className="text-sm text-slate-500">
          Đang so từng tài khoản, có thể mất khoảng 20 giây — đừng tải lại
          trang.
        </p>
      )}
      {!dangChay && kq?.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {kq.error}
        </p>
      )}
      {!dangChay && kq && !kq.error && ds.length === 0 && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Đã kiểm {kq.tongSo} tài khoản đang dùng: không còn tài khoản nào dùng
          mật khẩu mặc định.
        </p>
      )}
      {!dangChay && ds.length > 0 && (
        <div className="space-y-2 rounded-lg bg-amber-50 px-3 py-3 text-sm text-amber-900">
          <p>
            <b>
              {ds.length}/{kq?.tongSo} tài khoản
            </b>{" "}
            còn mật khẩu 123456. Bấm <b>Đổi mật khẩu</b> ở dòng tương ứng rồi
            nhắn riêng mật khẩu mới, hoặc nhắc hội viên tự đổi ở Tổng quan → Đổi
            mật khẩu.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ds.map((ten) =>
              laHoiVien(ten) ? (
                <button
                  key={ten}
                  type="button"
                  onClick={() => onChon(ten)}
                  className="chip min-h-11 font-mono hover:bg-navy-100"
                  title="Lọc bảng tới tài khoản này"
                >
                  {ten}
                </button>
              ) : (
                <span key={ten} className="chip-do min-h-11 font-mono">
                  {ten} · quản trị
                </span>
              ),
            )}
          </div>
        </div>
      )}
    </section>
  );
}
