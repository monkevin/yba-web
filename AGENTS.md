# Website YBA Chợ Lớn (ybacholon.vn)

Thay thế web WordPress cũ. Một dự án phục vụ ba khu vực:

| Nhóm route | Đường dẫn | Ai vào được |
| --- | --- | --- |
| `src/app/(web)/**` | `/`, `/gioi-thieu`, `/doanh-nghiep`, `/giao-thuong`, ... | **Công khai**, không cần đăng nhập |
| `src/app/(noi-bo)/**` | `/tai-khoan`, `/giao-dich`, `/hoi-vien`, `/bao-cao`, `/mang-luoi` | Hội viên đã đăng nhập |
| `src/app/(noi-bo)/quan-tri/**` | `/quan-tri/...` | Ban Chủ nhiệm (ADMIN) / thư ký (STAFF) |

Cổng: **3002** cho cả `npm run dev` lẫn `npm run start`. 3000 = pm-app,
3001 = daotao-app, 3003 = crm-khachhang, 3100 = xtm-app.

Anh Khang mở web bằng cách bấm đúp **`Mo-Web-YBA-Cho-Lon.bat`** ở thư mục gốc —
file này tự build nếu cần, chạy bản production rồi mở trình duyệt. Đừng xoá.

**Đây KHÔNG phải bản Next.js quen thuộc.** Next 16 có thay đổi phá vỡ: `middleware`
đổi thành `src/proxy.ts`, `cookies()` / `params` / `searchParams` đều async.
Đọc tài liệu trong `node_modules/next/dist/docs/` trước khi viết code.

## Quy tắc riêng của dự án

- **Mặc định là công khai.** `src/proxy.ts` chỉ chặn các nhánh liệt kê trong hằng
  `PROTECTED`. Thêm trang cần đăng nhập thì phải thêm vào đó, đừng dựa vào layout.
- Page trong khu nội bộ dùng `requireUserPage()` (`src/lib/auth.ts`), **không**
  dùng `(await getCurrentUser())!`. Next dựng layout và page song song nên layout
  không redirect kịp; cookie còn chữ ký hợp lệ mà tài khoản đã bị xoá cũng lọt
  qua proxy — viết `!` là sinh lỗi 500. Server action thì dùng `requireUser()`.
- Trang công khai **không được để lộ** số điện thoại / email hội viên cho khách
  vãng lai. Luôn truy vấn qua `src/lib/public.ts` (`PUBLIC_MEMBER`,
  `PUBLIC_LISTING`) thay vì tự viết điều kiện lọc.
- Hồ sơ ở trạng thái `CHO_DUYET` **vẫn hiện công khai** — cố ý như vậy, xem giải
  thích trong `PUBLIC_MEMBER`. Chỉ `NHAP` (bị trả lại) và `publicVisible = false`
  mới ẩn. Đừng "sửa" thành ẩn nếu chưa đọc lý do ở đó.
- Tin mua/bán mặc định **đăng là hiện ngay**. Ban Chủ nhiệm bật/tắt chế độ bắt
  buộc duyệt ở `/quan-tri/tin-dang`, lưu trong `SiteSetting` (`src/lib/cai-dat.ts`)
  — đừng hard-code trạng thái khi tạo tin, luôn hỏi `phaiDuyetTinDang()`.
- `publicListing()` là HÀM chứ không phải hằng, vì có so sánh hạn hiển thị với
  thời điểm hiện tại. Đừng đổi ngược thành hằng.
- Ảnh do người dùng tải lên đi qua `POST /api/tai-len` (bắt buộc đăng nhập, tối
  đa 5 MB, chỉ ảnh) và nằm trong `public/tai-len/` — thư mục này KHÔNG vào git,
  khi triển khai phải sao lưu riêng.
- Tên doanh nghiệp trong CSDL viết HOA theo Google Sheet của Hội; khi hiển thị
  luôn bọc qua `tenDoanhNghiep()` (`src/lib/ten-doanh-nghiep.ts`). Gặp thương
  hiệu viết tắt bị hạ chữ sai thì thêm vào danh sách `VIET_TAT` trong file đó,
  soát lại bằng `npx tsx scripts/thu-ten-doanh-nghiep.ts`.
- `src/lib/deal.ts` chứa quy tắc phân quyền thuần và **được import bởi client
  component** → tuyệt đối không import `@/lib/auth` vào đây (auth.ts dùng
  `next/headers`, sẽ vỡ build).
- **Phân quyền (đổi 24/09/2026, Chủ nhiệm chốt):** form hiện 6 vai trò
  (`VAI_TRO_CHON` trong quyen.ts) ánh xạ xuống cặp (role, `User.chucVu`):
  Admin / Chủ tịch / Phó Chủ tịch / Thư ký Chi hội đều là role `ADMIN` —
  **permissions TRỐNG = toàn quyền, CÓ danh sách tích = chỉ còn đúng các
  quyền đó** ("muốn xem ít thôi"); Ban Điều hành = role `STAFF` (phải tích
  mới có quyền); Hội viên = `MEMBER`. `co()` cài đúng luật này; action
  `luuQuyen` chặn tự giới hạn chính mình mà bỏ quyền Quản lý tài khoản
  (tự khoá cửa). LƯU Ý: chỗ nào check thẳng `role === "ADMIN"` (isAdmin,
  guard "chỉ Chủ nhiệm…") thì cả 4 chức lãnh đạo đều qua — giới hạn tích
  chỉ áp cho các trang đi qua `requireQuyen`/`co()`. Nút "Đổi tên" ở
  /quan-tri/tai-khoan đổi được tên hiển thị + tên đăng nhập (action
  `doiTen`); tài khoản gắn hồ sơ sẽ bị dong-bo-tai-khoan đè lại theo hồ
  sơ. Danh sách 15 quyền và các hàm `co()`, `coQuyenQuanTri()` nằm ở
  `src/lib/quyen.ts` — file này được client component import nên
  **không** được import `auth`/`prisma`.
- Trang trong `(noi-bo)/quan-tri` phải gọi `requireQuyen(QUYEN.X)`; server action
  tương ứng phải kiểm tra lại bằng `co(user, QUYEN.X)`. Kiểm tra ở trang là để
  giao diện đẹp, kiểm tra ở action mới là thứ thật sự chặn.
- Mọi server action phải tự gọi `requireUser()` và kiểm tra quyền lại ở server.
  Không tin vào việc UI đã ẩn nút.
- Cấu hình giao diện (banner, màu, logo, liên hệ) đọc qua `docGiaoDien()`
  (`src/lib/giao-dien.ts`), lưu trong bảng `SiteSetting` với tiền tố `gd.`.
  Nội dung trang tĩnh đọc qua `docTrang(slug)` (`src/lib/trang-tinh.ts`) — chưa có
  bản ghi thì trang tự dùng nội dung mặc định viết trong mã nguồn.
- **Hotline / email / địa chỉ / fanpage / slogan hiện ở trang công khai phải
  đọc từ `docGiaoDien()`**, KHÔNG đọc thẳng `SITE.*` — thư ký đổi ở
  /quan-tri/giao-dien mà trang đọc SITE cứng là hai nơi hiện hai số khác nhau
  (lỗi từng có ở /lien-he, /dat-lich, /tai-tro…). `SITE` chỉ còn là giá trị
  mặc định và các hằng hiếm đổi (term, areas, founded). Metadata cần liên hệ
  thì dùng `generateMetadata()` async như /lien-he.
- Mỗi slug khai trong `TRANG_TINH` phải có trang công khai THẬT đọc
  `docTrang(slug)` — thêm ô soạn mà không nối là thư ký lưu vào hư không
  (lỗi từng có với `quyen-loi-hoi-vien`). `/dieu-le` chỉ hiện khi đã soạn
  nội dung, chưa soạn trả 404 — cố ý, đừng thêm bản mặc định cho điều lệ.
- Chỉ giao dịch trạng thái `DA_DUYET` mới được tính vào báo cáo — dùng
  `approvedIn(period)` trong `src/lib/stats.ts`, đừng viết lại điều kiện lọc.
  Trang công khai `/xuc-tien-thuong-mai` và báo cáo nội bộ `/bao-cao` dùng chung
  các hàm này nên số liệu luôn khớp; `npm run test:chiso` canh điều đó.
- Mỗi giao dịch bắt buộc có `partnerScope` (nội Chi hội / liên chi hội / liên hội
  / ngoài Hội). Đây là căn cứ tách chỉ số ba cấp — validate bằng `loiPhamVi()`
  trong `src/lib/deal.ts`, đừng kiểm tra tay ở từng nơi.
- Mỗi `Member` / `Listing` / `Post` / `Event` đều có `slug` **duy nhất** dùng làm
  URL. Tạo bản ghi mới thì sinh slug bằng `uniqueSlug()` trong `src/lib/slug.ts`.
- Tìm kiếm tiếng Việt không dấu: lưu sẵn `searchText` đã chuẩn hoá bằng
  `normalizeSearch()` (`src/lib/search.ts`), tìm bằng `contains` trên cột đó.
- Giao diện hoàn toàn tiếng Việt, tiền tệ VND. Màu: navy `#2e4082`, đỏ `#c8102e`,
  nền trắng — xem `src/app/globals.css` và skill `brand-yba`.
- **Chữ:** thân bài Be Vietnam Pro, tiêu đề lớn (h1/h2/`.section-title`)
  Playfair Display, khai bằng `next/font/google` ở `src/app/layout.tsx`. Bắt
  buộc `subsets: ["latin","vietnamese"]` — thiếu là dấu tiếng Việt rơi về font
  dự phòng, chữ có dấu và không dấu lệch nhau. `next/font` tải font về lúc dựng
  bản và phục vụ từ chính tên miền này, KHÔNG gọi ra Google lúc người xem mở
  trang — đừng thay bằng thẻ `<link>` tới fonts.googleapis.com.
