# Sàn giao thương nội bộ (xtm-app)

Phần mềm quản lý hội viên và ghi nhận giao dịch xúc tiến thương mại nội bộ —
dùng cho hội doanh nhân có khoảng 1.000 hội viên thường xuyên mua bán lẫn nhau.
Mục tiêu: **kích thích giao thương** và **vinh danh** hội viên bằng số liệu minh bạch.

## Quy trình nghiệp vụ

```
Hội viên A khai đơn  ──►  Đối tác B xác nhận  ──►  Ban điều hành duyệt  ──►  Vào báo cáo
   (hoặc thư ký nhập hộ ──► bỏ qua bước xác nhận ──►  chờ duyệt)
```

- Chỉ giao dịch **đã duyệt** mới được tính vào báo cáo và bảng vinh danh.
- Người khai không tự xác nhận được đơn của mình → số liệu thi đua đáng tin.
- Đơn có thể ghi nhận **hội viên giới thiệu** (bên thứ ba kết nối) để tính điểm kết nối.

## Vai trò

| Vai trò | Quyền |
|---|---|
| `ADMIN` — Ban điều hành | Duyệt / từ chối, quản lý hội viên, tài khoản, nhóm, xuất dữ liệu |
| `STAFF` — Thư ký | Nhập hộ giao dịch, quản lý hội viên, xem toàn bộ. **Không duyệt** |
| `MEMBER` — Hội viên | Khai đơn của mình, xác nhận đơn đối tác gửi, xem báo cáo tổng |

## Màn hình chính

| Đường dẫn | Nội dung |
|---|---|
| `/` | Tổng quan tháng, việc đang chờ chính mình xử lý, top bán / mua |
| `/giao-dich` | Danh sách + lọc theo trạng thái, kỳ, từ khoá. Admin duyệt hàng loạt |
| `/giao-dich/moi` | Khai đơn: chọn bên bán, bên mua, giá trị, người giới thiệu |
| `/hoi-vien` | Danh bạ hội viên, tìm theo ngành / sản phẩm đang bán / đang cần mua |
| `/hoi-vien/[id]` | Hồ sơ: doanh số bán, mua, giới thiệu, danh sách đối tác |
| `/bao-cao` | Số liệu theo kỳ, biểu đồ tháng, 3 bảng xếp hạng, xuất CSV cho Excel |
| `/vinh-danh` | Bảng vàng để chiếu tại buổi sinh hoạt hội (in ra giấy được) |
| `/mang-luoi` | Sơ đồ ai giao thương với ai + danh sách hội viên **chưa** giao thương |
| `/quan-tri` | Hội viên, tài khoản đăng nhập, nhóm/chi hội |

## Chạy trên máy

```bash
npm install
npx prisma db push          # tạo SQLite dev.db
npm run dev                 # http://localhost:3000
```

## Nhập danh sách hội viên

Danh sách nằm trên Google Sheet, chia sẻ ở chế độ **"Bất kỳ ai có đường liên kết"**.
Script **đọc theo tên cột trong dòng tiêu đề**, nên nhập được nhiều định dạng sheet
khác nhau miễn là có dòng tiêu đề chứa `STT` và `Tên Doanh Nghiệp`. Các cột được
nhận diện (có thì nhập, không có thì bỏ qua):

`NX` (xưng hô) · `Họ và lót` + `Tên` · `Chức vụ tại DN`/`Chức vụ` · `Tên Doanh Nghiệp`
· `Chức vụ Hội` · `Loại Hội viên` · `SĐT` · `Email Hội Viên` · `Website` · `Địa chỉ`
· `Quận` · `NGÀY SINH` · `Năm gia nhập hội` · `SL nhân viên` · `Ngành nghề`
· `Các sản phẩm/dịch vụ` · `Chi Hội`/`Khu vực` · `Thanh toán 20xx` (hội phí) · `Công nợ`

```bash
# Nhập phần đầu tiên, xoá sạch dữ liệu cũ
npm run nhap-hoi-vien -- "https://docs.google.com/spreadsheets/d/XXX/edit?gid=0" --xoa-cu

# Nhập thêm các phần sau (KHÔNG có --xoa-cu; người trùng tên+DN được cập nhật, không tạo trùng)
npm run nhap-hoi-vien -- "https://docs.google.com/spreadsheets/d/YYY/edit?gid=123"

# Ép tất cả vào một chi hội (khi sheet không có cột Chi Hội)
npm run nhap-hoi-vien -- "https://..." --chi-hoi "Chi hội Thủ Đức"
```

