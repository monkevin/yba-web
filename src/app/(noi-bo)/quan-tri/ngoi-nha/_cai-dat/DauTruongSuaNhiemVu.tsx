"use client";

/**
 * Sửa 16 Nhiệm vụ Huynh đệ (`nn.nhiemVu`): bật / tắt, điểm, vốn, số lần tối
 * đa theo kỳ, cần ảnh, và chữ hiển thị (trong ô thu gọn). Không thêm / xoá
 * nhiệm vụ được — mỗi mã gắn với cách ghi nhận trong code; bỏ thì TẮT.
 */
import { useId, useState } from "react";
import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import type {
  NhiemVuSua,
  NoiDungNhiemVu,
} from "@/lib/ngoi-nha/cai-dat/noi-dung-sua";
import { MA_VON, VON, type MaVon } from "@/lib/ngoi-nha/luat";
import type { KyGioiHan } from "@/lib/ngoi-nha/thoi-gian";
import KhungCaiDat from "./KhungCaiDat";
import { INP, OBat, OChu, OSo } from "./truong";

type CoDinh = Record<
  string,
  { nhom: string; tuDong: boolean; thuCong: "HOI_VIEN" | "BAN_DUYET" | null }
>;

const KY: { ma: KyGioiHan | ""; ten: string; don: string }[] = [
  { ma: "", ten: "Không giới hạn", don: "" },
  { ma: "NGAY", ten: "Mỗi ngày", don: "ngày" },
  { ma: "TUAN", ten: "Mỗi tuần", don: "tuần" },
  { ma: "THANG", ten: "Mỗi tháng", don: "tháng" },
  { ma: "MUA", ten: "Cả mùa", don: "mùa" },
];

const CACH: Record<string, string> = {
  TU_DONG: "Hệ thống tự ghi nhận",
  HOI_VIEN: "Hội viên liên quan xác nhận",
  BAN_DUYET: "Ban phụ trách duyệt",
};

/**
 * So hai bản nhiệm vụ theo nội dung — máy chủ lưu vốn theo thứ tự CN/TT/XH/TS
 * nên không so bằng JSON (thứ tự khoá khác là báo "khác bản gốc" sai).
 */
function giongNhau(a: NhiemVuSua, b: NhiemVuSua): boolean {
  return (
    (
      [
        "bat",
        "ten",
        "viec",
        "xacNhan",
        "diem",
        "gioiHan",
        "toiDa",
        "ky",
        "canAnh",
        "goiY",
      ] as const
    ).every((k) => a[k] === b[k]) &&
    MA_VON.every((k) => (a.von[k] ?? 0) === (b.von[k] ?? 0))
  );
}

/** Chữ giới hạn sinh theo số — "Tối đa 4 lần/tháng" */
const chuGioiHan = (toiDa: number, ky: KyGioiHan | null) => {
  const k = KY.find((x) => x.ma === ky);
  return toiDa > 0 && ky && k
    ? `Tối đa ${toiDa} lần/${k.don}`
    : "Không giới hạn";
};

export default function DauTruongSuaNhiemVu({
  muc,
  coDinh,
}: {
  muc: DuLieuMuc<NoiDungNhiemVu>;
  coDinh: CoDinh;
}) {
  const goc = new Map(muc.macDinh.ds.map((n) => [n.ma, n]));
  return (
    <KhungCaiDat
      muc="nhiemVu"
      nhom={["ds"]}
      giaTri={muc.giaTri}
      macDinh={muc.macDinh}
      tieuDe="Nhiệm vụ Huynh đệ"
      moTa={
        <>
          Điểm và vốn cộng theo mức đang cài LÚC ĐƯỢC XÁC NHẬN. Tắt một nhiệm
          vụ: hội viên không thấy, không gửi được, hệ thống không tự ghi nhận
          (yêu cầu đang chờ vẫn duyệt được). Bật lại nhiệm vụ tự động thì hệ
          thống ghi nhận bù việc đã làm trong mùa, vẫn theo giới hạn từng kỳ.
        </>
      }
    >
      {(v, sua) => {
        const soTat = v.ds.filter((n) => !n.bat).length;
        const doiDong = (ma: string, f: (n: NhiemVuSua) => NhiemVuSua) =>
          sua((x) => ({
            ...x,
            ds: x.ds.map((n) => (n.ma === ma ? f(n) : n)),
          }));
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              {v.ds.length - soTat} nhiệm vụ đang bật
              {soTat ? ` · ${soTat} đang tắt` : ""}.
            </p>
            {v.ds.map((n) => (
              <DongNhiemVu
                key={n.ma}
                n={n}
                goc={goc.get(n.ma)}
                coDinh={coDinh[n.ma]}
                doi={(f) => doiDong(n.ma, f)}
              />
            ))}
          </div>
        );
      }}
    </KhungCaiDat>
  );
}

