/**
 * Kiểm tra nhóm Đấu trường · Đấu trí · Kho bộ câu · Nhiệm vụ Huynh đệ theo cài
 * đặt Ban Điều hành chỉnh (luật, bật tắt, ẩn bộ câu, sửa nhiệm vụ).
 *
 *   npx tsx scripts/kiem-tra-dau-truong-nv.ts          → phần thuần (không CSDL)
 *   npx tsx scripts/kiem-tra-dau-truong-nv.ts --csdl   → thêm ca chạy thật trên CSDL
 *
 * Phần CSDL lưu bản gốc các khoá nn.tinhNang / nn.luat / nn.thongSo /
 * nn.nhiemVu / nn.boCauAn, ghi mặc định, tạo mùa giải tạm + tài khoản tạm, đổi
 * từng cài đặt để thấy máy chủ làm theo, cuối cùng xoá sạch và trả lại bản gốc.
 * Tự bỏ qua khi đang có mùa giải thật mở. Làm song song thì chạy qua khoá:
 *   node ".../scratchpad/khoa-csdl.cjs" npx tsx scripts/kiem-tra-dau-truong-nv.ts --csdl
 */
import { prisma } from "../src/lib/prisma";
import {
  BO_THEO_MA,
  CHU_DE_BO_CAU,
  HANH_TRINH,
  NGAU_NHIEN,
  TAT_CA_BO,
  deBaiThachDau,
  khoBoCau,
  luaChonThachDau,
  maBoCuaDeBai,
  maCauBo,
  type DaGapBo,
} from "../src/lib/ngoi-nha/bo-cau";
import { MUC_CAI_DAT, ghiMuc, type TenMuc } from "../src/lib/ngoi-nha/cai-dat";
import { nhomBoCauDauTri, soCauDeBai } from "../src/lib/ngoi-nha/dau-tri";
import { bangNhiemVu } from "../src/lib/ngoi-nha/nhiem-vu";

