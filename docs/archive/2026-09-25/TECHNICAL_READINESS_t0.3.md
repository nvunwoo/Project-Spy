# 개발 전 기술 준비 기준

> 문서 상태: **ACTIVE — t0.3 기술 준비 단일 기준**<br>
> 기술 준비 기준: t0.3<br>
> 게임 기획 기준: v0.7<br>
> 최종 갱신: 2026-08-23<br>
> 사용자 승인 상태: **v0.7 + t0.3 USER CONFIRMED**<br>
> 소프트웨어 개발 상태: **PHASE 0B-5 — 3D COMMAND EXECUTION LOCAL VERIFIED**

이 문서는 승인된 기술 선택, 현재 로컬 구현 상태, 외부 계정 연결, 권한, 보안 경계와 검증 조건을 한곳에서 추적한다. 게임 규칙은 [문서 허브](../README.md)의 여섯 활성 v0.7 게임 기획 문서가 소유하며, 기술 구조는 [ARCHITECTURE.md](./ARCHITECTURE.md), 데이터와 API는 [DATA_AND_API.md](./DATA_AND_API.md), 화면·상호작용은 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md)가 소유한다.

사용자는 2026-08-22에 v0.6 전체 게임 기획과 t0.2 기술·UI 기본안을 승인하고 Phase 0B 개발 착수를 명시했으며, 2026-08-23에 v0.7 규칙과 t0.3 UI 흐름을 지시했다. `codex/phase-0b-foundation`의 Next.js 앱, 전체 화면 지도·반투명 HUD, 지도 직접 명단 은닉부터 여러 턴까지의 fixture 플레이, 절대 마감 기반 50초·10초·5초 countdown과 자동 기본 명령, 결정적 훈련 seed·재시작, BLUE 수신자 투영 3D 명령 수행과 우측 요원 카드 결과, Q-079와 `resolver.phase0b.4` 순수 로컬 판정 slice는 **IMPLEMENTED / LOCAL VERIFIED**다. Phase 0B 전체는 계속 **IN PROGRESS**이며 이 상태는 물리 태블릿, 권위 서버·persistence·두 클라이언트, 데이터베이스·Vercel·Preview·Production 검증 완료를 뜻하지 않는다.

## 현재 Phase 0B 범위

### 이번 단계에서 수행한다

- `codex/phase-0b-foundation`에 Next.js + TypeScript + React Three Fiber 로컬 앱 스캐폴드와 잠금 파일을 유지한다.
- fixture player projection으로 한국어 로비·HUD·Q-079 명령 작성기와 오류·빈 상태를 구현한다.
- 기본 도형 도시, 논리 좌표 adapter와 `SelectionIntent` 입력 경계를 구현한다.
- React·Three.js·네트워크·persistence에 의존하지 않는 순수 규칙과 단위 테스트를 구현한다.
- Galaxy Tab S9+를 목표로 긴 가로 화면용 셸, 터치·펜·마우스·키보드 동등 경로와 48×48 CSS px 대상을 구현한다.
- 세로 viewport에서는 조작을 막는 방향 전환 안내를 표시하고 portrait gameplay를 제공하지 않는다.
- lint, typecheck, unit/component test, production build와 로컬 Playwright desktop·tablet landscape·portrait-gate를 각각 검증한다.
- 구현 상태와 검증 사실을 기준 문서에 동기화한다.

### 이번 단계에서 수행하지 않는다

- Docker Desktop 설치·실행과 Docker API 검증
- Local Supabase와 모든 Supabase SDK/CLI·schema·migration·RLS·Auth·Realtime·function·key·env·앱 연결
- 기존 서울 Production-reserved 프로젝트의 Local·Preview 사용과 별도 Preview Supabase 프로젝트 생성
- Vercel CLI·프로젝트·Git Integration·환경변수·Preview
- `main` merge와 Production DB 변경·배포·promote·alias·rollback
- 실제 서버 API·persistence·1대1 네트워크 동기화
- 세로 gameplay reflow 또는 CSS transform 기반 화면 회전
- 최종 GLB·텍스처·일러스트·사운드 제작

위 보류 작업은 Phase 0B 착수 승인에 포함되지 않으며 각각 후속 명시 승인이 있어야 시작한다.

## 확정된 제품 기술 요구사항

