import { FormEvent, MouseEvent, useCallback, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import Webcam from "react-webcam";

import { Button } from "@components/button";
import { DatePicker, Loading, Typography } from "@components/common";
import { Form, Label } from "@components/form";
import { FILE_MAXIMUM_NUMBER, FILE_MAXIMUM_SIZE, FILE_MAXIMUM_SIZE_STRING } from "@constants/file";
import { FI_REQUEST_LIST } from "@constants/path";
import { useAdjustState, useDatePicker, useDisclosure } from "@hooks";
import { PlusMainIcon } from "@icons20";
import { BackIcon } from "@icons24";
import { CameraIcon } from "@icons50";
import { getRegistrationImages } from "@services/file";
import { patchRequestData, postRequestData } from "@services/request";
import { toastState } from "@stores";
import { ResponsiveType } from "@types";
import { getTodayAddDays, stringToDate } from "@utils/dateUtil";

import FileIndicator from "./FileIndicator";
import MobileFileListItem from "./MobileFileListItem";

import "@styles/file-uploader.css";

type MobileFileUploaderProps = {
  requestNo?: string | null;
};

export type FileProps = {
  uid?: string;
  seq?: string;
  filIdx?: number;
  attcFilNm?: string;
  filSize?: number;
  src?: string;
  file?: File;
};

/**
 * @function convertBase64ToFile
 * @description base64 형식을 File 형식으로 변환하는 함수
 * @param {string} base64 base64 파일 경로
 * @param {number} index File 이름 지정을 위한 인덱스
 * @returns File 객체
 */
const convertBase64ToFile = (base64: string, index?: number) => {
  const base64Array: string[] = base64.split(",");
  const mime = base64Array[0].match(/:(.*?);/)?.[1] ?? "image/jpeg";
  const binaryData = atob(base64Array[1]);
  let binaryDataLength: number = binaryData.length;
  const unit8Array = new Uint8Array(binaryDataLength);

  while (binaryDataLength--) {
    unit8Array[binaryDataLength] = binaryData.charCodeAt(binaryDataLength);
  }

  return new File([unit8Array], `${Date.now()}-${index}.jpeg`, { type: mime });
};

export default function MobileFileUploader({
  requestNo,
  isMobile,
  isPortrait,
}: MobileFileUploaderProps & ResponsiveType) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [existingImageList, setIsExistingImageList] = useState({});
  const [isProcessingSubmit, setIsProcessingSubmit] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const { ...datePickerProps } = useDatePicker();
  const openToast = useSetAtom(toastState);

  const { isOpen: isCameraOpen, open: openCamera, close: closeCamera } = useDisclosure();

  const { isOpen: isPreviewOpen, open: openPreview, close: closePreview } = useDisclosure();

  // react-webcam 옵션 지정
  const videoConstraints = {
    facingMode: "environment",
    aspectRatio: isPortrait ? 1.33 : 0.75,
  };

  // 기 생성된 전자등기 페칭(이미지 파일 목록)
  const { data: existingImageListData, isLoading: imageListLoading } = useQuery({
    queryKey: ["registration-images", requestNo],
    queryFn: async () => await getRegistrationImages(requestNo!, "01"),
    select: (response) => response?.data.data,
    enabled: !!requestNo,
  });

  // 미리보기 이미지 목록
  const [imageList, setImageList] = useState<FileProps[]>([]);
  const [tempImageList, setTempImageList] = useState<FileProps[]>([]);

  // 서버 전송용 파일 객체
  const [fileList, setFileList] = useState<File[]>([]);
  const [tempFileList, setTempFileList] = useState<File[]>([]);

  /**
   * @function takePicture
   * @description 사진 촬영 함수
   */
  const takePicture = useCallback(
    (event: MouseEvent) => {
      event.preventDefault();

      const imageSrc = webcamRef.current?.getScreenshot(
        isMobile
          ? { width: 320, height: 426 }
          : isPortrait
            ? { width: 600, height: 800 }
            : { width: 480, height: 640 },
      );

      // 카메라가 준비되지 않아 캡처에 실패한 경우 중단
      if (!imageSrc) return;

      // 1. 업데이트 이미지 목록 배열에 base64 형식의 이미지 저장(미리보기 용도)
      const updatedImageList: FileProps[] = [...imageList];
      updatedImageList.push({
        // 삭제 후 다시 찍어도 겹치지 않도록 촬영 시각을 포함 (순번만 쓰면 uid가 중복되어 함께 지워짐)
        uid: `new-${Date.now()}-${imageList.length}`,
        attcFilNm: String(imageList.length + `.jpeg`),
        filSize: 0,
        src: imageSrc,
        file: fileList[imageList.length],
      });

      // 2. base64 형식의 이미지를 File 형식으로 변환
      const file = convertBase64ToFile(imageSrc, imageList.length);

      // 3. 변환된 File을 업데이트 파일 목록 배열에 저장(서버 통신 용도)
      const updatedFileList: File[] = [...fileList];
      updatedFileList.push(file);

      // 4. 임시 이미지 목록 배열과 임시 파일 목록 배열 업데이트
      setTempImageList(updatedImageList);
      setTempFileList(updatedFileList);

      // 5. 카메라 비활성화 및 미리보기 활성화
      closeCamera();
      openPreview();
    },
    // 촬영 시점의 이미지 목록만 의존하도록 의도된 콜백입니다. (그 외 값은 실행 시점의 최신 값을 읽기만 함)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [webcamRef, imageList, tempImageList, tempFileList],
  );

  /**
   * @function uploadPicture
   * @description 사진 업로드 함수
   */
  const uploadPicture = () => {
    // 1. 임시 이미지 목록 배열과 임시 파일 목록 배열을 각각 최종 이미지 목록 배열과 최종 파일 목록 배열로 업데이트
    setImageList(tempImageList);
    setFileList(tempFileList);

    // 2. 임시 이미지 목록 및 임시 파일 목록 초기화
    setTempImageList([]);
    setTempFileList([]);

    // 3. 미리보기 비활성화
    closePreview();
  };

  /**
   * @function reTakePicture
   * @description 다시 촬영 함수
   */
  const reTakePicture = () => {
    // 1. 미리보기 비활성화
    closePreview();

    // 2. 임시 이미지 목록 배열 초기화
    setTempImageList([]);

    // 3. 임시 파일 목록 배열 초기화
    setTempFileList([]);

    // 4. 카메라 활성화
    openCamera();

    // 5. 로딩 시작 제어
    setIsLoading(true);
  };

  /**
   * @function backToList
   * @description 미리보기 페이지 이동 함수
   */
  const backToList = () => {
    // 1. 카메라 비활성화 및 미리보기 비활성화
    closeCamera();
    closePreview();

    // 2. 임시 이미지 목록 배열 및 임시 파일 목록 배열 초기화
    setTempImageList([]);
    setTempFileList([]);
  };

  /**
   * @function exceededCount
   * @description 첨부 가능 개수 제어 함수
   */
  const exceededCount = () => {
    openToast({
      message: `최대 ${FILE_MAXIMUM_NUMBER}개까지 업로드할 수 있습니다.`,
      position: "bottom",
    });

    closePreview();

    return;
  };

  const getDateString = (date: Date | null) => {
    if (date && !!date?.getDate()) {
      const mm = date?.getMonth() + 1;
      const dd = date?.getDate();
      return `${date?.getFullYear()}${mm.toString().padStart(2, "0")}${dd
        .toString()
        .padStart(2, "0")}`;
    }

    return "";
  };

  /**
   * @function handleSubmit
   * @description 서버 통신 함수
   */
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 업로드 목록이 없는 경우 또는 업로드 목록도 없고 대출실행일도 없는 경우
    if (imageList.length < 1 || (imageList.length < 1 && !datePickerProps.startDate)) {
      openToast({
        message: "파일을 업로드해 주세요.",
        position: "bottom",
      });

      return;
    }

    // 업로드 목록은 있고 대출실행일이 없는 경우
    if (imageList.length > 0 && !datePickerProps.startDate) {
      openToast({
        message: "대출실행일을 입력해 주세요.",
        position: "bottom",
      });

      return;
    }

    // 1. FormData 생성
    const formData = new FormData();

    // 2. mulit part 변환
    let totalSize = 0;
    fileList.forEach((file) => {
      totalSize += file.size || 0;
      formData.append("multipartFiles", file, file.name);
    });

    // 첨부 가능 용량 제어
    const totalMemory = fileList.reduce((total, file) => total + file.size!, 0);

    if ((totalSize || totalMemory) > FILE_MAXIMUM_SIZE) {
      openToast({
        message: `업로드 가능한 전체 용량은 최대 ${FILE_MAXIMUM_SIZE_STRING}입니다.`,
        position: "top",
      });

      return;
    }

    // 3. 등록 여부에 따라 신규 / 수정 로직 진행
    if (requestNo) {
      const requestData = {
        rqstNo: requestNo,
        execDt: getDateString(datePickerProps.startDate),
        imageInfo: existingImageList,
      };

      formData.append("rqstCrtReq", JSON.stringify(requestData));

      // 4. 제출하기 버튼 비활성화
      setIsProcessingSubmit(true);

      // 5. 데이터 페칭 함수 호출
      mutatePatchRequestData(formData);
    } else {
      formData.append("execDt", getDateString(datePickerProps.startDate));

      // 4. 제출하기 버튼 비활성화
      setIsProcessingSubmit(true);

      // 5. 데이터 페칭 함수 호출
      mutatePostRequestData(formData);
    }
  };

  const { mutate: mutatePostRequestData, isPending } = useMutation({
    mutationKey: ["mobile-file-upload"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (data: FormData) => await postRequestData(data),
    onSuccess: (response) => {
      if (response.data.code === "00") {
        successToFetching();
      }
    },
    onError: (error) => {
      setIsProcessingSubmit(false);
      console.error(error);
    },
  });

  const { mutate: mutatePatchRequestData, isPending: patchRequestDataLoading } = useMutation({
    mutationKey: ["request-update"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (data: FormData) => await patchRequestData(data),
    onSuccess: (response) => {
      if (response.data.code === "00") {
        successToFetching();
      }
    },
    onError: (error) => {
      setIsProcessingSubmit(false);
      console.error(error);
    },
  });

  const successToFetching = () => {
    openToast({
      message: "제출이 완료되었습니다.\n관리자가 검토 후 법무대리인이 배정됩니다.",
      position: "bottom",
    });

    setTimeout(() => {
      router.push(FI_REQUEST_LIST);
    }, 3000);
  };

  useAdjustState([existingImageListData], () => {
    const images: FileProps[] = existingImageListData?.imgData ?? [];
    setImageList(
      images.map((image) => ({
        uid: `${image.seq}_${image.filIdx}`,
        seq: image.seq,
        filIdx: image.filIdx,
        attcFilNm: image.attcFilNm,
        filSize: image.filSize,
        src: image.src,
        file: undefined,
      })),
    );
    setFileList([]);
    if (images.length > 0) {
      datePickerProps.handleDatePicker(stringToDate(existingImageListData?.execDt));
    }
    setIsExistingImageList(existingImageListData?.imgData);
  });

  return (
    <>
      {(isLoading || isPending || imageListLoading || patchRequestDataLoading) && <Loading />}

      <div className="_mobile-file-uploader-wrapper">
        <FileIndicator total={FILE_MAXIMUM_NUMBER} count={imageList.length} />

        <Form
          onSubmit={handleSubmit}
          legendText="파일 업로드 양식"
          isHiddenLegend={true}
          className="_mobile-file-upload-form"
        >
          <ul className="_mobile-file-list">
            <li>
              <button
                type="button"
                onClick={() => {
                  if (imageList.length >= FILE_MAXIMUM_NUMBER) {
                    exceededCount();
                  } else {
                    openCamera();
                    setIsLoading(true);
                  }
                }}
                className="_take-picture-button"
              >
                <Image src={PlusMainIcon} alt="" width={20} height={20} />
                <Typography kind="body-medium" isBold={true} className="text-ers-main-100">
                  사진 촬영
                </Typography>
              </button>
            </li>

            {imageList && (
              <MobileFileListItem
                imageList={imageList}
                setImageList={setImageList}
                fileList={fileList}
                setFileList={setFileList}
                setIsExistingImageList={setIsExistingImageList}
              />
            )}
          </ul>

          <div className="_datepicker-wrapper">
            <Label htmlFor="mobile-execution-date" required={true} labelText="대출실행일" />
            <DatePicker
              id="mobile-execution-date"
              isExcludingPast={true}
              minDate={getTodayAddDays(1)}
              {...datePickerProps}
            />
          </div>

          <div className="_button-wrap">
            <Button
              shape="solid"
              size="md"
              color="grayscale"
              onClick={() => router.push(FI_REQUEST_LIST)}
            >
              목록
            </Button>

            <Button
              type="submit"
              shape="solid"
              size="md"
              color="main100"
              disabled={isProcessingSubmit}
            >
              제출하기
            </Button>
          </div>
        </Form>

        {(isCameraOpen || isPreviewOpen) && (
          <>
            <div className="_camera-backdrop"></div>
            <div className="_camera">
              <div className="_camera-inner-wrapper">
                <button
                  type="button"
                  aria-label="카메라 끄기"
                  onClick={backToList}
                  className="_back-button"
                >
                  <Image src={BackIcon} alt="" width={24} height={24} />
                </button>

                {isCameraOpen && (
                  <div className="_video-wrapper">
                    <Webcam
                      ref={webcamRef}
                      audio={false}
                      screenshotFormat="image/jpeg"
                      screenshotQuality={1}
                      height={100 + "%"}
                      width={100 + "%"}
                      videoConstraints={videoConstraints}
                      onUserMedia={() => setIsLoading(false)}
                      onUserMediaError={() => {
                        setIsLoading(false);
                        closeCamera();
                        openToast({
                          message: "카메라를 사용할 수 없습니다. 카메라 권한을 확인해 주세요.",
                          position: "bottom",
                        });
                      }}
                    />
                  </div>
                )}

                {isPreviewOpen && (
                  <Image
                    src={tempImageList[tempImageList.length - 1].src!}
                    alt="촬영한 사진 미리보기"
                    width={50}
                    height={50}
                  />
                )}
              </div>

              {isCameraOpen && (
                <div className="_camera-button-wrap">
                  <button type="button" aria-label="사진 촬영" onClick={takePicture}>
                    <Image src={CameraIcon} alt="" width={48} height={48} />
                  </button>
                </div>
              )}

              {isPreviewOpen && (
                <div className="_button-wrap">
                  <Button shape="solid" size="md" color="grayscale" onClick={reTakePicture}>
                    다시 촬영
                  </Button>

                  <Button shape="solid" size="md" color="main100" onClick={uploadPicture}>
                    사진 업로드하기
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
