import { fn } from "storybook/test";

import { PROC_STAT_CD } from "@constants/code";
import { REGISTRATIONS } from "@/mocks/data";
import { routeParameters } from "@/stories/helpers";

import BulkAssignModal from "./BulkAssignModal";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/* 미배정(등기의뢰·보완필요) 의뢰번호 */
const unassigned = REGISTRATIONS.filter((item) =>
  ([PROC_STAT_CD.REQUEST, PROC_STAT_CD.SUPPLEMENT] as string[]).includes(item.statCd),
).map((item) => item.rqstNo);

/**
 * 배정관리 미배정 목록에서 고른 의뢰들에 법무대리인 한 명을 한 번에 지정합니다.
 * - 법무대리인을 고르지 않고 제출하면 오류 문구를 select에 연결하고 초점을 옮깁니다.
 * - 배정 정보(채무자·주소 등)가 빠진 의뢰는 서버가 실패로 돌려주며, 결과에 사유와 배정 화면 링크를 보여 줍니다.
 */
const meta = {
  title: "Pages/Admin/Assign/BulkAssignModal",
  component: BulkAssignModal,
  tags: ["autodocs"],
  parameters: {
    auth: "admin",
    docs: { story: { inline: false, height: "720px" } },
    ...routeParameters("/admin/assign"),
  },
  args: { requestNos: unassigned.slice(0, 3), onAssigned: fn(), onClose: fn() },
} satisfies Meta<typeof BulkAssignModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeRequests: Story = {};

export const OneRequest: Story = { args: { requestNos: unassigned.slice(0, 1) } };
