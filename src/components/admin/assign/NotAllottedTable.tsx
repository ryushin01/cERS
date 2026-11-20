"use client";

import { useRouter } from "next/navigation";

import { Button } from "@components/button";
import { Typography } from "@components/common";
import { BodyCell } from "@components/common/TableCell";
import { Checkbox } from "@components/form";
import { PROC_STAT_CD } from "@constants/code";
import { AD_ASSIGN_DETAIL } from "@constants/path";

import type { AssignListItem } from "@types";

import "@styles/responsive-table.css";

interface DefineProps {
  isDesktop: boolean;
  data: AssignListItem[];
  /* 일괄 배정으로 고른 의뢰번호 (넘기지 않으면 선택 칸 없음) */
  selected?: string[];
  onSelectedChange?: (selected: string[]) => void;
}

const LABELS = ["진행상태", "의뢰번호", "대출실행일", "의뢰자", "의뢰일시", "배정"];

/**
 * @name NotAllottedTable
 * @version 1.1.0
 * @description 배정관리 미배정 목록 표. selected·onSelectedChange를 넘기면 진행상태 칸 앞에 선택 칸이 생깁니다. (일괄 배정)
 *              칸 수(6칸)는 그대로 두어 좁은 화면의 카드형 배치가 바뀌지 않게 합니다.
 */
export default function Table({ isDesktop, data, selected, onSelectedChange }: DefineProps) {
  const router = useRouter();
  const isSelectable = !!selected && !!onSelectedChange;
  const pageNumbers = data.map(({ rqstNo }) => rqstNo);
  const isAllSelected =
    pageNumbers.length > 0 && pageNumbers.every((rqstNo) => selected?.includes(rqstNo));

  const toggle = (rqstNo: string, checked: boolean) =>
    onSelectedChange?.(
      checked ? [...(selected ?? []), rqstNo] : (selected ?? []).filter((item) => item !== rqstNo),
    );
  const toggleAll = (checked: boolean) => onSelectedChange?.(checked ? pageNumbers : []);

  return (
    <>
      <div className="_responsive-table-inner-wrapper _has-thead">
        <table className="_responsive-table _col-6-type">
          <caption className="_hidden-table-caption">배정관리 목록 표</caption>
          <thead>
            <tr>
              {LABELS.map((label, index) => (
                <th key={label} scope="col">
                  <span className="_table-content-wrapper">
                    {isSelectable && index === 0 && (
                      <Checkbox
                        name="bulk-assign-all"
                        labelText="이 페이지의 의뢰 모두 선택"
                        isHiddenLabel={true}
                        checked={isAllSelected}
                        onChange={(event) => toggleAll(event.target.checked)}
                      />
                    )}
                    <Typography kind={isDesktop ? "title-medium" : "body-medium"} isBold={true}>
                      {label}
                    </Typography>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => {
              const { statNm, statCd, rqstNo, execDt, clientNm, crtDtm } = item;

              return (
                <tr key={`${idx}-${rqstNo}`}>
                  <td>
                    <span className="_table-content-wrapper">
                      {isSelectable && (
                        <Checkbox
                          name="bulk-assign"
                          labelText={`${rqstNo} 선택`}
                          isHiddenLabel={true}
                          checked={!!selected?.includes(rqstNo)}
                          onChange={(event) => toggle(rqstNo, event.target.checked)}
                        />
                      )}
                      {/* NOTE: 보완필요 케이스는 _supplement 클래스까지 넣어서 더블 클래스 필요 */}
                      <Typography
                        kind={isDesktop ? "title-medium" : "body-medium"}
                        className={`_status ${
                          statCd === PROC_STAT_CD.SUPPLEMENT ? "_supplement" : ""
                        }`}
                      >
                        {statNm}
                      </Typography>
                    </span>
                  </td>
                  <BodyCell isDesktop={isDesktop}>{rqstNo}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{execDt}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{clientNm}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{crtDtm}</BodyCell>
                  <td>
                    <span className="_table-button-wrapper">
                      <Button
                        shape="solid"
                        size="sm"
                        color="main100"
                        onClick={() => router.push(AD_ASSIGN_DETAIL + `/${rqstNo}`)}
                      >
                        배정
                      </Button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
