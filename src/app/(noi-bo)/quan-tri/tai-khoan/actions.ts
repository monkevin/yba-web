"use server";

import { revalidatePath } from "next/cache";
import {
  capLaiCookiePhien,
  hashPassword,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { loiMatKhauMoi } from "@/lib/dang-nhap";
import { prisma } from "@/lib/prisma";
import { NHOM_QUYEN, QUYEN, VAI_TRO_CHON, co } from "@/lib/quyen";

export type KetQua = {
  error?: string;
  ok?: boolean;
  message?: string;
  /** Hồ sơ muốn gắn đang thuộc tài khoản khác — cho phép tích "chuyển sang" */
  canChuyen?: boolean;
  tuTaiKhoan?: string;
  /** Tài khoản đang giữ hồ sơ lúc cảnh báo — chỉ chuyển khi xác nhận đúng tài khoản này */
  chuyenTuId?: string;
};

function chuoi(fd: FormData, k: string): string {
  return String(fd.get(k) ?? "").trim();
}

/** Toàn bộ mã quyền hợp lệ — chặn người dùng gửi mã bịa qua form. */
const MA_HOP_LE = new Set(NHOM_QUYEN.flatMap((n) => n.quyen.map((q) => q.ma)));

/**
 * Đọc vai trò từ form (6 mã trong VAI_TRO_CHON) → cặp (role, chucVu) lưu
 * CSDL. Nhận cả mã cũ "STAFF" cho tương thích.
 */
function docVaiTro(fd: FormData): { role: string; chucVu: string | null } | null {
  const ma = chuoi(fd, "role");
  if (ma === "STAFF") return { role: "STAFF", chucVu: "BDH" };
  const v = VAI_TRO_CHON.find((x) => x.ma === ma);
  return v ? { role: v.role, chucVu: v.chucVu } : null;
}

/** Đọc các ô đã tích trong checklist quyền. */
function docQuyenTuForm(fd: FormData): string[] {
  return fd
    .getAll("quyen")
    .map(String)
    .filter((m) => MA_HOP_LE.has(m as never));
}

async function nguoiQuanLy() {
  const user = await requireUser();
  if (!co(user, QUYEN.TAI_KHOAN_QUAN_LY)) {
    return { error: "Không có quyền quản lý tài khoản" as const };
  }
  return { user };
}

/** Tạo tài khoản mới kèm bộ quyền. */
export async function taoTaiKhoan(
  _prev: KetQua,
  fd: FormData,
): Promise<KetQua> {
  const q = await nguoiQuanLy();
  if ("error" in q) return { error: q.error };

  const username = chuoi(fd, "username").toLowerCase();
  const name = chuoi(fd, "name");
  const password = chuoi(fd, "password");
  const vaiTro = docVaiTro(fd) ?? { role: "MEMBER", chucVu: null };
  const role = vaiTro.role;
  const memberId = chuoi(fd, "memberId") || null;

  // Chặn trên 32 ký tự: route đăng nhập bỏ qua định danh dài hơn 100 ký tự nên
  // tên quá dài là tạo ra tài khoản không bao giờ đăng nhập được
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return {
      error: "Tên đăng nhập 3–32 ký tự, chỉ chữ thường / số / . _ -",
    };
  }
  // Ô đăng nhập nhận cả SĐT: tên toàn số (hoặc số + dấu chấm) sẽ lẫn với SĐT
  if (!/[a-z]/.test(username)) {
    return {
      error:
        "Tên đăng nhập phải có ít nhất một chữ cái (tên toàn số dễ lẫn với số điện thoại)",
    };
  }
  const loiMk = loiMatKhauMoi(password, { tenDangNhap: username, toiThieu: 6 });
  if (loiMk) return { error: loiMk.replace("Mật khẩu mới", "Mật khẩu") };
  if (!name) return { error: "Nhập họ tên" };

  // Chỉ cấp lãnh đạo mới được tạo thêm tài khoản cấp lãnh đạo
  if (role === "ADMIN" && q.user.role !== "ADMIN") {
    return { error: "Chỉ cấp lãnh đạo mới được tạo tài khoản cấp lãnh đạo" };
  }

  if (await prisma.user.findUnique({ where: { username } })) {
    return { error: "Tên đăng nhập đã tồn tại" };
  }
  if (memberId && (await prisma.user.findUnique({ where: { memberId } }))) {
    return { error: "Hội viên này đã có tài khoản" };
  }

  // Cấp lãnh đạo: tích = giới hạn bớt (trống = toàn quyền); BDH: theo tích
  const quyen = role === "MEMBER" ? [] : docQuyenTuForm(fd);

  await prisma.user.create({
    data: {
      username,
      name,
      role,
      chucVu: vaiTro.chucVu,
      memberId,
      permissions: quyen.length ? JSON.stringify(quyen) : null,
      passwordHash: await hashPassword(password),
    },
  });

  revalidatePath("/quan-tri/tai-khoan");
  return { ok: true, message: `Đã tạo tài khoản ${username}` };
}

