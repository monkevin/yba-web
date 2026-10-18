#!/bin/sh
set -e

echo "==> Kiểm tra / đồng bộ cơ sở dữ liệu..."
./node_modules/.bin/prisma db push

# SEED ĐÃ BỎ (25/09/2026 — Chủ tịch chốt sau sự cố): seed XOÁ SẠCH tài
# khoản, giao dịch, tin đăng, bài viết… nên tuyệt đối không tự chạy trên
# máy chủ thật. Hai đêm 24–25/09 dòng seed ở đây đã xoá tài khoản thật
# (kimngan, kieulinh, ~65 tài khoản hội viên) sau mỗi lần build. Muốn nạp
# dữ liệu mẫu phải chạy TAY và cố ý:
#   ./node_modules/.bin/tsx prisma/seed.ts --cho-phep-xoa
# (seed.ts cũng đã có phanh an toàn tự dừng khi gặp dữ liệu thật.)

echo "==> Khởi động máy chủ Next.js..."
exec node server.js