- 플랫폼은 PC와 태블릿 웹 브라우저다.
- 플레이 형태는 링크를 통한 1대1 온라인 대전이다.
- 게임 시작 또는 방 참가 전에 닉네임을 지정한다.
- 도시는 16×16 논리 격자를 체스판 같은 3D 보드로 표현한다.
- 최초 데모의 건물과 캐릭터는 Three.js 기본 도형을 사용한다.
- 캐릭터 이동은 자유 이동이나 실시간 Transform 동기화가 아니라 확정된 논리 경로를 3D에서 재생한다.
- 향후 캐릭터와 건물 표현을 GLB/glTF 모델로 교체해도 게임 규칙 계층은 바뀌지 않아야 한다.
- 마우스와 터치가 같은 게임 기능에 접근할 수 있어야 하며 hover만으로 필요한 기능을 제공하지 않는다.
- 로비·HUD·명령 작성기, 시작 palette, 타이포그래피 역할, 북쪽 고정 3/4 카메라와 Galaxy Tab S9+ 가로 전용·세로 orientation gate는 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md)에 확정한다. 최종 이름·로고·3D 아트·사운드는 교체 가능한 비차단 후속 범위다.

## 확정 기술 스택

| 영역             | 확정 선택                                                                          | 선택 상태     | 실제 세팅 상태                                                                        |
| ---------------- | ---------------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| 언어             | TypeScript                                                                         | **CONFIRMED** | **INSTALLED / LOCKED — 5.9.3**                                                        |
| 런타임           | Node.js 24.x LTS                                                                   | **CONFIRMED** | **INSTALLED / VERIFIED — 24.19.0**                                                    |
| Node 패키지 도구 | npm                                                                                | **CONFIRMED** | **INSTALLED / VERIFIED — 11.17.0**                                                    |
| 패키지 관리자    | pnpm 11.x                                                                          | **CONFIRMED** | 사용자 전역 **INSTALLED / VERIFIED — 11.22.0**, `packageManager` **LOCKED — 11.22.0** |
| 웹 프레임워크    | Next.js App Router + React                                                         | **CONFIRMED** | **INSTALLED / LOCKED — Next.js 16.3.2, React 19.2.8**                                 |
| 3D               | React Three Fiber + Three.js + Drei                                                | **CONFIRMED** | **INSTALLED / LOCKED — R3F 9.7.0, Three.js 0.182.0, Drei 10.7.8**                     |
| 3D 에셋          | GLB / glTF                                                                         | **CONFIRMED** | **NO ASSETS**                                                                         |
| UI 구현          | Tailwind CSS + CSS custom-property tokens + 선별된 shadcn/ui primitive             | **CONFIRMED** | **FOUNDATION SLICE IMPLEMENTED / LOCAL VERIFIED**                                     |
| 서체             | Geist Sans 영문·숫자 + Pretendard Variable 한글 + Geist Mono 짧은 ASCII 메타데이터 | **CONFIRMED** | **FOUNDATION SLICE IMPLEMENTED / BUILD VERIFIED**                                     |
| 웹 호스팅·서버   | Vercel + Next.js Route Handlers                                                    | **CONFIRMED** | 계정 연결만 **VERIFIED**                                                              |
| 서버 런타임      | Vercel Node.js Functions                                                           | **CONFIRMED** | 프로젝트 **NOT CREATED**                                                              |
| 데이터베이스     | Supabase PostgreSQL                                                                | **CONFIRMED** | 서울 빈 프로젝트 컨테이너 **CREATED / VERIFIED**, 스키마 **NOT CONFIGURED**           |
| 인증             | Supabase Anonymous Auth                                                            | **CONFIRMED** | 프로젝트 컨테이너만 준비, **NOT CONFIGURED**                                          |
| 변경 알림        | Supabase Private Realtime Broadcast `state_changed`                                | **CONFIRMED** | **NOT CONFIGURED**                                                                    |
| 동기화 폴백      | 서버 상태 재조회 Polling                                                           | **CONFIRMED** | **NOT IMPLEMENTED**                                                                   |
| 저장소           | GitHub                                                                             | **CONFIRMED** | PRIVATE·로컬 CLI 인증·최초 `main` 기준선 **EXECUTED / VERIFIED**                      |

정확한 패키지 버전은 `package.json`과 `pnpm-lock.yaml`에 고정했다. 2026-08-22 현재 로컬 foundation slice는 아래 기록된 lint·test·build·browser 검증을 통과했다. 이 결과를 이후 서버·데이터·두 클라이언트 runtime이나 실기기 통과로 확대하지 않으며 `latest` 범위를 장기 계약으로 사용하지 않는다.

## 현재 외부 연결과 로컬 프로그램 상태

2026-08-18 확인 및 명시적으로 승인된 준비 작업의 실행 결과다.