/** Đổi vai trò và bộ quyền của một tài khoản đã có. */
export async function luuQuyen(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await nguoiQuanLy();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const vaiTro = docVaiTro(fd);
  if (!vaiTro) return { error: "Vai trò không hợp lệ" };
  const role = vaiTro.role;

  const dich = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, username: true },
  });
  if (!dich) return { error: "Không tìm thấy tài khoản" };

  if (q.user.role !== "ADMIN" && (role === "ADMIN" || dich.role === "ADMIN")) {
    return {
      error: "Chỉ cấp lãnh đạo mới được đổi quyền của tài khoản cấp lãnh đạo",
    };
  }
  // Không cho tự hạ quyền chính mình rồi khoá cứng hệ thống
  if (dich.id === q.user.id && role !== "ADMIN" && q.user.role === "ADMIN") {
    return { error: "Không thể tự hạ vai trò cấp lãnh đạo của chính mình" };
  }

  // Cấp lãnh đạo: tích = giới hạn bớt (trống = toàn quyền); BDH: theo tích
  const quyen = role === "MEMBER" ? [] : docQuyenTuForm(fd);

  // Chống tự khoá: tự giới hạn quyền của MÌNH thì bắt buộc giữ quyền
  // "Quản lý tài khoản" — mất nó là không ai gỡ được cho mình nữa
  if (
    dich.id === q.user.id &&
    quyen.length > 0 &&
    !quyen.includes(QUYEN.TAI_KHOAN_QUAN_LY)
  ) {
    return {
      error:
        "Tự giới hạn quyền của chính mình thì phải giữ ô “Quản lý tài khoản” — không thì không ai sửa lại được cho anh/chị.",
    };
  }

  await prisma.user.update({
    where: { id },
    data: {
      role,
      chucVu: vaiTro.chucVu,
      permissions: quyen.length ? JSON.stringify(quyen) : null,
    },
  });

  revalidatePath("/quan-tri/tai-khoan");
  return { ok: true, message: `Đã lưu quyền cho ${dich.username}` };
}

/**
 * Đổi TÊN HIỂN THỊ và/hoặc TÊN ĐĂNG NHẬP của một tài khoản (sửa chính tả,
 * đổi cách gọi — Chủ nhiệm yêu cầu 24/09). Lưu ý: tài khoản gắn hồ sơ hội
 * viên sẽ bị script dong-bo-tai-khoan đè lại name + username theo hồ sơ.
 */
export async function doiTen(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await nguoiQuanLy();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const name = chuoi(fd, "name");
  const username = chuoi(fd, "username").toLowerCase();

  const dich = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, username: true, name: true },
  });
  if (!dich) return { error: "Không tìm thấy tài khoản" };
  if (dich.role === "ADMIN" && q.user.role !== "ADMIN") {
    return { error: "Chỉ cấp lãnh đạo mới đổi được tài khoản cấp lãnh đạo" };
  }

  if (!name || name.length < 2 || name.length > 80) {
    return { error: "Tên hiển thị 2–80 ký tự" };
  }
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) {
    return { error: "Tên đăng nhập 3–32 ký tự, chỉ chữ thường / số / . _ -" };
  }
  if (!/[a-z]/.test(username)) {
    return {
      error:
        "Tên đăng nhập phải có ít nhất một chữ cái (tên toàn số dễ lẫn với số điện thoại)",
    };
  }
  if (username !== dich.username) {
    const trung = await prisma.user.findUnique({ where: { username } });
    if (trung) return { error: "Tên đăng nhập này đã có người dùng" };
  }

  await prisma.user.update({ where: { id }, data: { name, username } });
  revalidatePath("/quan-tri/tai-khoan");
  return {
    ok: true,
    message:
      username !== dich.username
        ? `Đã đổi: ${dich.username} → ${username}. Nhớ báo người dùng tên đăng nhập mới.`
        : `Đã đổi tên hiển thị thành “${name}”.`,
  };
}