- **Tông "máu lửa" Chợ Lớn:** ngoài navy/đỏ chuẩn YBA còn có thang `son-*`
  (đỏ huyết dụ `#7c0717` → đỏ tươi `#e62039`, lấy từ chinesechamber.com) và
  `nga-*` (kem ngà). Đỏ son CHỈ dùng cho các dải nền tối lớn — đầu trang, dải
  kêu gọi, chân trang — qua lớp `.san-do`. Đừng đổ đỏ son lên nền trắng của
  nội dung hay lên thẻ nhỏ: chữ khó đọc và trông rẻ tiền. Navy vẫn là màu nền
  tảng, `.san-do` có sẵn một vùng navy ở góc dưới nên không mất chất YBA.
  CẢNH GIÁC: `.san-do` và `.luoi-ky-thuat` cùng khai `background-image` — đặt
  cả hai lên MỘT phần tử phải có rule gộp `.san-do.luoi-ky-thuat` trong
  globals.css (đã có sẵn, kèm `mask-image: none`), thiếu nó là lớp lưới đè mất
  nền đỏ, cả dải thành trắng bệch chữ trắng (lỗi đã lên web 07/08). Trên dải
  đỏ son dùng chữ `text-white/60…90`, `text-son-*`, `text-do-200/300` — ĐỪNG
  dùng `text-navy-100/200/300` (tông xanh vốn cho nền navy, lên nền đỏ vừa
  xỉn vừa lệch màu); riêng chữ cái thay ảnh `font-bold text-navy-300` nằm
  trên nền sáng thì giữ.
- **Bộ hiệu ứng "công nghệ"** (gợi ý từ y-n10.com, nhưng KHÔNG dùng WebGL):
  `LuoiDiem` (lưới chấm sáng theo con trỏ, canvas 2D), `DemSo` (số chạy lên),
  `TheSang` (vệt sáng bám chuột — bọc NGOÀI cả lưới thẻ, mỗi thẻ chỉ cần thêm
  lớp `.the-sang`), `ThanhCuon` (vạch tiến trình cuộn), `KvHoi` (huy hiệu KV
  có quầng thở + vệt loé). Các lớp CSS đi kèm: `.san-do`, `.luoi-ky-thuat`,
  `.vien-chay`, `.tho-sang`, `.quet-sang`, `.chu-lua`, `.vong-quay`.
  Tất cả tự tắt khi người dùng bật "giảm chuyển động"; `LuoiDiem` còn tự tắt
  trên màn cảm ứng, khi cuộn ra khỏi màn hình và khi đổi sang tab khác.
- **Khối chân dung Ban Chủ nhiệm nằm ở `/gioi-thieu`** (chuyển khỏi trang chủ
  07/08 theo yêu cầu anh Khang), trang chủ chỉ còn khối video — đừng thêm lại.
  Trang `/ban-chap-hanh`: mỗi người chỉ hiện THẺ ẢNH một lần; Phó Chủ nhiệm
  kiêm Trưởng ban xuất hiện ảnh ở nhóm Ban Chủ nhiệm, xuống ban của họ chỉ còn
  dòng "Phụ trách: …" — dữ liệu Leader vẫn giữ cả hai bản ghi, chỉ giao diện
  lọc theo tên.
- **KV (key visual) của Chi hội** đọc từ `docGiaoDien().kv`, Ban Chủ nhiệm tải
  lên ở /quan-tri/giao-dien. CHƯA có ảnh thì `KvHoi` không hiện gì cả — cố ý:
  KV là nhận diện chính thức, đừng tự vẽ hình na ná thay thế. Sáu chữ trên
  vành KV ghi ở `GIA_TRI_KV` (`src/lib/site.ts`), khác với `slogan` 4 chữ.
- **Hiệu ứng hiện dần khi cuộn:** bọc khối bằng `HienDan`
  (`src/components/web/HienDan.tsx`), dùng `the="section"` để không sinh thẻ bọc
  thừa, `cho={n}` để các thẻ hiện lần lượt. Chạy bằng `IntersectionObserver`, tự
  tắt khi người dùng bật "giảm chuyển động"; máy tắt JavaScript thì thẻ
  `<noscript>` trong layout ép hiện lại. Hiệu ứng chỉ là lớp trang trí —
  **không bao giờ được giấu mất nội dung**.
- Đừng đặt chữ nhỏ hơn 11px ở khu công khai (`npm run test:dienthoai` chặn).
  Cần mũi tên / biểu tượng nhỏ thì vẽ bằng SVG chứ đừng thu ký tự xuống 10px.

## Dữ liệu

- `prisma/du-lieu-chi-hoi.ts` — dữ liệu **thật** chép từ Profile Chi hội (Ban Chủ
  nhiệm, ngành nghề, nhóm sinh hoạt, doanh nghiệp trong Profile). Sửa file này
  khi Chi hội thay đổi nhân sự.
- `prisma/seed.ts` — nạp dữ liệu thật ở trên + sinh hội viên / giao dịch / tin
  đăng **mẫu** để xem thử giao diện.
- `scripts/nhap-hoi-vien.ts` — nhập danh sách hội viên thật từ Google Sheet đã
  chia sẻ công khai hoặc file CSV.
- `scripts/cat-anh-ban.py` — cắt ảnh chân dung nhân sự các ban từ file PDF Profile
  vào `public/ban-chu-nhiem/` (cần Python + PyMuPDF + Pillow).
- **`docker-entrypoint.sh` (bản trong repo là bản CHUẨN cho máy chủ)**:
  chỉ `prisma db push` rồi chạy server — TUYỆT ĐỐI không thêm lại dòng
  chạy `prisma/seed.ts`. Máy chủ thật từng dùng bản entrypoint (bên ngoài
  viết) có `tsx prisma/seed.ts || true` chạy MỖI lần container khởi động:
  seed `user.deleteMany()` + xoá deal/listing/post/award/leader nên cứ
  build xong là bay tài khoản thật (sự cố 24–25/09/2026, mất kimngan/
  kieulinh/65 tài khoản hội viên hai lần). `prisma/seed.ts` nay có PHANH
  AN TOÀN: gặp NODE_ENV=production, >40 user hoặc có KhachMoi1010 là tự
  dừng, chỉ chạy với cờ `--cho-phep-xoa`.
- **Triển khai bằng Docker**: `Dockerfile` + `docker-compose.yml` +
  `HUONG-DAN-DOCKER.md` (hướng dẫn từng bước cho anh Khang). `next.config.ts`
  đặt `output: "standalone"` — ảnh Docker chỉ chép `.next/standalone` chứ không
  chép `node_modules`, ĐỪNG bỏ dòng đó. CSDL và ảnh tải lên nằm ở hai ổ đĩa gắn
  ngoài (`./du-lieu`, `./tai-len`) nên nâng cấp không mất dữ liệu.
  `docker/khoi-dong.sh` chạy `prisma db push` mỗi lần khởi động — thêm bảng/cột
  mới tự áp lên máy chủ.
- `scripts/xoa-giao-thuong-mau.ts` (`npm run xoa-giao-thuong -- --dong-y`) —
  xoá giao dịch mẫu + vinh danh tính từ nó + vài bản ghi thử; GIỮ tin chợ nhu
  cầu và tài trợ sự kiện thật. Đã chạy 27/07/2026: xoá 1.200 giao dịch giả
  (239 tỷ), 1 kỳ + 9 giải vinh danh. `/xuc-tien-thuong-mai` về 0 là ĐÚNG.
- `scripts/xoa-du-lieu-mau.ts` — xoá giao dịch / tin đăng / vinh danh mẫu, giữ
  nguyên hội viên, Ban Chủ nhiệm và sự kiện thật. Mặc định chỉ XEM TRƯỚC; phải
  thêm `-- --dong-y` mới xoá thật.
- `scripts/tao-tai-khoan.ts` — tạo tài khoản hàng loạt cho hội viên chưa có
  (username = mã HV **lúc tạo**, mật khẩu ngẫu nhiên, xuất `tai-khoan-hoi-vien.csv`
  — file này KHÔNG vào git, gửi xong phải xoá).
- `scripts/tao-tai-khoan-hoi-phi.ts` — tạo tài khoản theo danh sách ĐÓNG
  HỘI PHÍ (Chủ nhiệm chốt 24/09/2026): username = mã HV thường, **mật
  khẩu mặc định = SĐT hội viên** (chủ đích để BĐH dễ phổ biến, dù dễ
  đoán); mặc định xem trước, `--ghi` mới chạy; `--khoa-chua-dong` khoá
  tài khoản MEMBER chưa đóng phí năm mốc và mở lại người đã đóng (không
  bao giờ đụng tài khoản ban); `--cap-lai-mk-sdt` đè mật khẩu = SĐT cho
  cả tài khoản đã có (đè cả người đã tự đổi — cân nhắc); `--tat-ca` tạo
  không phân biệt hội phí. Chạy trên máy chủ qua
  `docker compose exec yba-web npx tsx scripts/tao-tai-khoan-hoi-phi.ts --ghi`.
- **ĐĂNG NHẬP (từ 16/09/2026): tên đăng nhập HOẶC số điện thoại + mật khẩu.**
  Mã hội viên KHÔNG dùng để đăng nhập: `danh-lai-ma` đã đánh số lại 26/07 nên
  username hv0xxx là mã CŨ, 0/257 tài khoản trùng mã hiện tại (anh Khang =
  `hv0018`, mã HV0001). Lõi ở `src/lib/dang-nhap.ts` (tìm theo username trước,
  rồi theo `Member.phone` đã chuẩn hoá — phải khớp ĐÚNG MỘT hội viên đang sinh
  hoạt), `src/lib/so-dien-thoai.ts` (`chuanSoDienThoai`, `soDienThoaiDeLuu` —
  mọi đường ghi SĐT phải đi qua), `src/lib/gioi-han-dang-nhap.ts` (sai 5 lần thì
  chờ lùi dần theo cặp định danh + IP, CỘNG trần riêng theo định danh 20 lần /
  60 giây vì `X-Forwarded-For` giả được — thiếu trần này thì vào thẳng cổng
  3002 là dò mật khẩu không giới hạn; KHÔNG khoá `User.active` để không ai ép
  khoá tài khoản người khác). Kiểm `?tiep=` phải soát CẢ chuỗi kết quả sau khi
  phân giải URL — `/..//evil.example` từng lọt bộ lọc chỉ soát chuỗi gõ vào. Mọi kiểu thất
  bại trả CÙNG một thông báo và luôn chạy bcrypt một lần (không dò được tài
  khoản nào có thật). Trang `/huong-dan-dang-nhap` (công khai) giải thích cho
  hội viên; hội viên tự đổi mật khẩu ở `/tai-khoan/doi-mat-khau`; quản trị có
  nút "Kiểm tra mật khẩu mặc định" ở `/quan-tri/tai-khoan`. Cookie còn hợp lệ
  mà tài khoản bị khoá thì chuyển `/login?het=1` (proxy để yên và xoá cookie) —
  trước đây lặp vô hạn giữa `/login` và `/tai-khoan`.
