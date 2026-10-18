"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MaQr from "@/components/MaQr";

type Cong = "moDangKy" | "moTuCheckin" | "moHoiDap" | "moDanhGia";

const CONG: { k: Cong; duong: string; ten: string; moTa: string; dem: string; xem?: string }[] = [
  { k: "moDangKy", duong: "dang-ky", ten: "Đăng ký tham dự", moTa: "Đăng bài / gửi Zalo trước sự kiện. Trùng SĐT thì không ghi đè thông tin BTC đã nhập.", dem: "đăng ký online", xem: "khach" },
  { k: "moTuCheckin", duong: "check-in", ten: "Tự check-in", moTa: "In ở bàn đón cùng mã PIN. Khách gõ SĐT + PIN; khách vãng lai điền thêm họ tên.", dem: "lượt tự check-in", xem: "check-in" },
  { k: "moHoiDap", duong: "hoi-dap", ten: "Hỏi đáp", moTa: "Chiếu lên màn hình phần tọa đàm. Câu hỏi vào tab Hỏi đáp để duyệt và chiếu.", dem: "câu hỏi", xem: "hoi-dap" },
  { k: "moDanhGia", duong: "danh-gia", ten: "Đánh giá", moTa: "Chiếu cuối chương trình / gửi Zalo sau sự kiện. Kết quả ở tab Đánh giá.", dem: "đánh giá", xem: "danh-gia" },
];

export default function CongQrClient({
  eventId,
  tieuDe,
  goc,
  pin,
  mo: dau,
  dem,
}: {
  eventId: string;
  tieuDe: string;
  goc: string;
  pin: string;
  mo: Record<Cong, boolean>;
  dem: Record<Cong, number>;
}) {
  const router = useRouter();
  const [mo, setMo] = useState(dau);
  const [loi, setLoi] = useState("");
  const [daChep, setDaChep] = useState("");

  async function patch(body: Record<string, unknown>) {
    setLoi("");
    const res = await fetch(`/api/quan-tri/su-kien/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setLoi(d.error || "Không lưu được");
    return res.ok;
  }

  async function bat(k: Cong, v: boolean) {
    setMo((m) => ({ ...m, [k]: v }));
    if (!(await patch({ [k]: v }))) setMo((m) => ({ ...m, [k]: !v }));
  }

  async function doiPin() {
    if (!confirm("Cấp PIN mới? Bảng PIN đã in sẽ không dùng được nữa.")) return;
    if (await patch({ doiPin: true })) router.refresh();
  }

  async function chep(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setDaChep(url);
    } catch {
      setLoi("Trình duyệt không cho chép — bấm giữ đường dẫn để chép.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <div className="card flex items-center gap-4 px-5 py-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500">PIN tự check-in</div>
            <div className="font-mono text-3xl font-bold tracking-[0.3em] text-do-700">{pin}</div>
          </div>
          <button onClick={doiPin} className="btn-ghost !py-1 text-sm">
            Đổi PIN
          </button>
        </div>
        <p className="max-w-md text-sm text-slate-500">
          Chỉ đọc / in PIN tại bàn đón — người ở nhà quét được QR cũng không check-in được. Nhập sai nhiều lần sẽ bị chặn tạm.
        </p>
        <button onClick={() => window.print()} className="btn-primary ml-auto">
          🖨 In bảng QR
        </button>
      </div>
      {loi && <p className="text-sm text-do-600 print:hidden">{loi}</p>}

      <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2">
        {CONG.map((c) => {
          const url = `${goc}/${c.duong}`;
          const bat_ = mo[c.k];
          return (
            <div key={c.k} className={`card p-5 print:break-inside-avoid ${bat_ ? "" : "opacity-70 print:hidden"}`}>
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-navy-800">{c.ten}</h3>
                  <p className="text-xs text-slate-500 print:hidden">{c.moTa}</p>
                  <p className="hidden text-sm text-slate-600 print:block">{tieuDe}</p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm print:hidden">
                  <input type="checkbox" className="h-4 w-4" checked={bat_} onChange={(e) => bat(c.k, e.target.checked)} />
                  {bat_ ? <b className="text-emerald-700">Đang mở</b> : <span className="text-slate-500">Đóng</span>}
                </label>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <MaQr noiDung={url} rong={150} nhan={`Mã QR ${c.ten}`} className="shrink-0 rounded" />
                <div className="min-w-0 space-y-2 text-sm">
                  <div className="break-all font-mono text-xs text-slate-600">{url}</div>
                  {c.k === "moTuCheckin" && (
                    <div className="hidden text-lg font-bold print:block">
                      PIN: <span className="font-mono tracking-[0.3em]">{pin}</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 print:hidden">
                    <button onClick={() => chep(url)} className="btn-ghost !px-2 !py-1 text-xs">
                      {daChep === url ? "Đã chép ✓" : "Chép link"}
                    </button>
                    <a href={url} target="_blank" rel="noopener" className="btn-ghost !px-2 !py-1 text-xs">
                      Mở thử ↗
                    </a>
                  </div>
                  {c.xem && (
                    <Link href={`/quan-tri/su-kien/${eventId}/${c.xem}`} className="block text-xs text-navy-600 hover:underline print:hidden">
                      {dem[c.k]} {c.dem} →
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 print:hidden">
        Trang khách: <a href={goc} target="_blank" rel="noopener" className="font-mono text-navy-600 hover:underline">{goc}</a> — chỉ hiện
        các cổng đang mở, không hiện danh sách khách hay số điện thoại.
      </p>
    </div>
  );
}
