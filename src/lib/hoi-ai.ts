/**
 * Trợ lý AI của Chi hội: trả lời câu hỏi về Hội Doanh nhân trẻ TP.HCM,
 * Chi hội Chợ Lớn, hội viên, ngành nghề, sự kiện và chương trình.
 *
 * Cách làm: KHÔNG để mô hình tự nhớ. Mỗi câu hỏi đều tra cơ sở dữ liệu trước,
 * lấy đúng những bản ghi liên quan rồi đưa vào ngữ cảnh; mô hình chỉ được phép
 * trả lời dựa trên phần dữ liệu đó. Nhờ vậy câu trả lời luôn khớp với những gì
 * đang hiện trên web, và không bịa ra doanh nghiệp hay sự kiện không có thật.
 *
 * Dữ liệu đưa vào ngữ cảnh chỉ lấy từ khu CÔNG KHAI (`PUBLIC_MEMBER`,
 * `publicListing()`), nên trợ lý không thể lộ số điện thoại hay email hội viên
 * cho khách vãng lai — đúng như quy tắc của trang công khai.
 */
import { prisma } from "@/lib/prisma";
import { PUBLIC_MEMBER, publicListing } from "@/lib/public";
import { normalizeSearch } from "@/lib/search";
import { SITE } from "@/lib/site";
import { tenDoanhNghiep } from "@/lib/ten-doanh-nghiep";
import { THU_TU_HOI_VIEN, THU_TU_TIN_DANG } from "@/lib/xep-hang";

export const MODEL = "claude-opus-5";

/** Số câu một máy được hỏi trong một ngày, tránh bị lạm dụng. */
export const GIOI_HAN_NGAY = 20;
export const DAI_TOI_DA = 500;

export type NguonTraLoi = { nhan: string; duongDan: string };

/** Rút từ khoá đáng tra từ câu hỏi: bỏ các từ nối không mang thông tin. */
const TU_BO = new Set(
  (
    "la gi co khong nao the nhu va hay hoac cua cho voi tai trong ngoai " +
    "toi minh ban anh chi em ai gi dau bao nhieu may lam sao vay a " +
    "xin vui long cho hoi giup do can muon tim biet ve mot cac nhung " +
    "duoc se da dang thi ma nhung neu khi den tu ra vao len xuong"
  ).split(/\s+/),
);

export function tuKhoaTuCauHoi(cauHoi: string): string[] {
  const tu = normalizeSearch(cauHoi)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2 && !TU_BO.has(t));
  // Giữ thứ tự xuất hiện, bỏ trùng, lấy tối đa 8 từ
  return [...new Set(tu)].slice(0, 8);
}

function gon(s: string | null | undefined, n = 300): string {
  const t = (s ?? "").replace(/\s+/g, " ").trim();
  return t.length <= n ? t : t.slice(0, n) + "…";
}

const ngay = (d: Date | null) =>
  d
    ? d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "";

/**
 * Dựng ngữ cảnh cho một câu hỏi: phần tổng quan luôn có + phần tra theo từ khoá.
 * Trả về cả danh sách nguồn để hiện link dưới câu trả lời.
 */
