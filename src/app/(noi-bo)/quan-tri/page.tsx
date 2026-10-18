import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { requireUserPage } from "@/lib/auth";
import { DEAL_STATUS } from "@/lib/deal";
import { prisma } from "@/lib/prisma";
import { QUYEN, co, type MaQuyen } from "@/lib/quyen";

const NAM_NAY = new Date().getFullYear();

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [sp, user] = await Promise.all([searchParams, requireUserPage()]);

  const [
    hoiVien,
    taiKhoan,
    nhom,
    choDuyetGiaoDich,
    noHoiPhi,
    choDuyetHoSo,
    tinDangHien,
    tinChoDuyet,
    kyCongBo,
    soBaiViet,
    soSuKien,
    soVideo,
    hoSoMoi,
    tinNhanMoi,
    khachTest,
    khachMoi,
    henMoi,
    thamChoDuyet,
    thamTong,
    taiTroMoi,
    soLich,
    bangTinChoDuyet,
    bangTinDangHien,
    uuDaiChoDuyet,
    uuDaiDangHien,
    nhiemVuChoDuyet,
  ] = await Promise.all([
    prisma.member.count({ where: { active: true } }),
    prisma.user.count({ where: { active: true } }),
    prisma.chapter.count(),
    prisma.deal.count({ where: { status: DEAL_STATUS.CHO_DUYET } }),
    prisma.member.count({
      where: { active: true, feeExempt: false, feePayments: { none: { year: NAM_NAY } } },
    }),
    prisma.member.count({ where: { active: true, profileStatus: "CHO_DUYET" } }),
    prisma.listing.count({ where: { status: "DANG_HIEN" } }),
    prisma.listing.count({ where: { status: "CHO_DUYET" } }),
    prisma.awardPeriod.count({ where: { published: true } }),
    prisma.post.count(),
    prisma.event.count(),
    prisma.video.count(),
    prisma.membershipApplication.count({ where: { status: "MOI" } }),
    prisma.contactMessage.count({ where: { handled: false } }),
    prisma.khachTest.count(),
    prisma.khachTest.count({ where: { daXuLy: false } }),
    prisma.lichHen.count({ where: { status: "MOI" } }),
    prisma.thamDoanhNghiep.count({ where: { status: "DE_XUAT" } }),
    prisma.thamDoanhNghiep.count(),
    prisma.dangKyTaiTro.count({ where: { status: "MOI" } }),
    prisma.lichHoatDong.count({
      where: { published: true, tuNgay: { gte: new Date(NAM_NAY, 0, 1) } },
    }),
    prisma.bangTin.count({ where: { status: "CHO_DUYET" } }),
    prisma.bangTin.count({ where: { status: "DANG_HIEN" } }),
    prisma.uuDai.count({ where: { status: "CHO_DUYET" } }),
    prisma.uuDai.count({ where: { status: "DANG_HIEN" } }),
    prisma.nnNhiemVu.count({ where: { trangThai: "CHO_XAC_NHAN", cach: "BAN_DUYET" } }),
  ]);

  // Khách mời Lễ chuyển giao 10/10 (thư mời riêng + check-in + xếp bàn)
  const [km1010Tong, km1010XacNhan, km1010Checkin] = await Promise.all([
    prisma.khachMoi1010.count(),
    prisma.khachMoi1010.count({ where: { trangThai: "XAC_NHAN" } }),
    prisma.khachMoi1010.count({ where: { checkinLuc: { not: null } } }),
  ]);

  /**
   * Mỗi ô kèm quyền cần có — không đủ quyền thì ô đó không hiện.
   * SẮP THEO NHÓM CÓ TIÊU ĐỀ + đánh SỐ CỐ ĐỊNH 01–23 (Chủ tịch chốt
   * 25/09: "ai hỏi tab nào đọc số cho tìm lẹ"). Số đánh theo vị trí
   * TRƯỚC khi lọc quyền — mọi người cùng gọi một số dù thấy ít ô hơn.
   * Ô `noiBat` (sự kiện ĐANG DIỄN RA) được tô nổi và đứng đầu nhóm.
   * Thêm ô mới: chèn vào đúng nhóm, số phía sau tự trôi.
   */
  type O = {
    href: string;
    title: string;
    desc: string;
    quyen: MaQuyen;
    /** Quyền thay thế: có quyền này cũng thấy ô */
    hoacQuyen?: MaQuyen;
    gap?: number;
    /** Sự kiện đang diễn ra — tô vàng nổi bật */
    noiBat?: boolean;
  };
  const oPhang: (O | string)[] = [
    "Hội viên",
    {
      href: "/quan-tri/hoi-vien",
      title: "Hội viên",
      desc: `${hoiVien} hội viên đang hoạt động`,
      quyen: QUYEN.HOI_VIEN_SUA,
    },
    {
      href: "/quan-tri/ho-so",
      title: "Duyệt hồ sơ doanh nghiệp",
      desc: choDuyetHoSo
        ? `${choDuyetHoSo} hồ sơ hội viên vừa sửa, đang chờ duyệt`
        : "Không có hồ sơ nào chờ duyệt",
      quyen: QUYEN.HO_SO_DUYET,
      gap: choDuyetHoSo,
    },
    {
      href: "/quan-tri/hoi-phi",
      title: "Hội phí",
      desc: noHoiPhi
        ? `${noHoiPhi} hội viên còn nợ hội phí ${NAM_NAY}`
        : `Đã thu đủ hội phí ${NAM_NAY}`,
      quyen: QUYEN.HOI_PHI_QUAN_LY,
    },
    {
      href: "/quan-tri/vinh-danh",
      title: "Vinh danh hội viên",
      desc: kyCongBo ? `${kyCongBo} kỳ đang công bố trên web` : "Chưa công bố kỳ nào",
      quyen: QUYEN.VINH_DANH_QUAN_LY,
    },
    "Kinh doanh – Xúc tiến thương mại",
    {
      href: `/giao-dich?tt=${DEAL_STATUS.CHO_DUYET}&ky=tat-ca`,
      title: "Giao dịch chờ duyệt",
      desc: choDuyetGiaoDich
        ? `${choDuyetGiaoDich} đơn đang chờ duyệt`
        : "Không có đơn nào chờ",
      quyen: QUYEN.GIAO_DICH_DUYET,
      gap: choDuyetGiaoDich,
    },
    {
      href: "/quan-tri/tin-dang",
      title: "Chợ nhu cầu mua – bán",
      desc: tinChoDuyet
        ? `${tinChoDuyet} tin chờ duyệt · ${tinDangHien} tin đang hiển thị`
        : `${tinDangHien} tin đang hiển thị trên chợ`,
      quyen: QUYEN.TIN_DANG_DUYET,
      gap: tinChoDuyet,
    },
    {
      href: "/quan-tri/uu-dai",
      title: "Ưu đãi hội viên",
      desc: uuDaiChoDuyet
        ? `${uuDaiChoDuyet} ưu đãi chờ duyệt · ${uuDaiDangHien} đang hiển thị`
        : `${uuDaiDangHien} ưu đãi đang dành cho hội viên`,
      quyen: QUYEN.TIN_DANG_DUYET,
      gap: uuDaiChoDuyet,
    },
    "Sự kiện",
    {
      href: "/quan-tri/su-kien-1010",
      title: "Trung tâm sự kiện 10/10",
      desc: km1010Tong
        ? `${km1010XacNhan}/${km1010Tong} khách đã xác nhận · ${km1010Checkin} đã check-in`
        : "Chưa nhập danh sách khách mời",
      quyen: QUYEN.SU_KIEN_QUAN_LY,
      noiBat: true,
    },
    {
      href: "/quan-tri/noi-dung/su-kien",
      title: "Sự kiện & chương trình",
      desc: `${soSuKien} sự kiện đã lưu — xem các sự kiện đã qua & sắp tới`,
      quyen: QUYEN.SU_KIEN_QUAN_LY,
    },
    {
      href: "/quan-tri/lich-hoat-dong",
      title: "Lịch hoạt động sắp tới",
      desc: soLich
        ? `${soLich} hoạt động đang hiện trên trang chủ`
        : "Chưa công bố hoạt động nào",
      quyen: QUYEN.SU_KIEN_QUAN_LY,
    },
    {
      href: "/quan-tri/lich-hen",
      title: "Đặt lịch gặp Ban Chủ nhiệm",
      desc: henMoi
        ? `${henMoi} đề nghị gặp chưa xử lý`
        : "Không có đề nghị gặp mới",
      quyen: QUYEN.BIEU_MAU_XU_LY,
      gap: henMoi,
    },
    {
      href: "/quan-tri/tham-doanh-nghiep",
      title: "Đi thăm doanh nghiệp hội viên",
      desc: thamChoDuyet
        ? `${thamChoDuyet} lời mời chờ duyệt`
        : `${thamTong} chuyến đã lưu`,
      quyen: QUYEN.SU_KIEN_QUAN_LY,
      gap: thamChoDuyet,
    },
    {
      href: "/quan-tri/tai-tro",
      title: "Tài trợ & đồng hành",
      desc: taiTroMoi
        ? `${taiTroMoi} đăng ký tài trợ chưa xử lý`
        : "Quản lý chương trình và gói tài trợ",
      quyen: QUYEN.TRANG_TINH_SUA,
      gap: taiTroMoi,
    },
    "Nội dung website",
    {
      href: "/quan-tri/noi-dung/tin-tuc",
      title: "Tin tức & bản tin",
      desc: soBaiViet ? `${soBaiViet} bài viết` : "Chưa có bài viết nào",
      quyen: QUYEN.NOI_DUNG_VIET,
    },
    {
      href: "/quan-tri/bang-tin",
      title: "Bảng tin Chi hội",
      desc: bangTinChoDuyet
        ? `${bangTinChoDuyet} tin chờ duyệt · ${bangTinDangHien} tin đang hiển thị`
        : `${bangTinDangHien} tin hội viên đang chia sẻ`,
      quyen: QUYEN.TIN_DANG_DUYET,
      gap: bangTinChoDuyet,
    },
    {
      href: "/quan-tri/noi-dung/video",
      title: "Video Chi hội",
      desc: soVideo ? `${soVideo} video từ kênh YouTube` : "Chưa có video nào",
      quyen: QUYEN.NOI_DUNG_VIET,
    },
    {
      href: "/quan-tri/trang",
      title: "Trang giới thiệu & Ban Chủ nhiệm",
      desc: "Sửa nội dung các trang cố định trên website",
      quyen: QUYEN.TRANG_TINH_SUA,
    },
    {
      href: "/quan-tri/giao-dien",
      title: "Giao diện website",
      desc: "Banner trang chủ, màu chủ đạo, thông tin liên hệ",
      quyen: QUYEN.GIAO_DIEN_SUA,
    },
    "Hồ sơ gửi về từ website",
    {
      href: "/quan-tri/noi-dung/dang-ky",
      title: "Hồ sơ & tin nhắn từ website",
      desc:
        hoSoMoi || tinNhanMoi
          ? `${hoSoMoi} hồ sơ đăng ký mới · ${tinNhanMoi} tin nhắn chưa xử lý`
          : "Không có hồ sơ hay tin nhắn mới",
      quyen: QUYEN.BIEU_MAU_XU_LY,
      gap: hoSoMoi + tinNhanMoi,
    },
    {
      href: "/quan-tri/khach-test",
      title: "Khách làm trắc nghiệm WHO AM I?",
      desc: khachMoi
        ? `${khachMoi} khách chưa liên hệ lại · ${khachTest} tổng`
        : khachTest
          ? `${khachTest} khách đã để lại thông tin`
          : "Chưa có ai làm trắc nghiệm",
      quyen: QUYEN.BIEU_MAU_XU_LY,
      gap: khachMoi,
    },
    "Hệ thống",
    {
      href: "/quan-tri/nhom",
      title: "Nhóm / chi hội",
      desc: `${nhom} nhóm sinh hoạt`,
      quyen: QUYEN.HOI_VIEN_SUA,
    },
    {
      href: "/quan-tri/ngoi-nha",
      title: "Game Ngôi nhà Chợ Lớn",
      desc: nhiemVuChoDuyet
        ? `${nhiemVuChoDuyet} Nhiệm vụ Huynh đệ đang chờ duyệt`
        : "Mùa giải, luật chơi, Lá bài mỗi ngày, duyệt nhiệm vụ, trao quà",
      quyen: QUYEN.NGOI_NHA_QUAN_LY,
      hoacQuyen: QUYEN.NGOI_NHA_CAI_DAT,
      gap: nhiemVuChoDuyet,
    },
    {
      href: "/quan-tri/tai-khoan",
      title: "Tài khoản & phân quyền",
      desc: `${taiKhoan} tài khoản đang dùng`,
      quyen: QUYEN.TAI_KHOAN_QUAN_LY,
    },
  ];

  // Gom thành nhóm theo các chuỗi tiêu đề xen giữa; số cố định 01–23 đánh
  // xuyên nhóm TRƯỚC khi lọc quyền
  const nhomHien: { ten: string; o: (O & { so: string })[] }[] = [];
  let dem = 0;
  for (const muc of oPhang) {
    if (typeof muc === "string") {
      nhomHien.push({ ten: muc, o: [] });
      continue;
    }
    dem++;
    if (!(co(user, muc.quyen) || (!!muc.hoacQuyen && co(user, muc.hoacQuyen)))) {
      continue;
    }
    nhomHien[nhomHien.length - 1].o.push({
      ...muc,
      so: String(dem).padStart(2, "0"),
    });
  }
  const cacNhom = nhomHien.filter((g) => g.o.length > 0);
  const hien = cacNhom.flatMap((g) => g.o);

  return (
    <div>
      <PageHeader
        title="Quản trị"
        subtitle={
          user.role === "ADMIN"
            ? "Chủ nhiệm Chi hội — toàn quyền trên hệ thống"
            : `Cán bộ ban — ${hien.length} mục được phân quyền`
        }
      />

      {sp["thieu-quyen"] && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Anh/chị chưa được cấp quyền vào mục vừa bấm. Liên hệ Chủ nhiệm Chi hội
          nếu cần bổ sung.
        </p>
      )}

      {cacNhom.map((g) => (
        <section key={g.ten} className="mb-8">
          <h2 className="mb-3 text-xs font-bold tracking-[0.15em] text-slate-400 uppercase">
            {g.ten}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.o.map((t) => (
              <Link
                key={t.href}
                href={t.href}
                className={`card p-5 transition hover:ring-navy-300 ${
                  t.noiBat
                    ? "bg-amber-50/60 ring-2 ring-amber-400 sm:col-span-2"
                    : t.gap
                      ? "ring-2 ring-do-200"
                      : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-navy-800">
                    <span className="mr-1.5 font-mono text-xs font-bold text-slate-400">
                      {t.so}
                    </span>
                    {t.title}
                    {t.noiBat && (
                      <span className="ml-2 rounded-full bg-do-600 px-2 py-0.5 text-[11px] font-bold text-white">
                        🔴 Đang diễn ra
                      </span>
                    )}
                  </span>
                  {!!t.gap && (
                    <span className="shrink-0 rounded-full bg-do-500 px-2 py-0.5 text-xs font-bold text-white">
                      {t.gap}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-slate-600">{t.desc}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
