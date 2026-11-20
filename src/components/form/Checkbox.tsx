import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from "react";
import Image from "next/image";

import { CheckboxCheckedIcon, CheckboxUncheckedIcon } from "@icons20";

import "@styles/checkbox.css";

type CheckboxProps = {
  name: string;
  labelText: string;
  checked: boolean;
  disabled?: boolean;
  /* 라벨 글자를 화면에서 숨기고 스크린 리더에만 전달 (표 안 선택 칸처럼 아이콘만 보일 때) */
  isHiddenLabel?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
} & Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "className">;

/**
 * @name Checkbox
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 부모 컴포넌트가 클라이언트 컴포넌트이어야 합니다.
 * @property {string} name              - 양식 제출 시 서버에서 식별하기 위한 선택값
 * @property {string} labelText         - 라벨 텍스트
 * @property {boolean} checked          - 선택값
 * @property {boolean} disabled         - 비활성화 여부
 * @property {boolean} isHiddenLabel    - 라벨 글자를 화면에서 숨김 (스크린 리더에는 전달)
 * @property {function} onChange        - 선택 시 호출 함수
 */
export default function Checkbox({
  name,
  labelText,
  checked,
  disabled,
  isHiddenLabel = false,
  onChange,
}: CheckboxProps) {
  const className = `_checkbox ${isHiddenLabel ? "_icon-only" : ""}`;

  return (
    <label className={className}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <Image
        src={checked ? CheckboxCheckedIcon : CheckboxUncheckedIcon}
        alt=""
        width={20}
        height={20}
      />
      <span className={isHiddenLabel ? "sr-only" : undefined}>{labelText}</span>
    </label>
  );
}
