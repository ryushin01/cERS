import { Dispatch, useState } from "react";

import { Button } from "@components/button";
import { ResponsiveSwiper } from "@components/common";
import { BodyCell, TableHead } from "@components/common/TableCell";
import { Grid, GridItem } from "@components/layout";
import { Modal } from "@components/modal";
import Detail from "@components/request-list/Detail";
import { ATTC_FIL_CD, PROC_STAT_CD } from "@constants/code";
import { useDisclosure } from "@hooks";

import RegistrationDataDetail from "./RegistrationDataDetail";
import RegistrationReceiptDetail from "./RegistrationReceiptDetail";

import "@styles/responsive-table.css";

type contentsProps = {
  isDesktop?: boolean;
  data: rgstrList[];
  setQueryTime: Dispatch<React.SetStateAction<Date>>;
};
type rgstrList = {
  rqstNo: string;
  crtDtm: string;
  execDt: string;
  statNm: string;
  dbtrNm: string;
  statCd: string;
  acptNo: string;
};

export default function Table({ isDesktop, data, setQueryTime }: contentsProps) {
  const [requestNo, setRequestNo] = useState<string>("");
  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useDisclosure();
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

  /* 등기자료 모달 오픈 - 조건에 따라서 의뢰목록 등기자료 | 등기현황 등기자료 오픈 구분 & rqstNo 셋팅 */
  const handleOpenModal = (rqstNo: string, statCd: string) => {
    setRequestNo(rqstNo);

    // 등기의뢰, 보완필요인 경우에만 의뢰목록 등기자료 모달 오픈
    if (statCd === PROC_STAT_CD.REQUEST || statCd === PROC_STAT_CD.SUPPLEMENT) {
      openModal();
    } else {
      openRegistrationDataModal();
    }
  };

  /* 접수완료인 경우에만 등기현황 등기자료 모달 오픈 & rqstNo 셋팅 */
  const handleOpenRegistrationReceiptModal = (rqstNo: string) => {
    setRequestNo(rqstNo);
    openRegistrationReceiptModal();
  };

  //등기자료(보완필요) - 진행보류 처리 후 리스트 재조회
  const handleCloseModal = () => {
    closeModal();
    setQueryTime(new Date());
  };

  //등기자료 - 진행보류 처리 후 리스트 재조회
  const handelCloseRegistrationDataModal = () => {
    closeRegistrationDataModal();
    setQueryTime(new Date());
  };

  return (
    <>
      <div className="_responsive-table-inner-wrapper _has-thead">
        <table className="_responsive-table _col-7-type">
          <caption className="_hidden-table-caption">전자등기 현황조회 표</caption>
          <TableHead
            isDesktop={isDesktop}
            labels={[
              "의뢰번호",
              "의뢰일",
              "대출실행일",
              "진행상태",
              "채무자",
              "등기자료",
              "등기접수증",
            ]}
          />
          <tbody>
            {data?.map((item, idx) => (
              <tr key={`${item}-${idx}`}>
                <BodyCell isDesktop={isDesktop}>{item.rqstNo}</BodyCell>
                <BodyCell isDesktop={isDesktop}>{item.crtDtm}</BodyCell>
                <BodyCell isDesktop={isDesktop}>{item.execDt}</BodyCell>
                <BodyCell isDesktop={isDesktop} className="_status">
                  {item.statNm} {item.acptNo && `[${item.acptNo}]`}
                </BodyCell>
                <BodyCell isDesktop={isDesktop}>{item.dbtrNm}</BodyCell>
                <td>
                  {item.statCd <= "30"}
                  <Button
                    shape="solid"
                    size="sm"
                    color="main60"
                    onClick={() => handleOpenModal(item.rqstNo, item.statCd)}
                  >
                    등기자료
                  </Button>
                </td>
                <td>
                  <Button
                    shape="solid"
                    size="sm"
                    color="bluegray"
                    onClick={() => handleOpenRegistrationReceiptModal(item.rqstNo)}
                    disabled={!(item.statCd === PROC_STAT_CD.COMPLET)}
                  >
                    등기접수증
                  </Button>
                </td>
              </tr>
            ))}
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
              <RegistrationDataDetail
                isDesktop={isDesktop}
                requestNo={requestNo}
                onClose={handelCloseRegistrationDataModal}
              />
            </GridItem>
          </Grid>
        </Modal>
      )}

      {/* 등기자료 모달 - 보완필요 상태 */}
      {isModalOpen && (
        <Modal title="등기자료" onClose={closeModal}>
          <Grid>
            <GridItem desktop={5} tablet={12} mobile={12}>
              <ResponsiveSwiper
                isDesktop={isDesktop}
                requestNo={requestNo}
                attachFileCode={ATTC_FIL_CD.REGISTRATION_DATA}
              />
            </GridItem>
            <GridItem desktop={7} tablet={12} mobile={12}>
              <Detail isDesktop={isDesktop} requestNo={requestNo} onClose={handleCloseModal} />
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
