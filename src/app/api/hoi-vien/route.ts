import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { normalizeSearch } from "@/lib/search";

/** Tìm hội viên cho ô chọn bên bán / bên mua. GET /api/hoi-vien?q=... */
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const members = await prisma.member.findMany({
    where: {
      active: true,
      ...(q ? { searchText: { contains: normalizeSearch(q) } } : {}),
    },
    orderBy: { company: "asc" },
    take: 20,
    select: { id: true, code: true, name: true, company: true, industry: true },
  });

  return NextResponse.json({ members });
}
