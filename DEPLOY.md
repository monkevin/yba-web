# Đưa ybacholon.vn lên máy chủ

Hướng dẫn này dành cho một VPS Ubuntu. Làm theo đúng thứ tự, mỗi bước copy-paste
được. Chỗ nào cần thay bằng thông tin thật thì có ghi rõ.

---

## 0. Chuẩn bị trước khi bắt đầu

Cần có sẵn:

- **VPS Ubuntu 22.04** trở lên, tối thiểu 2 GB RAM.
- **Tên miền ybacholon.vn** đã trỏ bản ghi `A` về địa chỉ IP của VPS.
- File cơ sở dữ liệu hiện tại `prisma/dev.db` (chứa 257 hội viên và 63 sự kiện đã nhập).
- Thư mục ảnh: `public/su-kien/`, `public/ban-chu-nhiem/`, `public/tai-len/`.

Cài phần mềm nền trên VPS:

```bash
sudo apt update && sudo apt install -y curl git nginx postgresql certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt install -y nodejs
sudo npm install -g pm2
```

---

## 1. Đổi từ SQLite sang PostgreSQL

SQLite chỉ hợp lúc làm thử trên máy. Chạy thật với hơn 250 hội viên cùng truy cập
thì phải dùng PostgreSQL.

Tạo cơ sở dữ liệu trên VPS:

```bash
sudo -u postgres psql -c "CREATE USER yba WITH PASSWORD 'DOI_MAT_KHAU_NAY';"
sudo -u postgres psql -c "CREATE DATABASE ybacholon OWNER yba;"
```

Sửa `prisma/schema.prisma`, đổi đúng một dòng:

```prisma
datasource db {
  provider = "postgresql"   // trước đây là "sqlite"
  url      = env("DATABASE_URL")
}
```

> **Lưu ý khi đổi:** PostgreSQL phân biệt chữ hoa/thường khi so sánh chuỗi giống
> SQLite, nên phần tìm kiếm tiếng Việt không dấu vẫn chạy đúng — cả hệ thống tìm
> qua cột `searchText` đã chuẩn hoá sẵn, không phụ thuộc kiểu cơ sở dữ liệu.

---

## 2. Đưa mã nguồn lên VPS

```bash
sudo mkdir -p /var/www/yba && sudo chown $USER:$USER /var/www/yba
cd /var/www/yba
# Đưa mã nguồn lên bằng git clone, hoặc scp cả thư mục yba-web từ máy Windows
```

Tạo file `.env` **trên VPS** (không dùng lại file `.env` của máy làm việc):

```bash
cat > /var/www/yba/.env <<'EOF'
DATABASE_URL="postgresql://yba:DOI_MAT_KHAU_NAY@localhost:5432/ybacholon"
SESSION_SECRET="DAN_CHUOI_NGAU_NHIEN_DAI_TOI_THIEU_32_KY_TU_VAO_DAY"
NODE_ENV=production
EOF
chmod 600 /var/www/yba/.env
```

Sinh chuỗi bí mật ngẫu nhiên:

```bash
openssl rand -base64 48
```

> `SESSION_SECRET` **bắt buộc phải đổi**. Để nguyên chuỗi mặc định thì bất kỳ ai
> cũng tự ký được cookie đăng nhập và vào thẳng khu quản trị.

---

## 3. Cài đặt và chạy

```bash
cd /var/www/yba
npm ci
npx prisma migrate deploy   # hoặc: npx prisma db push
npm run build
pm2 start "npm run start" --name ybacholon
pm2 save && pm2 startup
```

---

## 4. Chuyển dữ liệu từ máy làm việc lên

**Cách đơn giản nhất:** chép file SQLite lên VPS rồi chạy lại các script nhập.

```bash
# Trên VPS, sau khi đã có mã nguồn và .env trỏ tới PostgreSQL:
npm run db:seed                                    # ngành nghề, Ban Chủ nhiệm, nhóm sinh hoạt
npm run nhap-hoi-vien -- "<link Google Sheet hội viên>"
npm run nhap-su-kien -- "/duong/dan/toi/BAO CAO HOAT DONG CHO LON"
```

Ảnh phải chép tay lên vì không nằm trong mã nguồn:

```bash
# Chạy trên máy Windows (PowerShell), thay <IP> bằng địa chỉ VPS
scp -r "E:\Claude 07 2026 Mon Amie AI\yba-web\public\su-kien"        user@<IP>:/var/www/yba/public/
scp -r "E:\Claude 07 2026 Mon Amie AI\yba-web\public\ban-chu-nhiem"  user@<IP>:/var/www/yba/public/
scp -r "E:\Claude 07 2026 Mon Amie AI\yba-web\public\tai-len"        user@<IP>:/var/www/yba/public/
```

Sau đó tạo tài khoản Ban Chủ nhiệm đầu tiên:

```bash
npm run tao-tai-khoan
```

---

## 5. Nginx và HTTPS

```nginx
# /etc/nginx/sites-available/ybacholon
server {
    listen 80;
    server_name ybacholon.vn www.ybacholon.vn;

    # Ảnh hội viên và sự kiện có thể nặng — cho phép tải lên tới 10 MB
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ybacholon /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d ybacholon.vn -d www.ybacholon.vn
```

**Bắt buộc phải có HTTPS** vì cookie phiên đặt cờ `secure` khi `NODE_ENV=production`
— chạy HTTP thì không ai đăng nhập được.

---

## 6. Sao lưu hằng ngày

Cần sao lưu **hai thứ**: cơ sở dữ liệu và thư mục ảnh. Mất thư mục ảnh thì toàn
bộ logo hội viên, ảnh sự kiện và ảnh tin đăng biến mất, không khôi phục được từ
cơ sở dữ liệu.

```bash
sudo mkdir -p /var/backups/yba && sudo chown $USER:$USER /var/backups/yba
crontab -e
```

Thêm dòng sau (chạy 2 giờ sáng mỗi ngày):

```
0 2 * * * /var/www/yba/scripts/sao-luu.sh >> /var/log/yba-saoluu.log 2>&1
```

Script `scripts/sao-luu.sh` đã có sẵn trong mã nguồn. Nhớ cấp quyền chạy:

```bash
chmod +x /var/www/yba/scripts/sao-luu.sh
```

Dữ liệu giao thương là số liệu thi đua của Chi hội — giữ tối thiểu 30 bản sao lưu
gần nhất (script tự xoá bản cũ hơn).

---

## 7. Sau khi lên sóng — việc cần làm ngay

1. **Đổi mật khẩu tài khoản `admin`** (mặc định đang là `123456`).
2. Xoá dữ liệu mẫu: giao dịch và tin mua/bán do `npm run db:seed` sinh ra, cùng
   hai bản ghi thử tên "Nguyễn Văn Thử" và "Trần Thị Kiểm Thử".
3. Khai báo website với Google tại [Search Console](https://search.google.com/search-console),
   nộp `https://ybacholon.vn/sitemap.xml`.
4. Kiểm tra ảnh chia sẻ Facebook bằng
   [Sharing Debugger](https://developers.facebook.com/tools/debug/) — dán
   `https://ybacholon.vn` và bấm "Scrape Again".
5. Cập nhật `SITE.address` trong `src/lib/site.ts` nếu địa chỉ văn phòng Chi hội
   khác với địa chỉ Hội.

---

## Cập nhật web về sau

```bash
cd /var/www/yba
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart ybacholon
```
