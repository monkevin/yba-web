import { CongDong } from "../GuiForm";
import { napCongTrang } from "../nap";
import DanhGia from "./DanhGia";

export default async function TrangDanhGia({ params }: { params: Promise<{ ma: string }> }) {
  const { ma } = await params;
  const c = await napCongTrang(ma);
  if (!c.moDanhGia) return <CongDong ma={c.ma!} />;
  return <DanhGia ma={c.ma!} />;
}
