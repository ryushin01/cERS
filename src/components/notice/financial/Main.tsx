"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Breadcrumb, Loading, Pagination, Typography } from "@components/common";
import { useResponsive } from "@hooks";
import { getNoticeBoardList } from "@services/home";

import List from "./List";

export default function Main() {
  const [page, setPage] = useState(1);
  const { isDesktop } = useResponsive();

  /* 1. 공지사항 api 호출 */
  const {
    data: boardListData,
    mutate: getBoardListData,
    isPending: boardListDataLoading,
  } = useMutation({
    mutationKey: ["search-boardlist"],
    mutationFn: async () =>
      await getNoticeBoardList({
        page,
        size: isDesktop ? 10 : 5,
      }),
    onError: (error) => {
      console.error(error);
    },
  });

  /* 2. page 또는 size 변경 시 api 재조회 */
  useEffect(() => {
    getBoardListData();
  }, [page, isDesktop, getBoardListData]);

  return (
    <>
      {boardListDataLoading && <Loading />}
      <section className="pb-5">
        <Breadcrumb />

        <Typography
          as="h2"
          kind={isDesktop ? "headline-medium" : "title-large"}
          isBold={true}
          className={isDesktop ? "py-6" : "pb-4"}
        >
          공지사항
        </Typography>

        <List data={boardListData?.data?.data.boardList ?? []} />

        <Pagination
          total={boardListData?.data?.data?.totalElements ?? 0}
          page={page}
          limit={isDesktop ? 10 : 5}
          pageCount={isDesktop ? 10 : 5}
          setPage={setPage}
        />
      </section>
    </>
  );
}
