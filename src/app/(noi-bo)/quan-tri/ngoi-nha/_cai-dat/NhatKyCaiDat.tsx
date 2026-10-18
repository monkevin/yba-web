import { docNhatKy } from "@/lib/ngoi-nha/nhat-ky";
import { ngayGioDep } from "@/lib/ngoi-nha/thoi-gian";

const TEN_HANH_DONG: Record<string, string> = {
  "nn.caiDat": "Sửa cài đặt",
  "nn.veGoc": "Đưa về bản gốc",
  "nn.mua": "Mùa giải",
  "nn.qua": "Quà",
  "nn.nguoiChoi": "Người chơi",
  "nn.dauTruong": "Đấu trường",
  "nn.dauTri": "Đấu trí",
  "nn.nhiemVu": "Nhiệm vụ",
  "nn.laBai": "Lá bài",
  "nn.huongDan": "Hướng dẫn",
};

/** 20 thao tác quản trị game gần nhất — ai đổi gì, lúc nào. */
export default async function NhatKyCaiDat() {
  const ds = await docNhatKy(20);
  return (
    <div className="card p-4">
      <h2 className="font-semibold text-navy-800">Nhật ký quản trị gần đây</h2>
      {ds.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">
          Chưa có thao tác nào được ghi.
        </p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100 text-sm">
          {ds.map((d) => {
            const goc = d.hanhDong.split(":")[0];
            // Chỉ hiện tên mục do chính thao tác ghi. KHÔNG lấy phần sau dấu
            // ":" làm tên mục: đó là mã kỹ thuật ("dong", "trao", "nn.luat")
            // và mọi thao tác đều đã ghi `moTa` tiếng Việt.
            const muc = typeof d.chiTiet.muc === "string" ? d.chiTiet.muc : "";
            const moTa =
              typeof d.chiTiet.moTa === "string" ? d.chiTiet.moTa : "";
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 py-2"
              >
                <span className="min-w-0">
                  <b className="text-navy-800">{d.nguoi}</b>{" "}
                  <span className="text-slate-600">
                    {TEN_HANH_DONG[goc] ?? goc}
                    {muc ? ` · ${muc}` : ""}
                    {moTa ? ` · ${moTa}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-slate-400">
                  {ngayGioDep(d.luc)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
