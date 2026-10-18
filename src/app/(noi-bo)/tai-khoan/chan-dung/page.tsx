import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import {
  soChuDao,
  thanSoCua,
  canChiCua,
  conGiapCua,
  napAmCua,
  tinhCachCua,
  khiChatCua,
} from "@/lib/chan-dung";
import { prisma } from "@/lib/prisma";
import { FormNgaySinh } from "./Forms";

export const dynamic = "force-dynamic";

export default async function ChanDungTongQuan() {
  const user = await requireUserPage();

  const cd = user.memberId
    ? await prisma.chanDung.findUnique({ where: { memberId: user.memberId } })
    : null;

  if (!user.memberId) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="Chân dung doanh nhân" />
        <div className="card p-8 text-center text-sm leading-relaxed text-slate-600">
          Tài khoản này chưa gắn với hồ sơ hội viên nào nên chưa dùng được bộ
          công cụ. Anh/chị liên hệ Ban Hội viên để được gắn hồ sơ.
        </div>
      </div>
    );
  }

  const ngaySinh = cd?.birthDate ?? null;
  const nam = ngaySinh?.getFullYear() ?? 0;
  const thanSo = ngaySinh ? thanSoCua(ngaySinh) : null;
  const tc = cd?.tinhCach ? tinhCachCua(cd.tinhCach) : null;
  const kc = cd?.khiChat ? khiChatCua(cd.khiChat) : null;

  const the = [
    {
      href: "/tai-khoan/chan-dung/than-so-hoc",
      icon: "🔢",
      ten: "Thần số học",
      mo: "Số chủ đạo từ ngày sinh — năng lượng tự nhiên và phong cách kinh doanh của anh/chị.",
      ketQua:
        ngaySinh && thanSo ? `Số ${soChuDao(ngaySinh)} — ${thanSo.tieuDe}` : null,
      nut: ngaySinh ? "Xem kết quả" : "Nhập ngày sinh",
    },
    {
      href: "/tai-khoan/chan-dung/tu-vi",
      icon: "🏮",
      ten: "Tử vi tham khảo",
      mo: "Con giáp, mệnh ngũ hành và gợi ý dùng màu bản mệnh trong kinh doanh.",
      ketQua: ngaySinh
        ? `${conGiapCua(nam).emoji} ${canChiCua(nam)} · Mệnh ${napAmCua(nam).nguHanh}`
        : null,
      nut: ngaySinh ? "Xem kết quả" : "Nhập ngày sinh",
    },
    {
      href: "/tai-khoan/chan-dung/tinh-cach",
      icon: "🧭",
      ten: "Tính cách điều hành",
      mo: "12 câu · 4 nhóm Lửa – Gió – Đất – Nước, kèm cách làm việc với từng nhóm đối tác.",
      ketQua: tc ? `${tc.emoji} ${tc.ten}` : null,
      nut: tc ? "Xem kết quả" : "Làm bài (~3 phút)",
    },
    {
      href: "/tai-khoan/chan-dung/khi-chat",
      icon: "👑",
      ten: "Khí chất doanh nhân",
      mo: "Ưng · Hổ · Xà · Hồ · Long — phong cách lãnh đạo và vai trò phù hợp trong Chi hội.",
      ketQua: kc ? `${kc.emoji} ${kc.ten} — ${kc.danhHieu}` : null,
      nut: kc ? "Xem kết quả" : "Làm bài (~4 phút)",
    },
  ];

  const daLam = the.filter((t) => t.ketQua).length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Chân dung doanh nhân"
        subtitle={`Hiểu mình để dẫn dắt và hợp tác tốt hơn — đã khám phá ${daLam}/4 góc nhìn.`}
      />

      {!ngaySinh && (
        <div className="card mb-5 border-do-200 p-5">
          <p className="font-semibold text-navy-800">🎂 Bắt đầu bằng ngày sinh</p>
          <p className="mb-4 mt-1 text-sm leading-relaxed text-slate-600">
            Nhập một lần, dùng chung cho cả Thần số học và Tử vi. Thêm giờ sinh
            để lập được lá số 12 cung, thêm họ tên khai sinh để mở khoá bộ chỉ số
            theo tên.
          </p>
          <FormNgaySinh
            banDau={{
              ngaySinh: null,
              gioSinh: null,
              noiSinh: "",
              hoTen: "",
            }}
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {the.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`card flex flex-col p-5 transition hover:border-do-300 hover:shadow-md ${
              t.ketQua ? "border-do-200" : ""
            }`}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <span className="text-3xl">{t.icon}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${
                  t.ketQua
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
              >
                {t.ketQua ? "✓ Đã làm" : "Chưa làm"}
              </span>
            </div>
            <h3 className="font-bold text-navy-800">{t.ten}</h3>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{t.mo}</p>
            {t.ketQua && (
              <p className="mt-3 rounded-lg bg-navy-50 px-3 py-2 text-sm font-medium text-navy-800">
                {t.ketQua}
              </p>
            )}
            <p className="mt-auto pt-3 text-sm font-semibold text-do-600">
              {t.nut} →
            </p>
          </Link>
        ))}
      </div>

      <p className="px-4 py-8 text-center text-xs leading-relaxed text-slate-500">
        Thần số học và tử vi là góc nhìn tham khảo mang tính văn hóa, không phải
        cơ sở để ra quyết định kinh doanh. Giá trị thật nằm ở việc hiểu rõ mình
        và hiểu người mình hợp tác.
      </p>
    </div>
  );
}
