# THE MOLE 문서 허브

> 현재 단계: **PHASE 0B-5 — 3D COMMAND EXECUTION LOCAL VERIFIED**<br>
> 기획 기준 버전: v0.7<br>
> 기술 준비 기준: t0.3<br>
> 기준 승인 상태: **v0.7 + t0.3 USER CONFIRMED — 2026-08-23**<br>
> 소프트웨어 개발 상태: **STARTED — `codex/phase-0b-foundation`**

모든 작업은 먼저 [CURRENT_STAGE.md](./CURRENT_STAGE.md)를 확인한다. v0.7 게임 기획과 t0.3 기술·UI 계약은 사용자의 2026-08-23 최신 지시를 반영한다. 로컬 Next.js 앱, 초록색 점멸 건물 지도 직접 명단 은닉→50초 일반 명령 즉시 저장→10초 배신자 명령→수신자 투영 3D 명령 수행→우측 요원·배신자 카드 결과 5초→자동 다음 턴, 전체 화면 지도·반투명 HUD, 순수 로컬 판정기를 포함한 **Phase 0B-5 3D command execution slice는 IMPLEMENTED / LOCAL VERIFIED**이며 Phase 0B 전체는 서버·두 클라이언트·실기기 범위가 남아 **IN PROGRESS**다. Docker·Local Supabase, 모든 Supabase SDK/CLI·게임 데이터 구성, Vercel 프로젝트/CLI/Preview와 Production은 명시적으로 보류한다. `THE MOLE`은 기획 문서의 내부 가제이고 `PROJECT SPY`는 t0.3 프로토타입 화면 작업명이며, 최종 게임명은 아직 TBD다.

## 상태 표기

| 표기                      | 의미                                   |
| ------------------------- | -------------------------------------- |
| **CONFIRMED**             | 현재 활성 규칙으로 확정                |
| **TBD**                   | 결정되지 않아 후속 입력 필요           |
| **USER INPUT PENDING**    | 사용자가 별도 자료나 값을 제공할 예정  |
| **CANDIDATE**             | 검토 중인 후보                         |
| **DEPRECATED**            | 새 규칙으로 대체된 과거 기획           |
| **NOT STARTED**           | 계획은 있으나 실행하지 않음            |
| **STARTED / IN PROGRESS** | 승인된 범위에서 구현 또는 검증 진행 중 |
| **IMPLEMENTED / LOCAL VERIFIED** | 명시한 로컬 slice를 구현하고 기록된 로컬 검사를 통과. 전체 제품·서버·실기기 완료와는 다름 |
| **NOT IMPLEMENTED / NOT TESTED** | 해당 범위를 아직 만들지 않았거나 대응 환경에서 실행하지 않음 |

## 현재 상태

| 문서                                                | 역할                                            |
| --------------------------------------------------- | ----------------------------------------------- |
| [CURRENT_STAGE.md](./CURRENT_STAGE.md)              | 현재 단계, 완료 항목, 입력 대기, 다음 작업      |
| [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md) | 남은 결정과 과거 질문의 해결 상태               |
| [CHANGELOG.md](./CHANGELOG.md)                      | 기획 기준 버전별 변경 이력                      |
| [CODEX_WORKING_RULES.md](./CODEX_WORKING_RULES.md)  | 비밀값, Git, PR, Preview와 Production 작업 경계 |

## 활성 게임 기획

| 기준 문서                                                        | 단일 소유 범위                                      |
| ---------------------------------------------------------------- | --------------------------------------------------- |
| [PROJECT_VISION.md](./game-design/PROJECT_VISION.md)             | 프로젝트 방향, 세계, 핵심 경험, 승리 구조 요약      |
| [TURN_MODEL.md](./game-design/TURN_MODEL.md)                     | 네 단계 턴, 제한 시간, 실행 순서, 동시 충돌         |
| [ORDERS_AND_ECONOMY.md](./game-design/ORDERS_AND_ECONOMY.md)     | 일반 명령, 비용, 성공률, 자금, 시설 해킹            |
| [GAMEPLAY_SYSTEMS.md](./game-design/GAMEPLAY_SYSTEMS.md)         | 요원 유형, 배신자, 심문·숙청, 사망·충원·재매수      |
| [MAP_AND_INTELLIGENCE.md](./game-design/MAP_AND_INTELLIGENCE.md) | 16×16 격자, 건물, 이동, 수용 인원, 탐지와 정보 공개 |
| [WORLD_MISSIONS.md](./game-design/WORLD_MISSIONS.md)             | 목표 배치, 획득, 운반, 이전, 확보, 승리와 무승부    |

