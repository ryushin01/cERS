import { ReactNode } from "react";

import Typography from "./Typography";

type CellProps = {
  children: ReactNode;
  isDesktop?: boolean;
  className?: string;
};

/* 목록 표 글자 크기: 넓은 화면은 title-medium, 좁은 화면은 body-medium */
const kindOf = (isDesktop?: boolean) => (isDesktop ? "title-medium" : "body-medium");

/**
 * @name TableHead
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 목록 표의 머리 줄(thead). 칸 이름만 넘기면 됩니다.
 * @property {string[]} labels - 칸 이름 (왼쪽부터)
 */
export function TableHead({ labels, isDesktop }: { labels: string[]; isDesktop?: boolean }) {
  return (
    <thead>
      <tr>
        {labels.map((label) => (
          <th key={label}>
            <Typography kind={kindOf(isDesktop)} isBold={true}>
              {label}
            </Typography>
          </th>
        ))}
      </tr>
    </thead>
  );
}

/**
 * @name BodyCell
 * @description 목록 표의 글자 칸(td). 링크·버튼이 든 칸은 td를 직접 씁니다.
 */
export function BodyCell({ children, isDesktop, className }: CellProps) {
  return (
    <td>
      <Typography kind={kindOf(isDesktop)} className={className}>
        {children}
      </Typography>
    </td>
  );
}
