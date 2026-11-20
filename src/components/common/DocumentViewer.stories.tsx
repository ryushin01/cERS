import { fn } from "storybook/test";

import { createDocumentSvg } from "@/mocks/data";
import { Toggle } from "@/stories/helpers";

import DocumentViewer from "./DocumentViewer";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/* 데모 목업과 같은 가상 문서 이미지 */
const documentImage = (title: string, page: number) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(createDocumentSvg(title, "DEMO-002400", page))}`;

const pagesOf = (title: string, count: number) =>
  Array.from({ length: count }, (_, i) => ({
    key: `page-${i + 1}`,
    // eslint-disable-next-line @next/next/no-img-element
    content: <img src={documentImage(title, i + 1)} alt={`${title} ${i + 1}번 이미지`} />,
  }));

/**
 * 등기자료·등기접수증을 판독하는 크게 보기입니다. 등기자료 슬라이드를 누르면 열립니다.
 * - 확대·축소(50~300%), 왼쪽·오른쪽 회전(쪽마다 따로), 쪽 이동
 * - 단축키: ←·→·PageUp·PageDown 쪽 이동, Home·End 처음·마지막 쪽, +·− 확대·축소, 0 원래대로, R·Shift+R 회전
 * - 바뀐 쪽·배율·회전은 `role="status"`로 스크린 리더에 알립니다.
 */
const meta = {
  title: "Components/Overlays/DocumentViewer",
  component: DocumentViewer,
  tags: ["autodocs"],
  parameters: { docs: { story: { inline: false, height: "860px" } } },
  args: {
    documentName: "등기자료",
    pages: pagesOf("근저당권 설정계약서", 3),
    initialPage: 0,
    onClose: fn(),
    isDesktop: true,
  },
  argTypes: { pages: { control: false } },
  render: (args) => (
    <Toggle label="크게 보기 열기">
      {(close) => (
        <DocumentViewer
          {...args}
          onClose={() => {
            close();
            args.onClose();
          }}
        />
      )}
    </Toggle>
  ),
} satisfies Meta<typeof DocumentViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RegistrationData: Story = {};

/** 두 번째 쪽부터 엽니다. (슬라이드에서 고른 쪽) */
export const FromSecondPage: Story = { args: { initialPage: 1 } };

export const Receipt: Story = {
  args: { documentName: "등기접수증", pages: pagesOf("등기접수증", 1) },
};

/** 모바일 기본 크기(220×308) */
export const Mobile: Story = { args: { isDesktop: false } };

export const Empty: Story = { args: { pages: [] } };