활성 규칙을 찾을 때는 위 여섯 문서를 기준으로 한다. 같은 규칙을 다른 문서에 다시 정의하지 않고 필요한 경우 기준 문서로 연결한다. v0.6은 Q-096에 따라 팀당 K/H/D 3명, 총 6명과 새 스폰 좌표를 사용하며 F와 그 능력은 삭제됐다. Q-053과 Q-068~Q-073의 나머지 맵 규칙은 그대로 유지되고, 시작 좌표와 25개 블록의 건물 배치 Excel을 포함한 P0 맵 입력은 완료됐다. v0.6 전체 게임 기획과 t0.2 기술·UI 기본안은 2026-08-22 사용자 승인을 받았고, 승인된 로컬 Phase 0B 범위에서 개발을 진행한다.

## 활성 기술 준비 t0.2

다음 문서는 승인된 t0.2 기술 기준과 현재 Phase 0B 구현 경계를 소유한다. 게임 규칙보다 우선하지 않으며, 체크박스나 설계가 존재한다는 사실만으로 코드·DB·배포 완료를 뜻하지 않는다.

| 문서                                                                   | t0.2 소유 범위                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [TECHNICAL_READINESS.md](./technical/TECHNICAL_READINESS.md)           | 개발 전 환경·외부 연결·권한·보안 상태와 Go/No-Go 게이트                              |
| [ARCHITECTURE.md](./technical/ARCHITECTURE.md)                         | Next.js + TypeScript, React Three Fiber, Vercel, Supabase 책임과 1대1 서버 권위 경계 |
| [DATA_AND_API.md](./technical/DATA_AND_API.md)                         | 닉네임, 방·경기 상태, 비밀 정보, API·Realtime·RLS 준비 계약                          |
| [UI_UX_CONTRACT.md](./technical/UI_UX_CONTRACT.md)                     | 로비·HUD·명령 흐름, 시각 토큰, 반응형, 입력과 접근성의 활성 제품 계약                |
| [PRESENTATION.md](./technical/PRESENTATION.md)                         | PC·태블릿 3D 보드, 단순 도형 데모와 입력·성능·접근성 준비                            |
| [IMPLEMENTATION_BLUEPRINT.md](./technical/IMPLEMENTATION_BLUEPRINT.md) | 현재 Phase 0B와 후속 단계가 사용하는 폴더·모듈·테스트 경계                           |
| [MVP_ROADMAP.md](./production/MVP_ROADMAP.md)                          | Phase 0A 기술 준비와 실제 구현 단계의 분리                                           |
| [CODEX_WORKING_RULES.md](./CODEX_WORKING_RULES.md)                     | 비밀값 금지, `codex/*` 브랜치, Draft PR, Preview·Production 권한 경계                |

현재 연결·환경·승인 요약:

