import Link from "next/link";

/**
 * Chọn kỳ xem số liệu trên trang công khai. Dùng Link (không phải nút JS) để
 * đường dẫn chia sẻ được và máy tìm kiếm đọc được từng kỳ.
 */
export default function KyChon({
  duongDan,
  kyHienTai,
  cacNam,
}: {
  duongDan: string;
  kyHienTai: string;
  cacNam: number[];
}) {
  const CO_DINH = [
    { key: "thang-nay", label: "Tháng này" },
    { key: "quy-nay", label: "Quý này" },
    { key: "nam-nay", label: "Năm nay" },
    { key: "tat-ca", label: "Từ trước tới nay" },
  ];

  const the = (key: string, label: string) => (
    <Link
      key={key}
      href={key === "nam-nay" ? duongDan : `${duongDan}?ky=${key}`}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        kyHienTai === key
          ? "bg-navy-600 text-white"
          : "bg-navy-50 text-navy-700 hover:bg-navy-100"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {CO_DINH.map((k) => the(k.key, k.label))}
      {cacNam.map((n) => the(`nam-${n}`, `Năm ${n}`))}
    </div>
  );
}
