import Main from "@components/admin/audit/Main";
import { CustomErrorBoundary } from "@components/error-boundary";
import { CommonLayout } from "@components/layout";
import { AD_AUDIT_METADATA } from "@constants/metadata";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: AD_AUDIT_METADATA.TITLE,
  description: AD_AUDIT_METADATA.DESCRIPTION,
};

export default async function Audit() {
  return (
    <CommonLayout>
      <CustomErrorBoundary element={<Main />} />
    </CommonLayout>
  );
}