- GitHub·Vercel·Supabase Codex 플러그인: 설치·인증 확인
- GitHub `nvunwoo/Project-Spy`: **PRIVATE** 전환과 승인된 문서·보호장치 전용 최초 `main` 기준선 게시·원격 commit 검증 완료
- GitHub CLI 2.97.0: 설치 완료. 로컬 자격 증명 저장소의 `nvunwoo` 인증과 Git HTTPS 사용을 검증
- 후속 Preview integration 승인 뒤 사용자 요청 범위의 `codex/*` 커밋·push·Draft PR·Vercel Preview 자동화 정책 승인. 현재 Vercel project·CLI·Git Integration·Preview 실행은 보류하며 새 개발을 임의로 시작하는 권한도 아님
- `main` merge와 Production deploy·promote·alias 변경·rollback·Production DB migration: 각각 매번 별도 사용자 승인
- Vercel `nvunwoo's projects`: 사용 팀 승인·연결됨, `Project-Spy` 프로젝트 없음
- Supabase `Endurance Games` Free: 플러그인 연동 때 사용자가 만든 비어 있는 `ap-south-1` 프로젝트는 사용자가 삭제했고, 월 0달러 비용 확인과 명시적 승인 뒤 같은 이름의 대체 프로젝트를 서울 `ap-northeast-2`에 생성해 `ACTIVE_HEALTHY`를 검증. public table 0개, migration 0개
- Supabase 미설정 범위: 게임용 schema·table·RLS·function, Anonymous Auth 설정, private Realtime channel·policy, 앱용 key 선택·회수와 환경·애플리케이션 연결. 플랫폼 자동 제공 endpoint·key 값은 조회·기록·연결하지 않음
- 로컬 저장소: 최초 `main` 기준선과 원격 추적 설정 완료. 이후 변경은 `codex/*`·Draft PR 정책 사용
- 시스템 개발 도구: Node.js 24.19.0, npm 11.17.0, 사용자 전역 pnpm 11.22.0과 지속 PATH를 새 프로세스에서 검증 완료
- 로컬 앱: `codex/phase-0b-foundation`에서 Next.js·TypeScript·React Three Fiber 앱, fixture 로비·HUD·Q-079, 전체 화면 지도·반투명 HUD, 절대 마감 기반 50초·10초·5초 countdown과 자동 `WAIT`·`ACQUIESCE`, 지도 직접 명단 은닉부터 여러 턴까지의 로컬 플레이, 결정적 seed 재시작, BLUE 투영 3D 실행 cue와 우측 카드 결과, 순수 domain/map/order/RNG/턴 판정과 allowlist projection slice를 구현하고 로컬 검증 완료
- 로컬 검증: lint·typecheck·format·`git diff --check`, 44개 source boundary, Vitest 14파일·80테스트, 정적 `/` Next production build, Playwright 1440×900·1280×800·1024×640 landscape와 800×1280 portrait gate에서 11개 통과/의도된 skip 17개, 로컬 브라우저 page exception·console error와 `THREE.Clock` deprecation warning 0건
- 미검증·미구현: 물리 Galaxy Tab S9+의 터치·S Pen·WebGL2·성능, 전체 gameplay/server/persistence·두 클라이언트 흐름. 자동화 viewport 결과를 실기기 통과로 해석하지 않음
- Local backend 전제 도구: Docker·Podman·Supabase CLI는 현재 없음. 사용자 지시에 따라 Docker·Local Supabase와 모든 Supabase SDK/CLI·앱 연결은 보류
- 실제 태블릿 검증: Android Chrome. 최소 Android 12+ OEM 지원/current 또는 previous Chrome/WebGL2/RAM 4GB+, 권장 Android 14+/RAM 6GB+. Android 10·11 best-effort, in-app WebView 미지원
- 저장소 보호장치: `AGENTS.md`, `.gitignore`, `.gitattributes`, `.nvmrc`, 비밀값은 비어 있고 비민감 기본값만 있는 `.env.example`, Draft PR 템플릿과 준비 진단 스크립트 생성 완료
- UI 참고 입력: 원문은 [PROJECT_SPY_UI_DESIGN_SOURCE.md](./reference/ui/PROJECT_SPY_UI_DESIGN_SOURCE.md)에 비권위 자료로 보존하고, 승인 가능한 파생 계약만 [UI_UX_CONTRACT.md](./technical/UI_UX_CONTRACT.md)가 소유
- 대상 기기: Galaxy Tab S9+로 사용자 확인 완료. 게임은 가로 전용이며 세로에서는 CSS 회전이나 gameplay reflow 없이 조작을 막는 방향 전환 안내만 표시. 정확한 모델 코드·OS·RAM·Chrome·CSS viewport·DPR은 첫 실기기 검증 전 보완
- Supabase 역할: 기존 서울 프로젝트는 Production-reserved 빈 컨테이너, Local은 로컬 스택, Preview는 추후 명시 승인된 별도 프로젝트