/** Đặt lại mật khẩu. */
export async function datLaiMatKhau(
  _prev: KetQua,
  fd: FormData,
): Promise<KetQua> {
  const q = await nguoiQuanLy();
  if ("error" in q) return { error: q.error };

  const matKhau = chuoi(fd, "matKhau");

  const id = chuoi(fd, "id");
  const dich = await prisma.user.findUnique({
    where: { id },
    select: { role: true, username: true },
  });
  if (!dich) return { error: "Không tìm thấy tài khoản" };
  // Không cho cấp lại mật khẩu dễ đoán (123456…) — đó chính là lỗ hổng đang phải vá
  const loiMk = loiMatKhauMoi(matKhau, {
    tenDangNhap: dich.username,
    toiThieu: 6,
  });
  if (loiMk) return { error: loiMk.replace("Mật khẩu mới", "Mật khẩu") };
  if (dich.role === "ADMIN" && q.user.role !== "ADMIN") {
    return { error: "Chỉ Chủ nhiệm mới đổi được mật khẩu tài khoản Chủ nhiệm" };
  }

  // Mốc `passwordChangedAt` đá mọi phiên cũ hơn nó (xem `phienConHieuLuc` trong
  // auth.ts): cấp lại mật khẩu cho người bị lộ tài khoản thì kẻ đang giữ phiên
  // của họ cũng bị đuổi ra, không chỉ đổi mật khẩu suông.
  const moc = new Date();
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(matKhau), passwordChangedAt: moc },
  });
  // Tự cấp lại mật khẩu của chính mình thì đừng tự đá mình khỏi trang đang mở
  if (id === q.user.id) {
    try {
      await capLaiCookiePhien(q.user.id, moc.getTime());
    } catch {
      // Mật khẩu đã đổi thật; hỏng ở bước cookie chỉ là phải đăng nhập lại
    }
  }

  revalidatePath("/quan-tri/tai-khoan");
  return {
    ok: true,
    message:
      id === q.user.id
        ? "Đã đặt lại mật khẩu. Các thiết bị khác của anh/chị phải đăng nhập lại."
        : `Đã đặt lại mật khẩu cho ${dich.username}. Mọi phiên đang đăng nhập của tài khoản này bị thoát.`,
  };
}

/** Khoá / mở khoá tài khoản. */
export async function doiKhoa(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await nguoiQuanLy();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  if (id === q.user.id)
    return { error: "Không thể tự khoá tài khoản của mình" };

  const dich = await prisma.user.findUnique({
    where: { id },
    select: { active: true, role: true },
  });
  if (!dich) return { error: "Không tìm thấy tài khoản" };
  if (dich.role === "ADMIN" && q.user.role !== "ADMIN") {
    return { error: "Chỉ Chủ nhiệm mới khoá được tài khoản Chủ nhiệm" };
  }

  await prisma.user.update({ where: { id }, data: { active: !dich.active } });
  revalidatePath("/quan-tri/tai-khoan");
  return {
    ok: true,
    message: dich.active ? "Đã khoá tài khoản" : "Đã mở khoá",
  };
}

/**
 * Gắn / đổi / bỏ hồ sơ hội viên cho một tài khoản. Dùng khi tài khoản quản trị
 * (admin, thư ký…) cần hiện tên người + doanh nghiệp trong game và giao dịch.
 * Mỗi hồ sơ chỉ gắn một tài khoản: hồ sơ đang thuộc tài khoản khác thì phải tích
 * "chuyển sang" — tài khoản cũ vẫn đăng nhập được nhưng không còn gắn doanh nghiệp.
 */