- **Mã hội viên mới** lấy qua `maHoiVienTiepTheo` (chỉ xét mã khớp `^HV\d+$`):
  trước 16/09 lấy max theo chuỗi nên ra `KDZ003` và kết nạp hội viên mới lỗi.
- **Gắn tài khoản với hồ sơ hội viên** ở `/quan-tri/tai-khoan` (từ 16/09/2026):
  tài khoản quản trị (admin, thuky…) bấm "Gắn hồ sơ hội viên" để hiện tên
  người + doanh nghiệp trong game, bảng xếp hạng, giao dịch và nhận Nhiệm vụ
  Huynh đệ. `User.memberId` là khoá duy nhất: hồ sơ đang thuộc tài khoản khác
  thì action `ganHoiVien` trả `canChuyen` + `chuyenTuId` và chỉ chuyển khi người
  dùng tích xác nhận ĐÚNG tài khoản đã cảnh báo (tài khoản cũ vẫn đăng nhập,
  mất liên kết). Form trong `TaiKhoanPanel` gửi qua `guiGiuForm` (onSubmit +
  startTransition) vì `<form action>` bị React 19 tự reset khi máy chủ báo lỗi
  — ô chọn vai trò nhảy về mặc định mà state vẫn giữ vai trò cũ. Cách còn lại: dòng tài
  khoản hội viên có nút "Quyền" để nâng lên Chủ nhiệm / cán bộ ban.
- Kết nạp hội viên mới: khách nộp form `/dang-ky-hoi-vien` → Ban Hội viên bấm
  "Kết nạp thành hội viên" ở `/quan-tri/noi-dung/dang-ky` (action `duyetVaKetNap`)
  → tự tạo Member + User, mật khẩu hiện MỘT LẦN trong thông báo. Có chặn trùng
  theo tên doanh nghiệp và số điện thoại.
- **Thứ tự ưu tiên hội viên** tập trung ở `src/lib/xep-hang.ts`: dùng
  `THU_TU_HOI_VIEN` cho mọi nơi liệt kê hội viên và `THU_TU_TIN_DANG` cho chợ
  nhu cầu — ĐỪNG viết orderBy riêng ở từng trang. Trật tự: người còn sinh hoạt
  trước người đã rời hội → cấp bậc (Chủ nhiệm 0, Phó 1, BCH 2…) → đã đóng phí →
  doanh nghiệp lớn (≥100 nhân sự). Tính lại: `npm run xep-hang -- --ghi`.
- **Mã hội viên** đánh theo đúng thứ tự trên: HV0001 là Chủ nhiệm.
  `npm run danh-lai-ma -- --ghi`; script tự tính lại `searchText` (mã nằm
  trong cột tìm kiếm). **Tên đăng nhập LUÔN = mã hội viên hiện tại viết
  thường** (Chủ nhiệm chốt 21/09/2026, thay quy tắc cũ "giữ nguyên username")
  — nên đánh lại mã xong BẮT BUỘC chạy `npm run dong-bo-tai-khoan -- --ghi`
  để tên đăng nhập khớp mã mới; hội viên quên tên mới vẫn đăng nhập được bằng
  số điện thoại. Trước 21/09 hai dãy lệch nhau (username = mã cũ) làm Chủ
  nhiệm gõ mã mình mà ra người lạ — đừng quay lại kiểu đó.
- `npm run dong-bo-tai-khoan -- --ghi` — đồng bộ `User.name` theo tên hội viên
  nó trỏ tới + tính lại `searchText` toàn bộ. Sinh ra vì 30 tài khoản
  hv0001–hv0030 là di sản seed chạy thử: mang TÊN MÁY SINH ("Lê Tuấn Mai"…)
  và mật khẩu 123456 dù đã nối vào hội viên thật — Chủ nhiệm đăng nhập thấy
  tên người lạ (20/09/2026). Cờ `--cap-lai-123456` cấp mật khẩu ngẫu nhiên
  cho tài khoản HỘI VIÊN còn 123456 và in bảng ra màn hình (không đụng
  ADMIN/STAFF). Chạy được trên máy chủ qua
  `docker compose exec web npx tsx scripts/dong-bo-tai-khoan.ts --ghi`.
- `npm run kiem-tra-admin` / `npm run kiem-tra-mat-khau` — soát tài khoản
  quản trị và tình trạng mật khẩu (còn 123456 / còn khởi tạo / đã đổi), chỉ
  đọc. KHÔNG có cách xem mật khẩu hiện tại của ai — băm một chiều, đó là chủ
  đích; muốn cấp lại thì đổi ở /quan-tri/tai-khoan.
- **KHÔNG tự động đánh dấu ai rời hội.** Ban Chủ nhiệm đã chốt: chưa đóng hội
  phí chỉ là chưa đóng phí, hồ sơ và doanh nghiệp của họ vẫn hiển thị bình
  thường, chỉ xếp sau người đã đóng. `trangThai = ROI_HOI` chỉ dùng khi Ban Chủ
  nhiệm đánh dấu tay. Bộ `test:uutien` có ca chặn việc này tái diễn.
- **Lịch hoạt động** có trang chi tiết riêng `/lich-hoat-dong/[slug]` với đăng ký
  THAM_GIA / TAI_TRO. Hội viên đăng nhập thì form điền sẵn từ hồ sơ. Mọi đăng ký
  vào `CHO_DUYET`; chỉ khi Ban Tổ chức duyệt (`DA_DUYET`) tên mới hiện trên web.
  Ban Tổ chức cũng tự thêm người được (`doBTCThem = true`, duyệt luôn) — dùng cho
  người đăng ký qua Zalo hoặc gọi điện. Mục mới tạo ở quản trị tự sinh slug.
- **Mẫu Excel cho thư ký** ở `public/mau/`, sinh bằng
  `python scripts/tao-mau-su-kien.py`. Dòng ví dụ phải nằm ở sheet
  "5. Ví dụ điền mẫu" — KHÔNG để trong sheet dữ liệu, vì API đọc mọi dòng có nội
  dung nên ví dụ sẽ bị nhập thành người thật. Xử lý upload ở
  `src/app/api/su-kien/nhap/route.ts` (dùng thư viện `xlsx`).
- Hội viên **đã đóng hội phí** được ưu tiên hiện lên trước ở danh bạ và chợ nhu
  cầu. Prisma không sắp xếp được theo quan hệ "có bản ghi FeePayment năm nay",
  nên năm đóng gần nhất ghi sẵn ở `Member.feePaidYear`; mọi thay đổi hội phí phải
  gọi `dongBoNamDongPhi()` trong `src/lib/hoi-phi.ts`. Chạy lại toàn bộ:
  `npm run dong-bo-hoi-phi`.
- Video lấy từ kênh YouTube Chi hội qua nguồn RSS công khai (không cần khoá API),
  chỉ được 15 video mới nhất — video cũ hơn thêm tay ở `/quan-tri/noi-dung/video`.
  `npm run nhap-video` để nạp lại.
- `ThuVienAnh` (client) là bộ xem ảnh phóng to dùng chung cho album sự kiện và
  hình ảnh hồ sơ doanh nghiệp. `VideoNhung` chỉ nạp iframe YouTube khi người xem
  bấm phát, tránh trang nặng.
- **Chân dung doanh nhân** (`/tai-khoan/chan-dung`) — 4 công cụ cho hội viên:
  thần số học, tử vi tham khảo, tính cách điều hành, khí chất doanh nhân. Chuyển
  từ `daotao-app` sang nhưng **viết lại toàn bộ diễn giải cho chủ doanh nghiệp**;
  tuyệt đối không gắn Mon Amie, vest hay ngành hàng cụ thể nào — `npm run
  test:chandung` có ca kiểm tra chặn các từ đó. Phần tính toán ở
  `src/lib/chan-dung.ts`, chữ nghĩa ở `chan-dung-noi-dung.ts` và
  `khi-chat-noi-dung.ts`. Kết quả lưu ở bảng `ChanDung` (riêng tư, gắn theo
  memberId, không hiện ở hồ sơ công khai).
- Báo cáo **thần số học** và **tử vi** dùng chung hai component
  `src/components/chan-dung/BaoCaoThanSo.tsx` và `BaoCaoTuVi.tsx` cho cả khu
  công khai lẫn khu hội viên — sửa một chỗ là cả hai nơi đổi theo.
  Thư viện tính toán: `numerology.ts` (11 chỉ số + biểu đồ ngày sinh + 8 mũi
  tên), `tuvi.ts` (an sao lá số 12 cung), `lunar.ts` (đổi âm lịch),
  `zodiac-relations.ts` (tam hợp / tứ hành xung / ngũ hành).
  Diễn giải: `numerology-content.ts` (~1500 dòng), `tuvi-content.ts`.
  **Lá số tử vi cần GIỜ SINH** (`birthHour`, 0–23) — không có giờ thì trang vẫn
  chạy nhưng ẩn phần lá số và nhắc bổ sung.
- **WHO AM I?** có HAI bản: bản công khai `/who-am-i` cho khách (khai thông tin
  liên hệ trước khi xem kết quả, phiên lưu bằng cookie `yba_test`, dữ liệu vào
  bảng `KhachTest` → xem ở `/quan-tri/khach-test` và tải CSV) và bản hội viên
  `/tai-khoan/chan-dung` (gắn theo memberId). Hai bản dùng chung phần tính toán
  và nội dung ở `src/lib/chan-dung*.ts`.
