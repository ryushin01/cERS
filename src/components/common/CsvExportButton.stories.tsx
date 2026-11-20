import { REGISTRATIONS } from "@/mocks/data";

import CsvExportButton from "./CsvExportButton";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

type Row = (typeof REGISTRATIONS)[number];

/**
 * 지금 조회 조건의 목록 전체를 엑셀에서 열 수 있는 CSV(UTF-8, BOM)로 내려받습니다.
 * 목록 API를 쪽마다 불러 모으고(최대 1만 행), 결과는 토스트로 알립니다. 수식으로 실행될 수 있는 값은 앞에 '를 붙입니다.
 */
const meta = {
  title: "Components/Actions/CsvExportButton",
  component: CsvExportButton<Row>,
  tags: ["autodocs"],
  args: {
    fileTitle: "등기관리_목록",
    columns: [
      { header: "의뢰번호", value: (row: Row) => row.rqstNo },
      { header: "진행상태", value: (row: Row) => row.statNm },
      { header: "채무자", value: (row: Row) => row.dbtrNm },
    ],
    fetchPage: async (pageNum: number, pageSize: number) => ({
      items: REGISTRATIONS.slice((pageNum - 1) * pageSize, pageNum * pageSize),
      totalPages: Math.ceil(REGISTRATIONS.length / pageSize),
    }),
  },
  argTypes: { columns: { control: false }, fetchPage: { control: false } },
  decorators: [
    (Story) => (
      <div className="w-[136px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CsvExportButton<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
