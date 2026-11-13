"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { useAtomValue } from "jotai";

import { Button } from "@components/button";
import { DatePicker, Loading, Typography } from "@components/common";
import { CurrencyFormat, Form, InputField, Label, Radio, Select, TextArea } from "@components/form";
import { Grid, GridItem } from "@components/layout";
import { REALE_CD } from "@constants/code";
import { LAND_LOT_OPTION } from "@constants/option";
import { AD_ASSIGN } from "@constants/path";
import {
  useAdjustState,
  useDatePicker,
  useDisclosure,
  useFileUpload,
  useIsClient,
  useRadio,
  useSubmitLock,
} from "@hooks";
import { getRqstNoData, postCreateAssign } from "@services/adminAssign";
import { getMemberListData, getUnqRgsrtNo } from "@services/assignDetail";
import { getCommonCodeList } from "@services/common";
import { authAtom, toastState } from "@stores";
import { isAddressFormComplete } from "@utils/addressUtil";
import { formatAmountInput, isValidAmount, parseAmount } from "@utils/amountUtil";
import { getBankOptions, getCodeList, getMemberOptions } from "@utils/codeUtil";
import { getDateString } from "@utils/dateUtil";
import { getAttachmentLimitMessage } from "@utils/fileUtil";

import AddressSearchModal from "../AddressSearchModal";
import EmptyBox from "./EmptyBox";
import ResponsiveSwiper from "./ResponsiveSwiper";

import type { AssignCreateForm } from "@types";

import "@styles/responsive-table.css";

