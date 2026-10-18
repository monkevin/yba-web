"use client";

/**
 * Điều chỉnh điểm / vốn thủ công cho một người chơi. Hai bước: nhập → xem lại
 * đúng câu sẽ ghi → xác nhận. Mỗi ô có nút +/− riêng vì bàn phím số của iPhone
 * không có dấu trừ. Gửi bằng onSubmit + startTransition (không `<form action>`).
 */
import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { MA_VON, VON, soDep, type MaVon, type Von } from "@/lib/ngoi-nha/luat";
import { dieuChinhDiem, type KetQuaNguoiChoi } from "./actions-nguoi-choi";
import {
  GIOI_HAN_DIEU_CHINH,
  kiemTraDieuChinh,
  loiTongAm,
  moTaThayDoi,
} from "./nguoi-choi-thuan";
import { OChu, ThongBao, INP } from "./truong";

type O = "diem" | MaVon;
const CAC_O: O[] = ["diem", ...MA_VON];
const trong = (): Record<O, string> => ({
  diem: "",
  CN: "",
  TT: "",
  XH: "",
  TS: "",
});
const cong = (): Record<O, 1 | -1> => ({ diem: 1, CN: 1, TT: 1, XH: 1, TS: 1 });

function OSoCoDau({
  nhan,
  dau,
  chuSo,
  toiDa,
  onDoiDau,
  onDoiSo,
}: {
  nhan: string;
  dau: 1 | -1;
  chuSo: string;
  toiDa: number;
  onDoiDau: () => void;
  onDoiSo: (s: string) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="lbl">
        {nhan}
      </label>
      <div className="flex">
        <button
          type="button"
          onClick={onDoiDau}
          aria-label={
            dau > 0
              ? `${nhan}: đang cộng, bấm để đổi sang trừ`
              : `${nhan}: đang trừ, bấm để đổi sang cộng`
          }
          className={`grid min-h-11 min-w-11 shrink-0 place-items-center rounded-l-lg border text-lg font-bold transition ${
            dau > 0
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-do-300 bg-do-50 text-do-700"
          }`}
        >
          {dau > 0 ? "+" : "−"}
        </button>
        <input
          id={id}
          inputMode="numeric"
          autoComplete="off"
          placeholder="0"
          value={chuSo}
          onChange={(e) =>
            onDoiSo(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          className={`${INP} min-h-11 min-w-0 rounded-l-none border-l-0`}
        />
      </div>
      <span className="mt-0.5 block text-xs text-slate-500">
        Tối đa {soDep(toiDa)}
      </span>
    </div>
  );
}

export default function NguoiChoiDieuChinh({
  userId,
  tenNguoi,
  mua,
  diemHienTai,
  vonHienTai,
}: {
  userId: string;
  tenNguoi: string;
  /** Mùa hiện tại (nơi dòng điều chỉnh được ghi) */
  mua: { id: string; ten: string; tinhDiem: boolean; choiThu: boolean };
  /**
   * Điểm / vốn người này ĐANG có trong chính mùa hiện tại — `null` khi trang
   * đang xem mùa khác (số trên trang không phải của mùa sắp ghi vào, đưa ra
   * bản xem lại là nói sai). Có số thì chặn sớm trường hợp trừ quá tay; máy
   * chủ vẫn kiểm lại trong giao dịch.
   */
  diemHienTai: number | null;
  vonHienTai: Von | null;
}) {
  const router = useRouter();
  const [chuSo, setChuSo] = useState(trong);
  const [dau, setDau] = useState(cong);
  const [lyDo, setLyDo] = useState("");
  const [xacNhan, setXacNhan] = useState(false);
  const [kq, setKq] = useState<KetQuaNguoiChoi>({});
  const [dangGhi, startTransition] = useTransition();

  if (!mua.tinhDiem)
    return (
      <div className="card p-4">
        <h2 className="font-semibold text-navy-800">Điều chỉnh điểm, vốn</h2>
        <p className="mt-1 text-sm text-slate-500">
          {mua.ten} đã quá ngày kết thúc — sổ điểm đã chốt, không cộng trừ thêm
          được.
        </p>
      </div>
    );

  const so = (o: O) => dau[o] * Number(chuSo[o] || 0);
  const von = { CN: so("CN"), TT: so("TT"), XH: so("XH"), TS: so("TS") };
  const duLieu = { userId, muaId: mua.id, diem: so("diem"), von, lyDo };
  const kiemTra = kiemTraDieuChinh(duLieu);
  // Biết số đang có của đúng mùa này thì báo "trừ quá tay" ngay, khỏi bắt Ban
  // bấm qua bước xác nhận rồi mới bị máy chủ từ chối
  const coSoLieu = diemHienTai !== null && vonHienTai !== null;
  const loiAm =
    kiemTra.ok && coSoLieu
      ? loiTongAm({ diem: diemHienTai, von: vonHienTai }, kiemTra.data)
      : null;

  // Sửa bất kỳ ô nào thì quay về bước nhập để bản xem lại luôn đúng số mới
  const doi = (f: () => void) => {
    f();
    setXacNhan(false);
    setKq({});
  };

  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!kiemTra.ok) {
          setKq({ error: kiemTra.loi });
          return;
        }
        if (loiAm) {
          setKq({ error: loiAm });
          setXacNhan(false);
          return;
        }
        if (!xacNhan) {
          setKq({});
          setXacNhan(true);
          return;
        }
        startTransition(async () => {
          const r = await dieuChinhDiem(duLieu);
          setKq(r);
          setXacNhan(false);
          if (r.ok) {
            setChuSo(trong());
            setDau(cong());
            setLyDo("");
            router.refresh();
          }
        });
      }}
    >
      <div>
        <h2 className="font-semibold text-navy-800">Điều chỉnh điểm, vốn</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ghi thêm một dòng “Ban điều chỉnh” vào sổ điểm {mua.ten} — dùng khi
          sửa sai sót, bù lỗi hệ thống. Không xoá được dòng đã ghi; ghi nhầm thì
          ghi một dòng ngược lại.
        </p>
        {mua.choiThu && (
          <p className="mt-1 text-xs text-amber-800">
            Đang chơi thử: điều chỉnh chỉ vào điểm chơi thử, mở mùa giải là mọi
            người về 0.
          </p>
        )}
      </div>

      <OSoCoDau
        nhan="Điểm"
        dau={dau.diem}
        chuSo={chuSo.diem}
        toiDa={GIOI_HAN_DIEU_CHINH.diem[1]}
        onDoiDau={() =>
          doi(() => setDau((d) => ({ ...d, diem: -d.diem as 1 | -1 })))
        }
        onDoiSo={(s) => doi(() => setChuSo((c) => ({ ...c, diem: s })))}
      />
      <div className="grid grid-cols-2 gap-3">
        {MA_VON.map((k) => (
          <OSoCoDau
            key={k}
            nhan={VON[k].ten}
            dau={dau[k]}
            chuSo={chuSo[k]}
            toiDa={GIOI_HAN_DIEU_CHINH.von[1]}
            onDoiDau={() =>
              doi(() => setDau((d) => ({ ...d, [k]: -d[k] as 1 | -1 })))
            }
            onDoiSo={(s) => doi(() => setChuSo((c) => ({ ...c, [k]: s })))}
          />
        ))}
      </div>
      <OChu
        nhan="Lý do (bắt buộc)"
        giaTri={lyDo}
        onDoi={(s) => doi(() => setLyDo(s))}
        dai={GIOI_HAN_DIEU_CHINH.lyDoToiDa}
        nhieuDong={2}
        placeholder="Vd: Bù điểm trạm 2.3 bị lỗi mạng ngày 20/09"
        goiY={`Ít nhất ${GIOI_HAN_DIEU_CHINH.lyDoToiThieu} ký tự. Tên người làm được ghi kèm tự động.`}
      />

      {xacNhan && kiemTra.ok && (
        <div className="space-y-1 rounded-xl bg-amber-50 px-3 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <p>
            Sẽ ghi cho <b>{tenNguoi}</b> vào <b>{mua.ten}</b>:{" "}
            <b>{moTaThayDoi(kiemTra.data.diem, kiemTra.data.von)}</b>
          </p>
          {/* Chỉ so trước → sau khi số trên trang ĐÚNG là của mùa sắp ghi vào */}
          {diemHienTai !== null && kiemTra.data.diem !== 0 && (
            <p>
              Điểm mùa: {soDep(diemHienTai)} →{" "}
              <b>{soDep(diemHienTai + kiemTra.data.diem)}</b>
            </p>
          )}
          {vonHienTai !== null && MA_VON.some((k) => kiemTra.data.von[k]) && (
            <p>
              Vốn sau điều chỉnh:{" "}
              {MA_VON.filter((k) => kiemTra.data.von[k])
                .map(
                  (k) =>
                    `${VON[k].ngan} ${vonHienTai[k]} → ${vonHienTai[k] + kiemTra.data.von[k]}`,
                )
                .join(" · ")}
            </p>
          )}
          {!coSoLieu && (
            <p>
              Trang đang xem mùa khác nên chưa biết số hiện có của {mua.ten};
              máy chủ kiểm lại lúc ghi, trừ quá số đang có sẽ bị từ chối.
            </p>
          )}
          <p className="break-words">Lý do: “{kiemTra.data.lyDo}”</p>
        </div>
      )}

      {loiAm && !kq.error && (
        <p className="rounded-lg bg-do-50 px-3 py-2 text-sm text-do-700">
          {loiAm}
        </p>
      )}
      <ThongBao kq={kq} />

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={dangGhi || CAC_O.every((o) => !Number(chuSo[o] || 0))}
          className={xacNhan ? "btn-danger min-h-11" : "btn-primary min-h-11"}
        >
          {dangGhi
            ? "Đang ghi…"
            : xacNhan
              ? "Xác nhận ghi vào sổ điểm"
              : "Xem lại trước khi ghi"}
        </button>
        {xacNhan && (
          <button
            type="button"
            disabled={dangGhi}
            onClick={() => setXacNhan(false)}
            className="btn-ghost min-h-11"
          >
            Sửa lại
          </button>
        )}
      </div>
    </form>
  );
}
