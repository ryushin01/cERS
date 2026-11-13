# CI · Docker

### CI (GitHub Actions)

`main`에 푸시하거나 PR을 올리면 `.github/workflows/ci.yml`이 실행됩니다.

| 작업 | 내용 |
|---|---|
| Lint · Typecheck · Test · Storybook test · Build · E2E | `.nvmrc`의 Node 22와 `packageManager`의 pnpm으로 lint, 서식 검사, 타입 검사, 단위 테스트, 스토리 테스트(Chromium, 접근성 검사), 빌드(Storybook 포함), E2E 테스트. E2E가 실패하면 스크린샷과 기록을 아티팩트로 올립니다. |
| Docker image | 운영용 Dockerfile로 이미지를 빌드하고, 컨테이너를 실행해 3000번 포트의 앱과 `/storybook/index.html` 응답 확인 |

### 의존성 자동 업데이트 (Dependabot)

기존 스택(메이저 버전)을 유지하면서 보안·버그 수정만 받습니다. 설정은 `.github/dependabot.yml`입니다.

| 대상 | 주기 | 내용 |
|---|---|---|
| npm(pnpm) | 매주 월요일 09:00 | 같은 메이저 안의 패치·마이너만, 운영 의존성과 개발 도구를 각각 한 PR로 묶어서 제안 |
| GitHub Actions | 매월 | CI에서 쓰는 액션의 패치·마이너 |

- 메이저 업그레이드는 제안하지 않습니다. 필요할 때 직접 계획해서 진행합니다.
- 출시 후 14일이 지난 버전만 제안합니다.
- `@types/node`는 실행 환경(Node 22)과 같은 22.x로 유지합니다.
- 정확한 버전으로 고정한 `next`·`axios`도 같은 메이저 안의 새 버전이 나오면 제안됩니다.
- PR마다 CI가 실행되므로 통과한 PR만 합칩니다.

### Docker

```bash
// 개발 환경 이미지 (3333번 포트)
docker compose -f docker/development/docker-compose.yml up --build

// 운영 환경 이미지 (3000번 포트, Storybook은 /storybook)
docker compose -f docker/production/docker-compose.yml up --build
```

> 베이스 이미지는 `node:22-alpine`입니다(`.nvmrc`와 같은 Node 22 LTS).
> Dockerfile은 빌드 시 `.env.development` / `.env.production`을 복사하므로, Docker로 빌드하려면 해당 파일을 먼저 만들어야 합니다(데모 모드는 빈 파일이면 됩니다). 컨테이너는 standalone 빌드 결과물을 `node server.js`로 실행합니다.

## Vercel 데모

Vercel 프로젝트 `ers`에 저장소가 연결되어 있어 `main`에 푸시하면 자동으로 운영 배포됩니다. 하루 배포 한도를 아끼려고 PR 미리보기 배포는 껐습니다(`vercel.json`의 `git.deploymentEnabled`). 데모 모드가 기본이라 환경 변수는 필요 없습니다.
