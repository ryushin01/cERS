import axios from "axios";

import { appURI, isDemoMode } from "@constants/env";
import { readAccessToken } from "@stores";
import { mockAdapter } from "@/mocks/adapter";

/**
 * @name axiosBasicInstance
 * @version 1.1.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description       Axios Instance의 기본형으로, 공통 또는 사용 빈도가 높은 config 옵션 값 적용
 * @baseURL           요청에 사용될 서버 URL 옵션
 * @withCredentials   요청 headers 안에 cookie 포함 가능 처리 옵션
 */
export const axiosBasicInstance = axios.create({
  baseURL: appURI,
  withCredentials: true,
});

// 데모 모드: 실제 서버 대신 목업 어댑터가 응답 (화면 코드는 동일하게 동작)
if (isDemoMode) {
  axiosBasicInstance.defaults.adapter = mockAdapter;
}

/**
 * @name ApiError
 * @description HTTP 응답 오류. 메시지 형식("[ERR-상태코드] 메시지")은 토스트에 그대로 노출되며, 판정용 status 값을 함께 보관합니다.
 */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(`[ERR-${status}] ${message}`);
    this.name = "ApiError";
    this.status = status;
  }
}

const DEFAULT_ERROR_MESSAGE = "서버 통신 중 장애가 발생하였습니다.";

/* HTTP 상태 코드별 사용자 안내 메시지 (400은 서버가 내려준 msg 사용) */
const HTTP_ERROR_MESSAGES: Record<number, string> = {
  // Unauthorized: 인증되지 않은 사용자가 접근한 경우 → Provider에서 로그인 화면으로 이동
  401: "미인증 사용자 입니다.\n로그인 화면으로 이동 합니다.",
  // Forbidden: 클라이언트가 콘텐츠에 접근할 권한을 가지고 있지 않을 경우
  403: "접근 권한이 없습니다.",
  // Not Found: 존재하지 않는 API를 요청한 경우
  404: "API를 찾을 수 없습니다.",
  // Not Acceptable: HTTP headers의 content-type이 부적절한 경우
  406: "HTTP headers의 content-type이 올바르지 않습니다.",
  // Request Timeout: 요청에 응답하는 시간이 오래 걸리는 경우
  408: "요청 응답시간이 지연되고 있습니다.",
  // Too Many Requests: 지정된 시간에 불필요하게 많은 요청을 보낸 경우
  429: "너무 많은 서버 요청이 발생하고 있습니다.",
  // Internal Server Error: 서버 오류
  500: DEFAULT_ERROR_MESSAGE,
};

// 요청 인터셉터: 세션스토리지의 토큰을 Authorization 헤더로 주입
axiosBasicInstance.interceptors.request.use(
  function (config) {
    if (!config.headers) return config;

    const accessToken = readAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      // 로그인 정보가 없으면(로그아웃 포함) 헤더 제거
      delete config.headers["Authorization"];
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  },
);

// 응답 인터셉터
// - 업무 실패(HTTP 200 + code "99")는 각 화면에서 처리합니다.
// - HTTP 오류는 ApiError로 변환해 reject하고, Provider의 QueryCache/MutationCache onError가 토스트로 노출합니다.
axiosBasicInstance.interceptors.response.use(
  function (response) {
    return response;
  },
  function (error) {
    const status: number | undefined = error.response?.status;

    if (!status) {
      // 네트워크 오류 등 응답 자체가 없는 경우
      return Promise.reject(error);
    }

    // 개발 환경에서만 오류 응답 상태와 요청 경로를 출력
    if (process.env.NODE_ENV === "development") {
      console.error(`[API ${status}]`, error.config?.url);
    }

    const message =
      status === 400
        ? (error.response.data?.msg ?? DEFAULT_ERROR_MESSAGE)
        : (HTTP_ERROR_MESSAGES[status] ?? DEFAULT_ERROR_MESSAGE);

    return Promise.reject(new ApiError(status, message));
  },
);
