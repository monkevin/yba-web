"use client";

import { useActionState, useState } from "react";
import MemberPicker, { type PickedMember } from "@/components/MemberPicker";
import { createDeal, type ActionResult } from "../actions";
import { toDateInput } from "@/lib/format";
import {
  PARTNER_SCOPE,
  SCOPE_HINT,
  SCOPE_LABEL,
  SCOPE_ORDER,
  canTenToChuc,
} from "@/lib/deal";

export default function DealForm({
  me,
  backOffice,
}: {
  me: PickedMember | null;
  backOffice: boolean;
}) {
  const [state, formAction, pending] = useActionState<ActionResult, FormData>(
    createDeal,
    {}
  );
  // Hội viên khai đơn: mặc định mình là bên bán, đổi được sang bên mua
  const [side, setSide] = useState<"SELLER" | "BUYER">("SELLER");
  const [amount, setAmount] = useState("");
  const [scope, setScope] = useState<string>(PARTNER_SCOPE.NOI_CHI_HOI);

  const meIsSeller = !!me && side === "SELLER";
  const meIsBuyer = !!me && side === "BUYER";

  return (
    <form action={formAction} className="card space-y-5 p-5">
      {me && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 p-3">
          <span className="text-sm text-slate-600">Trong đơn này tôi là:</span>
          {(
            [
              ["SELLER", "Bên bán"],
              ["BUYER", "Bên mua"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setSide(v)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                side === v
                  ? "bg-navy-600 text-white"
                  : "bg-white text-slate-600 ring-1 ring-slate-300 hover:bg-slate-100"
              }`}
            >
              {label}
            </button>
          ))}
          {backOffice && (
            <span className="text-xs text-slate-500">
              (Ban điều hành có thể nhập hộ cho hai hội viên bất kỳ)
            </span>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <MemberPicker
          key={`seller-${side}`}
          name="sellerId"
          label="Bên bán"
          required
          initial={meIsSeller ? me : null}
        />
        <MemberPicker
          key={`buyer-${side}`}
          name="buyerId"
          label="Bên mua"
          required
          initial={meIsBuyer ? me : null}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="lbl">
            Giá trị đơn (VND) <span className="text-do-500">*</span>
          </label>
          <input
            name="amount"
            className="inp"
            inputMode="numeric"
            value={amount}
            placeholder="Ví dụ: 150.000.000"
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              setAmount(
                digits ? new Intl.NumberFormat("vi-VN").format(Number(digits)) : ""
              );
            }}
          />
        </div>
        <div>
          <label className="lbl">
            Ngày giao dịch <span className="text-do-500">*</span>
          </label>
          <input
            type="date"
            name="dealDate"
            className="inp"
            defaultValue={toDateInput(new Date())}
            max={toDateInput(new Date())}
          />
        </div>
      </div>

      <MemberPicker
        name="referrerId"
        label="Hội viên giới thiệu (nếu có)"
        placeholder="Người đã kết nối hai bên — để trống nếu không có"
      />

      {/* Phạm vi giao thương — căn cứ tách chỉ số nội Chi hội / liên chi hội /
          liên hội ở trang xúc tiến thương mại công khai. */}
      <div>
        <label className="lbl">
          Phạm vi giao thương <span className="text-do-500">*</span>
        </label>
        <div className="grid gap-2 sm:grid-cols-2">
          {SCOPE_ORDER.map((v) => (
            <label
              key={v}
              className={`cursor-pointer rounded-lg p-3 ring-1 transition ${
                scope === v
                  ? "bg-navy-50 ring-navy-400"
                  : "bg-white ring-slate-300 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="partnerScope"
                value={v}
                checked={scope === v}
                onChange={() => setScope(v)}
                className="sr-only"
              />
              <span className="block text-sm font-semibold text-slate-800">
                {SCOPE_LABEL[v]}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                {SCOPE_HINT[v]}
              </span>
            </label>
          ))}
        </div>
      </div>

      {canTenToChuc(scope) && (
        <div>
          <label className="lbl">
            Tên chi hội / hội của đối tác <span className="text-do-500">*</span>
          </label>
          <input
            name="externalOrg"
            className="inp"
            placeholder={
              scope === PARTNER_SCOPE.LIEN_CHI_HOI
                ? "Ví dụ: YBA Sài Gòn, YBA Gia Định, YBA Thủ Đức"
                : "Ví dụ: Hội Doanh nhân trẻ Đồng Tháp, Hiệp hội Dệt may"
            }
          />
        </div>
      )}

      <div>
        <label className="lbl">Nội dung giao dịch</label>
        <textarea
          name="description"
          rows={3}
          className="inp"
          placeholder="Mô tả ngắn hàng hoá / dịch vụ đã mua bán"
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Đang lưu..." : "Gửi khai báo"}
        </button>
        <p className="text-xs text-slate-500">
          Sau khi gửi, đối tác sẽ nhận đơn để xác nhận, rồi ban điều hành duyệt.
        </p>
      </div>
    </form>
  );
}
