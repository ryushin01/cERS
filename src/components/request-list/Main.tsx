"use client";

import { useState } from "react";

import { TabGroup, Typography } from "@components/common";
import { useResponsive } from "@hooks";

import List from "./List";

/**
 * @name Main
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 금융기관 - 전자등기 의뢰목록
 */
export default function Main() {
  const { isDesktop } = useResponsive();
  const [tabSelection, setTabSelection] = useState<string>("00");

  /* 탭과 목록 조회 코드 (00 미배정, 01 배정완료, 02 진행보류, 03 진행취소) */
  const TABS = [
    { label: "미배정", code: "00" },
    { label: "배정완료", code: "01" },
    { label: "진행보류", code: "02" },
    { label: "진행취소", code: "03" },
  ];
  const list = <List tabSelection={tabSelection} isDesktop={isDesktop} />;
  const TAB_LIST = TABS.map(({ label }) => ({ label, content: list }));

  const handleTabChange = (index: number) => setTabSelection(TABS[index]?.code ?? "00");

  return (
    <>
      <section>
        <Typography
          as="h2"
          kind={isDesktop ? "headline-medium" : "title-large"}
          isBold={true}
          className={isDesktop ? "py-6" : "pb-4"}
        >
          전자등기 의뢰목록
        </Typography>

        <TabGroup
          items={TAB_LIST}
          defaultTab={0}
          onTabChange={handleTabChange}
          isDesktop={isDesktop}
        />
      </section>
    </>
  );
}
