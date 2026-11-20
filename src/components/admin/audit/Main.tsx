"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Button, ButtonGroup } from "@components/button";
import { Loading, Pagination, Typography } from "@components/common";
import { TableHead } from "@components/common/TableCell";
import { Form, InputField } from "@components/form";
import { AD_REGISTRATION_DETAIL } from "@constants/path";
import { useAdjustState, useResponsive } from "@hooks";
import { getAuditList } from "@services/adminAudit";
import { getDateString, getTodayAddDays } from "@utils/dateUtil";

import type { AuditLogItem } from "@types";

import "@styles/responsive-table.css";

/* 조회 기간 (days: 오늘부터 며칠 전까지, null: 전체) */
export const AUDIT_PERIODS = [
  { id: "audit-period-today", content: "오늘", days: 0, disabled: false },
  { id: "audit-period-week", content: "1주일", days: 7, disabled: false },
  { id: "audit-period-month", content: "1개월", days: 30, disabled: false },
  { id: "audit-period-all", content: "전체", days: null, disabled: false },
];
const ALL_PERIOD = AUDIT_PERIODS.length - 1;
const PAGE_SIZE = 10;

type AuditQuery = { periodIndex: number; rqstNo: string; membNm: string };
const INITIAL_QUERY: AuditQuery = { periodIndex: ALL_PERIOD, rqstNo: "", membNm: "" };

/* 기간 버튼 → 조회 기간 (YYYYMMDD) */
const periodRange = (periodIndex: number) => {
  const { days } = AUDIT_PERIODS[periodIndex];
  if (days === null) return { fromDate: "", toDate: "" };
  return { fromDate: getDateString(getTodayAddDays(-days)), toDate: getDateString(new Date()) };
};

/* 변경 내용: "등기의뢰 → 배정완료" (의뢰 등록은 이후 상태만) */
const changeText = ({ bfrStatNm, aftStatNm }: AuditLogItem) =>
  bfrStatNm ? `${bfrStatNm} → ${aftStatNm}` : aftStatNm;

/**
 * @name Main
 * @description 관리자 감사기록: 누가 언제 어떤 의뢰를 어떻게 바꿨는지 최근 순으로 조회합니다.
 *              - 조건(기간·의뢰번호·처리자)은 검색 버튼을 눌러야 적용
 *              - 의뢰번호는 등기관리 상세(문서·진행 이력)로 이동하는 링크
 *              - 좁은 화면에서는 표를 가로로 움직여 봄 (스크롤 영역은 키보드로도 초점을 받음)
 */
