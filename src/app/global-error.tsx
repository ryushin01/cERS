"use client";

import { useEffect } from "react";

import { Error as ErrorNotice } from "@components/error-boundary";

import "@styles/globals.css";

/**
 * 루트 레이아웃까지 실패했을 때의 화면입니다. 레이아웃을 대신하므로 html·body를 직접 그립니다.
 */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ko">
      <body>
        <title>일시적인 오류 - cERS</title>
        <ErrorNotice onReset={reset} />
      </body>
    </html>
  );
}
