import { FlatCompat } from "@eslint/eslintrc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

/**
 * 내부 모듈 alias (tsconfig.json의 paths).
 * `@components`처럼 생김새가 `@tanstack/react-query` 같은 외부 scoped 패키지와 같아서,
 * 정렬 규칙에서 구분할 수 있도록 이름을 하나하나 적어 둡니다. tsconfig에 alias를 추가하면 여기에도 추가합니다.
 */
const INTERNAL_ALIASES = [
  "app",
  "common",
  "components",
  "constants",
  "fonts",
  "hooks",
  "icons\\d*",
  "logos",
  "services",
  "stores",
  "styles",
  "types",
  "utils",
];

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/storybook/**",
      "storybook-static/**",
      "test-results/**",
      "coverage/**",
      "playwright-report/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // import 순서 자동 정렬. `pnpm lint:fix`로 자동 수정되고, 커밋할 때 lint-staged가 실행합니다.
    // 순서: react → next → 외부 패키지 → 내부 alias → 상대경로 → import type → 사이드 이펙트(CSS 등)
    // 그룹 사이는 빈 줄 하나, 그룹 안과 { } 안의 이름은 알파벳순입니다.
    // 한 import가 여러 그룹에 맞으면 가장 길게 맞은 쪽으로 갑니다. 그래서 `@components`는 외부 패키지 그룹(`^@?\w`)이 아니라 내부 그룹으로 갑니다.
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": [
        "error",
        {
          groups: [
            ["^react$", "^react-dom", "^next", "^@?\\w"],
            [`^@(${INTERNAL_ALIASES.join("|")})(/|$)`, "^@/"],
            ["^\\."],
            // import type은 끝에 \u0000이 붙은 문자열로 매칭됩니다.
            ["^.*\\u0000$"],
            // 사이드 이펙트 import(CSS 등)는 앞에 \u0000이 붙습니다. 스타일 적용 순서를 위해 맨 마지막에 둡니다.
            ["^\\u0000"],
          ],
        },
      ],
      "simple-import-sort/exports": "error",
    },
  },
  // 서식 관련 ESLint 규칙을 끄는 설정이라 항상 마지막에 둡니다.
  ...compat.extends("prettier"),
];

export default eslintConfig;
