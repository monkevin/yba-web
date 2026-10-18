"use client";

import { useState } from "react";

/**
 * Thẻ video: hiện ảnh đại diện lấy từ YouTube, chỉ nạp trình phát khi người xem
 * bấm vào. Nhúng sẵn cả chục iframe YouTube sẽ làm trang nặng và chậm hẳn.
 */
export default function VideoNhung({
  youtubeId,
  title,
  lon = false,
}: {
  youtubeId: string;
  title: string;
  /** Khối lớn ở đầu trang / trang chủ */
  lon?: boolean;
}) {
  const [phat, datPhat] = useState(false);

  if (phat) {
    return (
      <div className="ratio-16-9 w-full overflow-hidden rounded-xl bg-navy-900">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => datPhat(true)}
      className="group relative block w-full overflow-hidden rounded-xl bg-navy-900 ring-1 ring-navy-100"
      aria-label={`Phát video: ${title}`}
    >
      {/* Ảnh đại diện do YouTube phát hành */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt={title}
        loading="lazy"
        className="ratio-16-9 w-full object-cover transition duration-300 group-hover:scale-105 group-hover:opacity-90"
      />
      <span
        className={`absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-do-600/90 text-white shadow-lg transition group-hover:scale-110 group-hover:bg-do-600 ${
          lon ? "h-20 w-20 text-3xl" : "h-14 w-14 text-xl"
        }`}
      >
        ▶
      </span>
    </button>
  );
}
