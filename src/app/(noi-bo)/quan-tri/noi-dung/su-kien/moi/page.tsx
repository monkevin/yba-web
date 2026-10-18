import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import { PageHeader } from "@/components/ui";
import { FormSuKien } from "../../Forms";
import { goiYPhanLoai } from "../goi-y";

export default async function TaoSuKien() {
  await requireQuyen(QUYEN.SU_KIEN_QUAN_LY);

  const { cacChuongTrinh, cacMang } = await goiYPhanLoai();

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Tạo sự kiện"
        subtitle="Sự kiện sắp tới có thể mở đăng ký tham dự ngay trên web"
      />
      <FormSuKien cacChuongTrinh={cacChuongTrinh} cacMang={cacMang} />
    </div>
  );
}
