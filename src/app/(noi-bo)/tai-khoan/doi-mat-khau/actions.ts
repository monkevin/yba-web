"use server";

import { headers } from "next/headers";
import {
  capLaiCookiePhien,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { loiMatKhauMoi } from "@/lib/dang-nhap";
import {
  bamIp,
  ghiThanhCong,
  ghiThatBai,
  kiemTraGioiHan,
  layIp,
  moTaThoiGianCho,
} from "@/lib/gioi-han-dang-nhap";
import { prisma } from "@/lib/prisma";

export type KetQuaDoiMatKhau = {
  error?: string;
  ok?: boolean;
  message?: string;
};

/**
 * Hội viên tự đổi mật khẩu. Bắt nhập mật khẩu hiện tại (máy đang đăng nhập có
 * thể là máy mượn), và dùng chung bộ giới hạn thử sai với trang đăng nhập để
 * không dò được mật khẩu cũ qua form này.
 */
export async function doiMatKhau(duLieu: {
  matKhauCu: string;
  matKhauMoi: string;
  nhapLai: string;
}): Promise<KetQuaDoiMatKhau> {
  const user = await getCurrentUser();
  if (!user)
    return { error: "Phiên đăng nhập đã hết — vui lòng đăng nhập lại" };

  const matKhauCu = String(duLieu?.matKhauCu ?? "");
  const matKhauMoi = String(duLieu?.matKhauMoi ?? "");
  const nhapLai = String(duLieu?.nhapLai ?? "");

  if (!matKhauCu) return { error: "Nhập mật khẩu hiện tại" };
  if (matKhauMoi !== nhapLai)
    return { error: "Hai lần nhập mật khẩu mới không khớp" };

  const khoa = `doimk:${user.id}`;
  const may = bamIp(layIp(await headers()));
  const gioiHan = kiemTraGioiHan(khoa, may);
  if (!gioiHan.choPhep) {
    return {
      error: `Nhập sai mật khẩu hiện tại nhiều lần. Vui lòng thử lại sau ${moTaThoiGianCho(gioiHan.conLaiGiay)}.`,
    };
  }

  let moc = new Date();
  try {
    const tk = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true, member: { select: { phone: true } } },
    });
    if (!tk) return { error: "Không tìm thấy tài khoản" };

    if (!(await verifyPassword(matKhauCu, tk.passwordHash))) {
      const cho = ghiThatBai(khoa, may);
      return {
        error:
          cho > 0
            ? `Mật khẩu hiện tại không đúng. Vui lòng thử lại sau ${moTaThoiGianCho(cho)}.`
            : "Mật khẩu hiện tại không đúng",
      };
    }
    ghiThanhCong(khoa, may);

    const loi = loiMatKhauMoi(matKhauMoi, {
      tenDangNhap: user.username,
      soDienThoai: tk.member?.phone,
    });
    if (loi) return { error: loi };
    if (matKhauMoi === matKhauCu) {
      return { error: "Mật khẩu mới phải khác mật khẩu hiện tại" };
    }

    // hashPassword dùng đúng cost bcrypt của auth.ts
    moc = new Date();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await hashPassword(matKhauMoi),
        // Mốc này đá MỌI phiên cũ hơn nó (xem `phienConHieuLuc` trong auth.ts) —
        // đổi mật khẩu vì nghi bị lộ phiên thì kẻ kia phải đăng nhập lại
        passwordChangedAt: moc,
      },
    });
  } catch {
    return {
      error: "Chưa lưu được mật khẩu mới — vui lòng thử lại sau ít phút",
    };
  }

  // …trừ chính trình duyệt đang dùng: cấp lại cookie với `iat` = đúng mốc vừa
  // ghi, nên phiên này còn hiệu lực còn các máy khác thì không. Đặt NGOÀI khối
  // try ở trên: mật khẩu đã đổi thật rồi, hỏng ở bước này chỉ là phải đăng nhập
  // lại — không được báo "chưa lưu được mật khẩu".
  try {
    await capLaiCookiePhien(user.id, moc.getTime());
  } catch {
    return {
      ok: true,
      message:
        "Đã đổi mật khẩu. Vui lòng đăng nhập lại bằng mật khẩu mới trên mọi thiết bị.",
    };
  }

  return {
    ok: true,
    message:
      "Đã đổi mật khẩu. Các thiết bị khác đang đăng nhập tài khoản này sẽ phải đăng nhập lại bằng mật khẩu mới.",
  };
}
