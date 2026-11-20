import { useQuery } from "@tanstack/react-query";

import { ATTC_FIL_CD } from "@constants/code";
import { appURI } from "@constants/env";
import { getRegistrationImages } from "@services/file";
import { ResponsiveType, SwiperImage } from "@types";

import ImageWithAuth from "./ImageWithAuth";
import SwiperGallery from "./SwiperGallery";

type ResponsiveSwiperProps = {
  className?: string;
  requestNo?: string;
  attachFileCode?: string;
};

/**
 * @name ResponsiveSwiper
 * @version 1.2.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 의뢰번호·첨부파일 코드로 서버 이미지를 조회해 슬라이드로 보여줍니다. (등기자료·등기접수증 팝업)
 *              슬라이드를 누르면 확대·회전·쪽 이동으로 판독하는 크게 보기가 열립니다.
 *              부모 컴포넌트가 클라이언트 컴포넌트이어야 합니다.
 */
export default function ResponsiveSwiper({
  className = "",
  requestNo,
  attachFileCode,
  isDesktop,
}: ResponsiveSwiperProps & ResponsiveType) {
  /* 등기자료 정보 조회 */
  const { data, isLoading } = useQuery({
    queryKey: ["registration-images", requestNo],
    queryFn: async () => await getRegistrationImages(requestNo!, attachFileCode!),
    select: (response) => response.data?.data,
    enabled: !!requestNo,
  });

  const documentName =
    attachFileCode === ATTC_FIL_CD.REGISTRATION_RECEIPT ? "등기접수증" : "등기자료";

  const slides = (data?.imgData ?? []).map((image: SwiperImage, index: number) => ({
    key: `${image.seq}_${image.filIdx}_${image.attcFilNm}`,
    content: (
      <ImageWithAuth
        src={`${appURI}/api${image.src}`}
        alt={`의뢰번호 ${requestNo}의 ${documentName} ${index + 1}번 이미지`}
        width={isDesktop ? 400 : 250}
        height={isDesktop ? 600 : 340}
      />
    ),
  }));

  return (
    <SwiperGallery
      slides={slides}
      className={className}
      paginationType={isDesktop ? "fraction" : "progressbar"}
      isLoading={isLoading}
      documentName={documentName}
      isDesktop={isDesktop}
    />
  );
}
