"use client";

import { ChangeEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@components/button";
import { Badge, TabGroup, Typography } from "@components/common";
import { Form, InputField } from "@components/form";
import { Grid, GridItem } from "@components/layout";
import { REQUEST_NUMBER_INPUT } from "@constants/input";
import { AD_ASSIGN_CREATE } from "@constants/path";

import List from "./List";

export default function Main() {
  const router = useRouter();
  const [tabCode, setTabCode] = useState("00");
  const [searchRqstNo, setsearchRqstNo] = useState("");
  const [submittedRqstNo, setSubmittedRqstNo] = useState("");
  const [unMatchCount, setUnMatchCount] = useState<number>(0);

  /* List 컴포넌트에서 미배정건 데이터 받기 */
  const onChangeMatchData = (newData: number) => {
    setUnMatchCount(newData);
  };

  /* 탭과 목록 조회 코드 (00 미배정, 01 배정완료, 02 진행보류, 03 진행취소) */
  const TABS = [
    { label: "미배정", code: "00" },
    { label: "배정완료", code: "01" },
    { label: "진행보류", code: "02" },
    { label: "진행취소", code: "03" },
  ];
  const list = (
    <List tabIndex={tabCode} searchRqstNo={submittedRqstNo} unMatchData={onChangeMatchData} />
  );
  const TAB_LIST = TABS.map(({ label }) => ({ label, content: list }));

  /* 탭이 바뀌면 그 탭의 조회 코드로 */
  const handleTabChange = (index: number) => setTabCode(TABS[index]?.code ?? "00");

  /* 의뢰번호 입력시 searchRqstNo 값 셋팅 */
  const handleFormChange = (event: ChangeEvent<HTMLFormElement>) => {
    setsearchRqstNo(event.target.value);
  };

  /* 검색버튼 클릭시 searchRqstNo값 submittedRqstNo값에 셋팅 */
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault(); // 페이지 새로고침 방지
    setSubmittedRqstNo(searchRqstNo);
  };

  const handleReset = () => {
    setsearchRqstNo("");
    window.location.reload();
  };

  return (
    <section className="pb-5">
      <div className="flex items-center gap-x-[10px]">
        <Typography as="h2" kind="headline-medium" isBold={true} className="py-6">
          배정관리
        </Typography>

        <Badge type="text" colorType="default">
          미배정 {unMatchCount}건
        </Badge>
      </div>

      <div className="mb-3 [&>div>div]:p-0">
        <Grid className="justify-between">
          <GridItem mobile={12} tablet={12} desktop={5}>
            <Form
              onSubmit={handleSearchSubmit}
              onChange={handleFormChange}
              legendText="의뢰번호 검색"
              isHiddenLegend={true}
              className="[&>fieldset]:flex [&>fieldset]:flex-wrap md:[&>fieldset]:flex-nowrap [&>fieldset]:gap-3 [&>fieldset>div]:mr-1"
            >
              <div className="basis-full md:basis-0 flex-1">
                <InputField
                  name="searchRqstNo"
                  ariaLabel={REQUEST_NUMBER_INPUT.placeHolder}
                  defaultValue={searchRqstNo}
                  type="text"
                  inputSize="md"
                  placeholder={REQUEST_NUMBER_INPUT.placeHolder}
                  isError={false}
                />
              </div>
              <div className="w-[136px]">
                <Button shape="solid" type="submit" size="md" color="main100">
                  검색
                </Button>
              </div>
              <div className="w-[136px]">
                <Button
                  type="reset"
                  shape="outline"
                  size="md"
                  color="grayscale"
                  onClick={handleReset}
                >
                  초기화
                </Button>
              </div>
            </Form>
          </GridItem>

          <GridItem mobile={12} tablet={12} desktop={2}>
            <Button
              shape="solid"
              size="md"
              color="main100"
              onClick={() => router.push(AD_ASSIGN_CREATE)}
            >
              전자등기 신규등록
            </Button>
          </GridItem>
        </Grid>
      </div>

      <TabGroup items={TAB_LIST} defaultTab={0} onTabChange={handleTabChange} />
    </section>
  );
}