- Ảnh chân dung Ban Chủ nhiệm trích từ PDF bằng `python scripts/cat-anh-ban.py`
  — render ở 560 dpi, KHÔNG hạ xuống vì mỗi trang xếp 3–5 ảnh ngang, dpi thấp
  cho ra ảnh ~150px và bị mờ. Mỗi nhân sự có trang riêng `/ban-chap-hanh/[slug]`
  (`npm run slug-ban-chu-nhiem` để sinh slug cho người mới thêm).
- Đi thăm doanh nghiệp có 5 trạng thái, luồng ở `src/lib/tham-dn.ts`:
  DE_XUAT → DA_DUYET (mở đăng ký) → DA_DONG → DA_TO_CHUC.
- Gói tài trợ nhập theo **triệu đồng** ở form nhưng lưu VND trong DB.
  `npm run tao-goi-tai-tro` tạo sẵn 2 chương trình + 4 gói 100/50/30/10 triệu.
- KHÔNG bịa nội dung cho doanh nghiệp thật. `scripts/lam-lich-su.ts` chỉ ghi mốc
  lấy từ dữ liệu có thật (năm thành lập, năm gia nhập, chức vụ trong Hội).
- `scripts/tai-logo.ts` — tải logo từ website hội viên vào `public/logo/`, ưu
  tiên apple-touch-icon, loại ảnh bìa ngang bằng kiểm tra tỉ lệ. Chạy lại với
  `--lam-lai` để tải đè. Logo sai thì sửa tay ở /quan-tri/ho-so.
- `scripts/viet-lai-gioi-thieu.ts` — sinh bài giới thiệu đa giọng từ
  `prisma/van-mau-gioi-thieu.ts`; không đè hồ sơ đọc từ website chính thức
  (`prisma/gioi-thieu-tu-website.ts`) và hồ sơ đang CHO_DUYET.
- `scripts/ap-bao-chi.ts` — gán liên kết bài báo (cột `Member.pressLinks`, JSON
  `[{title,url,source}]`). CHỈ thêm liên kết biết chắc tồn tại.
- **Fanpage hội viên** hiện ở cuối hồ sơ công khai qua `FanpageHoiVien`
  (`src/components/web/`). Đường dẫn do hội viên tự khai nên phải lọc qua
  `chuanFanpage()` — chỉ nhận trang facebook.com thật, loại nhóm / sự kiện /
  video / trang cá nhân `profile.php` (Page Plugin không nhúng được trang cá
  nhân). Nhập hàng loạt: `npm run nhap-fanpage -- file.csv` (cột: mã HV hoặc
  tên DN, link). `npm run test:fanpage` kiểm cả bộ lọc lẫn hiển thị.
- `scripts/tim-fanpage.ts` (`npm run tim-fanpage`) — dò fanpage từ **website
  chính thức** của hội viên, chỉ nhặt link họ tự đặt ở chân trang, không tìm
  kiếm ngoài, không đoán theo tên. Hồ sơ đã có fanpage thì giữ nguyên. Website
  hay nhắc trang của bên thứ ba (công ty làm web, khách hàng, hãng cấp chứng
  chỉ) — các mã đó ghim trong hằng `XEM_TAY` để Ban Chủ nhiệm tự vào
  /quan-tri/ho-so → Sửa hộ, script KHÔNG tự ghi. Kết quả lần chạy gần nhất ở
  `soat/fanpage-hoi-vien.md`.
- `scripts/sua-loi-chinh-ta.ts` (`npm run sua-chinh-ta`) — sửa lỗi chính tả
  trong dữ liệu hội viên theo danh sách ghim cứng TỪNG MÃ HỘI VIÊN, không thay
  thế toàn cục ("giay" nơi này là "giấy", nơi khác là "giày"). Sửa offering
  xong phải chạy lại `viet-lai-gioi-thieu -- --ghi`; tin đăng đã sinh từ dữ
  liệu cũ thì sửa riêng. Từ nghi thiếu dấu nhưng KHÔNG chắc (cao su, mật ong,
  rượu vang, xay xát, Dai-ichi…) — đừng đưa vào danh sách.
- **Quy mô Chi hội công bố ra ngoài** luôn dùng `SITE.quyMoCongBo`
  ("trên 150 hội viên" — Ban Chủ nhiệm chốt), KHÔNG lấy số hồ sơ trong CSDL:
  257 hồ sơ gồm cả người đã ngưng sinh hoạt và doanh nghiệp ngoài Hội. Web cũ
  từng ghi ba con số khác nhau ở ba trang, đừng lặp lại.
