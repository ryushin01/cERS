"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useAtom, useSetAtom } from "jotai";
import Cookies from "js-cookie";

import { Button } from "@components/button";
import { Loading } from "@components/common";
import { Checkbox, Form, InputField, Radio } from "@components/form";
import { AUTH_LIST, DEMO_ADMIN_AUTH, DEMO_FINANCIAL_AUTH, MEMB_GB_CD } from "@constants/auth";
import { isDemoMode } from "@constants/env";
import { ID_INPUT, ID_SAVER, PASSWORD_INPUT } from "@constants/input";
import { AD_ASSIGN, FI_HOME } from "@constants/path";
import { SAVED_USER_ID_KEY } from "@constants/storage";
import { useRadio } from "@hooks";
import { postLoginData } from "@services/login";
import { authAtom, toastState } from "@stores";
import { ResponsiveType } from "@types";

import LoginPasswordField from "./LoginPasswordField";

/**
 * @name membGbCd(사용자구분코드)
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * 00 : 금융기관
 * 10 : 법무대리인
 * 20 : 관리자
 */

export default function LoginForm({ isDesktop }: ResponsiveType) {
  const openToast = useSetAtom(toastState);
  const [, saveAuthInfo] = useAtom(authAtom);
  const router = useRouter();
  const [radioValue, handleRadio] = useRadio("00");
  const [isChecked, setIsChecked] = useState(false);
  const [idError, setIdError] = useState(false);
  const [pwdError, setPwdError] = useState(false);
  const [form, setForm] = useState({
    id: "",
    pwd: "",
    membGbCd: "00",
  });

  /* 페이지 렌더링시점에 로컬스토리지에 저장된 userId가 있으면 id에 form 재세팅 및 체크박스 활성화 */
  useEffect(() => {
    const getUserId = localStorage.getItem(SAVED_USER_ID_KEY);
    if (getUserId) {
      // localStorage는 브라우저에만 있어 하이드레이션 뒤에 읽어야 합니다.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ id: getUserId, pwd: "", membGbCd: "00" });
      setIsChecked(true);
    }
  }, []);

  /* 체크박스 핸들러 */
  const handleCheckboxChange = (event: ChangeEvent<HTMLInputElement>) => {
    const checked = event.target.checked;
    setIsChecked(checked);
  };

  /* 로그인 api 호출 */
  const { mutate: loginDataSend, isPending: loginDataLoading } = useMutation({
    mutationKey: ["log-in"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (payload: Parameters<typeof postLoginData>[0]) =>
      await postLoginData(payload),
    onSuccess: (res) => {
      if (res.data.code === "00") {
        // 1. authAtom에 저장 (세션스토리지에도 'auth'로 함께 저장됨)
        saveAuthInfo({ ...res.data.data });

        // 2. 세션 스토리지 저장 시 쿠키에 사용자 유형(membGbCd) 저장
        Cookies.set("membGbCd", res.data.data.membGbCd);

        // 3. id 저장 true이면 로컬스토리지에 userId 저장 false 이면 삭제
        if (isChecked) {
          localStorage.setItem(SAVED_USER_ID_KEY, form.id);
        } else {
          localStorage.removeItem(SAVED_USER_ID_KEY);
        }

        // 4. 1초 후 membGbCd에 따라서 페이지 이동
        setTimeout(() => {
          switch (res.data.data.membGbCd) {
            case "00":
              router.push(FI_HOME);
              break;
            case "10":
              // router.push();
              break;
            case "20":
              router.push(AD_ASSIGN);
              break;
            default:
              break;
          }
        }, 1000);
      } else {
        /* TODO : 법무대리인 서비스 이후는 아래 코드 삭제 */
        if (radioValue === "10") {
          openToast({
            message: "법무대리인 서비스는 준비 중입니다.",
            position: isDesktop ? "top" : "bottom",
          });
          return;
        }
        // 5. id 또는 password 불일치시 토스트팝업 (모바일은 하단에 pc는 상단에 토스트팝업 노출)
        openToast({
          message: "아이디 또는 비밀번호가 일치하지 않습니다.\n다시 확인해 주세요.",
          position: isDesktop ? "top" : "bottom",
        });
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });

  /* 1. 로그인 input 입력 여부 체크 */
  const checkValidation = () => {
    let isValid = true;

    if (form.id === "") {
      setIdError(true);
      isValid = false;
    }
    if (form.pwd === "") {
      setPwdError(true);
      isValid = false;
    }

    return isValid;
  };

  /* 2. 로그인 form set */
  const setLoginForm = (e: ChangeEvent<HTMLFormElement>) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  /* 3. 로그인 데이터 api 호출 */
  const submitLoginForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // 데모 모드: 입력값·API 확인 없이, 선택한 사용자 유형(금융기관·관리자)으로 로그인 처리 후 유형별 홈으로 이동
    if (isDemoMode) {
      if (radioValue === MEMB_GB_CD.LAWYER) {
        openToast({
          message: "법무대리인 서비스는 준비 중입니다.",
          position: isDesktop ? "top" : "bottom",
        });
        return;
      }

      const isAdmin = radioValue === MEMB_GB_CD.ADMIN;
      const demoAuth = isAdmin ? DEMO_ADMIN_AUTH : DEMO_FINANCIAL_AUTH;
      saveAuthInfo(demoAuth);
      Cookies.set("membGbCd", demoAuth.membGbCd);
      router.push(isAdmin ? AD_ASSIGN : FI_HOME);
      return;
    }

    if (!checkValidation()) {
      return; // checkValidation 통과 안되면 return
    }

    loginDataSend(form);
  };

  return (
    <>
      {loginDataLoading && <Loading />}
      <Form
        onSubmit={submitLoginForm}
        onChange={setLoginForm}
        legendText="로그인"
        isHiddenLegend={true}
        className="_login-form"
      >
        <div className="_login-radio-wrapper">
          {AUTH_LIST.map((auth) => {
            const { id, name, value, labelText, disabled } = auth;

            return (
              <div key={id}>
                <Radio
                  name={name}
                  value={value}
                  labelText={labelText}
                  checked={radioValue === value}
                  disabled={disabled}
                  onChange={handleRadio}
                  isDesktop={isDesktop}
                />
              </div>
            );
          })}
        </div>
        <InputField
          type="text"
          name="id"
          defaultValue={form.id}
          required={false}
          placeholder={ID_INPUT.placeHolder}
          inputMessage={ID_INPUT.labelText}
          errorMessage={ID_INPUT.errorText}
          icon={<Image src={ID_INPUT.icon} alt="" width={20} height={20} />}
          iconPosition="left"
          isError={idError}
          onFocus={() => setIdError(false)}
          inputSize={isDesktop ? "lg" : "md"}
        />
        <LoginPasswordField
          type="password"
          name="pwd"
          defaultValue={form.pwd}
          required={false}
          placeholder={PASSWORD_INPUT.placeHolder}
          inputMessage={PASSWORD_INPUT.labelText}
          errorMessage={PASSWORD_INPUT.errorText}
          icon={<Image src={PASSWORD_INPUT.icon} alt="" width={20} height={20} />}
          iconPosition="left"
          isError={pwdError}
          onFocus={() => setPwdError(false)}
          inputSize={isDesktop ? "lg" : "md"}
        />
        <div className="_login-checkbox-wrapper">
          <Checkbox
            name={ID_SAVER.name}
            labelText={ID_SAVER.labelText}
            checked={isChecked}
            disabled={ID_SAVER.disabled}
            onChange={handleCheckboxChange}
          />
        </div>
        <Button type="submit" shape="solid" size="lg" color="main100">
          로그인
        </Button>
      </Form>
    </>
  );
}
