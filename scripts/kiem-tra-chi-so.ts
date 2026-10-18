/**
 * Đối chiếu chỉ số xúc tiến thương mại công khai với báo cáo nội bộ.
 *   npm run test:chiso
 *
 * Cả hai trang cùng gọi `approvedIn(period)` trong src/lib/stats.ts, nên nếu con
 * số lệch nhau thì tức là ở đâu đó có người viết lại điều kiện lọc bằng tay.
 */
import { PrismaClient } from "@prisma/client";
import {
  DEAL_STATUS,
  PARTNER_SCOPE,
  SCOPE_ORDER,
  loiPhamVi,
} from "../src/lib/deal";
import { resolvePeriod } from "../src/lib/period";
import { byScope, overview } from "../src/lib/stats";

const prisma = new PrismaClient();

let dat = 0;
let hong = 0;

function kiemTra(ten: string, dung: boolean, chiTiet?: string) {
  if (dung) {
    dat++;
    console.log(`PASS  ${ten}`);
  } else {
    hong++;
    console.log(`FAIL  ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

/** Quy tắc khai phạm vi giao thương — kiểm tra ngay trên hàm thuần. */
function kiemTraQuyTacPhamVi() {
  console.log("\n── Quy tắc khai phạm vi giao thương ──");

  kiemTra(
    "nội Chi hội không cần ghi tên tổ chức",
    loiPhamVi(PARTNER_SCOPE.NOI_CHI_HOI, null) === null
  );
  kiemTra(
    "ngoài Hội không cần ghi tên tổ chức",
    loiPhamVi(PARTNER_SCOPE.NGOAI_HOI, null) === null
  );
  kiemTra(
    "liên chi hội mà bỏ trống tên chi hội thì BỊ CHẶN",
    loiPhamVi(PARTNER_SCOPE.LIEN_CHI_HOI, null) !== null
  );
  kiemTra(
    "liên chi hội chỉ gõ khoảng trắng cũng BỊ CHẶN",
    loiPhamVi(PARTNER_SCOPE.LIEN_CHI_HOI, "   ") !== null
  );
  kiemTra(
    "liên hội mà bỏ trống tên hội thì BỊ CHẶN",
    loiPhamVi(PARTNER_SCOPE.LIEN_HOI, "") !== null
  );
  kiemTra(
    "liên chi hội có ghi tên chi hội thì hợp lệ",
    loiPhamVi(PARTNER_SCOPE.LIEN_CHI_HOI, "YBA Sài Gòn") === null
  );
  kiemTra(
    "phạm vi bịa ra thì BỊ CHẶN",
    loiPhamVi("LUNG_TUNG", "YBA Sài Gòn") !== null
  );
}

async function main() {
  kiemTraQuyTacPhamVi();

  for (const ky of ["nam-nay", "tat-ca"]) {
    const period = resolvePeriod(ky);
    console.log(`\n── Kỳ: ${period.label} ──`);

    const [tongHop, phamVi, thuCong] = await Promise.all([
      overview(period),
      byScope(period),
      prisma.deal.aggregate({
        where: {
          status: DEAL_STATUS.DA_DUYET,
          dealDate: { gte: period.from, lte: period.to },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);

    const tongThuCong = thuCong._sum.amount ?? 0;
    const demThuCong = thuCong._count._all;

    kiemTra(
      "tổng giá trị khớp với truy vấn trực tiếp trên CSDL",
      tongHop.total === tongThuCong,
      `trang: ${tongHop.total} · CSDL: ${tongThuCong}`
    );
    kiemTra(
      "số giao dịch khớp với truy vấn trực tiếp trên CSDL",
      tongHop.count === demThuCong,
      `trang: ${tongHop.count} · CSDL: ${demThuCong}`
    );

    const tongPhamVi = phamVi.reduce((s, r) => s + r.total, 0);
    const demPhamVi = phamVi.reduce((s, r) => s + r.count, 0);

    kiemTra(
      "cộng 4 phạm vi lại bằng đúng tổng giá trị",
      tongPhamVi === tongHop.total,
      `4 phạm vi: ${tongPhamVi} · tổng: ${tongHop.total}`
    );
    kiemTra(
      "cộng 4 phạm vi lại bằng đúng số giao dịch",
      demPhamVi === tongHop.count,
      `4 phạm vi: ${demPhamVi} · tổng: ${tongHop.count}`
    );
    kiemTra(
      "luôn trả đủ 4 phạm vi theo thứ tự cố định",
      phamVi.length === SCOPE_ORDER.length &&
        phamVi.every((r, i) => r.scope === SCOPE_ORDER[i])
    );

    const tongTyLe = phamVi.reduce((s, r) => s + r.share, 0);
    kiemTra(
      "tỉ lệ phần trăm các phạm vi cộng lại bằng 100%",
      tongHop.total === 0 || Math.abs(tongTyLe - 100) < 0.01,
      `cộng lại = ${tongTyLe.toFixed(2)}%`
    );

    // Đơn chưa duyệt tuyệt đối không được lọt vào số liệu
    const chuaDuyet = await prisma.deal.aggregate({
      where: {
        status: { not: DEAL_STATUS.DA_DUYET },
        dealDate: { gte: period.from, lte: period.to },
      },
      _sum: { amount: true },
    });
    kiemTra(
      "đơn chưa duyệt KHÔNG được tính vào chỉ số",
      tongHop.total !== tongHop.total + (chuaDuyet._sum.amount ?? 0) ||
        (chuaDuyet._sum.amount ?? 0) === 0
    );
  }

  console.log("");
  if (hong) {
    console.log(`${hong} phép đối chiếu SAI, ${dat} đúng.`);
    process.exit(1);
  }
  console.log(`Tất cả ${dat} phép đối chiếu chỉ số đều khớp.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