export async function ganHoiVien(_prev: KetQua, fd: FormData): Promise<KetQua> {
  const q = await nguoiQuanLy();
  if ("error" in q) return { error: q.error };

  const id = chuoi(fd, "id");
  const memberId = chuoi(fd, "memberId") || null;
  const chuyen = chuoi(fd, "chuyen") === "1";
  const chuyenTu = chuoi(fd, "chuyenTu");

  const dich = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, username: true, memberId: true },
  });
  if (!dich) return { error: "Không tìm thấy tài khoản" };
  if (dich.role === "ADMIN" && q.user.role !== "ADMIN") {
    return {
      error: "Chỉ Chủ nhiệm mới đổi được hồ sơ gắn với tài khoản Chủ nhiệm",
    };
  }

  if (!memberId) {
    if (!dich.memberId)
      return { ok: true, message: "Tài khoản này chưa gắn hồ sơ nào" };
    await prisma.user.update({ where: { id }, data: { memberId: null } });
    revalidatePath("/quan-tri/tai-khoan");
    return { ok: true, message: `Đã bỏ gắn hồ sơ khỏi ${dich.username}` };
  }
  if (dich.memberId === memberId)
    return { ok: true, message: "Tài khoản đã gắn đúng hồ sơ này" };

  const hoSo = await prisma.member.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      name: true,
      user: { select: { id: true, username: true, role: true } },
    },
  });
  if (!hoSo) return { error: "Không tìm thấy hồ sơ hội viên" };

  const cu = hoSo.user && hoSo.user.id !== id ? hoSo.user : null;
  // Ô "chuyển" chỉ có hiệu lực cho đúng tài khoản đã cảnh báo — đổi sang hồ sơ
  // khác thì phải xác nhận lại, không chuyển âm thầm
  if (cu && !(chuyen && chuyenTu === cu.id)) {
    return {
      error: `Hồ sơ ${hoSo.name} đang gắn với tài khoản ${cu.username}. Tích ô “Chuyển hồ sơ” rồi bấm Lưu nếu muốn chuyển sang ${dich.username}, hoặc cấp quyền cho chính tài khoản ${cu.username}.`,
      canChuyen: true,
      tuTaiKhoan: cu.username,
      chuyenTuId: cu.id,
    };
  }
  if (cu && cu.role === "ADMIN" && q.user.role !== "ADMIN") {
    return {
      error: "Chỉ Chủ nhiệm mới chuyển được hồ sơ khỏi tài khoản Chủ nhiệm",
    };
  }

  // Bỏ gắn khỏi tài khoản cũ trước — memberId là khoá duy nhất
  try {
    await prisma.$transaction([
      ...(cu
        ? [
            prisma.user.update({
              where: { id: cu.id },
              data: { memberId: null },
            }),
          ]
        : []),
      prisma.user.update({ where: { id }, data: { memberId } }),
    ]);
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") {
      return {
        error:
          "Hồ sơ này vừa được gắn cho tài khoản khác — tải lại trang rồi thử lại",
      };
    }
    throw e;
  }

  revalidatePath("/quan-tri/tai-khoan");
  revalidatePath("/ngoi-nha", "layout");
  return {
    ok: true,
    message: cu
      ? `Đã chuyển hồ sơ ${hoSo.name} từ ${cu.username} sang ${dich.username}. Tài khoản ${cu.username} vẫn đăng nhập được nhưng không còn gắn doanh nghiệp.`
      : `Đã gắn ${dich.username} với hồ sơ ${hoSo.name}`,
  };
}

/** Mật khẩu khởi tạo cũ của dữ liệu mẫu (prisma/seed.ts) — phải được đổi hết. */
const MAT_KHAU_MAC_DINH = "123456";

export type KetQuaKiemTraMatKhau = {
  error?: string;
  tongSo?: number;
  danhSach?: string[];
};

/**
 * Đếm tài khoản ĐANG DÙNG còn mật khẩu mặc định. So bcrypt lần lượt từng tài
 * khoản (cost 10, ~70 ms/lần → ~20 giây cho 260 tài khoản) — tuần tự để không
 * chiếm hết CPU của máy chủ đang phục vụ người chơi. Chỉ trả tên đăng nhập, không
 * trả gì khác.
 */
export async function kiemTraMatKhauMacDinh(): Promise<KetQuaKiemTraMatKhau> {
  const q = await nguoiQuanLy();
  if ("error" in q) return { error: q.error };

  try {
    const ds = await prisma.user.findMany({
      where: { active: true },
      orderBy: [{ role: "asc" }, { username: "asc" }],
      select: { username: true, passwordHash: true },
    });
    const conMacDinh: string[] = [];
    for (const u of ds) {
      if (await verifyPassword(MAT_KHAU_MAC_DINH, u.passwordHash)) {
        conMacDinh.push(u.username);
      }
    }
    return { tongSo: ds.length, danhSach: conMacDinh };
  } catch {
    return { error: "Chưa kiểm tra được — vui lòng thử lại sau ít phút" };
  }
}
