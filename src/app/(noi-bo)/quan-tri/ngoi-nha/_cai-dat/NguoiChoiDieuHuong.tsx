"use client";

/**
 * Ô tìm và liên kết trong tab "Người chơi". Đọc `?mua=` ngay trên trình duyệt
 * để giữ mùa đang xem ở các tab khác (trang cha không truyền xuống props).
 * Ô tìm là form GET thường (`next/form` với đường dẫn chuỗi) — không phải
 * server action nên React không tự xoá chữ đã gõ.
 */
import Form from "next/form";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { INP } from "./truong";

const GOC = "/quan-tri/ngoi-nha";

function duongDan(mua: string, q: string) {
  const sp = new URLSearchParams({ tab: "nguoi-choi" });
  if (mua) sp.set("mua", mua);
  if (q) sp.set("q", q);
  return `${GOC}?${sp.toString()}`;
}

export function TimNguoiChoi({ q }: { q: string }) {
  const mua = useSearchParams().get("mua") ?? "";
  return (
    <Form action={GOC} className="flex gap-2" role="search">
      <input type="hidden" name="tab" value="nguoi-choi" />
      {mua && <input type="hidden" name="mua" value={mua} />}
      <label htmlFor="tim-nguoi-choi" className="sr-only">
        Tìm người chơi
      </label>
      <input
        id="tim-nguoi-choi"
        key={q}
        name="q"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        defaultValue={q}
        maxLength={100}
        placeholder="Tên, doanh nghiệp, tên đăng nhập, mã HV, SĐT"
        className={`${INP} min-h-11`}
      />
      <button type="submit" className="btn-primary min-h-11 shrink-0">
        Tìm
      </button>
    </Form>
  );
}

/** Liên kết trong tab: `q = "id:<userId>"` mở trang chi tiết, `""` về danh sách. */
export function LienKetNguoiChoi({
  q,
  className,
  children,
}: {
  q: string;
  className?: string;
  children: ReactNode;
}) {
  const mua = useSearchParams().get("mua") ?? "";
  return (
    <Link href={duongDan(mua, q)} className={className}>
      {children}
    </Link>
  );
}
