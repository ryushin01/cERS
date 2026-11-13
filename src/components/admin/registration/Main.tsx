"use client";

import { useState } from "react";

import { TabGroup, Typography } from "@components/common";
import { PROC_STAT_CD } from "@constants/code";
import { useResponsive } from "@hooks";

import List from "./List";

export type TabCountData = {
  total: number;
  rqst: number;
  mtchCmpt: number;
  loanExec: number;
  rqstProg: number;
  rqstRtun: number;
  rqstCmpt: number;
  progHold: number;
  progCncl: number;
};

export default function Main() {
  const { isDesktop } = useResponsive();
  const [tabSelection, setTabSelection] = useState<string>("");
  const [tabCount, setTabCount] = useState<TabCountData>({
    total: 0,
    rqst: 0,
    mtchCmpt: 0,
    loanExec: 0,
    rqstProg: 0,
    rqstRtun: 0,
    rqstCmpt: 0,
    progHold: 0,
    progCncl: 0,
  });

  /* 탭과 목록 조회 코드(처리 상태). 탭 순서를 바꿀 때는 이 배열만 고칩니다. */
  const TABS: { id: keyof TabCountData; label: string; code: string }[] = [
    { id: "total", label: "전체", code: "" },
    { id: "mtchCmpt", label: "배정완료", code: PROC_STAT_CD.MATCH },
    { id: "loanExec", label: "대출실행", code: PROC_STAT_CD.EXECUTION },
    { id: "rqstProg", label: "접수검토중", code: PROC_STAT_CD.REVIEWING },
    { id: "rqstRtun", label: "접수반려", code: PROC_STAT_CD.RETURN },
    { id: "rqstCmpt", label: "접수완료", code: PROC_STAT_CD.COMPLET },
    { id: "progHold", label: "진행보류", code: PROC_STAT_CD.HOLD },
    { id: "progCncl", label: "진행취소", code: PROC_STAT_CD.CANCEL },
  ];
  const list = <List tabSelection={tabSelection} setTabCount={setTabCount} isDesktop={isDesktop} />;
  const TAB_LIST = TABS.map(({ id, label }) => ({ id, label, content: list, count: tabCount[id] }));

  const handleTabChange = (index: number) => setTabSelection(TABS[index]?.code ?? "");

  return (
    <section className="pb-5">
      <Typography as="h2" kind="headline-medium" isBold={true} className="py-6">
        등기관리
      </Typography>

      <TabGroup items={TAB_LIST} defaultTab={0} onTabChange={handleTabChange} />
    </section>
  );
}
