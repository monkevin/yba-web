# Đưa website lên máy chủ bằng Docker

Hướng dẫn này dành cho người **không phải dân kỹ thuật**. Mỗi lệnh copy rồi dán
thẳng vào cửa sổ dòng lệnh của máy chủ, không cần sửa gì trừ những chỗ có ghi rõ.

Cách này thay cho `DEPLOY.md` (cách cũ phải cài Node, PostgreSQL, PM2 từng thứ
một). Docker gói sẵn tất cả vào một khối, chạy ở đâu cũng giống nhau.

---

## Chuẩn bị

Cần có:

- **Một VPS Ubuntu 22.04** trở lên, tối thiểu **2 GB RAM**, 20 GB ổ cứng.
- **Tên miền ybacholon.vn** đã trỏ bản ghi `A` về địa chỉ IP của VPS.
- Phần mềm để kết nối vào VPS. Trên Windows dùng **PowerShell** có sẵn.

Kết nối vào VPS (thay `123.45.67.89` bằng IP thật):

```bash
ssh root@123.45.67.89
```

---

## Bước 1 — Cài Docker lên VPS

Chạy đúng một lần, khoảng 2 phút:

```bash
curl -fsSL https://get.docker.com | sudo sh
```

Kiểm tra đã xong:

```bash
sudo docker --version
```

Ra dòng `Docker version 2x.x.x` là được.

---

## Bước 2 — Đưa mã nguồn lên VPS

**Từ máy tính của anh** (không phải trong VPS), mở PowerShell tại thư mục dự án
và nén lại:

```bash
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.env --exclude=dev.db -czf yba-web.tar.gz -C "E:/Claude 07 2026 Mon Amie AI" yba-web
```

> **BẮT BUỘC loại `.env`** khỏi gói. Quên là file cấu hình máy dev ghi đè cấu
> hình máy chủ: `SESSION_SECRET` đổi (mọi người đang đăng nhập web bị đá ra),
> `ANTHROPIC_API_KEY` trên máy chủ bị xoá mất (trợ lý AI tắt). Đã dính đúng lỗi
> này ngày 13/08/2026.

Đẩy lên VPS:

```bash
scp yba-web.tar.gz root@123.45.67.89:/opt/
```

**Quay lại cửa sổ VPS**, giải nén:

```bash
cd /opt && tar -xzf yba-web.tar.gz && cd yba-web
```

---

## Bước 3 — Đặt mật khẩu và khoá

Tạo file cấu hình. Lệnh dưới đây tự sinh chuỗi ký cookie ngẫu nhiên:

```bash
cd /opt/yba-web
printf 'SESSION_SECRET="%s"\n' "$(openssl rand -base64 48)" > .env
```

Nếu đã có khoá trợ lý AI thì thêm vào (thay `sk-ant-...` bằng khoá thật):

```bash
echo 'ANTHROPIC_API_KEY="sk-ant-..."' >> .env
```

Chưa có khoá cũng không sao — web vẫn chạy, chỉ trang `/hoi-ai` báo "trợ lý chưa
được bật".

---

## Bước 4 — Đưa dữ liệu hiện có lên

Website hiện đã có **257 hội viên, 83 sự kiện, 9 bài viết** nằm trong file
`prisma/dev.db` trên máy anh. Chép nó vào chỗ Docker sẽ đọc:

```bash
mkdir -p /opt/yba-web/du-lieu /opt/yba-web/tai-len
cp /opt/yba-web/prisma/dev.db /opt/yba-web/du-lieu/ybacholon.db
```

**Bắt buộc — trao quyền ghi cho website:**

```bash
sudo chown -R 1001:1001 /opt/yba-web/du-lieu /opt/yba-web/tai-len
```

> Vì sao phải làm: website chạy bằng người dùng thường (mã số 1001) chứ không
> phải root, cho an toàn. File anh vừa chép bằng `cp` thuộc quyền root nên
> website **đọc được nhưng ghi không được**. Bỏ qua bước này thì trang nào cũng
> mở bình thường, nhưng hễ ai bấm nút lưu — đăng ký sự kiện, làm bài WHO AM I,
> tải ảnh lên — là báo *"A server error occurred"*.
>
> Chạy lại lệnh trên **mỗi lần** anh chép đè file cơ sở dữ liệu mới lên.

> Nếu file `prisma/dev.db` không có trong gói vừa đẩy lên (do bị loại lúc nén),
> chép riêng nó từ máy anh:
> ```bash
> scp "E:/Claude 07 2026 Mon Amie AI/yba-web/prisma/dev.db" root@123.45.67.89:/opt/yba-web/du-lieu/ybacholon.db
> ```

---

## Bước 5 — Bật website

```bash
cd /opt/yba-web
sudo docker compose up -d --build
```

Lần đầu mất khoảng **5–10 phút** vì phải dựng ảnh. Những lần sau chỉ vài giây.

Xem đã chạy chưa:

```bash
sudo docker compose ps
```

Cột `STATUS` ghi `Up ... (healthy)` là xong. Thử luôn:

```bash
curl -I http://127.0.0.1:3002/
```

Ra `HTTP/1.1 200 OK` là website đã sống.

---

## Bước 6 — Gắn tên miền và bật khoá HTTPS

Cài Nginx và công cụ cấp chứng chỉ:

