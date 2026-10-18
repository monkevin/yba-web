/**
 * Kiểm tra tab quản trị game "Người chơi".
 *
 *   npx tsx scripts/kiem-tra-nguoi-choi.ts          — hàm thuần (không đụng CSDL)
 *   npx tsx scripts/kiem-tra-nguoi-choi.ts --csdl   — thêm phần CSDL: tài khoản
 *     giả + "mùa" giả, gọi thẳng phần lõi (`nguoi-choi-loi.ts`), xoá sạch khi xong.
 *
 * Phần CSDL chạy qua khoá để các nhóm không chồng nhau:
 *   node ".../scratchpad/khoa-csdl.cjs" npx tsx scripts/kiem-tra-nguoi-choi.ts --csdl
 * Mùa giả truyền thẳng vào lõi nên không phụ thuộc mùa giải thật đang mở hay
 * không. SiteSetting duy nhất bị đụng là `nn.luat` (đặt về mặc định để ngưỡng
 * huy hiệu cân bằng không phụ thuộc máy đang chạy) — bản gốc được lưu lại và
 * trả về đúng như cũ trong `finally`.
 */
import { prisma } from "../src/lib/prisma";
import {
  chuanSoDienThoai,
  docGhiChu,
  GIOI_HAN_DIEU_CHINH,
  kiemTraDieuChinh,
  loiTongAm,
  moTaThayDoi,
  moTaVon,
  nhanNguon,
  tenLoaiSoCai,
  timUngVien,
  type UngVien,
} from "../src/app/(noi-bo)/quan-tri/ngoi-nha/_cai-dat/nguoi-choi-thuan";

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

const hopLe = {
  userId: "u1",
  muaId: "M1",
  diem: 500,
  von: { TT: 3 },
  lyDo: "Bù lỗi mạng trạm 1.3",
};