- Chi hội có HAI khẩu hiệu: `SITE.slogan` ("Dấn thân – Đổi mới – Đột phá –
  Vươn tầm") và `SITE.sloganPhu` ("Kết nối – Sẻ chia – Kiến tạo giá trị").
- Nội dung về Hội cấp trên (`HOI_CAP_TREN`), mục tiêu nhiệm kỳ
  (`MUC_TIEU_NHIEM_KY`) và điều kiện gia nhập (`DIEU_KIEN_GIA_NHAP`) đều ở
  `src/lib/site.ts`, chép NGUYÊN VĂN từ web cũ — đừng viết lại cho "hay hơn".
- **Bài viết nhập từ web cũ** là HTML, không phải chữ thuần. Trang bài kiểm
  bằng `laHtml()` rồi lọc qua `locHtmlBaiViet()` (`src/lib/html-an-toan.ts`)
  mới cho hiện — danh sách trắng hẹp, ảnh chỉ nhận đường dẫn nội bộ. ĐỪNG đổ
  thẳng `dangerouslySetInnerHTML` với nội dung chưa lọc. Kiểu chữ thân bài ở
  lớp `.bai-viet` trong globals.css.
- `Post.chuyenMuc` là chuyên mục bản tin (Tin tức, Kinh tế – Thị trường, Dự án,
  Chân dung hội viên, Kết nối – Hợp tác…), bộ lọc ở /tin-tuc đọc thẳng từ dữ
  liệu nên thêm chuyên mục mới không phải sửa mã. `Post.nguon` có giá trị thì
  trang bài hiện dòng ghi nguồn — BẮT BUỘC với tin lấy lại từ Hội cấp trên, để
  người đọc không nhầm là hoạt động do Chi hội tổ chức. `Post.suKienSlug` nối
  bài với sự kiện, hai trang dẫn qua lại lẫn nhau.
- `scripts/nhap-bai-viet-cu.ts` (`npm run nhap-bai-cu -- --ghi`) — nhập bài từ
  web cũ, TẢI ẢNH VỀ `public/tin-tuc/<slug>/` chứ không nhúng link web cũ.
- `scripts/cao-web-cu.ts` (`npm run cao-web-cu`) — cào toàn bộ web cũ
  ybacholon.vn qua REST API WordPress vào `soat/web-cu/`;
  `npm run doi-chieu-cu` so với web mới, `npm run bo-sung-cu -- --ghi` bổ sung.
  Kết quả đối chiếu gần nhất: `soat/web-cu/bao-cao-doi-chieu.md`.
- `npm run test:onhap` — quét mã nguồn tìm ô nhập khai màu chữ tối mà quên khai
  nền. Tailwind để nền ô nhập TRONG SUỐT, đặt ô như vậy trên khối nền tối thì
  người gõ không thấy chữ mình gõ. Chạy được cả khi web đang tắt.
- `scripts/tao-anh-chia-se.py` — dựng lại `public/og-image.png` (ảnh hiện khi
  chia sẻ link lên Facebook/Zalo). Chạy lại khi đổi slogan hoặc nhận diện.
- `scripts/toi-uu-anh.py` — thu nhỏ và nén ảnh trong `public/`. Chạy sau mỗi lần
  nhập lô ảnh mới, chạy lại nhiều lần an toàn.
- `scripts/sao-luu.sh` — sao lưu CSDL + ba thư mục ảnh trên máy chủ (cron hằng ngày).
- **Sự kiện 2026** nhập bằng hai bước: `python scripts/doc-noi-dung-docx.py
  "SỰ KIỆN YBA CHỢ LỚN 2026"` rút chữ từ `NỘI DUNG.docx` của từng thư mục ra
  `soat/su-kien-2026.json`, rồi `npm run nhap-su-kien-2026 -- --ghi` chép ảnh
  sang `public/su-kien/<slug>/` và ghi vào CSDL. Sự kiện KHÔNG tìm được ngày
  trong file thì vẫn nhập đủ ảnh nhưng để `published = false` — thà chưa hiện
  còn hơn hiện sai ngày; Ban Chủ nhiệm điền ngày ở /quan-tri rồi bật.
  Địa điểm rút bằng `tim_dia_diem()`: văn bản viết theo lối kể chuyện nên sau
  chữ "tại" thường dính cả câu, hàm này cắt ở chỗ bắt đầu kể và BỎ HẲN nếu kết
  quả vẫn giống câu văn — để trống tốt hơn là ghi sai.
- `scripts/nhap-su-kien.ts` — nhập sự kiện từ thư mục ảnh hoạt động của Chi hội.
  Tên thư mục dạng `(4) 07-08.09.24 Caravan XTTM Đồng Tháp`: số trong ngoặc là
  mảng hoạt động, sau đó tới ngày rồi tên. Ảnh chép sang `public/su-kien/<slug>/`.
  Slug tính từ tên + năm; hai đợt cùng tên trong một năm thì tự thêm ngày-tháng
  để không đè lên nhau. Chạy lại an toàn.

## Game "Ngôi nhà Chợ Lớn" (`/ngoi-nha`, từ 14/09/2026)

Game onboarding hội viên: 5 chặng theo 4B, 22 trạm × 10 câu, 4 loại vốn, Thẻ
Cơ hội, Nhiệm vụ Huynh đệ, bảng xếp hạng theo mùa. Kịch bản gốc (Word/PDF) ở
`Đại hội BDH Chợ lớn/_GAME NGOI NHA CHO LON/`. Nằm trong route group riêng
`src/app/(ngoi-nha)/` (nền tối, thanh dưới kiểu ứng dụng, KHÔNG dùng Nav của
khu hội viên); `/ngoi-nha` đã có trong `PROTECTED` và `robots.ts`.

- **Toàn bộ luật chơi và nội dung ở `src/lib/ngoi-nha/`**: `luat.ts` (hằng số,
  hàm thuần — client import được), `noi-dung.ts` + `noi-dung/*.json` (CHỈ máy
  chủ, chứa đáp án), `dong-co.ts` (bắt đầu lượt, chấm câu, trợ giúp, kết thúc
  lượt, Thẻ Cơ hội), `nhiem-vu.ts` (nhiệm vụ tự động / hội viên xác nhận / Ban
  duyệt), `tong-hop.ts` (hồ sơ, bảng xếp hạng), `mua.ts` (mùa giải), `so-cai.ts`,
  `thoi-gian.ts` (giờ Việt Nam — máy chủ chạy UTC, đừng dùng `getDate()` trực tiếp).
- **Đáp án không bao giờ xuống trình duyệt** trước khi trả lời: client chỉ nhận
  `CauHienThi` (đã xáo, không có `a`/`g`). Giờ chấm ở máy chủ (`cauMoLuc`), quá
  giới hạn + 2 giây bù mạng là hết giờ dù trình duyệt gửi gì. Mỗi câu chỉ ghi
  nhận một lần (`viTri` + khoá `luotId, cauId`); chốt lượt bằng `updateMany`
  có điều kiện nên bấm hai lần không cộng điểm hai lần.
- **Điểm bảng xếp hạng cộng dồn từ sổ cái `NnSoCai`**, không lưu tổng sẵn; mỗi
  trạm chỉ cộng phần VƯỢT kỷ lục cũ (lượt cao nhất), vốn cũng vậy — chơi lại
  không "cày" được. Chưa có mùa `DANG_MO` (hoặc chưa tới ngày) thì `muaId =
  CHOI_THU`: vẫn chơi, VẪN ghi sổ cái và xếp hạng trong "mùa" chơi thử đó, mở
  mùa chính thức là mọi người về 0 (xem mục "Chơi thử vẫn có điểm" bên dưới).
- Bảng game đều tiền tố `Nn*`, chỉ lưu `userId`/`memberId` dạng chuỗi — không
  khoá ngoại tới bảng cũ, xoá tài khoản không bị chặn. Chú thích trong
  `schema.prisma` đã cũ so với mã: `NnSoCai.loai` nay còn `DAU_TRUONG`,
  `DAU_TRI`, `LA_BAI`, `DIEU_CHINH`; `NnTranDau.trangThai` có thêm `HUY` (Ban
  huỷ trận treo); `NnTraoQua.loai` có thêm `LB_<yyyymmdd>` và `VD_<yyyymm>`.
- Nhiệm vụ tự động (`dongBoTuDong`) đọc dữ liệu có sẵn: check-in QR
  `ThamDuSuKien`, `Deal` đã duyệt (bán / mua / giới thiệu), `BanToChuc`,
  `LoiChuc` đúng ngày sinh, hồ sơ đầy đủ. Chống trùng bằng khoá
  `(userId, muaId, khoa)`; giới hạn số lần theo kỳ tính theo `ngayLam`.
- Sửa câu hỏi: sửa ở thư mục kịch bản (file Excel duyệt → JSON) rồi chép sang
  `src/lib/ngoi-nha/noi-dung/`, chạy `npm run test:ngoinha` (soát cấu trúc);
  `npm run test:ngoinha -- --csdl` chạy thêm một ván thật rồi tự xoá — tự bỏ
  qua khi đang có mùa giải thật mở.
- Quản trị ở `/quan-tri/ngoi-nha`, chia HAI nhóm tab (từ 16/09/2026):
  **Vận hành** (quyền `NGOI_NHA_QUAN_LY`): Tổng quan (có nhật ký thao tác),
  Duyệt nhiệm vụ (kèm xử lý hộ yêu cầu chờ hội viên quá 7 ngày), Trao quà &
  xếp hạng (có mục quà Lá bài), Người chơi (tìm, xem sổ điểm, ẩn khỏi BXH,
  điều chỉnh điểm có lý do), Đấu trí & Đấu trường (phiên Đấu trí, huỷ trận
  treo), Thống kê. **Cài đặt** (quyền mới `NGOI_NHA_CAI_DAT`): Mùa giải & quà,
  Bật/tắt tính năng, Luật chơi & điểm, Lá bài mỗi ngày, Nội dung (Thẻ Cơ hội,
  Nhiệm vụ, Câu chia sẻ, Kho bộ câu, Hướng dẫn). Khoá tab cũ `cai-dat`,
  `cau-hoi`, `chia-se` tự chuyển sang tab mới. Cột "Nhà đồng hành" chỉ điền khi
  doanh nghiệp đã nhận lời — KHÔNG tự ghi tên doanh nghiệp nào.
- **Mọi cài đặt game đi qua sổ đăng ký `src/lib/ngoi-nha/cai-dat/`**
  (`MUC_CAI_DAT`: thongSo, luat, tinhNang, laBai, theCoHoi, nhiemVu, chiaSe,
  boCauAn, huongDan → khoá SiteSetting `nn.*`). Đọc bằng `docMuc("luat")`,
  `docTinhNang()`, `docCauHinhLaBai()`, `docTheCoHoiSua()`, `docNhiemVuSua()`,
  `docChiaSeSua()`, `docBoCauAn()`, `docHuongDan()`, `docMucDayDu()` (thêm mặc
  định + phiên bản, cho form) — LUÔN trước `$transaction`, rồi truyền giá trị
  vào hàm chạy trong giao dịch. Giá trị luôn qua hàm `chuan*` (thiếu trường →
  mặc định, quá giới hạn → chặn) nên chưa lưu gì thì game chạy đúng luật gốc
  trong `luat.ts`. Ghi chỉ qua `ghiMuc` / `xoaMuc`; form quản trị dùng
  `_cai-dat/KhungCaiDat.tsx` + `truong.tsx` (ô nhập `inp text-base sm:text-sm`,
  nút ≥44px) và action chung `luuCaiDat` (gộp theo trường cấp 1, không ghi đè
  nhóm khác) + `veBanGoc`. Mọi thao tác quản trị game ghi `ActivityLog`
  (`src/lib/ngoi-nha/nhat-ky.ts`, mã `nn.*`) và hiện ở Tổng quan. Hai khung cài
  đặt của CÙNG một mục không được trùng trường cấp 1 trong `nhom` — máy chủ gộp
  theo trường cấp 1 nên trùng là người lưu sau đè người lưu trước.
- **Tắt tính năng phải chặn ở MÁY CHỦ**: hàm lib / server action ném
  `LoiGame(..., "TAT")`; lượt hay trận ĐANG DỞ vẫn cho chơi nốt. Công tắc ở
  `nn.tinhNang` (`cai-dat/tinh-nang.ts`): tạm dừng cả game (người vận hành vẫn
  vào được để thử), Lá bài, Thử thách ngày, Đấu trường, Đấu trí, Nhiệm vụ, Thẻ
  Cơ hội, 3 trợ giúp, 2 loại câu thưởng, tab BXH tuần / vốn, nút Thách, hướng
  dẫn người mới.
- **Luật chơi & điểm** ở `nn.luat` (`cai-dat/luat-choi.ts`): điểm mỗi câu, tốc
  độ, chuỗi, một phần, hệ số trạm Thử thách, +giây trợ giúp, ngưỡng sao, vốn
  qua trạm, giây theo từng loại câu (CHỤP vào `MucDeBai.giay` lúc tạo lượt nên
  lượt đang dở không đổi), thử thách ngày, câu thưởng, vốn & trần Đấu trường,
  Đấu trí, ngưỡng cân bằng, 5 bậc danh hiệu + Ngọn lửa, điểm & bật/tắt 12 huy
  hiệu, số lần Người bắc cầu. Hàm thuần đi kèm: `tinhSaoTheoLuat`,
  `danhHieuTheoLuat`, `diemTocDoTheoLuat`, `thuongChuoiNgayTheoLuat`…
- **Quà = mốc quà + giải xếp hạng, Ban Điều hành tự soạn** ở tab "Mùa giải &
  quà" (từ 16/09/2026). Lưu dạng `{ giai, moc }` trong `NnMua.phanThuong` của
  từng mùa; chưa có mùa thì lưu **cơ cấu mẫu** ở `SiteSetting` khoá
  `nn.coCauQua` (hiện cho người chơi thử, chép sang mùa tạo sau; đã có mùa thì
  soạn mẫu qua `?tab=mua&mua=mau`). Mã mốc (`ma`) sinh MỘT LẦN lúc bấm "+ Thêm
  mốc" (`taoMaMoc`) và giữ nguyên khi sửa / đổi thứ tự — `NnTraoQua.loai` bám
  theo mã nên đừng sinh mã theo vị trí dòng. Đọc qua
  `coCauHienTai()` / `docCoCau()` trong `mua.ts` — bản lưu cũ chỉ là mảng giải
  vẫn đọc được. Mốc quà (`moc-qua.ts`, file thuần): loại `CHANG` / `SO_TRAM` /
  `SAO` / `DIEM` / `TRAN_THANG` + ngưỡng; tiến độ tính bằng `tienDoMoc()`; mã
  mốc ghi vào `NnTraoQua.loai` (mã `GIAI` dành cho giải xếp hạng). Mặc định anh
  Khang chốt 15/09: áo thun khi qua đủ Chặng BIẾT, vé bốc thăm khi đi hết 22
  trạm; giải gói trong 20 phần quà (`TONG_QUA_MUA`, test canh bản mặc định —
  form quản trị chỉ nhắc, không chặn) với 12 quà thật đã nhập sẵn.
- **Thông số game Ban Điều hành chỉnh** ở tab "Cài đặt game": số câu / giây /
  điểm Đấu trường, số lượt tính điểm mỗi trạm, bật tắt câu thưởng. Lưu
  `SiteSetting` khoá `nn.thongSo`, đọc bằng `docThongSo()` (`cau-hinh.ts`) và
  LUÔN qua `chuanThongSo()` (chặn giới hạn). Gọi `docThongSo()` TRƯỚC khi mở
  `$transaction` (SQLite một kết nối). Giây mỗi câu lưu kèm đề bài trận
  (`MucDeBai.giay`) nên đổi thông số không làm lệch trận đang dở. Mặc định
  giữ luật cũ (10 câu × 15 giây, thắng 300 / hoà 150 / thua 50, 3 lượt).
- **Hình Chợ Bình Tây** (`components/ngoi-nha/NgoiNha.tsx`, từ 15/09): 5 gian
  ngang = 5 chặng, tháp đồng hồ LUÔN sáng (biểu tượng chợ, không theo trạng
  thái gian 3), gian khoá chỉ phủ bóng đêm chứ không đổi màu tường; huy chương
  là nút HTML đặt theo `topPct()/leftPct()` vì viewBox cắt bớt trời
  (`DINH_TROI`); điện thoại cuộn ngang trong `.nn-cho-cuon`, tự cuộn tới gian
  đang chơi. Đã qua một vòng 49 agent soi ảnh (chồng lấn, dễ đọc, giống mẫu,
  mã) — khi sửa hình nhớ chụp lại 5 khổ bằng `chup-cho-5-kho.cjs` (playwright,
  cổng 3012) và giữ nút ≥36px, chữ ≥11px.
- Hiệu ứng riêng ở `src/app/(ngoi-nha)/ngoi-nha.css` (tiền tố `nn-`), tự tắt
  khi bật "giảm chuyển động". Âm thanh tổng hợp bằng Web Audio
  (`components/ngoi-nha/am-thanh.ts`), không có tệp âm thanh. Biểu tượng vẽ SVG
  (`BieuTuong.tsx`), không dùng emoji.
- **Chơi thử vẫn có điểm** (từ 15/09): chưa có mùa `DANG_MO` thì `muaId =
  CHOI_THU` nhưng sổ cái, huy hiệu, bảng xếp hạng vẫn ghi vào "mùa" đó; mở mùa
  giải chính thức là mọi người bắt đầu lại từ 0. Nhiệm vụ Huynh đệ vẫn chỉ ghi
  nhận trong mùa giải thật.
- **Lá bài mỗi ngày** (`la-bai.ts` + `la-bai-luat.ts`, từ 16/09/2026): mỗi hội
  viên mỗi ngày lật MỘT lá trong 3 lá úp — danh ngôn doanh nhân (149 câu đã
  kiểm chứng nguồn ở `noi-dung/la-bai/danh-ngon.json`), lời nhắn của Ban Chủ
  nhiệm (`loi-nhan.json`, 40 câu), điểm tích luỹ, hoặc quà tặng đặc biệt. Ngày
  đổi lúc 6:00 giờ VN (`ngayThuThach`); lật nhiều ngày liên tiếp có thưởng
  chuỗi. **Không thêm bảng mới**: mỗi lần lật ghi đúng một dòng `NnSoCai`
  `loai:"LA_BAI"`, `nguon:"labai:<yyyy-mm-dd>"`, `ghiChu` là JSON ảnh chụp kết
  quả; kiểm tra + ghi trong cùng `$transaction` nên bấm hai lần chỉ một lá.
  `bangXepHang` bỏ qua dòng Lá bài 0 điểm 0 vốn để không lệch thứ tự người bằng
  điểm. **Quà chỉ rơi khi mùa chính thức đang diễn ra**, còn suất, người chơi đã
  gắn hồ sơ hội viên và không bị ẩn khỏi BXH; trúng quà thì Ban ghi đã trao ở
  tab Trao quà (`NnTraoQua.loai = LB_yyyymmdd`). Cấu hình ở `nn.laBai` (số lá,
  tỉ trọng 4 loại, bậc điểm, thưởng chuỗi, điều kiện & danh sách quà, bật/tắt
  hoặc sửa từng danh ngôn / lời nhắn). Bộ sưu tập ở `/ngoi-nha/la-bai`. Kiểm
  thử: `npm run test:labai -- --csdl`.
- **Vinh danh theo tháng** (`vinh-danh-thang.ts`, anh Khang chốt 20/09/2026):
  mùa 1 dài 3 tháng; mỗi tháng top 10 theo điểm **trong tháng đó** (không cộng
  dồn — hội viên biết game muộn vẫn còn cửa) được gọi tên tại buổi sinh hoạt,
  hạng 1–3 kèm quà nhỏ. Bảng xếp hạng của hội viên có tab "Tháng này"
  (`bangXepHang(muaId, "thang")`); quản trị ghi nhận ở tab Trao quà, khối "Vinh
  danh tháng" — chọn tháng rồi bấm "Ghi vinh danh", lưu `NnTraoQua.loai =
  VD_<yyyymm>` (khoá duy nhất theo user + mùa + loai nên mỗi người một lần mỗi
  tháng), KHÔNG lẫn với giải cuối mùa (`GIAI`) hay quà Lá bài (`LB_*`).
  **Trần quà tháng:** mỗi người nhận quà tối đa `QUA_THANG_TOI_DA_MOI_MUA` = 2
  lần mỗi mùa; `topThang` chia suất quà từ trên xuống, ai chạm trần thì vẫn
  vinh danh nhưng nhường suất cho người kế tiếp. Lần vinh danh CÓ quà được đánh
  dấu bằng chuỗi `DAU_CO_QUA` ("có quà") trong `NnTraoQua.ghiChu` — đếm trần
  dựa vào dấu này, nên đừng đổi chuỗi đó. `ghiTraoQua` chặn lại ở MÁY CHỦ. Chưa có
  mùa thì khối này vẫn hiện để xem trước nhưng không ghi được. Nhịp thưởng đầy
  đủ hiện ở trang Phần thưởng mục "Lịch trao thưởng": ngày (Lá bài) · tuần (top
  3 nêu tên) · tháng (top 10) · mốc cá nhân · cuối mùa (20 suất).
- **Câu thưởng cuối lượt** (`cau-thuong.ts`): sau 10 câu chính có thêm 1 câu —
  hoặc câu về hội viên thật sinh từ CSDL (ai đại diện doanh nghiệp nào, doanh
  nghiệp làm ngành gì; chỉ lấy hồ sơ `PUBLIC_MEMBER`), hoặc câu "chia sẻ về
  mình" (`noi-dung/chia-se.json`, không có đúng sai, lưu `NnChiaSe`, tổng hợp ở
  tab "Hội viên chia sẻ" của quản trị). Câu thưởng không tính vào sao / chuỗi.
  Mục đề bài (`MucDeBai`) có thể chứa câu soạn riêng (`cau`) — dùng `cauCua()`
  thay vì tra `CAU_THEO_ID` trực tiếp.
- **Đấu trường 1-1** (`dau-truong.ts`, `/ngoi-nha/dau-truong`): chuyển từ gói
  `_DAU TRUONG - CHUYEN GIAO YBA` (Học viện Mon Amie). A thách B, không cần
  online cùng lúc; đáp án chỉ ở máy chủ, thời gian client bị chặn trần. Đề lấy
  từ **kho ~100 bộ câu** (`bo-cau.ts` + `noi-dung/bo-cau/*.json`, 10 chủ đề ×
  10 bộ × 10 câu) — người thách chọn ngẫu nhiên / theo chủ đề / "Hành trình 22
  trạm" (KHÔNG nhận mã một bộ cụ thể gửi thẳng lên), máy chọn bộ cả hai chưa
  gặp → bộ người thách chưa gặp (hết trong chủ đề thì mở ra toàn kho) → mới
  lặp; "đã gặp" = trận Đấu trường + phiên Đấu trí đã chơi (đọc mã bộ từ id câu
  `dt:<mã>:<n>`, không cần cột CSDL). Thêm chủ đề: đặt tệp JSON cùng cấu trúc rồi khai ở
  `noi-dung/bo-cau/index.ts`, chạy `npm run test:ngoinha` (soát 4 phương án,
  trùng câu, độ dài, đáp án trải đều). Bộ câu soạn bằng agent có vòng phản
  biện — chỉ kiến thức ổn định, không số liệu 2024–2026, không chính trị, không
  quảng cáo doanh nghiệp hội viên. **Tìm đối thủ gồm cả tài khoản không gắn hội
  viên** (Thư ký, văn phòng…) nếu đã vào game — trước 16/09 gõ "thư ký" không
  ra. Bảng xếp hạng có nút "Thách" mở `/ngoi-nha/dau-truong?doiThu=<userId>`.
  Thưởng qua sổ cái và thành tích ở `NnNguoiChoi.tranThang/Thua/Hoa`.
  **Chống cày điểm** (`DAU_TRUONG` trong `luat.ts`): mỗi người tối đa 10 trận có
  điểm mỗi ngày, cùng một cặp tối đa 2 trận có điểm mỗi ngày — quá trần thì
  trận vẫn tính thắng thua nhưng không ghi sổ cái (`tinhDiem: false` +
  `ghiChuDiem`). **Giờ chấm ở MÁY CHỦ từ 20/09/2026**: `cauTranDau` ghi mốc mở
  đề lần đầu của từng bên (`NnTranDau.thachMoLuc` / `doiThuMoLuc`), `nopTranDau`
  tính `ms = now − mốc` rồi kẹp trong [1 giây mỗi câu đã trả lời, tổng giây đề
  + 10 giây bù mạng] — tải lại trang giữa trận không được tính lại từ đầu, và
  **nộp bài mà chưa mở đề bị từ chối** (`LoiGame … "CHUA_MO_DE"`; script test
  cũng phải gọi `cauTranDau` trước). Trận tạo TRƯỚC hằng `MOC_CHAM_MAY_CHU`
  (dữ liệu bản cũ) vẫn chấm theo giờ trình duyệt khai. Mốc quà `TRAN_THANG`
  đếm bằng `tranThangCoGhiSo` — CHỈ trận có cộng điểm (trong trần mỗi ngày),
  nên hai người bắt tay đánh vài chục trận một ngày không đẩy mốc lên được;
  `NnNguoiChoi.tranThang` (thành tích ở sảnh) vẫn đếm mọi trận. Trang
  trận để `force-dynamic`, KHÔNG `revalidatePath` trang trận trong action nộp
  bài (mất màn xem lại đáp án).
- **Đấu trí sự kiện** (`dau-tri.ts`, `/ngoi-nha/dau-tri`): Ban Điều hành tạo
  phiên ở tab "Đấu trí sự kiện" (bộ câu soạn sẵn trong `noi-dung/dau-tri/*.json`
  hoặc rút từ 22 trạm), chiếu `/ngoi-nha/dau-tri/<id>/bang?san-khau=1` lên màn
  hình (mã tham gia, top 3, danh sách có mặt, tự làm mới 5 giây), bấm "Mở phiên".
  Lượt chơi là `NnLuot` với `tramMa = "DAU:<id>"`, mọi người cùng bộ câu, phương
  án xáo riêng từng người, không trợ giúp; điểm cộng thẳng vào Điểm Vươn tầm,
  mỗi câu đúng +1 Vốn tri thức. Ô chọn bộ câu gồm bộ soạn cho sự kiện
  (`noi-dung/dau-tri/*.json`, khai trong `BO_SOAN_SAN`) + 22 trạm + toàn bộ kho
  thách đấu theo nhóm chủ đề (`NHOM_BO_CAU_DAU_TRI`).
- Giao dịch nhiều bước của game dùng `GIAO_DICH` (`so-cai.ts`, maxWait 10s /
  timeout 30s) — máy chủ đĩa chậm từng làm giao dịch 5 giây mặc định bị cắt ngang
  và khoá SQLite. Máy dev chạy hai bản (3002 prod + 3012 dev) cùng một tệp
  `dev.db` là dễ gặp "Socket timeout"; tắt bớt một bản trước khi thử.
- **`DATABASE_URL` phải có `?connection_limit=1`** (`.env` từ 15/09/2026): SQLite
  chỉ cho một người ghi; để Prisma mở nhiều kết nối thì 20 người bấm trả lời
  cùng lúc là 12/20 giao dịch "Socket timeout" (đo thật), còn một kết nối thì
  0 lỗi, 60 giao dịch 213 ms. Bộ `test:ngoinha -- --csdl` chạy được với cấu
  hình này (74 ca) — nghĩa là không chỗ nào gọi `prisma.*` bên trong
  `$transaction` (gọi vậy là kẹt chờ chính mình). Giữ nguyên khi triển khai.
- **Chơi trong mạng LAN / họp Ban Chủ nhiệm:** cookie phiên chỉ gắn `Secure`
  khi vào bằng https (`login/route.ts` xét `X-Forwarded-Proto`), nên điện
  thoại vào `http://<IP laptop>:3002` đăng nhập được. Tên đăng nhập KHÔNG
  trùng mã hội viên (anh Khang = `hv0018`, mã HV0001) — tra ở
  `/quan-tri/hoi-vien`. `Mo-Web-YBA-Cho-Lon.bat` bỏ qua `*.db*` và
  `public/tai-len` khi xét có cần build lại — đừng đưa hai thứ đó vào lại,
  không thì mỗi lần mở bat là build 1–2 phút dù mã không đổi. Không `npm run
  build` khi bản 3002 đang phục vụ người chơi: `.next` đổi là bản đang chạy
  mất CSS (chunk trả 500).

## Game trên trang công khai

- Dải "Ngôi nhà Chợ Lớn" trên trang chủ (`src/app/(web)/page.tsx`, mục
  `#ngoi-nha`) chỉ lấy số liệu TỔNG qua `src/lib/ngoi-nha/cong-khai.ts`
  (`ngoiNhaCongKhai()`, ≤3 truy vấn nhẹ, không tên người chơi — bảng xếp hạng là
  nội bộ). Ảnh minh hoạ `public/anh-game/cho-binh-tay.webp` — ĐỪNG để ảnh trong
  `public/ngoi-nha/`: proxy chặn mọi đường dẫn bắt đầu bằng `/ngoi-nha` nên ảnh
  trả 307 về trang đăng nhập.
- Lối vào game: mục đầu `MENU_THEM` (`src/lib/site.ts`), nút "Ngôi nhà" ở
  `SiteHeader` (chỉ từ `xl`), hàng nổi bật trong menu điện thoại, link ở chân
  trang. Nút CTA trỏ thẳng `/ngoi-nha` (khách chưa đăng nhập được proxy đưa qua
  `/login?tiep=/ngoi-nha` rồi quay lại), KHÔNG tự ghép `/login?tiep=`.
- Link chia sẻ ra ngoài dùng `ybacholon.vn/#ngoi-nha` — `/ngoi-nha` nằm trong
  `robots.ts` và không có trong sitemap.

- **Landing sự kiện 10/10** (`/1010`, cũng chạy ở `1010.ybacholon.vn` — proxy.ts
  rewrite host `1010.*` về route này): thư mời Lễ chuyển giao BĐH nhiệm kỳ I,
  route group `(le-1010)` đứng một mình không header/footer, tông navy – vàng
  đồng theo proposal Ver5. Ảnh 18 trang proposal + PDF ở `public/su-kien-1010/`
  (dựng lại bằng chính đoạn PyMuPDF trong lịch sử nếu proposal đổi bản). Sự
  kiện là bản ghi lịch `le-chuyen-giao-10-10-2026` (`npm run su-kien-1010`,
  upsert an toàn) — form landing nộp vào action đăng ký lịch hoạt động nên
  danh sách tham dự nằm ở /quan-tri/lich-hoat-dong; giờ/địa điểm sửa ở đó là
  landing đổi theo. Đăng ký TÀI TRỢ đi qua Google Form của Chủ nhiệm (hằng
  FORM_TAI_TRO trong page.tsx), KHÔNG qua CSDL web.

- **Khách mời 10/10 (`KhachMoi1010`)** — phân hệ thư mời của Lễ chuyển giao:
  mỗi khách một mã `CL-XXXXX` (link `/1010/moi/<mã>`, KHÔNG cần đăng nhập —
  mã ngẫu nhiên chính là chìa khoá, robots noindex, đừng đăng link lên nhóm
  chung). Khách chọn PHIÊN tham dự (`phien` = "TOA_DAM,CHUYEN_GIAO,GALA"),
  đánh dấu quan tâm tài trợ (`quanTamTaiTro`) hoặc góp quỹ Nhịp Cầu Doanh
  Nhân (`dongGopQuy`). BTC quản ở /quan-tri/khach-moi-1010 (quyền
  SU_KIEN_QUAN_LY): thêm 1 khách / dán hàng loạt từ Excel (tab hoặc `;`),
  chép link gửi Zalo, xếp bàn, tải CSV; màn check-in tại cửa cho điện thoại
  ở /quan-tri/khach-moi-1010/check-in (bấm nhầm bấm lại là huỷ). Đây là
  luồng KHÁCH ĐƯỢC MỜI — người lạ tự xin tham dự vẫn đi qua form landing →
  DangKyHoatDong như cũ, đừng trộn hai luồng. Bổ sung 23/09: thiệp JPG thiết
  kế nằm ở thư mục RIÊNG TƯ `thiep-1010/<soThu>.jpg` (ngoài public/, có COPY
  trong Dockerfile), phục vụ qua /api/khach-moi-1010/thiep/<mã> — đừng bỏ vào
  public/ vì tên file theo số thứ tự đoán được; nạp khách + thiệp bằng
  `scripts/nhap-khach-moi-1010.ts` (đọc Excel BTC, idempotent). Khách mời
  THÊM SAU đợt Excel (hoặc thay thiệp cũ): nút "⬆ Tải thiệp lên" trên từng
  dòng ở /quan-tri/khach-moi-1010 → `POST /api/khach-moi-1010/thiep-len`
  (route handler chứ KHÔNG phải server action — ảnh thiệp thường nặng hơn
  trần 1 MB của server action); file lưu ở `thuMucThiepLen()`
  (`src/lib/thiep-1010.ts`): máy chủ Docker là `/data/thiep-len` (nằm trong
  volume ./du-lieu nên nâng cấp ảnh Docker không mất), máy dev là
  `thiep-1010/tai-len/`; CSDL ghi `soThu = "len:CL-XXXXX.jpg"` — API thiệp
  phân biệt hai nguồn qua tiền tố `len:`. Script nạp Excel chỉ điền soThu
  khi đang trống nên chạy lại không đè thiệp đã tải tay. **HAI lần
  check-in** (Chủ nhiệm chốt 23/09): `checkinLuc` = buổi chiều (Tọa đàm +
  Lễ, 14:00–17:00), `checkinGalaLuc` = vào Gala tối — khách có thể về rồi
  quay lại, hoặc chỉ dự một buổi; nút quản trị là CẶP nút Chiều/Gala
  (action `doiCheckin` nhận `lan`), khách tự check-in ở /1010/checkin thì
  máy chọn theo giờ VN (trước 17:00 = chiều, từ 17:00 = Gala). Nhóm khách
  có thêm `BTC` = ê-kíp phục vụ (PG, lễ tân, photo, sinh viên…) — Chủ
  nhiệm yêu cầu ê-kíp cũng check-in để nắm tổng quân số; tab "Ê-kíp BTC"
  lọc `?nhom=BTC`, số liệu check-in TÍNH CẢ ê-kíp. **CẢNH GIÁC: cột
  `nhom` lưu CHỮ GỐC từ Excel** ("BTT - BCH", "YBA CHỢ LỚN", "NTT + KM
  NTT"…) LẪN mã enum (KHACH_MOI/BTC/TAI_TRO cho khách thêm tay) — lọc
  theo nhóm phải soát cả hai kiểu (xem landing page.tsx). Landing có mục
  công khai `#khach-moi` "Những gương mặt sẽ hội tụ" (Chủ nhiệm chốt
  24/09): khách XAC_NHAN chia BA nhóm theo vai vế — ① BTT & BCH Hội
  (nhom chứa "BTT" hoặc LANH_DAO), ② Hội DNT TP.HCM (YBA*/Văn phòng
  Hội/Chi hội khác/HOI_VIEN), ③ Khách mời của YBA Chợ Lớn (mọi nhóm còn
  lại, gồm cả NTT — khách NTT là khách mời phụ, KHÔNG có khối tài trợ
  riêng; không nêu tên nhóm nội bộ kiểu "KHÁCH VIP CỦA…"). Bốn vị xếp
  đầu nhóm ① theo hằng `UU_TIEN` (Đạt → Tri Quang → Đại Khôi → Viên
  Khang), anh Phan Tấn Đạt có vòng vàng (`noiBat`). Ảnh đại diện
  `public/su-kien-1010/khach/<soThu>.webp`; hiện chức danh + đơn vị +
  phiên, KHÔNG bao giờ SĐT/email/bàn; khách nhạy cảm ẩn bằng
  `anKhoiDanhSach` (nút ở quản trị). Khung tri ân NHÀ TÀI TRỢ chính thức
  (mục ③ landing) đọc `SiteSetting sk1010.nhaTaiTro` qua
  `src/lib/tai-tro-1010.ts` — BTC sửa ở ô "Nhà tài trợ & đối tác đồng
  hành" trong /quan-tri/su-kien-1010, định dạng "1/ Tên gói" + dòng "+
  Tên đơn vị"; CỐ Ý không tự đồng bộ từ tab "THEO DÕI TÀI TRỢ" của sheet
  (tab đó có số tiền + ghi chú đàm phán nội bộ). Thẻ lịch (LichHoatDong
  component) gặp `lienKet` bắt đầu bằng "/" thì trỏ thẳng vào đó thay vì
  trang chi tiết — sự kiện 10/10 nhảy từ trang chủ vào /1010. Đa số khách xác nhận qua Zalo/điện thoại → BTC ghi
  Google Sheet master rồi bấm "🔄 Đồng bộ xác nhận từ Google Sheet" ở
  /quan-tri/khach-moi-1010 (`src/lib/dong-bo-sheet-1010.ts`: đọc CSV
  export công khai, dò cột theo TÊN tiêu đề, khớp tên không dấu + SĐT/cty,
  trùng tên thì BỎ QUA và báo — thà sót còn hơn ghi nhầm; từ 04/10 kéo
  luôn cột **SỐ BÀN** nếu sheet có: ô có giá trị đè bàn web, ô trống GIỮ
  bàn web, dòng chỉ có bàn thì chỉ ghi bàn không đổi trạng thái). Khách ghi SỐ
  TIỀN góp quỹ NCDN (`dongGopSoTien`, VNĐ) — landing hiện tổng cam kết công
  khai. Khách TỰ check-in ở /1010/checkin (QR in từ
  tai-lieu/qr-checkin-1010.png); quản trị có tab danh sách theo phiên và giờ
  check-in. **BỐC THĂM MAY MẮN** (Chủ tịch đặt 04/10): /quan-tri/khach-moi-1010/
  boc-tham — nguồn quay là KHÁCH ĐÃ CHECK-IN (check-in = vé bốc thăm, chọn
  theo phiên hoặc bất kỳ), ê-kíp BTC mặc định không tham gia (ô tick riêng);
  mỗi khách trúng tối đa MỘT giải, lưu `KhachMoi1010.trungGiai/trungLuc`,
  "Huỷ" thì người đó quay tiếp. Người trúng do MÁY CHỦ chọn (crypto.randomInt
  trong action `quayBocTham`, updateMany có điều kiện `trungGiai: null` chống
  hai máy quay trùng) — hiệu ứng chạy tên trên màn chỉ là trình diễn; "Quay
  thử" không ghi gì. Điều kiện lọc dùng chung ở `src/lib/boc-tham-1010.ts`
  (file thuần, client import được — đừng import auth/prisma vào đó). Khung
  sân khấu có nút ⛶ Toàn màn hình để chiếu; hàng điều khiển ẩn/hiện được.
  **HAI MÃ QR CHECK-IN** (Chủ tịch chốt 07/10): khách check-in HAI lần —
  ① QR đầu giờ `/1010/checkin?phien=CHIEU` (tai-lieu/qr-checkin-dau-gio.png):
  vào Phiên 1–2, máy ghi Tọa đàm/Lễ theo giờ, KHÔNG báo bàn (Phiên 1–2
  không xếp bàn); ② QR Phiên 3 `?phien=GALA` (tai-lieu/qr-checkin-gala.png):
  tất cả khách check-in lại, ghi THẲNG Gala và hiện to "Số bàn dự kiến".
  Logic ở `tuCheckin` (moi/actions.ts): `ban` chỉ trả về khi phiên ghi là
  GALA; HAI MÃ QR IN MỞ NGAY, không cổng giờ (Chủ tịch chốt 07/10 tối —
  quét được từ trước ngày lễ, kể cả QR Gala); nút trên thiệp riêng và QR
  chung cũ vẫn chỉ mở ngày lễ; `?thu=1&gio=15:00` chạy thử có giả lập giờ
  (chỉ trước ngày lễ); suất mời (`phienDuocMoi`) vẫn chặn khách chưa có
  suất Gala. **CHECK-IN NHIỀU LẦN**: `ghiCheckin` mỗi lần quét CẬP NHẬT
  cột checkin*Luc thành giờ mới nhất và ghi thêm một dòng bảng
  `LuotCheckin1010` (lịch sử đủ mọi lần; huỷ thì ghi dòng `cach = "HUY"`).
  Khách thấy "Check-in lúc 19:32 ngày 07/10/2026 (lần trước …)" + lịch sử.
  BTC xem ở /quan-tri/khach-moi-1010/da-checkin (giờ mới nhất 3 phiên,
  số lần, lịch sử từng khách, nhật ký 60 lượt gần nhất, tự làm mới 15s;
  giờ trước ngày lễ tô xám). Sáng 10/10 bấm "Xoá lượt check-in thử" để
  cột về 0 — lịch sử vẫn giữ. Không có `?phien` thì
  máy chọn phiên theo giờ như cũ (qr-checkin-1010.png). SỐ BÀN lấy từ cột
  **Bàn** của tab "DS Tiệc & Xếp bàn" trên sheet master qua nút Đồng bộ
  (ô sheet có giá trị đè bàn web; ô trống GIỮ bàn web, không xoá). Chủ
  tịch chốt 07/10: BTC ghi theo **KHU BÀN** ("1-2-3-4", "23-24-25") chứ
  không ghi từng bàn — khách tự chọn bàn còn chỗ trong khu; `khuBan()` ở
  moi/actions.ts nhận dạng chuỗi khu, màn QR 2 hiện "KHU BÀN CỦA ANH/CHỊ
  11 · 12 · 13 · 14" (cỡ chữ co theo vw, một dòng) thay cho một số bàn.
  PDF/Excel xếp bàn theo khu: `_XEP BAN GALA 10-10-2026/build.py`.
  **MÀN CHÀO MỪNG Ở SẢNH** (04/10): /quan-tri/khach-moi-1010/chao-mung —
  chiếu TV sảnh, khách vừa check-in hiện tên + chức danh thật to, hàng
  "Vừa đến" + quân số 3 phiên; client router.refresh() 5 giây/lần (trang
  force-dynamic). KHÔNG hiện SĐT/bàn; khách `anKhoiDanhSach` và ê-kíp BTC
  không hiện tên trên màn (quân số vẫn đếm đủ).