export default function CreateForm() {
  const router = useRouter();
  const { ...datePickerProps } = useDatePicker();
  const { handleFileChange, handleFileDelete, previewImageList, imageList } = useFileUpload();
  const authInfo = useAtomValue(authAtom);
  const openToast = useSetAtom(toastState);
  // 로그인 정보는 sessionStorage에 있어 서버 렌더링 결과와 다르므로, 마운트 후에만 표시 (hydration 불일치 방지)
  const isClient = useIsClient();

  const [realeCd, setRealeCd] = useState([{ grpCd: "", code: "", codeNm: "" }]);
  const [bankList, setBankList] = useState([
    {
      membNo: "",
      membNm: "",
      bizNo: "",
      bizNm: "",
    },
  ]);
  const [membList, setMembList] = useState([
    {
      membNo: "",
      membNm: "",
      bizNo: "",
      bizNm: "",
    },
  ]);
  const [price, setPrice] = useState("");
  const [radioValue, handleRadio] = useRadio("01");
  const [unqRgstrNo, setUnqRgstrNo] = useState("");
  const [dbtrNM, setDbtrNM] = useState("");
  const [execDate, setExecDate] = useState<Date | null>();
  const [contractDate, setContractDate] = useState<Date | null>();
  const [lgagDlvrCnts, setLgagDlvrCnts] = useState("");

  const [execDtError, setExecDtError] = useState(false); // 대출실행일 인풋 에러
  const [selectBankError, setSelectBankError] = useState(false); // 채권자 인풋 에러
  const [isDbtrNMError, setIsDbtrNMError] = useState(false); // 채무자 인풋 에러
  const [addrError, setAddrError] = useState(false); // 담보목적물(주소) 인풋 에러
  const [unqRgstrNoError, setUnqRgstrNoError] = useState(false); // 고유번호 인풋 에러
  const [isPricesError, setIsPricesError] = useState(false); // 채권최고액 인풋 에러
  const [isContractDateError, setIsContractDateError] = useState(false); // 설정약정일 인풋 에러

  const [realeError, setRealeError] = useState(false);
  const [selectedRealEstate, setSelectedRealEstate] = useState("00");

  const {
    isOpen: isOpenSearchAddressModal,
    open: openSearchAddressModal,
    close: closeopenSearchAddressModal,
  } = useDisclosure();

  const [addrForm, setAddrForm] = useState({
    roadAddr: "",
    rdnmAddr: "",
    lotnumAddrCd: "01",
    bldg: "",
    unit: "",
  });

  const [form, setForm] = useState<AssignCreateForm>({
    rqstNo: "", // 의뢰번호
    execDt: "", // 대출실행일
    bndBizNo: "", // 채권자사업자번호
    dbtrNm: "", // [필수] 채무자명
    lotnumAddr: "", // [필수] 지번주소
    rdnmAddr: "", // [필수] 도로명주소
    realeCd: "00", // 부동산구분코드
    lotnumAddrCd: "01", // [필수] 상세주소 유형 (화면 기본 선택 "동+호"와 같아야 함. 이전 "00"은 없는 코드)
    bldg: "", // 동
    unit: "", // 호
    unqRgstrNo: "", // 등기고유번호
    bndMaxAmt: 0, // 채권최고액
    seDt: "", // 설정약정일
    lgagMembNo: "", // 법무대리인회원번호
    lgagDlvrCnts: "", // 전달사항
  });

  const inputMonitor = (event: ChangeEvent<HTMLFormElement>) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
    setAddrForm({ ...addrForm, [name]: value });
  };

  /* 고유번호조회 api */
  const {
    data: unqRgstrNoData,
    refetch: getUnqRgstrNoData,
    isFetching: unqRgstrNoDataFetching,
  } = useQuery({
    queryKey: ["search-canclecode"],
    queryFn: async () =>
      await getUnqRgsrtNo({
        // 도로명 주소로 조회 (addrForm.roadAddr에는 지번 주소가 들어 있음)
        rdnmAddr: addrForm.rdnmAddr,
        lotnumAddrCd: addrForm.lotnumAddrCd,
        bldg: addrForm.bldg,
        unit: addrForm.unit,
      }),
    select: (response) => response,
    enabled: false,
  });

  // 의뢰번호 조회 api
  const { data: rqstNo } = useQuery({
    queryKey: ["get-rqstNodata"],
    queryFn: async () => await getRqstNoData(),
    select: (response) => response.data,
    enabled: true,
  });

  // 1. 의뢰번호 저장
  useAdjustState([rqstNo], () => {
    setForm((prevForm) => ({
      ...prevForm,
      rqstNo: rqstNo,
    }));
  });

  // 2. 대출실행일 저장
  const handleExecDateChange = (date: Date | null) => {
    const newDate = date;
    // 선택한 날짜를 YYYYMMDD로 (날짜를 지우면 빈 값. 이전에는 null에서 getTimezoneOffset을 호출해 오류 발생)
    const setDate = getDateString(date);

    setForm((prevForm) => ({
      ...prevForm,
      execDt: setDate,
    }));

    setExecDate(newDate);
    setExecDtError(false); // 필수 인풋 에러 해제
  };

  // 3. 채권자 저장
  // 3.1. 채권자 셀렉트 api 데이터 구조 변환
  // 3.2. 채권자 리스트 option data
  const BANK_LIST_OPTION = getBankOptions(bankList);
  const [selectBank, setSelectedBank] = useState(
    BANK_LIST_OPTION.length > 0 ? BANK_LIST_OPTION[0].value : "",
  );

  // 4. 채무자 저장
  const handleCahngeDbtrNm = (e: ChangeEvent<HTMLInputElement>) => {
    setIsDbtrNMError(false); // 필수 인풋 에러 해제
    setDbtrNM(e.target.value);
  };

  // 4. 부동산 저장
  // 4.1. 부동산코드 셀렉트 api 데이터 구조 변환
  // 4.2. 부동산구분코드 option data
  const REAL_ESTATE_OPTION = getCodeList(realeCd);

  // 5. 채권최고액 저장
  // 원 단위 정수만 받아 천 단위 콤마로 표시 (부호·소수점·문자는 무시, 최대 15자리)
  const thousandSeparator = (event: ChangeEvent<HTMLInputElement>) => {
    setPrice(formatAmountInput(event.target.value));
    setIsPricesError(false); // 필수 인풋 에러 해제
  };

  useAdjustState([price], () => {
    setForm((prevForm) => ({
      ...prevForm,
      bndMaxAmt: parseAmount(price),
    }));
  });

  // 6. 설정약정일 저장
  const handleDateChange = (date: Date | null) => {
    const newDate = date;
    const setDate = getDateString(date);

    setForm((prevForm) => ({
      ...prevForm,
      seDt: setDate,
    }));

    setContractDate(newDate);
    setIsContractDateError(false); // 필수 인풋 에러 해제
  };

  /* 법무대리인 리스트 option data */
  const LAWYER_LIST_OPTION = getMemberOptions(membList);
  const [selectLawyer, setSelectedLawyer] = useState(
    LAWYER_LIST_OPTION.length > 0 ? LAWYER_LIST_OPTION[0].value : "",
  );

  /* ---- 주소검색 ---- */
  /* 1. 주소검색 모달에서 고른 주소 반영 (모달은 AddressSearchModal이 닫음) */
  const handleSelectAddress = (address: { roadAddr: string; rdnmAddr: string }) => {
    setAddrForm((prevForm) => ({ ...prevForm, ...address }));
    setAddrError(false); // 고유번호조회 인풋 에러 해제
  };

  useAdjustState([addrForm], () => {
    setForm((prevForm) => ({
      ...prevForm,
      lotnumAddr: addrForm?.roadAddr,
      rdnmAddr: addrForm?.rdnmAddr,
      // 상세주소 유형도 주소 입력값을 기준으로 맞춤 (라디오를 바꾸지 않아도 화면과 같은 값 전송)
      lotnumAddrCd: addrForm?.lotnumAddrCd,
    }));
  });
  /* ---- 주소검색 끝 ---- */

  /* ---- 등기 고유 번호 조회 ---- */
  const handleSearchRgstrNo = () => {
    /* 인풋에러 해제 */
    setAddrError(false);
    setUnqRgstrNoError(false);

    /* 부동산구분없으면 리턴 */
    if (!selectedRealEstate || selectedRealEstate === "") {
      setRealeError(true); // 부동산구분 셀렉트 에러
      openToast({
        message: "부동산 구분을 선택해주세요.",
        position: "top",
      });
      return;
    }

    /* lotnumAddrCd에 따라 데이터 체크 */
    const isValidAddrForm = isAddressFormComplete(addrForm);

    if (!isValidAddrForm) {
      setAddrError(true); // 고유번호조회 인풋 에러
      openToast({
        message: "담보목적물 주소를 입력하고 고유번호를 조회할 수 있습니다.",
        position: "top",
      });
      return;
    }

    getUnqRgstrNoData();
  };

  /* 등기고유번호 조회 완료시 setUnqRgstrNo 데이터 set */
  useEffect(() => {
    if (unqRgstrNoData?.code === "99") {
      openToast({
        message: unqRgstrNoData?.msg,
        position: "top",
      });
    }
  }, [unqRgstrNoData, openToast]);

  useAdjustState([unqRgstrNoData], () => {
    // 조회 전(데이터 없음)에는 입력값을 덮어쓰지 않음 (undefined가 들어가면 controlled input 경고 발생)
    if (!unqRgstrNoData || unqRgstrNoData.code === "99") return;

    setUnqRgstrNo(unqRgstrNoData?.data);

    // 갱신 전 state(unqRgstrNo)가 아닌 조회 결과 값을 form에 반영
    setForm((prevForm) => ({
      ...prevForm,
      unqRgstrNo: unqRgstrNoData?.data,
    }));
  });
  /* ---- 등기 고유 번호 조회 끝 ---- */

  // 중복 등록 방지: 제출을 시작하면 잠그고, 성공 시에는 페이지 이동까지 유지, 실패 시에만 다시 제출 가능
  const submitLock = useSubmitLock();

  const { mutate: mutatePostCreateAssign, isPending: postCreateAssignLoading } = useMutation({
    mutationKey: ["post-create-assign"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (data: FormData) => await postCreateAssign(data),
    onSuccess: (response) => {
      // 배정 성공 시
      if (response.data.code === "00") {
        openToast({
          message: "배정이 완료되었습니다.",
          position: "top",
        });

        setTimeout(() => {
          router.push(AD_ASSIGN);
        }, 3000);
      }

      // 업무 오류(이미지 미등록·의뢰번호 중복 등)는 수정 후 다시 제출할 수 있도록 잠금 해제
      if (response.data.code !== "00") {
        submitLock.unlock();
      }

      // 등기자료 이미지 미등록 시
      if (response.data.code === "99" && response.data.data === "01") {
        openToast({
          message: response.data.msg,
          position: "top",
        });

        return;
      }

      // 의뢰번호 중복 시
      if (response.data.code === "99" && response.data.data === "02") {
        openToast({
          message: response.data.msg,
          position: "top",
        });

        return;
      }
    },
    onError: (error) => {
      submitLock.unlock();
      console.error(error);
    },
  });

  /* 부동산구분코드 조회 api */
  const { data: realeCdData } = useQuery({
    queryKey: ["search-realecode"],
    queryFn: async () => await getCommonCodeList(REALE_CD),
    select: (response) => response.data,
    enabled: true,
  });

  /* 부동산구분코드 데이터 set 해주기 */
  useAdjustState([realeCdData], () => {
    if (realeCdData?.data.commCodeList) {
      setRealeCd(realeCdData.data.commCodeList);
    }
  });

  /* 회원 목록 조회(금융기관) api */
  const {
    // 기본값(객체 리터럴)을 주면 데이터가 없는 동안 렌더링마다 새 객체가 되어 아래 이펙트가 무한 반복되므로 주지 않음
    data: bankListData,
  } = useQuery({
    queryKey: ["search-bank-list"],
    queryFn: async () => await getMemberListData("00"),
    select: (response) => response.data,
    enabled: true,
  });

  /* 회원 목록 조회(법무대리인) api */
  const {
    // 기본값(객체 리터럴)을 주면 데이터가 없는 동안 렌더링마다 새 객체가 되어 아래 이펙트가 무한 반복되므로 주지 않음
    data: memberListData,
  } = useQuery({
    queryKey: ["search-memberlist"],
    queryFn: async () => await getMemberListData("10"),
    select: (response) => response.data,
    enabled: true,
  });

  /* 회원 목록 데이터 set 해주기 */
  useAdjustState([bankListData, memberListData], () => {
    if (Array.isArray(bankListData) && Array.isArray(memberListData)) {
      setBankList(bankListData);
      setMembList(memberListData);
    } else {
      setBankList([]);
      setMembList([]); // 만약 배열이 아니라면 빈 배열로 초기화
    }
  });

  const handleAssignmentForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    /* lotnumAddrCd에 따라 데이터 체크 */
    const isValidAddrForm = isAddressFormComplete(addrForm);

    let hasError = false;

    // 대출실행일 인풋 에러
    if (!execDate) {
      setExecDtError(true);
      hasError = true;
    }

    // 채권자 인풋 에러
    if (!selectBank) {
      setSelectBankError(true);
      hasError = true;
    }

    // 채무자 인풋 에러
    if (!dbtrNM) {
      setIsDbtrNMError(true);
      hasError = true;
    }

    // 담보목적물(주소) 인풋 에러
    if (!isValidAddrForm) {
      setAddrError(true);
      hasError = true;
    }

    // 고유번호 인풋 에러
    if (!unqRgstrNo) {
      setUnqRgstrNoError(true);
      hasError = true;
    }

    // 채권최고액 인풋 에러
    // 0원·빈 값은 제출 불가 (이전에는 입력을 지우면 "0"이 되어 0원이 제출될 수 있었음)
    if (!isValidAmount(parseAmount(price))) {
      setIsPricesError(true);
      hasError = true;
    }

    // 설정약정일 인풋 에러
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

    // 첨부 개수·전체 용량 제한
    const limitMessage = getAttachmentLimitMessage(imageList);
    if (limitMessage) {
      openToast({ message: limitMessage, position: "top" });
      return;
    }

    // 1. formData 생성
    const formData = new FormData();

    // 2. formData에 결합된 폼 객체 추가
    formData.append("req", JSON.stringify(form));

    // 3. formData에 이미지 파일 추가
    imageList.forEach((file: File) => {
      formData.append("multipartFiles", file, file.name);
    });

    // 4. formData 상태 저장

    // 5. 데이터 페칭
    if (!submitLock.lock()) return; // 이미 제출 중이거나 등록 완료
    mutatePostCreateAssign(formData);
  };

  useEffect(() => {
    // 첨부 개수·전체 용량 제한
    const limitMessage = getAttachmentLimitMessage(imageList);
    if (limitMessage) {
      openToast({ message: limitMessage, position: "top" });
      return;
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageList]);

  return (
    <>
      {(postCreateAssignLoading || unqRgstrNoDataFetching) && <Loading />}
      <Form
        onSubmit={handleAssignmentForm}
        onChange={inputMonitor}
        legendText="전자등기 신규등록 양식"
        isHiddenLegend={true}
      >
        <Grid className="_without-padding">
          <GridItem desktop={6} tablet={6} mobile={12}>
            {previewImageList.length > 0 ? (
              <ResponsiveSwiper imageList={previewImageList} handleFileDelete={handleFileDelete} />
            ) : (
              <EmptyBox />
            )}

            <div className="w-[108px] mt-2">
              <label htmlFor="registration-data-input-file" className="_file-uploader">
                등기자료 추가
              </label>
              <input
                type="file"
                id="registration-data-input-file"
                className="hidden"
                accept=".jpg, .jpeg, .png"
                multiple
                onChange={handleFileChange}
              />
            </div>
          </GridItem>
          <GridItem desktop={6} tablet={6} mobile={12}>
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
                        <Typography kind="title-small">{rqstNo}</Typography>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <Label htmlFor="exec-dt" required={true} labelText="대출실행일" />
                      </th>
                      <td colSpan={2}>
                        <DatePicker
                          name="execDt"
                          id="exec-dt"
                          {...datePickerProps}
                          handleDatePicker={handleExecDateChange}
                          startDate={execDate!}
                          isError={execDtError}
                        />
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                    <tr>
                      <th>
                        <Label htmlFor="bnd-memb-no" required={true} labelText="채권자" />
                      </th>
                      <td colSpan={3}>
                        <Select
                          id="bnd-memb-no"
                          name="bndBizNo"
                          selectSize="sm"
                          placeholder="채권자 선택"
                          options={BANK_LIST_OPTION}
                          value={selectBank}
                          onChange={(e) => {
                            setSelectedBank(e.target.value);
                            setSelectBankError(false);
                          }}
                          isError={selectBankError}
                        />
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
                          name="realeCd"
                          selectSize="sm"
                          options={REAL_ESTATE_OPTION}
                          value={selectedRealEstate}
                          onChange={(e) => setSelectedRealEstate(e.target.value)}
                          isError={realeError}
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
                              htmlFor=""
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
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <th>
                        <Label htmlFor="unq-cd" required={true} labelText="고유번호" />
                      </th>
                      <td colSpan={3}>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 [&>button]:w-[108px] [&>div]:flex-1 [&>div]:min-w-[100px]">
                          <Button
                            shape="solid"
                            size="sm"
                            color="main100"
                            onClick={handleSearchRgstrNo}
                          >
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
                          name="lgagMembNo"
                          selectSize="sm"
                          placeholder="법무대리인 선택"
                          options={LAWYER_LIST_OPTION}
                          value={selectLawyer}
                          onChange={(e) => setSelectedLawyer(e.target.value)}
                        />
                      </td>
                      <td colSpan={3}></td>
                    </tr>
                    <tr>
                      <th>
                        <Typography kind="title-small">제출 담당자</Typography>
                      </th>
                      <td colSpan={2}>
                        <Typography kind="title-small">
                          {isClient ? authInfo?.membNm : ""}
                        </Typography>
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
                  defaultValue={lgagDlvrCnts}
                  onChange={(e) => setLgagDlvrCnts(e.target.value)}
                />
              </div>

              <div className="max-w-[28%] mt-16 mx-auto">
                <Button
                  type="submit"
                  shape="solid"
                  size="lg"
                  color="main100"
                  disabled={submitLock.isLocked}
                >
                  배정하기
                </Button>
              </div>
            </div>
          </GridItem>
        </Grid>

        {isOpenSearchAddressModal && (
          <AddressSearchModal
            onSelect={handleSelectAddress}
            onClose={closeopenSearchAddressModal}
          />
        )}
      </Form>
    </>
  );
}
