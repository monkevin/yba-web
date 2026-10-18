"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MemberPicker from "@/components/MemberPicker";
import BangDuLieu, { type Dong } from "@/components/trung-tam-sk/BangDuLieu";
import GanHoiVien from "@/components/trung-tam-sk/GanHoiVien";
import HopThoai from "@/components/trung-tam-sk/HopThoai";
import { TRANG_THAI_TAI_TRO, TT_TAI_TRO_CHUA_CHOT } from "@/lib/tai-tro";
import { QUYEN_LOI_THEO_HANG, docSo, soVN } from "@/lib/trung-tam-sk/bang";

const CHUA_CHOT = TT_TAI_TRO_CHUA_CHOT;

export default function TaiTroClient({ eventId, ds: dau, hang: hangDau }: { eventId: string; ds: Dong[]; hang: Dong[] }) {
  const router = useRouter();
  const [ds, setDs] = useState(dau);
  const [dauCu, setDauCu] = useState(dau);
  if (dau !== dauCu) {
    setDauCu(dau);
    setDs(dau);
  }
  const [hang, setHang] = useState(hangDau);
  const [hangCu, setHangCu] = useState(hangDau);
  if (hangDau !== hangCu) {
    setHangCu(hangDau);
    setHang(hangDau);
  }
  const [moQl, setMoQl] = useState<Dong | null>(null);
  const [ql, setQl] = useState<Record<string, { xong: number; tong: number }>>({});
  const [chonHang, setChonHang] = useState("");
  const [tien, setTien] = useState("");
  const [loi, setLoi] = useState("");
  const [ban, setBan] = useState(false);
  const [khoa, setKhoa] = useState(0);

  const chot = ds.filter((t) => !CHUA_CHOT.includes(t.trangThai));
  const sum = (k: string) => chot.reduce((a, t) => a + (Number(t[k]) || 0), 0);
  const tienQl = (t: Dong) =>
    ql[t.id] ?? {
      xong: (t.quyenLoi ?? []).filter((x: Dong) => x.xong).length,
      tong: (t.quyenLoi ?? []).length,
    };
  const daCo = (tenHang: string) => chot.filter((t) => t.mucTaiTro === tenHang).length;
  const hangLc = hang.map((h) => ({ value: String(h.ten), label: String(h.ten) }));

  async function taoHangMau() {
    await fetch(`/api/quan-tri/su-kien/${eventId}/tao-mau`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phan: "hang" }),
    });
    router.refresh();
  }

  async function them(fd: FormData) {
    setLoi("");
    const memberId = String(fd.get("memberId") ?? "");
    const ten = String(fd.get("nhaTaiTro") ?? "").trim();
    if (!memberId && !ten) return setLoi("Chọn hội viên hoặc gõ tên doanh nghiệp ngoài Hội");
    if (!chonHang) return setLoi("Chọn hạng tài trợ");
    setBan(true);
    const res = await fetch("/api/quan-tri/su-kien/bang/taitro", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId,
        ...(memberId ? { memberId } : {}),
        ...(ten ? { nhaTaiTro: ten } : {}),
        mucTaiTro: chonHang,
        ...(tien ? { hienKim: tien } : {}),
        hienVat: String(fd.get("hienVat") ?? ""),
        trangThai: String(fd.get("trangThai") ?? "Cam kết"),
        nguoiVanDong: String(fd.get("nguoiVanDong") ?? ""),
      }),
    });
    const d = await res.json().catch(() => ({}));
    setBan(false);
    if (!res.ok) return setLoi(d.error || "Không thêm được");
    setKhoa((k) => k + 1);
    setChonHang("");
    setTien("");
    router.refresh();
  }

  async function apMau(t: Dong) {
    const h = hang.find((x) => x.ten === t.mucTaiTro);
    const mau = h?.quyenLoi
      ? String(h.quyenLoi).split("\n").map((x) => x.trim()).filter(Boolean)
      : QUYEN_LOI_THEO_HANG[t.mucTaiTro] ?? [];
    if (!mau.length) return;
    await fetch("/api/quan-tri/su-kien/bang/quyenloi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taiTroId: t.id, rows: mau.map((noiDung) => ({ noiDung })) }),
    });
    setMoQl(null);
    router.refresh();
  }

  const the = (nhan: string, giaTri: string, phu?: string) => (
    <div className="card p-3">
      <div className="text-xs text-slate-500">{nhan}</div>
      <div className="text-lg font-bold text-navy-800 tabular-nums">{giaTri}</div>
      {phu && <div className="text-xs text-slate-500">{phu}</div>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {the("Nhà tài trợ đã chốt", String(chot.length), `${ds.length - chot.length} đang vận động / huỷ`)}
        {the("Tiền mặt cam kết", soVN(sum("hienKim")), "VND")}
        {the("Đã thu", soVN(sum("daThu")), `Còn phải thu ${soVN(Math.max(0, sum("hienKim") - sum("daThu")))}`)}
        {the("Tổng giá trị (gồm hiện vật)", soVN(sum("giaTri")), "VND")}
      </div>

      <section>
        <h2 className="font-bold text-navy-800">1. Hạng tài trợ của chương trình</h2>
        <p className="mb-3 text-sm text-slate-500">
          Mỗi chương trình một mức tiền, số suất, quyền lợi riêng. Chọn hạng khi thêm nhà tài trợ là số tiền + danh sách quyền lợi tự
          điền theo bảng này.
        </p>
        {hang.length === 0 ? (
          <button className="btn-ghost" onClick={taoHangMau}>
            Tạo bảng hạng mẫu (Nhà tài trợ chính → Đồng hành)
          </button>
        ) : (
          <BangDuLieu
            bang="hangtaitro"
            chaId={eventId}
            dong={hang}
            khiDoi={setHang}
            sua
            khongDan
            tenXuat="hang-tai-tro"
            cot={[
              "ten",
              "mucTien",
              "soSuat",
              {
                key: "daCo",
                label: "Đã có",
                rong: 80,
                giaTri: (r) => daCo(r.ten),
                render: (r) => (
                  <span className={r.soSuat && daCo(r.ten) >= r.soSuat ? "font-semibold text-do-600" : "text-slate-700"}>
                    {daCo(r.ten)}
                    {r.soSuat ? `/${r.soSuat}` : ""}
                  </span>
                ),
              },
              "quyenLoi",
            ]}
          />
        )}
      </section>

      <section>
        <h2 className="mb-3 font-bold text-navy-800">2. Thêm nhà tài trợ</h2>
        <form
          key={khoa}
          className="card grid gap-3 p-4 md:grid-cols-2 lg:grid-cols-3"
          onSubmit={(e) => {
            e.preventDefault();
            them(new FormData(e.currentTarget));
          }}
        >
          <MemberPicker name="memberId" label="Hội viên tài trợ" />
          <label>
            <span className="lbl">hoặc Doanh nghiệp ngoài Hội</span>
            <input name="nhaTaiTro" className="inp" />
          </label>
          <label>
            <span className="lbl">Hạng</span>
            <select
              className="inp"
              value={chonHang}
              onChange={(e) => {
                setChonHang(e.target.value);
                const h = hang.find((x) => x.ten === e.target.value);
                setTien(h?.mucTien ? soVN(Number(h.mucTien)) : "");
              }}
            >
              <option value="">— Chọn hạng —</option>
              {hang.map((h) => (
                <option key={h.id} value={h.ten}>
                  {h.ten}
                  {h.mucTien ? ` — ${soVN(Number(h.mucTien))}đ` : ""}
                  {h.soSuat ? ` (đã có ${daCo(h.ten)}/${h.soSuat})` : ""}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="lbl">Tiền mặt cam kết (VND)</span>
            <input className="inp" value={tien} onChange={(e) => setTien(e.target.value)} placeholder="VD 50.000.000 hoặc 50tr" />
            {tien && docSo(tien) === null && <span className="text-xs text-do-600">Số tiền chưa đúng</span>}
          </label>
          <label>
            <span className="lbl">Hiện vật (nếu có)</span>
            <input name="hienVat" className="inp" placeholder="VD 200 chai nước, quà tặng…" />
          </label>
          <label>
            <span className="lbl">Trạng thái</span>
            <select name="trangThai" className="inp" defaultValue="Cam kết">
              {TRANG_THAI_TAI_TRO.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="lbl">Người vận động</span>
            <input name="nguoiVanDong" className="inp" />
          </label>
          <div className="flex items-end gap-3 lg:col-span-2">
            <button className="btn-primary" disabled={ban}>
              + Thêm nhà tài trợ
            </button>
            {loi && <span className="text-sm text-do-600">{loi}</span>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-bold text-navy-800">3. Danh sách nhà tài trợ</h2>
        <BangDuLieu
          bang="taitro"
          chaId={eventId}
          dong={ds}
          khiDoi={setDs}
          sua
          khongThem
          nhomTheo="mucTaiTro"
          luaChon={hangLc.length ? { mucTaiTro: hangLc } : {}}
          loc={["trangThai", "nguoiVanDong"]}
          tenXuat="nha-tai-tro"
          lopDong={(r) =>
            CHUA_CHOT.includes(r.trangThai) ? "opacity-60" : (Number(r.daThu) || 0) < (Number(r.hienKim) || 0) ? "bg-amber-50/70" : ""
          }
          cot={[
            "nhaTaiTro",
            {
              key: "ma",
              label: "Hội viên",
              rong: 90,
              giaTri: (r) => r.ma ?? "",
              render: (r) => (
                <GanHoiVien bang="taitro" id={r.id} nhan={r.memberId ? r.ma ?? "Hội viên" : null} khiXong={() => router.refresh()} />
              ),
            },
            "mucTaiTro",
            "trangThai",
            "hienKim",
            "daThu",
            "ngayThu",
            "hienVat",
            "giaTri",
            {
              key: "ql",
              label: "Quyền lợi",
              rong: 100,
              giaTri: (r) => `${tienQl(r).xong}/${tienQl(r).tong}`,
              render: (r) => {
                const p = tienQl(r);
                return (
                  <button
                    onClick={() => setMoQl(r)}
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.tong && p.xong === p.tong ? "bg-emerald-100 text-emerald-800" : "bg-navy-100 text-navy-800"
                    }`}
                  >
                    {p.tong ? `${p.xong}/${p.tong} đã làm` : "+ quyền lợi"}
                  </button>
                );
              },
            },
            {
              key: "baoCao",
              label: "Báo cáo NTT",
              rong: 90,
              render: (r) => (
                <a href={`/quan-tri/su-kien/${eventId}/tai-tro/${r.id}`} className="text-xs text-navy-600 underline">
                  Xem / in
                </a>
              ),
            },
            "nguoiVanDong",
            "lienHe",
            "ghiChu",
          ]}
        />
        <p className="mt-3 text-xs text-slate-500">
          Nhà tài trợ <b>Đang vận động</b> hoặc <b>Huỷ</b> không hiện ở trang vinh danh /tai-tro và không được tính điểm đóng góp. Gắn hồ sơ
          hội viên để doanh nghiệp được cộng điểm tài trợ.
        </p>
      </section>

      <HopThoai mo={!!moQl} dong={() => setMoQl(null)} tieuDe={`Quyền lợi · ${moQl?.nhaTaiTro ?? ""}`} rong>
        {moQl && (
          <>
            {(moQl.quyenLoi ?? []).length === 0 && (
              <button className="btn-ghost mb-3" onClick={() => apMau(moQl)}>
                Tạo danh sách theo hạng {moQl.mucTaiTro || ""}
              </button>
            )}
            <BangDuLieu
              bang="quyenloi"
              chaId={moQl.id}
              dong={moQl.quyenLoi ?? []}
              sua
              khongDan
              tenXuat="quyen-loi"
              khiDoi={(x) => setQl((q) => ({ ...q, [moQl.id]: { xong: x.filter((d) => d.xong).length, tong: x.length } }))}
              cot={["noiDung", "xong", "ghiChu"]}
            />
          </>
        )}
      </HopThoai>
    </div>
  );
}