export async function dungNguCanh(cauHoi: string): Promise<{
  vanBan: string;
  nguon: NguonTraLoi[];
}> {
  const tu = tuKhoaTuCauHoi(cauHoi);
  const nguon: NguonTraLoi[] = [];
  const khoi: string[] = [];

  // ── Phần luôn có: Chi hội là ai, quy mô thế nào ──────────────
  const [soHoiVien, soTin, soSuKien, banCN, nganh] = await Promise.all([
    prisma.member.count({ where: PUBLIC_MEMBER }),
    prisma.listing.count({ where: publicListing() }),
    prisma.event.count({ where: { published: true } }),
    prisma.leader.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        name: true,
        title: true,
        company: true,
        position: true,
        group: true,
        slug: true,
      },
    }),
    prisma.category.findMany({
      select: { name: true, _count: { select: { members: true } } },
      orderBy: { name: "asc" },
    }),
  ]);

  khoi.push(
    [
      `# Về Chi hội`,
      `Tên đầy đủ: ${SITE.fullName}. Trực thuộc ${SITE.parent}. ${SITE.term}.`,
      `Khẩu hiệu: ${SITE.slogan}. Thành lập năm ${SITE.founded}.`,
      `Khu vực hoạt động: ${SITE.areas.join(", ")}.`,
      `Địa chỉ văn phòng: ${SITE.address}. Hotline: ${SITE.hotline}. Email: ${SITE.email}. Website: ${SITE.domain}.`,
      `Fanpage Chi hội: ${SITE.social.facebook}. Kênh YouTube: ${SITE.social.youtube}.`,
      `Số hội viên đang hiển thị công khai: ${soHoiVien}. Số tin mua/bán đang đăng: ${soTin}. Số sự kiện đã tổ chức có trên web: ${soSuKien}.`,
    ].join("\n"),
  );

  // Hướng dẫn đăng nhập viết cứng theo sự thật (đo 15/09/2026) để trợ lý không
  // tự suy ra "đăng nhập bằng mã hội viên" — tên đăng nhập KHÔNG trùng mã HV.
  khoi.push(
    [
      `# Đăng nhập khu hội viên`,
      `Đăng nhập tại /login bằng tên đăng nhập do Chi hội gửi (dạng hv0xxx) HOẶC số điện thoại đã đăng ký với Chi hội, cùng mật khẩu. Mã hội viên (dạng HVxxxx) KHÔNG dùng để đăng nhập và thường không trùng tên đăng nhập.`,
      `Quên tên đăng nhập thì dùng số điện thoại; quên mật khẩu thì liên hệ Văn phòng Chi hội để được cấp lại, đăng nhập xong vào Tổng quan → Đổi mật khẩu. Hướng dẫn đầy đủ: /huong-dan-dang-nhap. Không bao giờ nêu tên đăng nhập hay mật khẩu của bất kỳ ai.`,
    ].join("\n"),
  );
  if (/dang nhap|tai khoan|mat khau|login/.test(normalizeSearch(cauHoi))) {
    nguon.push({
      nhan: "Hướng dẫn đăng nhập",
      duongDan: "/huong-dan-dang-nhap",
    });
  }

  khoi.push(
    "# Ban Chủ nhiệm và các ban\n" +
      banCN
        .map(
          (b) =>
            `- ${b.name} — ${b.title}${b.position || b.company ? ` (${[b.position, b.company].filter(Boolean).join(", ")})` : ""}`,
        )
        .join("\n"),
  );

  khoi.push(
    "# Các ngành nghề trong Chi hội (kèm số hội viên)\n" +
      nganh
        .filter((c) => c._count.members > 0)
        .map((c) => `- ${c.name}: ${c._count.members} hội viên`)
        .join("\n"),
  );

  // ── Phần tra theo từ khoá của câu hỏi ────────────────────────
  if (tu.length) {
    const dieuKienChu = (cot: string[]) => ({
      OR: tu.flatMap((t) => cot.map((c) => ({ [c]: { contains: t } }))),
    });

    const [hoiVien, tinDang, suKien, lich, tinTuc, duAn, goi] =
      await Promise.all([
        prisma.member.findMany({
          where: {
            ...PUBLIC_MEMBER,
            OR: tu.map((t) => ({ searchText: { contains: t } })),
          },
          orderBy: THU_TU_HOI_VIEN,
          take: 12,
          select: {
            slug: true,
            company: true,
            name: true,
            position: true,
            intro: true,
            offering: true,
            services: true,
            needing: true,
            district: true,
            headcount: true,
            foundedYear: true,
            joinedAt: true,
            hoiRole: true,
            website: true,
            category: { select: { name: true } },
          },
        }),
        prisma.listing.findMany({
          where: {
            ...publicListing(),
            OR: tu.map((t) => ({ searchText: { contains: t } })),
          },
          orderBy: THU_TU_TIN_DANG,
          take: 8,
          select: {
            slug: true,
            title: true,
            summary: true,
            type: true,
            priceText: true,
            location: true,
            member: { select: { company: true } },
          },
        }),
        prisma.event.findMany({
          where: {
            published: true,
            ...dieuKienChu([
              "title",
              "summary",
              "seriesName",
              "activityGroup",
              "location",
            ]),
          },
          orderBy: { startAt: "desc" },
          take: 8,
          select: {
            slug: true,
            title: true,
            summary: true,
            startAt: true,
            location: true,
            seriesName: true,
          },
        }),
        prisma.lichHoatDong.findMany({
          where: {
            published: true,
            ...dieuKienChu(["tieuDe", "moTa", "noiDung", "diaDiem"]),
          },
          orderBy: { tuNgay: "asc" },
          take: 6,
          select: {
            slug: true,
            tieuDe: true,
            moTa: true,
            tuNgay: true,
            gioText: true,
            diaDiem: true,
            banToChuc: true,
          },
        }),
        prisma.post.findMany({
          where: {
            published: true,
            OR: tu.map((t) => ({ searchText: { contains: t } })),
          },
          orderBy: { publishedAt: "desc" },
          take: 5,
          select: { slug: true, title: true, excerpt: true },
        }),
        prisma.duAnTaiTro.findMany({
          where: { active: true, ...dieuKienChu(["ten", "tomTat", "moTa"]) },
          take: 4,
          select: {
            slug: true,
            ten: true,
            tomTat: true,
            mucTieu: true,
            daGop: true,
          },
        }),
        prisma.goiTaiTro.findMany({
          where: { active: true },
          orderBy: { soTien: "desc" },
          take: 6,
          select: { ten: true, soTien: true, quyenLoi: true },
        }),
      ]);

    if (hoiVien.length) {
      khoi.push(
        "# Doanh nghiệp hội viên liên quan tới câu hỏi\n" +
          hoiVien
            .map((m) => {
              const ten = tenDoanhNghiep(m.company);
              nguon.push({ nhan: ten, duongDan: `/doanh-nghiep/${m.slug}` });
              return [
                `## ${ten}`,
                `- Ngành: ${m.category?.name ?? "chưa phân loại"}`,
                m.name
                  ? `- Người đại diện tại Chi hội: ${m.name}${m.position ? `, ${m.position}` : ""}`
                  : "",
                m.hoiRole ? `- Vai trò trong Hội: ${m.hoiRole}` : "",
                m.district ? `- Khu vực: ${m.district}` : "",
                m.headcount ? `- Quy mô: ${m.headcount} người` : "",
                m.foundedYear ? `- Thành lập: ${m.foundedYear}` : "",
                `- Gia nhập Chi hội: ${m.joinedAt.getFullYear()}`,
                m.offering ? `- Sản phẩm: ${gon(m.offering, 200)}` : "",
                m.services ? `- Dịch vụ: ${gon(m.services, 200)}` : "",
                m.needing ? `- Đang tìm: ${gon(m.needing, 150)}` : "",
                m.website ? `- Website: ${m.website}` : "",
                m.intro ? `- Giới thiệu: ${gon(m.intro, 250)}` : "",
                `- Trang hồ sơ: /doanh-nghiep/${m.slug}`,
              ]
                .filter(Boolean)
                .join("\n");
            })
            .join("\n\n"),
      );
    }

    if (tinDang.length) {
      khoi.push(
        "# Tin mua/bán đang đăng trên chợ nhu cầu\n" +
          tinDang
            .map((l) => {
              nguon.push({ nhan: l.title, duongDan: `/giao-thuong/${l.slug}` });
              return `- [${l.type === "CAN_MUA" ? "CẦN MUA" : "CẦN BÁN"}] ${l.title} — ${
                l.member ? tenDoanhNghiep(l.member.company) : "hội viên"
              }${l.priceText ? ` · Giá: ${l.priceText}` : ""}${
                l.location ? ` · ${l.location}` : ""
              }. ${gon(l.summary, 160)} (/giao-thuong/${l.slug})`;
            })
            .join("\n"),
      );
    }

    if (suKien.length) {
      khoi.push(
        "# Sự kiện đã tổ chức\n" +
          suKien
            .map((e) => {
              nguon.push({ nhan: e.title, duongDan: `/su-kien/${e.slug}` });
              return `- ${e.title} (${ngay(e.startAt)}${e.location ? `, ${e.location}` : ""})${
                e.seriesName ? ` · Chương trình: ${e.seriesName}` : ""
              }. ${gon(e.summary, 160)} (/su-kien/${e.slug})`;
            })
            .join("\n"),
      );
    }

    if (lich.length) {
      khoi.push(
        "# Lịch hoạt động sắp tới\n" +
          lich
            .map((l) => {
              const d = l.slug
                ? `/lich-hoat-dong/${l.slug}`
                : "/lich-hoat-dong";
              nguon.push({ nhan: l.tieuDe, duongDan: d });
              return `- ${l.tieuDe} — ${ngay(l.tuNgay)}${l.gioText ? ` ${l.gioText}` : ""}${
                l.diaDiem ? `, ${l.diaDiem}` : ""
              }${l.banToChuc ? ` · Ban tổ chức: ${l.banToChuc}` : ""}. ${gon(l.moTa, 160)} (${d})`;
            })
            .join("\n"),
      );
    }

    if (tinTuc.length) {
      khoi.push(
        "# Tin tức\n" +
          tinTuc
            .map((p) => {
              nguon.push({ nhan: p.title, duongDan: `/tin-tuc/${p.slug}` });
              return `- ${p.title}. ${gon(p.excerpt, 160)} (/tin-tuc/${p.slug})`;
            })
            .join("\n"),
      );
    }

    if (duAn.length || goi.length) {
      khoi.push(
        "# Chương trình cần đồng hành và gói tài trợ\n" +
          duAn
            .map(
              (d) =>
                `- Chương trình: ${d.ten}. ${gon(d.tomTat, 160)} (/tai-tro)`,
            )
            .concat(
              goi.map(
                (g) =>
                  `- Gói ${g.ten}: ${(g.soTien / 1_000_000).toLocaleString("vi-VN")} triệu đồng${
                    g.quyenLoi ? `. Quyền lợi: ${gon(g.quyenLoi, 200)}` : ""
                  } (/tai-tro)`,
              ),
            )
            .join("\n"),
      );
      if (duAn.length || goi.length)
        nguon.push({ nhan: "Đồng hành & tài trợ", duongDan: "/tai-tro" });
    }
  }

  return { vanBan: khoi.join("\n\n"), nguon: nguon.slice(0, 8) };
}

