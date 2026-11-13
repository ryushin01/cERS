"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { Button } from "@components/button";
import { Typography } from "@components/common";
import { Form, InputField, Label, Select } from "@components/form";
import { Modal } from "@components/modal";
import { PROC_CLS_GB_CD, SPPL_REQ_GB_CD } from "@constants/code";
import {
  CANCEL_PROGRESS_INFORMATION_LIST,
  SUPPLEMENT_REQUEST_INFORMATION_LIST,
} from "@constants/information";
import { AD_ASSIGN } from "@constants/path";
import { useSubmitLock } from "@hooks";
import { patchRegiCancel, patchRegiSupplement } from "@services/assignDetail";
import { getCommonCodeList } from "@services/common";
import { toastState } from "@stores";
import { getCodeList } from "@utils/codeUtil";

/* "기타" 사유 코드. 고르면 사유를 직접 입력합니다. */
const OTHER_REASON = "99";

/* 모달마다 다른 부분 */
const KINDS = {
  supplement: {
    title: "보완요청",
    fieldId: "supplement-request",
    labelText: "보완요청 사유",
    legendText: "보완요청 사유 선택 양식",
    codeGroup: SPPL_REQ_GB_CD,
    informationList: SUPPLEMENT_REQUEST_INFORMATION_LIST,
    submitLabel: "보완 요청하기",
    emptyMessage: "보완요청 사유를 입력해주세요.",
    successMessage: "보완 요청이 완료되었습니다.",
    request: patchRegiSupplement,
  },
  cancel: {
    title: "진행취소",
    fieldId: "cancel-progress",
    labelText: "취소사유",
    legendText: "취소 사유 선택 양식",
    codeGroup: PROC_CLS_GB_CD,
    informationList: CANCEL_PROGRESS_INFORMATION_LIST,
    submitLabel: "진행 취소하기",
    emptyMessage: "진행취소 사유를 입력해주세요.",
    successMessage: "진행취소 상태로 변경되었습니다.",
    request: patchRegiCancel,
  },
} as const;

type ProcessReasonModalProps = {
  kind: keyof typeof KINDS;
  requestNo: string;
  onClose: () => void;
};

/**
 * @name ProcessReasonModal
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 보완요청·진행취소처럼 사유를 골라 처리하는 모달입니다.
 *              사유 목록은 열 때 공통 코드에서 받고, "기타"를 고르면 직접 입력합니다.
 *              처리에 성공하면 배정관리로 이동하고, 실패했을 때만 다시 제출할 수 있습니다.
 * @property {"supplement" | "cancel"} kind - 보완요청 또는 진행취소
 * @property {string} requestNo             - 의뢰번호
 * @property {function} onClose             - 닫기
 */
export default function ProcessReasonModal({ kind, requestNo, onClose }: ProcessReasonModalProps) {
  const config = KINDS[kind];
  const router = useRouter();
  const openToast = useSetAtom(toastState);
  const lock = useSubmitLock();
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [isError, setIsError] = useState(false);

  const { data: codeList } = useQuery({
    queryKey: ["process-reason-codes", config.codeGroup],
    queryFn: async () => await getCommonCodeList(config.codeGroup),
    select: (response) => response.data?.data?.commCodeList,
  });
  const options = getCodeList(codeList);

  const { mutate } = useMutation({
    mutationKey: ["process-reason", kind, requestNo],
    // 보낼 값은 mutate 인자로 직접 받습니다. (상태를 바꾼 직후 불러도 방금 만든 값을 보냄)
    mutationFn: async (payload: { rqstNo: string; procRsnCnts: string }) =>
      await config.request(payload),
    onSuccess: (response) => {
      if (response.code !== "00") {
        lock.unlock();
        return;
      }
      onClose();
      openToast({ message: config.successMessage, position: "top" });
      router.push(AD_ASSIGN);
    },
    onError: (error) => {
      lock.unlock();
      console.error(error);
    },
  });

  /* 사유를 고르면 그 문구를 보냅니다. "기타"는 입력 칸의 글을 보냅니다. */
  const handleSelect = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setIsError(false);
    setSelected(value);
    setReason(
      value === OTHER_REASON ? "" : (options.find((option) => option.value === value)?.label ?? ""),
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reason) {
      openToast({ message: config.emptyMessage, position: "top" });
      setIsError(true);
      return;
    }
    if (!lock.lock()) return; // 중복 제출 방지
    mutate({ rqstNo: requestNo, procRsnCnts: reason });
  };

  return (
    <Modal title={config.title} size="md" onClose={onClose}>
      <Form
        onSubmit={handleSubmit}
        legendText={config.legendText}
        isHiddenLegend={true}
        className="px-4"
      >
        <div className="flex flex-col gap-y-3">
          <Label
            htmlFor={config.fieldId}
            required={true}
            labelText={config.labelText}
            labelSize="md"
          />
          <Select
            id={config.fieldId}
            name="procRsnCnts"
            selectSize="md"
            placeholder="사유 선택"
            options={options}
            value={selected}
            onChange={handleSelect}
            isError={isError}
            required={true}
          />

          {selected === OTHER_REASON && (
            <InputField
              type="text"
              name="procRsnCnts"
              placeholder="사유를 입력해 주세요"
              isError={isError}
              inputSize="md"
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                setIsError(false);
                setReason(event.target.value.trim());
              }}
            />
          )}
        </div>

        <ul className="_information-list mt-5 mb-8">
          {config.informationList.map(({ id, content }) => (
            <li key={id}>
              <Typography kind="body-medium" className="text-ers-grayscale-90">
                {content}
              </Typography>
            </li>
          ))}
        </ul>

        <div className="flex [&>button:first-child]:flex-2 [&>button:last-child]:flex-3 gap-x-3">
          <Button shape="solid" size="md" color="grayscale" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" shape="solid" size="md" color="main100" disabled={lock.isLocked}>
            {config.submitLabel}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