function soatKiemTra() {
  console.log("— Kiểm tra dữ liệu điều chỉnh —");
  const ok = kiemTraDieuChinh(hopLe);
  kiem(
    "Dữ liệu đúng được nhận, vốn thiếu tự điền 0",
    ok.ok &&
      ok.data.diem === 500 &&
      ok.data.von.TT === 3 &&
      ok.data.von.CN === 0 &&
      ok.data.muaId === "M1",
    JSON.stringify(ok),
  );
  const loi = (x: unknown) => {
    const r = kiemTraDieuChinh(x);
    return r.ok ? "" : r.loi;
  };
  kiem(
    "Lý do 3 ký tự bị từ chối",
    /Lý do/.test(loi({ ...hopLe, lyDo: "abc" })),
  );
  kiem(
    "Lý do toàn khoảng trắng bị từ chối",
    /Lý do/.test(loi({ ...hopLe, lyDo: "   \n  " })),
  );
  kiem(
    "Lý do 4 ký tự + khoảng trắng hai đầu vẫn bị từ chối",
    /Lý do/.test(loi({ ...hopLe, lyDo: "  abcd  " })),
  );
  kiem(
    "Lý do đúng 5 ký tự được nhận",
    kiemTraDieuChinh({ ...hopLe, lyDo: "abcde" }).ok,
  );
  const gon = kiemTraDieuChinh({ ...hopLe, lyDo: "  Bù   lỗi\n mạng  " });
  kiem(
    "Lý do được gộp khoảng trắng",
    gon.ok && gon.data.lyDo === "Bù lỗi mạng",
    gon.ok ? gon.data.lyDo : gon.loi,
  );
  kiem(
    "Lý do dài quá 300 ký tự bị từ chối",
    !!loi({ ...hopLe, lyDo: "a".repeat(GIOI_HAN_DIEU_CHINH.lyDoToiDa + 1) }),
  );
  kiem(
    "Điểm 100.001 bị từ chối, −100.000 được nhận",
    !!loi({ ...hopLe, diem: 100_001 }) &&
      kiemTraDieuChinh({ ...hopLe, diem: -100_000 }).ok,
  );
  kiem("Điểm lẻ 1.5 bị từ chối", !!loi({ ...hopLe, diem: 1.5 }));
  kiem("Điểm dạng chuỗi bị từ chối", !!loi({ ...hopLe, diem: "500" }));
  kiem("Điểm NaN bị từ chối", !!loi({ ...hopLe, diem: NaN }));
  kiem(
    "Vốn 51 bị từ chối, −50 được nhận",
    /Vốn tri thức/.test(loi({ ...hopLe, von: { TT: 51 } })) &&
      kiemTraDieuChinh({ ...hopLe, von: { XH: -50 } }).ok,
  );
  kiem("Vốn không phải object bị từ chối", !!loi({ ...hopLe, von: [1, 2] }));
  kiem(
    "Không đổi điểm lẫn vốn nào bị từ chối",
    /Chưa nhập/.test(loi({ ...hopLe, diem: 0, von: {} })),
  );
  kiem("Thiếu người chơi bị từ chối", !!loi({ ...hopLe, userId: " " }));
  kiem("Không phải object bị từ chối", !!loi(null) && !!loi("x") && !!loi([]));
  const khongMua = kiemTraDieuChinh({ ...hopLe, muaId: undefined });
  kiem(
    "Không gửi mùa → muaId null",
    khongMua.ok && khongMua.data.muaId === null,
  );
  const am0 = kiemTraDieuChinh({ ...hopLe, diem: -0, von: { TT: -0, CN: 2 } });
  kiem(
    "−0 được đổi về 0",
    am0.ok && Object.is(am0.data.diem, 0) && Object.is(am0.data.von.TT, 0),
  );

  kiem(
    "Mô tả thay đổi có dấu kiểu Việt",
    moTaThayDoi(500, { TT: 3, XH: -2 }) ===
      "+500 điểm · Tri thức +3 · Xã hội −2",
    moTaThayDoi(500, { TT: 3, XH: -2 }),
  );
  kiem(
    "Mô tả số lớn có dấu chấm nghìn",
    moTaThayDoi(-1000, {}) === "−1.000 điểm",
    moTaThayDoi(-1000, {}),
  );
  kiem("Mô tả vốn rỗng khi không đổi vốn", moTaVon({ CN: 0 }) === "");

  // Trang quản trị gọi `loiTongAm` để báo sớm, máy chủ gọi lại trong giao dịch
  const vonRong = () => ({ CN: 0, TT: 0, XH: 0, TS: 0 });
  const dangCo = { diem: 300, von: { CN: 0, TT: 2, XH: 0, TS: 0 } };
  kiem(
    "Cộng thì luôn được",
    loiTongAm(dangCo, { diem: 9, von: vonRong() }) === null,
  );
  kiem(
    "Trừ vừa đủ về 0 vẫn được",
    loiTongAm(dangCo, { diem: -300, von: vonRong() }) === null,
  );
  kiem(
    "Trừ quá điểm đang có bị chặn, câu báo có số trừ tối đa",
    (loiTongAm(dangCo, { diem: -301, von: vonRong() }) ?? "").includes("300"),
    String(loiTongAm(dangCo, { diem: -301, von: vonRong() })),
  );
  kiem(
    "Trừ quá vốn đang có bị chặn",
    (
      loiTongAm(dangCo, { diem: 0, von: { ...vonRong(), TT: -3 } }) ?? ""
    ).includes("Vốn tri thức hiện có 2"),
    String(loiTongAm(dangCo, { diem: 0, von: { ...vonRong(), TT: -3 } })),
  );
  kiem(
    "Tổng đang âm sẵn: chỉ chặn phần trừ, không chặn phần cộng",
    loiTongAm({ diem: -5, von: vonRong() }, { diem: 10, von: vonRong() }) ===
      null &&
      loiTongAm({ diem: -5, von: vonRong() }, { diem: -1, von: vonRong() }) !==
        null,
  );
}