export const LOI_HE_THONG = `Bạn là trợ lý thông tin của ${SITE.fullName} (viết tắt YBA Chợ Lớn), trực thuộc Hội Doanh nhân trẻ TP.HCM. Bạn trả lời trên website công khai của Chi hội, cho cả hội viên lẫn khách vãng lai.

PHẠM VI: chỉ trả lời về Hội Doanh nhân trẻ TP.HCM, Chi hội Chợ Lớn, hội viên và doanh nghiệp hội viên, ngành nghề, sự kiện, chương trình, lịch hoạt động, chợ nhu cầu mua bán, tài trợ và cách gia nhập Chi hội. Câu hỏi ngoài phạm vi (chính trị, y tế, pháp luật cá nhân, chuyện riêng tư, đề nghị viết mã, làm bài tập…) thì từ chối ngắn gọn một câu rồi gợi ý người hỏi quay lại chủ đề của Hội.

QUY TẮC TRẢ LỜI:
1. CHỈ dùng thông tin trong phần DỮ LIỆU bên dưới. Đây là dữ liệu thật lấy từ cơ sở dữ liệu của website ngay lúc này.
2. Nếu dữ liệu không có câu trả lời, nói thẳng là chưa có thông tin trên web và mời liên hệ văn phòng Chi hội — TUYỆT ĐỐI không đoán, không bịa tên doanh nghiệp, số liệu, ngày tháng hay sự kiện.
3. Không suy diễn về doanh nghiệp hội viên ngoài những gì họ đã khai. Không bình luận, không xếp hạng, không so sánh doanh nghiệp này hơn kém doanh nghiệp kia.
4. Không đưa số điện thoại hay email của hội viên. Muốn liên hệ thì hướng người hỏi tới trang hồ sơ doanh nghiệp và nhắc rằng cần đăng nhập tài khoản hội viên mới xem được liên hệ.
5. Khi nhắc tới một doanh nghiệp, sự kiện hay chương trình có đường dẫn trong dữ liệu, hãy dẫn đường dẫn đó dạng markdown, ví dụ [Công ty ABC](/doanh-nghiep/cong-ty-abc).

CÁCH VIẾT: tiếng Việt, xưng "Chi hội" khi nói về tổ chức. Lịch sự, gọn, đi thẳng vào câu trả lời — 2 đến 5 câu cho câu hỏi thường; dùng gạch đầu dòng khi phải liệt kê nhiều doanh nghiệp hoặc sự kiện. Không mở đầu bằng "Chào bạn" hay nhắc lại câu hỏi.`;
