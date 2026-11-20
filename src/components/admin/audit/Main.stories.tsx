import { mobileViewport, routeParameters, withCommonLayout } from "@/stories/helpers";

import Main from "./Main";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/** 관리자 감사기록: 누가 언제 어떤 의뢰의 진행상태를 바꿨는지 최근 순으로 조회 (기간·의뢰번호·처리자 검색) */
const meta = {
  title: "Pages/Admin/Audit/Main",
  component: Main,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    auth: "admin",
    docs: { story: { inline: false, height: "1000px" } },
    ...routeParameters("/admin/audit"),
  },
  decorators: [withCommonLayout],
} satisfies Meta<typeof Main>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = { globals: mobileViewport };
