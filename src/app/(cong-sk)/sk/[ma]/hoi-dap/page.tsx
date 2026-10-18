import { CongDong } from "../GuiForm";
import { napCongTrang } from "../nap";
import HoiDap from "./HoiDap";

export default async function TrangHoiDap({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const c = await napCongTrang(ma);
  if (!c.moHoiDap) return <CongDong ma={c.ma!} />;
  return <HoiDap ma={c.ma!} />;
}
