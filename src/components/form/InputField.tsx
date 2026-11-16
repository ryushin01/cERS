import { ChangeEvent, InputHTMLAttributes, useId, useState } from "react";
import Image from "next/image";

import { EyeIcon, EyeOffIcon } from "@icons20";

import ErrorMessage from "./ErrorMessage";
import Input from "./Input";
import InputMessage from "./InputMessage";
import Label from "./Label";

type InputFieldProps = {
  htmlFor?: string;
  labelText?: string;
  isError?: boolean;
  type?: "text" | "password" | "tel" | "number";
  shape?: "lg" | "xl";
  disabled?: boolean;
  required?: boolean;
  onClick?: () => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  onBlur?: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  name: string;
  defaultValue?: string;
  value?: string;
  inputMessage?: string;
  errorMessage?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  hasButton?: boolean;
  inputSize?: "sm" | "md" | "lg";
  className?: string;
  readOnly?: boolean;
  /* 화면에 보이는 라벨과 연결되지 않을 때 스크린 리더가 읽을 이름 */
  ariaLabel?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "size">;

/**
 * @name InputField
 * @version 1.0.1
 * @author 류창선 <ryushin0167@gmail.com>
 * @property {string} htmlFor      - 인풋 id와 매치 시키는 라벨 속성을 정의합니다.
 * @property {string} labelText    - 라벨의 텍스트 내용을 정의합니다.
 * @property {boolean} isError     - 라벨과 인풋의 에러 상태를 정의합니다.
 * @property {string} type         - 인풋 타입을 정의합니다. (기본 = "number")
 * @property {string} shape        - 인풋의 쉐입을 정의합니다.
 * @property {boolean} required    - 라벨과 인풋의 필수 표시 여부를 정의합니다.
 * @property {boolean} disabled    - 인풋의 비활성화 상태를 정의합니다.
 * @property {function} onChange   - 인풋 작성시 실행할 함수를 위해 미리 정의합니다.
 * @property {function} onClick    - 인풋 클릭 시 실행할 함수를 위해 미리 정의합니다.
 * @property {string} placeholder  - 인풋의 힌트 텍스트를 정의합니다.
 * @property {string} name         - 인풋의 이름을 정의합니다.
 * @property {string} inputMessage - 포커스시 인풋 하단 텍스트 내용을 정의합니다.
 * @property {string} errorMessage - 에러 시 인풋 하단 텍스트 내용을 정의합니다.
 * @property {string} inputSize    - 인풋 크기를 정의합니다.
 * @property {string} className    - 스타일을 추가할 때 사용할 클래스명을 정의합니다.
 * @property {boolean} readOnly    - 인풋의 리드은리 상태를 정의합니다.
 */
export default function InputField({
  htmlFor,
  labelText,
  isError,
  type,
  shape,
  inputSize = "sm",
  required,
  disabled,
  onChange,
  onFocus,
  onBlur,
  placeholder,
  name,
  defaultValue,
  value,
  inputMessage = "",
  errorMessage = "",
  icon,
  iconPosition,
  hasButton = false,
  readOnly = false,
  className,
  ariaLabel,
}: // ref,
InputFieldProps) {
  const [coreValue, setCoreValue] = useState(defaultValue);
  const [isHideText, setIsHideText] = useState(true);
  const hasIcon = icon ? true : false; // icon 있으면 true 없으면 false

  /* inputField 분기처리
  1. type password - 텍스트 + 아이콘 (토글아이콘 및 아이콘으로 type password -> text로 변경)
  2. hasbutton - 텍스트 + 버튼 (reset)
  3. hasicon - 텍스트 + 아이콘(버튼아님) || 텍스트
  */

  const messageId = useId();
  const hasMessage = isError ? !!errorMessage : !!inputMessage;

  let setSize = "";
  switch (inputSize) {
    case "sm":
      setSize = "py-2 text-[14px]";
      break;
    case "md":
      setSize = "py-3 text-[16px]";
      break;
    case "lg":
      setSize = "py-4 text-[18px]";
      break;
    default:
      setSize = "py-2 text-[14px]";
  }

  // labelText & htmlFor 유무 | type=password css 컨트롤
  const inputWithLabelText =
    type === "password"
      ? `_password-input ${setSize} ${isError ? "_error" : ""} ${className}`
      : `_no-password-input _label-text-input ${setSize} ${
          readOnly ? "_read-only" : ""
        } ${isError ? "_error" : ""}  ${className}`;

  return type === "password" ? (
    <>
      <Label
        htmlFor={htmlFor}
        required={required}
        labelText={labelText}
        isPassword={true}
        isError={isError}
        styleClass={`_password-label my-1`}
      >
        <span className={inputWithLabelText}>
          <Input
            aria-invalid={isError || undefined}
            aria-describedby={hasMessage ? messageId : undefined}
            aria-label={ariaLabel}
            id={htmlFor}
            type={isHideText ? "password" : "text"}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={disabled}
            required={required}
            name={name}
            shape={shape}
            isError={isError}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            defaultValue={defaultValue!}
            value={value}
          />
          <button
            disabled={disabled}
            onClick={() => {
              setIsHideText(!isHideText);
            }}
            type="button"
            className="_flex-center"
            aria-label={isHideText ? "비밀번호 보기" : "비밀번호 숨기기"}
          >
            {<Image src={isHideText ? EyeOffIcon : EyeIcon} alt="" width={20} height={20} />}
          </button>
        </span>
      </Label>
      {isError ? (
        <ErrorMessage id={messageId}>{errorMessage}</ErrorMessage>
      ) : inputMessage ? (
        <InputMessage id={messageId}>{inputMessage}</InputMessage>
      ) : (
        ""
      )}
    </>
  ) : hasButton ? (
    <Label
      htmlFor={htmlFor}
      required={required}
      labelText={labelText}
      hasIcon={hasButton}
      isError={isError}
    >
      <span className={inputWithLabelText}>
        <Input
          aria-invalid={isError || undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          aria-label={ariaLabel}
          id={htmlFor}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          name={name}
          shape={shape}
          isError={isError}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          defaultValue={coreValue!}
          value={value}
        />
        <button
          onClick={() => setCoreValue("")}
          type="reset"
          className="_flex-center"
          style={{ width: 20, height: 20 }}
        >
          {icon}
        </button>
      </span>
      {isError ? (
        <ErrorMessage id={messageId}>{errorMessage}</ErrorMessage>
      ) : inputMessage ? (
        <InputMessage id={messageId}>{inputMessage}</InputMessage>
      ) : (
        ""
      )}
    </Label>
  ) : (
    <Label
      htmlFor={htmlFor}
      required={required}
      labelText={labelText}
      hasIcon={hasIcon}
      isError={isError}
    >
      <span className={inputWithLabelText}>
        {icon && iconPosition === "left" && <span className="pr-2">{icon}</span>}
        <Input
          aria-invalid={isError || undefined}
          aria-describedby={hasMessage ? messageId : undefined}
          aria-label={ariaLabel}
          id={htmlFor}
          type={type}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          name={name}
          shape={shape}
          isError={isError}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          defaultValue={defaultValue!}
          value={value}
        />
        {icon && iconPosition === "right" && <span className="pl-2">{icon}</span>}
      </span>
      {isError ? (
        <ErrorMessage id={messageId}>{errorMessage}</ErrorMessage>
      ) : inputMessage ? (
        <InputMessage id={messageId}>{inputMessage}</InputMessage>
      ) : (
        ""
      )}
    </Label>
  );
}
