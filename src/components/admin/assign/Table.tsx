"use client";

import { useState } from "react";

import RegistrationDataDetail from "@components/admin/registration/RegistrationDataDetail";
import { Button } from "@components/button";
import { ResponsiveSwiper, Typography } from "@components/common";
import { BodyCell, TableHead } from "@components/common/TableCell";
import { Grid, GridItem } from "@components/layout";
import { Modal } from "@components/modal";
import { ATTC_FIL_CD } from "@constants/code";
import { useDisclosure } from "@hooks";

import type { AssignListItem } from "@types";

import "@styles/responsive-table.css";

interface DefineProps {
  isDesktop: boolean;
  data: AssignListItem[];
}

export default function Table({ isDesktop, data }: DefineProps) {
  const [rqstNo, setRqstNo] = useState("");
  const {
    isOpen: isRegistrationDataModalOpen,
    open: openRegistrationDataModal,
    close: closeRegistrationDataModal,
  } = useDisclosure();

  const handleOpenRegiDataModal = (rqstNo: string) => {
    openRegistrationDataModal();
    setRqstNo(rqstNo);
  };

  return (
    <>
      <div className="_responsive-table-inner-wrapper _has-thead">
        <table className="_responsive-table _col-8-type">
          <caption className="_hidden-table-caption">배정관리 목록 표</caption>
          <TableHead
            isDesktop={isDesktop}
            labels={[
              "진행상태",
              "의뢰번호",
              "의뢰자",
              "채권자",
              "채무자",
              "의뢰일시",
              "배정일시",
              "등기자료",
            ]}
          />
          <tbody>
            {data?.map((item, idx) => {
              const { statNm, rqstNo, clientNm, bndNm, dbtrNm, crtDtm, mtchDtm } = item;
              return (
                <tr key={`${idx}-${rqstNo}`}>
                  <td>
                    <Typography
                      kind={isDesktop ? "title-medium" : "body-medium"}
                      className="_status"
                    >
                      {statNm}
                    </Typography>
                  </td>
                  <BodyCell isDesktop={isDesktop}>{rqstNo}</BodyCell>
                  <td>
                    <Typography
                      kind={isDesktop ? "title-medium" : "body-medium"}
                      className="_status"
                    >
                      {clientNm}
                    </Typography>
                  </td>
                  <td>
                    <Typography
                      kind={isDesktop ? "title-medium" : "body-medium"}
                      className="_status"
                    >
                      {bndNm}
                    </Typography>
                  </td>
                  <BodyCell isDesktop={isDesktop}>{dbtrNm}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{crtDtm}</BodyCell>
                  <BodyCell isDesktop={isDesktop}>{mtchDtm}</BodyCell>
                  <td>
                    <Button
                      shape="outline"
                      size="sm"
                      color="grayscale"
                      onClick={() => handleOpenRegiDataModal(rqstNo)}
                    >
                      등기자료
                    </Button>
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
                requestNo={rqstNo!}
                attachFileCode={ATTC_FIL_CD.REGISTRATION_DATA}
              />
            </GridItem>
            <GridItem desktop={7} tablet={12} mobile={12}>
              <RegistrationDataDetail isDesktop={isDesktop} requestNo={rqstNo!} />
            </GridItem>
          </Grid>
        </Modal>
      )}
    </>
  );
}
