import { Fragment, ReactNode } from "react";

import Typography from "./Typography";

export type InfoCell = {
  label: string;
  value: ReactNode;
};

/* 한 행에 항목 1개(값이 3칸 차지) 또는 2개(항목-값-항목-값) */
export type InfoRow = InfoCell | [InfoCell, InfoCell];

type InfoTableSectionProps = {
  title: string;
  rows: InfoRow[];
  isDesktop?: boolean;
  /** 제목 옆에 둘 버튼 등. 있으면 제목과 한 줄(_addon)에 놓습니다. */
  actions?: ReactNode;
};

/**
 * @name InfoTableSection
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 제목 + 항목/값 표(thead 없음)로 구성된 정보 섹션입니다.
 *              등기자료·등기접수증 상세 팝업에서 공통으로 사용합니다.
 * @property {string} title       - 섹션 제목 (표 캡션은 "{title} 표")
 * @property {InfoRow[]} rows     - 표 행 목록
 * @property {ReactNode} actions  - 제목 옆 버튼 등 (선택)
 */
export default function InfoTableSection({
  title,
  rows,
  isDesktop,
  actions,
}: InfoTableSectionProps) {
  const cellKind = isDesktop ? "body-large" : "body-small";
  const heading = (
    <Typography
      as="h2"
      kind={isDesktop ? "title-medium" : "body-large"}
      isBold={true}
      className="_title"
    >
      {title}
    </Typography>
  );

  return (
    <section className="_section">
      {actions ? (
        <div className="_addon">
          {heading}
          {actions}
        </div>
      ) : (
        heading
      )}
      <div className="_responsive-table-inner-wrapper _no-thead">
        <table className="_responsive-table">
          <caption className="_hidden-table-caption">{title} 표</caption>
          <tbody>
            {rows.map((row) => {
              const cells = Array.isArray(row) ? row : [row];

              return (
                <tr key={cells.map((cell) => cell.label).join("-")}>
                  {cells.map(({ label, value }) => (
                    <Fragment key={label}>
                      <th>
                        <Typography kind={cellKind} isBold={true}>
                          {label}
                        </Typography>
                      </th>
                      <td colSpan={cells.length === 1 ? 3 : undefined}>
                        <Typography kind={cellKind}>{value}</Typography>
                      </td>
                    </Fragment>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
