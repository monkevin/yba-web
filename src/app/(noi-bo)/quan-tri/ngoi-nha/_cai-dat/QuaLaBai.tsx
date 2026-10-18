import { nguoiTrungQuaLaBai } from "@/lib/ngoi-nha/la-bai";
import { ngayLaDep } from "@/lib/ngoi-nha/la-bai-luat";
import { NutTraoQua } from "../NgoiNhaActions";

/**
 * Người trúng quà Lá bài mỗi ngày trong mùa đang xem + nút "Ghi đã trao"
 * (`NnTraoQua.loai = maTraoQuaLaBai(ngay)`, vd LB_20260916 — mỗi người mỗi ngày
 * tối đa một lá nên không trùng).
 */
export default async function QuaLaBai({ muaId }: { muaId: string }) {
  const ds = await nguoiTrungQuaLaBai(muaId);
  const chuaTrao = ds.filter((x) => !x.daTrao).length;

  if (!ds.length)
    return (
      <div className="card px-4 py-3 text-sm text-slate-500">
        <b className="font-semibold text-navy-800">Quà Lá bài mỗi ngày:</b> chưa
        có ai trúng trong mùa này.
      </div>
    );

  return (
    <div className="card p-4">
      <h2 className="font-semibold text-navy-800">
        Quà Lá bài mỗi ngày ({ds.length})
      </h2>
      <p className="text-xs text-slate-500">
        {chuaTrao > 0 ? `${chuaTrao} phần quà chưa trao · ` : ""}Liên hệ hội
        viên, trao tại Văn phòng Chi hội rồi bấm “Ghi đã trao” để người chơi
        thấy trạng thái.
      </p>
      <ul className="mt-2 divide-y divide-slate-100">
        {ds.map((x) => (
          <li
            key={`${x.userId}:${x.ngay}`}
            className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-navy-800">
                {x.ten}
                {x.nhaDongHanh && (
                  <span className="font-normal text-slate-500">
                    {" "}
                    · {x.nhaDongHanh}
                  </span>
                )}
              </span>
              <span className="block text-slate-700">
                {x.hoTen}
                {x.doanhNghiep ? ` – ${x.doanhNghiep}` : ""}
                {x.soDienThoai && (
                  <>
                    {" · "}
                    <a
                      href={`tel:${x.soDienThoai}`}
                      className="text-navy-600 underline"
                    >
                      {x.soDienThoai}
                    </a>
                  </>
                )}
              </span>
              <span className="block text-xs text-slate-500">
                Trúng ngày {ngayLaDep(x.ngay)}
              </span>
            </span>
            <NutTraoQua
              userId={x.userId}
              muaId={x.muaId}
              loai={x.maTrao}
              daTrao={x.daTrao}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
