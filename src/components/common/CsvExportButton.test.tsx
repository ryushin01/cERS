import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createStore, Provider } from "jotai";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toastState } from "@stores";
import { mockDesktopMatchMedia } from "@/test/renderWithProviders";

import CsvExportButton from "./CsvExportButton";

type Row = { rqstNo: string; dbtrNm: string };
const columns = [
  { header: "의뢰번호", value: (row: Row) => row.rqstNo },
  { header: "채무자", value: (row: Row) => row.dbtrNm },
];

let downloads: { name: string; blob: Blob }[] = [];

/* jsdom의 Blob에는 arrayBuffer()·text()가 없어 FileReader로 읽음 */
const readBlob = (blob: Blob) =>
  new Promise<ArrayBuffer>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(blob);
  });

beforeEach(() => {
  mockDesktopMatchMedia();
  downloads = [];
  // jsdom에는 파일 내려받기가 없으므로 만든 Blob과 파일 이름만 기록
  let lastBlob: Blob;
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: (blob: Blob) => {
      lastBlob = blob;
      return "blob:csv";
    },
    revokeObjectURL: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
    this: HTMLAnchorElement,
  ) {
    downloads.push({ name: this.download, blob: lastBlob });
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderButton = (fetchPage: Parameters<typeof CsvExportButton<Row>>[0]["fetchPage"]) => {
  const store = createStore();
  render(
    <Provider store={store}>
      <CsvExportButton fileTitle="등기관리 목록" columns={columns} fetchPage={fetchPage} />
    </Provider>,
  );
  return store;
};

describe("CsvExportButton", () => {
  it("모든 쪽을 불러 BOM이 붙은 CSV로 내려받고, 건수를 알린다", async () => {
    const rows: Row[] = Array.from({ length: 3 }, (_, i) => ({
      rqstNo: `DEMO-00240${i}`,
      dbtrNm: i === 1 ? "=CMD()" : `채무자${i}`,
    }));
    const fetchPage = vi.fn(async (pageNum: number) => ({
      items: rows.slice((pageNum - 1) * 2, pageNum * 2),
      totalPages: 2,
    }));
    const store = renderButton(fetchPage);

    await userEvent.click(screen.getByRole("button", { name: "엑셀 내보내기" }));

    await waitFor(() => expect(downloads).toHaveLength(1));
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(downloads[0].name).toMatch(/^등기관리 목록_\d{8}\.csv$/);
    const bytes = new Uint8Array(await readBlob(downloads[0].blob));
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]); // UTF-8 BOM
    expect(new TextDecoder().decode(bytes.slice(3))).toBe(
      "의뢰번호,채무자\r\nDEMO-002400,채무자0\r\nDEMO-002401,'=CMD()\r\nDEMO-002402,채무자2",
    );
    expect(store.get(toastState).message).toBe("3건을 엑셀(CSV) 파일로 내보냈습니다.");
    expect(screen.getByRole("button", { name: "엑셀 내보내기" })).toBeEnabled();
  });

  it("내보내는 동안 다시 눌러도 한 번만 내보낸다", async () => {
    let resolvePage: (value: { items: Row[]; totalPages: number }) => void = () => {};
    const fetchPage = vi.fn(
      () =>
        new Promise<{ items: Row[]; totalPages: number }>((resolve) => {
          resolvePage = resolve;
        }),
    );
    renderButton(fetchPage);

    const button = screen.getByRole("button", { name: "엑셀 내보내기" });
    await userEvent.click(button);
    expect(screen.getByRole("button", { name: "내보내는 중…" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "내보내는 중…" }));
    expect(fetchPage).toHaveBeenCalledTimes(1);

    resolvePage({ items: [{ rqstNo: "DEMO-002400", dbtrNm: "김민준" }], totalPages: 1 });
    await waitFor(() => expect(downloads).toHaveLength(1));
  });

  it("목록이 비었거나 실패하면 내려받지 않고 알린다", async () => {
    const store = renderButton(async () => ({ items: [], totalPages: 1 }));
    await userEvent.click(screen.getByRole("button", { name: "엑셀 내보내기" }));
    await waitFor(() => expect(store.get(toastState).message).toBe("내보낼 목록이 없습니다."));

    vi.spyOn(console, "error").mockImplementation(() => {});
    const failing = renderButton(async () => {
      throw new Error("network");
    });
    await userEvent.click(screen.getAllByRole("button", { name: "엑셀 내보내기" })[1]);
    await waitFor(() =>
      expect(failing.get(toastState).message).toBe(
        "목록을 내보내지 못했습니다. 잠시 후 다시 시도해 주세요.",
      ),
    );
    expect(downloads).toHaveLength(0);
  });
});
