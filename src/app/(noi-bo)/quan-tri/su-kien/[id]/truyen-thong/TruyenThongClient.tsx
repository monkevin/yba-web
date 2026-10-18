"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import { linkAnToan, soVN } from "@/lib/trung-tam-sk/bang";

const LINK_GOI_Y = [
  { ten: "Thư mục Drive sự kiện", nhom: "Drive" },
  { ten: "KV / bộ nhận diện", nhom: "Thiết kế" },
  { ten: "Kế hoạch truyền thông", nhom: "Kế hoạch" },
  { ten: "Album ảnh", nhom: "Ảnh / video" },
  { ten: "Clip recap", nhom: "Ảnh / video" },
];

const moLink = (url: unknown) => {
  const l = linkAnToan(url);
  return l ? (
    <a href={l} target="_blank" rel="noopener noreferrer" className="text-navy-600 hover:underline">
      Mở ↗
    </a>
  ) : null;
};

export default function TruyenThongClient({ eventId, taiLieu, baiDang }: { eventId: string; taiLieu: Dong[]; baiDang: Dong[] }) {
  const router = useRouter();
  const [bai, setBai] = useState(baiDang);
  const [loi, setLoi] = useState("");
  const reach = bai.reduce((a, b) => a + (Number(b.reach) || 0), 0);
  const tuongTac = bai.reduce((a, b) => a + (Number(b.tuongTac) || 0), 0);
  const coTen = new Set(taiLieu.map((t) => t.ten));
  const goiY = LINK_GOI_Y.filter((g) => !coTen.has(g.ten));

  async function themGoiY() {
    const res = await fetch("/api/quan-tri/su-kien/bang/tailieu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, rows: goiY }),
    });
    if (!res.ok) setLoi("Không thêm được");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-bold text-navy-800">Link quan trọng</h2>
          {goiY.length > 0 && (
            <button onClick={themGoiY} className="text-sm text-navy-600 hover:underline">
              + Thêm sẵn {goiY.length} dòng gợi ý (Drive, KV, kế hoạch, album…)
            </button>
          )}
        </div>
        {loi && <p className="text-sm text-do-600">{loi}</p>}
        <BangDuLieu
          bang="tailieu"
          chaId={eventId}
          dong={taiLieu}
          sua
          nhomTheo="nhom"
          tenXuat="link-truyen-thong"
          trong="Chưa có link nào — dán link thư mục Drive, KV, kế hoạch… vào đây."
          cot={["ten", "url", { key: "mo", label: "", rong: 60, render: (r) => moLink(r.url) }, "nhom", "ghiChu"]}
        />
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-bold text-navy-800">Bài đã đăng</h2>
          <span className="text-sm text-slate-500">
            {bai.length} bài · reach <b className="text-navy-800">{soVN(reach)}</b> · tương tác <b className="text-navy-800">{soVN(tuongTac)}</b> — số
            liệu vào báo cáo gửi nhà tài trợ
          </span>
        </div>
        <BangDuLieu
          bang="baidang"
          chaId={eventId}
          dong={baiDang}
          khiDoi={setBai}
          sua
          loc={["kenh"]}
          tenXuat="bai-da-dang"
          trong="Chưa có bài nào. Sau mỗi bài đăng, dán link + reach vào đây."
          cot={["ngay", "kenh", "tieuDe", "link", { key: "mo", label: "", rong: 60, render: (r) => moLink(r.link) }, "reach", "tuongTac", "ghiChu"]}
        />
      </section>
    </div>
  );
}
