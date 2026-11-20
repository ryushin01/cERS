"use client";

import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button, ButtonGroup } from "@components/button";
import { Loading, Typography } from "@components/common";
import CsvExportButton from "@components/common/CsvExportButton";
import { TableHead } from "@components/common/TableCell";
import { Form, Label, Select } from "@components/form";
import { getStatistics } from "@services/adminStatistics";
import { getDateString, getTodayAddDays } from "@utils/dateUtil";

import type { StatisticsData, StatisticsPeriod, StatisticsValues } from "@types";
import type { CsvColumn } from "@utils/csvUtil";

import "@styles/responsive-table.css";

/* 조회 기간: 오늘을 포함해 최근 며칠 */
export const STATISTICS_PERIODS = [
  { id: "statistics-period-week", content: "최근 1주일", days: 7, disabled: false },
  { id: "statistics-period-month", content: "최근 1개월", days: 30, disabled: false },
  { id: "statistics-period-quarter", content: "최근 3개월", days: 90, disabled: false },
];

type Unit = StatisticsData["unit"];
const UNIT_OPTIONS: { label: string; value: Unit }[] = [
  { label: "일별", value: "DAY" },
  { label: "주별 (월요일 시작)", value: "WEEK" },
  { label: "월별", value: "MONTH" },
];

type StatisticsQuery = { periodIndex: number; unit: Unit };
const INITIAL_QUERY: StatisticsQuery = { periodIndex: 1, unit: "WEEK" };

const queryRange = (periodIndex: number) => ({
  fromDate: getDateString(getTodayAddDays(-(STATISTICS_PERIODS[periodIndex].days - 1))),
  toDate: getDateString(new Date()),
});

/* 화면·파일에 쓰는 값 표시 */
export const formatCount = (value: number) => `${value.toLocaleString()}건`;
export const formatRate = (value: number | null) => (value === null ? "-" : `${value}%`);
export const formatDays = (value: number | null) => (value === null ? "-" : `${value}일`);
export const periodLabel = ({ fromDate, toDate }: StatisticsPeriod, unit: Unit) => {
  if (unit === "DAY") return fromDate;
  if (unit === "MONTH") return `${fromDate.slice(0, 4)}년 ${Number(fromDate.slice(5, 7))}월`;
  return `${fromDate} ~ ${toDate}`;
};

/* 요약 칸 (라벨·값) */
const SUMMARY_ITEMS: { label: string; value: (summary: StatisticsValues) => string }[] = [
  { label: "의뢰", value: (summary) => formatCount(summary.rqstCnt) },
  { label: "접수완료", value: (summary) => formatCount(summary.cmptCnt) },
  { label: "접수반려", value: (summary) => formatCount(summary.rtunCnt) },
  { label: "진행취소", value: (summary) => formatCount(summary.cnclCnt) },
  { label: "반려율", value: (summary) => formatRate(summary.rtunRate) },
  { label: "평균 처리 일수", value: (summary) => formatDays(summary.avgProcDays) },
];

const TABLE_LABELS = [
  "기간",
  "의뢰",
  "접수완료",
  "접수반려",
  "진행취소",
  "반려율",
  "평균 처리 일수",
];

/**
 * @name Main
 * @description 관리자 통계: 기간별 처리 건수(의뢰·접수완료·접수반려·진행취소), 반려율, 평균 처리 일수
 *              - 기간·집계 단위는 조회 버튼을 눌러야 적용, 바뀐 조회 범위는 role="status"로 알림
 *              - 숫자는 색 없이 글자로만 보여 주고(요약 칸 + 표), 표는 엑셀(CSV)로 내보낼 수 있음
 */
