"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { Button } from "@components/button";
import { DatePicker, Loading, Typography } from "@components/common";
import { CurrencyFormat, Form, InputField, Label, Radio, Select, TextArea } from "@components/form";
import { Grid, GridItem } from "@components/layout";
import { FILE_MAXIMUM_NUMBER } from "@constants/file";
import { LAND_LOT_OPTION } from "@constants/option";
import { AD_ASSIGN } from "@constants/path";
import {
  useAdjustState,
  useDatePicker,
  useDisclosure,
  useIsClient,
  useRadio,
  useSubmitLock,
} from "@hooks";
import { getUnqRgsrtNo, patchAccignmentForm } from "@services/assignDetail";
import { authAtom, toastState } from "@stores";
import { isAddressFormComplete } from "@utils/addressUtil";
import { formatAmountInput, isValidAmount, parseAmount } from "@utils/amountUtil";
import { getCodeList, getMemberOptions } from "@utils/codeUtil";
import { getDateString } from "@utils/dateUtil";

import AddressSearchModal from "../AddressSearchModal";
import ProcessReasonModal from "./ProcessReasonModal";

import type { AssignDetailForm } from "@types";

import "@styles/responsive-table.css";

interface DefineProps {
  requstNo: string;
  data: tableData;
  realeGbCd: { grpCd: string; code: string; codeNm: string }[];
  membList: { membNo: string; membNm: string; bizNo: string; bizNm: string }[];
  imageList?: (File | string)[];
  isUploadDisabled?: boolean;
  isMaxFileExceeded?: boolean;
  isMaxSizeExceeded?: boolean;
}

type tableData = {
  rqstNo: string;
  execDt: string;
  bndNm: string;
  bndBizNo: string;
};

type ImageSource = "prop" | "api";

interface UploadImage {
  src: string;
  source: ImageSource;
  name?: string; // for "prop"
  attcFilNm?: string; // for "api"
}

type ImageItem = File | UploadImage;

