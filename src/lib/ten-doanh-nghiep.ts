/**
 * Danh sách hội viên nhập từ Google Sheet ghi tên doanh nghiệp VIẾT HOA TOÀN BỘ
 * ("CÔNG TY CỔ PHẦN BÁNH KẸO Á CHÂU"). Trên web đọc rất nặng mắt, nên chuyển về
 * dạng viết hoa đầu từ khi HIỂN THỊ — dữ liệu gốc trong CSDL giữ nguyên để còn
 * đối chiếu với sổ sách của Hội.
 */

/** Từ viết tắt phải giữ nguyên chữ hoa. */
const VIET_TAT = new Set([
  // Loại hình doanh nghiệp
  "TNHH", "MTV", "CP", "DNTN", "TMCP", "HTX", "VPĐD", "VPDD", "CN", "HĐQT",
  // Lĩnh vực hay gặp trong tên công ty
  "SX", "TM", "DV", "XD", "XNK", "TMDV", "SXTM", "TM-DV", "SX-TM", "KD",
  "TK", "TKTT", "QC", "CNTT", "BĐS", "VLXD", "VPP", "ĐT", "XL", "CĐT",
  // Địa danh / tổ chức
  "TP", "TPHCM", "HCM", "VN", "YBA", "ISO", "JSC", "LTD",
  // Thương hiệu viết tắt của hội viên — bổ sung dần khi gặp tên mới bị đổi sai
  "MISA", "BITA'S", "ABC", "PNJ", "TPBANK", "PSC", "HD", "HL", "CI", "ST",
  "DKH", "USA", "IT", "AI", "OEM", "ODM",
]);

/** Từ nối để chữ thường, trừ khi đứng đầu tên. */
const TU_NOI = new Set(["và", "của", "tại", "trên", "cho"]);

/**
 * Chuỗi KHÔNG CÓ NGUYÊN ÂM thì chắc chắn là viết tắt ("TNHH", "DKSH", "XD").
 * Đây là dấu hiệu đáng tin duy nhất — không dùng độ dài, vì hầu hết âm tiết
 * tiếng Việt cũng ngắn và không dấu ("TY", "CHI", "DUY" đều ≤ 3 chữ).
 */
function khongCoNguyenAm(w: string): boolean {
  return /^[A-ZĐ&'0-9-]+$/.test(w) && !/[AEIOUY]/.test(w);
}

function hoaDauTu(w: string): string {
  // Giữ dấu gạch nối và dấu chấm bên trong: "TM-DV", "Co.Ltd"
  return w
    .split(/([-.\/])/)
    .map((phan) => {
      if (/^[-.\/]$/.test(phan)) return phan;
      // Viết hoa CHỮ CÁI đầu tiên, bỏ qua dấu mở ngoặc / nháy đứng trước
      const i = phan.search(/\p{L}/u);
      if (i < 0) return phan;
      return (
        phan.slice(0, i) +
        phan.charAt(i).toLocaleUpperCase("vi") +
        phan.slice(i + 1).toLocaleLowerCase("vi")
      );
    })
    .join("");
}

/**
 * "CÔNG TY TNHH SX HÀNG TIÊU DÙNG BÌNH TÂN"
 *   → "Công ty TNHH SX Hàng Tiêu Dùng Bình Tân"
 *
 * Tên đã viết thường / viết hoa đầu từ sẵn thì trả lại nguyên vẹn.
 */
export function tenDoanhNghiep(raw: string): string {
  // Google Sheets có thể xuất chữ có dấu ở dạng tổ hợp (NFD) khiến so khớp chuỗi
  // như "Cổ Phần" trượt — đưa hết về NFC trước.
  const s = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!s) return s;

  // Chỉ can thiệp khi tên đang VIẾT HOA gần như toàn bộ
  const chuCai = s.replace(/[^\p{L}]/gu, "");
  if (!chuCai) return s;
  const tyLeHoa =
    [...chuCai].filter((c) => c === c.toLocaleUpperCase("vi")).length /
    chuCai.length;
  if (tyLeHoa < 0.85) return s;

  const tu = s.split(" ");
  const ket = tu.map((w, i) => {
    const thuan = w.replace(/[^\p{L}\p{N}Đđ-]/gu, "");
    if (VIET_TAT.has(thuan.toLocaleUpperCase("vi"))) return w;
    if (khongCoNguyenAm(thuan)) return w;
    const t = hoaDauTu(w);
    return i > 0 && TU_NOI.has(t.toLocaleLowerCase("vi"))
      ? t.toLocaleLowerCase("vi")
      : t;
  });

  // "Công Ty Cổ Phần" → "Công ty Cổ phần" cho đỡ rối mắt
  return ket
    .join(" ")
    .replace(/\bCông Ty\b/g, "Công ty")
    .replace(/\bCổ Phần\b/g, "Cổ phần")
    .replace(/\bTập Đoàn\b/gi, "Tập đoàn")
    .replace(/\bChi Nhánh\b/gi, "Chi nhánh")
    .replace(/\bDoanh Nghiệp\b/gi, "Doanh nghiệp")
    .replace(/\bTư Nhân\b/gi, "Tư nhân");
}
