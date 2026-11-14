# cERS 프로젝트 규칙

## Next.js 버전 (레거시 유지)

cERS는 레거시 시스템이라 Next.js 15에 머뭅니다.

- Next.js 16으로 올리지 않습니다. 사용자 유형별 접근 제어는 Next.js 15의 `src/middleware.ts`로 두고, 16의 `proxy.ts`로 바꾸지 않습니다.
- `next`와 `eslint-config-next`는 같은 15.x 버전으로 맞추고, 15 계열의 보안 패치만 받습니다. Dependabot도 메이저 업데이트는 제안하지 않습니다(`.github/dependabot.yml`).
- 15 계열의 보안 패치가 더 나오지 않게 되면, 그때 사용자와 상의해 업그레이드를 계획합니다.
- 경위: v2.1.0에서 16으로 올렸다가 v2.2.0에서 되돌렸습니다(`CHANGELOG.md`).