## 기준 우선순위

규칙이 충돌하면 다음 순서로 판단한다.

1. 사용자의 가장 최근 명시적 지시
2. v0.6 활성 게임 기획 문서
3. 해결 상태가 기록된 미결정 사항 등록부
4. 기술 준비 t0.2 문서
5. 루트의 분할 전 v0.1 스냅샷

루트의 [THE_MOLE_GAME_DESIGN_PREP.md](../THE_MOLE_GAME_DESIGN_PREP.md)는 과거 내용 비교를 위한 비권위 스냅샷이다.

## 최신화 규칙

기획을 변경할 때 다음 문서를 한 작업 단위로 함께 확인한다.

1. 변경 대상 도메인의 활성 기준 문서
2. [CURRENT_STAGE.md](./CURRENT_STAGE.md)
3. [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md)
4. 이 문서의 문서 지도
5. [CHANGELOG.md](./CHANGELOG.md)

후보를 확정 규칙으로 기록하지 않는다. 사용자가 변경한 최신 규칙이 기존 내용과 충돌하면 최신 규칙을 적용하고 대체 사실을 변경 이력에 남긴다.

## 개발 착수 기록과 현재 게이트

사용자는 2026-08-22에 v0.6 게임 기획과 t0.2 기술·UI 기본안을 전체 승인하고 Phase 0B 착수를 명시했다. 다음 착수 조건은 충족됐다.

- 요원 시작 좌표 확정
- 건물 배치 Excel 반영
- 활성 기획 문서 간 충돌 제거
- 남은 핵심 기획 결정 정리
- [완료] 시스템 Node.js 24.19.0·npm 11.17.0과 Codex 캐시가 아닌 사용자 전역 pnpm 11.22.0 사용 가능
- [완료] GitHub CLI 2.97.0 설치와 로컬 자격 증명 저장소의 `nvunwoo` HTTPS 쓰기 인증 확인
- [완료] PRIVATE 저장소의 문서·보호장치 전용 최초 `main` 기준선 게시와 원격 commit 확인
- [완료] UI 참고 문서·스크린샷을 활성 UI/UX 계약으로 반영
- [완료] 명단 은닉·일반 명령 draft·팀 배정·경로 선택·환경 역할의 기술 공백 해소
- [완료] t0.2 기본안에 대한 사용자 최종 승인
- [완료] v0.6 게임 기획에 대한 사용자 최종 승인
- [완료] Phase 0B 개발 착수 지시
- [보류] Docker Desktop 설치·검증, Local Supabase와 Supabase CLI/SDK — A-011 또는 후속 범위 승인 전 수행하지 않음
- [보류] Vercel project/CLI/Git Integration/Preview와 별도 Preview Supabase — 후속 명시 승인 전 수행하지 않음
- [보류] `main` merge, Production DB 변경과 Production 배포 — 각각 별도 승인 필요

Galaxy Tab S9+의 정확한 모델 번호·Android 버전·RAM·Chrome 버전은 첫 실기기 검증 전 후속 입력이며 로컬 부트스트랩을 막지 않는다. 세로 viewport는 지원 gameplay가 아니라 방향 전환 차단 화면만 검증한다. 기존 서울 Supabase 프로젝트는 Production-reserved 빈 컨테이너로 유지하며 Local·Preview 앱에 연결하거나 스키마를 적용하지 않는다. 문서·보호장치 전용 최초 `main` 커밋·push는 Phase 0A에서 별도로 승인된 일회성 저장소 초기화다. 현재 구현은 `codex/phase-0b-foundation`에 한정하며 Draft PR도 `main` merge나 Production 배포 승인이 아니다.