| 대상                           | 현재 상태                                                                                        | 해석                                                                                                                                                                                             |
| ------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GitHub Codex 연결              | **AUTHENTICATED / VERIFIED**                                                                     | `nvunwoo/Project-Spy`에 admin·push 권한이 있다.                                                                                                                                                  |
| GitHub 저장소                  | **PRIVATE / INITIAL MAIN VERIFIED**                                                              | `nvunwoo/Project-Spy`의 PRIVATE 가시성, 최초 `main` 기준선과 원격 commit을 검증했다. 이후 직접 `main` push 권한으로 확대하지 않는다.                                                             |
| 로컬 Git                       | **AVAILABLE / AUTHENTICATED / VERIFIED**                                                         | GitHub CLI 2.97.0, Windows keyring의 `nvunwoo` 인증, HTTPS Git 프로토콜과 최초 push 성공을 검증했다.                                                                                             |
| Vercel Codex 연결              | **AUTHENTICATED / VERIFIED**                                                                     | 사용자 팀을 조회할 수 있다.                                                                                                                                                                      |
| Vercel 팀                      | **APPROVED / VERIFIED**                                                                          | `nvunwoo's projects`를 사용할 팀으로 확정했다.                                                                                                                                                   |
| Vercel Project-Spy 프로젝트    | **NOT CREATED / EXPLICITLY DEFERRED**                                                            | 팀 승인이 프로젝트 생성이나 Git 연결 승인을 의미하지 않는다. Local Phase 0B 시작의 전제도 아니다.                                                                                                |
| Supabase Codex 연결            | **AUTHENTICATED / VERIFIED**                                                                     | `Endurance Games` 조직을 조회할 수 있다.                                                                                                                                                         |
| Supabase 기존 Project-Spy      | **USER-DELETED / VERIFIED**                                                                      | 사용자가 플러그인 연동 중 만든 빈 `ap-south-1` 프로젝트는 사용자가 삭제했고 후속 조회에서 제거를 확인했다.                                                                                       |
| Supabase 서울 Project-Spy      | **CREATED / ACTIVE_HEALTHY / VERIFIED**                                                          | 사용자가 월 0달러 비용을 확인하고 명시적으로 승인한 후 `Endurance Games` Free의 서울 `ap-northeast-2`에 2026-08-18T06:48:01Z 생성했다. public table 0개, migration 0개다.                        |
| Supabase 게임 데이터·연결 구성 | **NOT CONFIGURED / EXPLICITLY DEFERRED**                                                         | 검증 사실은 public table 0개·migration 0개다. 모든 Supabase SDK/CLI·schema·RLS·function·Auth·Realtime·key·env/app 연결을 보류한다. 플랫폼 자동 제공 endpoint·key 값은 조회·기록·연결하지 않았다. |
| 시스템 Node.js / npm           | **INSTALLED / VERIFIED**                                                                         | Node.js 24.19.0과 npm 11.17.0. 지속 PATH를 반영한 새 프로세스에서 준비 진단을 통과했다.                                                                                                          |
| 사용자 전역 pnpm               | **INSTALLED / VERIFIED**                                                                         | pnpm 11.22.0. t0.2 최종 감사에서 호스트 사용자 PATH에 `C:\Users\USER\AppData\Roaming\npm`을 복원하고, Codex 번들이 아닌 사용자 전역 설치를 새 환경의 준비 진단에서 다시 확인했다.                |
| Local container runtime        | **NOT INSTALLED / EXPLICITLY DEFERRED — A-011**                                                  | Docker·Podman을 찾지 못했다. 현재 설치·실행하지 않으며 앱·fixture UI·순수 규칙에는 비차단이다.                                                                                                   |
| Supabase CLI / SDK             | **NOT INSTALLED / EXPLICITLY DEFERRED — A-011**                                                  | 전역·project CLI와 앱 SDK 모두 현재 추가하지 않는다. Local backend 범위를 다시 승인받은 뒤에만 버전 고정과 진단을 수행한다.                                                                      |
| Codex 번들 Node.js / pnpm      | **AVAILABLE FOR TOOLING**                                                                        | 문서·검사 용도 런타임이며 사용자 개발환경이나 프로젝트가 생성됐다는 뜻은 아니다.                                                                                                                 |
| GitHub CLI / Vercel CLI        | GitHub CLI **INSTALLED / VERIFIED — 2.97.0**, Vercel CLI **NOT INSTALLED / EXPLICITLY DEFERRED** | 로컬 GitHub 인증·push에 GitHub CLI를 사용한다. Vercel CLI와 전용 진단은 Preview integration 범위를 다시 승인받은 뒤에만 수행한다.                                                                |

연결 ID, 토큰, 키, DB 비밀번호와 서비스 역할 비밀값은 이 문서에 기록하지 않는다. 서울 프로젝트 컨테이너 대체는 사용자가 명시적으로 승인한 1회성 기술 준비 예외다. 이를 추가 프로젝트 변경, DB·Auth·Realtime·키·환경 구성 승인으로 확대하지 않는다.

## 외부 환경 경계

