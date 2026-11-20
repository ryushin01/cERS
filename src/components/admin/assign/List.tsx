"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { Button } from "@components/button";
import { Loading, Pagination } from "@components/common";
import CsvExportButton from "@components/common/CsvExportButton";
import { Select } from "@components/form";
import { Grid, GridItem } from "@components/layout";
import { NUMERIC_SORT_OPTION, PERIOD_SORT_OPTION } from "@constants/option";
import { useAdjustState, useResponsive } from "@hooks";
import { getSupplimentListData } from "@services/adminAssign";
import { toastState } from "@stores";
import { CsvColumn, okListResponse } from "@utils/csvUtil";

import BulkAssignModal from "./BulkAssignModal";
import NotAllottedTable from "./NotAllottedTable";
import Table from "./Table";

import type { AssignListItem } from "@types";

/* 탭 이름 (내보내기 파일 이름) */
const TAB_NAMES: Record<string, string> = {
  "00": "미배정",
  "01": "배정완료",
  "02": "진행보류",
  "03": "진행취소",
};

/* 내보내기 열: 화면 표의 칸에 채무자·의뢰자 사업자번호·배정일시를 더함 */
const EXPORT_COLUMNS: CsvColumn<AssignListItem>[] = [
  { header: "진행상태", value: (row) => row.statNm },
  { header: "의뢰번호", value: (row) => row.rqstNo },
  { header: "대출실행일", value: (row) => row.execDt },
  { header: "의뢰자", value: (row) => row.clientNm },
  { header: "사업자번호", value: (row) => row.bndBizNo },
  { header: "채무자", value: (row) => row.dbtrNm },
  { header: "의뢰일시", value: (row) => row.crtDtm },
  { header: "배정일시", value: (row) => row.mtchDtm },
];

interface ListProps {
  tabIndex: string;
  searchRqstNo: string;
  unMatchData: (data: number) => void;
}

