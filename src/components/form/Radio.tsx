import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from "react";
import Image from "next/image";

import { Typography } from "@components/common";
import { RadioCheckedIcon, RadioUncheckedIcon } from "@icons20";
import { ResponsiveType } from "@types";

import "@styles/radio.css";

type RadioProps = {
  name: string;
  value: string;
  labelText: string;
  checked: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isMobile?: boolean;
} & Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "className">;

/**
 * @name Radio
 * @version 1.1.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @description 부모 컴포넌트가 클라이언트 컴포넌트이어야 합니다.
 * @property {string} name              - 라디오 그룹 동시 선택 제어
 * @property {string} value             - 양식 제출 시 서버에서 식별하기 위한 선택값
 * @property {string} labelText         - 라벨 텍스트
 * @property {boolean} checked          - 선택값
 * @property {boolean} disabled         - 비활성화 여부
 * @property {function} onChange        - 선택 시 호출 함수
 * @property {boolean} isDesktop        - 데스크톱 해상도 진입 여부
 */
export default function Radio({
  name,
  value,
  labelText,
  checked,
  disabled,
  onChange,
  isDesktop,
}: RadioProps & ResponsiveType) {
  const className = `_radio`;

  return (
    <label className={className}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <Image src={checked ? RadioCheckedIcon : RadioUncheckedIcon} alt="" width={20} height={20} />
      <Typography kind={isDesktop ? "title-small" : "body-medium"}>{labelText}</Typography>
    </label>
  );
}
