"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { QUYEN, co } from "@/lib/quyen";
import { makeMemberCode } from "@/lib/deal";
import {
  hoiVienKhacCungSdt,
  laLoiTrungKhoa,
  maHoiVienTiepTheo,
  soLonNhatMaHoiVien,
} from "@/lib/dang-nhap";
import { buildMemberSearchText } from "@/lib/search";
import { uniqueSlug } from "@/lib/slug";
import { chuanSoDienThoai, soDienThoaiDeLuu } from "@/lib/so-dien-thoai";

export type ActionResult = { error?: string; ok?: boolean; message?: string };

/*
 * Mã hội viên kế tiếp: CHỈ xét mã dạng HV + số (src/lib/dang-nhap.ts). Bản cũ lấy
 * `orderBy code desc` nên vớ phải KDZ003 (hồ sơ kiểm duyệt Zalo) → sinh HV0004
 * đã có → lỗi trùng mã, không thêm được hội viên nào.
 */

/** Đường dẫn hồ sơ công khai /doanh-nghiep/<slug>, bảo đảm chưa trùng. */
function newMemberSlug(company: string): Promise<string> {
  return uniqueSlug(
    company,
    async (s) =>
      !!(await prisma.member.findUnique({
        where: { slug: s },
        select: { id: true },
      })),
    "doanh-nghiep",
  );
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

export async function saveMember(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!co(user, QUYEN.HOI_VIEN_SUA))
    return { error: "Không có quyền sửa hội viên" };

  const id = str(fd, "id");
  const company = str(fd, "company");
  const name = str(fd, "name");
  if (!company) return { error: "Nhập tên doanh nghiệp" };
  if (!name) return { error: "Nhập tên người đại diện" };

  const data = {
    company,
    name,
    salutation: str(fd, "salutation") || null,
    position: str(fd, "position") || null,
    hoiRole: str(fd, "hoiRole") || null,
    memberType: str(fd, "memberType") || null,
    district: str(fd, "district") || null,
    industry: str(fd, "industry") || null,
    phone: soDienThoaiDeLuu(str(fd, "phone")),
    email: str(fd, "email") || null,
    website: str(fd, "website") || null,
    address: str(fd, "address") || null,
    offering: str(fd, "offering") || null,
    needing: str(fd, "needing") || null,
    chapterId: str(fd, "chapterId") || null,
    note: str(fd, "note") || null,
    active: fd.get("active") !== null,
  };

  const current = id
    ? await prisma.member.findUnique({
        where: { id },
        select: { code: true, phone: true },
      })
    : null;

  // Không chặn Ban Chủ nhiệm (có thể cố ý), nhưng báo rõ: SĐT trùng thì cả hai
  // hội viên không đăng nhập web bằng SĐT được
  let canhBao = "";
  if (
    data.active &&
    chuanSoDienThoai(data.phone) !== chuanSoDienThoai(current?.phone)
  ) {
    const trung = await hoiVienKhacCungSdt(data.phone, id || null);
    if (trung) {
      canhBao = ` Lưu ý: số điện thoại trùng với hồ sơ ${trung.code} — cả hai sẽ không đăng nhập web bằng số điện thoại được cho tới khi sửa một bên.`;
    }
  }

  let code = current?.code;
  try {
    if (id) {
      await prisma.member.update({
        where: { id },
        data: {
          ...data,
          searchText: buildMemberSearchText({ ...data, code: current?.code }),
        },
      });
    } else {
      code = await maHoiVienTiepTheo();
      await prisma.member.create({
        data: {
          ...data,
          code,
          slug: await newMemberSlug(company),
          searchText: buildMemberSearchText({ ...data, code }),
        },
      });
    }
  } catch (e) {
    if (laLoiTrungKhoa(e)) {
      return {
        error:
          "Mã hội viên hoặc đường dẫn hồ sơ vừa bị trùng (có thể có người khác cũng đang thêm) — bấm Lưu lại một lần nữa.",
      };
    }
    return { error: "Chưa lưu được hồ sơ — vui lòng thử lại sau ít phút." };
  }

  revalidatePath("/quan-tri/hoi-vien");
  revalidatePath("/hoi-vien");
  return {
    ok: true,
    message: (id ? "Đã lưu hồ sơ." : `Đã thêm hội viên ${code}.`) + canhBao,
  };
}

