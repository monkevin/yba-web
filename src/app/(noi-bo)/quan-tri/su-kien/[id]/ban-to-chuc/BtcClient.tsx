"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberPicker from "@/components/MemberPicker";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import GanHoiVien from "@/components/trung-tam-sk/GanHoiVien";
import { VAI_TRO_BTC } from "@/lib/trung-tam-sk/bang";

export default function BtcClient({
  eventId,
  cacBan,
  ds: dau,
}: {
  eventId: string;
  cacBan: { ten: string; moTa: string }[];
  ds: Dong[];
}) {
  const router = useRouter();
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [ban, setBan] = useState(cacBan[0]?.ten ?? "");
  const [loi, setLoi] = useState("");
  const [dangGui, setDangGui] = useState(false);
  const [khoa, setKhoa] = useState(0);

  async function them(fd: FormData) {
    setLoi("");
    const memberId = String(fd.get("memberId") ?? "");
    const hoTen = String(fd.get("hoTen") ?? "").trim();
    if (!memberId && !hoTen) return setLoi("Chọn hội viên hoặc gõ họ tên người ngoài Hội");
    setDangGui(true);
    const res = await fetch("/api/quan-tri/su-kien/bang/btc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        ban: String(fd.get("ban") ?? ""),
        vaiTro: String(fd.get("vaiTro") ?? "THANH_VIEN"),
        nhiemVu: String(fd.get("nhiemVu") ?? ""),
        ...(memberId ? { memberId } : {}),
        ...(hoTen ? { hoTen } : {}),
      }),
    });
    const d = await res.json().catch(() => ({}));
    setDangGui(false);
    if (!res.ok) return setLoi(d.error || "Không thêm được");
    setKhoa((k) => k + 1);
    router.refresh();
  }

  const soNguoi = (t: string) => ds.filter((d) => d.ban === t).length;
  const banLc = cacBan.map((b) => ({ value: b.ten, label: b.ten }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {cacBan.map((b) => (
          <span
            key={b.ten}
            title={b.moTa}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              soNguoi(b.ten) ? "bg-emerald-100 text-emerald-800" : "bg-do-50 text-do-700 ring-1 ring-do-200"
            }`}
          >
            {b.ten} · {soNguoi(b.ten) || "chưa có người"}
          </span>
        ))}
      </div>

      <form
        key={khoa}
        className="card grid gap-3 p-4 md:grid-cols-[1fr_1.4fr_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          them(new FormData(e.currentTarget));
        }}
      >
        <label>
          <span className="lbl">Ban</span>
          <select name="ban" className="inp" value={ban} onChange={(e) => setBan(e.target.value)}>
            {cacBan.map((b) => (
              <option key={b.ten}>{b.ten}</option>
            ))}
            <option value="">(khác)</option>
          </select>
        </label>
        <MemberPicker name="memberId" label="Hội viên" />
        <label>
          <span className="lbl">hoặc Họ tên (người ngoài Hội)</span>
          <input name="hoTen" className="inp" />
        </label>
        <label>
          <span className="lbl">Vai trò</span>
          <select name="vaiTro" className="inp" defaultValue="THANH_VIEN">
            {VAI_TRO_BTC.map((v) => (
              <option key={v.value} value={v.value}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className="lbl">Nhiệm vụ</span>
          <input name="nhiemVu" className="inp" placeholder={cacBan.find((b) => b.ten === ban)?.moTa ?? ""} />
        </label>
        <div className="flex items-end gap-3 md:col-span-3">
          <button className="btn-primary" disabled={dangGui}>
            + Thêm vào Ban tổ chức
          </button>
          {loi && <span className="text-sm text-do-600">{loi}</span>}
        </div>
      </form>

      <BangDuLieu
        bang="btc"
        chaId={eventId}
        dong={ds}
        khiDoi={setDs}
        sua
        nhomTheo="ban"
        loc={["vaiTro"]}
        luaChon={{ ban: banLc }}
        tenXuat="ban-to-chuc"
        khongThem
        cot={[
          "hoTen",
          {
            key: "ma",
            label: "Hội viên",
            rong: 90,
            giaTri: (r) => r.ma ?? "",
            render: (r) => (
              <GanHoiVien bang="btc" id={r.id} nhan={r.memberId ? r.ma ?? "Hội viên" : null} khiXong={() => router.refresh()} />
            ),
          },
          { key: "ban", rong: 170 },
          "vaiTro",
          "nhiemVu",
          "soDienThoai",
          "caTruc",
          "ghiChu",
        ]}
      />
      <p className="text-xs text-slate-500">
        Người gắn hồ sơ hội viên được tính điểm cống hiến &ldquo;Tham gia Ban tổ chức&rdquo; và quét được thẻ hội viên ở Zalo Mini
        App. Danh sách các ban sửa ở tab Thông tin.
      </p>
    </div>
  );
}
