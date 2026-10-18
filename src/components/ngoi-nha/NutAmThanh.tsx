"use client";

import { useSyncExternalStore } from "react";
import BieuTuong from "./BieuTuong";
import { am, amThanhDangBat, datAmThanh, theoDoiAmThanh } from "./am-thanh";

export default function NutAmThanh() {
  // Máy chủ luôn coi là đang bật; trình duyệt đọc lựa chọn đã lưu
  const bat = useSyncExternalStore(theoDoiAmThanh, amThanhDangBat, () => true);
  return (
    <button
      type="button"
      onClick={() => {
        const moi = !bat;
        datAmThanh(moi);
        if (moi) am.bam();
      }}
      className="grid h-11 w-11 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
      aria-label={bat ? "Tắt âm thanh" : "Bật âm thanh"}
      title={bat ? "Tắt âm thanh" : "Bật âm thanh"}
    >
      <BieuTuong ten={bat ? "loa" : "loa-tat"} />
    </button>
  );
}
