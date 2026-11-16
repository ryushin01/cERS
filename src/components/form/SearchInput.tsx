import { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from "react";
import Image from "next/image";

import { SEARCH_INPUT } from "@constants/input";
import { useResponsive } from "@hooks";
import { searchIcon } from "@icons";

import "@styles/input.css";

type SearchInputProps = {
  shape?: "lg" | "xl";
  required?: boolean;
  disabled?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onClick?: () => void;
  onBlur?: (event: ChangeEvent<HTMLInputElement>) => void;
  name: string;
  defaultValue?: string;
} & Omit<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>, "className">;

/**
 * @name SearchInput
 * @version 1.0.1
 * @author 류창선 <ryushin0167@gmail.com>
 * @property {string} shape        - 인풋의 쉐입을 정의합니다.
 * @property {boolean} required    - 인풋의 필수 여부를 정의합니다.
 * @property {boolean} disabled    - 인풋의 비활성화 상태를 정의합니다.
 * @property {function} onChange   - 인풋 작성시 포커스시 동작을 위해 정의합니다.
 * @property {function} onFocus    - 인풋 포커스시 동작을 위해 정의합니다.
 * @property {function} onBlur     - 인풋 포커스 해제시 포커스시 동작을 위해 정의합니다.
 * @property {string} placeholder  - 인풋의 힌트 텍스트를 정의합니다.
 * @property {boolean} isFocus     - 인풋의 포커스 상태를 정의합니다.
 * @property {string} name         - 인풋의 이름을 정의합니다.
 * @property {string} defaultValue - 인풋에 입력된 값을 정의합니다.
 * @property {function} onClick    - 버튼 클릭 시 동작을 위해 정의합니다.
 */

export default function SearchInput({
  shape = "xl",
  required = false,
  disabled,
  onClick,
  onChange,
  onBlur,
  name,
  defaultValue,
  ...props
}: SearchInputProps) {
  const { isDesktop } = useResponsive();
  const className = `_search-input-label _text-input ${
    isDesktop ? "text-[16px]" : "text-[14px]"
  } ${shape === "lg" ? "rounded-lg" : "rounded-3xl"}`;

  return (
    <div className={className}>
      <input
        type="search"
        required={required}
        disabled={disabled}
        placeholder={SEARCH_INPUT.placeHolder}
        aria-label={SEARCH_INPUT.placeHolder}
        className="bg-transparent outline-none"
        name={name}
        onChange={onChange}
        onBlur={onBlur}
        defaultValue={defaultValue}
        {...props}
      />
      <button
        onClick={onClick}
        type="submit"
        className="_flex-center"
        style={{ width: 32, height: 32 }}
        aria-label="검색"
      >
        <Image src={searchIcon} alt="" width={20} height={20} />
      </button>
    </div>
  );
}
