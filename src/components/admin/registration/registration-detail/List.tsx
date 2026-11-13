"use client";

import { useQuery } from "@tanstack/react-query";

import RegistrationCancel from "@components/admin/registration/registration-status/RegistrationCancel";
import RegistrationDataDetail from "@components/admin/registration/RegistrationDataDetail";
import RegistrationReceiptDetail from "@components/admin/registration/RegistrationReceiptDetail";
import { Button } from "@components/button";
import { Loading, ResponsiveSwiper, Typography } from "@components/common";
import InfoTableSection from "@components/common/InfoTableSection";
import { Grid, GridItem } from "@components/layout";
import { Modal } from "@components/modal";
import { getAddressRows } from "@components/registration/rows";
import { ATTC_FIL_CD } from "@constants/code";
import { useDisclosure } from "@hooks";
import { getRegistrationDetailData } from "@services/registrationManagement";
import { ResponsiveType } from "@types";
import { getCompareWithToday } from "@utils/dateUtil";
import { formatNumberComma, getManagerInfo } from "@utils/stringUtil";

import RegistrationInformation from "./RegistrationInformation";

import "@styles/responsive-table.css";

type RegistrationDetailProps = {
  requestNo: string;
};

type DocData = {
  kind: string;
  crtMembNm: string;
  crtDtm: string;
};

type HistoryData = {
  statNm: string;
  procRsnCnts: string;
  crtMembNm: string;
  crtDtm: string;
};

