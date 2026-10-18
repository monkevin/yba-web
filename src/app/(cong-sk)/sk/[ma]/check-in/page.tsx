import { gioVN } from "@/lib/trung-tam-sk/bang";
import { phienHienTai } from "@/lib/trung-tam-sk/cong";
import { CongDong } from "../GuiForm";
import { napCongTrang } from "../nap";
import TuCheckin from "./TuCheckin";

export default async function TrangCheckin({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const c = await napCongTrang(ma);
  if (!c.moTuCheckin) return <CongDong ma={c.ma!} />;
  return (
    <TuCheckin
      ma={c.ma!}
      phien={c.phien.map((p) => ({ id: p.id, ten: p.batDau ? `${gioVN(p.batDau)} · ${p.ten}` : p.ten }))}
      macDinh={phienHienTai(c.phien)?.id ?? ""}
    />
  );
}