export default function List({ tabIndex, searchRqstNo, unMatchData }: ListProps) {
  const { isDesktop } = useResponsive();
  const openToast = useSetAtom(toastState);
  const [selectedPeriod, setSelectedPeriod] = useState(PERIOD_SORT_OPTION[0].value);
  const [selectedNumeric, setSelectedNumeric] = useState(NUMERIC_SORT_OPTION[0].value);

  const [unMatchCount, setUnMatchCount] = useState<number>();
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<AssignListItem[]>([]); // 테이블 데이터
  const [total, setTotal] = useState<number>(0); // 전체 데이터 개수
  /* 일괄 배정: 이 페이지에서 고른 의뢰번호 */
  const [selected, setSelected] = useState<string[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const isNotAllotted = tabIndex === "00";

  const handleBulkAssignOpen = () => {
    if (selected.length === 0) {
      openToast({
        message: "일괄 배정할 의뢰를 먼저 골라 주세요.",
        position: isDesktop ? "top" : "bottom",
      });
      return;
    }
    setIsBulkAssignOpen(true);
  };

  /* 1. 탭인덱스가 바뀌면 페이지는 무조건 1로 세팅 */
  useAdjustState([tabIndex, searchRqstNo, selectedNumeric], () => setPage(1));

  /* 고른 의뢰는 지금 보이는 페이지 안에서만 유지 (조회 조건이 바뀌면 해제) */
  useAdjustState([page, tabIndex, searchRqstNo, selectedPeriod, selectedNumeric], () =>
    setSelected([]),
  );

  /* 2. 조회 조건(page, tabIndex, searchRqstNo, selectedPeriod, selectedNumeric)은 queryKey에 포함되어 있어 변경 시 자동으로 재조회됩니다. */

  /* 3. 배정관리 목록 조회 api */
  const { data: spplListData, isLoading: spplListDataLoading } = useQuery({
    queryKey: [
      "search-supplementlist",
      page,
      tabIndex,
      searchRqstNo,
      selectedPeriod,
      selectedNumeric,
    ],
    queryFn: async () =>
      await getSupplimentListData({
        pageNum: page,
        pageSize: Number(selectedNumeric),
        searchRqstNo,
        tabSelection: tabIndex,
        sortOrder: selectedPeriod,
      }),

    select: (response) => response.data,
    enabled: true,
  });

  /* 4. api 조회 완료 시 데이터 세팅 */
  // 새 페이지를 불러오는 동안에도 앞의 결과를 보여 주도록 상태로 둡니다.
  useAdjustState([spplListData], () => {
    if (!spplListData) return;
    const rows: AssignListItem[] = spplListData.mtchList || [];
    setData(rows); // data set
    // 고른 의뢰는 새로 보이는 행 안에서만 유지 (불러오는 동안 앞 결과에서 고른 건·목록에서 빠진 건은 해제)
    setSelected((current) => current.filter((rqstNo) => rows.some((row) => row.rqstNo === rqstNo)));
    setTotal(spplListData.totalElements || 0); //total set
    setUnMatchCount(spplListData.unMtchCnt || 0); //unmatch set
  });

  useEffect(() => {
    if (spplListData && !!searchRqstNo && spplListData.totalElements === 0) {
      openToast({
        message: "일치하는 검색 결과가 없습니다.",
        position: isDesktop ? "top" : "bottom",
      });
    }
    // 아래 값이 바뀔 때만 실행하도록 의도된 이펙트입니다. (그 외 값은 실행 시점의 최신 값을 읽기만 함)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spplListData]);

  /* 5. 미배정건 데이터 상위 Main으로 전달 (일괄 배정으로 0건이 되어도 전달) */
  useEffect(() => {
    if (unMatchCount !== undefined) {
      unMatchData(unMatchCount);
    }
    // 상위 콜백(unMatchData)은 렌더링마다 새로 생성되므로 건수 변경 시에만 전달합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unMatchCount]);

  return (
    <>
      {spplListDataLoading && <Loading />}
      <Grid className="_without-padding mt-6 mb-4 gap-y-3 justify-between">
        <GridItem mobile={12} tablet={12} desktop={4}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {isNotAllotted && (
              <div className="w-[136px]">
                <Button
                  shape="solid"
                  size="sm"
                  color="main100"
                  // disabled로 두면 배정 후 모달이 닫힐 때 이 버튼으로 초점이 돌아오지 못하므로, 고른 건이 없으면 안내만 함
                  onClick={handleBulkAssignOpen}
                >
                  일괄 배정
                </Button>
              </div>
            )}
            <div className="w-[136px]">
              {/* 지금 탭·검색어·정렬 그대로 전체 목록을 내보냄 */}
              <CsvExportButton
                fileTitle={`배정관리_${TAB_NAMES[tabIndex] ?? "목록"}`}
                columns={EXPORT_COLUMNS}
                fetchPage={async (pageNum, pageSize) => {
                  // 업무 실패한 쪽이 있으면 일부만 담긴 파일 대신 내보내기 전체를 실패로
                  const { data } = okListResponse(
                    await getSupplimentListData({
                      pageNum,
                      pageSize,
                      searchRqstNo,
                      tabSelection: tabIndex,
                      sortOrder: selectedPeriod,
                    }),
                  );
                  return { items: data?.mtchList ?? [], totalPages: data?.totalPages ?? 1 };
                }}
              />
            </div>
            {isNotAllotted && (
              // 고른 건수가 바뀌면 스크린 리더에 알림
              <p role="status" className="text-sm text-ers-grayscale-90">
                {selected.length
                  ? `${selected.length}건 선택됨`
                  : "배정할 의뢰를 고르면 일괄 배정할 수 있습니다."}
              </p>
            )}
          </div>
        </GridItem>
        <GridItem mobile={12} tablet={12} desktop={3}>
          <div className="flex gap-x-4">
            <Select
              id="select1"
              ariaLabel="정렬 순서"
              name="select1"
              selectSize="sm"
              options={PERIOD_SORT_OPTION}
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              isError={false}
            />
            <Select
              id="select2"
              ariaLabel="한 페이지에 보여 줄 개수"
              name="select2"
              selectSize="sm"
              options={NUMERIC_SORT_OPTION}
              value={selectedNumeric}
              onChange={(e) => setSelectedNumeric(e.target.value)}
              isError={false}
            />
          </div>
        </GridItem>
      </Grid>

      {tabIndex === "00" ? (
        /* 미배정 테이블 */
        <NotAllottedTable
          isDesktop={isDesktop}
          data={data}
          selected={selected}
          onSelectedChange={setSelected}
        />
      ) : (
        /* 배정완료 / 진행보류 / 진행취소 테이블 */
        <Table isDesktop={isDesktop} data={data} />
      )}

      {isBulkAssignOpen && (
        <BulkAssignModal
          requestNos={selected}
          onAssigned={(assigned) =>
            setSelected((current) => current.filter((rqstNo) => !assigned.includes(rqstNo)))
          }
          onClose={() => setIsBulkAssignOpen(false)}
        />
      )}

      <Pagination
        total={total}
        page={page}
        limit={Number(selectedNumeric)}
        pageCount={10}
        setPage={setPage}
      />
    </>
  );
}