export default function Main() {
  const { isDesktop } = useResponsive();
  const [draft, setDraft] = useState<AuditQuery>(INITIAL_QUERY);
  const [query, setQuery] = useState<AuditQuery>(INITIAL_QUERY);
  const [page, setPage] = useState(1);

  /* 조건이 바뀌면 첫 페이지부터 */
  useAdjustState([query], () => setPage(1));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit-list", query, page],
    queryFn: async () =>
      await getAuditList({
        ...periodRange(query.periodIndex),
        searchRqstNo: query.rqstNo,
        searchMembNm: query.membNm,
        pageNum: page,
        pageSize: PAGE_SIZE,
      }),
    select: (response) => response.data,
    // 새 페이지를 불러오는 동안 앞의 결과를 그대로 보여 줌
    placeholderData: (previous) => previous,
  });
  const list: AuditLogItem[] = data?.auditList ?? [];
  const total: number = data?.totalElements ?? 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setQuery({ ...draft, rqstNo: draft.rqstNo.trim(), membNm: draft.membNm.trim() });
  };

  const handleReset = () => {
    setDraft(INITIAL_QUERY);
    setQuery(INITIAL_QUERY);
  };

  return (
    <section className="pb-5">
      {isLoading && <Loading />}
      <Typography as="h2" kind="headline-medium" isBold={true} className="pt-6 pb-2">
        감사기록
      </Typography>
      <Typography as="p" kind="body-large" className="pb-6 text-ers-grayscale-90">
        누가 언제 어떤 의뢰의 진행상태를 바꿨는지 최근 순으로 보여 줍니다.
      </Typography>

      <Form
        onSubmit={handleSubmit}
        legendText="감사기록 검색 조건"
        isHiddenLegend={true}
        className="mb-6 [&>fieldset]:flex [&>fieldset]:flex-wrap [&>fieldset]:items-end [&>fieldset]:gap-4"
      >
        <div className="basis-full lg:basis-auto">
          <Typography as="p" kind="title-small" isBold={true} className="mb-2" id="audit-period">
            기간
          </Typography>
          <div role="group" aria-labelledby="audit-period">
            <ButtonGroup
              size="small"
              data={AUDIT_PERIODS}
              selectedButtonGroup={AUDIT_PERIODS.map((_, index) => index === draft.periodIndex)}
              handleButtonGroup={(index) => setDraft({ ...draft, periodIndex: index })}
            />
          </div>
        </div>
        <div className="basis-full md:basis-0 md:flex-1 lg:max-w-[240px]">
          <InputField
            htmlFor="audit-rqst-no"
            labelText="의뢰번호"
            name="searchRqstNo"
            type="text"
            inputSize="md"
            placeholder="예: DEMO-002400"
            value={draft.rqstNo}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDraft({ ...draft, rqstNo: event.target.value })
            }
            isError={false}
          />
        </div>
        <div className="basis-full md:basis-0 md:flex-1 lg:max-w-[240px]">
          <InputField
            htmlFor="audit-memb-nm"
            labelText="처리자"
            name="searchMembNm"
            type="text"
            inputSize="md"
            placeholder="예: 관리자"
            value={draft.membNm}
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              setDraft({ ...draft, membNm: event.target.value })
            }
            isError={false}
          />
        </div>
        <div className="flex gap-x-3">
          <div className="w-[120px]">
            <Button shape="solid" type="submit" size="md" color="main100">
              검색
            </Button>
          </div>
          <div className="w-[120px]">
            <Button shape="outline" size="md" color="grayscale" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </div>
      </Form>

      <p role="status" className="mb-3 text-sm text-ers-grayscale-90">
        {`총 ${total}건`}
      </p>

      {/* 좁은 화면에서는 가로로 스크롤되므로 키보드로도 초점을 받아 움직일 수 있게 함 */}
      <div
        className="_responsive-table-inner-wrapper _has-thead _audit-table-wrapper"
        role="region"
        aria-label="감사기록 표"
        tabIndex={0}
      >
        <table className="_responsive-table _audit-table">
          <caption className="_hidden-table-caption">
            감사기록 표: 일시, 처리자, 의뢰번호, 작업, 변경 내용, 사유
          </caption>
          <TableHead
            isDesktop={isDesktop}
            labels={["일시", "처리자", "의뢰번호", "작업", "변경 내용", "사유"]}
          />
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <Typography kind="body-medium">
                    {isLoading ? "불러오는 중입니다." : "조건에 맞는 기록이 없습니다."}
                  </Typography>
                </td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.seq}>
                  <td>
                    <Typography kind="body-medium" className="tabular-nums">
                      {item.crtDtm}
                    </Typography>
                  </td>
                  <td>
                    <Typography kind="body-medium">{item.crtMembNm}</Typography>
                  </td>
                  <td>
                    <Link
                      href={`${AD_REGISTRATION_DETAIL}/${encodeURIComponent(item.rqstNo)}`}
                      className="_table-link"
                      aria-label={`${item.rqstNo} 등기관리 상세 보기`}
                    >
                      {item.rqstNo}
                    </Link>
                  </td>
                  <td>
                    <Typography kind="body-medium">{item.actnNm}</Typography>
                  </td>
                  <td>
                    <Typography kind="body-medium">{changeText(item)}</Typography>
                  </td>
                  <td>
                    <Typography kind="body-medium">{item.rsnCnts || "-"}</Typography>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        total={total}
        page={page}
        limit={PAGE_SIZE}
        pageCount={isDesktop ? 10 : 5}
        setPage={setPage}
      />
    </section>
  );
}
