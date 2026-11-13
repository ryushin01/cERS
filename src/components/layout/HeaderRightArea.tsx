import { FormEvent, useState } from "react";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue, useSetAtom } from "jotai";

import { Button, IconButton } from "@components/button";
import { AccountLayer, ImageWithAuth } from "@components/common";
import { Typography } from "@components/common";
import { Drawer } from "@components/drawer";
import { Form, SearchInput } from "@components/form";
import { MEMB_GB_CD, MembGbCd } from "@constants/auth";
import { appURI } from "@constants/env";
import { AD_REGISTRATION, FI_STATUS_INQUIRY } from "@constants/path";
import { ADMIN_SEARCH_RQSTNO_KEY, BANK_SEARCH_RQSTNO_KEY } from "@constants/storage";
import { useAdjustState, useDisclosure, useLogout, useResponsive } from "@hooks";
import { LogoutIcon } from "@icons14";
import { MenuIcon } from "@icons24";
import { DownArrowIcon, UpArrowIcon } from "@icons32";
import { getProfileData, getSearchAdminRgstData, getSearchBankRgstData } from "@services/home";
import { authAtom, toastState } from "@stores";

/**
 * @name HeaderRightArea
 * @version 1.0.1
 * @author 류창선 <ryushin0167@gmail.com>
 */

/**
 * @name membGbCd(사용자구분코드)
 * @version 1.0.0
 * @author 류창선 <ryushin0167@gmail.com>
 * 00 : 금융기관
 * 10 : 법무대리인
 * 20 : 관리자
 */