```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Tạo cấu hình Nginx:

```bash
sudo tee /etc/nginx/sites-available/ybacholon.vn > /dev/null <<'CAUHINH'
server {
    listen 80;
    server_name ybacholon.vn www.ybacholon.vn;

    # Ảnh hội viên tải lên có thể tới 5 MB
    client_max_body_size 12M;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
CAUHINH

sudo ln -sf /etc/nginx/sites-available/ybacholon.vn /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Xin chứng chỉ HTTPS miễn phí — **nhớ xin cho cả `www`**, vì web cũ hỏng đúng ở
chỗ này:

```bash
sudo certbot --nginx -d ybacholon.vn -d www.ybacholon.vn --agree-tos -m info@ybacholon.vn --redirect
```

Xong. Mở trình duyệt vào **https://ybacholon.vn** là thấy website.

---

## Việc thường ngày

| Muốn làm gì | Gõ lệnh |
| --- | --- |
| Xem website đang chạy không | `sudo docker compose ps` |
| Xem nhật ký lúc có lỗi | `sudo docker compose logs -f --tail 100` |
| Khởi động lại | `sudo docker compose restart` |
| Tắt website | `sudo docker compose down` |
| Bật lại | `sudo docker compose up -d` |

Chạy tất cả trong thư mục `/opt/yba-web`.

---

## Cập nhật phiên bản mới

Khi tôi sửa xong tính năng mới, anh làm ba bước:

```bash
# 1. Đẩy mã nguồn mới lên (chạy TỪ MÁY ANH)
scp yba-web.tar.gz root@123.45.67.89:/opt/

# 2. Trong VPS: giải nén đè lên
cd /opt && tar -xzf yba-web.tar.gz && cd yba-web

# 3. Dựng lại và bật
sudo docker compose up -d --build
```

**Dữ liệu không mất.** Cơ sở dữ liệu và ảnh nằm ở hai thư mục `du-lieu/` và
`tai-len/` bên ngoài Docker, nâng cấp bao nhiêu lần cũng còn nguyên.

---

## Sao lưu — làm ngay sau khi chạy được

Đây là việc quan trọng nhất. Mất VPS mà có bản sao lưu thì dựng lại trong
30 phút; không có thì mất sạch 257 hồ sơ hội viên.

Tạo lệnh sao lưu hằng ngày lúc 2 giờ sáng:

```bash
sudo tee /usr/local/bin/sao-luu-yba.sh > /dev/null <<'SAOLUU'
#!/bin/bash
NGAY=$(date +%Y-%m-%d)
DICH=/opt/sao-luu
mkdir -p "$DICH"
tar -czf "$DICH/yba-$NGAY.tar.gz" -C /opt/yba-web du-lieu tai-len public/su-kien public/ban-chu-nhiem public/logo public/tin-tuc 2>/dev/null
# Giữ 30 ngày gần nhất
find "$DICH" -name 'yba-*.tar.gz' -mtime +30 -delete
SAOLUU

sudo chmod +x /usr/local/bin/sao-luu-yba.sh
echo "0 2 * * * /usr/local/bin/sao-luu-yba.sh" | sudo crontab -
```

Chạy thử ngay một lần cho chắc:

```bash
sudo /usr/local/bin/sao-luu-yba.sh && ls -lh /opt/sao-luu/
```

**Nên tải bản sao lưu về máy anh mỗi tháng một lần** — để cả trên VPS thì hỏng
VPS là mất luôn:

```bash
scp root@123.45.67.89:/opt/sao-luu/yba-*.tar.gz "E:/Sao luu YBA/"
```

---

## Khi có trục trặc

**Website không mở được** — xem nhật ký trước:

```bash
cd /opt/yba-web && sudo docker compose logs --tail 50
```

**Báo "Chưa đặt SESSION_SECRET"** — file `.env` chưa có hoặc sai chỗ. Làm lại
Bước 3.

**Trang mở được nhưng không có hội viên nào** — cơ sở dữ liệu chưa được chép
vào. Làm lại Bước 4 rồi `sudo docker compose restart`.

**Trang mở bình thường nhưng bấm nút lưu thì báo "A server error occurred"** —
đây là lỗi hay gặp nhất. Website không ghi được vào cơ sở dữ liệu. Sửa:

```bash
cd /opt/yba-web
sudo chown -R 1001:1001 du-lieu tai-len
sudo chmod -R u+rw du-lieu tai-len
sudo docker compose restart
```

Xem nhật ký thấy `SQLITE_READONLY` hoặc `attempt to write a readonly database`
là đúng bệnh này. Từ bản này trở đi, website tự kiểm tra quyền ghi lúc khởi
động và in sẵn lệnh sửa ra nhật ký, không để chạy tiếp trong tình trạng hỏng.

**Ảnh hội viên tải lên bị mất sau khi cập nhật** — thư mục `tai-len/` chưa được
gắn đúng. Kiểm tra:

```bash
ls /opt/yba-web/tai-len/
```

**HTTPS báo lỗi ở địa chỉ có `www`** — xin lại chứng chỉ cho cả hai tên:

```bash
sudo certbot --nginx -d ybacholon.vn -d www.ybacholon.vn --redirect
```

---

## Những gì Docker đã lo sẵn

- Cơ sở dữ liệu tự tạo bảng lúc khởi động, không phải gõ lệnh Prisma.
- Máy chủ tự bật lại nếu VPS khởi động lại hoặc web bị treo (`restart: unless-stopped`).
- Website chạy bằng người dùng thường, không phải `root` — có lỗ hổng cũng khó
  leo lên chiếm máy chủ.
- Nhật ký tự xoay vòng, tối đa 50 MB, không làm đầy ổ cứng.
- Khoá và mật khẩu nằm ở file `.env` bên ngoài, **không** nằm trong ảnh Docker.
