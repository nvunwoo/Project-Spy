> **보관 안내 (2026-09-25):** 추가 개발 예정이 없습니다. 이 문서의 이전 단계·서비스·후속 작업 표현은 작성 당시의 설계 기록입니다. 실제 구현·배포 상태는 [현재 상태](../CURRENT_STAGE.md)를 확인하세요.

# 미결정 사항 및 결정 상태

> 문서 상태: **ACTIVE**  
> 기획 기준 버전: v0.7<br>
> 기술 준비 기준: t0.3<br>
> 현재 단계: PHASE 0B-5 — 3D EXECUTION FLOW IMPLEMENTED<br>
> 현재 작업 현황: [CURRENT_STAGE.md](../CURRENT_STAGE.md)

이 문서는 아직 필요한 입력과 과거 질문의 해결 상태를 추적한다. 확정된 실제 규칙은 연결된 게임 기획 기준 문서가 소유한다.

## 상태

- **OPEN**: 결정 필요
- **USER INPUT PENDING**: 사용자가 구체 자료나 값을 제공할 예정
- **RESOLVED**: 활성 기준 문서에 반영 완료
- **IN PROGRESS**: 승인된 실행 범위 안에서 구현 또는 검증이 진행 중
- **DEFERRED**: 현재 단계의 범위 밖
- **DEPRECATED**: 최신 규칙에서 제외

기술 준비 작업은 질문 상태와 별도로 **APPROVED**(사용자 승인), **EXECUTED**(실제 변경), **VERIFIED**(증거 확인), **GATED**(후속 승인 전 실행 금지)를 구분한다. 승인만 받은 작업을 실행 완료로 기록하지 않는다.

## 사용자 입력 현황

현재 미해결 상태인 P0 맵 입력은 없다. Q-096은 사용자가 수정한 [MAP.xlsx](../MAP.xlsx)를 기준으로 팀당 K/H/D 3명과 새 스폰 좌표를 확정했으며, 대체된 Q-052의 이전 좌표는 아래 표에 이력으로 보존한다.

## v0.7에서 변경된 턴·표현 규칙

| ID | 상태 | 확정 결정 | 기준 문서 |
| --- | --- | --- | --- |
| Q-097 | RESOLVED / USER CONFIRMED | Q-084·Q-089의 일반 명령 마감을 40초에서 50초로 대체한다. 이동 기본 성공률은 70%, 동료 암살은 6턴부터 활성화한다. 요원별 마지막 명령 선택은 즉시 저장·패널 종료하며, 명단 은닉은 초록색 점멸 건물을 지도에서 직접 선택한다. 배신자 명령 뒤 수신자 투영 3D 명령 수행을 재생하고 우측 자기 요원 3명·통제 배신자 카드에서 실시간 결과를 표시한다. 별도 결과 팝업·사건 넘기기는 삭제하고 재생 뒤 5초 확인 후 다음 일반 명령으로 자동 전환한다. | [턴 구조](../game-design/TURN_MODEL.md), [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md), [UI/UX](../technical/UI_UX_CONTRACT.md) |

## v0.6에서 변경된 요원 편성