function DongNhiemVu({
  n,
  goc,
  coDinh,
  doi,
}: {
  n: NhiemVuSua;
  goc: NhiemVuSua | undefined;
  coDinh: CoDinh[string] | undefined;
  doi: (f: (n: NhiemVuSua) => NhiemVuSua) => void;
}) {
  const idKy = useId();
  const khacGoc = !!goc && !giongNhau(goc, n);
  const cach = coDinh
    ? [
        coDinh.tuDong ? CACH.TU_DONG : "",
        coDinh.thuCong ? CACH[coDinh.thuCong] : "",
      ]
        .filter(Boolean)
        .join(" hoặc ")
    : "";
  // Đổi số lần / kỳ thì chữ giới hạn hiện cho hội viên đổi theo
  const doiGioiHan = (toiDa: number, ky: KyGioiHan | null) =>
    doi((x) => ({ ...x, toiDa, ky, gioiHan: chuGioiHan(toiDa, ky) }));

  return (
    <div
      className={`space-y-3 rounded-xl p-3 ring-1 sm:p-4 ${
        n.bat ? "bg-white ring-navy-100" : "bg-slate-50 ring-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-semibold text-navy-800">
            <span className="mr-1.5 font-mono text-xs text-slate-400">
              {n.ma}
            </span>
            {n.ten}
          </div>
          <div className="text-xs text-slate-500">
            {[coDinh?.nhom, cach].filter(Boolean).join(" · ")}
          </div>
        </div>
        {khacGoc && goc && (
          <button
            type="button"
            className="min-h-11 px-2 text-xs text-navy-600 underline"
            onClick={() => doi(() => goc)}
          >
            Dùng lại bản gốc
          </button>
        )}
      </div>

      <OBat
        nhan={n.bat ? "Đang cho hội viên làm" : "Đã tắt nhiệm vụ này"}
        giaTri={n.bat}
        onDoi={(b) => doi((x) => ({ ...x, bat: b }))}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <OSo
          nhan="Điểm Vươn tầm"
          giaTri={n.diem}
          macDinh={goc?.diem}
          gioiHan={[0, 5000]}
          donVi="điểm"
          onDoi={(d) => doi((x) => ({ ...x, diem: d }))}
        />
        <div className="space-y-2">
          <label htmlFor={idKy} className="block">
            <span className="lbl">Giới hạn số lần</span>
            <select
              id={idKy}
              className={INP}
              value={n.ky ?? ""}
              onChange={(e) => {
                const ky = (e.target.value || null) as KyGioiHan | null;
                doiGioiHan(ky ? Math.max(1, n.toiDa) : 0, ky);
              }}
            >
              {KY.map((k) => (
                <option key={k.ma} value={k.ma}>
                  {k.ten}
                </option>
              ))}
            </select>
          </label>
          {n.ky && (
            <OSo
              nhan="Tối đa"
              giaTri={n.toiDa}
              macDinh={goc?.ky === n.ky ? goc?.toiDa : undefined}
              gioiHan={[0, 100]}
              donVi={`lần / ${KY.find((k) => k.ma === n.ky)?.don ?? ""}`}
              goiY="0 = không giới hạn"
              onDoi={(t) => doiGioiHan(t, n.ky)}
            />
          )}
        </div>
      </div>

      <div>
        <span className="lbl">Vốn cộng mỗi lần</span>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MA_VON.map((k) => (
            <OVon
              key={k}
              ma={k}
              giaTri={n.von[k] ?? 0}
              onDoi={(so) =>
                doi((x) => {
                  const von = { ...x.von };
                  if (so > 0) von[k] = so;
                  else delete von[k];
                  return { ...x, von };
                })
              }
            />
          ))}
        </div>
      </div>

      {coDinh?.thuCong && (
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-300"
            checked={n.canAnh}
            onChange={(e) => doi((x) => ({ ...x, canAnh: e.target.checked }))}
          />
          Bắt buộc gửi kèm ảnh minh chứng
        </label>
      )}

      <details className="rounded-lg bg-slate-50 px-3 py-2">
        <summary className="min-h-11 cursor-pointer py-2.5 text-sm font-medium text-navy-700">
          Sửa chữ hiển thị (tên, việc cần làm, cách xác nhận, gợi ý)
        </summary>
        <div className="space-y-3 pb-2 pt-1">
          <OChu
            nhan="Tên nhiệm vụ"
            giaTri={n.ten}
            dai={80}
            onDoi={(s) => doi((x) => ({ ...x, ten: s }))}
            goiY={goc && goc.ten !== n.ten ? `Bản gốc: ${goc.ten}` : undefined}
          />
          <OChu
            nhan="Việc cần làm"
            giaTri={n.viec}
            dai={300}
            nhieuDong={3}
            onDoi={(s) => doi((x) => ({ ...x, viec: s }))}
          />
          <OChu
            nhan="Cách xác nhận (chữ cho hội viên)"
            giaTri={n.xacNhan}
            dai={200}
            nhieuDong={2}
            onDoi={(s) => doi((x) => ({ ...x, xacNhan: s }))}
          />
          <OChu
            nhan="Chữ giới hạn"
            giaTri={n.gioiHan}
            dai={80}
            onDoi={(s) => doi((x) => ({ ...x, gioiHan: s }))}
            goiY="Tự đổi theo số lần / kỳ ở trên; sửa tay nếu muốn nói khác (vd “Tối đa 5 giao dịch/tháng”)."
          />
          {coDinh?.thuCong && (
            <OChu
              nhan="Gợi ý khi hội viên kể việc đã làm"
              giaTri={n.goiY}
              dai={200}
              onDoi={(s) => doi((x) => ({ ...x, goiY: s }))}
            />
          )}
          <p className="text-xs text-slate-500">
            Để trống tên / việc / cách xác nhận / chữ giới hạn thì máy chủ lấy
            lại chữ gốc.
          </p>
        </div>
      </details>
    </div>
  );
}

/** Ô vốn nhỏ 0–20 — gõ tự do, bỏ trống coi như 0. */
function OVon({
  ma,
  giaTri,
  onDoi,
}: {
  ma: MaVon;
  giaTri: number;
  onDoi: (v: number) => void;
}) {
  const id = useId();
  const [tho, setTho] = useState(String(giaTri));
  const [truoc, setTruoc] = useState(giaTri);
  if (truoc !== giaTri) {
    setTruoc(giaTri);
    setTho(String(giaTri));
  }
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 rounded-lg bg-white px-2 py-1 ring-1 ring-slate-200"
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: VON[ma].mau }}
      />
      <span className="min-w-0 flex-1 truncate text-xs text-slate-600">
        {VON[ma].ngan}
      </span>
      <input
        id={id}
        inputMode="numeric"
        className="min-h-10 w-14 rounded-md border-slate-300 px-2 text-right text-base sm:text-sm"
        value={tho}
        onChange={(e) => {
          const s = e.target.value.replace(/\D/g, "").slice(0, 2);
          setTho(s);
          const so = Math.min(20, Number(s) || 0);
          setTruoc(so);
          onDoi(so);
        }}
        onBlur={() => setTho(String(giaTri))}
      />
    </label>
  );
}
