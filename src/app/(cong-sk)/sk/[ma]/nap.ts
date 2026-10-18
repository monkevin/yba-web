import { cache } from "react";
import { notFound } from "next/navigation";
import { napCong } from "@/lib/trung-tam-sk/cong";

/** Khung và trang con cùng gọi trong một lượt dựng → chỉ một truy vấn */
export const napCongTrang = cache(async (ma: string) => {
  const c = await napCong(ma);
  if (!c) notFound();
  return c;
});
