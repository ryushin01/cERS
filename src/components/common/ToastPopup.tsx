"use client";

import { createPortal } from "react-dom";
import { useAtomValue } from "jotai";

import { useIsClient } from "@hooks";
import { toastState } from "@stores";

/**
 * @name Toast
 * @version 1.1.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @property {string} message     - 토스트팝업에 표시될 메시지, ("\n") 기준으로 분리
 * @property {string} position    - 토스트팝업 위치
 */

export default function ToastPopup() {
  const toastObject = useAtomValue(toastState);
  const msgs = toastObject.message.split("\n");
  const mounted = useIsClient();

  if (!mounted) return null; // 서버에서는 렌더링하지 않음

  return (
    <>
      {createPortal(
        // 스크린 리더는 내용이 바뀌는 것을 읽으므로, 알림 영역은 토스트가 없을 때도 유지합니다.
        <section role="status" aria-live="polite" aria-atomic="true" data-live-region>
          {toastObject.isOpen && (
            <div
              className={`fixed left-1/2 transform -translate-x-1/2 transition z-10000 px-2 py-1 
               ${toastObject.position === "bottom" ? "animate-bottom" : "animate-top"} 
                flex items-center justify-center min-h-fit min-w-fit rounded-md bg-ers-main-15 opacity-[97%] shadow-[0px_2px_8px_rgba(0,0,0,0.25)]`}
            >
              <div className="text-ers-main-100 text-center whitespace-nowrap">
                {msgs?.map((msg, idx) => {
                  return <div key={idx}>{msg}</div>;
                })}
              </div>
            </div>
          )}
        </section>,
        document.body,
      )}
    </>
  );
}
