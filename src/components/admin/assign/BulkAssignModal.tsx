"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSetAtom } from "jotai";

import { Button } from "@components/button";
import { Typography } from "@components/common";
import { ErrorMessage, Form, Label, Select } from "@components/form";
import { Modal } from "@components/modal";
import { AD_ASSIGN_DETAIL } from "@constants/path";
import { useSubmitLock } from "@hooks";
import { patchBulkAssign } from "@services/adminAssign";
import { getMemberListData } from "@services/assignDetail";
import { toastState } from "@stores";
import { getMemberOptions } from "@utils/codeUtil";

import type { BulkAssignResult } from "@types";

type BulkAssignModalProps = {
  /* 고른 의뢰번호 */
  requestNos: string[];
  /* 처리가 끝나면 배정된 의뢰번호를 알려 줌 (선택 해제·목록 갱신) */
  onAssigned: (assigned: string[]) => void;
  onClose: () => void;
};

const EMPTY_LAWYER_MESSAGE = "법무대리인을 선택해 주세요.";

/**
 * @name BulkAssignModal
 * @version 1.0.1
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 배정관리 미배정 목록에서 고른 의뢰들에 법무대리인 한 명을 한 번에 지정합니다.
 *              - 법무대리인을 고르지 않고 제출하면 오류 문구를 select에 연결(aria-invalid·aria-describedby)하고 초점을 옮김
 *              - 모두 배정되면 토스트로 알리고 닫음. 일부가 실패하면 결과(실패 의뢰번호·사유, 배정 화면 링크)를 보여 주고 초점을 결과로 옮김
 *              - 처리 중에 닫아도 요청이 끝나면 목록을 갱신하고 배정된 건의 선택을 풂 (다시 연 모달은 닫지 않음)
 *              - 배정 정보(채무자·주소 등)가 빠진 의뢰는 서버가 실패로 돌려주므로, 배정 화면에서 입력한 뒤 배정합니다.
 * @property {string[]} requestNos  - 고른 의뢰번호
 * @property {function} onAssigned  - 처리 후 배정된 의뢰번호 전달
 * @property {function} onClose     - 닫기
 */