| 환경       | 용도                                    | Git 기준                          | Vercel                                                   | Supabase                                                                                    | 현재 상태                                   |
| ---------- | --------------------------------------- | --------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Local      | 앱·fixture·순수 규칙 개발과 자동 테스트 | `codex/phase-0b-foundation`       | 로컬 Next.js                                             | 현재 연결 없음. 후속 승인 시 Docker + Local Supabase만 사용                                 | **FOUNDATION IMPLEMENTED / LOCAL VERIFIED / BACKEND DEFERRED** |
| Preview    | Pull Request별 통합 검증                | `codex/*` Pull Request            | 자동 Preview 권장                                        | 명시 승인 뒤 생성하는 별도 Preview 프로젝트. 기존 서울 프로젝트와 데이터·키를 공유하지 않음 | **NOT CREATED / EXPLICITLY DEFERRED**       |
| Production | 사용자 승인된 배포                      | `main` — Git 자동 deployment 차단 | 별도 Production 승인 뒤 검증된 main commit에서 수동 배포 | 기존 서울 빈 프로젝트를 Production-reserved 컨테이너로 보존                                 | **PROJECT CONTAINER ONLY / NOT CONFIGURED** |

Preview와 Production은 데이터, 비밀키와 콜백 URL을 공유하지 않는다. 개발용 publishable key조차 Production에 재사용하지 않는다. Supabase의 공식 환경 가이드도 local·staging·production을 분리하고 staging과 production에 별도 프로젝트를 사용하는 흐름을 설명한다. Local stack은 비용 없이 격리된 개발 환경을 제공하며 Supabase CLI와 Docker API 호환 container runtime이 필요하다. Windows에서는 Docker Desktop이 공식 preferred option이고, CLI는 `pnpm` project devDependency로 설치한다. 근거는 [Supabase 환경 관리](https://supabase.com/docs/guides/deployment/managing-environments)와 [Local Development](https://supabase.com/docs/guides/local-development)이다.

Supabase 프로젝트에는 플랫폼이 관리하는 API URL과 key 체계가 있을 수 있으므로 “키가 없다”고 표현하지 않는다. 이번 준비에서 확인·승인한 것은 프로젝트 상태, 리전, public table 0개와 migration 0개뿐이다. 게임 앱용 publishable/secret key의 선택·회수·저장·연결은 수행하지 않았고 실제 값도 문서·로그·채팅에 남기지 않았다. 근거는 [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)다.

현재 Free Plan은 공식 문서상 최대 두 개의 active free project를 허용하지만, 조직 구성원의 Owner/Admin 보유 현황과 정책은 생성 직전에 다시 확인한다. 별도 Preview 프로젝트 생성은 이번 준비 작업의 범위가 아니며 사용자 개발·외부 세팅 지시 뒤에만 수행한다. 근거는 [Supabase Billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)다.

## 확정 전달 및 배포 정책

다음은 Codex 자동화를 위한 t0.2 확정 정책이다. 승인, 실행과 검증을 분리한다. 사용자는 문서 전용 최초 `main` push와 향후 요청 범위 안의 비-production 자동 전달을 승인했지만, 이 정책은 Codex가 새 개발 작업을 스스로 시작할 권한이 아니다.

1. 원격 저장소의 private 전환과 문서·저장소 보호장치만 포함한 초기 `main` 커밋·push를 실행하고 원격 commit을 검증했다.
2. 이후 작업은 `codex/*` 브랜치에서 수행한다.
3. Codex는 요청 범위만 커밋하고 사용자 파일과 비밀값을 포함하지 않는다.
4. 원격 push 뒤 Draft Pull Request를 열어 변경 범위와 검증 결과를 기록한다.
5. Vercel Git Integration 전에 별도 승인된 guard-only merge로 remote `main`에 추적되는 `vercel.json`의 `git.deploymentEnabled.main = false`를 먼저 둔다.
6. 별도 Preview integration 승인 뒤 deployment 없는 project create/link 경로를 사용하고 Git을 연결한 다음 Production Branch `main`, guard 적용과 Production deployment 0건을 확인한다. Git import 화면의 최초 `Deploy`는 Production 작업으로 취급해 별도 승인 없이는 실행하지 않는다.
7. 이후 Vercel Git Integration은 Pull Request마다 Preview를 생성한다.
8. 정적 검사, 자동 테스트와 두 플레이어 브라우저 검증이 통과해야 merge할 수 있다.
9. `main` 병합, Production 배포, promote, Production alias 변경, rollback과 Production DB migration은 각각 실행 직전에 별도의 명시적 사용자 승인을 받는다.
10. `main` 병합 승인은 Production 배포 승인으로 간주하지 않으며 Preview 성공도 두 작업 중 어느 것도 승인하지 않는다.
11. Production 배포는 자동 Git deployment를 켜지 않고, 승인된 remote `main` SHA의 별도 clean detached worktree에서만 수행한다. `HEAD`·remote SHA 일치, `git status --porcelain` 0건, team·project·environment, lockfile-pinned Vercel CLI를 확인한 뒤 `pnpm exec vercel ... --prod` 계열 수동 명령을 실행하고 deployment source/Git SHA를 사후 검증한다. 기존 작업트리는 reset·clean하지 않는다.
12. 배포 실패 시 원인과 검증 범위를 보고하며 임의로 이전 변경을 삭제하지 않는다.

Vercel의 기본 Git 흐름은 Production Branch(일반적으로 `main`)에 push·merge하면 Production deployment를 만든다. `git.deploymentEnabled`는 branch별 자동 deployment를 끌 수 있고 명시하지 않은 branch는 기본적으로 활성화된다. 또한 Git 저장소 import 화면의 `Deploy`는 실제 deployment를 시작한다. 따라서 guard를 remote main에 먼저 반영하고 project create/link와 deployment를 분리해 승인 분리를 설정과 실행 순서로 강제한다. 근거는 [Vercel Git 배포](https://vercel.com/docs/git), [Git Configuration](https://vercel.com/docs/project-configuration/git-configuration)과 [CLI 프로젝트 연결](https://vercel.com/docs/projects/deploy-from-cli)이다.

GitHub 저장소의 pre-alpha private 전환과 실제 원격 가시성 검증은 완료됐다. 이번 승인을 이후 public 전환이나 다른 저장소 설정 변경 권한으로 확대하지 않는다.

## 보안 준비 기준

- 클라이언트에는 Supabase publishable key만 허용한다.
- Supabase secret key, 기존 `service_role` 키, DB 비밀번호와 pooled connection string은 서버 전용 환경 변수다.
- 서버 전용 값에는 `NEXT_PUBLIC_` 접두사를 사용하지 않는다.
- `.env.local`과 Vercel 환경 변수 값은 커밋하거나 채팅·문서·로그에 복사하지 않는다.
- 게임플레이 테이블은 Data API에 직접 노출하지 않고 `anon`과 `authenticated` 권한을 거부한다.
- 노출 스키마의 테이블에는 RLS를 사용하며, `TO authenticated`만으로 접근을 허용하지 않는다.
- Anonymous Auth 사용자도 Postgres의 `authenticated` 역할을 사용하므로 `auth.uid()`와 경기 참가자 관계를 함께 검증한다.
- 사용자 수정이 가능한 `user_metadata`와 닉네임은 권한 판단에 사용하지 않는다.
- 플레이어별 비밀 정보는 클라이언트에서 숨기는 것이 아니라 서버 projection 단계에서 제거한다.
- Supabase Private Realtime은 알림만 보내며 비밀 상태를 payload에 포함하지 않는다.
- 서버 상태 변경은 Postgres transaction, row lock, unique constraint와 idempotency key로 보호한다.
- 클라이언트 시간과 Vercel Function 메모리를 권위 상태로 사용하지 않는다.

세부 계약은 [ARCHITECTURE.md](./ARCHITECTURE.md)와 [DATA_AND_API.md](./DATA_AND_API.md)를 따른다.

## 3D 기술 준비 기준

- 논리 좌표는 16×16의 `row`, `column`이며 게임 규칙의 단일 위치 값이다.
- 3D 좌표는 논리 좌표를 `x`, `z`로 변환하고 `y`를 높이로 사용한다.
- 셀 크기와 원점은 한 구성 값으로 관리하며 렌더러가 게임 규칙에 역으로 영향을 주지 않는다.
- 데모 건물은 공유 Box geometry와 material을 우선 사용하고, 다수의 반복 건물은 instancing 후보로 둔다.
- 데모 요원은 Capsule, Cylinder 또는 Box 계열 기본 도형으로 표현한다.
- 이동은 서버가 확정한 셀 경로의 waypoint를 보간한다. 물리 엔진과 NavMesh는 MVP 비범위다.
- 공항·항구 내부의 네 셀도 각각 별도 waypoint가 될 수 있다.
- 향후 GLB 모델은 동일한 논리 ViewModel을 받는 표현 어댑터에서 교체한다.
- 태블릿에서는 device pixel ratio, shadow와 antialiasing 품질을 제한하거나 적응형으로 낮출 수 있어야 한다.
- WebGL context 상실·복구와 브라우저 탭 복귀 시 최신 서버 상태 재조회 경로를 둔다.

## 검증 매트릭스와 현재 결과

스캐폴드나 테스트 파일이 있다는 사실만으로 통과 처리하지 않고 실제 실행 증거만 완료로 기록한다.

### 2026-08-23 로컬 Phase 0B-5 slice 결과

- **PASS** — lint, TypeScript typecheck, format, `git diff --check`
- **PASS** — 44개 source file의 계층 boundary 검사
- **PASS** — Vitest 14파일, 80테스트: domain/map/order/RNG/movement/outcome, 70% 이동 판정과 6턴 동료 암살 제한, 절대 phase deadline, 로컬 턴 resolver·세 턴 연속 진행·동시 이동·4명 수용·복수 제거/충원·목표 드롭/인도·동시 승리·결정성 replay·경제·충원·목표 승리, allowlist projection, 결정적 다음 훈련 seed, 수신자 제한 3D 실행 cue, 실제 UI fixture 경계, 요원별 path adapter, tap/shortcut, command reducer, 즉시 명령 저장과 orientation gate 범위
- **PASS** — Next production build, 정적 route `/`
- **PASS** — Playwright 1440×900 desktop·1280×800 touch landscape·1024×640 compact landscape·800×1280 portrait gate: 지도 직접 명단 은닉, 즉시 명령 저장, 실제 50초·10초·5초 timeout, 자동 `WAIT`·`ACQUIESCE`, 백그라운드 시간 복구, 세 턴 연속 fixture, 3D 명령 수행·우측 카드 결과·다음 턴 자동 전환과 훈련 seed 생성·복원을 포함해 11 passed, 프로젝트 조건에 따른 17 intended skips
- **PASS** — production dependency audit 알려진 취약점 0건, peer dependency 충돌 0건
- **PASS** — 로컬 브라우저 수동 고정 스폰·1칸 건물 도시와 `요원 → 이동 → 지도 목적지 → 빨간 대표 경로 + 도착 공작` 지도 연동 Q-079 위치·입력 점검, page warning/error 0건. R3F 9.7.0 호환 범위로 Three.js 0.182.0을 고정해 `THREE.Clock` deprecation warning도 0건
- **USER CONFIRMED** — 현재 fixture의 PC pointer와 태블릿 touch 명령 입력 작동
- **NOT TESTED** — 물리 Galaxy Tab S9+의 정확한 환경 기록, S Pen·WebGL2·DPR·성능·발열·백그라운드 복귀
- **NOT IMPLEMENTED / DEFERRED** — Production 권위 gameplay server, Route Handler·persistence·비공개 projection 전송, 두 클라이언트·Supabase·Vercel·Preview·Production 검증. 현재 resolver는 결정적 로컬 훈련 harness

아래는 제품 전체가 앞으로 충족해야 할 검증 범위다. 위 PASS에 명시하지 않은 항목은 현재 slice 통과로 간주하지 않는다.

### 전체 정적·단위 검증 범위

- TypeScript typecheck
- lint와 format 검사
- 순수 규칙 Resolver 단위 테스트
- 16×16 맵 좌표, 건물·공항·항구 이동과 셀 수용량 테스트
- 난수 seed 재현, 멱등성, 중복 Resolve와 transaction rollback 테스트
- 닉네임 Unicode·grapheme·중복 검증 테스트
- 플레이어별 projection 누출 테스트
- 명단 은닉 충돌 round, 일반 명령 비공개 draft와 deadline 자동 잠금 테스트
- 공개 정보만으로 만든 이동 affordance가 숨은 점유 차이를 누출하지 않는지 테스트

### 데이터·보안 통합 검증

- RLS와 직접 Data API 거부 테스트
- 잘못된 사용자, 제3자와 소진된 초대 토큰 거부 테스트
- 두 동시 join 중 하나만 빈 슬롯을 획득하는지 검증
- 두 동시 lock·sync 요청에서도 한 번만 턴이 실행되는지 검증
- commit 뒤 Realtime 알림 실패 시 polling으로 복구되는지 검증
- secret 값이 client bundle, API 응답과 로그에 포함되지 않는지 검증

### 브라우저·배포 검증

- PC Chrome·Edge의 현재 지원 버전
- 실제 Android 태블릿 Chrome: 공식 Android 12 이상 OEM 지원 기기, current 또는 previous Chrome, WebGL2, RAM 4GB 이상
- 권장 Android 태블릿 기준: Android 14 이상과 RAM 6GB 이상
- Android 10·11은 best-effort이며 in-app WebView는 지원하지 않음
- 마우스, 터치, 화면 크기와 고해상도 DPR
- 두 독립 브라우저 세션의 1대1 방 참가와 동일 revision 확인
- Preview에서 처음부터 한 경기 종료까지 완주
- 3D scene 로드, context 복구와 허용된 정보만 재생되는지 확인

주 검증 기종은 사용자가 확인한 **Galaxy Tab S9+**다. 정확한 모델 코드·Android·보안 패치·RAM·Chrome 전체 버전·landscape CSS viewport·DPR·WebGL2 결과는 첫 실기기 테스트 전에 기록한다. 자동화 기본 viewport에는 1440×900 desktop과 1280×800·1024×640 landscape를 포함한다. 800×1280 portrait에서는 gameplay가 아니라 조작을 막는 방향 전환 안내와 가로 복귀 시 상태 보존만 검증한다. CSS transform으로 앱을 90도 돌리거나 portrait gameplay reflow를 만들지 않으며 자동화 통과를 실제 기기 통과로 간주하지 않는다. iPadOS Safari는 별도 확정·검증 전 지원 대상으로 표시하지 않는다.

## 확정된 UI/UX 준비 계약과 후속 제작

다음은 2026-08-22 사용자 승인을 받은 활성 t0.2 기본값이다. 기획 문서 내부 가제는 `THE MOLE`, 프로토타입 화면 작업명은 `PROJECT SPY`로 구분한다.

- `PROJECT SPY` 임시 화면명, 근미래 정보기관 작전망, dark neutral/navy와 저채도 cyan·amber·muted red 토큰
- 한국어 명령·경고·설명과 제한된 영문 제품명·ID·좌표·TURN·상태 코드
- 중앙 3D 도시, wide 양쪽 rail, 좁은 가로 화면의 drawer/bottom sheet와 하단 명령 도크
- 북쪽 고정 3/4 perspective, 자유 회전 없음, 제한된 pan·zoom, Galaxy Tab S9+ 가로 전용과 세로 orientation gate
- 48×48 CSS px 터치 대상, pointer/touch/pen/keyboard 동등성, reduced motion과 player-specific DOM projection
- 요원 선택 → 최초 명령 → 지도 목적지 직접 선택·빨간 대표 경로 → 도착 공작·대상 → 요원 draft → 전체 잠금 상태 머신

최종 제품명·로고·초상화·도시·캐릭터 GLB·최종 진영색·사운드·상세 motion tuning과 최종 GLB 예산은 token·adapter·설정 경계 뒤의 비차단 후속 제작이다. 첫 구현은 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md)의 prototype acceptance criteria를 따른다.

## 사용자 승인 또는 입력이 필요한 항목

- [x] `nvunwoo/Project-Spy`를 기준 저장소로 사용
- [x] 당시 public이던 저장소를 pre-alpha 동안 private으로 전환
- [x] 문서·보호장치 전용 초기 `main` 커밋과 원격 push 실행 승인
- [x] 후속 Preview integration 승인 뒤 사용자가 요청한 범위 안에서 `codex/*` 커밋·push·Draft PR·Vercel Preview를 수행하는 정책 — 현재 실행은 보류
- [x] `main` merge와 각 Production 변경을 매번 별도 승인받는 경계
- [x] Vercel 팀으로 `nvunwoo's projects` 사용
- [ ] Vercel `Project-Spy` 프로젝트 생성 — **PREVIEW INTEGRATION GATED**
- [x] Supabase `Endurance Games` Free 조직과 향후 서울 `ap-northeast-2` 리전 사용
- [x] Supabase 신규 프로젝트 예상 비용 조회 — 확인 시점 월 0달러
- [x] 기존 빈 `ap-south-1` 프로젝트의 사용자 삭제·서울 리전 대체 승인 및 실행
- [x] 서울 `ap-northeast-2` Supabase 빈 프로젝트 생성·`ACTIVE_HEALTHY`·public table 0개·migration 0개 검증
- [ ] Supabase 스키마·Auth·Realtime·키·환경변수 구성 — **DEVELOPMENT GATED**
- [x] Preview와 Production의 Supabase 환경 분리 원칙 승인 — 실제 프로젝트 구성은 개발 게이트
- [x] 시스템 Node.js 24.19.0·npm 11.17.0과 사용자 전역 pnpm 11.22.0 설치·검증
- [ ] Docker Desktop 설치·실행·Docker API 검증 — **LOCAL BACKEND GATED / 별도 로컬 세팅 승인 필요**
- [ ] Supabase CLI project devDependency 고정 — **DEVELOPMENT GATED**
- [ ] Vercel CLI project devDependency·lockfile 고정과 `-RequireVercelCli` 통과 — **PREVIEW INTEGRATION GATED**
- [x] 실제 태블릿 지원 검증 장치를 Android Chrome으로 확정
- [x] UI 참고 문서와 세 와이어프레임 수신·활성 t0.2 계약 파생
- [x] 검증 대상 기기를 Galaxy Tab S9+로 사용자 확인
- [x] Q-079 의미 우선 명령 흐름 사용자 확인
- [x] 가로 전용·세로 orientation gate 사용자 확정
- [ ] Galaxy Tab S9+ 정확한 모델 번호·OS·RAM·Chrome·viewport 제공 — **DEVICE TEST GATED**
- [x] t0.2 UI·기술 기본안 최종 승인 — **2026-08-22**

## 기술 준비 Go/No-Go

### 문서 게이트

- [x] 현행 기술 스택 선택
- [x] 서버 권위와 3D 표현 분리 원칙
- [x] Anonymous Auth, 닉네임과 초대 토큰 계약
- [x] Postgres transaction, row lock와 idempotency 계약
- [x] 플레이어별 projection과 직접 테이블 접근 거부 계약
- [x] Private Realtime 알림과 fallback polling 계약
- [x] Vercel WebSocket Public Beta를 핵심 의존성에서 제외
- [x] 기본 도형 데모와 향후 GLB 교체 경계
- [x] PC·Galaxy Tab S9+ 기능 기준과 활성 UI/UX 계약
- [x] 로비·명단 은닉·명령 draft·경로·HUD·카메라·접근성 계약
- [x] Local/Preview/Production Supabase 역할 분리
- [x] `codex/*` → 검증 → Draft PR → Vercel Preview 전달 정책
- [x] `main` 자동 Vercel deployment 차단과 별도 수동 Production 승인 정책

### 외부 세팅 게이트

- [x] GitHub 플러그인 인증 확인
- [x] Vercel 플러그인 인증 확인
- [x] Supabase 플러그인 인증 확인
- [x] GitHub 기준 저장소·private 전환·문서 전용 초기 `main` push 승인
- [x] GitHub private 전환 실행 및 원격 가시성 검증
- [x] 초기 커밋·원격 `main` 실행 및 commit 검증 — **THIS BASELINE**
- [x] GitHub CLI 2.97.0·Windows keyring `nvunwoo`·HTTPS Git 인증 검증
- [ ] Vercel Project-Spy 프로젝트와 Git Integration — **EXPLICITLY DEFERRED**
- [ ] guard-only PR의 별도 `main` merge 승인과 remote `vercel.json`의 `git.deploymentEnabled.main = false` 검증 — **PREVIEW INTEGRATION GATED**
- [ ] deployment 없는 Vercel project create/link·Git 연결, Production Branch `main`과 Production deployment 0건 검증 — **PREVIEW INTEGRATION GATED**
- [x] Supabase 조직·서울 목표 리전과 월 0달러 예상 비용 조회
- [x] 기존 빈 Supabase `ap-south-1` 프로젝트의 사용자 삭제 확인
- [x] 서울 Supabase Project-Spy 빈 프로젝트 컨테이너 생성·상태 검증
- [x] 기존 서울 프로젝트를 Production-reserved 빈 컨테이너로 문서상 지정
- [ ] Docker Desktop 설치·실행과 project Supabase CLI 고정 — **EXPLICITLY DEFERRED / A-011**
- [ ] 로컬 stack 초기화·게임 schema·Auth 설정·Realtime policy·Local env 연결 — **EXPLICITLY DEFERRED / A-011**
- [ ] 별도 Preview 프로젝트·게임 schema·Auth 설정·Realtime policy·Preview env 연결 — **EXPLICITLY DEFERRED**
- [ ] Vercel 환경 변수와 서버 전용 secrets — **EXPLICITLY DEFERRED**

### 개발 착수 게이트

- [x] 사용자에게 기술 준비 문서 t0.1 권장안 승인 받음
- [x] 사용자에게 v0.6 게임 기획 최종 기준선 승인 받음 — **2026-08-22**
- [x] 사용자에게 t0.2 UI·기술 최종 기준선 승인 받음 — **2026-08-22**
- [x] Supabase 비용 조회 승인 받음
- [x] Supabase 서울 빈 프로젝트 컨테이너 대체 승인 및 실행·검증
- [x] 사용자가 Phase 0B 소프트웨어 개발 착수를 명시함 — **2026-08-22**
- [x] `codex/phase-0b-foundation` 앱 스캐폴드·정확한 패키지·`pnpm-lock.yaml` 생성
- [x] fixture UI·기본 도형 표현·현재 순수 규칙 foundation slice — **IMPLEMENTED / LOCAL VERIFIED**
- [x] lint·typecheck·format·diff check·boundary·Vitest·production build·Playwright·Codex 인앱 브라우저 결과 기록
- [ ] 물리 Galaxy Tab S9+·전체 gameplay/server·두 클라이언트 검증 — **NOT TESTED / NOT IMPLEMENTED**

Local Phase 0B는 `STARTED / IN PROGRESS`다. Phase 0B-5 3D 명령 수행·훈련 UX slice는 구현·로컬 검증됐으며 Docker·Local Supabase·Supabase SDK/CLI·Vercel·Preview는 계속 보류한다. 다음 기술 gate는 Galaxy Tab S9+ 실기기 측정과 사용자 플레이 피드백이며, 외부 backend로 확장할 때는 별도 사용자 승인을 다시 확인한다.

### Preview integration 게이트

- [ ] Vercel `Project-Spy` 프로젝트 생성·Git Integration 승인 — **DEFERRED**
- [ ] 별도 Supabase Preview 프로젝트 생성 승인 — **DEFERRED**
- [ ] Preview 전용 key·환경변수 연결과 보안 검증 — **DEFERRED**

이 승인이 있기 전에는 Local 밖의 프로젝트·환경·배포를 만들지 않는다. Preview integration 승인은 `main` merge나 Production DB·배포 승인이 아니다.

## 공식 기술 참고

- [Node.js 다운로드 — 24.x LTS 선택](https://nodejs.org/en/download/)
- [pnpm 설치 — Windows에서는 Node.js 설치 뒤 npm 방식 권장](https://pnpm.io/installation)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
