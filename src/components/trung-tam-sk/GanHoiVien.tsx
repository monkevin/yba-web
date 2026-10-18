"use client";

import { useState } from "react";
import MemberPicker from "@/components/MemberPicker";
import HopThoai from "@/components/trung-tam-sk/HopThoai";

/**
 * Nút gắn / đổi / gỡ hồ sơ hội viên cho một dòng (khách, BTC, nhà tài trợ).
 * Gắn đúng hội viên thì check-in, BTC, tài trợ mới được tính điểm hoạt động.
 */
export default function GanHoiVien({
  bang,
  id,
  nhan,
  khiXong,
}: {
  bang: "khach" | "btc" | "taitro";
  id: string;
  /** Nhãn đang gắn, VD "HV0012" — trống = chưa gắn */
  nhan: string | null;
  khiXong: (memberId: string | null) => void;
}) {
  const [mo, setMo] = useState(false);
  const [loi, setLoi] = useState("");
  const [ban, setBan] = useState(false);

  async function luu(memberId: string | null) {
    setBan(true);
    setLoi("");
    const res = await fetch(`/api/quan-tri/su-kien/bang/${bang}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    const d = await res.json().catch(() => ({}));
    setBan(false);
    if (!res.ok) return setLoi(d.error || "Không lưu được");
    setMo(false);
    khiXong(memberId);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setMo(true)}
        className={
          nhan
            ? "rounded-full bg-navy-100 px-2 py-0.5 text-xs font-medium text-navy-800 hover:bg-navy-200"
            : "text-xs text-slate-400 hover:text-navy-600"
        }
        title={nhan ? "Đổi / gỡ hội viên" : "Gắn hồ sơ hội viên"}
      >
        {nhan ?? "+ gắn"}
      </button>
      <HopThoai mo={mo} dong={() => setMo(false)} tieuDe="Gắn hồ sơ hội viên">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = new FormData(e.currentTarget).get("memberId");
            if (typeof v === "string" && v) luu(v);
            else setLoi("Chọn một hội viên");
          }}
          className="space-y-4"
        >
          <MemberPicker name="memberId" label="Hội viên" />
          <p className="text-xs text-slate-500">
            Gắn đúng người để check-in / tham gia BTC / tài trợ được cộng điểm hoạt động và hiện trong game Ngôi nhà
            Chợ Lớn.
          </p>
          {loi && <p className="text-sm text-do-600">{loi}</p>}
          <div className="flex justify-between gap-2">
            {nhan ? (
              <button type="button" className="btn-ghost" disabled={ban} onClick={() => luu(null)}>
                Gỡ gắn
              </button>
            ) : (
              <span />
            )}
            <button className="btn-primary" disabled={ban}>
              Lưu
            </button>
          </div>
        </form>
      </HopThoai>
    </>
  );
}
