import { useState } from "react";

import { getSupplimentListData } from "@services/adminAssign";
import { mobileViewport, routeParameters } from "@/stories/helpers";

import NotAllottedTable from "./NotAllottedTable";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { AssignListItem } from "@types";

/** 미배정 표. 행을 누르면 전자등기 배정 화면으로 이동합니다. */
const meta = {
  title: "Pages/Admin/Assign/NotAllottedTable",
  component: NotAllottedTable,
  tags: ["autodocs"],
  parameters: { auth: "admin", ...routeParameters("/admin/assign") },
  loaders: [
    async () => ({
      list: (
        await getSupplimentListData({
          pageNum: 1,
          pageSize: 10,
          searchRqstNo: "",
          tabSelection: "00",
          sortOrder: "00",
        })
      ).data?.mtchList,
    }),
  ],
  args: { isDesktop: true, data: [] },
  argTypes: { data: { control: false } },
  render: (args, { loaded }) => <NotAllottedTable {...args} data={loaded.list ?? args.data} />,
} satisfies Meta<typeof NotAllottedTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = { args: { isDesktop: false }, globals: mobileViewport };

/** 일괄 배정: selected·onSelectedChange를 넘기면 진행상태 칸 앞에 선택 칸(24px 이상)이 생깁니다. 머리 줄 칸은 이 페이지 모두 선택입니다. */
function SelectableTable({ isDesktop, data }: { isDesktop: boolean; data: AssignListItem[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <NotAllottedTable
      isDesktop={isDesktop}
      data={data}
      selected={selected}
      onSelectedChange={setSelected}
    />
  );
}

export const Selectable: Story = {
  render: (args, { loaded }) => (
    <SelectableTable isDesktop={args.isDesktop} data={loaded.list ?? args.data} />
  ),
};

export const SelectableMobile: Story = {
  ...Selectable,
  args: { isDesktop: false },
  globals: mobileViewport,
};
