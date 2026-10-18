/**
 * Kiểm tra báo cáo thần số học đầy đủ và lá số tử vi 12 cung.
 *
 *   npx next start -p 3009      (chạy trước ở cửa sổ khác)
 *   npm run test:baocao
 */
import {
  expressionNumber,
  soulUrgeNumber,
  personalityNumber,
  birthdayNumber,
  attitudeNumber,
  personalYearNumber,
  birthChart,
  birthChartArrows,
} from "../src/lib/numerology";
import {
  EXPRESSION_READINGS,
  SOUL_READINGS,
  PERSONALITY_NUM_READINGS,
  BIRTHDAY_READINGS,
  ATTITUDE_READINGS,
  MATURITY_READINGS,
  PERSONAL_YEAR_READINGS,
  ARROW_READINGS,
  CHART_DIGIT_MEANINGS,
  ZODIAC_DEPTH,
  readingOf,
} from "../src/lib/numerology-content";
import { lapLaSo } from "../src/lib/tuvi";
import {
  CUNG_READINGS,
  CUC_READINGS,
  THAN_CU_READINGS,
  CHINH_TINH_READINGS,
  CANH_GIO_READINGS,
} from "../src/lib/tuvi-content";
import { zodiacRelations, menhRelations } from "../src/lib/zodiac-relations";
import { prisma } from "../src/lib/prisma";

const GOC = process.env.URL_THU ?? "http://localhost:3009";

let dat = 0;
let hong = 0;

function kiem(ten: string, dung: boolean, chiTiet = "") {
  if (dung) {
    dat++;
    console.log(`  PASS  ${ten}`);
  } else {
    hong++;
    console.log(`  FAIL  ${ten}${chiTiet ? ` — ${chiTiet}` : ""}`);
  }
}

