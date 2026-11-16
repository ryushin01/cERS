/* jotai atom import */
import { atom } from "jotai";

/**
 * @name Toast
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @property {string} message     - 토스트팝업에 표시될 메시지
 * @property {string} position    - 토스트팝업 위치
 * @property {function} afterFunc - 토스트팝업 노출 후 진행할 동작
 * @property {boolean} isOpen     - 토스트팝업 상태
 */

/* toast-popup 구조 */
interface ToastItems {
  message: string;
  position: "top" | "bottom";
  afterFunc?: (() => void) | null;
}

/* toast-popup open 여부 */
interface ToastStatus extends ToastItems {
  isOpen: boolean;
  id: number;
}

/* 토스트팝업 노출 시간 */
const TOAST_DURATION_MS = 3000;

/* atom 초기값 설정 */
const toastAtom = atom<ToastStatus>({
  isOpen: false,
  id: 0,
  message: "",
  position: "top",
  afterFunc: null,
});

/* atom 생성 */
const toastState = atom(
  (get) => get(toastAtom),
  (get, set, state: ToastItems) => {
    const id = get(toastAtom).id + 1;

    set(toastAtom, { ...state, isOpen: true, id });

    /* 3초 후 토스트팝업 사라짐 */
    setTimeout(() => {
      // 그 사이 새 토스트가 떴다면 새 토스트는 닫지 않음 (새 토스트는 자기 타이머로 닫힘)
      if (get(toastAtom).id === id) {
        set(toastAtom, { ...get(toastAtom), isOpen: false });
      }
      state.afterFunc?.();
    }, TOAST_DURATION_MS);
  },
);

/* atom 내보내기 */
export { toastState };
