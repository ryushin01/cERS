"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Typography } from "@components/common";
import { AD_PATH } from "@constants/path";
import { RightArrowIcon } from "@icons14";
import { isPathUnder } from "@utils/pathUtil";

import "@styles/breadcrumb.css";

type PathListProps = {
  [key: string]: string;
};

const FI_PATH_LIST: PathListProps = {
  home: "홈",
  notice: "공지사항",
  "request-list": "의뢰목록",
  request: "전자등기 의뢰",
};

const AD_PATH_LIST: PathListProps = {
  assign: "배정관리",
  "assign-create": "전자등기 신규등록",
  "assign-detail": "전자등기 배정",
  registration: "등기관리",
  "registration-detail": "등기관리 상세",
  "registration-acceptance": "등기접수증 승인",
  member: "회원관리",
  "member-detail": "회원관리 상세",
  "member-create": "회원등록",
  notice: "공지사항",
  "notice-create": "공지사항 등록",
};

/**
 * @name Breadcrumb
 * @version 1.2.0
 * @author 류창선 <ryushin0167@gmail.com>
 */
export default function Breadcrumb() {
  const pathname = usePathname();
  const location = pathname.split("/").slice(1, 3).join("/");
  const pathArray = pathname.split("/").slice(2);

  if (pathArray.length > 2) {
    pathArray.pop();
  }

  return (
    <ol className="_breadcrumb">
      {pathArray.map((path, index) => {
        return (
          <li key={path}>
            <Link href={pathArray.length - 1 !== index ? `/${location}` : ""}>
              <Image src={RightArrowIcon} alt="" width={14} height={14} />
              <Typography kind="body-medium">
                {isPathUnder(pathname, AD_PATH) ? AD_PATH_LIST[path] : FI_PATH_LIST[path]}
              </Typography>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
