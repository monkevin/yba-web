import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";

/**
 * Ô logo doanh nghiệp. Hội viên chưa tải logo lên thì dựng một huy hiệu chữ cái
 * có màu riêng theo tên — nhìn vẫn ra dáng thương hiệu, không để ô trống.
 *
 * Màu chọn theo tên nên cùng một doanh nghiệp luôn ra đúng một màu, ở mọi trang.
 */

const MAU = [
  "bg-navy-600",
  "bg-do-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-violet-600",
  "bg-sky-600",
  "bg-rose-600",
  "bg-teal-600",
  "bg-indigo-600",
  "bg-orange-600",
];

/** Bỏ phần loại hình để lấy đúng tên thương hiệu. */
function phanThuongHieu(ten: string): string {
  return ten
    .replace(
      /^(VPĐD|Chi nhánh|Công ty|Doanh nghiệp|Tập đoàn|Ngân hàng)\s*/i,
      ""
    )
    .replace(
      /^(TNHH|Cổ phần|CP|MTV|TMCP|Tư nhân|DNTN|SX|TM|DV|XD|XNK|và|-|–)\s*/gi,
      ""
    )
    .replace(
      /^(Thương mại|Dịch vụ|Sản xuất|Đầu tư|Xây dựng|Công nghệ|Kỹ thuật|Xuất nhập khẩu|Phát triển)\s*/gi,
      ""
    )
    .trim();
}

/** Lấy 2 chữ cái đầu của hai từ đầu tiên trong tên thương hiệu. */
function chuCai(ten: string): string {
  const tu = phanThuongHieu(ten).split(/\s+/).filter(Boolean);
  if (!tu.length) return ten.charAt(0).toLocaleUpperCase("vi");
  if (tu.length === 1) return tu[0].slice(0, 2).toLocaleUpperCase("vi");
  return (tu[0].charAt(0) + tu[1].charAt(0)).toLocaleUpperCase("vi");
}

function chonMau(ten: string): string {
  let n = 0;
  for (let i = 0; i < ten.length; i++) n = (n * 31 + ten.charCodeAt(i)) % 100000;
  return MAU[n % MAU.length];
}

export default function LogoDoanhNghiep({
  company,
  logo,
  size = "md",
  className = "",
}: {
  company: string;
  logo?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ten = tenDoanhNghiep(company);

  const khung = {
    sm: "h-12 w-12 rounded-lg text-sm",
    md: "h-14 w-14 rounded-xl text-base",
    lg: "h-24 w-24 rounded-2xl text-2xl sm:h-28 sm:w-28 sm:text-3xl",
  }[size];

  if (logo) {
    return (
      <span
        className={`grid shrink-0 place-items-center overflow-hidden bg-white ring-1 ring-navy-100 ${khung} ${className}`}
      >
        {/* Logo hội viên tải lên, kích thước không đoán trước được */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          alt={`Logo ${ten}`}
          className="h-full w-full object-contain p-1.5"
        />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      title={ten}
      className={`grid shrink-0 place-items-center font-extrabold tracking-tight text-white ${chonMau(ten)} ${khung} ${className}`}
    >
      {chuCai(ten)}
    </span>
  );
}