| ID    | 상태                      | 확정 결정                                                                                                                                                                                                 | 기준 문서                                                                                                                                      |
| ----- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Q-096 | RESOLVED / USER CONFIRMED | RED와 BLUE는 각각 K/H/D 3명, 총 6명의 요원을 사용한다. F와 F의 최대 이동 4칸 능력은 삭제하며 누구도 승계하지 않는다. 모든 요원의 최대 이동은 3칸이다. 시작 좌표는 BLUE `K=P3, H=P1, D=N1`, RED `K=A14, H=A16, D=C16`이다. | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md), [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md), [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |

## t0.1에서 해결된 기술 결정

| ID    | 상태     | 확정 결정                                                                                                                                                                                                     | 기준 문서                                                                                  |
| ----- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Q-048 | RESOLVED | 각 플레이어는 게임 시작 전에 자기 닉네임을 지정하는 단계를 반드시 거친다. 닉네임의 길이·문자·중복 정책은 데이터·API 계약에서 검증 가능한 값으로 관리하며 UI 시각 스타일과 분리한다.                           | [데이터·API](../technical/DATA_AND_API.md)                                                 |
| Q-074 | RESOLVED | 목표 플랫폼은 PC·태블릿 웹 브라우저다. 데모 도시는 3D 체스판형 격자로 표현하고 건물·요원은 단순 도형으로 시작하되 향후 3D 모델로 교체 가능한 표현 계층을 둔다.                                                | [프로젝트 비전](../game-design/PROJECT_VISION.md), [3D·표현](../technical/PRESENTATION.md) |
| Q-075 | RESOLVED | 기술 기준 t0.1은 Next.js + TypeScript, React Three Fiber, Vercel, Supabase 조합을 유지한다. 기술 선택은 v0.6 게임 규칙과 별도 버전으로 관리한다.                                                              | [기술 아키텍처](../technical/ARCHITECTURE.md)                                              |
| Q-076 | RESOLVED | 1대1 경기는 클라이언트 Transform이 아니라 하나의 서버 권위 상태·턴 판정을 공유한다. Supabase는 상태·영속화·Realtime 경계로 사용하고, 클라이언트에는 플레이어별 허용 정보만 전달한다.                          | [기술 아키텍처](../technical/ARCHITECTURE.md), [데이터·API](../technical/DATA_AND_API.md)  |
| Q-077 | RESOLVED | 개발 변경은 `codex/*` 브랜치에서 검증한 뒤 Draft PR과 Vercel Preview로 확인한다. `main` merge, Production deploy·promote·alias 변경·rollback과 Production DB migration은 각각 매번 별도 사용자 승인을 받는다. | [Codex 작업 규칙](../CODEX_WORKING_RULES.md)                                               |

이 표는 기술 방향의 결정을 뜻하며 전체 제품 구현 완료를 뜻하지 않는다. 2026-08-22 현재 로컬 앱 스캐폴드, fixture UI, 기본 도형 R3F 표현과 현재 순수 규칙 foundation slice는 **IMPLEMENTED / LOCAL VERIFIED**다. 전체 gameplay/server·두 클라이언트와 DB 스키마·RLS·Auth·Realtime·Supabase 앱 연결, Vercel 프로젝트·Preview와 Production은 미구현 또는 보류 상태다.

## t0.2에서 해결한 UI·개발 직전 결정

| ID    | 상태                                          | 확정 기본안                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 기준 문서                                                                                      |
| ----- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| Q-078 | RESOLVED                                      | 외부 UI MD와 세 와이어프레임은 비권위 참고 입력으로 보존하고, 사용자 최신 지시 → v0.6 게임 정본 → 활성 UI/기술 계약 순으로 적용한다.                                                                                                                                                                                                                                                                                                                                                                                                                         | [UI/UX](../technical/UI_UX_CONTRACT.md), [문서 허브](../README.md)                             |
| Q-079 | RESOLVED / USER CONFIRMED                     | 사용자가 사진 순서를 잘못 설명했음을 확인했다. 메뉴 의미를 기준으로 `요원 선택 → 이동/대기/심문/숙청 → 경로·도착지 → 이동만/조사/암살/해킹` 순서를 사용하며 현재 칸의 0칸 공작과 전체 명령 잠금을 포함한다.                                                                                                                                                                                                                                                                                                                                                  | [UI/UX](../technical/UI_UX_CONTRACT.md)                                                        |
| Q-080 | RESOLVED                                      | 도착지 탭 시 공개 정보만 사용한 대표 최단 합법 경로를 미리 보여 주고, 사용자가 경로를 수정·확정한다. API에는 v0.6이 요구하는 전체 논리 경로를 제출한다.                                                                                                                                                                                                                                                                                                                                                                                                      | [UI/UX](../technical/UI_UX_CONTRACT.md), [데이터·API](../technical/DATA_AND_API.md)            |
| Q-081 | RESOLVED / USER CONFIRMED                     | 목표 기기는 Galaxy Tab S9+이며 게임은 가로 전용이다. 세로에서는 gameplay를 차단하는 방향 전환 안내를 표시하고 CSS 회전·portrait reflow를 사용하지 않는다. 북쪽 고정 3/4 perspective, 자유 회전 없음, 제한된 pan·zoom과 DOM 시점 초기화를 유지한다.                                                                                                                                                                                                                                                                                                           | [3D·표현](../technical/PRESENTATION.md), [UI/UX](../technical/UI_UX_CONTRACT.md)               |
| Q-082 | RESOLVED                                      | 두 번째 참가 시 서버가 RED/BLUE를 50:50으로 한 번 무작위 배정한다. 별도 Ready 토글은 만들지 않는다. 내가 잠그기 전에는 상대의 일반 명령 잠금 여부와 정확한 시각을 숨긴다.                                                                                                                                                                                                                                                                                                                                                                                    | [기술 아키텍처](../technical/ARCHITECTURE.md), [데이터·API](../technical/DATA_AND_API.md)      |
| Q-083 | RESOLVED                                      | 로비와 첫 턴 사이에 양측의 비밀 명단 은닉 round를 둔다. 같은 후보를 고르면 상대 위치를 공개하지 않고 두 선택을 모두 무효화해 재선택한다.                                                                                                                                                                                                                                                                                                                                                                                                                     | [기술 아키텍처](../technical/ARCHITECTURE.md), [데이터·API](../technical/DATA_AND_API.md)      |
| Q-084 | RESOLVED                                      | 완성된 요원별 일반 명령은 비공개 서버 draft로 저장한다. 수동 잠금은 모든 활동 가능 요원의 완전한 묶음으로 정규화하고, 40초 만료 시 마지막 draft를 원자적으로 잠근 뒤 미지정 활동 가능 요원만 대기로 채운다. 활동 가능 요원이 0명이면 자동 종료한다.                                                                                                                                                                                                                                                                                                          | [데이터·API](../technical/DATA_AND_API.md), [UI/UX](../technical/UI_UX_CONTRACT.md)            |
| Q-085 | RESOLVED                                      | 기존 서울 Supabase 프로젝트는 Production-reserved 빈 컨테이너로 유지한다. Local은 로컬 stack, Preview는 추후 명시 승인된 별도 프로젝트를 사용하되 현재 둘 다 실행 보류한다.                                                                                                                                                                                                                                                                                                                                                                                  | [기술 준비](../technical/TECHNICAL_READINESS.md)                                               |
| Q-086 | RESOLVED                                      | UI는 한국어 명령·경고·설명을 기본으로 하고 영어는 제품명·TURN·ID·좌표·상태 코드에 보조 사용한다. Geist는 영문·숫자, Pretendard Variable은 한글, Geist Mono는 짧은 ASCII 메타데이터에 사용한다.                                                                                                                                                                                                                                                                                                                                                               | [UI/UX](../technical/UI_UX_CONTRACT.md)                                                        |
| Q-087 | RESOLVED DEFAULT / EXECUTION DEFERRED — A-011 | Local Supabase를 시작할 경우 Docker API 호환 container runtime과 project-pinned Supabase CLI를 사용한다. 현재 사용자 지시에 따라 Docker·Local Supabase·Supabase SDK/CLI 실행은 보류한다.                                                                                                                                                                                                                                                                                                                                                                     | [기술 준비](../technical/TECHNICAL_READINESS.md), [MVP 로드맵](./MVP_ROADMAP.md)               |
| Q-088 | RESOLVED                                      | MVP 참가 수단은 초대 링크·원문 token이며 짧은 방 코드는 만들지 않는다. 생성 응답 유실은 자기 작전 복구 후 새 링크 발급으로 처리한다. waiting host와 첫 일반 명령 전 어느 setup player나 작전을 취소해 새 방으로 이동할 수 있고, active 경기의 나가기는 로컬 화면 이탈이며 기권이 아니다.                                                                                                                                                                                                                                                                     | [UI/UX](../technical/UI_UX_CONTRACT.md), [데이터·API](../technical/DATA_AND_API.md)            |
| Q-089 | RESOLVED                                      | shared revision을 올리지 않는 자기 비밀 lock은 scope별 private input version으로 적용한다. 일반 명령 draft는 저장 시 플레이어 전체 집합의 비용·횟수·상호 배타 제한을 서버가 검증해 40초 snapshot이 항상 합법하도록 한다.                                                                                                                                                                                                                                                                                                                                     | [기술 아키텍처](../technical/ARCHITECTURE.md), [데이터·API](../technical/DATA_AND_API.md)      |
| Q-090 | RESOLVED                                      | game status는 `waiting → setup → active`로 구분한다. waiting/setup WebGL 실패는 호환성·취소 화면, active membership은 재접속 첫 load 실패부터 플레이 가능한 2D 논리 폴백으로 이어 간다.                                                                                                                                                                                                                                                                                                                                                                      | [UI/UX](../technical/UI_UX_CONTRACT.md), [3D·표현](../technical/PRESENTATION.md)               |
| Q-091 | RESOLVED                                      | 일반 명령 phase 진입 시 활동 요원 0명, 배신자 phase 진입 시 조종할 배신자 없음은 owner private version을 가진 server-default submission으로 즉시 확정한다. 양측 모두 자동이면 timer 없이 다음 phase까지 같은 transaction에서 진행한다.                                                                                                                                                                                                                                                                                                                       | [기술 아키텍처](../technical/ARCHITECTURE.md), [데이터·API](../technical/DATA_AND_API.md)      |
| Q-092 | RESOLVED                                      | room create·invite rotate는 canonical resource mutation만 멱등이고 일회성 원문 token은 저장·재생하지 않는다. 내부 `rotate_required`는 public wire에서 resource identity, `rawInviteTokenIncluded: false`, `inviteRecoveryAction: "rotate"`로 투영하며 새 key rotate만 새 원문을 반환한다. 자동 참가 URL은 fragment만 사용하고 즉시 주소에서 제거한다.                                                                                                                                                                                                        | [데이터·API](../technical/DATA_AND_API.md)                                                     |
| Q-093 | RESOLVED                                      | MVP에서 하나의 anonymous session은 waiting·setup·active 작전 하나만 소유한다. private 사용자별 active-game claim이 서로 다른 create·join 경합을 막고, cancel·finish가 claim을 원자 해제한다. 같은 game join 재시도는 이미 사용된 초대 오류보다 기존 membership 복구를 우선한다.                                                                                                                                                                                                                                                                              | [기술 아키텍처](../technical/ARCHITECTURE.md), [데이터·API](../technical/DATA_AND_API.md)      |
| Q-094 | RESOLVED / EXECUTION DEFERRED                 | Vercel 연결 전에 guard-only 변경을 별도 승인으로 remote `main`에 반영해 `git.deploymentEnabled.main = false`를 강제한다. deployment 없는 project create/link 뒤 Production Branch `main`·Production deployment 0건을 검증하고 Dashboard 최초 Deploy는 Production 승인 없이 실행하지 않는다. 현재 Vercel project/CLI/Git Integration/Preview는 보류한다.                                                                                                                                                                                                      | [Codex 작업 규칙](../CODEX_WORKING_RULES.md), [기술 준비](../technical/TECHNICAL_READINESS.md) |
| Q-095 | RESOLVED                                      | invite generation은 server time 기준 60분 유효하며 만료돼도 waiting room은 유지되고 host가 재발급한다. durable 10분 fixed-window 한도는 create 5/user, join 10/user+room 및 30/user, rotate 5/user+game이고 429에 `Retry-After`를 준다. committed success/failure는 24시간 replay하고 이후 같은 key는 410으로 새 mutation을 만들지 않는다. `rate_limited`는 window 종료 후 같은 key를 재claim한다. expected 4xx는 domain savepoint만 rollback해 guard를 commit하고, unexpected DB/503은 전체 rollback한다. 공개 출시 전 IP/WAF·CAPTCHA는 별도 보안 게이트다. | [데이터·API](../technical/DATA_AND_API.md), [UI/UX](../technical/UI_UX_CONTRACT.md)            |

위 항목은 2026-08-22 사용자 승인을 받은 활성 t0.2 기본안이다. 이는 각 기능의 구현·테스트·build·브라우저 검증 완료를 뜻하지 않으며 실행 상태는 별도로 추적한다.

## 외부 연결과 로컬 환경 상태

| 상태 ID | 상태                                                             | 확인된 사실                                                                                                                                                                                                                         | 다음 경계                                                                                                              |
| ------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| E-001   | CONNECTED / PRIVATE / INITIAL MAIN VERIFIED                      | GitHub 플러그인과 로컬 GitHub CLI는 `nvunwoo`로 인증됐다. `nvunwoo/Project-Spy`를 PRIVATE으로 전환했고 문서·보호장치 전용 최초 `main` 기준선과 원격 commit을 검증했다.                                                              | 이후 변경은 `codex/*`·Draft PR 정책을 사용하며 이번 1회성 직접 `main` 초기화를 일반 권한으로 확대하지 않는다.          |
| E-002   | CONNECTED / TEAM APPROVED / PROJECT MISSING / DEFERRED           | Vercel 플러그인은 승인된 `nvunwoo's projects` 팀에 인증됐다. `Project-Spy` 프로젝트는 없다.                                                                                                                                         | Vercel project/CLI/Git Integration/Preview는 현재 사용자 지시로 보류한다.                                              |
| E-003   | SEOUL PROJECT READY / EMPTY / VERIFIED / RESERVED                | 사용자가 만든 빈 `ap-south-1` 프로젝트는 사용자가 삭제했다. 월 0달러 비용 확인과 명시 승인 뒤 `Endurance Games` Free의 같은 이름 프로젝트를 `ap-northeast-2`에 생성해 `ACTIVE_HEALTHY`, public table 0개, migration 0개를 검증했다. | Production-reserved 빈 컨테이너로 유지한다. 모든 Supabase SDK/CLI·schema·RLS·Auth·Realtime·key·env·앱 연결은 보류한다. |
| E-004   | LOCAL PLAYABLE SLICE IMPLEMENTED / VERIFIED                      | `package.json`, `pnpm-lock.yaml`, 앱·품질 설정, fixture 로비·Q-079·전체 화면 지도·반투명 HUD, 명단 은닉부터 다음 턴과 결정성 재판정, `resolver.phase0b.3` 순수 로컬 판정을 생성했다. lint·typecheck·format·diff check·41 source boundary·Vitest 10파일·62테스트·Next build·Playwright 6 passed/10 intended skips와 Codex 인앱 브라우저 결과를 기록했다. | 물리 Galaxy Tab S9+와 권위 gameplay server·persistence·두 클라이언트는 통과하지 않았고 backend·외부 환경은 보류한다. |
| E-005   | LOCAL AUTH + INITIAL PUSH VERIFIED                               | GitHub CLI 2.97.0, Windows keyring `nvunwoo`, HTTPS Git 프로토콜과 최초 `main` push 성공을 검증했다.                                                                                                                                | 이후 변경은 `codex/*`·Draft PR 정책을 따른다.                                                                          |
| E-006   | REPOSITORY GUARDS READY                                          | `AGENTS.md`, `.gitignore`, `.gitattributes`, `.nvmrc`, 비밀값은 비어 있고 비민감 기본값만 있는 `.env.example`, Draft PR 템플릿과 준비 진단 스크립트가 있다.                                                                         | 실제 secret env 값·외부 프로젝트·DB·배포 완료로 확대 해석하지 않는다.                                                  |
| E-007   | LOCAL BACKEND DEFERRED / A-011                                   | 호스트 검사에서 Docker·Podman·project Supabase CLI가 발견되지 않았고 `-RequireLocalSupabase` 진단이 두 필수 항목으로 실패했다.                                                                                                      | Docker·Local Supabase·Supabase SDK/CLI는 현재 실행하지 않는다.                                                         |

## 사용자 작업 ID

| Action ID | 상태                                       | 사용자 작업                                                                                                                                 | 완료 증거                                                                                                                                                     |
| --------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UA-001    | COMPLETED / VERIFIED                       | Windows x64용 Node.js 24.19.0·npm 11.17.0과 사용자 전역 pnpm 11.22.0을 준비하고 지속 PATH를 설정했다.                                       | 새 PATH를 반영한 진단에서 세 버전과 비-Codex pnpm 경로, `scripts/verify-development-readiness.ps1` 필수 항목 통과                                             |
| UA-002    | COMPLETED / VERIFIED                       | GitHub CLI 웹 로그인을 완료하고 로컬 HTTPS 쓰기 인증을 준비한다.                                                                            | `gh auth status`에서 Windows keyring의 `nvunwoo`, HTTPS 프로토콜과 최초 push 성공 확인                                                                        |
| UA-003    | RECEIVED / CONTRACT DERIVED                | UI 시각 스타일 가이드와 세 와이어프레임을 제공했다. 외부 문서 자체를 정본으로 쓰지 않고 활성 t0.2 계약을 파생했다.                          | Q-040·Q-078~Q-095와 [UI_UX_CONTRACT.md](../technical/UI_UX_CONTRACT.md)에 반영                                                                                |
| UA-004    | TEAM RESOLVED / PROJECT DEFERRED           | Vercel 팀으로 `nvunwoo's projects`를 사용한다. `Project-Spy` 프로젝트·CLI·Git 연결·Preview는 현재 보류한다.                                 | 팀은 확인 완료. 프로젝트 ID·Git 연결·Production branch는 아직 없음                                                                                            |
| UA-005    | PROJECT CONTAINER COMPLETED / DATA GATED   | `Endurance Games` Free, 월 0달러와 서울 `ap-northeast-2`를 확인하고 빈 `Project-Spy` 컨테이너를 대체 생성했다.                              | `ACTIVE_HEALTHY`, public table 0개, migration 0개. 게임용 데이터·Auth 설정·Realtime policy·앱 key/env 연결은 미구성이고 자동 제공 key 값은 조회·기록하지 않음 |
| UA-006    | GALAXY TAB S9+ CONFIRMED / DETAILS PENDING | 목표 기기가 Galaxy Tab S9+임을 사용자가 확인했다. 첫 실기기 테스트 전에 모델 코드·Android·RAM·Chrome·landscape CSS viewport·DPR을 제공한다. | 로컬 개발은 차단하지 않되 실제 기기 통과 선언 전 반드시 기록                                                                                                  |
| UA-007    | DEFERRED — A-011                           | Windows 권장안인 Docker Desktop 설치·실행과 Docker API 호환 검증                                                                            | 사용자가 Local Supabase 범위를 다시 승인한 뒤에만 수행                                                                                                        |

`DEFERRED`는 현재 실행하지 않으며 후속 범위 승인이 있어야 다시 연다. v0.6·t0.2와 Phase 0B 로컬 구현은 승인됐지만 이 승인이 Docker·Supabase·Vercel·Preview·Production 권한으로 확장되지는 않는다. Android 10·11은 best-effort이고 in-app WebView는 지원 대상이 아니다.

## 기술 준비 후속 사용자 승인 기록

| Approval ID | 상태                                  | 승인 내용                                                                                                   | 실행 상태                                                                                      |
| ----------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| A-001       | EXECUTED / VERIFIED                   | `nvunwoo/Project-Spy`를 기준 저장소로 사용                                                                  | PRIVATE 기준 저장소와 최초 `main` 확인                                                         |
| A-002       | EXECUTED / VERIFIED                   | pre-alpha 동안 GitHub 저장소를 private으로 전환                                                             | 원격 가시성 PRIVATE 확인                                                                       |
| A-003       | EXECUTED / VERIFIED                   | 문서·보호장치 전용 최초 `main` 커밋과 push                                                                  | 원격 `main`과 기준선 commit 확인                                                               |
| A-004       | APPROVED POLICY                       | 향후 사용자가 요청한 범위 안에서 `codex/*` 커밋·push·Draft PR·Vercel Preview 자동 수행                      | 개발 착수 권한 아님                                                                            |
| A-005       | APPROVED POLICY                       | `main` merge, Production deploy·promote·alias 변경·rollback과 Production DB migration은 각각 매번 별도 승인 | 정책 확정, 실행 없음                                                                           |
| A-006       | APPROVED                              | Vercel 팀으로 `nvunwoo's projects` 사용                                                                     | 팀 확인, 프로젝트 없음                                                                         |
| A-007       | EXECUTED / VERIFIED                   | Supabase `Endurance Games` Free, 월 0달러, 서울 `ap-northeast-2` 빈 프로젝트 대체                           | 기존 빈 프로젝트 사용자 삭제 후 서울 프로젝트 `ACTIVE_HEALTHY`·public table 0·migration 0 확인 |
| A-008       | CONFIRMED                             | 실제 태블릿 검증 장치는 Android Chrome                                                                      | 정확한 기기 정보 대기                                                                          |
| A-009       | RECEIVED / DERIVED                    | UI 가이드와 세 와이어프레임 제공                                                                            | 비권위 원문과 활성 t0.2 UI 계약으로 분리 반영                                                  |
| A-010       | APPROVED / EXECUTED                   | v0.6 게임 기획과 t0.2 기술·UI 기본안의 최종 승인 및 Phase 0B 착수                                           | 2026-08-22 사용자 명시 승인, 현재 로컬 foundation slice 구현·검증                              |
| A-011       | DEFERRED / NOT APPROVED FOR EXECUTION | Docker Desktop 호스트 설치·실행, Local Supabase와 Supabase SDK/CLI 준비                                     | 사용자가 명시적으로 보류. 앱 부트스트랩과 분리된 후속 승인 필요                                |

위 A-010은 로컬 Phase 0B 개발 착수 권한이다. Docker·Supabase·Vercel·Preview·`main` merge·Production 권한은 포함하지 않는다.

## v0.5에서 해결되고 v0.6에서 일부 대체된 맵 데이터와 경계 규칙

| ID    | 상태     | 확정 결정                                                                                                                                                                                                  | 기준 문서                                           |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Q-052 | DEPRECATED — Q-096으로 대체 | v0.5 최초 시작 좌표는 BLUE `K=P3, H=O1, F=P2, D=N1`, RED `K=A14, H=B16, F=A15, D=C16`이었다. v0.6의 6명 편성과 새 좌표가 이 결정을 대체한다.                                        | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-053 | RESOLVED | 16×16 Excel을 25개의 2×2 건물 블록과 하나로 연결된 도로망을 가진 고정 맵 템플릿으로 확정했다. 공항은 `B2:C3`, 항구는 `N14:O15`를 차지한다.                                                                 | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-068 | RESOLVED | 맵에는 건물 부지 100칸이 있으며, 명명된 특수시설 25개가 31칸을 차지하고 나머지 69칸은 일반 건물이다. 일반 블록은 특수시설 하나와 일반 건물 셋으로 구성하고 공항·항구는 블록 전체를 차지하는 예외 시설이다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-069 | RESOLVED | A의 호텔 5개·지하철역 5개와 B의 일곱 시설은 경기 준비 때 검증된 후보 배치 중 하나로 중복 없이 생성한다. 결과는 양측에 공개하고 경기 종료까지 고정하며, 숨겨진 목표 배치 전에 완료한다.                     | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-070 | RESOLVED | 일반 건물은 진입·대기할 수 있지만 중간 통과하거나 다른 건물로 직접 이동할 수 없다. 공항·항구만 4칸 내부를 이동·통과할 수 있는 단일 건물이며, 내부의 모든 직교 이동도 이동 거리에 포함한다.                 | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-071 | RESOLVED | 충원되는 요원은 공항·항구의 합계 8칸 중 현재 아무 요원도 없는 칸에 무작위로 배치한다. 복수 동시 충원도 서로 다른 빈 칸에 중복 없이 배정한다.                                                               | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-072 | RESOLVED | 한 칸에 네 명을 채워 한 칸짜리 특수시설의 진입·목표 획득·인도·해킹을 차단하는 봉쇄는 합법적인 전술이다. 별도의 인접 상호작용 예외를 두지 않는다.                                                           | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-073 | RESOLVED / v0.6 UPDATED | Excel의 `도로`, A/B/C, K/H/D와 충원 표시는 제작용 논리 데이터다. 실제 도로에는 문자를 표시하지 않으며, 고정 시작 유형 표기도 상대의 유형 비공개 규칙을 우회하도록 노출하지 않는다.                       | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |

## v0.4에서 해결된 경계 규칙

| ID    | 상태     | 확정 결정                                                                                                                                                      | 기준 문서                                           |
| ----- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Q-054 | RESOLVED | 자기 팀 활동 요원이 0명이어도 상대 팀의 자기 배신자가 생존하면 배신자 명령을 지시할 수 있다.                                                                   | [턴 구조](../game-design/TURN_MODEL.md)             |
| Q-055 | RESOLVED | 공항과 항구는 각각 일반 건물 셀 4개 크기의 특수 공간이며, 전체 요원 수보다 수용량이 커 충원 공간이 부족해지지 않는다.                                          | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-056 | RESOLVED | 재매수 시 활동 요원이 한 명 이상이면 현재 활동 요원 중 즉시 무작위 매수하고, 0명이면 활동 요원이 생길 때까지 연기한다.                                         | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-057 | RESOLVED | 과학자의 탈출지는 처음 획득한 국장에게만 공개한다. 운반자가 제거된 뒤 다른 요원이 과학자를 획득하면 공항과 항구를 서로 전환하고 새 획득 국장에게만 알려 준다.  | [목표와 승리](../game-design/WORLD_MISSIONS.md)     |
| Q-058 | RESOLVED | 원인과 관계없이 바닥에 떨어진 모든 목표물은 재획득될 때까지 양측에 계속 공개한다.                                                                              | [목표와 승리](../game-design/WORLD_MISSIONS.md)     |
| Q-059 | RESOLVED | 목표물 드롭 직후 같은 칸의 생존한 적격 요원에게 자동 획득을 판정하고, 여러 명이면 무작위로 한 명을 선택한다.                                                   | [목표와 승리](../game-design/WORLD_MISSIONS.md)     |
| Q-060 | RESOLVED | 모든 최초 요원은 건물과 겹치지 않는 도로에서 시작한다. 공항·항구에서의 요원 스폰은 충원 때만 적용하며, 시작 좌표 및 초기 목표 배치 규칙과 독립적으로 처리한다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-061 | RESOLVED | 통신국 도청이 활성화돼 있으면 배신자에게 위장된 `대기`가 아니라 실제 `심문` 명령을 공개한다.                                                                   | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-062 | RESOLVED | 경합 한쪽의 공작만 강제 실패하면 상대가 반드시 승리한다. 양쪽 모두 강제 실패하면 양쪽 모두 실패한다. 단독 행동의 강제 실패는 그대로 실패다.                    | [턴 구조](../game-design/TURN_MODEL.md)             |
| Q-063 | RESOLVED | 심문 이력은 영구 기록하지 않는다. 현재 요원 옆의 `배신자` 또는 `배신자 아님` 표식만 유지하며, 재매수 알림이 발생하면 자기 팀 모든 요원의 심문 표식을 제거한다. | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-064 | RESOLVED | 명령한 국장은 자기 일반·배신자 명령 결과와 자기 배신자 사망을 직접 통보받는다. 피해 측에는 성공한 암살만 알리고 실패 시도·공격자·방식은 숨긴다.                | [턴 구조](../game-design/TURN_MODEL.md)             |
| Q-065 | RESOLVED | 상호 암살 결투는 하나의 사건이며, 두 참가자 중 높은 최종 성공률을 전역 정렬 키로 사용한다. 다른 사건과 동률이면 사건 단위로 순서를 무작위 결정한다.            | [턴 구조](../game-design/TURN_MODEL.md)             |
| Q-066 | RESOLVED | 확률 판정에 성공한 이동을 무작위 순서로 하나씩 처리한다. 처리 시점에 목적지가 가득 차면 차단하고 출발 칸에 남긴다. 꽉 찬 셀끼리의 맞교환도 차단된다.           | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-067 | RESOLVED | 이동 경로는 같은 칸을 두 번 밟거나 출발 칸으로 되돌아올 수 없는 단순 경로다.                                                                                   | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |

## 아직 열린 창작 결정

| 기존 ID | 상태                   | 항목                        | 비고                                                                                                    |
| ------- | ---------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------- |
| Q-001   | OPEN                   | 최종 게임명                 | 현재 가제 THE MOLE                                                                                      |
| Q-002   | DEFERRED               | 목표 평균 플레이 시간       | 첫 플레이테스트에서 측정                                                                                |
| Q-031   | OPEN                   | 배경 시대와 상세 세계관     | RED/BLUE/GREEN 구도는 확정                                                                              |
| Q-032   | OPEN                   | GREEN 국가 수도 이름        | 수도라는 배경은 확정                                                                                    |
| Q-034   | RESOLVED FOR PROTOTYPE | 작품 분위기                 | 근미래 정보기관 작전 스릴러. 상세 세계관은 Q-031로 계속 분리                                            |
| Q-035   | OPEN                   | 캐릭터 이름과 개별 설정     | K/H/D 기능은 확정                                                                                       |
| Q-036   | OPEN — NON-BLOCKING    | 최종 전체 아트 스타일       | 프로토타입은 저채도 작전 보드·기본 도형을 사용                                                          |
| Q-037   | RESOLVED FOR PROTOTYPE | 카메라 방식                 | Q-081의 북쪽 고정 3/4 perspective·회전 없음                                                             |
| Q-038   | OPEN — NON-BLOCKING    | 최종 캐릭터 스타일          | 프로토타입은 초상화 없이 K/H/D와 안전한 ID를 사용                                                       |
| Q-039   | OPEN — NON-BLOCKING    | 최종 도시 스타일            | 프로토타입은 단순 도형 정보기관 작전 보드 사용                                                          |
| Q-040   | RESOLVED FOR PROTOTYPE | 색상과 UI 스타일            | t0.2 palette·타입·레이아웃은 [UI/UX](../technical/UI_UX_CONTRACT.md), 최종 브랜드 palette는 비차단 후속 |
| Q-041   | RESOLVED FOR PROTOTYPE | 이동 연출과 필수 애니메이션 | 서버 결과 재생·상태 변화 중심·연출 건너뛰기·reduced motion. 세부 속도는 플레이테스트에서 조정           |

## v0.3에서 해결된 게임 규칙

| 기존 ID     | 상태       | 결정 요약                                                                                                                                         | 기준 문서                                           |
| ----------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Q-003       | RESOLVED   | 초기 프로토타입 최대 턴 없음, 동시 두 번째 목표 확보 시 무승부                                                                                    | [목표와 승리](../game-design/WORLD_MISSIONS.md)     |
| Q-004~Q-007 | RESOLVED / Q-096 UPDATED | 팀당 K/H/D 각 한 명과 전문 보정을 사용한다. F와 그 4칸 이동 능력은 삭제되고 승계되지 않는다.                                                                                         | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-008       | RESOLVED   | 이동·해킹·암살·조사·대기·심문·숙청                                                                                                                | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-009       | RESOLVED   | 공작 기본 60%, 전문 +20퍼센트포인트, 충성도 -10퍼센트포인트                                                                                       | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-010       | RESOLVED   | 암살·숙청 제거, 결원과 동일 유형 충원                                                                                                             | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-011       | DEPRECATED | 협력 시스템은 현재 명령 목록에 포함하지 않음                                                                                                      | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-012~Q-014 | RESOLVED   | 묵인·이동 실패·공작 실패·동료 암살, 비용과 제한 확정                                                                                              | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-015~Q-016 | RESOLVED   | 심문과 숙청으로 배신자를 식별·제거                                                                                                                | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-017       | DEPRECATED | 기존 불신 기능을 심문·숙청으로 대체                                                                                                               | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-018       | RESOLVED   | 현행 국장 행동은 확정된 일곱 명령과 배신자 명령으로 제한                                                                                          | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-019       | RESOLVED   | 턴 할당금, 은행 잔액, 절반 적립과 시설 해킹 경제 확정                                                                                             | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-020~Q-022 | RESOLVED   | 16×16 격자, 이동·수용량과 명명된 특수시설 25개의 종류·기능을 확정했다. 실제 25블록·100칸 구조와 일반 건물은 v0.5의 Q-053·Q-068에서 후속 확정했다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-023~Q-027 | RESOLVED   | 목표 3종·실물 4개, 유효 목표 2개 확보 승리                                                                                                        | [목표와 승리](../game-design/WORLD_MISSIONS.md)     |
| Q-028~Q-030 | RESOLVED   | 탐지·조사·배신자·명단·목표 운반자·도청의 핵심 정보 범위 확정. 당시 별도 추적한 복합 경계 Q-057~Q-064도 v0.4에서 해결                              | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-042       | RESOLVED   | 40초/10초, 확정 즉시 잠금, 시간 초과 기본 명령 확정                                                                                               | [턴 구조](../game-design/TURN_MODEL.md)             |
| Q-043       | RESOLVED   | 이동 수용량, 암살 순서, 시설 경합과 동시 승리의 핵심 충돌 규칙 확정. 당시 별도 추적한 Q-062·Q-065·Q-066도 v0.4에서 해결                           | [턴 구조](../game-design/TURN_MODEL.md)             |
| Q-045       | RESOLVED   | 동일 판정에서 플레이어별 공개 정보만 결과 통보                                                                                                    | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |

## 구현 단계로 연기한 세부 결정

t0.2 기술 방향은 준비됐지만 다음 항목은 게임 규칙 미정이 아니라 실제 구현·운영 단계에서 증거와 함께 구체화할 세부 계약이다.

| 기존 ID | 상태                                    | 항목                                                                                                                                                                                                         |
| ------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Q-044   | DEFERRED                                | t0.1에서 transaction·idempotency·server seed·revision 원칙은 확정했다. 구현 시 사용할 정확한 PRNG 알고리즘, seed 직렬화와 운영 기록 보존 기간은 테스트와 함께 고정                                           |
| Q-046   | PARTIALLY RESOLVED / REMAINDER DEFERRED | t0.2에서 링크·원문 token 참가, 60분 TTL, create/join/rotate durable rate limit, 자기 작전 복구·재발급·waiting 방 취소를 확정했다. 구현 시 외부 `roomId` 직렬화 형식과 공개 출시용 IP/WAF·CAPTCHA 조정만 고정 |
| Q-047   | DEFERRED                                | 관전 기능                                                                                                                                                                                                    |
| Q-049   | DEFERRED                                | t0.1에서 private Realtime 알림, foreground 3초 polling과 최대 15초 backoff는 확정했다. 구현 시 플레이테스트·비용 측정에 따른 조정값과 재접속 UX를 검증                                                       |
| Q-050   | DEFERRED                                | t0.1에서 데이터 의미, API, private schema와 RLS·직접 접근 거부 계약은 확정했다. 구현 시 정확한 SQL 타입·index·migration과 provider plan 제약을 검증                                                          |
| Q-051   | IN PROGRESS / LOCAL SLICE VERIFIED      | t0.1 목표 모듈 트리와 의존 방향은 확정했다. 현재 scaffold·package lock·생성 경로·패키지 버전·정적 build output과 41 source boundary, 순수 로컬 턴 resolver는 검증했고, 전체 목표 모듈과 권위 서버 통합은 아직 만들지 않았다. |

## 완료 조건

게임 기획·기술 기준 승인과 Phase 0B 착수 상태는 다음과 같다.

- [x] Q-052 시작 좌표 반영
- [x] Q-053 건물 배치 반영
- [x] 활성 게임 규칙 문서 간 충돌 0건
- [x] t0.2 기술 방향과 준비·구현 경계 문서화
- [x] 외부 플러그인 연결과 로컬 환경 상태 감사
- [x] t0.1 기술 권장안 사용자 승인
- [x] UA-001 시스템 Node.js 24.19.0·npm 11.17.0·사용자 전역 pnpm 11.22.0 준비
- [x] A-002·A-003 GitHub private 전환과 문서 전용 최초 `main` push 실행·검증
- [x] UA-002 로컬 GitHub HTTPS 쓰기 인증
- [x] Supabase 기존 빈 `ap-south-1` 프로젝트 사용자 삭제와 서울 `ap-northeast-2` 빈 프로젝트 대체·검증
- [x] Android 태블릿 Chrome 검증 정책 확정
- [x] UA-003 UI 참고 입력 수신·활성 UI/UX 계약 파생
- [x] 로비·HUD·명령 작성·경로·명단 은닉·draft·환경 역할 계약
- [x] Galaxy Tab S9+ 목표 기기와 Q-079 의미 우선 흐름 사용자 확인
- [x] Q-081 가로 전용·세로 orientation gate로 대체 확정
- [ ] UA-006 Galaxy Tab S9+ 정확한 기기 정보 기록 — 첫 실기기 테스트 전
- [x] A-010 v0.6·t0.2 최종 승인 — 2026-08-22
- [x] 사용자 Phase 0B 개발 착수 지시 — 2026-08-22
- [x] `codex/phase-0b-foundation` 앱 스캐폴드·프로젝트 패키지·잠금 파일 생성
- [x] fixture UI·기본 도형 R3F·현재 순수 규칙·test·build·브라우저 foundation slice — **IMPLEMENTED / LOCAL VERIFIED**
- [ ] 물리 Galaxy Tab S9+와 전체 gameplay/server·두 클라이언트 검증 — **NOT TESTED / NOT IMPLEMENTED**
- [ ] A-011 Docker·Local Supabase·Supabase SDK/CLI — **DEFERRED**
