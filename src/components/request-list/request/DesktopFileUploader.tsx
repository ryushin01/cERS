"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Upload } from "antd";
import { useSetAtom } from "jotai";

import { Button } from "@components/button";
import { DatePicker, Loading, Typography } from "@components/common";
import { Form, Label } from "@components/form";
import { ATTC_FIL_CD } from "@constants/code";
import { FILE_MAXIMUM_NUMBER, FILE_MAXIMUM_SIZE, FILE_MAXIMUM_SIZE_STRING } from "@constants/file";
import { FI_REQUEST_LIST } from "@constants/path";
import { useAdjustState, useDatePicker } from "@hooks";
import { PlusWhiteIcon } from "@icons20";
import { getRegistrationImages } from "@services/file";
import { patchRequestData, postRequestData } from "@services/request";
import { toastState } from "@stores";
import { getDateString, getTodayAddDays, stringToDate } from "@utils/dateUtil";
import { checkFileSize } from "@utils/fileUtil";

import DesktopFileList from "./DesktopFileList";
import FileIndicator from "./FileIndicator";

import type { FileData, UpdateFileData } from "@types";
import type { UploadProps } from "antd";
import type { UploadChangeParam } from "antd/es/upload";

import "@styles/file-uploader.css";

type requestProps = {
  requestNo: string | null;
};