/**
 * Nhập hàng loạt hội viên từ dữ liệu dán ra từ Excel.
 * Mỗi dòng: Tên doanh nghiệp<TAB>Người đại diện<TAB>Ngành<TAB>Điện thoại<TAB>Email
 */
export async function importMembers(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!co(user, QUYEN.HOI_VIEN_SUA))
    return { error: "Không có quyền sửa hội viên" };

  const raw = str(fd, "data");
  if (!raw) return { error: "Chưa dán dữ liệu" };

  const rows = raw
    .split(/\r?\n/)
    .map((l) => l.split(/\t|;/).map((c) => c.trim()))
    .filter((cols) => cols[0]);

  if (!rows.length) return { error: "Không đọc được dòng nào" };

  const dsMa = await prisma.member.findMany({
    where: { code: { startsWith: "HV" } },
    select: { code: true },
  });
  let seq = soLonNhatMaHoiVien(dsMa.map((m) => m.code));

  let created = 0;
  let skipped = 0;
  const trungSdt: string[] = [];
  try {
    for (const cols of rows) {
      const [company, name, industry, phoneRaw, email] = cols;
      const exists = await prisma.member.findFirst({
        where: { company },
        select: { id: true },
      });
      if (exists) {
        skipped += 1;
        continue;
      }
      const phone = soDienThoaiDeLuu(phoneRaw);
      const trung = await hoiVienKhacCungSdt(phone);
      if (trung) trungSdt.push(`${company} (trùng ${trung.code})`);

      // Bỏ qua số đã có người giữ (vd mã tạo tay lệch thứ tự) thay vì vỡ giữa chừng
      let code = makeMemberCode(++seq);
      while (
        await prisma.member.findUnique({
          where: { code },
          select: { id: true },
        })
      ) {
        code = makeMemberCode(++seq);
      }
      await prisma.member.create({
        data: {
          code,
          slug: await newMemberSlug(company),
          company,
          name: name || company,
          industry: industry || null,
          phone,
          email: email || null,
          searchText: buildMemberSearchText({
            code,
            company,
            name: name || company,
            industry,
            phone,
            email,
          }),
        },
      });
      created += 1;
    }
  } catch (e) {
    revalidatePath("/quan-tri/hoi-vien");
    const daThem = created
      ? ` Đã thêm được ${created} dòng đầu, các dòng sau chưa nhập.`
      : "";
    return {
      error: laLoiTrungKhoa(e)
        ? `Dừng lại vì mã hội viên hoặc đường dẫn hồ sơ bị trùng.${daThem} Tải lại trang rồi dán lại các dòng còn thiếu.`
        : `Nhập bị gián đoạn.${daThem} Tải lại trang rồi thử lại.`,
    };
  }

  revalidatePath("/quan-tri/hoi-vien");
  revalidatePath("/hoi-vien");
  return {
    ok: true,
    message:
      `Đã thêm ${created} hội viên${skipped ? `, bỏ qua ${skipped} dòng trùng tên` : ""}.` +
      (trungSdt.length
        ? ` Lưu ý ${trungSdt.length} hồ sơ có số điện thoại trùng hội viên khác (không đăng nhập bằng SĐT được): ${trungSdt.slice(0, 5).join("; ")}${trungSdt.length > 5 ? "…" : ""}.`
        : ""),
  };
}

export async function saveChapter(
  _prev: ActionResult,
  fd: FormData,
): Promise<ActionResult> {
  const user = await requireUser();
  if (!co(user, QUYEN.HOI_VIEN_SUA))
    return { error: "Không có quyền sửa hội viên" };

  const name = str(fd, "name");
  const code = str(fd, "code").toUpperCase();
  if (!name || !code) return { error: "Nhập mã và tên nhóm" };

  const exists = await prisma.chapter.findUnique({ where: { code } });
  if (exists) return { error: "Mã nhóm đã tồn tại" };

  await prisma.chapter.create({
    data: { code, name, note: str(fd, "note") || null },
  });
  revalidatePath("/quan-tri/nhom");
  return { ok: true, message: "Đã tạo nhóm" };
}
