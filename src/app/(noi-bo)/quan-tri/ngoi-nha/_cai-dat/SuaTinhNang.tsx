"use client";

import type { DuLieuMuc } from "@/lib/ngoi-nha/cai-dat";
import {
  MO_TA_TINH_NANG,
  type TinhNang,
} from "@/lib/ngoi-nha/cai-dat/tinh-nang";
import type { ThongSoGame } from "@/lib/ngoi-nha/moc-qua";
import KhungCaiDat from "./KhungCaiDat";
import { OBat, OChu } from "./truong";

type KhoaBat = Exclude<keyof TinhNang, "thongBaoTamDung">;

/** Một dòng giải thích ngắn cho từng nhóm công tắc. */
const MO_TA_NHOM: Record<string, string> = {
  Chung: "Những gì người mới nhìn thấy khi vào game.",
  "Hằng ngày": "Lý do để hội viên quay lại mỗi ngày.",
  "Hành trình": "Trong màn chơi 22 trạm: trợ giúp, câu thưởng, Thẻ Cơ hội.",
  "So tài": "Thi đấu giữa các hội viên.",
  "Ngoài đời": "Việc thật ngoài đời được ghi nhận vào game.",
  "Bảng xếp hạng": "Các tab và nút trên trang Xếp hạng.",
};

/** Nhóm công tắc theo thứ tự khai trong MO_TA_TINH_NANG (bỏ "Tạm dừng" — có khung riêng). */
function nhomCongTac(): { nhom: string; khoa: KhoaBat[] }[] {
  const kq: { nhom: string; khoa: KhoaBat[] }[] = [];
  for (const k of Object.keys(MO_TA_TINH_NANG) as KhoaBat[]) {
    if (k === "tamDung") continue;
    const ten = MO_TA_TINH_NANG[k].nhom;
    let n = kq.find((x) => x.nhom === ten);
    if (!n) kq.push((n = { nhom: ten, khoa: [] }));
    n.khoa.push(k);
  }
  return kq;
}

/** Bật / tắt từng tính năng game (và công tắc chính câu thưởng ở nn.thongSo). */
export default function SuaTinhNang({
  tinhNang,
  thongSo,
}: {
  tinhNang: DuLieuMuc<TinhNang>;
  thongSo: DuLieuMuc<ThongSoGame>;
}) {
  const tn = tinhNang.giaTri;
  const dangTat = (Object.keys(MO_TA_TINH_NANG) as KhoaBat[]).filter(
    (k) => k !== "tamDung" && !tn[k],
  );
  const cacNhom = nhomCongTac();

  return (
    <div className="max-w-3xl space-y-4">
      {tn.tamDung ? (
        <div className="rounded-xl bg-do-50 px-4 py-3 text-sm text-do-800 ring-1 ring-do-200">
          <b>Game đang TẠM DỪNG.</b> Hội viên chỉ thấy thông báo bảo trì; người
          có quyền vận hành / cài đặt game vẫn vào chơi thử được.
        </div>
      ) : (
        <div className="card px-4 py-3 text-sm text-slate-600">
          {dangTat.length || !thongSo.giaTri.cauThuong ? (
            <>
              <b className="text-navy-800">Đang tắt:</b>{" "}
              {[
                ...(!thongSo.giaTri.cauThuong ? ["Câu thưởng cuối lượt"] : []),
                ...dangTat.map((k) => MO_TA_TINH_NANG[k].ten),
              ].join(" · ")}
            </>
          ) : (
            "Mọi tính năng đang bật."
          )}{" "}
          Tắt một tính năng là máy chủ chặn luôn, không chỉ ẩn nút; trận hoặc
          lượt đang dở vẫn được chơi nốt.
        </div>
      )}

      <KhungCaiDat
        muc="tinhNang"
        nhom={["tamDung", "thongBaoTamDung"]}
        giaTri={tinhNang.giaTri}
        macDinh={tinhNang.macDinh}
        tieuDe="Tạm dừng game"
        moTa="Dùng khi cần bảo trì, sửa nội dung gấp hoặc chưa muốn mở cho hội viên."
      >
        {(v, sua) => (
          <div className="space-y-3">
            <OBat
              nhan={MO_TA_TINH_NANG.tamDung.ten}
              moTa={MO_TA_TINH_NANG.tamDung.tat}
              giaTri={v.tamDung}
              nguyHiem
              onDoi={(b) => sua((x) => ({ ...x, tamDung: b }))}
            />
            <OChu
              nhan="Thông báo hội viên thấy khi game tạm dừng"
              giaTri={v.thongBaoTamDung}
              dai={300}
              nhieuDong={3}
              onDoi={(s) => sua((x) => ({ ...x, thongBaoTamDung: s }))}
              goiY="Để trống thì dùng câu mặc định."
            />
            {v.tamDung && !tn.tamDung && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Bấm Lưu là mọi hội viên đang chơi bị dừng ngay ở thao tác kế
                tiếp. Nhớ tắt công tắc này khi xong việc.
              </p>
            )}
          </div>
        )}
      </KhungCaiDat>

      {cacNhom.map(({ nhom, khoa }) => (
        <div key={nhom} className="space-y-4">
          {nhom === "Hành trình" && (
            <KhungCaiDat
              muc="thongSo"
              nhom={["cauThuong"]}
              giaTri={thongSo.giaTri}
              macDinh={thongSo.macDinh}
              tieuDe="Câu thưởng cuối lượt — công tắc chính"
              moTa="Sau 10 câu chính có thêm 1 câu thưởng (về hội viên thật hoặc chia sẻ về mình). Điểm và giây của câu thưởng chỉnh ở tab Luật chơi & điểm."
            >
              {(v, sua) => (
                <OBat
                  nhan="Câu thưởng cuối lượt"
                  moTa="Tắt thì không lượt nào có câu thưởng, bất kể hai công tắc con bên dưới."
                  giaTri={v.cauThuong}
                  onDoi={(b) => sua((x) => ({ ...x, cauThuong: b }))}
                />
              )}
            </KhungCaiDat>
          )}
          <KhungCaiDat
            muc="tinhNang"
            nhom={khoa}
            giaTri={tinhNang.giaTri}
            macDinh={tinhNang.macDinh}
            tieuDe={nhom}
            moTa={MO_TA_NHOM[nhom]}
          >
            {(v, sua) => (
              <div className="space-y-2">
                {khoa.map((k) => (
                  <OBat
                    key={k}
                    nhan={MO_TA_TINH_NANG[k].ten}
                    moTa={
                      (k === "cauThuongHoiVien" || k === "cauThuongChiaSe") &&
                      !thongSo.giaTri.cauThuong ? (
                        <>
                          {MO_TA_TINH_NANG[k].tat}{" "}
                          <b className="text-amber-700">
                            Công tắc chính câu thưởng đang tắt nên công tắc này
                            chưa có tác dụng.
                          </b>
                        </>
                      ) : k === "dauTri" ? (
                        <>
                          {MO_TA_TINH_NANG[k].tat} Phiên Đấu trí vẫn tạo ở tab
                          “Đấu trí &amp; Đấu trường”.
                        </>
                      ) : (
                        MO_TA_TINH_NANG[k].tat
                      )
                    }
                    giaTri={v[k]}
                    onDoi={(b) => sua((x) => ({ ...x, [k]: b }))}
                  />
                ))}
              </div>
            )}
          </KhungCaiDat>
        </div>
      ))}
    </div>
  );
}
