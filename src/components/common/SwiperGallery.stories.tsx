import { fn } from "storybook/test";

import { createDocumentSvg } from "@/mocks/data";

import SwiperGallery from "./SwiperGallery";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/* 데모 목업과 같은 가상 문서 이미지 */
const documentImage = (page: number) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createDocumentSvg("등기자료", "DEMO-002400", page))}`;

const slides = [1, 2, 3, 4].map((page) => ({
  key: `page-${page}`,
  // eslint-disable-next-line @next/next/no-img-element
  content: <img src={documentImage(page)} alt={`등기자료 ${page}번 이미지`} className="h-full" />,
}));

const meta = {
  title: "Components/Content/SwiperGallery",
  component: SwiperGallery,
  tags: ["autodocs"],
  args: { slides, paginationType: "fraction" },
  argTypes: {
    paginationType: { control: "inline-radio", options: ["fraction", "progressbar"] },
    slides: { control: false },
  },
  decorators: [
    (Story) => (
      <div className="max-w-[720px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SwiperGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fraction: Story = {};

export const Progressbar: Story = { args: { paginationType: "progressbar" } };

/** onDelete를 넘기면 슬라이드마다 삭제 버튼이 생깁니다. (업로드 미리보기) */
export const Deletable: Story = {
  args: { slides: slides.map((slide) => ({ ...slide, onDelete: fn() })) },
};

/** documentName을 넘기면 슬라이드가 "크게 보기" 버튼이 되어 확대·회전·쪽 이동 보기(DocumentViewer)를 엽니다. */
export const Zoomable: Story = { args: { documentName: "등기자료" } };

export const Empty: Story = { args: { slides: [] } };
