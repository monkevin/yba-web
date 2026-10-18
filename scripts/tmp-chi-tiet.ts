import { prisma } from "../src/lib/prisma";

(async () => {
  const ms = await prisma.member.findMany({
    where: { active: true, publicVisible: true, website: null, facebook: null },
    select: {
      code: true,
      company: true,
      name: true,
      position: true,
      address: true,
      district: true,
      taxCode: true,
      offering: true,
      pressLinks: true,
    },
    orderBy: { code: "asc" },
  });
  const coBao = (s: string | null) => {
    try {
      return JSON.parse(s ?? "[]").length > 0;
    } catch {
      return false;
    }
  };
  for (const m of ms.filter((x) => !coBao(x.pressLinks))) {
    console.log(
      [
        m.code,
        m.company,
        m.name ?? "",
        m.taxCode ?? "",
        (m.address ?? "").replace(/\s+/g, " "),
        m.district ?? "",
        (m.offering ?? "").replace(/\s+/g, " ").slice(0, 70),
      ].join(" | ")
    );
  }
  await prisma.$disconnect();
})();
