import { FILE_MAXIMUM_NUMBER, FILE_MAXIMUM_SIZE, FILE_MAXIMUM_SIZE_STRING } from "@constants/file";

/** 파일 하나가 업로드 용량(FILE_MAXIMUM_SIZE) 안인지. File과 antd의 UploadFile을 모두 받습니다. */
export const checkFileSize = (file: { size?: number }) => (file.size || 0) <= FILE_MAXIMUM_SIZE;

/** 첨부 파일 수(FILE_MAXIMUM_NUMBER)나 전체 용량(FILE_MAXIMUM_SIZE)을 넘으면 안내 문구, 넘지 않으면 null */
export const getAttachmentLimitMessage = (files: readonly { size: number }[]): string | null => {
  if (files.length > FILE_MAXIMUM_NUMBER) {
    return `최대 ${FILE_MAXIMUM_NUMBER}개까지 업로드할 수 있습니다.`;
  }
  const totalSize = files.reduce((total, file) => total + file.size, 0);
  if (totalSize > FILE_MAXIMUM_SIZE) {
    return `업로드 가능한 전체 용량은 최대 ${FILE_MAXIMUM_SIZE_STRING}입니다.`;
  }
  return null;
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const formatMegaBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return "0 Bytes";
  const dm = decimals < 0 ? 0 : decimals;

  return parseFloat((bytes / 1024 / 1024).toFixed(dm)) + " MB";
};