## SEO & chia sẻ

- `src/app/sitemap.ts` sinh sitemap từ CSDL — thêm nhánh công khai mới thì nhớ
  thêm vào đây, và thêm nhánh nội bộ mới thì thêm vào `src/app/robots.ts`.
- Thông tin Chi hội (địa chỉ, hotline, fanpage) khai một chỗ duy nhất trong
  `src/lib/site.ts`, dùng lại ở footer, trang liên hệ và JSON-LD.
- `metadataBase` trỏ tới `SITE.url` nên mọi ảnh og khai bằng đường dẫn tương đối.
- Bản chạy thử (`NODE_ENV !== production`) tự đặt `robots: noindex` để không lọt
  lên Google.

## Kiểm thử

- `npm run build` — kiểm tra TypeScript.
- `npm run test:quyen` — kiểm tra quy tắc xác nhận / duyệt giao dịch.
- `npm run test:hoso` — kiểm tra quy tắc hiện / ẩn hồ sơ doanh nghiệp công khai.
- `npm run test:tin` — kiểm tra quy tắc hiện / ẩn tin mua-bán trên chợ.
- `npm run test:chiso` — đối chiếu chỉ số xúc tiến thương mại công khai với CSDL
  và kiểm tra quy tắc khai phạm vi giao thương.
