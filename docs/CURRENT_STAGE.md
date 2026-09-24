# 현재 상태와 보관 결정

> 기준일: 2026-09-25 · 게임 기획 v0.7 · 기술/UI 계약 t0.3
>
> 상태: **개발 중단 및 보관 정리**. 향후 개발할 계획은 없음. 아래 재개 계획은 참고 자료임.

## 한눈에 보기

| 영역 | 현재 확인된 상태 |
| --- | --- |
| 게임 기획 | v0.7 여섯 기준 문서, 맵 Excel, 결정 기록 보존. 최종 게임명·도시 설정·최종 아트는 미결정 |
| 로컬 훈련판 | Next.js 16.3.2, React 19.2.8, React Three Fiber 9.7.0 기반 Phase 0B-5 slice 구현 |
| 게임 규칙 코드 | 결정적 seed, 16×16 맵·경로, 일반·배신자 명령, 이동·행동·경제·목표·승패의 순수 로컬 판정 slice |
| 화면 흐름 | 지도 직접 명단 은닉 → 50초 일반 명령 → 10초 배신자 명령 → 3D 수행 → 우측 카드 결과 5초 → 다음 턴 |
| 배포 대상 | 공개 GitHub 저장소의 main → Actions → GitHub Pages. https://nvunwoo.github.io/Project-Spy/ 게시·접속 확인 |
| 실전 멀티플레이 | 서버 권위 API, 영속 저장, 2인 연결·동기화, 비밀 정보의 서버 보관은 미구현 |
| 외부 서비스 | Vercel 팀에 Project-Spy 프로젝트 없음 확인. Supabase Endurance Games 조직의 Project-Spy 프로젝트 영구 삭제 후 프로젝트 목록 0개 확인 |

과거 문서의 PHASE 0B IN PROGRESS, Vercel·Supabase 준비 계획, 다음 개발 작업 지시는 **이전 시점의 기록**입니다. 2026-09-25 보관 결정이 현재 운영 상태입니다. 이전 원문은 [스냅샷](archive/2026-09-25/)에 남깁니다.

## 무엇을 실제로 검증했나

2026-09-25 정리 중 lint, typecheck, format, source boundary 44개, Vitest 14파일·80테스트, GitHub Pages 경로를 넣은 Next 정적 production build가 통과했습니다. Playwright는 desktop, Galaxy Tab S9+ **모의 viewport**, compact tablet 모의 viewport, 세로 차단에서 **11 passed / 의도된 17 skipped**로 끝났습니다. 첫 14-worker 실행은 완료 전에 중단하고 2-worker로 다시 실행해 위 결과를 얻었습니다. 사용자 PC·태블릿의 포인터·터치 조작 확인 기록은 있으나 물리 Galaxy Tab S9+의 모델·OS·Chrome·S Pen·성능 수치를 갖춘 정식 실기기 검증은 없습니다.

GitHub Pages가 열리더라도 그 결과는 **정적 배포의 브라우저 동작**만 증명합니다. 동시 접속한 두 사용자의 게임, 서버 판정, 비밀 정보 보호, 계정 복구를 증명하지 않습니다. 로컬 훈련판에는 연습 상대를 재현하기 위한 전체 fixture가 브라우저 번들에 들어갑니다.

2026-09-25 [GitHub Pages 배포 실행](https://github.com/nvunwoo/Project-Spy/actions/runs/36030110491)이 성공했습니다. 게시된 URL을 직접 열어 로비 → 훈련 시작 → 3D 지도 → 은닉 건물 선택·확정 → 50초 일반 명령 진입을 확인했고, 브라우저 오류 로그는 0건이었습니다. 1280×800 가로 브라우저 뷰포트 확인이며 물리 태블릿 검증은 아닙니다.

## 로컬에서 재현하기

1. Node.js 24.x와 pnpm 11.22.0을 설치합니다.
2. 저장소에서 pnpm install --frozen-lockfile을 실행합니다.
3. pnpm dev --hostname 127.0.0.1 --port 3100을 실행합니다.
4. 브라우저에서 http://127.0.0.1:3100/을 엽니다.

검증 명령: pnpm lint, pnpm typecheck, pnpm test, pnpm check:boundaries, pnpm build, pnpm test:e2e. GitHub Pages용 정적 출력은 GITHUB_PAGES=true 환경에서 pnpm build를 실행하면 out 폴더에 생성됩니다. 빌드 출력·node_modules·비밀 환경 파일은 업로드 대상이 아니며 소스와 잠금 파일로 재생성합니다.

## 정리 완료 확인

- [x] 로컬 변경과 문서·코드·Excel·참고 자료를 main에 업로드하고 원격 파일·커밋 확인
- [x] main 이외의 로컬·원격 브랜치 0개 확인
- [x] GitHub Pages 실제 URL과 1280×800 가로 브라우저 플레이 진입 확인
- [x] Vercel 연결 팀에서 Project-Spy 프로젝트가 없음을 읽기 전용으로 확인
- [x] Supabase Project-Spy 삭제 및 조직·커넥터 목록에서 제거 확인
- [x] 스테이징된 업로드 파일에 비밀값 패턴·생성 캐시가 없음을 확인

위 항목이 모두 검증되기 전에는 컴퓨터의 로컬 프로젝트를 삭제하지 않습니다. 로컬 삭제는 사용자가 모든 원격 보관 결과를 확인한 뒤 수행하는 마지막 단계입니다.
