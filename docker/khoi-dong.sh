#!/bin/sh
# Chạy mỗi lần thùng chứa khởi động.
#
# 1. Kiểm tra quyền ghi TRƯỚC — thiếu quyền thì báo rõ ngay lúc bật, thay vì
#    để website chạy được nhưng hễ ai bấm nút lưu là lỗi khó hiểu.
# 2. Tạo hoặc cập nhật cấu trúc cơ sở dữ liệu.
# 3. Bật máy chủ Next.js.
set -e

THU_MUC_DL="/data"
THU_MUC_ANH="/app/public/tai-len"

# ── Quyền ghi ─────────────────────────────────────────────────────
# Website chạy bằng người dùng thường (uid 1001), không phải root. Nếu ổ đĩa
# gắn từ máy chủ thuộc quyền root thì đọc được mà ghi không được — trang chỉ
# hiển thị bình thường, còn mọi thao tác lưu dữ liệu đều hỏng.
kiem_tra_ghi() {
  duong="$1"
  ten="$2"
  if [ ! -d "$duong" ]; then
    echo "✗ Không thấy thư mục $duong ($ten)"
    return 1
  fi
  if ! touch "$duong/.thu-quyen-ghi" 2>/dev/null; then
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo "✗ KHÔNG GHI ĐƯỢC vào $duong ($ten)"
    echo ""
    echo "  Website sẽ hiển thị bình thường nhưng mọi thao tác lưu dữ liệu"
    echo "  sẽ báo lỗi: đăng ký sự kiện, làm bài WHO AM I, tải ảnh lên…"
    echo ""
    echo "  Sửa bằng cách chạy trên máy chủ (ngoài Docker):"
    echo ""
    echo "      cd /opt/yba-web"
    echo "      sudo chown -R 1001:1001 du-lieu tai-len"
    echo "      sudo docker compose restart"
    echo ""
    echo "════════════════════════════════════════════════════════════"
    echo ""
    return 1
  fi
  rm -f "$duong/.thu-quyen-ghi"
  echo "✓ Ghi được vào $duong ($ten)"
  return 0
}

loi=0
kiem_tra_ghi "$THU_MUC_DL" "cơ sở dữ liệu" || loi=1
kiem_tra_ghi "$THU_MUC_ANH" "ảnh tải lên" || loi=1
[ "$loi" -eq 0 ] || exit 1

echo "→ Kiểm tra cơ sở dữ liệu tại ${DATABASE_URL}"

# `db push` chỉ thêm bảng/cột còn thiếu; dữ liệu đang có giữ nguyên.
# --skip-generate vì Prisma Client đã sinh sẵn lúc dựng ảnh.
node node_modules/prisma/build/index.js db push --skip-generate --schema=prisma/schema.prisma

echo "→ Cơ sở dữ liệu sẵn sàng. Bật máy chủ ở cổng ${PORT}"
exec node server.js
