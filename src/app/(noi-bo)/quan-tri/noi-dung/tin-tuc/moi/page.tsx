import { requireQuyen } from "@/lib/auth";
import { QUYEN } from "@/lib/quyen";
import { PageHeader } from "@/components/ui";
import { FormBaiViet } from "../../Forms";

export default function VietBaiMoi() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Viết bài mới"
        subtitle="Tin hoạt động, bản tin hội viên hoặc thông báo của Ban Chủ nhiệm"
      />
      <FormBaiViet />
    </div>
  );
}
