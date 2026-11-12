"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import Cookies from "js-cookie";

import { isDemoMode } from "@constants/env";
import { LOGIN_PATH } from "@constants/path";
import { postLogout } from "@services/login";
import { AUTH_STORAGE_KEY, toastState } from "@stores";

type UseLogoutOptions = {
  /* 로그인 정보 삭제 직후 실행할 동작 (예: 기본 프로필 이미지로 전환) */
  onLoggedOut?: () => void;
  /* 실패 토스트 위치 */
  toastPosition?: "top" | "bottom";
};

/* 로그인 화면 이동 지연 시간 (로그아웃 처리 후) */
const REDIRECT_DELAY_MS = 1000;

const LOGOUT_FAILED_MESSAGE = "로그아웃에 실패하였습니다.\n다시 시도해 주세요.";

/**
 * @name useLogout
 * @version 1.0.0
 * @description 헤더·드로어에서 공통으로 사용하는 로그아웃 훅입니다.
 *              - 세션스토리지 로그인 정보(auth)와 쿠키의 사용자 유형(membGbCd)을 삭제한 뒤 로그인 화면으로 이동합니다.
 *              - Authorization 헤더는 요청 인터셉터가 세션에 토큰이 없으면 제거하므로 별도 처리하지 않습니다.
 *              - 데모 모드에서는 로그아웃 API를 호출하지 않습니다.
 * @returns {function} 로그아웃 실행 함수
 */
export default function useLogout({ onLoggedOut, toastPosition = "top" }: UseLogoutOptions = {}) {
  const router = useRouter();
  const openToast = useSetAtom(toastState);

  const clearLoginInfo = () => {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    Cookies.remove("membGbCd");
    onLoggedOut?.();
  };

  const { mutate: logoutSend } = useMutation({
    mutationKey: ["log-out"],
    mutationFn: async () => await postLogout(),
    onSuccess: (res) => {
      if (res.data.code === "00") {
        clearLoginInfo();
        setTimeout(() => router.push(LOGIN_PATH), REDIRECT_DELAY_MS);
        return;
      }

      openToast({
        message: LOGOUT_FAILED_MESSAGE,
        position: toastPosition,
      });
    },
    onError: (error) => {
      console.error(error);
      openToast({ message: LOGOUT_FAILED_MESSAGE, position: toastPosition });
    },
  });

  return () => {
    if (isDemoMode) {
      clearLoginInfo();
      router.push(LOGIN_PATH);
      return;
    }

    logoutSend();
  };
}
