#!/bin/bash
# Sao lưu website ybacholon.vn: cơ sở dữ liệu + toàn bộ ảnh do người dùng tải lên.
# Chạy hằng ngày bằng cron, xem hướng dẫn trong DEPLOY.md.
set -euo pipefail

DU_AN="/var/www/yba"
DICH="/var/backups/yba"
NGAY=$(date +%F)
GIU_NGAY=30

mkdir -p "$DICH"

# ── 1. Cơ sở dữ liệu ────────────────────────────────────────────
# Đọc DATABASE_URL từ .env của dự án
DB_URL=$(grep -E '^DATABASE_URL=' "$DU_AN/.env" | cut -d= -f2- | tr -d '"')

if [[ "$DB_URL" == postgres* ]]; then
  pg_dump "$DB_URL" | gzip > "$DICH/csdl-$NGAY.sql.gz"
  echo "[$NGAY] Đã sao lưu PostgreSQL -> csdl-$NGAY.sql.gz"
else
  # Bản chạy thử dùng SQLite
  cp "$DU_AN/prisma/dev.db" "$DICH/csdl-$NGAY.db"
  gzip -f "$DICH/csdl-$NGAY.db"
  echo "[$NGAY] Đã sao lưu SQLite -> csdl-$NGAY.db.gz"
fi

# ── 2. Ảnh ──────────────────────────────────────────────────────
# Ba thư mục này KHÔNG nằm trong mã nguồn. Mất là mất hẳn.
tar -czf "$DICH/anh-$NGAY.tar.gz" \
  -C "$DU_AN/public" \
  --ignore-failed-read \
  su-kien ban-chu-nhiem tai-len 2>/dev/null || true
echo "[$NGAY] Đã sao lưu ảnh -> anh-$NGAY.tar.gz"

# ── 3. Dọn bản sao lưu cũ ───────────────────────────────────────
find "$DICH" -name 'csdl-*' -mtime +$GIU_NGAY -delete
find "$DICH" -name 'anh-*'  -mtime +$GIU_NGAY -delete

echo "[$NGAY] Xong. Dung lượng thư mục sao lưu: $(du -sh "$DICH" | cut -f1)"