export default function List({ requestNo, isDesktop }: RegistrationDetailProps & ResponsiveType) {
  const {
    data: data,
    refetch: registrationDetailReFetch,
    isLoading: registrationDetailLoading,
  } = useQuery({
    queryKey: ["admin-registration-detail", requestNo],
    queryFn: async () => await getRegistrationDetailData(requestNo),
    select: (response) => response.data?.data,
    enabled: !!requestNo,
  });

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

  const {
    isOpen: isCancelProgressModalOpen,
    open: openCancelProgressModal,
    close: closeCancelProgressModal,
  } = useDisclosure();

  const {
    isOpen: isRegistrationInformationModalOpen,
    open: openRegistrationInformationModal,
    close: closeRegistrationInformationModal,
  } = useDisclosure();

  //등기접수 정보 모달에서 등록 후 데이터 재조회
  const handleCloseModal = () => {
    closeRegistrationInformationModal();
    registrationDetailReFetch();
  };

  return (
    <>
      {registrationDetailLoading && <Loading />}
      <Grid className="_without-padding">
        <GridItem mobile={12} tablet={12} desktop={6}>
          {/* 담보목적물 주소 */}
          <InfoTableSection
            title="담보목적물 주소"
            isDesktop={isDesktop}
            rows={[...getAddressRows(data), { label: "고유번호", value: data?.unqRgstrNo || "-" }]}
          />
        </GridItem>
        <GridItem mobile={12} tablet={12} desktop={6}>
          {/* 담당자 정보 */}
          <InfoTableSection
            title="담당자 정보"
            isDesktop={isDesktop}
            rows={[
              { label: "금융기관", value: getManagerInfo(data?.bndMembNm, data?.bndMembHpno) },
              { label: "법무대리인", value: getManagerInfo(data?.lgagMembNm, data?.lgagMembHpno) },
              {
                label: "시스템 관리자",
                value: getManagerInfo(data?.mngrMembNm, data?.mngrMembHpno),
              },
            ]}
          />
        </GridItem>
      </Grid>

      <Grid className="_without-padding">
        <GridItem mobile={12} tablet={12} desktop={6}>
          {/* 의뢰내용 정보 */}
          <InfoTableSection
            title="의뢰내용 정보"
            isDesktop={isDesktop}
            rows={[
              { label: "의뢰번호", value: requestNo },
              { label: "채권자", value: data?.bndMembNm || "-" },
              { label: "채무자", value: data?.dbtrNm || "-" },
              { label: "설정약정일", value: data?.seDt || "-" },
              { label: "대출실행일", value: data?.execDt || "-" },
              {
                label: "채권최고액",
                value: data?.bndMaxAmt ? `${formatNumberComma(data?.bndMaxAmt)} 원` : "-",
              },
            ]}
          />
        </GridItem>
        <GridItem mobile={12} tablet={12} desktop={6}>
          {/* 등기접수 정보 */}
          <InfoTableSection
            title="등기접수 정보"
            isDesktop={isDesktop}
            actions={
              !!data?.acptNo ? (
                <Button
                  shape="outline"
                  size="sm"
                  color="grayscale"
                  onClick={openRegistrationInformationModal}
                >
                  수정
                </Button>
              ) : (
                <Button
                  shape="solid"
                  size="sm"
                  color="main100"
                  onClick={openRegistrationInformationModal}
                  disabled={getCompareWithToday(data?.execDt) === "future"}
                >
                  등록
                </Button>
              )
            }
            rows={[
              { label: "관할법원", value: data?.judtCourtNm || "-" },
              { label: "등기소", value: data?.regrNm || "-" },
              { label: "접수번호", value: data?.acptNo || "-" },
              { label: "조회결과", value: data?.rgstrAcptYn || "-" },
            ]}
          />
        </GridItem>
      </Grid>

      <section className="_section">
        <Typography
          as="h2"
          kind={isDesktop ? "title-medium" : "body-large"}
          isBold={true}
          className="_title"
        >
          문서 정보
        </Typography>
        <div
          className="_responsive-table-inner-wrapper _has-thead"
          role="region"
          aria-label="문서 정보 표"
          tabIndex={0}
        >
          <table className="_responsive-table">
            <caption className="_hidden-table-caption">문서 표</caption>
            <thead>
              <tr>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    구분
                  </Typography>
                </th>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    처리 관리자
                  </Typography>
                </th>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    처리일시
                  </Typography>
                </th>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    파일
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.docList?.map((docData: DocData) => {
                return (
                  <tr key={docData?.kind}>
                    <td>
                      <Typography kind={isDesktop ? "body-large" : "body-small"}>
                        {docData?.kind}
                      </Typography>
                    </td>
                    <td>
                      <Typography kind={isDesktop ? "body-large" : "body-small"}>
                        {docData?.crtMembNm}
                      </Typography>
                    </td>
                    <td>
                      <Typography kind={isDesktop ? "body-large" : "body-small"}>
                        {docData?.crtDtm}
                      </Typography>
                    </td>
                    <td>
                      <div className="_flex-center [&>button]:w-1/2">
                        {docData?.kind === "등기자료" ? (
                          <Button
                            shape="outline"
                            size="sm"
                            color="grayscale"
                            onClick={openRegistrationDataModal}
                          >
                            등기자료
                          </Button>
                        ) : (
                          <Button
                            shape="outline"
                            size="sm"
                            color="grayscale"
                            onClick={openRegistrationReceiptModal}
                          >
                            등기접수증
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="_section">
        <Typography
          as="h2"
          kind={isDesktop ? "title-medium" : "body-large"}
          isBold={true}
          className="_title"
        >
          진행 이력
        </Typography>
        {/* NOTE: 진행 이력 테이블은 상위 래퍼에 _progress-history 클래스 추가 필요  */}
        <div
          className="_responsive-table-inner-wrapper _has-thead _progress-history"
          role="region"
          aria-label="진행 이력 표"
          tabIndex={0}
        >
          <table className="_responsive-table">
            <caption className="_hidden-table-caption">진행 이력 표</caption>
            <thead>
              <tr>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    진행상태
                  </Typography>
                </th>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    구분
                  </Typography>
                </th>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    내용
                  </Typography>
                </th>
                <th>
                  <Typography kind={isDesktop ? "body-large" : "body-small"} isBold={true}>
                    처리일시
                  </Typography>
                </th>
              </tr>
            </thead>
            <tbody>
              {data?.statHistList?.map((history: HistoryData) => {
                return (
                  <tr key={history?.crtDtm}>
                    <td>
                      <Typography kind={isDesktop ? "body-large" : "body-small"}>
                        {history?.statNm}
                      </Typography>
                    </td>
                    <td>
                      <Typography kind={isDesktop ? "body-large" : "body-small"}>
                        {history?.crtMembNm}
                      </Typography>
                    </td>
                    <td>
                      <Typography kind={isDesktop ? "body-large" : "body-small"}>
                        {history?.procRsnCnts}
                      </Typography>
                    </td>
                    <td>
                      <Typography kind={isDesktop ? "body-large" : "body-small"}>
                        {history?.crtDtm}
                      </Typography>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end mt-[60px] [&>button]:w-[120px] md:[&>button]:w-[16%]">
        <Button shape="solid" size="md" color="grayscale" onClick={openCancelProgressModal}>
          진행취소
        </Button>
      </div>

      {/* 등기자료 모달 */}
      {isRegistrationDataModalOpen && (
        <Modal title="등기자료" onClose={closeRegistrationDataModal}>
          <Grid>
            <GridItem desktop={5} tablet={12} mobile={12}>
              <ResponsiveSwiper
                requestNo={requestNo}
                attachFileCode={ATTC_FIL_CD.REGISTRATION_DATA}
                isDesktop={isDesktop}
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
                requestNo={requestNo}
                attachFileCode={ATTC_FIL_CD.REGISTRATION_RECEIPT}
                isDesktop={isDesktop}
              />
            </GridItem>
            <GridItem desktop={7} tablet={12} mobile={12}>
              <RegistrationReceiptDetail isDesktop={isDesktop} requestNo={requestNo} />
            </GridItem>
          </Grid>
        </Modal>
      )}

      {/* 진행취소 모달 */}
      {isCancelProgressModalOpen && (
        <Modal title="진행취소" size="md" onClose={closeCancelProgressModal}>
          <RegistrationCancel
            requstNo={requestNo}
            closeCancelProgressModal={closeCancelProgressModal}
          />
        </Modal>
      )}

      {/* 등기접수 정보 등록 모달 */}
      {isRegistrationInformationModalOpen && (
        <Modal title="등기접수 정보 등록" onClose={closeRegistrationInformationModal}>
          <RegistrationInformation
            requestNo={requestNo}
            isDesktop={isDesktop}
            onClose={handleCloseModal}
          />
        </Modal>
      )}
    </>
  );
}