export default function DesktopFileUploader({ requestNo }: requestProps) {
  const openToast = useSetAtom(toastState);
  const router = useRouter();
  const [fileList, setFileList] = useState<FileData[]>([]);
  const { Dragger } = Upload;
  const { ...datePickerProps } = useDatePicker();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  /* 등기자료 코드 */
  const attachFileCode = ATTC_FIL_CD.REGISTRATION_DATA;

  /* 등기자료 정보 조회 */
  const { data: fileData, isLoading: imageLoading } = useQuery({
    queryKey: ["registration-images", requestNo],
    queryFn: async () => await getRegistrationImages(requestNo, attachFileCode),
    select: (response) => response.data?.data,
    enabled: !!requestNo,
  });

  /* 등기자료 신규 등록 */
  const { mutate: mutatePostRequestData, isPending: postRequestDataLoading } = useMutation({
    mutationKey: ["request-upload"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (data: FormData) => await postRequestData(data),
    onSuccess: (response) => {
      if (response.data.code === "00") {
        handleSuccess();
      }
    },
    onError: (error) => {
      console.error(error);
      setIsButtonDisabled(false);
    },
  });

  /* 등기자료 수정 */
  const { mutate: mutatePatchRequestData, isPending: patchRequestDataLoading } = useMutation({
    mutationKey: ["request-update"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (data: FormData) => await patchRequestData(data),
    onSuccess: (response) => {
      if (response.data.code === "00") {
        handleSuccess();
      }
    },
    onError: (error) => {
      console.error(error);
      setIsButtonDisabled(false);
    },
  });

  /* 등기의뢰 등록 또는 수정 후 성공 처리 */
  const handleSuccess = () => {
    openToast({
      message: "제출이 완료되었습니다.\n관리자가 검토 후 법무대리인이 배정됩니다.",
      position: "top",
    });

    setTimeout(() => {
      router.push(FI_REQUEST_LIST);
    }, 3000);
  };

  /* 파일 선택 이벤트 */
  const handleChange = (info: UploadChangeParam) => {
    if (checkFileSize(info.file)) {
      info.fileList?.map((item) => {
        if (item.uid === info.file.uid) {
          const fileData: FileData = {
            uid: item.uid,
            attcFilNm: item.name,
            filSize: item.size,
            src: "",
            file: item.originFileObj,
          };

          setFileList((prev) => [...prev, fileData]);
        }
      });
    } else {
      openToast({
        message: `업로드 가능한 전체 용량은 최대 ${FILE_MAXIMUM_SIZE_STRING}입니다.`,
        position: "top",
      });
    }
  };

  /* 파일 삭제 */
  const handleRemove = (file: FileData) => {
    setFileList((prevFileList) => prevFileList.filter((item) => item.uid !== file.uid));
  };

  //제출하기
  const handleSubmit = () => {
    if (fileList.length === 0) {
      openToast({
        message: "파일을 업로드해 주세요.",
        position: "top",
      });
      return;
    }

    const formData = new FormData();
    const updateFileList: UpdateFileData[] = [];
    let totalSize = 0;
    fileList.forEach((file: FileData) => {
      totalSize += file.filSize || 0;

      if (file.file === undefined) {
        //기 등록한 업로드 파일
        updateFileList.push({
          seq: file.seq!,
          filIdx: file.filIdx!,
          attcFilNm: file.attcFilNm,
          filSize: file.filSize,
          src: file.src!,
        });
      } else {
        //신규 업로드 한 파일
        formData.append("multipartFiles", file.file as Blob, file.attcFilNm);
      }
    });

    //최대 파일 갯수와 용량 모두 초과 시
    if (fileList.length > FILE_MAXIMUM_NUMBER && totalSize > FILE_MAXIMUM_SIZE) {
      openToast({
        message: `최대 ${FILE_MAXIMUM_NUMBER}개, 전체용량 ${FILE_MAXIMUM_SIZE_STRING}까지 업로드할 수 있습니다.\n개수 또는 용량을 조정해 주세요.`,
        position: "top",
      });
      return;
    }

    //최대 파일 갯수 초과 시
    if (fileList.length > FILE_MAXIMUM_NUMBER) {
      openToast({
        message: `최대 ${FILE_MAXIMUM_NUMBER}개까지 업로드할 수 있습니다.\n개수를 조정해 주세요.`,
        position: "top",
      });
      return;
    }

    //최대 업로드 용량 초과 시
    if (totalSize > FILE_MAXIMUM_SIZE) {
      openToast({
        message: `업로드 가능한 전체 용량은 최대 ${FILE_MAXIMUM_SIZE_STRING}입니다.\n용량을 조정해 주세요.`,
        position: "top",
      });
      return;
    }

    //대출 실행일 미입력 시
    if (!datePickerProps.startDate) {
      openToast({
        message: "대출실행일을 입력해 주세요.",
        position: "top",
      });

      return;
    }

    if (requestNo) {
      //전자등기 의뢰 수정 처리
      const requestData = {
        rqstNo: requestNo,
        execDt: getDateString(datePickerProps.startDate),
        imageInfo: updateFileList,
      };
      formData.append("rqstCrtReq", JSON.stringify(requestData));

      mutatePatchRequestData(formData);
    } else {
      //전자등기 의뢰 신규 등록 처리
      formData.append("execDt", getDateString(datePickerProps.startDate));
      mutatePostRequestData(formData);
    }
    setIsButtonDisabled(true);
  };

  const props: UploadProps = {
    name: "file",
    multiple: true,
    accept: ".jpg, .jpeg, .png",
    showUploadList: false,
    listType: "text", // 업로드된 파일 목록의 표시 형식을 설정합니다.  'text' | 'picture' | 'picture-card'
    //maxCount: 10, // 최대 업로드 파일 갯수

    onChange: handleChange,
    onRemove: handleRemove,
    beforeUpload: () => false, // 자동 업로드 방지
  };

  //기 등록한 파일 정보 조회시 fileList에 추가
  useAdjustState([fileData], () => {
    setFileList(
      (fileData?.imgData ?? []).map((image: FileData) => ({
        uid: `${image.seq}_${image.filIdx}`,
        seq: image.seq,
        filIdx: image.filIdx,
        attcFilNm: image.attcFilNm,
        filSize: image.filSize,
        src: image.src,
        file: undefined,
      })),
    );

    if (!!fileData?.execDt) {
      datePickerProps.handleDatePicker(stringToDate(fileData.execDt));
    }
    // 조회한 등기자료(fileData)를 받았을 때만 초기값을 세팅합니다.
  });

  //첨부파일 추가 시 개수 및 용량 체크
  useEffect(() => {
    //최대 파일 갯수 초과 시
    if (fileList.length > FILE_MAXIMUM_NUMBER) {
      openToast({
        message: `최대 ${FILE_MAXIMUM_NUMBER}개까지 업로드할 수 있습니다.`,
        position: "top",
      });
    }

    const totalSize = fileList.reduce((acc, file) => acc + (file?.filSize || 0), 0);

    if (totalSize > FILE_MAXIMUM_SIZE) {
      openToast({
        message: `업로드 가능한 전체 용량은 최대 ${FILE_MAXIMUM_SIZE_STRING}입니다.`,
        position: "top",
      });
    }
  }, [fileList, openToast]);

  return (
    <>
      {imageLoading && postRequestDataLoading && patchRequestDataLoading && <Loading />}
      <div className="_desktop-file-uploader-wrapper">
        <FileIndicator total={20} count={fileList.length} />

        <Form
          onSubmit={() => {}}
          legendText="파일 업로드 양식"
          isHiddenLegend={true}
          className="_desktop-file-upload-form"
        >
          <div className="_desktop-file-uploader">
            <Dragger {...props}>
              <Typography kind="title-large" className="text-ers-grayscale-90">
                이곳에 파일을 끌어다 놓거나, 파일 선택 버튼으로 업로드하세요. <br />* 업로드 가능한
                파일 형식: jpg, jpeg, png
              </Typography>
              {/* 업로드 영역 전체가 버튼(role="button")이므로, 안의 "파일 선택"은 버튼 모양만 낸 글자로 둡니다. (버튼 안 버튼 방지) */}
              <span className="_text-button _dragger-select py-3 rounded-lg bg-ers-main-60 text-ers-grayscale-0">
                <Typography kind="title-small">파일 선택</Typography>
                <span className="pl-1">
                  <Image src={PlusWhiteIcon} alt="" width={20} height={20} />
                </span>
              </span>
            </Dragger>

            <DesktopFileList fileList={fileList} handleRemove={handleRemove} />
          </div>

          <div className="_datepicker-wrapper">
            <Label htmlFor="desktop-execution-date" required={true} labelText="대출실행일" />
            <DatePicker
              id="desktop-execution-date"
              minDate={getTodayAddDays(1)}
              {...datePickerProps}
            />
          </div>

          <div className="_button-wrap">
            <Button
              shape="solid"
              size="lg"
              color="grayscale"
              onClick={() => router.push(FI_REQUEST_LIST)}
            >
              목록
            </Button>

            <Button
              shape="solid"
              size="lg"
              color="main100"
              onClick={handleSubmit}
              disabled={isButtonDisabled}
            >
              제출하기
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
