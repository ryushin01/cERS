import Image from "next/image";

import SwiperGallery from "@components/common/SwiperGallery";

type ImageListProps = {
  imageList: string[];
  handleFileDelete: (i: number) => void;
};

/**
 * @name ResponsiveSwiper
 * @version 1.1.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 관리자 - 전자등기 신규등록에서 업로드할 이미지(미리보기 URL)를 개별 삭제 버튼과 함께 보여줍니다.
 */
export default function ResponsiveSwiper({ imageList, handleFileDelete }: ImageListProps) {
  const slides = (imageList ?? []).map((src, i) => ({
    key: `${i}_${src}`,
    content: <Image src={src} alt={`등기자료 ${i + 1}번 이미지`} fill />,
    onDelete: () => handleFileDelete(i),
  }));

  return (
    <SwiperGallery
      slides={slides}
      className="_admin"
      paginationType="fraction"
      documentName="등기자료"
    />
  );
}
