"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { Loading, Pagination } from "@components/common";
import { Select } from "@components/form";
import { Grid, GridItem } from "@components/layout";
import { NUMERIC_SORT_OPTION, PERIOD_SORT_OPTION } from "@constants/option";
import { useAdjustState, useResponsive } from "@hooks";
import { getSupplimentListData } from "@services/adminAssign";
import { toastState } from "@stores";

import NotAllottedTable from "./NotAllottedTable";
import Table from "./Table";

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
  const [data, setData] = useState([]); // 테이블 데이터
  const [total, setTotal] = useState<number>(0); // 전체 데이터 개수

  /* 1. 탭인덱스가 바뀌면 페이지는 무조건 1로 세팅 */
  useAdjustState([tabIndex, searchRqstNo, selectedNumeric], () => setPage(1));

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
    setData(spplListData.mtchList || []); // data set
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

  /* 5. 미배정건 데이터 상위 Main으로 전달 */
  useEffect(() => {
    if (unMatchCount) {
      unMatchData(unMatchCount);
    }
    // 상위 콜백(unMatchData)은 렌더링마다 새로 생성되므로 건수 변경 시에만 전달합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unMatchCount]);

  return (
    <>
      {spplListDataLoading && <Loading />}
      <Grid className="_without-padding mt-6 mb-4 justify-end">
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
        <NotAllottedTable isDesktop={isDesktop} data={data} />
      ) : (
        /* 배정완료 / 진행보류 / 진행취소 테이블 */
        <Table isDesktop={isDesktop} data={data} />
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
