"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@components/button";
import { ResponsiveSwiper, Typography } from "@components/common";
import { BodyCell, TableHead } from "@components/common/TableCell";
import { Grid, GridItem } from "@components/layout";
import { Modal } from "@components/modal";
import { ATTC_FIL_CD, PROC_STAT_CD } from "@constants/code";
import {
  AD_ASSIGN_DETAIL,
  AD_REGISTRATION_ACCEPTANCE,
  AD_REGISTRATION_DETAIL,
} from "@constants/path";
import { useDisclosure } from "@hooks";
import { ResponsiveType } from "@types";

import RegistrationDataDetail from "./RegistrationDataDetail";
import RegistrationReceiptDetail from "./RegistrationReceiptDetail";

import "@styles/responsive-table.css";

type RegistrationListDataProps = {
  data: RegistrationListData;
};

type RegistrationListData = {
  totalPages: number;
  totalElements: number;
  rgstrMngrList: RegistrationItemData[];
};

type RegistrationItemData = {
  statNm: string;
  execDt: string;
  acptRptDtm: string;
  rqstNo: string;
  bndMembNm: string;
  dbtrNm: string;
  lgagMembNm: string;
  statCd: string;
};

export default function Table({ data, isDesktop }: RegistrationListDataProps & ResponsiveType) {
  const router = useRouter();
  const [requestNo, setRequestNo] = useState<string>("");

  const {
    isOpen: isRegistrationDataModalOpen,
    open: openRegistrationDataModal,
    close: closeRegistrationDataModal,
  } = useDisclosure();

  const {
    isOpen: isRegistrationReceiptModalOpen,
    open: openRegistrationReceiptModal,
    close: closeRegistrationReceiptModal,
  } = useDisclosure();

  const handleClick = (requestNo: string, openModalFunction: () => void) => {
    setRequestNo(requestNo);
    openModalFunction();
  };

  return (
    <>
      {/* 좁은 화면에서 가로로 스크롤되므로 키보드로도 스크롤할 수 있게 포커스를 받음 */}
      <div
        className="_responsive-table-inner-wrapper _has-thead"
        role="region"
        aria-label="등기관리 표"
        tabIndex={0}
      >
        <table className="_responsive-table _col-9-type">
          <caption className="_hidden-table-caption">등기관리 표</caption>
          <TableHead
            isDesktop={isDesktop}
            labels={[
              "진행상태",
              "대출실행일",
              "접수보고일시",
              "의뢰번호",
              "채권자",
              "채무자",
              "법무대리인",
              "등기자료",
              "등기접수증",
            ]}
          />
          <tbody>
            {data?.rgstrMngrList?.map((item: RegistrationItemData) => {
              const { statNm, execDt, acptRptDtm, rqstNo, bndMembNm, dbtrNm, lgagMembNm, statCd } =
                item;
              return (
                <tr key={rqstNo}>
                  <td>
                    {/* NOTE: 보완필요 케이스는 _supplement 클래스까지 넣어서 더블 클래스 필요 */}
                    <Typography
                      kind={isDesktop ? "title-medium" : "body-medium"}
                      className="_status"
                    >
                      {statNm}
                    </Typography>
                  </td>
                  <BodyCell isDesktop={isDesktop}>{execDt}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{acptRptDtm || "-"}</BodyCell>
                  <td>
                    <Link href={AD_REGISTRATION_DETAIL + `/${rqstNo}`}>
                      <Typography kind={isDesktop ? "title-medium" : "body-medium"}>
                        {rqstNo}
                      </Typography>
                    </Link>
                  </td>
                  <BodyCell isDesktop={isDesktop}>{bndMembNm || "-"}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{dbtrNm || "-"}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{lgagMembNm || "-"}</BodyCell>
                  <td>
                    {statCd === PROC_STAT_CD.REQUEST || statCd === PROC_STAT_CD.SUPPLEMENT ? (
                      /* 배정완료 이전까지는 배정버튼 노출 */
                      <Button
                        shape="solid"
                        size="sm"
                        color="main100"
                        onClick={() => router.push(AD_ASSIGN_DETAIL + `/${rqstNo}`)}
                      >
                        배정
                      </Button>
                    ) : (
                      /* 배정완료 또는 진행보류, 진행취소 이후 등기자료 버튼 노출 */
                      <Button
                        shape="outline"
                        size="sm"
                        color="grayscale"
                        onClick={() => handleClick(rqstNo, openRegistrationDataModal)}
                      >
                        등기자료
                      </Button>
                    )}
                  </td>
                  <td>
                    {statCd === PROC_STAT_CD.REVIEWING ? (
                      /* 접수보고 시  승인 버튼 노출 */
                      <Button
                        shape="solid"
                        size="sm"
                        color="main100"
                        onClick={() => router.push(AD_REGISTRATION_ACCEPTANCE + `/${rqstNo}`)}
                      >
                        승인
                      </Button>
                    ) : (
                      /* 접수보고 이전까지 버튼 비활성화 */
                      <Button
                        shape="outline"
                        size="sm"
                        color="grayscale"
                        onClick={() => handleClick(rqstNo, openRegistrationReceiptModal)}
                        disabled={!acptRptDtm}
                      >
                        등기접수증
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 등기자료 모달 */}
      {isRegistrationDataModalOpen && (
        <Modal title="등기자료" onClose={closeRegistrationDataModal}>
          <Grid>
            <GridItem desktop={5} tablet={12} mobile={12}>
              <ResponsiveSwiper
                isDesktop={isDesktop}
                requestNo={requestNo}
                attachFileCode={ATTC_FIL_CD.REGISTRATION_DATA}
              />
            </GridItem>
            <GridItem desktop={7} tablet={12} mobile={12}>
              <RegistrationDataDetail isDesktop={isDesktop} requestNo={requestNo} />
            </GridItem>
          </Grid>
        </Modal>
      )}

      {/* 등기접수증 모달 */}
      {isRegistrationReceiptModalOpen && (
        <Modal title="등기접수증" onClose={closeRegistrationReceiptModal}>
          <Grid>
            <GridItem desktop={5} tablet={12} mobile={12}>
              <ResponsiveSwiper
                isDesktop={isDesktop}
                requestNo={requestNo}
                attachFileCode={ATTC_FIL_CD.REGISTRATION_RECEIPT}
              />
            </GridItem>
            <GridItem desktop={7} tablet={12} mobile={12}>
              <RegistrationReceiptDetail isDesktop={isDesktop} requestNo={requestNo} />
            </GridItem>
          </Grid>
        </Modal>
      )}
    </>
  );
}