export default function BulkAssignModal({ requestNos, onAssigned, onClose }: BulkAssignModalProps) {
  const id = useId();
  const selectId = `${id}-lawyer`;
  const errorId = `${id}-error`;
  const queryClient = useQueryClient();
  const openToast = useSetAtom(toastState);
  const submitLock = useSubmitLock();
  const [lawyer, setLawyer] = useState("");
  const [isError, setIsError] = useState(false);
  const [result, setResult] = useState<BulkAssignResult | null>(null);
  const [requestError, setRequestError] = useState("");
  const resultRef = useRef<HTMLDivElement>(null);

  const { data: memberList } = useQuery({
    queryKey: ["search-memberlist"],
    queryFn: async () => await getMemberListData("10"),
    select: (response) => response.data,
  });
  const lawyerOptions = getMemberOptions(memberList);

  /* 목록 갱신·선택 해제: 처리 중에 모달을 닫아도 요청이 끝나면 해야 하므로 훅 옵션에 둠 */
  const { mutate } = useMutation({
    mutationKey: ["bulk-assign"],
    mutationFn: patchBulkAssign,
    onSuccess: (response) => {
      if (response.code !== "00") return;
      const successList = response.data?.successList ?? [];
      // 배정된 건이 있으면 목록·미배정 건수를 다시 받음
      if (successList.length) {
        queryClient.invalidateQueries({ queryKey: ["search-supplementlist"] });
      }
      onAssigned(successList);
    },
    onError: (error) => console.error(error),
  });

  /* 일부 실패 결과가 나오면 양식이 사라지므로 초점을 결과로 옮김 */
  useEffect(() => {
    if (result) resultRef.current?.focus();
  }, [result]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!lawyer) {
      setIsError(true);
      document.getElementById(selectId)?.focus();
      return;
    }
    if (!submitLock.lock()) return; // 중복 제출 방지
    setRequestError("");
    mutate(
      { rqstNoList: requestNos, lgagMembNo: lawyer },
      {
        // mutate에 넘긴 콜백은 이 모달이 열려 있을 때만 실행됨 (처리 중에 닫으면 호출되지 않음).
        // 그래서 취소한 뒤 다시 연 모달을 앞 요청의 결과가 닫지 않음
        onSuccess: (response) => {
          submitLock.unlock();
          if (response.code !== "00") {
            setRequestError(response.msg || "배정하지 못했습니다. 다시 시도해 주세요.");
            return;
          }
          const data: BulkAssignResult = {
            successList: response.data?.successList ?? [],
            failList: response.data?.failList ?? [],
          };
          if (!data.failList.length) {
            openToast({ message: `${data.successList.length}건을 배정했습니다.`, position: "top" });
            onClose();
            return;
          }
          setResult(data);
        },
        onError: () => {
          submitLock.unlock();
          setRequestError("배정하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        },
      },
    );
  };

  return (
    <Modal title="일괄 배정" size="md" onClose={onClose}>
      {result ? (
        <div ref={resultRef} tabIndex={-1} className="px-4 outline-none">
          <div role="alert">
            <Typography as="p" kind="title-medium" isBold={true}>
              {`${result.successList.length}건 배정, ${result.failList.length}건은 배정하지 못했습니다.`}
            </Typography>
          </div>
          <div className="_responsive-table-inner-wrapper _has-thead mt-4 mb-8">
            <table className="_responsive-table _bulk-result">
              <caption className="_hidden-table-caption">배정하지 못한 의뢰와 사유</caption>
              <thead>
                <tr>
                  <th scope="col">
                    <Typography kind="body-medium" isBold={true}>
                      의뢰번호
                    </Typography>
                  </th>
                  <th scope="col">
                    <Typography kind="body-medium" isBold={true}>
                      사유
                    </Typography>
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.failList.map(({ rqstNo, reason }) => (
                  <tr key={rqstNo}>
                    <td>
                      <Link
                        href={`${AD_ASSIGN_DETAIL}/${encodeURIComponent(rqstNo)}`}
                        className="_bulk-result-link"
                        aria-label={`${rqstNo} 배정 화면으로 이동`}
                      >
                        {rqstNo}
                      </Link>
                    </td>
                    <td>
                      <Typography kind="body-medium">{reason}</Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button shape="solid" size="md" color="main100" onClick={onClose}>
            확인
          </Button>
        </div>
      ) : (
        <Form
          onSubmit={handleSubmit}
          legendText="일괄 배정 양식"
          isHiddenLegend={true}
          className="px-4"
        >
          <Typography as="p" kind="body-large">
            {`고른 의뢰 ${requestNos.length}건에 같은 법무대리인을 지정합니다.`}
          </Typography>
          <ul className="flex flex-wrap gap-2 mt-3 mb-6" aria-label="고른 의뢰번호">
            {requestNos.map((rqstNo) => (
              <li
                key={rqstNo}
                className="px-2 py-1 rounded-md bg-ers-grayscale-20 text-sm text-ers-grayscale-90"
              >
                {rqstNo}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-y-3">
            <Label htmlFor={selectId} required={true} labelText="법무대리인" labelSize="md" />
            <Select
              id={selectId}
              name="lgagMembNo"
              selectSize="md"
              placeholder="법무대리인 선택"
              options={lawyerOptions}
              value={lawyer}
              onChange={(event) => {
                setIsError(false);
                setLawyer(event.target.value);
              }}
              isError={isError}
              ariaDescribedBy={isError ? errorId : undefined}
              required={true}
            />
            {isError && <ErrorMessage id={errorId}>{EMPTY_LAWYER_MESSAGE}</ErrorMessage>}
          </div>

          <ul className="_information-list mt-5 mb-8">
            <li>
              <Typography kind="body-medium" className="text-ers-grayscale-90">
                배정 정보(채무자·담보목적물 주소·채권최고액·설정약정일·등기고유번호)가 빠진 의뢰는
                배정되지 않습니다. 결과에서 해당 의뢰의 배정 화면으로 이동해 입력해 주세요.
              </Typography>
            </li>
            <li>
              <Typography kind="body-medium" className="text-ers-grayscale-90">
                법무대리인에게 전달할 내용이 있으면 의뢰별 배정 화면에서 배정해 주세요.
              </Typography>
            </li>
          </ul>

          {requestError && (
            <div role="alert" className="mb-4">
              <ErrorMessage>{requestError}</ErrorMessage>
            </div>
          )}

          <div className="flex [&>button:first-child]:flex-2 [&>button:last-child]:flex-3 gap-x-3">
            <Button shape="solid" size="md" color="grayscale" onClick={onClose}>
              취소
            </Button>
            <Button
              type="submit"
              shape="solid"
              size="md"
              color="main100"
              disabled={submitLock.isLocked}
            >
              {`${requestNos.length}건 배정하기`}
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
}
