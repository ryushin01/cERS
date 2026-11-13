import { PROC_STAT_CD } from "@constants/code";
import { routeParameters, rqstNoByStatus } from "@/stories/helpers";

import ProcessReasonModal from "./ProcessReasonModal";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const rqstNo = rqstNoByStatus(PROC_STAT_CD.REQUEST);

/** 보완요청·진행취소 사유를 고르는 모달. 사유 목록은 열 때 공통 코드에서 받고, "기타"를 고르면 직접 입력합니다. */
const meta = {
  title: "Pages/Admin/AssignDetail/ProcessReasonModal",
  component: ProcessReasonModal,
  tags: ["autodocs"],
  parameters: {
    auth: "admin",
    docs: { story: { inline: false, height: "640px" } },
    ...routeParameters(`/admin/assign/assign-detail/${rqstNo}`, { rqstNo }),
  },
  args: {
    kind: "supplement",
    requestNo: rqstNo,
    // 화면에서는 Table이 useSubmitLock으로 만든 잠금을 넘깁니다.
    lock: { isLocked: false, lock: () => true, unlock: () => {} },
    onClose: () => {},
  },
} satisfies Meta<typeof ProcessReasonModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Supplement: Story = {};

export const Cancel: Story = { args: { kind: "cancel" } };