export default function Main() {
  const [draft, setDraft] = useState<StatisticsQuery>(INITIAL_QUERY);
  const [query, setQuery] = useState<StatisticsQuery>(INITIAL_QUERY);
  const range = queryRange(query.periodIndex);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-statistics", query],
    queryFn: async () => await getStatistics({ ...range, unit: query.unit }),
    select: (response): StatisticsData | undefined => response.data ?? undefined,
    placeholderData: (previous) => previous,
  });
  const unitName = UNIT_OPTIONS.find(({ value }) => value === (data?.unit ?? query.unit))?.label;

  const exportColumns: CsvColumn<StatisticsPeriod>[] = [
    { header: "기간", value: (row) => periodLabel(row, data?.unit ?? query.unit) },
    { header: "의뢰(건)", value: (row) => row.rqstCnt },
    { header: "접수완료(건)", value: (row) => row.cmptCnt },
    { header: "접수반려(건)", value: (row) => row.rtunCnt },
    { header: "진행취소(건)", value: (row) => row.cnclCnt },
    { header: "반려율(%)", value: (row) => row.rtunRate },
    { header: "평균 처리 일수(일)", value: (row) => row.avgProcDays },
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery(draft);
  };

  return (
    <section className="pb-5">
      {isLoading && <Loading />}
      <Typography as="h2" kind="headline-medium" isBold={true} className="pt-6 pb-2">
        통계
      </Typography>
      <Typography as="p" kind="body-large" className="pb-6 text-ers-grayscale-90">
        기간별 처리 건수와 처리 시간, 반려율을 확인합니다.
      </Typography>

      <Form
        onSubmit={handleSubmit}
        legendText="통계 조회 조건"
        isHiddenLegend={true}
        className="mb-6 [&>fieldset]:flex [&>fieldset]:flex-wrap [&>fieldset]:items-end [&>fieldset]:gap-4"
      >
        <div className="basis-full lg:basis-auto">
          <Typography
            as="p"
            kind="title-small"
            isBold={true}
            className="mb-2"
            id="statistics-period"
          >
            기간
          </Typography>
          <div role="group" aria-labelledby="statistics-period">
            <ButtonGroup
              size="small"
              data={STATISTICS_PERIODS}
              selectedButtonGroup={STATISTICS_PERIODS.map(
                (_, index) => index === draft.periodIndex,
              )}
              handleButtonGroup={(index) => setDraft({ ...draft, periodIndex: index })}
            />
          </div>
        </div>
        <div className="basis-full md:basis-0 md:flex-1 lg:max-w-[240px]">
          <Label htmlFor="statistics-unit" labelText="집계 단위" labelSize="md" />
          <div className="mt-2">
            <Select
              id="statistics-unit"
              name="unit"
              selectSize="md"
              options={UNIT_OPTIONS}
              value={draft.unit}
              onChange={(event) => setDraft({ ...draft, unit: event.target.value as Unit })}
              isError={false}
            />
          </div>
        </div>
        <div className="w-[120px]">
          <Button shape="solid" type="submit" size="md" color="main100">
            조회
          </Button>
        </div>
      </Form>

      <p role="status" className="mb-3 text-sm text-ers-grayscale-90">
        {data ? `${data.fromDate} ~ ${data.toDate}, ${unitName} 집계` : ""}
      </p>

      <h3 className="sr-only">기간 전체 요약</h3>
      <dl className="_statistics-summary">
        {SUMMARY_ITEMS.map(({ label, value }) => (
          <div key={label} className="_statistics-tile">
            <dt>{label}</dt>
            <dd>{data ? value(data.summary) : "-"}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center justify-between gap-x-4 mt-8 mb-3">
        <Typography as="h3" kind="title-large" isBold={true}>
          {`${unitName ?? ""} 처리 현황`}
        </Typography>
        <div className="w-[136px]">
          <CsvExportButton
            fileTitle="통계"
            columns={exportColumns}
            fetchPage={async () => ({ items: data?.periodList ?? [], totalPages: 1 })}
          />
        </div>
      </div>

      {/* 좁은 화면에서는 가로로 스크롤되므로 키보드로도 초점을 받아 움직일 수 있게 함 */}
      <div
        className="_responsive-table-inner-wrapper _has-thead _scroll-table-wrapper"
        role="region"
        aria-label="기간별 처리 현황 표"
        tabIndex={0}
      >
        <table className="_responsive-table _statistics-table">
          <caption className="_hidden-table-caption">
            기간별 처리 현황: 기간, 의뢰, 접수완료, 접수반려, 진행취소, 반려율, 평균 처리 일수
          </caption>
          <TableHead labels={TABLE_LABELS} isDesktop={true} />
          <tbody>
            {(data?.periodList ?? []).map((row) => (
              <tr key={row.fromDate}>
                <th scope="row">
                  <Typography kind="body-medium">{periodLabel(row, data!.unit)}</Typography>
                </th>
                {[
                  formatCount(row.rqstCnt),
                  formatCount(row.cmptCnt),
                  formatCount(row.rtunCnt),
                  formatCount(row.cnclCnt),
                  formatRate(row.rtunRate),
                  formatDays(row.avgProcDays),
                ].map((text, index) => (
                  <td key={TABLE_LABELS[index + 1]}>
                    <Typography kind="body-medium" className="tabular-nums">
                      {text}
                    </Typography>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="_information-list mt-5">
        <li>
          <Typography kind="body-medium" className="text-ers-grayscale-90">
            건수는 그 기간에 일어난 일을 셉니다. 의뢰는 의뢰일, 접수완료·접수반려·진행취소는 그
            상태가 된 날 기준입니다.
          </Typography>
        </li>
        <li>
          <Typography kind="body-medium" className="text-ers-grayscale-90">
            반려율 = 접수반려 ÷ (접수완료 + 접수반려). 평균 처리 일수는 접수완료 건의 의뢰일부터
            접수완료일까지 걸린 날수입니다.
          </Typography>
        </li>
      </ul>
    </section>
  );
}
