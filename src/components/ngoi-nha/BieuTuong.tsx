/**
 * Bộ biểu tượng nét cho game Ngôi nhà Chợ Lớn — vẽ tay bằng SVG, không dùng
 * emoji (emoji mỗi máy một kiểu, trông rẻ tiền trên giao diện Hội).
 */
type Ten =
  | "sao"
  | "khoa"
  | "lua"
  | "dong-ho"
  | "cup"
  | "nguoi"
  | "qua"
  | "nha"
  | "dung"
  | "sai"
  | "choi"
  | "loa"
  | "loa-tat"
  | "tia"
  | "cat"
  | "the"
  | "tay"
  | "lich"
  | "mui-ten"
  | "quay-lai"
  | "lam-lai"
  | "banh"
  | "khien"
  | "sach";

export default function BieuTuong({
  ten,
  className = "h-5 w-5",
  dac = false,
}: {
  ten: Ten;
  className?: string;
  /** Tô đặc thay vì chỉ vẽ nét */
  dac?: boolean;
}) {
  const net = {
    fill: dac ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...net}>
      {ten === "sao" && <path d="M12 2.8l2.8 5.7 6.3.9-4.6 4.4 1.1 6.3L12 17.1l-5.6 3 1.1-6.3L2.9 9.4l6.3-.9z" />}
      {ten === "khoa" && (
        <>
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
        </>
      )}
      {ten === "lua" && (
        <path d="M12 21.5c-4 0-6.8-2.7-6.8-6.4 0-3.3 2.3-5.3 3.6-7.3.4 1.8 1.3 3 2.4 3.4.2-3.1 1.5-5.6 3.9-8.2.3 3 1.5 4.8 2.9 6.6 1.1 1.4 1.8 3.2 1.8 5.3 0 3.9-3.2 6.6-7.8 6.6z" />
      )}
      {ten === "dong-ho" && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </>
      )}
      {ten === "cup" && (
        <>
          <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
          <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v3M8 21h8M9.5 17h5" />
        </>
      )}
      {ten === "nguoi" && (
        <>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 20c.6-3.4 3-5.3 6-5.3s5.4 1.9 6 5.3" />
          <path d="M16 5.2a3 3 0 0 1 0 5.6M18 14.9c1.6.7 2.7 2.4 3 5.1" />
        </>
      )}
      {ten === "qua" && (
        <>
          <rect x="3.5" y="8" width="17" height="4" rx="1" />
          <path d="M5 12v8.5h14V12M12 8v12.5" />
          <path d="M12 8c-1.5-3.5-5.5-4-5.5-1.5S10 8 12 8zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 8 12 8z" />
        </>
      )}
      {ten === "nha" && (
        <>
          <path d="M3 11l9-7 9 7" />
          <path d="M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" />
        </>
      )}
      {ten === "dung" && <path d="M4.5 12.5l5 5 10-11" />}
      {ten === "sai" && <path d="M6 6l12 12M18 6L6 18" />}
      {ten === "choi" && <path d="M8 5.5v13l10-6.5z" />}
      {ten === "loa" && (
        <>
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
          <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      )}
      {ten === "loa-tat" && (
        <>
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" />
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        </>
      )}
      {ten === "tia" && <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />}
      {ten === "cat" && (
        <>
          <path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" />
        </>
      )}
      {ten === "the" && (
        <>
          <rect x="4" y="3" width="16" height="18" rx="2.5" />
          <path d="M12 8.5l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4z" />
        </>
      )}
      {ten === "tay" && (
        <path d="M3 12.5l4.5-4 4 2.5 3-2 6 5.5-3 3.5-3-2-2.5 2.5-3.5-3.5-3 2.5zM11.5 11l-3 3" />
      )}
      {ten === "lich" && (
        <>
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      )}
      {ten === "mui-ten" && <path d="M5 12h14M13 6l6 6-6 6" />}
      {ten === "quay-lai" && <path d="M19 12H5M11 6l-6 6 6 6" />}
      {ten === "lam-lai" && (
        <>
          <path d="M4 12a8 8 0 1 0 2.4-5.7" />
          <path d="M4 4v4.5h4.5" />
        </>
      )}
      {ten === "banh" && (
        <>
          <path d="M4 20.5h16M5 20.5V13h14v7.5M8 13v-2.5M12 13v-2.5M16 13v-2.5" />
          <path d="M8 7.5c0-1 .8-1.5.8-2.5M12 7.5c0-1 .8-1.5.8-2.5M16 7.5c0-1 .8-1.5.8-2.5" />
        </>
      )}
      {ten === "khien" && <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z" />}
      {ten === "sach" && (
        <>
          <path d="M4 5.5c2.7-1.3 5.3-1.3 8 0v14c-2.7-1.3-5.3-1.3-8 0z" />
          <path d="M12 5.5c2.7-1.3 5.3-1.3 8 0v14c-2.7-1.3-5.3-1.3-8 0z" />
        </>
      )}
    </svg>
  );
}
