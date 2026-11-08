import { addons } from "storybook/manager-api";
import { create } from "storybook/theming";

/* Storybook 화면(사이드바·툴바)을 cERS 브랜드 색상과 로고로 맞춥니다. */
addons.setConfig({
  theme: create({
    base: "light",
    brandTitle: "cERS Storybook - 전자등기 관리 시스템",
    brandUrl: "/",
    brandImage: "./icons/logo/Logo.svg",
    brandTarget: "_self",
    colorPrimary: "#113662",
    colorSecondary: "#0b56a7",
    fontBase: '"Pretendard", system-ui, sans-serif',
    appBg: "#f8f8fa",
    appBorderColor: "#ededed",
    barSelectedColor: "#113662",
  }),
});