function soatTim() {
  console.log("\n— Tìm người —");
  const ds: UngVien[] = [
    {
      id: "1",
      username: "hv0018",
      ten: "Đặng Minh Khang",
      congTy: "CÔNG TY TNHH MON AMIE",
      ma: "HV0001",
      dienThoai: "0903.123.456",
    },
    {
      id: "2",
      username: "hv0001",
      ten: "Nguyễn Văn An",
      congTy: "CÔNG TY CP ÁNH DƯƠNG",
      ma: "HV0018",
      dienThoai: "+84 912 000 111",
    },
    {
      id: "3",
      username: "thuky",
      ten: "Thư ký Chi hội",
      congTy: null,
      ma: null,
      dienThoai: null,
    },
    {
      id: "4",
      username: "hv0100",
      ten: "Trần Thị An Nhiên",
      congTy: "HỘ KINH DOANH AN NHIÊN",
      ma: "HV0100",
      dienThoai: "0988777666",
    },
  ];
  const ids = (q: string) =>
    timUngVien(ds, q)
      .map((u) => u.id)
      .join(",");
  kiem("Ô trống không trả ai", ids("  ") === "");
  kiem(
    "Tên không dấu, không phân biệt hoa thường",
    ids("NGUYEN VAN AN") === "2",
    ids("NGUYEN VAN AN"),
  );
  kiem("Tên có dấu", ids("Đặng Minh") === "1", ids("Đặng Minh"));
  kiem(
    "Gõ đúng mã HV hoặc tên đăng nhập: cả hai người khớp đúng lên đầu",
    ids("HV0018").split(",").slice(0, 2).sort().join(",") === "1,2",
    ids("HV0018"),
  );
  kiem("Tên đăng nhập", ids("thuky") === "3", ids("thuky"));
  kiem("Doanh nghiệp", ids("mon amie") === "1", ids("mon amie"));
  kiem(
    "Số điện thoại gõ liền khớp số ghi có dấu chấm",
    ids("0903123456") === "1",
    ids("0903123456"),
  );
  kiem(
    "Số điện thoại một phần có khoảng trắng",
    ids("912 000") === "2",
    ids("912 000"),
  );
  kiem(
    "Số +84 khớp số 0…",
    ids("+84 988 777 666") === "4",
    ids("+84 988 777 666"),
  );
  kiem(
    "Nhiều từ lẫn tên + doanh nghiệp",
    ids("khang amie") === "1",
    ids("khang amie"),
  );
  kiem(
    "“an” ưu tiên người có từ bắt đầu bằng An",
    ids("an").split(",")[0] === "2" || ids("an").split(",")[0] === "4",
    ids("an"),
  );
  kiem("Giới hạn số kết quả", timUngVien(ds, "hv", 2).length === 2);
  kiem(
    "Chuẩn số điện thoại",
    chuanSoDienThoai("+84 903-123-456") === "0903123456" &&
      chuanSoDienThoai(null) === "",
  );
}

