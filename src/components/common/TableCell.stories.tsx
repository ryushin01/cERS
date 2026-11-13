import { BodyCell, TableHead } from "./TableCell";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import "@styles/responsive-table.css";

/** 목록 표의 머리 줄(TableHead)과 글자 칸(BodyCell). 넓은 화면은 title-medium, 좁은 화면은 body-medium */
const meta = {
  title: "Components/Content/TableCell",
  component: TableHead,
  tags: ["autodocs"],
  args: { labels: ["진행상태", "의뢰번호", "채무자"], isDesktop: true },
  render: (args) => (
    <div className="_responsive-table-inner-wrapper _has-thead">
      <table className="_responsive-table">
        <caption className="_hidden-table-caption">목록 표 예시</caption>
        <TableHead {...args} />
        <tbody>
          <tr>
            <BodyCell isDesktop={args.isDesktop} className="_status">
              배정완료
            </BodyCell>
            <BodyCell isDesktop={args.isDesktop}>DEMO-002400</BodyCell>
            <BodyCell isDesktop={args.isDesktop}>김민준</BodyCell>
          </tr>
        </tbody>
      </table>
    </div>
  ),
} satisfies Meta<typeof TableHead>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = { args: { isDesktop: false } };
