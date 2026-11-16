import { ReactNode } from "react";

import { Typography } from "@components/common";

import "@styles/button.css";

type ButtonProps = {
  type?: "button" | "submit" | "reset";
  shape: "solid" | "outline" | "none";
  size: "sm" | "md" | "lg";
  color: "main100" | "main70" | "main60" | "main5" | "grayscale" | "bluegray";
  icon?: ReactNode;
  iconPosition?: "left" | "right";
  onClick?: () => void;
  children?: string;
  disabled?: boolean;
  isPressed?: boolean;
  isExpanded?: boolean;
  id?: string;
};

/**
 * @name Button
 * @version 1.2.0
 * @author 류창선 <ryushin0167@gmail.com>
 * @property {string} type           - 버튼 타입을 정의합니다.
 * @property {string} shape          - 버튼 쉐입을 정의합니다.
 * @property {string} size           - 버튼 크기를 정의합니다.
 * @property {string} color          - 버튼 색상을 정의합니다.
 * @property {string} icon           - 버튼의 아이콘을 정의합니다.
 * @property {string} iconPosition   - 버튼의 아이콘 위치를 정의합니다.
 * @property {function} onClick      - 버튼 클릭 시 동작을 위해 정의합니다.
 * @property {boolean} disabled      - 버튼의 비활성화 상태를 정의합니다.
 * @property {boolean} isPressed     - 버튼 그룹에서 선택된(눌린) 버튼 표시 (aria-pressed)
 * @property {boolean} isExpanded    - 메뉴를 여는 버튼의 열림 상태 (aria-expanded)
 */

export default function Button({
  type = "button",
  shape,
  color,
  size,
  icon,
  iconPosition,
  onClick,
  children = "",
  disabled = false,
  isPressed,
  isExpanded,
  id,
}: ButtonProps) {
  let buttonSize = "";
  let solidButtonColor = "";
  let solidButtonActionColor = "";
  let outlineButtonActionColor = "";
  let outlineButtonColor = "";
  const isSolid = shape === "solid";
  const isNone = shape === "none";

  /* 버튼 size switch */
  switch (size) {
    case "sm":
      buttonSize = "py-2";
      break;
    case "md":
      buttonSize = "py-3";
      break;
    case "lg":
      buttonSize = "py-4";
      break;
    default:
      buttonSize = "py-2";
  }

  /* 솔리드 버튼 color switch */
  switch (color) {
    case "main100":
      solidButtonColor = "bg-ers-main-100 text-ers-grayscale-0";
      break;
    case "main70":
      solidButtonColor = "bg-ers-main-70 text-ers-grayscale-0";
      break;
    case "main60":
      solidButtonColor = "bg-ers-main-60 text-ers-grayscale-0";
      break;
    case "main5":
      solidButtonColor = "bg-ers-main-5 text-ers-main-100";
      break;
    case "grayscale":
      solidButtonColor = "bg-ers-grayscale-80 text-ers-grayscale-0";
      break;
    case "bluegray":
      solidButtonColor = "bg-ers-secondary-bluegray-50 text-ers-grayscale-0";
      break;
    default:
      solidButtonColor = "bg-ers-main-100 text-ers-grayscale-0";
  }

  /* 솔리드 버튼 호버 color switch */
  switch (color) {
    case "main100":
      solidButtonActionColor =
        "hover:bg-ers-main-90 text-ers-grayscale-0 focus:bg-ers-main-70 text-ers-grayscale-0 active:bg-ers-main-70 text-ers-grayscale-0";
      break;
    case "main60":
      solidButtonActionColor =
        "hover:bg-ers-main-50 text-ers-grayscale-0 focus:bg-ers-main-40 text-ers-grayscale-0 active:bg-ers-main-40 text-ers-grayscale-0";
      break;
    case "main5":
      solidButtonActionColor =
        "hover:bg-ers-main-15 text-ers-main-100 focus:bg-ers-main-30 text-ers-main-100 active:bg-ers-main-30 text-ers-main-100";
      break;
    case "grayscale":
      solidButtonActionColor =
        "hover:bg-ers-grayscale-90 text-ers-grayscale-0 focus:bg-ers-grayscale-90 text-ers-grayscale-0 active:bg-ers-grayscale-90 text-ers-grayscale-0";
      break;
    default:
      solidButtonActionColor =
        "hover:bg-ers-main-90 text-ers-grayscale-0 focus:bg-ers-main-70 text-ers-grayscale-0 active:bg-ers-main-70 text-ers-grayscale-0";
  }

  /* 아웃라인버튼 color switch */
  switch (color) {
    case "main5":
      outlineButtonColor = "bg-ers-main-5 border border-ers-main-100 text-ers-main-100";
      break;
    case "grayscale":
      outlineButtonColor =
        "bg-ers-grayscale-0 border border-ers-grayscale-40 text-ers-grayscale-90";
      break;
    default:
      outlineButtonColor =
        "bg-ers-grayscale-0 border border-ers-grayscale-40 text-ers-grayscale-90";
  }

  /* 아웃라인 버튼 호버 color switch */
  switch (color) {
    case "main5":
      outlineButtonActionColor =
        "hover:bg-ers-main-15 border-ers-main-100 text-ers-main-100 focus:bg-ers-main-30 border-ers-main-100 text-ers-main-100 active:bg-ers-main-30 border-ers-main-100 text-ers-main-100";
      break;
    case "grayscale":
      outlineButtonActionColor =
        "hover:bg-ers-grayscale-10 border-grayscale-40 text-grayscale-90 focus:bg-ers-grayscale-20 border-ers-grayscale-40 text-grayscale-90 active:bg-grayscale-20 border-grayscale-40 text-ers-grayscale-90";
      break;
    default:
      outlineButtonActionColor =
        "hover:bg-ers-grayscale-10 border-grayscale-40 text-grayscale-90 focus:bg-ers-grayscale-20 border-ers-grayscale-40 text-grayscale-90 active:bg-grayscale-20 border-grayscale-40 text-ers-grayscale-90";
  }

  /* 보더 radius */
  const borderRadius = size === "md" || size === "lg" ? "rounded-lg" : "rounded-md";

  const className = `_text-button ${buttonSize} ${
    disabled
      ? "_disabled"
      : isNone
        ? "bg-ers-grayscale-0 border-none outline-none text-ers-grayscale-90 hover:bg-ers-grayscale-10 text-ers-grayscale-90 focus:bg-ers-grayscale-20 text-ers-grayscale-90 active:bg-ers-grayscale-20 text-ers-grayscale-90"
        : isSolid
          ? `${solidButtonColor}`
          : `${outlineButtonColor}`
  }  ${borderRadius} ${
    disabled ? "" : isSolid ? solidButtonActionColor : outlineButtonActionColor
  }`;

  return (
    <button
      id={id}
      className={className}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={isPressed}
      aria-expanded={isExpanded}
    >
      {icon && iconPosition === "left" && <span className="pr-1">{icon}</span>}
      <Typography
        kind={size === "sm" ? "body-medium" : size === "md" ? "title-small" : "title-medium"}
      >
        {children}
      </Typography>
      {icon && iconPosition === "right" && <span className="pl-1">{icon}</span>}
    </button>
  );
}