function soatNhan() {
  console.log("\n— Nhãn sổ cái —");
  const tra = {
    tenTram: (m: string) => (m === "1.3" ? "Gia nhập Hội" : undefined),
    tenHuyHieu: (m: string) => (m === "HOAN_HAO" ? "Hoàn hảo" : undefined),
    tenDauTri: (id: string) => (id === "p1" ? "Buổi họp tháng 9" : undefined),
    doiThuTran: (id: string) => (id === "t1" ? "Nguyễn Văn An" : undefined),
  };
  kiem(
    "Trạm có tên",
    nhanNguon("tram:1.3", tra) === "Trạm 1.3 · Gia nhập Hội",
    nhanNguon("tram:1.3", tra),
  );
  kiem("Trạm không rõ tên vẫn đọc được", nhanNguon("tram:9.9") === "Trạm 9.9");
  kiem(
    "Thử thách ngày",
    nhanNguon("ngay:2026-09-16") === "Thử thách ngày 16/09/2026",
  );
  kiem("Lá bài", nhanNguon("labai:2026-09-16") === "Lá bài ngày 16/09/2026");
  kiem("Huy hiệu", nhanNguon("hh:HOAN_HAO", tra) === "Huy hiệu Hoàn hảo");
  kiem(
    "Thẻ Cơ hội kèm trạm",
    nhanNguon("the:CH01:2.1") === "Thẻ Cơ hội sau trạm 2.1",
  );
  kiem(
    "Đấu trí có tên phiên",
    nhanNguon("dau-tri:p1", tra) === "Đấu trí “Buổi họp tháng 9”",
  );
  kiem(
    "Trận có tên đối thủ",
    nhanNguon("tran:t1", tra) === "Trận Đấu trường với Nguyễn Văn An",
  );
  kiem(
    "Trận không rõ đối thủ",
    nhanNguon("tran:zz", tra) === "Trận Đấu trường",
  );
  kiem(
    "Điều chỉnh tay",
    nhanNguon("dc:mf3k2") === "Ban Điều hành điều chỉnh tay",
  );
  kiem("Nguồn lạ giữ nguyên", nhanNguon("abc") === "abc");
  kiem(
    "Tên loại",
    tenLoaiSoCai("DIEU_CHINH") === "Ban điều chỉnh" &&
      tenLoaiSoCai("XYZ") === "XYZ",
  );
  const gc = docGhiChu(
    "LA_BAI",
    JSON.stringify({
      v: 1,
      viTri: 2,
      soLa: 5,
      loai: "QUA",
      ma: "Q1",
      qua: { ma: "Q1", ten: "Voucher cà phê", nhaDongHanh: "" },
      diem: 0,
      diemChuoi: 0,
      chuoiNgay: 3,
    }),
  );
  kiem(
    "Ghi chú Lá bài đọc từ JSON, không hiện chuỗi JSON",
    gc.includes("Voucher cà phê") &&
      gc.includes("chuỗi 3 ngày") &&
      !gc.includes("{"),
    gc,
  );
  kiem(
    "Ghi chú Lá bài hỏng vẫn an toàn",
    docGhiChu("LA_BAI", "{hỏng") === "Lá bài",
  );
  kiem(
    "Ghi chú loại khác giữ nguyên",
    docGhiChu("TRAM", "Trạm 1.1 · 8/10") === "Trạm 1.1 · 8/10",
  );
}

