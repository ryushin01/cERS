import Main from "@components/admin/statistics/Main";
import { CustomErrorBoundary } from "@components/error-boundary";
import { CommonLayout } from "@components/layout";
import { AD_STATISTICS_METADATA } from "@constants/metadata";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: AD_STATISTICS_METADATA.TITLE,
  description: AD_STATISTICS_METADATA.DESCRIPTION,
};

export default async function Statistics() {
  return (
    <CommonLayout>
      <CustomErrorBoundary element={<Main />} />
    </CommonLayout>
  );
}