- `Chi Hội` (hoặc `Khu vực`) trở thành **chi hội**; trống ⇒ TP.HCM.
- Cập nhật là **merge**: chỉ ghi đè trường có dữ liệu mới, không xoá dữ liệu cũ
  (nhập phần 2 không làm mất `Chức vụ Hội` đã có từ phần 1).
- Một hội viên = **một cá nhân**; hai người cùng doanh nghiệp là hai hội viên riêng.
- Cột `Thanh toán 20xx` được nhập thành **lịch sử đóng hội phí** (xem module Hội phí).

## Module hội phí

Trang `/quan-tri/hoi-phi`: bảng hội viên × năm, ô ✓ xanh = đã đóng, bấm để đánh
dấu/bỏ. Lọc theo chi hội, theo "còn nợ năm nay", đánh dấu miễn hội phí. Hồ sơ hội
viên hiện tình trạng đóng phí từng năm (chỉ ban điều hành thấy).

## Cấp tài khoản cho hội viên

```bash
npm run tao-tai-khoan
```

Tạo tài khoản cho mọi hội viên chưa có: tên đăng nhập lấy theo mã hội viên
**tại thời điểm chạy** (`hv0001`…), mật khẩu ngẫu nhiên. Danh sách ghi ra
`tai-khoan-hoi-vien.csv` để mở bằng Excel và gửi cho từng người — **gửi xong
phải xoá file này**, hệ thống chỉ lưu mật khẩu đã mã hoá.

**Tên đăng nhập KHÔNG phải mã hội viên.** Mã hội viên đã được đánh lại
(`npm run danh-lai-ma`) còn tên đăng nhập giữ nguyên, nên hai dãy không trùng
nhau (ví dụ hội viên mã HV0001 có tên đăng nhập khác hẳn). Hội viên đăng nhập
bằng **tên đăng nhập hoặc số điện thoại đã đăng ký** + mật khẩu; mã hội viên
không dùng để đăng nhập. Hướng dẫn công khai cho hội viên: `/huong-dan-dang-nhap`.

- Hội viên tự đổi mật khẩu ở `/tai-khoan/doi-mat-khau` (trang Tổng quan có hộp
  "Thông tin đăng nhập" ghi tên đăng nhập + mã hội viên).
- Quên tên đăng nhập: thư ký tìm theo tên / doanh nghiệp / số điện thoại ở
  `/quan-tri/tai-khoan`; thẻ "Tài khoản còn mật khẩu mặc định" liệt kê tài
  khoản chưa đổi mật khẩu 123456.
- Đăng nhập sai nhiều lần thì máy đó phải chờ lùi dần (30 giây → tối đa 15
  phút), tài khoản KHÔNG bị khoá (`src/lib/gioi-han-dang-nhap.ts`).
- `npx tsx scripts/dong-bo-ten-tai-khoan.ts` xem các tài khoản mang tên giả từ
  dữ liệu mẫu (thêm `--ghi` để lấy tên theo hồ sơ hội viên).

Tài khoản ban điều hành / thư ký tạo ở màn hình `/quan-tri/tai-khoan`.

## Giao dịch mẫu (chỉ để xem thử)

```bash
npm run giao-dich-mau -- 500     # tạo 500 đơn mẫu giữa hội viên thật
npm run giao-dich-mau -- --xoa   # xoá sạch đơn mẫu trước khi dùng thật
```

Đơn mẫu được đánh dấu `[MẪU]` trong nội dung nên xoá lại chính xác,
không đụng vào đơn thật do hội viên khai.

```bash
npm run test:quyen          # kiểm tra nhanh các quy tắc phân quyền
npm run build               # kiểm tra TypeScript + build production
```

## Công nghệ

Next.js 16 (App Router, Turbopack) · TypeScript · Tailwind v4 · Prisma 6 · SQLite (dev).
Đăng nhập bằng cookie phiên tự ký HMAC (`src/lib/auth.ts`), chặn ở `src/proxy.ts`.
Toàn bộ phân quyền được **kiểm tra lại ở server** trong mỗi server action.

Xem `DEPLOY.md` để đưa lên VPS.
