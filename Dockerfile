# Ảnh Docker cho website YBA Chợ Lớn.
#
# Dựng ba tầng để ảnh cuối nhẹ: cài gói → biên dịch → chỉ chép phần cần chạy.
# Xem HUONG-DAN-DOCKER.md để biết cách dùng.

# ── Tầng 1: cài gói ───────────────────────────────────────────────
FROM node:22-slim AS deps
WORKDIR /app

# openssl là thứ Prisma cần để tự nhận diện nền tảng
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ── Tầng 2: biên dịch ─────────────────────────────────────────────
FROM node:22-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next thu thập dữ liệu trang lúc build nên phải có DATABASE_URL trỏ vào một
# file có thật. Đây chỉ là CSDL tạm để build, không đi vào ảnh cuối.
ENV DATABASE_URL="file:/tmp/build.db"
ENV SESSION_SECRET="chuoi-tam-luc-build-khong-dung-de-chay-that"
ENV NEXT_TELEMETRY_DISABLED=1

RUN npx prisma generate \
    && npx prisma db push --skip-generate --accept-data-loss \
    && npm run build

# ── Tầng 3: chạy thật ─────────────────────────────────────────────
FROM node:22-slim AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3002
ENV HOSTNAME=0.0.0.0

# Chạy bằng người dùng thường, không phải root
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Bản standalone đã gói sẵn Node cần thiết — không cần chép node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Mã nguồn + scripts để chạy việc bảo trì bằng `docker compose exec` (nhập
# ngược thành tích, soát điểm, nhập khen thưởng…). Bản standalone không chép
# các file .ts này vì lúc chạy web không cần tới.
#
# tsconfig.json BẮT BUỘC phải có: `npx tsx` đọc mục `paths` trong đó để hiểu
# đường dẫn `@/lib/...`. Thiếu file này thì mọi script có import qua `@/` đều
# chết với "Cannot find module '@/lib/prisma'" (đã dính trên máy chủ 24/08/2026),
# trong khi script chỉ dùng đường dẫn tương đối `../src/...` vẫn chạy bình thường
# — nên lỗi rất dễ tưởng nhầm là hỏng CSDL.
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Thiệp mời JPG 10/10 — thư mục RIÊNG TƯ (ngoài public/), phục vụ qua
# /api/khach-moi-1010/thiep/<mã> để chỉ chủ thiệp xem được
COPY --from=builder --chown=nextjs:nodejs /app/thiep-1010 ./thiep-1010

# Prisma CLI + schema để chạy `db push` khi máy chủ khởi động lần đầu
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=nextjs:nodejs docker/khoi-dong.sh ./khoi-dong.sh
RUN chmod +x ./khoi-dong.sh

# Nơi chứa CSDL và ảnh người dùng tải lên — gắn ổ đĩa ngoài vào đây
RUN mkdir -p /data /app/public/tai-len && chown -R nextjs:nodejs /data /app/public

USER nextjs
EXPOSE 3002

# Kiểm tra sống: máy chủ trả về trang chủ là coi như khoẻ
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3002/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["./khoi-dong.sh"]
