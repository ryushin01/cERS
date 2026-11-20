import { mobileViewport, routeParameters, withCommonLayout } from "@/stories/helpers";

import Main from "./Main";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/** 관리자 통계: 기간별 처리 건수(의뢰·접수완료·접수반려·진행취소), 반려율, 평균 처리 일수. 표는 엑셀(CSV)로 내보낼 수 있습니다. */
const meta = {
  title: "Pages/Admin/Statistics/Main",
  component: Main,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "admin",
    docs: { story: { inline: false, height: "1100px" } },
    ...routeParameters("/admin/statistics"),
  },
  decorators: [withCommonLayout],
} satisfies Meta<typeof Main>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = { globals: mobileViewport };
