"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import Image from "next/image";
import { useMutation } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { DefaultProfile } from "@common";
import { Button } from "@components/button";
import { ImageWithAuth, Typography } from "@components/common";
import { Form, InputField } from "@components/form";
import { Modal } from "@components/modal";
import { MEMB_GB_CD } from "@constants/auth";
import { appURI } from "@constants/env";
import { CHANGE_PASSWORD_INPUT } from "@constants/input";
import { useLogout, useResponsive } from "@hooks";
import { LogoutIcon } from "@icons14";
import { patchChangePassword } from "@services/changePassword";
import { authAtom, toastState } from "@stores";

type DrawerContentProps = {
  level: string;
  isModalOpen?: boolean;
  openModal?: () => void;
  closeModal: () => void;
  profileData?: string;
  imgSrc?: string;
};

/**
 * @name DrawerContent
 * @version 1.0.1
 * @author 류창선 <ryushin0167@gmail.com>
 * @property {string} profileData  - 회원명
 * @property {string} imgSrc       - 로고 앰블럼
 */

/**
 * @name 비밀번호변경응답(data:msg)
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * 00 : 변경성공
 * 01 : 현재비밀번호와 불일치
 * 02 : 글자수 미달
 * 03 : 변경할 비밀번호 불일치
 * 04 : 현재와 동일한 비밀번호
 * 99 : 사용자가 존재하지 않음
 */