export default function Table({
  requstNo,
  data,
  realeGbCd,
  membList,
  imageList,
  isUploadDisabled,
  isMaxFileExceeded,
  isMaxSizeExceeded,
}: DefineProps) {
  const router = useRouter();
  const authInfo = useAtomValue(authAtom);
  const { ...datePickerProps } = useDatePicker();
  const openToast = useSetAtom(toastState);
  const [price, setPrice] = useState("");
  const [radioValue, handleRadio] = useRadio("01");
  const [unqRgstrNo, setUnqRgstrNo] = useState("");
  const [dbtrNM, setDbtrNM] = useState("");
  const [contractDate, setContractDate] = useState<Date | null>();
  const [seDate, setSeDate] = useState("");
  const [lgagDlvrCnts, setLgagDlvrCnts] = useState("");
  const [addrError, setAddrError] = useState(false);
  const [unqRgstrNoError, setUnqRgstrNoError] = useState(false);
  const [isPricesError, setIsPricesError] = useState(false);
  const [isDbtrNMError, setIsDbtrNMError] = useState(false);
  const [isContractDateError, setIsContractDateError] = useState(false);
  // const [isSelectLawyer , setIsSelectLawyer] = useState(false);
  const [requestData, setRequestData] = useState<FormData>();
  const [addrForm, setAddrForm] = useState({
    roadAddr: "",
    rdnmAddr: "",
    lotnumAddrCd: "01",
    bldg: "",
    unit: "",
  });
  const isClient = useIsClient();

  /* 고유번호 리셋 오류로 requstNo props가 바뀔때마다 고유번호 리셋 */
  useAdjustState([requstNo], () => {
    if (requstNo) {
      setUnqRgstrNo("");
    }
  });

  /* client 사이드인지 체크 */

  const {
    isOpen: isSupplementRequestModalOpen,
    open: openSupplementRequestModal,
    close: closeSupplementRequestModal,
  } = useDisclosure();

  const {
    isOpen: isCancelProgressModalOpen,
    open: openCancelProgressModal,
    close: closeCancelProgressModal,
  } = useDisclosure();

  const {
    isOpen: isOpenSearchAddressModal,
    open: openSearchAddressModal,
    close: closeopenSearchAddressModal,
  } = useDisclosure();

  // 원 단위 정수만 받아 천 단위 콤마로 표시 (부호·소수점·문자는 무시, 최대 15자리)
  const thousandSeparator = (event: ChangeEvent<HTMLInputElement>) => {
    setPrice(formatAmountInput(event.target.value));
    setIsPricesError(false); // 필수 인풋 에러 해제
  };

  /* 고유번호조회 api */
  const {
    data: unqRgstrNoData,
    refetch: getUnqRgstrNoData,
    isFetching: unqRgstrNoDataLoading,
  } = useQuery({
    queryKey: ["search-unqrastrcode", requstNo],
    queryFn: async () => {
      const response = await getUnqRgsrtNo({
        rdnmAddr: addrForm.rdnmAddr,
        lotnumAddrCd: addrForm.lotnumAddrCd,
        bldg: addrForm.bldg,
        unit: addrForm.unit,
      });

      // code가 "99" 일때 토스트팝업
      if (response.code === "99") {
        openToast({
          message: "고유번호 조회에 실패하였습니다. 주소를 다시 확인해 주세요.",
          position: "top",
        });
      }

      return response;
    },
    select: (response) => response,
    enabled: false,
  });

  // 중복 제출 방지. 실패 시에만 다시 제출 가능
  // 보완요청·진행취소 잠금도 여기서 가져, 모달을 닫았다 다시 열어도 처리 중인 요청을 다시 보내지 않게 함
  const assignLock = useSubmitLock();
  const supplementLock = useSubmitLock();
  const cancelLock = useSubmitLock();

  /* 배정하기 진행요청 api */
  const { mutate: patchAccignmentsubmit } = useMutation({
    mutationKey: ["registration-accignment"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (data: FormData) => await patchAccignmentForm(data),
    onSuccess: (res) => {
      if (res.data.code === "00") {
        // 1. 토스트팝업 노출 & 배정관리 페이지로 이동
        openToast({
          message: "배정이 완료되었습니다.",
          position: "top",
        });
        router.push(AD_ASSIGN);
      } else {
        assignLock.unlock();
      }
    },
    onError: (error) => {
      assignLock.unlock();
      console.error(error);
    },
  });

  /* 부동산구분코드 option data */
  const REAL_ESTATE_OPTION = getCodeList(realeGbCd);

  // selectedRealEstate 초기값 "00"
  const [selectedRealEstate, setSelectedRealEstate] = useState("00");

  const handleCahngeReale = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedRealEstate(e.target.value);
  };
  const handleCahngeDbtrNm = (e: ChangeEvent<HTMLInputElement>) => {
    setIsDbtrNMError(false); // 필수 인풋 에러 해제
    setDbtrNM(e.target.value);
  };

  /* 법무대리인 리스트 option data */
  const LAWYER_LIST_OPTION = getMemberOptions(membList);
  const [selectLawyer, setSelectedLawyer] = useState(
    LAWYER_LIST_OPTION.length > 0 ? LAWYER_LIST_OPTION[0].value : "",
  );

  /* ---- 주소검색 ---- */
  /* 1. 주소검색 Form onChange */
  const addressFormMonitor = (e: ChangeEvent<HTMLFormElement>) => {
    const { name, value } = e.target;

    setAddrForm((prevForm) => ({
      ...prevForm,
      [name]: value,
    }));
    setAddrError(false); // 주소 조회 인풋 에러 해제
  };

  /* 1. 주소검색 모달에서 고른 주소 반영 (모달은 AddressSearchModal이 닫음) */
  const handleSelectAddress = (address: { roadAddr: string; rdnmAddr: string }) => {
    setAddrForm((prevForm) => ({ ...prevForm, ...address }));
    setAddrError(false); // 주소 조회 인풋 에러 해제
  };
  /* ---- 주소검색 끝 ---- */

  /* ---- 등기 고유 번호 조회 ---- */
  const handleSearchRgstrNo = () => {
    /* 인풋에러 해제 */
    setAddrError(false);
    setUnqRgstrNoError(false);

    /* lotnumAddrCd에 따라 데이터 체크 */
    const isValidAddrForm = isAddressFormComplete(addrForm);

    if (!isValidAddrForm) {
      setAddrError(true); // 고유번호조회 인풋 에러
      openToast({
        message: "주소를 모두 입력해주세요.",
        position: "top",
      });
      return;
    }
    getUnqRgstrNoData();
  };

  /* 등기고유번호 조회 완료시 setUnqRgstrNo 데이터 set */
  useAdjustState([unqRgstrNoData, unqRgstrNoDataLoading], () => {
    if (unqRgstrNoData && !unqRgstrNoDataLoading) {
      setUnqRgstrNo(unqRgstrNoData.data);
    }
  });

  /* ---- 등기 고유 번호 조회 끝 ---- */

  /* ---- 설정 약정일 ---- */
  const handleDateChange = (date: Date | null) => {
    const newDate = date;

    const setDate = getDateString(date);

    setContractDate(newDate);
    setSeDate(setDate);
    setIsContractDateError(false); // 필수 인풋 에러 해제
  };

  /* ---- 배정하기 ---- */
  const [assignmentForm, setAssignmentForm] = useState<AssignDetailForm>({
    rqstNo: "",
    dbtrNm: "",
    lotnumAddr: "",
    rdnmAddr: "",
    realeCd: "",
    lotnumAddrCd: "00",
    bldg: "",
    unit: "",
    unqRgstrNo: "",
    bndMaxAmt: 0,
    seDt: "",
    lgagMembNo: "",
    lgagDlvrCnts: "",
  });

  const handleAssignmentForm = async () => {
    /* lotnumAddrCd에 따라 데이터 체크 */
    const isValidAddrForm = isAddressFormComplete(addrForm);

    let hasError = false;

    if (!isValidAddrForm) {
      setAddrError(true);
      hasError = true;
    }

    if (!unqRgstrNo) {
      setUnqRgstrNoError(true);
      hasError = true;
    }

    // 0원·빈 값은 제출 불가 (이전에는 입력을 지우면 "0"이 되어 0원이 제출될 수 있었음)
    if (!isValidAmount(parseAmount(price))) {
      setIsPricesError(true);
      hasError = true;
    }

    if (!dbtrNM) {
      setIsDbtrNMError(true);
      hasError = true;
    }

    if (!contractDate) {
      setIsContractDateError(true);
      hasError = true;
    }
    /* TODO : 추후에 법무대리인 필수로 변경 및 주석해제 */
    // if (!selectLawyer) {
    //   setIsSelectLawyer(true); // 필수 인풋 에러
    //   hasError = true;
    // }

    // 하나라도 에러가 있으면 토스트 띄우고 중단
    if (hasError) {
      openToast({
        message: "필수 정보를 전부 입력해 주세요.",
        position: "top",
      });
      return;
    }
    // 1. 업데이트된 form 객체 만들기
    const updatedForm = {
      ...assignmentForm,
      rqstNo: data?.rqstNo ?? "",
      dbtrNm: dbtrNM ?? "",
      lotnumAddr: addrForm?.roadAddr ?? "",
      rdnmAddr: addrForm?.rdnmAddr ?? "",
      realeCd: selectedRealEstate ?? "",
      lotnumAddrCd: addrForm?.lotnumAddrCd ?? "00",
      bldg: addrForm?.bldg ?? "",
      unit: addrForm?.unit ?? "",
      unqRgstrNo: unqRgstrNo ?? "",
      bndMaxAmt: parseAmount(price),
      seDt: seDate ?? "",
      lgagMembNo: selectLawyer ?? "",
      lgagDlvrCnts: lgagDlvrCnts ?? "",
    };

    // 2. 상태로 저장 (화면 업데이트용)
    setAssignmentForm(updatedForm);

    // 3. FormData 생성 및 JSON 추가
    const formData = new FormData();
    formData.append("req", JSON.stringify(updatedForm));

    // 4. 이미지 추가
    if (imageList) {
      await appendAllImagesToFormData(imageList as ImageItem[], formData);
    }

    // 5. 상태 저장
    setRequestData(formData!);

    // 6. API 호출
  };

  useEffect(() => {
    if (isUploadDisabled && isMaxFileExceeded) {
      openToast({
        message: `최대 ${FILE_MAXIMUM_NUMBER}개까지 업로드할 수 있습니다.`,
        position: "top",
      });
      return;
    }
    if (isUploadDisabled && isMaxSizeExceeded) {
      openToast({
        message: `업로드 가능한 전체 용량은 최대 20MB입니다. 용량을 조정해 주세요.”`,
        position: "top",
      });
      return;
    }
    if (requestData && requestData.has("req")) {
      // 6. API 호출 (연속 클릭으로 requestData가 여러 번 바뀌어도 한 번만 전송)
      if (!assignLock.lock()) return;
      patchAccignmentsubmit(requestData);
    }
    // 제출용 requestData가 만들어졌을 때만 검증 후 API를 호출합니다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestData]);

  const appendAllImagesToFormData = async (
    images: ImageItem[],
    formData: FormData,
  ): Promise<void> => {
    const fetchToFile = async (src: string, name: string): Promise<File | null> => {
      // 서버 이미지 경로(/files/images/)는 다시 받지 않음
      if (src.includes("/files/images/")) {
        return null;
      }

      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error("Fetch 실패");

        const blob = await res.blob();
        if (blob.size === 0) throw new Error("빈 이미지");

        return new File([blob], name, { type: blob.type });
      } catch (e) {
        console.error("이미지 변환 실패:", src, e);
        return null;
      }
    };

    for (const image of images) {
      if (image instanceof File) {
        if (image.size > 0) {
          formData.append("multipartFiles", image, image.name);
        }
        continue;
      }

      if (!image?.src) continue;

      const name =
        image.source === "api" ? image.attcFilNm || "api.jpg" : image.name || "image.jpg";

      const file = await fetchToFile(image.src, name);
      if (file) {
        formData.append("multipartFiles", file);
      }
    }
  };
  /* ---- 배정하기 끝 ---- */

  return (
    <>
      {unqRgstrNoDataLoading && <Loading />}
      <div className="md:pl-10">
        <div className="_responsive-table-inner-wrapper _no-thead _admin">
          <table className="_responsive-table">
            <caption className="_hidden-table-caption">전자등기 배정 표</caption>
            <tbody>
              <tr>
                <th>
                  <Typography kind="title-small">의뢰번호</Typography>
                </th>
                <td colSpan={5}>
                  <Typography kind="title-small">{data?.rqstNo}</Typography>
                </td>
              </tr>
              <tr>
                <th>
                  <Typography kind="title-small">대출실행일</Typography>
                </th>
                <td colSpan={2}>
                  <Typography kind="title-small">{data?.execDt}</Typography>
                </td>
                <td colSpan={3}></td>
              </tr>
              <tr>
                <th>
                  <Typography kind="title-small">채권자</Typography>
                </th>
                <td colSpan={3}>
                  <Typography kind="title-small">{data?.bndNm}</Typography>
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <th>
                  <Label htmlFor="dbtr-nm" required={true} labelText="채무자" />
                </th>
                <td colSpan={3}>
                  <InputField
                    name="dbtrNm"
                    defaultValue={dbtrNM}
                    htmlFor="dbtr-nm"
                    type="text"
                    inputSize="sm"
                    placeholder="채무자 입력"
                    onChange={(e) => handleCahngeDbtrNm(e)}
                    isError={isDbtrNMError}
                  />
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <th>
                  <Label htmlFor="reale-cd" required={true} labelText="부동산구분" />
                </th>
                <td colSpan={2}>
                  <Select
                    id="reale-cd"
                    name="reale-cd"
                    selectSize="sm"
                    options={REAL_ESTATE_OPTION}
                    value={selectedRealEstate}
                    onChange={(e) => handleCahngeReale(e)}
                    isError={false}
                  />
                </td>
                <td colSpan={3}></td>
              </tr>
              <tr>
                <th>
                  <Label htmlFor="lotnum" required={true} labelText="담보목적물" />
                </th>
                <td colSpan={5}>
                  <div className="flex flex-col gap-y-2 w-full">
                    <Form
                      onSubmit={() => {}}
                      legendText="주소검색 양식"
                      isHiddenLegend={true}
                      onChange={(e) => addressFormMonitor(e)}
                      className="flex flex-col gap-y-2 w-full"
                    >
                      <div className="flex max-w-24 mb-4">
                        <Button
                          shape="solid"
                          size="sm"
                          color="main100"
                          onClick={() => openSearchAddressModal()}
                        >
                          주소 검색
                        </Button>
                      </div>
                      <div className="flex items-center gap-x-2 mb-2 w-full max-w-[500px] flex-wrap md:flex-nowrap [&>span:first-child]:min-w-24 [&>div]:min-w-[120px] [&>div]:flex-1">
                        <Typography kind="body-medium" className="text-ers-grayscale-80">
                          지번 주소
                        </Typography>
                        <InputField
                          name="roadAddr"
                          ariaLabel="지번 주소"
                          defaultValue={addrForm.roadAddr}
                          htmlFor="lotnum"
                          type="text"
                          inputSize="sm"
                          placeholder=""
                          isError={addrError}
                          readOnly={true}
                        />
                      </div>
                      <div className="flex items-center gap-x-2 mb-2 w-full max-w-[500px] flex-wrap md:flex-nowrap [&>span:first-child]:min-w-24 [&>div]:min-w-[120px] [&>div]:flex-1">
                        <Typography kind="body-medium" className="text-ers-grayscale-80">
                          도로명 주소
                        </Typography>
                        <InputField
                          name="rdnmAddr"
                          ariaLabel="도로명 주소"
                          defaultValue={addrForm.rdnmAddr}
                          htmlFor="roadAddr"
                          type="text"
                          inputSize="sm"
                          placeholder=""
                          isError={addrError}
                          readOnly={true}
                        />
                      </div>
                      <div className="flex items-center gap-x-2 mb-2 flex-wrap [&>span:first-child]:min-w-24">
                        <Typography kind="body-medium" className="text-ers-grayscale-80">
                          상세 주소
                        </Typography>
                        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm whitespace-nowrap">
                          {LAND_LOT_OPTION.map((auth) => {
                            const { id, name, value, labelText, disabled } = auth;

                            return (
                              <li key={id}>
                                <Radio
                                  name={name}
                                  value={value}
                                  labelText={labelText}
                                  checked={radioValue === value}
                                  disabled={disabled}
                                  onChange={handleRadio}
                                />
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* 01 , 02 일때 bldg 영역노출 */}
                        {(radioValue === "01" || radioValue === "02") && (
                          <div className="flex items-center flex-1 min-w-[100px] gap-x-2 [&>div:first-child]:w-[70%]">
                            <InputField
                              name="bldg"
                              ariaLabel="상세 주소 동"
                              defaultValue={addrForm.bldg}
                              htmlFor=""
                              type="text"
                              inputSize="sm"
                              placeholder=""
                              isError={addrError}
                            />
                            <Typography kind="body-medium" className="text-ers-grayscale-80">
                              동
                            </Typography>
                          </div>
                        )}
                        {/* 01 , 03 일때 unit 영역노출 */}
                        {(radioValue === "01" || radioValue === "03") && (
                          <div className="flex items-center flex-1 min-w-[100px] gap-x-2 [&>div:first-child]:w-[70%]">
                            <InputField
                              name="unit"
                              ariaLabel="상세 주소 호"
                              defaultValue={addrForm.unit}
                              htmlFor=""
                              type="number"
                              inputSize="sm"
                              placeholder=""
                              isError={addrError}
                            />
                            <Typography kind="body-medium" className="text-ers-grayscale-80">
                              호
                            </Typography>
                          </div>
                        )}
                      </div>
                    </Form>
                  </div>
                </td>
              </tr>
              <tr>
                <th>
                  <Label htmlFor="unq-cd" required={true} labelText="고유번호" />
                </th>
                <td colSpan={3}>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 [&>button]:w-[108px] [&>div]:flex-1 [&>div]:min-w-[100px]">
                    <Button shape="solid" size="sm" color="main100" onClick={handleSearchRgstrNo}>
                      고유번호 조회
                    </Button>
                    <InputField
                      type="number"
                      name="unqRgstrNo"
                      value={unqRgstrNo}
                      onChange={(e) => setUnqRgstrNo(e.target.value)}
                      htmlFor="unq-cd"
                      inputSize="sm"
                      placeholder=""
                      isError={unqRgstrNoError}
                    />
                  </div>
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <th>
                  <Label htmlFor="bnd-max-amt" required={true} labelText="채권최고액" />
                </th>
                <td colSpan={3}>
                  <CurrencyFormat
                    id="bnd-max-amt"
                    name="price"
                    value={price!}
                    onChange={thousandSeparator}
                    placeholder="채권최고액 입력"
                    inputSize="sm"
                    isError={isPricesError}
                  />
                </td>
                <td colSpan={2}></td>
              </tr>
              <tr>
                <th>
                  <Label htmlFor="se-dt" required={true} labelText="설정약정일" />
                </th>
                <td colSpan={2}>
                  <DatePicker
                    id="se-dt"
                    {...datePickerProps}
                    handleDatePicker={handleDateChange}
                    startDate={contractDate!}
                    isError={isContractDateError}
                  />
                </td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="_responsive-table-inner-wrapper _no-thead _admin mt-6 mb-8">
          <table className="_responsive-table">
            <caption className="_hidden-table-caption">법무대리인, 제출 담당자 표</caption>
            <tbody>
              <tr>
                <th>
                  <Label htmlFor="lgag-memb-no" required={false} labelText="법무대리인" />
                </th>
                <td colSpan={2}>
                  <Select
                    id="lgag-memb-no"
                    name="reale-cd"
                    selectSize="sm"
                    placeholder="법무대리인 선택"
                    options={LAWYER_LIST_OPTION}
                    value={selectLawyer}
                    onChange={(e) => setSelectedLawyer(e.target.value)}
                    // isError={isError}  TODO : 추후에 법무대리인 필수로 변경시 주석해제
                  />
                </td>
                <td colSpan={3}></td>
              </tr>
              <tr>
                <th>
                  <Typography kind="title-small">제출 담당자</Typography>
                </th>
                <td colSpan={2}>
                  {isClient && <Typography kind="title-small">{authInfo?.membNm}</Typography>}
                </td>
                <td colSpan={3}></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="h-32 [&>label>textarea]:p-4 [&>label>textarea]:rounded-lg [&>label>textarea]:text-base [&>label>textarea]:text-ers-grayscale-80">
          <TextArea
            name="lgagDlvrCnts"
            isError={false}
            placeholder="법무대리인에게 전달사항이 있는 경우 작성해 주세요"
            defaultValue={""}
            onChange={(e) => setLgagDlvrCnts(e.target.value)}
          />
        </div>
        {isOpenSearchAddressModal && (
          <AddressSearchModal
            onSelect={handleSelectAddress}
            onClose={closeopenSearchAddressModal}
          />
        )}

        <Grid className="_without-padding flex mt-16 [&>div]:flex">
          <GridItem
            desktop={10}
            tablet={6}
            mobile={12}
            className="justify-center gap-x-3 [&>button]:w-1/3"
          >
            <Button
              shape="solid"
              size="lg"
              color="main100"
              onClick={handleAssignmentForm}
              disabled={assignLock.isLocked}
            >
              배정하기
            </Button>
            <Button
              type="button"
              shape="outline"
              size="lg"
              color="main5"
              onClick={openSupplementRequestModal}
            >
              보완요청
            </Button>
          </GridItem>
          <GridItem desktop={2} tablet={6} mobile={12}>
            <Button
              type="button"
              shape="solid"
              size="lg"
              color="grayscale"
              onClick={openCancelProgressModal}
            >
              진행취소
            </Button>
          </GridItem>
        </Grid>
      </div>

      {isSupplementRequestModalOpen && (
        <ProcessReasonModal
          kind="supplement"
          requestNo={requstNo}
          lock={supplementLock}
          onClose={closeSupplementRequestModal}
        />
      )}
      {isCancelProgressModalOpen && (
        <ProcessReasonModal
          kind="cancel"
          requestNo={requstNo}
          lock={cancelLock}
          onClose={closeCancelProgressModal}
        />
      )}
    </>
  );
}
