import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import MemberForm from "../MemberForm";

export default async function NewMemberPage() {
  await requireQuyen(QUYEN.HOI_VIEN_SUA);

  const chapters = await prisma.chapter.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/quan-tri/hoi-vien"
        className="text-sm text-slate-500 hover:underline"
      >
        ← Quản lý hội viên
      </Link>
      <div className="mt-3">
        <PageHeader title="Thêm hội viên" />
      </div>
      <MemberForm chapters={chapters} />
    </div>
  );
}
