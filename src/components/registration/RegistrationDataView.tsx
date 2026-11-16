import { ReactNode } from "react";

import InfoTableSection from "@components/common/InfoTableSection";
import { formatNumberComma } from "@utils/stringUtil";

import { DetailVariant, getAddressRows, getManagerRows, RegistrationDetailData } from "./rows";

type RegistrationDataViewProps = {
  requestNo: string;
  data?: RegistrationDetailData;
  variant: DetailVariant;
  isDesktop?: boolean;
  /* 하단 버튼 영역 등 추가 콘텐츠 */
  children?: ReactNode;
};

/**
 * @name RegistrationDataView
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 등기자료 상세 팝업의 표시 영역입니다. (금융기관 현황조회·관리자 등기관리·배정관리 공통)
 *              데이터 조회와 버튼 동작은 각 화면의 상위 컴포넌트에서 처리합니다.
 */
export default function RegistrationDataView({
  requestNo,
  data,
  variant,
  isDesktop,
  children,
}: RegistrationDataViewProps) {
  return (
    <>
      <InfoTableSection title="담보목적물 주소" rows={getAddressRows(data)} isDesktop={isDesktop} />
      <InfoTableSection
        title="기본 정보"
        isDesktop={isDesktop}
        rows={[
          [
            { label: "의뢰번호", value: requestNo },
            { label: "채무자", value: data?.dbtrNm || "-" },
          ],
          [
            { label: "설정약정일", value: data?.seDt || "-" },
            { label: "대출실행일", value: data?.execDt || "-" },
          ],
          {
            label: "채권최고액",
            value: data?.bndMaxAmt ? `${formatNumberComma(data.bndMaxAmt)} 원` : "-",
          },
        ]}
      />
      <InfoTableSection
        title="담당자 정보"
        isDesktop={isDesktop}
        rows={getManagerRows(data, variant, data?.lgagDlvrCnts || "")}
      />
      {children}
    </>
  );
}
