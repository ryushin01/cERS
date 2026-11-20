"use client";

import { useState } from "react";
import { useSetAtom } from "jotai";

import { Button } from "@components/button";
import { useResponsive, useSubmitLock } from "@hooks";
import { toastState } from "@stores";
import { CsvColumn, csvFileName, downloadCsv, fetchAllPages, toCsv } from "@utils/csvUtil";

type CsvExportButtonProps<T> = {
  /* 파일 이름 앞부분 (예: "등기관리 목록" → 등기관리 목록_20261120.csv) */
  fileTitle: string;
  columns: CsvColumn<T>[];
  /* 화면과 같은 조회 조건으로 한 쪽을 불러옴 (모든 쪽을 차례로 부름) */
  fetchPage: (pageNum: number, pageSize: number) => Promise<{ items: T[]; totalPages: number }>;
  label?: string;
};

/**
 * @name CsvExportButton
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 지금 조회 조건의 목록 전체를 엑셀에서 열 수 있는 CSV(UTF-8, BOM)로 내려받습니다.
 *              - 목록 API를 쪽마다 불러 모으므로 서버에 내보내기 전용 API가 없어도 동작 (최대 1만 행)
 *              - 결과·실패는 토스트(role="status")로 알림. 내보내는 동안에는 버튼 이름이 바뀌고 다시 눌러도 무시
 *                (disabled로 바꾸면 누르던 버튼에서 초점이 사라지므로 쓰지 않음)
 * @property {string} fileTitle   - 파일 이름 앞부분
 * @property {CsvColumn[]} columns - 열 이름과 값
 * @property {function} fetchPage  - 한 쪽 조회
 */
export default function CsvExportButton<T>({
  fileTitle,
  columns,
  fetchPage,
  label = "엑셀 내보내기",
}: CsvExportButtonProps<T>) {
  const { isDesktop } = useResponsive();
  const openToast = useSetAtom(toastState);
  const exportLock = useSubmitLock();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!exportLock.lock()) return;
    setIsExporting(true);
    const position = isDesktop ? "top" : "bottom";
    try {
      const { rows, truncated } = await fetchAllPages(fetchPage);
      if (rows.length === 0) {
        openToast({ message: "내보낼 목록이 없습니다.", position });
        return;
      }
      downloadCsv(csvFileName(fileTitle), toCsv(rows, columns));
      openToast({
        message: truncated
          ? `처음 ${rows.length.toLocaleString()}건만 내보냈습니다. 조건을 좁혀 나눠 내보내 주세요.`
          : `${rows.length.toLocaleString()}건을 엑셀(CSV) 파일로 내보냈습니다.`,
        position,
      });
    } catch (error) {
      console.error(error);
      openToast({ message: "목록을 내보내지 못했습니다. 잠시 후 다시 시도해 주세요.", position });
    } finally {
      setIsExporting(false);
      exportLock.unlock();
    }
  };

  return (
    <Button shape="outline" size="sm" color="grayscale" onClick={handleExport}>
      {isExporting ? "내보내는 중…" : label}
    </Button>
  );
}
