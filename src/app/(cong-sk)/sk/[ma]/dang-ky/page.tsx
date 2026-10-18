import { gioVN } from "@/lib/trung-tam-sk/bang";
import { CongDong } from "../GuiForm";
import { napCongTrang } from "../nap";
import DangKy from "./DangKy";

export default async function TrangDangKy({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const c = await napCongTrang(ma);
  if (!c.moDangKy) return <CongDong ma={c.ma!} />;
  return (
    <DangKy
      ma={c.ma!}
      phien={c.phien.map((p) => ({ id: p.id, ten: p.batDau ? `${gioVN(p.batDau)} · ${p.ten}` : p.ten }))}
    />
  );
}
