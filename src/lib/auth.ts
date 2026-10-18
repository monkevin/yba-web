import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { co, type MaQuyen } from "@/lib/quyen";

export const SESSION_COOKIE = "yba_session";

/** Cookie phiên sống 30 ngày (dùng chung cho lúc đăng nhập và lúc cấp lại). */
export const THOI_HAN_PHIEN_GIAY = 60 * 60 * 24 * 30;

/**
 * Biên cho lệch đồng hồ khi so `iat` của cookie với `User.passwordChangedAt`.
 * Hai mốc này do hai đường ghi khác nhau sinh ra (một cái là `Date.now()` lúc ký
 * cookie, một cái là giờ ghi vào CSDL) nên chênh vài mili giây là chuyện thường;
 * thiếu biên thì chính người vừa đổi mật khẩu bị đá ra.
 */
export const BIEN_LECH_DONG_HO_MS = 5000;

function secret() {
  return process.env.SESSION_SECRET || "dev-secret-change-me";
}

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("hex");
}

/**
 * Tạo giá trị cookie phiên đăng nhập cho user.
 *
 * `iat` (mốc cấp phiên) là thứ để so với `User.passwordChangedAt` — truyền tay
 * khi muốn mốc chính xác bằng mốc vừa ghi vào CSDL (xem `capLaiCookiePhien`).
 */
export function createSessionValue(userId: string, iat = Date.now()): string {
  const payload = b64url(JSON.stringify({ uid: userId, iat }));
  return `${payload}.${sign(payload)}`;
}

export type DuLieuPhien = {
  uid: string;
  /** Mốc cấp phiên (ms). `null` với cookie đời cũ không ghi `iat`. */
  iat: number | null;
};

/**
 * Xác minh chữ ký cookie rồi trả nội dung phiên (userId + mốc cấp), hoặc null
 * nếu chữ ký sai / nội dung hỏng.
 */
export function docPhien(value: string | undefined): DuLieuPhien | null {
  if (!value) return null;
  const idx = value.lastIndexOf(".");
  if (idx <= 0) return null;

  const payload = value.slice(0, idx);
  const signature = value.slice(idx + 1);
  const expected = sign(payload);

  if (signature.length !== expected.length) return null;
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data?.uid !== "string") return null;
    return {
      uid: data.uid,
      iat:
        typeof data?.iat === "number" && Number.isFinite(data.iat)
          ? data.iat
          : null,
    };
  } catch {
    return null;
  }
}

/** Xác minh chữ ký cookie và trả về userId, hoặc null nếu không hợp lệ. */
export function readSessionValue(value: string | undefined): string | null {
  return docPhien(value)?.uid ?? null;
}

/**
 * Phiên cấp lúc `iat` có còn dùng được sau khi mật khẩu đổi lúc `doiLuc` không?
 *
 * Cookie phiên ký HMAC sống 30 ngày và máy chủ không giữ danh sách phiên, nên
 * trước đây đổi mật khẩu KHÔNG đuổi được kẻ đã lấy mất phiên. Mốc
 * `User.passwordChangedAt` chính là "đường ranh": mọi phiên cấp trước mốc đó coi
 * như chưa đăng nhập.
 *
 * - Chưa từng đổi mật khẩu (`null`) → giữ nguyên như cũ, không ai bị đá.
 * - Cookie đời cũ không có `iat` → không chứng minh được là cấp sau, coi như cũ.
 */
export function phienConHieuLuc(
  iat: number | null,
  doiLuc: Date | null | undefined,
): boolean {
  if (!doiLuc) return true;
  if (iat === null) return false;
  return iat >= doiLuc.getTime() - BIEN_LECH_DONG_HO_MS;
}

/** Tuỳ chọn đặt cookie phiên. `laHttps` xem ghi chú ở `api/auth/login/route.ts`. */
export function tuyChonCookiePhien(laHttps: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: THOI_HAN_PHIEN_GIAY,
    secure: laHttps,
  };
}

/**
 * Người dùng đang vào bằng https hay không, đoán từ header của request.
 * Sau Nginx thì có `X-Forwarded-Proto`; vào thẳng cổng 3002 (LAN) thì không có,
 * lúc đó dựa vào `Origin` / `Referer` — server action luôn gửi `Origin`.
 *
 * Đoán SAI thành `true` khi đang chạy http là trình duyệt bỏ cookie → người vừa
 * đổi mật khẩu bị đá ra, nên mặc định là `false`.
 */
export function laHttpsTuHeaders(h: Headers): boolean {
  const proto = h.get("x-forwarded-proto");
  if (proto) return proto.split(",")[0].trim().toLowerCase() === "https";
  const goc = h.get("origin") || h.get("referer") || "";
  return goc.toLowerCase().startsWith("https://");
}

