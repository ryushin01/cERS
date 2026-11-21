"use client";

import { useEffect, useState } from "react";
import DaumPostcode, { type Address } from "react-daum-postcode";

import { Modal } from "@components/modal";
import { type AddressForm, toAddressFields } from "@utils/addressUtil";
import { OFFLINE_ADDRESS_SAMPLES } from "@/mocks/data";

type AddressSearchModalProps = {
  /* 주소를 고르면 지번(roadAddr)·도로명(rdnmAddr) 주소를 넘겨줌. 모달 닫기는 onClose로 처리 */
  onSelect: (address: Pick<AddressForm, "roadAddr" | "rdnmAddr">) => void;
  onClose: () => void;
};

type AddressSample = Pick<
  Address,
  "roadAddress" | "buildingName" | "jibunAddress" | "autoJibunAddress"
>;

/* 우편번호 스크립트가 이 시간 안에 준비되지 않으면 예시 주소로 대체 (응답 없이 멈춘 네트워크 대비) */
export const POSTCODE_LOAD_TIMEOUT_MS = 8000;

/**
 * @name OfflineAddressList
 * @description 우편번호 서비스를 쓸 수 없을 때 보여 주는 예시 주소 목록. 안내는 role="status"로 알림
 */
function OfflineAddressList({ onPick }: { onPick: (address: AddressSample) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <p role="status" className="text-sm text-ers-grayscale-90">
        주소 검색 서비스(다음 우편번호)에 연결할 수 없어 오프라인 예시 주소로 표시 중입니다.
      </p>
      <ul className="flex flex-col gap-2" aria-label="예시 주소">
        {OFFLINE_ADDRESS_SAMPLES.map((address) => (
          <li key={address.roadAddress}>
            <button
              type="button"
              className="flex w-full min-h-11 flex-col items-start rounded-lg border border-ers-grayscale-40 px-4 py-2 text-left hover:bg-ers-main-5"
              onClick={() => onPick(address)}
            >
              <span className="font-medium text-ers-grayscale-100">
                {address.roadAddress} ({address.buildingName})
              </span>
              <span className="text-sm text-ers-grayscale-90">지번 {address.jibunAddress}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * @name AddressSearchModal
 * @version 1.1.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 담보목적물 주소검색 모달 (다음·카카오 우편번호 서비스). 전자등기 신규 등록·배정 상세에서 공통으로 사용합니다.
 *              - 우편번호 스크립트를 불러오지 못하거나(오프라인·차단) 제한 시간 안에 준비되지 않으면 예시 주소 목록으로 대체합니다.
 */
export default function AddressSearchModal({ onSelect, onClose }: AddressSearchModalProps) {
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!window.daum?.Postcode) setIsTimedOut(true);
    }, POSTCODE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const handleComplete = (data: AddressSample) => {
    onSelect(toAddressFields(data));
    onClose();
  };

  const fallback = <OfflineAddressList onPick={handleComplete} />;

  return (
    <Modal title="주소검색" size="md" onClose={onClose}>
      {isTimedOut ? fallback : <DaumPostcode onComplete={handleComplete} errorMessage={fallback} />}
    </Modal>
  );
}