export default function DrawerContent({
  level,
  isModalOpen,
  openModal,
  closeModal,
  profileData,
  imgSrc,
}: DrawerContentProps) {
  const openToast = useSetAtom(toastState);
  const { isDesktop } = useResponsive();
  const authInfo = useAtomValue(authAtom);
  const [isLogout, setIsLogout] = useState(false);
  const [isDisabled, setIsDisabled] = useState(true);
  const [pwdError, setPwdError] = useState(false);
  const [newPwdError, setNewPwdError] = useState(false);
  const [reNewPwdError, setReNewPwdError] = useState(false);
  const [form, setForm] = useState({
    membNo: authInfo.membNo,
    pwd: "",
    newPwd: "",
    reNewPwd: "",
  });

  /* 토스트팝업 포지션 */
  const toastPosition = isDesktop ? "top" : "bottom";

  /* 로그아웃 (완료 시 기본 프로필 이미지로 전환) */
  const handleLogout = useLogout({ onLoggedOut: () => setIsLogout(true), toastPosition });

  /* form set 함수 */
  const resetForm = () => {
    setForm({
      membNo: authInfo.membNo,
      pwd: "",
      newPwd: "",
      reNewPwd: "",
    });
    setPwdError(false);
    setNewPwdError(false);
    setReNewPwdError(false);
    setIsDisabled(true);
  };

  /* 비밀번호변경 api 호출 */
  const { mutate: changePassword, isPending: isChangingPassword } = useMutation({
    mutationKey: ["log-in"],
    // 요청 데이터는 mutate 인자로 직접 받음 (상태를 바꾼 직후 호출해도 항상 방금 만든 값을 전송)
    mutationFn: async (payload: Parameters<typeof patchChangePassword>[0]) =>
      await patchChangePassword(payload),
    onSuccess: (res) => {
      if (res.data.code === "00") {
        // 1. 변경성공 토스트 팝업 노출
        openToast({
          message: `비밀번호가 변경되었습니다.`,
          position: toastPosition,
          // 2. form 리셋 & 모달 close
          afterFunc: () => {
            resetForm();
            closeModal();
          },
        });
      } else {
        // 3. 실패 시 토스트팝업 (비밀번호 변경 응답 코드별 메시지 다름)
        openToast({
          message: `${res.data.msg}`,
          position: toastPosition,
        });
        // 3. 실패 시 input별로 에러 표시
        switch (res.data.data) {
          case "01":
          case "04":
            setPwdError(true);
            break;
          case "02":
            setNewPwdError(true);
            break;
          case "03":
            setReNewPwdError(true);
            break;
          default:
            break;
        }
      }
    },
    onError: (error) => {
      console.error(error);
    },
  });

  /* 비밀번호 form set */

  /* 비밀번호 input change - 한글입력제어추가 */
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // 한글 포함 여부 확인
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(value);

    if (hasKorean) {
      openToast({
        message: "비밀번호에는 한글을 입력할 수 없습니다.",
        position: isDesktop ? "top" : "bottom",
      });
    }

    // 한글 제거 (유니코드 한글 블록)
    const filteredValue = value.replace(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g, "");

    const updatedForm = {
      ...form,
      [name]: filteredValue,
    };

    setForm(updatedForm);

    // 버튼 활성화 여부 판단
    const isAnyEmpty =
      updatedForm.pwd === "" || updatedForm.newPwd === "" || updatedForm.reNewPwd === "";

    setIsDisabled(isAnyEmpty);
  };

  /* 취소하고 닫으면 입력한 비밀번호를 남기지 않음 */
  const handleCloseModal = () => {
    resetForm();
    closeModal();
  };

  /* 비밀번호변경 api 호출 함수 */
  const handleChangePassword = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isChangingPassword) return;
    changePassword(form);
  };

  return (
    <div className="_drawer-content">
      {/* NOTE: 금융기관 케이스에서만 노출 */}
      {level === MEMB_GB_CD.FINANCIAL && (
        <div className="_drawer-content-inner-wrapper">
          {isLogout ? (
            <Image src={DefaultProfile} alt="기본 프로필 이미지" width={48} height={48} />
          ) : (
            <ImageWithAuth
              src={imgSrc ? `${appURI}/api${imgSrc}` : ""}
              alt={`${profileData} 프로필 이미지`}
              width={48}
              height={48}
            />
          )}
          <Typography kind="body-large" isBold={true}>
            {!!profileData ? profileData : "금융기관"}
          </Typography>
        </div>
      )}

      <div className="_drawer-content-inner-wrapper">
        {level !== MEMB_GB_CD.ADMIN && (
          <Button shape="solid" size="sm" color="main5" onClick={openModal}>
            비밀번호 변경
          </Button>
        )}

        <Button
          shape="outline"
          size="sm"
          color="grayscale"
          icon={<Image src={LogoutIcon} alt="" width={14} height={14} />}
          iconPosition="right"
          onClick={handleLogout}
        >
          로그아웃
        </Button>
      </div>

      {isModalOpen && (
        <Modal title="비밀번호 변경" onClose={handleCloseModal} size="md">
          <Form
            onSubmit={handleChangePassword}
            legendText="비밀번호 변경 양식"
            isHiddenLegend={true}
            className="_change-password-form"
          >
            <div>
              <InputField
                name="pwd"
                value={form.pwd}
                htmlFor={CHANGE_PASSWORD_INPUT.currentLabelText}
                labelText={CHANGE_PASSWORD_INPUT.currentLabelText}
                type="password"
                inputSize={isDesktop ? "lg" : "md"}
                required={true}
                placeholder={CHANGE_PASSWORD_INPUT.currentPassword}
                errorMessage={CHANGE_PASSWORD_INPUT.currentErrorText}
                isError={pwdError}
                onFocus={() => setPwdError(false)}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <InputField
                name="newPwd"
                value={form.newPwd}
                htmlFor={CHANGE_PASSWORD_INPUT.newLabelText}
                labelText={CHANGE_PASSWORD_INPUT.newLabelText}
                type="password"
                inputSize={isDesktop ? "lg" : "md"}
                required={true}
                placeholder={CHANGE_PASSWORD_INPUT.newPassword}
                errorMessage={CHANGE_PASSWORD_INPUT.newErrorText}
                isError={newPwdError}
                onFocus={() => setNewPwdError(false)}
                onChange={handleInputChange}
              />
              <InputField
                name="reNewPwd"
                value={form.reNewPwd}
                htmlFor=""
                labelText=""
                type="password"
                inputSize={isDesktop ? "lg" : "md"}
                required={true}
                placeholder={CHANGE_PASSWORD_INPUT.repeatPassword}
                ariaLabel={CHANGE_PASSWORD_INPUT.repeatPassword}
                errorMessage={CHANGE_PASSWORD_INPUT.repeatErrorText}
                isError={reNewPwdError}
                onFocus={() => setReNewPwdError(false)}
                onChange={handleInputChange}
              />
            </div>
            <Button
              shape="solid"
              size="lg"
              color="main100"
              type="submit"
              disabled={isDisabled || isChangingPassword}
            >
              비밀번호 변경
            </Button>
          </Form>
        </Modal>
      )}
    </div>
  );
}
