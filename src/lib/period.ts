/** Khoảng thời gian báo cáo, phân tích từ query string ?ky=...&tu=...&den=... */
export type Period = {
  key: string;
  label: string;
  from: Date;
  to: Date;
};

export const PERIOD_OPTIONS = [
  { key: "thang-nay", label: "Tháng này" },
  { key: "thang-truoc", label: "Tháng trước" },
  { key: "quy-nay", label: "Quý này" },
  { key: "nam-nay", label: "Năm nay" },
  { key: "tat-ca", label: "Tất cả" },
  { key: "tuy-chon", label: "Tuỳ chọn" },
] as const;

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

export function resolvePeriod(
  key: string | undefined,
  from?: string,
  to?: string
): Period {
  const now = new Date();
  const k = key || "nam-nay";

  // "nam-2025" — chọn đích danh một năm, dùng ở trang xúc tiến thương mại công khai
  const namCuThe = k.match(/^nam-(\d{4})$/);
  if (namCuThe) {
    const y = Number(namCuThe[1]);
    return {
      key: k,
      label: `Năm ${y}`,
      from: new Date(y, 0, 1),
      to: endOfDay(new Date(y, 11, 31)),
    };
  }

  switch (k) {
    case "thang-nay": {
      const f = new Date(now.getFullYear(), now.getMonth(), 1);
      const t = endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      return { key: k, label: `Tháng ${now.getMonth() + 1}/${now.getFullYear()}`, from: f, to: t };
    }
    case "thang-truoc": {
      const f = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const t = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));
      return { key: k, label: `Tháng ${f.getMonth() + 1}/${f.getFullYear()}`, from: f, to: t };
    }
    case "quy-nay": {
      const q = Math.floor(now.getMonth() / 3);
      const f = new Date(now.getFullYear(), q * 3, 1);
      const t = endOfDay(new Date(now.getFullYear(), q * 3 + 3, 0));
      return { key: k, label: `Quý ${q + 1}/${now.getFullYear()}`, from: f, to: t };
    }
    case "tat-ca": {
      return { key: k, label: "Tất cả thời gian", from: new Date(2000, 0, 1), to: endOfDay(now) };
    }
    case "tuy-chon": {
      const f = from ? startOfDay(new Date(from)) : new Date(now.getFullYear(), 0, 1);
      const t = to ? endOfDay(new Date(to)) : endOfDay(now);
      return { key: k, label: "Tuỳ chọn", from: f, to: t };
    }
    default: {
      const f = new Date(now.getFullYear(), 0, 1);
      const t = endOfDay(new Date(now.getFullYear(), 11, 31));
      return { key: "nam-nay", label: `Năm ${now.getFullYear()}`, from: f, to: t };
    }
  }
}
