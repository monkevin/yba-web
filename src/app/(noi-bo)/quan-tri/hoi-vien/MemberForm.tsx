"use client";

import { useActionState } from "react";
import { saveMember, type ActionResult } from "../actions";
import { MEMBER_TYPES } from "@/lib/member";

export type MemberFormValues = {
  id?: string;
  code?: string;
  company?: string;
  name?: string;
  salutation?: string | null;
  position?: string | null;
  hoiRole?: string | null;
  memberType?: string | null;
  district?: string | null;
  industry?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  offering?: string | null;
  needing?: string | null;
  chapterId?: string | null;
  note?: string | null;
  active?: boolean;
};

export default function MemberForm({
  member,
  chapters,
}: {
  member?: MemberFormValues;
  chapters: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    saveMember,
    {}
  );

  return (
    <form action={formAction} className="card space-y-4 p-5">
      {member?.id && <input type="hidden" name="id" value={member.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tên doanh nghiệp" required>
          <input name="company" className="inp" defaultValue={member?.company ?? ""} />
        </Field>
        <Field label="Người đại diện" required>
          <input name="name" className="inp" defaultValue={member?.name ?? ""} />
        </Field>
        <Field label="Xưng hô">
          <select
            name="salutation"
            className="inp"
            defaultValue={member?.salutation ?? ""}
          >
            <option value="">—</option>
            <option value="Anh">Anh</option>
            <option value="Chị">Chị</option>
          </select>
        </Field>
        <Field label="Chức vụ tại doanh nghiệp">
          <input
            name="position"
            className="inp"
            defaultValue={member?.position ?? ""}
            placeholder="Ví dụ: Tổng Giám đốc"
          />
        </Field>
        <Field label="Chức vụ trong Hội">
          <input
            name="hoiRole"
            className="inp"
            defaultValue={member?.hoiRole ?? ""}
            placeholder="Ví dụ: Phó Chủ tịch Hội Doanh nhân trẻ TP.HCM"
          />
        </Field>
        <Field label="Loại hội viên">
          <select
            name="memberType"
            className="inp"
            defaultValue={member?.memberType ?? "Hội viên"}
          >
            {MEMBER_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Quận / phường">
          <input
            name="district"
            className="inp"
            defaultValue={member?.district ?? ""}
          />
        </Field>
        <Field label="Ngành nghề">
          <input
            name="industry"
            className="inp"
            defaultValue={member?.industry ?? ""}
            placeholder="Ví dụ: Dệt may, Logistics, F&B"
          />
        </Field>
        <Field label="Nhóm / chi hội">
          <select
            name="chapterId"
            className="inp"
            defaultValue={member?.chapterId ?? ""}
          >
            <option value="">— Chưa xếp nhóm —</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Điện thoại">
          <input name="phone" className="inp" defaultValue={member?.phone ?? ""} />
        </Field>
        <Field label="Email">
          <input name="email" className="inp" defaultValue={member?.email ?? ""} />
        </Field>
        <Field label="Website">
          <input name="website" className="inp" defaultValue={member?.website ?? ""} />
        </Field>
        <Field label="Địa chỉ">
          <input name="address" className="inp" defaultValue={member?.address ?? ""} />
        </Field>
      </div>

      <Field label="Đang cung cấp (sản phẩm / dịch vụ)">
        <textarea
          name="offering"
          rows={2}
          className="inp"
          defaultValue={member?.offering ?? ""}
          placeholder="Để hội viên khác biết có thể mua gì của doanh nghiệp này"
        />
      </Field>
      <Field label="Đang tìm mua">
        <textarea
          name="needing"
          rows={2}
          className="inp"
          defaultValue={member?.needing ?? ""}
          placeholder="Nhu cầu hiện tại — ban điều hành dựa vào đây để kết nối"
        />
      </Field>
      <Field label="Ghi chú nội bộ">
        <textarea name="note" rows={2} className="inp" defaultValue={member?.note ?? ""} />
      </Field>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="active"
          defaultChecked={member?.active ?? true}
        />
        Đang là hội viên hoạt động
      </label>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}
      {state.message && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "Đang lưu..." : member?.id ? "Lưu thay đổi" : "Thêm hội viên"}
      </button>
    </form>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="lbl">
        {label} {required && <span className="text-do-500">*</span>}
      </label>
      {children}
    </div>
  );
}
