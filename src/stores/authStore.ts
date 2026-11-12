import { atomWithStorage, createJSONStorage } from "jotai/utils";

/* autoAtom 기본 폼 */
type AuthAtom = {
  lognYn: boolean;
  resCd: string;
  membNo: string;
  membNm: string;
  membGbCd: string;
  membGbNm: string;
  membHpno: string;
  statCd: string;
  statNm: string;
  accessToken: string;
  refreshToken: string;
};

/* autoAtom 초기값 */
const initValue: AuthAtom = {
  lognYn: false,
  resCd: "",
  membNo: "",
  membNm: "",
  membGbCd: "",
  membGbNm: "",
  membHpno: "",
  statCd: "",
  statNm: "",
  accessToken: "",
  refreshToken: "",
};

/* sessionStorage에 저장하는 키 */
const AUTH_STORAGE_KEY = "auth";

/* sessionStorage에 저장 */
const storage = createJSONStorage<AuthAtom>(() => sessionStorage);
const authAtom = atomWithStorage<AuthAtom>(AUTH_STORAGE_KEY, initValue, storage);

/**
 * 세션에 저장된 액세스 토큰을 읽습니다.
 * 값이 없거나 손상되었으면(직접 고친 값, 예전 형식 등) 빈 문자열을 돌려줘 요청이 로그아웃 상태로 나가게 합니다.
 */
function readAccessToken(): string {
  try {
    const saved: unknown = JSON.parse(sessionStorage.getItem(AUTH_STORAGE_KEY) ?? "null");
    if (typeof saved !== "object" || saved === null) return "";
    const { accessToken } = saved as { accessToken?: unknown };
    return typeof accessToken === "string" ? accessToken : "";
  } catch {
    return "";
  }
}

/* autoAtom 내보내기 */
export { AUTH_STORAGE_KEY, authAtom, readAccessToken };