export default function HeaderRightArea() {
  const authInfo = useAtomValue(authAtom);
  const openToast = useSetAtom(toastState);
  const { isDesktop } = useResponsive();
  const [searchRqstNo, setSearchRqstNo] = useState("");
  const [imgSrc, setImgSrc] = useState("");

  const { isOpen: isDropdownOpen, open: openDropdown, close: closeDropdown } = useDisclosure();

  const { isOpen: isDrawerOpen, open: openDrawer, close: closeDrawer } = useDisclosure();

  const { isOpen: isModalOpen, open: openModal, close: closeModal } = useDisclosure();

  // 사용자 구분 코드 (00 : 금융기관 / 10 : 법무 대리인 / 20 : 관리자)
  const level: MembGbCd = authInfo.membGbCd as MembGbCd;

  /* 로그아웃 */
  const handleLogout = useLogout({ toastPosition: isDesktop ? "top" : "bottom" });

  /* 프로필 조회 api 호출 */
  const { data: profileData, isLoading: profileDataLoading } = useQuery({
    queryKey: ["search-profile"],
    queryFn: async () => await getProfileData(),
    select: (response) => response.data,
    enabled: authInfo?.membGbCd === MEMB_GB_CD.FINANCIAL, // 금융기관일때만 프로필 조회
  });

  /* 금융기관 의뢰번호 조회 api 호출 */
  const { refetch: getSearchBnkRqstNo } = useQuery({
    queryKey: ["search-bank-rgstr", searchRqstNo],
    queryFn: async () => {
      const response = await getSearchBankRgstData(searchRqstNo);
      if (response.data) {
        handleSearchSuccess(FI_STATUS_INQUIRY);
      } else {
        handleSearchFail();
      }
      return response;
    },
    select: (response) => response,
    enabled: false,
  });

  /* 관리자 의뢰번호 조회 api 호출 */
  const { refetch: getSearchAdmRqstNo } = useQuery({
    queryKey: ["search-admin-rgstr", searchRqstNo],
    queryFn: async () => {
      const response = await getSearchAdminRgstData(searchRqstNo);
      if (response.data) {
        handleSearchSuccess(AD_REGISTRATION);
      } else {
        handleSearchFail();
      }

      return response;
    },
    select: (response) => response,
    enabled: false,
  });

  const handleSearchFail = () => {
    openToast({
      message: "검색결과가 없습니다. 의뢰번호를 다시 확인해 주세요.",
      position: "top",
    });
  };

  const handleSearchSuccess = (movePath: string) => {
    if (movePath === FI_STATUS_INQUIRY) {
      sessionStorage.setItem(BANK_SEARCH_RQSTNO_KEY, searchRqstNo);
    } else if (movePath === AD_REGISTRATION) {
      sessionStorage.setItem(ADMIN_SEARCH_RQSTNO_KEY, searchRqstNo);
    }
    // 목록 화면이 처음 열릴 때 위에 저장한 번호를 읽으므로, 같은 화면에서도 새로 열리도록 전체를 다시 불러옵니다.
    window.location.href = `${movePath}`;
  };

  useAdjustState([profileData], () => {
    if (profileData) {
      setImgSrc(profileData?.imgData[0]?.src);
    }
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleSearch();
  };

  const handleSearch = () => {
    if (!searchRqstNo) return;

    // 접속한 멤버가 금융기관일때 의뢰번호 조회 api 호출
    if (authInfo.membGbCd === MEMB_GB_CD.FINANCIAL) {
      getSearchBnkRqstNo();
    }
    // 접속한 멤버가 관리자일때 의뢰번호 조회 api 호출
    else if (authInfo.membGbCd === MEMB_GB_CD.ADMIN) {
      getSearchAdmRqstNo();
    }
  };

  return (
    <div className="_header-right-area">
      {/* NOTE: 금융기관, 관리자 공통 */}
      {level !== MEMB_GB_CD.LAWYER && (
        <Form
          onSubmit={(e) => {
            handleSubmit(e);
          }}
          onChange={() => {}}
          legendText="의뢰번호 검색"
          isHiddenLegend={true}
        >
          <SearchInput
            name="search"
            shape="xl"
            onChange={(e) => setSearchRqstNo(e.target.value.trim())}
          />
        </Form>
      )}

      {isDesktop && (
        <>
          {/* profileData : 회원명 */}
          {/* NOTE: 금융기관 */}
          {level === MEMB_GB_CD.FINANCIAL && (
            <button
              type="button"
              onClick={isDesktop ? openDropdown : openDrawer}
              className="flex gap-x-1"
              aria-expanded={isDropdownOpen}
            >
              {!profileDataLoading && (
                <ImageWithAuth
                  src={imgSrc ? `${appURI}/api${imgSrc}` : ""}
                  alt={`${authInfo.membNm} 프로필 이미지`}
                  width={28}
                  height={28}
                />
              )}
              <Typography kind={"title-small"}>{authInfo.membNm}</Typography>
            </button>
          )}

          {/* NOTE: 법무대리인 */}
          {level === MEMB_GB_CD.LAWYER && (
            <>
              <Button
                shape="none"
                size="md"
                color="grayscale"
                icon={
                  <Image
                    src={isDropdownOpen ? UpArrowIcon : DownArrowIcon}
                    alt=""
                    width={32}
                    height={32}
                  />
                }
                iconPosition="right"
                onClick={openDropdown}
                isExpanded={isDropdownOpen}
              >
                {!!authInfo ? authInfo.membNm : ""}
              </Button>
            </>
          )}

          {/* NOTE: 관리자 */}
          {level === MEMB_GB_CD.ADMIN && (
            <>
              <span> {!!authInfo ? authInfo.membNm : ""}</span>
              <div className="w-[103px]">
                <Button
                  shape="outline"
                  size="sm"
                  color="grayscale"
                  icon={<Image src={LogoutIcon} alt="" width={14} height={14} />}
                  iconPosition="right"
                  onClick={handleLogout}
                >
                  로그아웃
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {!isDesktop && (
        <IconButton
          size="md"
          onClick={openDrawer}
          icon={<Image src={MenuIcon} alt="" width={24} height={24} />}
        >
          계정 메뉴 열기
        </IconButton>
      )}

      {isDesktop && isDropdownOpen && (
        <AccountLayer
          level={level}
          onClose={closeDropdown}
          isModalOpen={isModalOpen}
          openModal={openModal}
          closeModal={closeModal}
          profileData={!!authInfo ? authInfo.membNm : ""}
          imgSrc={imgSrc!}
        />
      )}

      {!isDesktop && isDrawerOpen && (
        <Drawer
          level={level}
          onClose={closeDrawer}
          isModalOpen={isModalOpen}
          openModal={openModal}
          closeModal={closeModal}
          profileData={!!authInfo ? authInfo.membNm : ""}
          imgSrc={imgSrc!}
        />
      )}
    </div>
  );
}
