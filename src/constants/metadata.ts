export const TITLE = "전자등기 관리 시스템";

export const DESCRIPTION =
  "부동산 전자등기 의뢰부터 처리 현황 조회까지, 온라인으로 한눈에 쉽고 빠르게 관리하세요.";

export const FAVICON = "/logo.svg";

export const OG_IMAGE = "/og_image.png";

/*
 * 공유 미리보기(OG) 이미지 등 절대 URL 생성 기준 주소. 다른 주소에 배포하면 NEXT_PUBLIC_SITE_URL로 지정합니다.
 * 기본값을 localhost로 두면 운영의 og:image가 localhost를 가리켜 메신저·SNS가 미리보기 그림을 받지 못하므로 운영 주소로 둡니다.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ers-ryushin01.vercel.app";

export const FI_HOME_METADATA = {
  TITLE: "홈 - 전자등기 관리 시스템",
  DESCRIPTION: "홈 페이지",
};

export const FI_NOTICE_METADATA = {
  TITLE: "공지사항 - 전자등기 관리 시스템",
  DESCRIPTION: "공지사항 페이지",
};

export const FI_REQUEST_LIST_METADATA = {
  TITLE: "의뢰목록 - 전자등기 관리 시스템",
  DESCRIPTION: "의뢰목록 페이지",
};

export const FI_REQUEST_METADATA = {
  TITLE: "전자등기 의뢰 - 전자등기 관리 시스템",
  DESCRIPTION: "전자등기 의뢰 페이지",
};

export const FI_STATUS_INQUIRY_METADATA = {
  TITLE: "현황조회 - 전자등기 관리 시스템",
  DESCRIPTION: "현황조회 페이지",
};

export const AD_ASSIGN_METADATA = {
  TITLE: "배정관리 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "배정관리 페이지",
};

export const AD_REGISTRATION_METADATA = {
  TITLE: "등기관리 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "등기관리 페이지",
};

export const AD_AUDIT_METADATA = {
  TITLE: "감사기록 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "누가 언제 무엇을 바꿨는지 조회하는 감사기록 페이지",
};

export const AD_MEMBER_METADATA = {
  TITLE: "회원관리 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "회원관리 페이지",
};

export const AD_NOTICE_METADATA = {
  TITLE: "공지관리 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "공지관리 페이지",
};

export const AD_ASSIGN_CREATE_METADATA = {
  TITLE: "전자등기 신규등록 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "전자등기 신규등록 페이지",
};

export const AD_ASSIGN_DETAIL_METADATA = {
  TITLE: "전자등기 배정 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "전자등기 배정 페이지",
};

export const AD_REGISTRATION_ACCEPTANCE_METADATA = {
  TITLE: "등기접수증 승인 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "등기접수증 승인 페이지",
};

export const AD_REGISTRATION_DETAIL_METADATA = {
  TITLE: "등기관리 상세 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "등기관리 상세 페이지",
};

export const AD_MEMBER_CREATE_METADATA = {
  TITLE: "회원 등록 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "회원 등록 페이지",
};

export const AD_MEMBER_DETAIL_METADATA = {
  TITLE: "회원관리 상세 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "회원관리 상세 페이지",
};

export const AD_NOTICE_CREATE_METADATA = {
  TITLE: "공지사항 등록 - 전자등기 관리 시스템 어드민",
  DESCRIPTION: "공지사항 등록 페이지",
};
