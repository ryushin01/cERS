import remarkGfm from "remark-gfm";

import type { StorybookConfig } from "@storybook/nextjs-vite";

/**
 * Storybook 설정
 * - 빌드 결과물은 public/storybook에 생성되어 Next.js 앱과 함께 /storybook 경로로 배포됩니다.
 * - public 전체를 staticDirs로 지정하면 빌드 결과물(public/storybook)이 다시 복사되므로, 필요한 폴더만 지정합니다.
 */
const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(ts|tsx)"],
  addons: [
    {
      name: "@storybook/addon-docs",
      // MDX는 기본적으로 표 문법(GFM)을 해석하지 못하므로 remark-gfm을 연결합니다.
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  framework: {
    name: "@storybook/nextjs-vite",
    options: {},
  },
  staticDirs: [
    { from: "../public/logo.svg", to: "/favicon.svg" },
    // Pretendard 글꼴(가변 글꼴 동적 서브셋)을 CDN 대신 함께 배포합니다. preview-head·manager-head가 불러옵니다.
    {
      from: "../node_modules/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css",
      to: "/fonts/pretendard/pretendardvariable-dynamic-subset.css",
    },
    {
      from: "../node_modules/pretendard/dist/web/variable/woff2-dynamic-subset",
      to: "/fonts/pretendard/woff2-dynamic-subset",
    },
  ],
  core: {
    disableTelemetry: true,
  },
  // 라이브러리·컴포넌트의 "use client" 지시어는 Next.js 전용이라 Vite가 경고만 남기고 무시합니다. 빌드 로그를 가리지 않도록 숨깁니다.
  viteFinal: async (viteConfig) => {
    const onwarn = viteConfig.build?.rollupOptions?.onwarn;
    viteConfig.build = {
      ...viteConfig.build,
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        ...viteConfig.build?.rollupOptions,
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE" || warning.code === "SOURCEMAP_ERROR")
            return;
          if (onwarn) onwarn(warning, warn);
          else warn(warning);
        },
      },
    };
    return viteConfig;
  },
};

export default config;