- `npm run test:phanquyen` — kiểm tra hàm phân quyền trong `src/lib/quyen.ts`.
- `npm run test:ngoinha` — soát nội dung + luật chơi game Ngôi nhà Chợ Lớn
  (`-- --csdl` để chạy thêm ván thử trên CSDL).
- `npm run test:labai` — Lá bài mỗi ngày (nội dung, tỉ lệ, quà, một lá mỗi ngày).
- `npm run test:caidatgame` — luật chơi & bật tắt tính năng đọc từ cài đặt.
- `npm run test:dautruongnv` — Đấu trường / Đấu trí / kho bộ câu / Nhiệm vụ.
- `npm run test:nguoichoi` — công cụ quản trị người chơi (điều chỉnh điểm…).
- `npm run test:dangnhap` — đăng nhập bằng tên đăng nhập / SĐT, giới hạn thử sai.
- `npm run test:giaodiengame` — chữ và bố cục giao diện game theo cài đặt.
  Các bộ có `--csdl` dùng chung một `dev.db`: chạy LẦN LƯỢT, đừng chạy song song.
- `npm run test:dienthoai` — quét bố cục trên khổ điện thoại (cần web chạy ở
  cổng 3009). Bắt bảng rộng không có khung cuộn, lưới ép ≥3 cột, chữ dưới 11px.
  Muốn kiểm tràn ngang thật thì dựng iframe rộng 375px rồi so `scrollWidth`.
- `npm run test:quyenhttp` — kiểm tra phân quyền bằng HTTP thật. Phải chạy web
  trước ở cổng 3009 (`npx next start -p 3009`) và có sẵn 2 tài khoản thử
  (`npx tsx scripts/tao-tai-khoan-thu.ts`). Trang thiếu quyền phải trả **307**,
  trả 200 là lỗi.
- Kiểm tra phân quyền bằng `curl` với cookie phiên rồi grep HTML server-render
  đáng tin hơn là click bằng browser tool.