let dat = 0;
let hong = 0;
function kiem(ten: string, dieuKien: boolean, chiTiet = "") {
  if (dieuKien) {
    dat++;
    console.log(`PASS  ${ten}`);
  } else {
    hong++;
    console.log(`FAIL  ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

async function kiemLoi(ten: string, fn: () => Promise<unknown>, ma?: string) {
  try {
    await fn();
    kiem(ten, false, "đáng lẽ phải báo lỗi");
  } catch (e) {
    const m = (e as { ma?: string }).ma;
    kiem(ten, !ma || m === ma, `mã lỗi ${m} · ${(e as Error).message}`);
  }
}

const rong = (): DaGapBo => ({ thach: new Set(), doiThu: new Set() });

// ─── Phần thuần ───────────────────────────────────────────────────────

function soatBoCauAn() {
  console.log("\n— Kho bộ câu có câu / bộ bị ẩn —");
  const cd0 = CHU_DE_BO_CAU[0];
  const X = cd0.bo[1];
  const Y = cd0.bo[2];
  const Z = cd0.bo[3];

  const de = deBaiThachDau(X.ma, 10, 15, rong());
  const so = de.deBai
    .map((m) => Number(m.id.split(":")[2]))
    .sort((a, b) => a - b);
  kiem(
    "Mã câu trong đề giữ số thứ tự gốc dù đề đã xáo (dt:<bộ>:1..10)",
    maBoCuaDeBai(de.deBai) === X.ma &&
      de.deBai.every((m) => m.id === m.cau?.id) &&
      so.join(",") === X.cau.map((c) => c.so).join(","),
    so.join(","),
  );

  const anX = { bo: [X.ma], cau: [] as string[] };
  kiem(
    "Ẩn một bộ: kho bỏ bộ đó, ô chọn đếm đúng số bộ còn hiện",
    !khoBoCau(anX).theoMa[X.ma] &&
      khoBoCau(anX).tatCa.length === TAT_CA_BO.length - 1 &&
      luaChonThachDau(anX).some(
        (l) =>
          l.ma === NGAU_NHIEN && l.ten.includes(String(TAT_CA_BO.length - 1)),
      ) &&
      luaChonThachDau(anX).some(
        (l) =>
          l.ma === `CD:${cd0.ma}` &&
          l.ten.includes(`(${cd0.bo.length - 1} bộ)`),
      ),
  );
  let raX = 0;
  const maCd = new Set(cd0.bo.map((b) => b.ma));
  for (let i = 0; i < 300; i++) {
    const chon = [NGAU_NHIEN, `CD:${cd0.ma}`, X.ma][i % 3];
    // Có lượt ép hết bộ chưa gặp để đi vào nhánh dự phòng (đành lặp bộ)
    const daGap: DaGapBo =
      i % 2
        ? { thach: new Set(TAT_CA_BO.map((b) => b.ma)), doiThu: maCd }
        : rong();
    if (maBoCuaDeBai(deBaiThachDau(chon, 10, 15, daGap, anX).deBai) === X.ma)
      raX++;
  }
  kiem(
    "300 lần dựng đề (ngẫu nhiên / chủ đề / gửi thẳng mã bộ ẩn / đã gặp hết) không lần nào ra bộ bị ẩn",
    raX === 0,
    `${raX} lần ra bộ ẩn`,
  );

  const an6 = {
    bo: [],
    cau: Y.cau.slice(0, 6).map((c) => maCauBo(Y.ma, c.so)),
  };
  kiem(
    "Bộ bị ẩn 6 câu (còn 4 < 5) thì loại khỏi kho",
    !khoBoCau(an6).theoMa[Y.ma] && !!khoBoCau(an6).theoMa[X.ma],
  );
  const cauAnZ = Z.cau.slice(0, 3).map((c) => maCauBo(Z.ma, c.so));
  const an3 = { bo: [], cau: cauAnZ };
  const deZ = deBaiThachDau(Z.ma, 10, 15, rong(), an3);
  kiem(
    "Bộ bị ẩn 3 câu vẫn dùng: đề 7 câu, không có câu ẩn",
    maBoCuaDeBai(deZ.deBai) === Z.ma &&
      deZ.deBai.length === 7 &&
      deZ.deBai.every((m) => !cauAnZ.includes(m.id)),
    `${deZ.deBai.length} câu`,
  );

  const anHet = { bo: TAT_CA_BO.map((b) => b.ma), cau: [] };
  const deHet = deBaiThachDau(NGAU_NHIEN, 10, 15, rong(), anHet);
  kiem(
    "Ẩn cả kho: trận vẫn mở được bằng câu 22 trạm, ô chọn chỉ còn Hành trình",
    maBoCuaDeBai(deHet.deBai) === null &&
      deHet.deBai.length === 10 &&
      luaChonThachDau(anHet).every((l) => l.ma === HANH_TRINH),
  );

  const nhom = nhomBoCauDauTri(anX, 7);
  const phang = nhom.flatMap((n) => n.bo);
  kiem(
    "Đấu trí: ô chọn bộ bỏ bộ ẩn, nhãn ngẫu nhiên theo số câu luật",
    !phang.some((b) => b.ma === X.ma) &&
      phang.some((b) => b.ma === Y.ma) &&
      phang.some((b) => b.ma === "NGAN_HANG" && b.ten.includes("7 câu")),
  );
  kiem("Bộ ẩn vẫn tra được tên (trận cũ)", !!BO_THEO_MA[X.ma]);
  kiem(
    "Đếm số câu đề bài bỏ câu thưởng",
    soCauDeBai(
      JSON.stringify([{ id: "a" }, { id: "b" }, { id: "t", thuong: {} }]),
    ) === 2 && soCauDeBai("hỏng") === 0,
  );
}

function soatNhiemVuSua() {
  console.log("\n— Bảng nhiệm vụ theo bản sửa —");
  const goc = bangNhiemVu();
  kiem(
    "Chưa sửa: 16 nhiệm vụ đều bật, NV02 giới hạn 4 lần/tháng",
    goc.size === 16 &&
      [...goc.values()].every((n) => n.bat) &&
      goc.get("NV02")?.coGioiHan === true &&
      goc.get("NV02")?.toiDa === 4,
  );
  const sua = MUC_CAI_DAT.nhiemVu.chuan({
    ds: [
      { ma: "NV05", bat: false, diem: 777, von: { TS: 3 } },
      { ma: "NV02", ky: null },
      { ma: "NV10", toiDa: 0 },
      { ma: "NV99", diem: 1 },
    ],
  });
  const b = bangNhiemVu(sua);
  kiem(
    "Bản sửa đè đúng: NV05 tắt 777 điểm, vốn chỉ còn TS 3",
    b.get("NV05")?.bat === false &&
      b.get("NV05")?.diem === 777 &&
      JSON.stringify(b.get("NV05")?.von) === JSON.stringify({ TS: 3 }),
  );
  kiem(
    "Bỏ kỳ hoặc số lần 0 thì không giới hạn; mã lạ bị bỏ qua; cách xác nhận giữ trong code",
    b.get("NV02")?.coGioiHan === false &&
      b.get("NV10")?.coGioiHan === false &&
      !b.has("NV99") &&
      b.get("NV03")?.thuCong === "HOI_VIEN" &&
      b.get("NV04")?.tuDong === "DEAL_BAN",
  );
}

// ─── Phần CSDL ────────────────────────────────────────────────────────

const KHOA: TenMuc[] = ["tinhNang", "luat", "thongSo", "nhiemVu", "boCauAn"];

async function ghiMacDinh(ten: TenMuc, them: Record<string, unknown> = {}) {
  const md = MUC_CAI_DAT[ten].macDinh() as Record<string, unknown>;
  await ghiMuc(ten, { ...md, ...them });
}

async function chayCsdl() {
  console.log("\n— Chạy thật trên CSDL —");
  const muaThat = await prisma.nnMua.findFirst({
    where: { trangThai: "DANG_MO" },
  });
  if (muaThat) {
    console.log(
      "BỎ QUA  đang có mùa giải thật mở — không chạy ca CSDL để khỏi lẫn số liệu",
    );
    return;
  }
  const dt = await import("../src/lib/ngoi-nha/dau-truong");
  const dtri = await import("../src/lib/ngoi-nha/dau-tri");
  const nv = await import("../src/lib/ngoi-nha/nhiem-vu");
  const { muaHienTai } = await import("../src/lib/ngoi-nha/mua");
  const { docBoCauAn } = await import("../src/lib/ngoi-nha/cai-dat");

  const goc = await prisma.siteSetting.findMany({
    where: { key: { in: KHOA.map((k) => MUC_CAI_DAT[k].khoa) } },
  });
  const dau = `ktdtnv${Date.now().toString(36)}`;
  const userIds: string[] = [];
  const phienIds: string[] = [];
  let muaId: string | null = null;
  try {
    for (const k of KHOA) await ghiMacDinh(k);
    const mua = await prisma.nnMua.create({
      data: {
        ten: "__KIEM_TRA_DTNV__",
        batDau: new Date(Date.now() - 3600e3),
        ketThuc: new Date(Date.now() + 7 * 86400e3),
        trangThai: "DANG_MO",
      },
    });
    muaId = mua.id;
    const taoUser = async (x: string) => {
      const u = await prisma.user.create({
        data: {
          username: `${dau}-${x}`,
          name: `Kiểm tra DTNV ${x.toUpperCase()}`,
          passwordHash: "x",
          role: "STAFF",
        },
      });
      userIds.push(u.id);
      return u.id;
    };
    const [A, B, C, D] = [
      await taoUser("a"),
      await taoUser("b"),
      await taoUser("c"),
      await taoUser("d"),
    ];
    const n = (userId: string) => ({ userId, memberId: null });

    /** Đáp án đúng / sai của đề một trận (đọc thứ tự xáo đã lưu). */
    const dapAnTran = async (tranId: string) => {
      const t = await prisma.nnTranDau.findUniqueOrThrow({
        where: { id: tranId },
      });
      const de = JSON.parse(t.deBai) as { tt: number[]; giay?: number }[];
      return {
        t,
        de,
        dung: de.map((m) => m.tt.indexOf(0)),
        sai: de.map((m) => (m.tt.indexOf(0) + 1) % m.tt.length),
      };
    };

    /**
     * Hai bên chơi hết: người thách nộp trước, đối thủ nộp sau (kết quả của đối
     * thủ). Phải MỞ ĐỀ trước khi nộp — máy chủ chấm giờ từ mốc mở đề.
     */
    const choiHet = async (tranId: string, doiThuSai = false) => {
      const { t, dung, sai } = await dapAnTran(tranId);
      await dt.cauTranDau(n(t.thachId), tranId);
      await dt.nopTranDau(n(t.thachId), tranId, dung, 0);
      await dt.cauTranDau(n(t.doiThuId), tranId);
      return dt.nopTranDau(n(t.doiThuId), tranId, doiThuSai ? sai : dung, 0);
    };

    // ── Tắt Đấu trường: không tạo trận mới, trận dở vẫn chơi nốt ──
    const tran1 = await dt.taoTranDau(n(A), B);
    await ghiMacDinh("tinhNang", { dauTruong: false });
    await kiemLoi(
      "Tắt Đấu trường → không tạo được trận mới (mã TAT)",
      () => dt.taoTranDau(n(A), C),
      "TAT",
    );
    const sanh = await dt.sanhDauTruong(n(A));
    const tim = await dt.timDoiThu(n(A), "");
    kiem(
      "Tắt Đấu trường vẫn xem sảnh và tìm đối thủ được",
      sanh.dangDo.some((t) => t.id === tran1) && Array.isArray(tim),
    );
    const kq1 = await choiHet(tran1);
    const soCai1 = await prisma.nnSoCai.count({
      where: { nguon: `tran:${tran1}` },
    });
    kiem(
      "Trận dở lúc tắt vẫn nộp nốt được và cộng điểm hai bên",
      kq1.xong && kq1.tinhDiem !== false && soCai1 === 2,
      `${kq1.xong} ${kq1.tinhDiem} ${soCai1}`,
    );
    await ghiMacDinh("tinhNang");

    // ── Luật tuỳ chỉnh: vốn, trần mỗi người / cùng đối thủ ──
    await ghiMacDinh("luat", {
      dauTruong: {
        vonTT: 5,
        vonXH: 0,
        tranTinhDiemMoiNgay: 2,
        cungDoiThuMoiNgay: 1,
      },
    });
    const tran2 = await dt.taoTranDau(n(A), C);
    const kq2 = await choiHet(tran2);
    const soCai2 = await prisma.nnSoCai.findFirst({
      where: { nguon: `tran:${tran2}`, userId: A },
    });
    kiem(
      "Vốn mỗi trận theo luật (Tri thức 5, Xã hội 0)",
      kq2.tinhDiem !== false &&
        soCai2?.vonTT === 5 &&
        soCai2?.vonXH === 0 &&
        kq2.von?.TT === 5 &&
        kq2.von?.XH === 0,
      JSON.stringify({ tt: soCai2?.vonTT, xh: soCai2?.vonXH, von: kq2.von }),
    );
    const tran3 = await dt.taoTranDau(n(A), C);
    const kq3 = await choiHet(tran3);
    kiem(
      "Cùng đối thủ tối đa 1 trận có điểm/ngày → trận thứ 2 cùng cặp không có điểm",
      kq3.xong &&
        kq3.tinhDiem === false &&
        (await prisma.nnSoCai.count({ where: { nguon: `tran:${tran3}` } })) ===
          0 &&
        (kq3.ghiChuDiem ?? "").includes("1 trận"),
      kq3.ghiChuDiem ?? "",
    );
    const tran4 = await dt.taoTranDau(n(D), A);
    const kq4 = await choiHet(tran4);
    const soCai4 = await prisma.nnSoCai.findMany({
      where: { nguon: `tran:${tran4}` },
    });
    kiem(
      "Mỗi người tối đa 2 trận có điểm/ngày → A (đã đủ 2) không có điểm, D vẫn có",
      kq4.tinhDiem === false &&
        soCai4.length === 1 &&
        soCai4[0].userId === D &&
        (kq4.ghiChuDiem ?? "").includes("2 trận"),
      `${soCai4.map((s) => (s.userId === D ? "D" : "?")).join(",")} · ${kq4.ghiChuDiem}`,
    );
    await ghiMacDinh("luat");

    // ── Ẩn bộ câu: đề không ra bộ ẩn; huỷ trận thì hai người tạo trận mới được ──
    const cd0 = CHU_DE_BO_CAU[0];
    const giu = cd0.bo[0];
    await ghiMacDinh("boCauAn", {
      bo: cd0.bo.filter((b) => b.ma !== giu.ma).map((b) => b.ma),
    });
    const an = await docBoCauAn();
    kiem(
      "Ô chọn chủ đề đếm theo bộ còn hiện (1 bộ)",
      luaChonThachDau(an).some(
        (l) => l.ma === `CD:${cd0.ma}` && l.ten.endsWith("(1 bộ)"),
      ),
    );
    const boAn = new Set(an.bo);
    const daRa: string[] = [];
    let huyDuoc = 0;
    // Hai người MỚI: A và B đã gặp vài bộ ở các ca trên, mà luật "không lặp bộ
    // người thách đã xem đáp án" sẽ đẩy sang chủ đề khác — ca này cần lịch sử trắng
    const [E, F] = [await taoUser("e"), await taoUser("f")];
    for (let i = 0; i < 6; i++) {
      const t = await dt.taoTranDau(n(E), F, `CD:${cd0.ma}`);
      const tran = await prisma.nnTranDau.findUniqueOrThrow({
        where: { id: t },
      });
      daRa.push(maBoCuaDeBai(JSON.parse(tran.deBai)) ?? "HANH_TRINH");
      if (await dt.huyTranDau(t)) huyDuoc++;
    }
    // Trận 1 ra bộ duy nhất còn hiện; từ trận 2 hai người đã gặp bộ đó nên máy
    // mở sang chủ đề khác (luật "chưa gặp" sẵn có) — nhưng không lần nào ra bộ ẩn
    kiem(
      "Ẩn 9/10 bộ của chủ đề → trận đầu ra đúng bộ còn hiện, 6 trận liền không lần nào ra bộ ẩn",
      daRa[0] === giu.ma && daRa.every((ma) => !boAn.has(ma)),
      daRa.join(", "),
    );
    kiem(
      "Huỷ trận xong hai người tạo lại trận mới được ngay (6/6)",
      huyDuoc === 6,
      `${huyDuoc} huỷ`,
    );
    await ghiMacDinh("boCauAn");

    // ── Huỷ trận ──
    const t5 = await dt.taoTranDau(n(A), B);
    await kiemLoi("Cặp đang có trận dở thì không thách thêm", () =>
      dt.taoTranDau(n(B), A),
    );
    const treo = await dt.tranChuaXong();
    kiem(
      "Trang vận hành thấy trận chưa xong, có tên hai bên",
      treo.ds.some(
        (t) =>
          t.id === t5 &&
          t.thach.ten.includes("DTNV A") &&
          t.doiThu.ten.includes("DTNV B"),
      ),
    );
    kiem("Huỷ trận dở → được", await dt.huyTranDau(t5));
    kiem("Huỷ lần hai → không (đã huỷ)", !(await dt.huyTranDau(t5)));
    kiem("Không huỷ được trận đã xong", !(await dt.huyTranDau(tran1)));
    await kiemLoi(
      "Nộp vào trận đã huỷ bị từ chối",
      () => dt.nopTranDau(n(A), t5, [0, 1, 2], 5000),
      "HUY",
    );
    await kiemLoi(
      "Mở câu trận đã huỷ bị từ chối",
      () => dt.cauTranDau(n(A), t5),
      "HUY",
    );
    const ct5 = await dt.chiTietTran(n(A), t5);
    const sanh5 = await dt.sanhDauTruong(n(A));
    kiem(
      "Trận huỷ hiện “Đã huỷ”, không nằm trong trận dở, không tính lời thách chờ",
      ct5?.trangThai === "HUY" &&
        ct5.nhanTrangThai === "Đã huỷ" &&
        !sanh5.dangDo.some((t) => t.id === t5) &&
        sanh5.daXong.some((t) => t.id === t5 && t.trangThai === "HUY") &&
        (await dt.soLoiThach(B)) === 0,
    );
    const t6 = await dt.taoTranDau(n(B), A);
    kiem("Sau khi huỷ, hai người thách nhau trận mới được", !!t6);
    await dt.huyTranDau(t6);

    // ── Chấm giờ ở MÁY CHỦ (mốc mở đề), không tin giờ trình duyệt khai ──
    {
      const [M, N] = [await taoUser("m"), await taoUser("n")];
      const tranG = await dt.taoTranDau(n(M), N);
      await kiemLoi(
        "Nộp khi chưa từng mở đề bị từ chối (CHUA_MO_DE)",
        () => dt.nopTranDau(n(M), tranG, [0, 1, 2], 0),
        "CHUA_MO_DE",
      );
      const mo1 = await dt.cauTranDau(n(M), tranG);
      const sauMo = await prisma.nnTranDau.findUniqueOrThrow({
        where: { id: tranG },
      });
      kiem(
        "Mở đề lần đầu ghi mốc giờ máy chủ cho đúng bên tới lượt",
        !!sauMo.thachMoLuc &&
          sauMo.thachMoLuc.getTime() === mo1.moLuc &&
          sauMo.doiThuMoLuc === null,
        `${sauMo.thachMoLuc?.toISOString()} · ${sauMo.doiThuMoLuc}`,
      );
      // Lùi mốc 60 giây rồi mở lại — như người chơi tải lại trang giữa trận
      const moc = new Date(Date.now() - 60_000);
      await prisma.nnTranDau.update({
        where: { id: tranG },
        data: { thachMoLuc: moc },
      });
      const mo2 = await dt.cauTranDau(n(M), tranG);
      kiem(
        "Mở đề lại (tải lại trang) KHÔNG dời mốc — giờ vẫn chạy từ lần đầu",
        mo2.moLuc === moc.getTime() && mo2.cau.length === mo1.cau.length,
        `${new Date(mo2.moLuc).toISOString()} ≠ ${moc.toISOString()}`,
      );
      const { de: deG, dung: dungG } = await dapAnTran(tranG);
      await dt.nopTranDau(n(M), tranG, dungG, 0);
      const sauNopThach = await prisma.nnTranDau.findUniqueOrThrow({
        where: { id: tranG },
      });
      kiem(
        "Nộp lấy giờ máy chủ (≈60 giây) chứ không lấy giờ trình duyệt khai (0)",
        (sauNopThach.thachMs ?? 0) >= 59_000 &&
          (sauNopThach.thachMs ?? 0) <= 75_000,
        `${sauNopThach.thachMs} ms`,
      );
      // Bên đối thủ: mốc lùi 1 giờ → kẹp trần (tổng giây đề + 10 giây bù mạng)
      await dt.cauTranDau(n(N), tranG);
      await prisma.nnTranDau.update({
        where: { id: tranG },
        data: { doiThuMoLuc: new Date(Date.now() - 3600e3) },
      });
      await dt.nopTranDau(n(N), tranG, dungG, 5_000);
      const xongG = await prisma.nnTranDau.findUniqueOrThrow({
        where: { id: tranG },
      });
      const tranMs =
        deG.reduce((s, m) => s + (m.giay ?? 15) * 1000, 0) + 10_000;
      kiem(
        "Mở đề rồi bỏ đó cả tiếng: thời gian bị kẹp trần đề bài + 10 giây",
        xongG.doiThuMs === tranMs && xongG.thangId === M,
        `${xongG.doiThuMs} ≠ ${tranMs}`,
      );

      // Trận CŨ (tạo trước bản chấm giờ máy chủ) không có mốc — vẫn nộp được
      const tranCu = await dt.taoTranDau(n(M), N);
      await prisma.nnTranDau.update({
        where: { id: tranCu },
        data: {
          createdAt: new Date(dt.MOC_CHAM_MAY_CHU.getTime() - 86_400e3),
        },
      });
      const { dung: dungCu } = await dapAnTran(tranCu);
      const kqCu = await dt.nopTranDau(n(M), tranCu, dungCu, 30_000);
      const sauCu = await prisma.nnTranDau.findUniqueOrThrow({
        where: { id: tranCu },
      });
      kiem(
        "Trận cũ chưa có mốc vẫn nộp được, giữ cách cũ (giờ trình duyệt khai)",
        !kqCu.xong && kqCu.soDung === dungCu.length && sauCu.thachMs === 30_000,
        `${sauCu.thachMs} ms`,
      );
      await dt.huyTranDau(tranCu);
    }

    // ── Mốc quà TRAN_THANG chỉ đếm trận CÓ ghi sổ cái ──
    {
      await ghiMacDinh("luat", {
        dauTruong: { tranTinhDiemMoiNgay: 1, cungDoiThuMoiNgay: 1 },
      });
      const [P, Q] = [await taoUser("p"), await taoUser("q")];
      const thang1 = await dt.taoTranDau(n(P), Q);
      await choiHet(thang1, true);
      const thang2 = await dt.taoTranDau(n(P), Q);
      const kqThang2 = await choiHet(thang2, true);
      const ncP = await prisma.nnNguoiChoi.findUnique({
        where: { userId: P },
      });
      const soCaiP = await prisma.nnSoCai.count({
        where: { userId: P, loai: "DAU_TRUONG" },
      });
      const mocP = await dt.tranThangTrongMua(
        { id: mua.id, batDau: mua.batDau, ketThuc: mua.ketThuc },
        [P],
      );
      kiem(
        "Thắng 2 trận nhưng trận thứ 2 quá trần ngày: thành tích 2, mốc quà chỉ tính 1",
        kqThang2.tinhDiem === false &&
          ncP?.tranThang === 2 &&
          soCaiP === 1 &&
          mocP.get(P) === 1,
        `thanhTich=${ncP?.tranThang} soCai=${soCaiP} moc=${mocP.get(P)}`,
      );
      const mocQ = await dt.tranThangTrongMua(
        { id: mua.id, batDau: mua.batDau, ketThuc: mua.ketThuc },
        [Q],
      );
      kiem(
        "Người thua không có trận thắng nào vào mốc quà",
        !mocQ.get(Q) &&
          (await dt.tranThangCoGhiSo(mua.id, [P, Q])).get(P) === 1,
      );
      await ghiMacDinh("luat");
    }

    // ── Trận dở cũ không bị 30 trận mới đẩy khỏi sảnh ──
    const [G, H, I] = [
      await taoUser("g"),
      await taoUser("h"),
      await taoUser("i"),
    ];
    const tranCu = await dt.taoTranDau(n(G), I);
    for (let i = 0; i < 31; i++)
      await dt.huyTranDau(await dt.taoTranDau(n(G), H));
    const sanhG = await dt.sanhDauTruong(n(G));
    kiem(
      "Trận dở cũ vẫn hiện ở sảnh dù sau đó có 31 trận đã kết thúc",
      sanhG.dangDo.some((t) => t.id === tranCu) && sanhG.daXong.length === 30,
      `${sanhG.dangDo.length} dở · ${sanhG.daXong.length} đã xong`,
    );
    await dt.huyTranDau(tranCu);

    // ── Đấu trí sự kiện ──
    await ghiMacDinh("luat", { dauTri: { soCau: 7, giayMacDinh: 25 } });
    const p1 = await dtri.taoDauTri({
      ten: "__KIEM_TRA_DTNV_1__",
      boCau: "NGAN_HANG",
      giayMoiCau: 0,
    });
    phienIds.push(p1.id);
    kiem(
      "Đấu trí rút ngẫu nhiên đúng số câu luật (7), giây trống lấy mặc định luật (25)",
      soCauDeBai(p1.deBai) === 7 && p1.giayMoiCau === 25,
      `${soCauDeBai(p1.deBai)} câu × ${p1.giayMoiCau}s`,
    );
    await ghiMacDinh("luat");
    const boAnDt = CHU_DE_BO_CAU[1].bo[0];
    await ghiMacDinh("boCauAn", { bo: [boAnDt.ma] });
    await kiemLoi("Không tạo phiên Đấu trí bằng bộ đang ẩn", async () => {
      const p = await dtri.taoDauTri({
        ten: "__KIEM_TRA_DTNV_AN__",
        boCau: boAnDt.ma,
        giayMoiCau: 20,
      });
      phienIds.push(p.id);
    });
    await ghiMacDinh("boCauAn");
    await dtri.xoaDauTri(p1.id);
    kiem(
      "Xoá phiên chưa mở, chưa ai chơi",
      !(await prisma.nnDauTri.findUnique({ where: { id: p1.id } })),
    );
    const p2 = await dtri.taoDauTri({
      ten: "__KIEM_TRA_DTNV_2__",
      boCau: TAT_CA_BO[0].ma,
      giayMoiCau: 20,
    });
    phienIds.push(p2.id);
    kiem(
      "Phiên từ kho giữ mã câu gốc",
      JSON.parse(p2.deBai)[0]?.id === maCauBo(TAT_CA_BO[0].ma, 1),
    );
    await dtri.doiTrangThaiDauTri(p2.id, "DANG_MO");
    await kiemLoi("Không xoá phiên đang mở", () => dtri.xoaDauTri(p2.id));
    await prisma.nnLuot.create({
      data: {
        userId: A,
        muaId: mua.id,
        tramMa: `DAU:${p2.id}`,
        cheDo: "THU_THACH_NGAY",
        deBai: "[]",
      },
    });
    await dtri.doiTrangThaiDauTri(p2.id, "DA_DONG");
    await kiemLoi("Không xoá phiên đã có người chơi", () =>
      dtri.xoaDauTri(p2.id),
    );
    await dtri.moLaiDauTri(p2.id);
    kiem(
      "Mở lại phiên đã đóng",
      (await prisma.nnDauTri.findUniqueOrThrow({ where: { id: p2.id } }))
        .trangThai === "DANG_MO",
    );
    await kiemLoi("Chỉ mở lại được phiên đã đóng", () =>
      dtri.moLaiDauTri(p2.id),
    );
    await ghiMacDinh("tinhNang", { dauTri: false });
    await kiemLoi(
      "Tắt Đấu trí → nhập mã tham gia bị chặn (TAT)",
      () => dtri.timTheoMa(p2.maThamGia),
      "TAT",
    );
    await ghiMacDinh("tinhNang");
    kiem(
      "Bật lại Đấu trí → tìm được phiên theo mã",
      (await dtri.timTheoMa(p2.maThamGia.toLowerCase()))?.id === p2.id,
    );

    // ── Xoá phiên: kiểm lượt + xoá trong CÙNG một giao dịch ──
    {
      const p3 = await dtri.taoDauTri({
        ten: "__KIEM_TRA_DTNV_3__",
        boCau: TAT_CA_BO[1].ma,
        giayMoiCau: 20,
      });
      phienIds.push(p3.id);
      // Người vào chơi ngay trước khi Ban bấm xoá. Trước đây đếm lượt rồi mới
      // `deleteMany` ở HAI bước rời nhau nên lượt lọt vào khe giữa là phiên bị
      // xoá mà `NnLuot` "DAU:<id>" còn mồ côi; nay kiểm + xoá cùng giao dịch.
      await prisma.nnLuot.create({
        data: {
          userId: B,
          muaId: mua.id,
          tramMa: `DAU:${p3.id}`,
          cheDo: "THU_THACH_NGAY",
          deBai: "[]",
        },
      });
      const [xoa] = await Promise.allSettled([dtri.xoaDauTri(p3.id)]);
      const conPhien = await prisma.nnDauTri.findUnique({
        where: { id: p3.id },
      });
      const soLuot3 = await prisma.nnLuot.count({
        where: { tramMa: `DAU:${p3.id}` },
      });
      kiem(
        "Lượt vào rồi mới bấm xoá: xoá bị từ chối, phiên còn nguyên, không có lượt mồ côi",
        xoa.status === "rejected" &&
          (xoa.reason as { ma?: string }).ma === "LOI" &&
          !!conPhien &&
          soLuot3 === 1,
        `xoá ${xoa.status} · phiên ${conPhien ? "còn" : "mất"} · ${soLuot3} lượt`,
      );
      // Giao dịch bị từ chối không được xoá nửa vời: đóng phiên rồi xoá lượt
      // xong thì xoá lại phải được ngay
      await prisma.nnLuot.deleteMany({ where: { tramMa: `DAU:${p3.id}` } });
      const [xoaLai] = await Promise.allSettled([dtri.xoaDauTri(p3.id)]);
      kiem(
        "Xoá lại khi phiên đã trắng lượt thì được, không sót bản ghi nào",
        xoaLai.status === "fulfilled" &&
          !(await prisma.nnDauTri.findUnique({ where: { id: p3.id } })) &&
          (await prisma.nnLuot.count({
            where: { tramMa: `DAU:${p3.id}` },
          })) === 0,
        `xoá lại ${xoaLai.status}`,
      );
    }

    // ── Nhiệm vụ Huynh đệ theo bản sửa ──
    const [hv1, hv2] = await prisma.member.findMany({
      where: { active: true },
      select: { id: true },
      take: 2,
    });
    if (!hv1 || !hv2) {
      console.log(
        "BỎ QUA  cần ít nhất 2 hội viên đang sinh hoạt để thử nhiệm vụ",
      );
    } else {
      const nNv = { userId: A, memberId: hv1.id };
      const ban = { userId: `${dau}-ban`, memberId: null, laBan: true };
      const m = await muaHienTai();
      kiem("Mùa tạm đang tính điểm", m.id === mua.id && m.tinhDiem);

      const yc1 = await nv.guiNhiemVu(nNv, {
        maNv: "NV05",
        moTa: "Chia sẻ kinh nghiệm tại buổi kiểm tra",
      });
      await ghiMacDinh("nhiemVu", { ds: [{ ma: "NV05", bat: false }] });
      await kiemLoi(
        "Tắt một nhiệm vụ → gửi yêu cầu mới bị chặn (TAT)",
        () =>
          nv.guiNhiemVu(nNv, {
            maNv: "NV05",
            moTa: "Chia sẻ kinh nghiệm lần hai",
          }),
        "TAT",
      );
      const goc5 = await nv.gocHuynhDe(nNv, m);
      kiem(
        "Nhiệm vụ tắt ẩn khỏi Góc Huynh đệ",
        !goc5.nhiemVu.some((x) => x.ma === "NV05") &&
          goc5.nhiemVu.length === 15 &&
          !goc5.tamDung,
      );
      const xl1 = await nv.xuLyNhiemVu(ban, yc1.id, true);
      kiem(
        "Yêu cầu gửi trước khi tắt vẫn duyệt được",
        xl1.trangThai === "DA_XAC_NHAN",
      );

      await ghiMacDinh("nhiemVu", {
        ds: [{ ma: "NV05", bat: true, diem: 777, von: { TS: 3 } }],
      });
      const yc2 = await nv.guiNhiemVu(nNv, {
        maNv: "NV05",
        moTa: "Chia sẻ kinh nghiệm sau khi đổi điểm",
      });
      await nv.xuLyNhiemVu(ban, yc2.id, true);
      const sc2 = await prisma.nnSoCai.findFirst({
        where: { nguon: `nv:${yc2.id}` },
      });
      const ban2 = await prisma.nnNhiemVu.findUniqueOrThrow({
        where: { id: yc2.id },
      });
      kiem(
        "Đổi điểm nhiệm vụ → cộng đúng điểm / vốn mới (777 điểm, Tài sản +3)",
        sc2?.diem === 777 &&
          sc2.vonTS === 3 &&
          sc2.vonTT === 0 &&
          ban2.diem === 777,
        JSON.stringify({ diem: sc2?.diem, ts: sc2?.vonTS, tt: sc2?.vonTT }),
      );

      await ghiMacDinh("nhiemVu", {
        ds: [{ ma: "NV10", toiDa: 1, ky: "THANG" }],
      });
      await nv.guiNhiemVu(nNv, {
        maNv: "NV10",
        moTa: "Tặng một buổi chia sẻ cho cộng đồng",
      });
      await kiemLoi("Giới hạn sửa còn 1 lần/tháng → lần hai bị chặn", () =>
        nv.guiNhiemVu(nNv, {
          maNv: "NV10",
          moTa: "Tặng thêm một buổi nữa trong tháng",
        }),
      );
      await ghiMacDinh("nhiemVu");

      await ghiMacDinh("luat", { nguoiBacCauSoLan: 1 });
      const yc3 = await nv.guiNhiemVu(nNv, {
        maNv: "NV03",
        moTa: "Giới thiệu nhà cung cấp cho huynh đệ",
        lienQuanMemberId: hv2.id,
      });
      const xl3 = await nv.xuLyNhiemVu(ban, yc3.id, true);
      kiem(
        "Người bắc cầu theo luật (1 lần) → có huy hiệu ngay lần đầu",
        xl3.huyHieuMoi.some((h) => h.ma === "NGUOI_BAC_CAU"),
        xl3.huyHieuMoi.map((h) => h.ma).join(","),
      );
      await ghiMacDinh("luat");

      await ghiMacDinh("tinhNang", { nhiemVu: false });
      await kiemLoi(
        "Tắt tính năng Nhiệm vụ → gửi yêu cầu bị chặn (TAT)",
        () =>
          nv.guiNhiemVu(nNv, {
            maNv: "NV05",
            moTa: "Chia sẻ kinh nghiệm khi đang tắt",
          }),
        "TAT",
      );
      const truocDongBo = await prisma.nnNhiemVu.count({
        where: { userId: A },
      });
      const dongBo = await nv.dongBoTuDong(nNv, m);
      const goc6 = await nv.gocHuynhDe(nNv, m);
      kiem(
        "Tắt tính năng → không tự đồng bộ, Góc Huynh đệ báo tạm dừng",
        dongBo.length === 0 &&
          (await prisma.nnNhiemVu.count({ where: { userId: A } })) ===
            truocDongBo &&
          goc6.tamDung &&
          goc6.loiChuc === null,
      );
      await ghiMacDinh("tinhNang");
    }
  } finally {
    const tran = await prisma.nnTranDau.findMany({
      where: {
        OR: [{ thachId: { in: userIds } }, { doiThuId: { in: userIds } }],
      },
      select: { id: true },
    });
    await prisma.nnSoCai.deleteMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { nguon: { in: tran.map((t) => `tran:${t.id}`) } },
        ],
      },
    });
    await prisma.nnTranDau.deleteMany({
      where: { id: { in: tran.map((t) => t.id) } },
    });
    const luot = await prisma.nnLuot.findMany({
      where: {
        OR: [
          { userId: { in: userIds } },
          { tramMa: { in: phienIds.map((id) => `DAU:${id}`) } },
        ],
      },
      select: { id: true },
    });
    await prisma.nnTraLoi.deleteMany({
      where: { luotId: { in: luot.map((l) => l.id) } },
    });
    await prisma.nnLuot.deleteMany({
      where: { id: { in: luot.map((l) => l.id) } },
    });
    await prisma.nnDauTri.deleteMany({ where: { id: { in: phienIds } } });
    await prisma.nnHuyHieu.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.nnNhiemVu.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.nnNguoiChoi.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    if (muaId) await prisma.nnMua.deleteMany({ where: { id: muaId } });
    // Trả SiteSetting về đúng như trước khi chạy
    for (const k of KHOA) {
      const khoa = MUC_CAI_DAT[k].khoa;
      const g = goc.find((x) => x.key === khoa);
      if (g)
        await prisma.siteSetting.upsert({
          where: { key: khoa },
          create: { key: khoa, value: g.value },
          update: { value: g.value },
        });
      else await prisma.siteSetting.deleteMany({ where: { key: khoa } });
    }
    console.log("Đã xoá dữ liệu thử và trả lại cài đặt gốc");
  }
}

async function main() {
  soatBoCauAn();
  soatNhiemVuSua();
  if (process.argv.includes("--csdl")) await chayCsdl();
  console.log(`\n${dat} đạt, ${hong} hỏng`);
  if (hong) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