async function chayCsdl() {
  console.log("\n— Phần CSDL —");
  const loi =
    await import("../src/app/(noi-bo)/quan-tri/ngoi-nha/_cai-dat/nguoi-choi-loi");
  const { tongSoCai } = await import("../src/lib/ngoi-nha/so-cai");
  const { bangXepHang } = await import("../src/lib/ngoi-nha/tong-hop");
  const { ghiMuc, MUC_CAI_DAT } = await import("../src/lib/ngoi-nha/cai-dat");
  const { LUAT_MAC_DINH } =
    await import("../src/lib/ngoi-nha/cai-dat/luat-choi");

  const dau = `kiem-tra-nc-${Date.now()}`;
  const muaGia = {
    id: `KTNC${Date.now()}`,
    ten: "Mùa kiểm tra người chơi",
    batDau: null,
    ketThuc: null,
    tinhDiem: true,
    trangThai: "DANG_DIEN_RA" as const,
  };
  const nguoiLam = { id: "kiem-tra", ten: "Người kiểm tra (kiemtra)" };
  // Điều chỉnh vốn đọc luật `nn.luat` (ngưỡng cân bằng) — chạy theo luật mặc
  // định để Ban có chỉnh trên máy này cũng không làm test báo sai; trả lại cuối
  const khoaLuat = MUC_CAI_DAT.luat.khoa;
  const luatGoc = await prisma.siteSetting.findUnique({
    where: { key: khoaLuat },
  });
  const user = await prisma.user.create({
    data: {
      username: dau,
      name: "Người chơi kiểm tra điều chỉnh",
      passwordHash: "x",
      role: "MEMBER",
    },
  });
  const userId = user.id;
  try {
    await ghiMuc("luat", LUAT_MAC_DINH);
    const tong = () => tongSoCai(prisma, userId, muaGia.id);

    // ── Điều chỉnh điểm ──
    const r1 = await loi.ghiDieuChinh(
      {
        userId,
        muaId: muaGia.id,
        diem: 500,
        von: { TT: 3 },
        lyDo: "Bù lỗi mạng trạm 1.3",
      },
      nguoiLam,
      muaGia,
    );
    const t1 = await tong();
    kiem(
      "Điều chỉnh +500 điểm, +3 tri thức: tổng sổ cái đổi đúng",
      r1.ok && t1.diem === 500 && t1.von.TT === 3 && t1.von.CN === 0,
      JSON.stringify({ r1, t1 }),
    );
    const dong = await prisma.nnSoCai.findMany({
      where: { userId, muaId: muaGia.id },
    });
    kiem(
      "Ghi đúng một dòng DIEU_CHINH, nguồn dc:…, ghi chú có lý do + người làm",
      dong.length === 1 &&
        dong[0].loai === "DIEU_CHINH" &&
        /^dc:[0-9a-z]+$/.test(dong[0].nguon) &&
        !!dong[0].ghiChu?.includes("Bù lỗi mạng trạm 1.3") &&
        !!dong[0].ghiChu?.includes(nguoiLam.ten),
      JSON.stringify(dong),
    );

    const r2 = await loi.ghiDieuChinh(
      { userId, muaId: muaGia.id, diem: 100, lyDo: "abc" },
      nguoiLam,
      muaGia,
    );
    kiem(
      "Lý do ngắn bị từ chối, sổ cái không đổi",
      !r2.ok && /Lý do/.test(r2.error) && (await tong()).diem === 500,
      JSON.stringify(r2),
    );

    const r3 = await loi.ghiDieuChinh(
      {
        userId,
        muaId: muaGia.id,
        diem: -200,
        von: { TT: -1 },
        lyDo: "Trừ điểm ghi nhầm hôm qua",
      },
      nguoiLam,
      muaGia,
    );
    const t3 = await tong();
    kiem(
      "Điều chỉnh âm trừ đúng",
      r3.ok && t3.diem === 300 && t3.von.TT === 2,
      JSON.stringify(t3),
    );

    // Không cho tổng xuống số âm: trừ vốn nhiều hơn số đang có thì từ chối cả dòng
    const rAm = await loi.ghiDieuChinh(
      {
        userId,
        muaId: muaGia.id,
        von: { XH: -1 },
        lyDo: "Thử trừ quá số đang có",
      },
      nguoiLam,
      muaGia,
    );
    kiem(
      "Trừ quá số đang có → từ chối, tổng giữ nguyên",
      !rAm.ok &&
        /chỉ trừ được tối đa/.test(rAm.error) &&
        (await tong()).von.XH === 0,
      JSON.stringify(rAm),
    );

    const r4 = await loi.ghiDieuChinh(
      { userId, muaId: muaGia.id, diem: 50, lyDo: "Mùa đã kết thúc" },
      nguoiLam,
      { ...muaGia, tinhDiem: false, trangThai: "DA_KET_THUC" as const },
    );
    kiem(
      "Mùa không còn tính điểm → từ chối",
      !r4.ok && (await tong()).diem === 300,
    );

    const r5 = await loi.ghiDieuChinh(
      { userId, muaId: "MUA_KHAC", diem: 50, lyDo: "Mùa lệch nhau" },
      nguoiLam,
      muaGia,
    );
    kiem(
      "Trang đang xem mùa khác mùa hiện tại → từ chối",
      !r5.ok && /Mùa giải vừa thay đổi/.test(r5.error),
    );

    const r6 = await loi.ghiDieuChinh(
      {
        userId: `${dau}-khong-co`,
        muaId: muaGia.id,
        diem: 50,
        lyDo: "Người không tồn tại",
      },
      nguoiLam,
      muaGia,
    );
    kiem("Tài khoản không tồn tại → từ chối", !r6.ok);

    kiem(
      "Vượt giới hạn điểm → từ chối, không ghi",
      !(
        await loi.ghiDieuChinh(
          { userId, muaId: muaGia.id, diem: 100_001, lyDo: "Quá giới hạn" },
          nguoiLam,
          muaGia,
        )
      ).ok &&
        (await prisma.nnSoCai.count({
          where: { userId, muaId: muaGia.id },
        })) === 2,
    );

    // ── Vốn đủ ngưỡng → huy hiệu Doanh nhân cân bằng trong cùng giao dịch ──
    {
      const nguong = LUAT_MAC_DINH.von.nguongCanBang;
      const rCb = await loi.ghiDieuChinh(
        {
          userId,
          muaId: muaGia.id,
          // Tri thức đang có 2 sau các ca trên → cộng cho đủ ngưỡng
          von: { CN: nguong, TT: nguong - 2, XH: nguong + 1, TS: nguong },
          lyDo: "Kiểm tra huy hiệu cân bằng",
        },
        nguoiLam,
        muaGia,
      );
      const hh = await prisma.nnHuyHieu.findFirst({
        where: { userId, muaId: muaGia.id, ma: "CAN_BANG" },
      });
      kiem(
        "Đủ 4 vốn qua điều chỉnh → trao huy hiệu Doanh nhân cân bằng",
        rCb.ok && rCb.huyHieuMoi.length === 1 && !!hh,
        JSON.stringify(rCb),
      );
    }

    // ── Ẩn / hiện bảng xếp hạng ──
    const a1 = await loi.ghiAnXepHang(userId, true);
    const bxhAn = await bangXepHang(muaGia.id, "mua", userId, 10);
    kiem(
      "Ẩn người chưa từng vào game: tạo dòng người chơi, biến khỏi bảng xếp hạng",
      a1.ok &&
        a1.doi &&
        bxhAn.cuaToi === null &&
        (await prisma.nnNguoiChoi.findUnique({ where: { userId } }))
          ?.anXepHang === true,
    );
    const a2 = await loi.ghiAnXepHang(userId, true);
    kiem("Ẩn lần nữa: không đổi gì", a2.ok && !a2.doi);
    const a3 = await loi.ghiAnXepHang(userId, false);
    const bxhHien = await bangXepHang(muaGia.id, "mua", userId, 10);
    kiem(
      "Hiện lại: có tên trên bảng",
      a3.ok && a3.doi && bxhHien.cuaToi?.userId === userId,
    );
    kiem(
      "Ẩn tài khoản không tồn tại → từ chối",
      !(await loi.ghiAnXepHang(`${dau}-x`, true)).ok,
    );

    // ── Xem lại hướng dẫn ──
    await prisma.nnNguoiChoi.update({
      where: { userId },
      data: { daXemHuongDan: true },
    });
    const h1 = await loi.ghiXemLaiHuongDan(userId);
    kiem(
      "Cho xem lại hướng dẫn → daXemHuongDan = false",
      h1.ok &&
        (await prisma.nnNguoiChoi.findUnique({ where: { userId } }))
          ?.daXemHuongDan === false,
    );

    // ── Đóng lượt bỏ dở quá 6 giờ ──
    const luotCu = await prisma.nnLuot.create({
      data: {
        userId,
        muaId: muaGia.id,
        tramMa: "1.1",
        cheDo: "LUYEN_TAP",
        deBai: "[]",
        createdAt: new Date(Date.now() - 7 * 3600e3),
      },
    });
    const luotMoi = await prisma.nnLuot.create({
      data: {
        userId,
        muaId: muaGia.id,
        tramMa: "1.2",
        cheDo: "LUYEN_TAP",
        deBai: "[]",
      },
    });
    const c1 = await loi.chotLuotBoDo(userId);
    const [sauCu, sauMoi] = await Promise.all([
      prisma.nnLuot.findUnique({ where: { id: luotCu.id } }),
      prisma.nnLuot.findUnique({ where: { id: luotMoi.id } }),
    ]);
    kiem(
      "Đóng lượt quá 6 giờ, giữ lượt mới cho người chơi làm nốt",
      c1.ok &&
        c1.soDong === 1 &&
        c1.conLai === 0 &&
        sauCu?.trangThai === "XONG" &&
        sauMoi?.trangThai === "DANG_CHOI",
      JSON.stringify({ c1, cu: sauCu?.trangThai, moi: sauMoi?.trangThai }),
    );
    const c2 = await loi.chotLuotBoDo(userId);
    kiem("Bấm lần nữa: không còn lượt nào để đóng", c2.ok && c2.soDong === 0);

    // ── Đọc danh sách / chi tiết ──
    const ganDay = await loi.docDanhSachNguoiChoi("", muaGia.id);
    const toi = ganDay.ds.find((d) => d.id === userId);
    kiem(
      "Ô trống: hiện người hoạt động gần nhất trong mùa, số liệu khớp sổ cái",
      ganDay.cheDo === "ganDay" &&
        !!toi &&
        toi.tomTat.diem === (await tong()).diem &&
        toi.tomTat.soLuotDangDo === 1,
      JSON.stringify(toi?.tomTat),
    );
    const tim = await loi.docDanhSachNguoiChoi(dau, muaGia.id);
    kiem(
      "Tìm theo tên đăng nhập ra đúng người",
      tim.cheDo === "tim" && tim.ds[0]?.id === userId,
    );
    const timTen = await loi.docDanhSachNguoiChoi(
      "nguoi choi kiem tra dieu chinh",
      muaGia.id,
    );
    kiem(
      "Tìm tên không dấu ra đúng người",
      timTen.ds.some((d) => d.id === userId),
    );

    const ct = await loi.docChiTietNguoiChoi(userId, muaGia.id);
    kiem(
      "Chi tiết: đủ dòng sổ cái (mới nhất trước), nguồn đọc được, lượt đang dở",
      !!ct &&
        ct.soCai.length ===
          (await prisma.nnSoCai.count({
            where: { userId, muaId: muaGia.id },
          })) &&
        ct.soCai.some(
          (s) =>
            s.nguon === "Ban Điều hành điều chỉnh tay" &&
            s.tenLoai === "Ban điều chỉnh",
        ) &&
        ct.soCai[0].luc >= ct.soCai[ct.soCai.length - 1].luc &&
        ct.luotDangDo.length === 1 &&
        ct.luotDangDo[0].id === luotMoi.id &&
        !ct.luotDangDo[0].quaCu,
      JSON.stringify({ soCai: ct?.soCai.length, luot: ct?.luotDangDo }),
    );
    kiem(
      "Chi tiết tài khoản không tồn tại → null",
      (await loi.docChiTietNguoiChoi(`${dau}-khong-co`, muaGia.id)) === null,
    );
  } finally {
    await prisma.nnTraLoi.deleteMany({ where: { userId } });
    await prisma.nnLuot.deleteMany({ where: { userId } });
    await prisma.nnTienDo.deleteMany({ where: { userId } });
    await prisma.nnSoCai.deleteMany({ where: { userId } });
    await prisma.nnHuyHieu.deleteMany({ where: { userId } });
    await prisma.nnNguoiChoi.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    if (luatGoc)
      await prisma.siteSetting.update({
        where: { key: khoaLuat },
        data: { value: luatGoc.value },
      });
    else await prisma.siteSetting.deleteMany({ where: { key: khoaLuat } });
    const conSot = await prisma.nnSoCai.count({ where: { muaId: muaGia.id } });
    const luatSau = await prisma.siteSetting.findUnique({
      where: { key: khoaLuat },
    });
    kiem(
      "Đã dọn sạch dữ liệu thử, trả lại luật đang lưu",
      conSot === 0 && (luatSau?.value ?? null) === (luatGoc?.value ?? null),
    );
  }
}

async function main() {
  soatKiemTra();
  soatTim();
  soatNhan();
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
