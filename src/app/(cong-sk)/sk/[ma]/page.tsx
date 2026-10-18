import Link from "next/link";
import { gioVN } from "@/lib/trung-tam-sk/bang";
import { napCongTrang } from "./nap";

export default async function TrangCong({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const c = await napCongTrang(ma);
  const nut = [
    { mo: c.moTuCheckin, href: "check-in", ten: "Check-in", mo_ta: "Báo có mặt khi đến nơi", lop: "bg-do-600 text-white" },
    { mo: c.moDangKy, href: "dang-ky", ten: "Đăng ký tham dự", mo_ta: "Giữ chỗ trước cho anh/chị", lop: "bg-navy-700 text-white" },
    { mo: c.moHoiDap, href: "hoi-dap", ten: "Gửi câu hỏi", mo_ta: "Hỏi diễn giả ngay trong chương trình", lop: "bg-navy-50 text-navy-800" },
    { mo: c.moDanhGia, href: "danh-gia", ten: "Đánh giá sự kiện", mo_ta: "1 phút góp ý cho Ban tổ chức", lop: "bg-navy-50 text-navy-800" },
  ].filter((n) => n.mo);
  return (
    <div className="space-y-4">
      {c.event.summary && <p className="text-sm text-slate-600">{c.event.summary}</p>}
      {nut.length ? (
        <div className="grid gap-3">
          {nut.map((n) => (
            <Link key={n.href} href={`/sk/${c.ma}/${n.href}`} className={`rounded-xl px-4 py-3.5 ${n.lop}`}>
              <div className="font-semibold">{n.ten} →</div>
              <div className="text-xs opacity-80">{n.mo_ta}</div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-600">Ban tổ chức chưa mở cổng nào. Anh/chị vui lòng quay lại sau.</p>
      )}
      {c.phien.length > 1 && (
        <div>
          <h2 className="text-sm font-semibold text-navy-800">Chương trình</h2>
          <ul className="mt-1 divide-y divide-slate-100 text-sm">
            {c.phien.map((p) => (
              <li key={p.id} className="flex gap-3 py-1.5">
                <span className="w-12 shrink-0 text-slate-500">{p.batDau ? gioVN(p.batDau) : ""}</span>
                <span>
                  {p.ten}
                  {p.diaDiem ? <span className="text-slate-500"> · {p.diaDiem}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
