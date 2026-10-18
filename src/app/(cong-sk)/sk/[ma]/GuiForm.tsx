"use client";

/** Gửi JSON tới API cổng, trả { ok, d } — dùng chung cho các form khách */
export async function guiCong(ma: string, duong: string, body: unknown) {
  try {
    const res = await fetch(`/api/sk/${ma}/${duong}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await res.json().catch(() => ({}));
    return { ok: res.ok, d: d as Record<string, unknown> & { error?: string } };
  } catch {
    return { ok: false, d: { error: "Mạng chập chờn — anh/chị bấm gửi lại giúp." } };
  }
}

export function CongDong({ ma }: { ma: string }) {
  return (
    <div className="space-y-3 text-sm text-slate-600">
      <p>Cổng này đang đóng. Anh/chị vui lòng liên hệ Ban tổ chức.</p>
      <a href={`/sk/${ma}`} className="text-navy-600 hover:underline">
        ← Về trang sự kiện
      </a>
    </div>
  );
}