(async () => {
  console.log("── Nội dung diễn giải ──");
  kiem("bài đọc Số sứ mệnh", EXPRESSION_READINGS.length >= 11, `${EXPRESSION_READINGS.length}`);
  kiem("bài đọc Số linh hồn", SOUL_READINGS.length >= 11);
  kiem("bài đọc Số nhân cách", PERSONALITY_NUM_READINGS.length >= 11);
  kiem("bài đọc Số ngày sinh", BIRTHDAY_READINGS.length >= 9);
  kiem("bài đọc Số thái độ", ATTITUDE_READINGS.length >= 9);
  kiem("bài đọc Số trưởng thành", MATURITY_READINGS.length >= 9);
  kiem("bài đọc Năm cá nhân đủ 9 năm", PERSONAL_YEAR_READINGS.length === 9);
  kiem("bài đọc 8 mũi tên biểu đồ", ARROW_READINGS.length === 8);
  kiem("ý nghĩa 9 chữ số biểu đồ", CHART_DIGIT_MEANINGS.length === 9);
  kiem("chiều sâu 12 con giáp", ZODIAC_DEPTH.length === 12);
  kiem("luận giải 12 cung tử vi", CUNG_READINGS.length === 12, `${CUNG_READINGS.length}`);
  kiem("luận giải 5 cục", CUC_READINGS.length === 5);
  kiem("luận giải thân cư", THAN_CU_READINGS.length >= 6);
  kiem("luận giải 14 chính tinh", CHINH_TINH_READINGS.length === 14, `${CHINH_TINH_READINGS.length}`);
  kiem("luận giải 12 canh giờ", CANH_GIO_READINGS.length === 12);

  // Yêu cầu của anh Khang: tuyệt đối không lẫn nội dung nghề may đo
  const chu = JSON.stringify([
    EXPRESSION_READINGS, SOUL_READINGS, PERSONALITY_NUM_READINGS,
    BIRTHDAY_READINGS, ATTITUDE_READINGS, MATURITY_READINGS,
    PERSONAL_YEAR_READINGS, ARROW_READINGS, ZODIAC_DEPTH,
    CUNG_READINGS, CUC_READINGS, THAN_CU_READINGS,
    CHINH_TINH_READINGS, CANH_GIO_READINGS,
  ]).toLowerCase();
  for (const t of ["mon amie", "vest", "suit", "veston", "cà vạt", "may đo", "cửa hàng"]) {
    kiem(`không còn nhắc "${t}"`, !chu.includes(t));
  }

  console.log("\n── Phép tính thần số học ──");
  const TEN = "Đặng Viên Khang";
  kiem("số sứ mệnh tính được", expressionNumber(TEN) >= 1 && expressionNumber(TEN) <= 22);
  kiem("số linh hồn tính được", soulUrgeNumber(TEN) >= 1);
  kiem("số nhân cách tính được", personalityNumber(TEN) >= 1);
  kiem("ba chỉ số theo tên đều có bài đọc", [
    readingOf(EXPRESSION_READINGS, expressionNumber(TEN)),
    readingOf(SOUL_READINGS, soulUrgeNumber(TEN)),
    readingOf(PERSONALITY_NUM_READINGS, personalityNumber(TEN)),
  ].every(Boolean));

  const d = new Date(1984, 1, 23, 12);
  kiem("số ngày sinh 23/2 = 5", birthdayNumber(d) === 5, String(birthdayNumber(d)));
  kiem("số thái độ tính được", attitudeNumber(d) >= 1 && attitudeNumber(d) <= 9);
  kiem("năm cá nhân 2026 trong 1–9", personalYearNumber(d, 2026) >= 1 && personalYearNumber(d, 2026) <= 9);

  const bd = birthChart(d);
  kiem("biểu đồ đếm đủ 9 ô", Object.keys(bd).length === 9);
  kiem("biểu đồ 23/2/1984 có số 2 lặp", bd[2] >= 2, `số 2 xuất hiện ${bd[2]} lần`);
  const mt = birthChartArrows(bd);
  kiem("nhận diện được mũi tên", Array.isArray(mt.present) && Array.isArray(mt.missing));

  console.log("\n── Lá số tử vi 12 cung ──");
  // Thử an sao cho nhiều giờ sinh và nhiều năm, bảo đảm không vỡ
  let loiLaSo = 0;
  for (const nam of [1975, 1984, 1990, 2000, 2005]) {
    for (const gio of [0, 6, 12, 18, 23]) {
      try {
        const ls = lapLaSo(new Date(nam, 4, 15, 12), gio);
        if (ls.palaces.length !== 12) loiLaSo++;
        if (!ls.cuc?.ten || !ls.menhChi || !ls.thanCu) loiLaSo++;
      } catch {
        loiLaSo++;
      }
    }
  }
  kiem("an sao được cho 25 tổ hợp năm × giờ", loiLaSo === 0, `${loiLaSo} lỗi`);

  const ls = lapLaSo(new Date(1984, 1, 23, 12), 12);
  kiem("lá số có đúng 12 cung", ls.palaces.length === 12);
  kiem("có cung Mệnh", ls.palaces.filter((p) => p.isMenh).length === 1);
  kiem("có cung an Thân", ls.palaces.filter((p) => p.isThan).length === 1);
  kiem("mọi cung đều có sao", ls.palaces.every((p) => p.stars.length > 0));
  kiem("có chính tinh ở Mệnh hoặc mượn từ Thiên Di",
    ls.menhChinhTinh.length > 0 || ls.borrowedStars.length > 0);
  kiem("đọc được âm lịch", ls.lunar.year > 1900 && ls.lunar.month >= 1 && ls.lunar.month <= 12);
  kiem("có tên cục", CUC_READINGS.some((c) => c.key === ls.cuc.ten), ls.cuc.ten);

  console.log("\n── Tuổi hợp / mệnh tương sinh ──");
  // Hai hàm này trả về các tuổi KHÁC trong nhóm (đã bỏ chính tuổi của mình ra)
  const qh = zodiacRelations("Tý");
  kiem("tam hợp Tý = Thân, Thìn", qh.tamHop.join(",") === "Thân,Thìn", qh.tamHop.join(","));
  kiem("tứ hành xung Tý có 3 tuổi khác", qh.tuXung.length === 3, qh.tuXung.join(","));
  kiem("lục hợp Tý = Sửu", qh.lucHop === "Sửu", qh.lucHop);
  const mq = menhRelations("Kim");
  kiem("Thổ sinh Kim", mq.duocSinh === "Thổ", mq.duocSinh);
  kiem("Hỏa khắc Kim", mq.biKhac === "Hỏa", mq.biKhac);

  console.log("\n── Trang hiển thị ──");
  const k = await prisma.khachTest.create({
    data: {
      name: "Người Thử Báo Cáo",
      phone: "0900000000",
      birthDate: new Date(1984, 1, 23, 12),
      birthHour: 12,
      noiSinh: "TP.HCM",
    },
  });
  const ck = `yba_test=${k.id}`;

  const ts = await (await fetch(`${GOC}/who-am-i/than-so-hoc`, { headers: { cookie: ck } })).text();
  for (const p of [
    "Số chủ đạo", "Biểu đồ ngày sinh", "Bộ chỉ số theo họ tên",
    "Các chỉ số theo ngày sinh", "Năm cá nhân",
    "Số sứ mệnh", "Số linh hồn", "Số nhân cách", "Số thái độ",
  ]) {
    kiem(`trang thần số học có mục "${p}"`, ts.includes(p));
  }
  kiem("báo cáo thần số học dài (> 40KB)", ts.length > 40000, `${Math.round(ts.length / 1024)}KB`);

  const tv = await (await fetch(`${GOC}/who-am-i/tu-vi`, { headers: { cookie: ck } })).text();
  for (const p of [
    "Lá số tử vi", "Luận giải lá số", "Ý nghĩa 12 cung",
    "Tuổi hợp", "Tam hợp", "Tứ hành xung", "ngũ hành", "Thân cư",
  ]) {
    kiem(`trang tử vi có mục "${p}"`, tv.includes(p));
  }
  kiem("báo cáo tử vi dài (> 40KB)", tv.length > 40000, `${Math.round(tv.length / 1024)}KB`);

  // Không có giờ sinh thì phải nhắc bổ sung, không được vỡ trang
  await prisma.khachTest.update({ where: { id: k.id }, data: { birthHour: null } });
  const tv2 = await fetch(`${GOC}/who-am-i/tu-vi`, { headers: { cookie: ck } });
  const h2 = await tv2.text();
  kiem("chưa có giờ sinh vẫn xem được trang", tv2.status === 200 && h2.includes("Tuổi hợp"));
  kiem("có nhắc bổ sung giờ sinh", h2.includes("Bổ sung giờ sinh"));

  await prisma.khachTest.delete({ where: { id: k.id } });

  console.log(
    `\n${hong === 0 ? `Tất cả ${dat} phép kiểm đều đạt.` : `${dat} đạt · ${hong} HỎNG.`}`
  );
  await prisma.$disconnect();
  if (hong) process.exit(1);
})();
