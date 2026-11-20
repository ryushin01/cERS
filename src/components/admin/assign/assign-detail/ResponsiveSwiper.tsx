import Image from "next/image";

import ImageWithAuth from "@components/common/ImageWithAuth";
import SwiperGallery from "@components/common/SwiperGallery";
import { appURI } from "@constants/env";
import { ResponsiveType, SwiperImage } from "@types";

/* source - api: 서버에 저장된 이미지 / prop: 이번에 새로 추가한 이미지(미리보기 URL) */
type MergedImage = SwiperImage & { source: "api" | "prop" };

type ResponsiveSwiperProps = {
  className?: string;
  requestNo?: string;
  imageList?: MergedImage[];
  imageLoading?: boolean;
  handleFileDelete?: (i: number) => void;
  apiImageLength?: number;
};

/**
 * @name ResponsiveSwiper
 * @version 1.1.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 관리자 - 배정 상세에서 서버 이미지와 새로 추가한 이미지를 함께 보여줍니다.
 *              새로 추가한 이미지만 개별 삭제할 수 있습니다.
 */
export default function ResponsiveSwiper({
  className = "",
  requestNo,
  imageList = [],
  imageLoading,
  isDesktop,
  handleFileDelete,
  apiImageLength = 0,
}: ResponsiveSwiperProps & ResponsiveType) {
  const slides = imageList.map(({ seq, filIdx, src, attcFilNm, source }, index) => {
    const alt = `의뢰번호 ${requestNo}의 등기자료 ${index + 1}번 이미지`;
    const imageProps = {
      width: isDesktop ? 400 : 250,
      height: isDesktop ? 600 : 340,
    };

    return {
      key: `${seq}_${filIdx}_${attcFilNm}`,
      content:
        source === "prop" ? (
          <Image src={src} alt={alt} {...imageProps} />
        ) : (
          <ImageWithAuth src={`${appURI}/api${src}`} alt={alt} {...imageProps} />
        ),
      // 새로 추가한 이미지의 인덱스는 서버 이미지 개수만큼 뒤에서 시작
      onDelete: source === "prop" ? () => handleFileDelete?.(index - apiImageLength) : undefined,
    };
  });

  return (
    <SwiperGallery
      slides={slides}
      className={className}
      paginationType={isDesktop ? "fraction" : "progressbar"}
      isLoading={imageLoading}
      documentName="등기자료"
      isDesktop={isDesktop}
    />
  );
}
