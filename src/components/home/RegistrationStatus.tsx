import { BodyCell, TableHead } from "@components/common/TableCell";
import { useResponsive } from "@hooks";

import type { HomeRegistration } from "@types";

import "@styles/responsive-table.css";

type RegiStratusListProps = {
  data: HomeRegistration[];
};

export default function RegistrationStratus({ data }: RegiStratusListProps) {
  const { isDesktop } = useResponsive();

  return (
    <div className="_responsive-table-inner-wrapper _has-thead">
      <table className="_responsive-table _col-5-type">
        <caption className="_hidden-table-caption">실시간 등기현황 표</caption>
        <TableHead
          isDesktop={isDesktop}
          labels={["의뢰번호", "채무자", "법무대리인", "진행상태", "등기접수번호"]}
        />
        <tbody>
          {data.map((item, idx) => (
            <tr key={`${idx}${item.dbtrNm}`}>
              <BodyCell isDesktop={isDesktop}>{!!item.rqstNo ? item.rqstNo : "-"}</BodyCell>
              <BodyCell isDesktop={isDesktop}>{!!item.dbtrNm ? item.dbtrNm : "-"}</BodyCell>
              <BodyCell isDesktop={isDesktop}>{!!item.lgagMembNm ? item.lgagMembNm : "-"}</BodyCell>
              <BodyCell isDesktop={isDesktop}>{!!item.statCdNm ? item.statCdNm : "-"}</BodyCell>
              <BodyCell isDesktop={isDesktop}>{!!item.acptNo ? item.acptNo : "-"}</BodyCell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