/**
 * Cấp lại cookie phiên cho CHÍNH trình duyệt đang gửi request. Gọi trong server
 * action ngay sau khi ghi `passwordChangedAt`, để người vừa đổi mật khẩu không
 * bị chính mốc mình vừa ghi đá ra (các máy khác thì vẫn bị, đó là chủ đích).
 */
export async function capLaiCookiePhien(
  userId: string,
  iat = Date.now(),
): Promise<void> {
  const [store, h] = await Promise.all([cookies(), headers()]);
  store.set(
    SESSION_COOKIE,
    createSessionValue(userId, iat),
    tuyChonCookiePhien(laHttpsTuHeaders(h)),
  );
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export type Role = "ADMIN" | "STAFF" | "MEMBER";

export type CurrentUser = {
  id: string;
  name: string;
  username: string;
  role: Role;
  /// Chuỗi JSON mảng mã quyền — đọc bằng các hàm trong `src/lib/quyen.ts`
  permissions: string | null;
  memberId: string | null;
  memberName: string | null;
  memberCode: string | null;
};

/**
 * Nạp người dùng đang đăng nhập từ cookie (đọc DB).
 * Trả null nếu chưa đăng nhập, tài khoản đã bị vô hiệu hoá, hoặc phiên được cấp
 * TRƯỚC lần đổi mật khẩu gần nhất (xem `phienConHieuLuc`).
 *
 * Bọc `cache` của React: một request dựng cả layout lẫn page (song song) nên hàm
 * này bị gọi nhiều lần: cache gom lại còn MỘT truy vấn User. Ngoài Next (script
 * chạy bằng tsx) `cache` chỉ là gọi thẳng, không cache — vẫn chạy đúng.
 */
export const getCurrentUser = cache(
  async function getCurrentUser(): Promise<CurrentUser | null> {
    const store = await cookies();
    const phien = docPhien(store.get(SESSION_COOKIE)?.value);
    if (!phien) return null;

    const user = await prisma.user.findUnique({
      where: { id: phien.uid },
      include: { member: { select: { id: true, name: true, code: true } } },
    });
    if (!user || !user.active) return null;
    if (!phienConHieuLuc(phien.iat, user.passwordChangedAt)) return null;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role as Role,
      permissions: user.permissions,
      memberId: user.memberId,
      memberName: user.member?.name ?? null,
      memberCode: user.member?.code ?? null,
    };
  },
);

/** Dùng trong server action. Ném lỗi nếu chưa đăng nhập. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Chưa đăng nhập");
  return user;
}

/**
 * Dùng trong PAGE của khu nội bộ: chưa đăng nhập thì chuyển về trang đăng nhập
 * thay vì đổ lỗi 500.
 *
 * `src/proxy.ts` đã chặn sẵn ở lớp ngoài, nhưng nó chỉ kiểm tra CHỮ KÝ cookie —
 * cookie còn hợp lệ mà tài khoản đã bị xoá / khoá / đã đổi mật khẩu ở máy khác
 * thì vẫn lọt vào tới đây. Ngoài ra Next dựng layout và page SONG SONG, nên
 * không thể trông chờ layout redirect kịp trước khi page chạy.
 *
 * Đưa về `/login?het=1` chứ KHÔNG phải `/login`: cookie còn chữ ký hợp lệ thì
 * proxy.ts đẩy `/login` về `/tai-khoan` → lại về đây → vòng lặp. Với `het=1`
 * proxy để yên trang đăng nhập và xoá cookie.
 */
export async function requireUserPage(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?het=1");
  return user;
}

export function isAdmin(user: CurrentUser): boolean {
  return user.role === "ADMIN";
}

/** Ban điều hành hoặc cán bộ ban — được nhập hộ và xem toàn bộ dữ liệu. */
export function isBackOffice(user: CurrentUser): boolean {
  return user.role === "ADMIN" || user.role === "STAFF";
}

/**
 * Bắt buộc phải có quyền cụ thể, dùng trong PAGE của khu quản trị.
 * Không có quyền thì đưa về trang chủ quản trị thay vì báo lỗi.
 */
export async function requireQuyen(ma: MaQuyen): Promise<CurrentUser> {
  const user = await requireUserPage();
  if (!co(user, ma)) redirect("/quan-tri?thieu-quyen=1");
  return user;
}

/** Bắt buộc phải có quyền cụ thể, dùng trong SERVER ACTION. */
export async function requireQuyenAction(ma: MaQuyen): Promise<CurrentUser> {
  const user = await requireUser();
  if (!co(user, ma)) throw new Error("Không có quyền thực hiện thao tác này");
  return user;
}
