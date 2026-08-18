# 개발 전 기술 준비 기준

> 문서 상태: **ACTIVE — t0.1 기술 준비 단일 기준**  
> 기술 준비 기준: t0.1  
> 게임 기획 기준: v0.5  
> 최종 갱신: 2026-08-18  
> 사용자 승인 상태: **APPROVED — PREPARATION COMPLETE**  
> 소프트웨어 개발 상태: **NOT STARTED**

이 문서는 실제 개발을 시작하기 전에 기술 선택, 외부 계정 연결, 권한, 보안 경계와 검증 조건을 한곳에서 추적한다. 게임 규칙은 [문서 허브](../README.md)의 여섯 활성 v0.5 게임 기획 문서가 소유하며, 기술 구조는 [ARCHITECTURE.md](./ARCHITECTURE.md), 데이터와 API는 [DATA_AND_API.md](./DATA_AND_API.md)가 소유한다.

현재 단계에서 사용자는 t0.1 권장안, 로컬 개발 전제 도구, 한정된 저장소 초기화, 외부 서비스 조회와 빈 Supabase 프로젝트 컨테이너의 1회성 서울 리전 대체를 승인했다. 이 승인은 Next.js 앱, 프로젝트 패키지, 데이터베이스 스키마·Auth·Realtime 구성, Vercel 프로젝트, 소스 코드, 3D 에셋이나 배포 결과가 존재하거나 개발이 시작됐다는 뜻이 아니다.

## 현재 준비 범위

### 이번 단계에서 수행한다

- PC와 태블릿을 대상으로 하는 3D 웹게임 기술 계약을 확정한다.
- 1대1 링크 초대, 익명 인증과 경기 전 닉네임 계약을 확정한다.
- 서버 권위, 비밀 정보 분리, 트랜잭션, 멱등성과 동기화 계약을 확정한다.
- GitHub, Vercel과 Supabase의 계정·조직·프로젝트·권한 상태를 확인한다.
- Codex가 향후 안전하게 커밋, Preview 배포와 Production 배포를 수행할 전달 정책을 준비한다.
- 향후 기본 도형 데모를 실제 GLB 모델로 교체할 수 있는 3D 경계를 확정한다.
- 구현 착수 전 Go/No-Go 조건과 미래 검증 매트릭스를 정한다.
- 시스템 Node.js·npm·사용자 전역 pnpm을 준비하고 읽기 전용 진단으로 검증한다.
- 승인된 GitHub private 전환과 문서 전용 최초 `main` 커밋·push를 수행·검증한다.
- Supabase 조직·프로젝트·리전과 예상 비용을 읽기 전용으로 확인한다.
- 사용자가 명시적으로 승인한 빈 Supabase 프로젝트 컨테이너의 `ap-south-1` 삭제·서울 `ap-northeast-2` 대체·상태 검증을 1회 수행한다.

### 이번 단계에서 수행하지 않는다

- `package.json`, lockfile, Next.js 앱과 소스 폴더 생성
- 프로젝트 `package.json`·lockfile 생성과 애플리케이션 패키지 설치
- 명시 승인된 1회성 서울 프로젝트 대체를 제외한 Supabase 프로젝트 삭제·재생성·추가 생성·연결 변경
- Supabase 스키마, 테이블, RLS 정책, API, Auth, Realtime, 키, 환경변수, SQL 함수와 마이그레이션 생성
- Vercel 프로젝트 생성, 환경 변수 등록과 Preview·Production 배포
- 승인된 문서 전용 최초 `main` 커밋·push 외의 코드-bearing 커밋, Pull Request와 branch protection 변경
- 기본 도형 건물·캐릭터, 게임 로직, API와 테스트 코드 작성
- 최종 UI, 카메라, 색상, 타이포그래피와 3D 모델 제작

위 작업은 각각 사용자의 외부 변경 승인 또는 별도의 명시적인 개발 착수 지시가 있어야 시작한다.

## 확정된 제품 기술 요구사항

- 플랫폼은 PC와 태블릿 웹 브라우저다.
- 플레이 형태는 링크를 통한 1대1 온라인 대전이다.
- 게임 시작 또는 방 참가 전에 닉네임을 지정한다.
- 도시는 16×16 논리 격자를 체스판 같은 3D 보드로 표현한다.
- 최초 데모의 건물과 캐릭터는 Three.js 기본 도형을 사용한다.
- 캐릭터 이동은 자유 이동이나 실시간 Transform 동기화가 아니라 확정된 논리 경로를 3D에서 재생한다.
- 향후 캐릭터와 건물 표현을 GLB/glTF 모델로 교체해도 게임 규칙 계층은 바뀌지 않아야 한다.
- 마우스와 터치가 같은 게임 기능에 접근할 수 있어야 하며 hover만으로 필요한 기능을 제공하지 않는다.
- 구체적인 UI 배치, 카메라, 색상과 미술 스타일은 다음 사용자 UI 가이드까지 유보한다.

## 확정 기술 스택

| 영역 | 확정 선택 | 선택 상태 | 실제 세팅 상태 |
| --- | --- | --- | --- |
| 언어 | TypeScript | **CONFIRMED** | **NOT CREATED** |
| 런타임 | Node.js 24.x LTS | **CONFIRMED** | **INSTALLED / VERIFIED — 24.19.0** |
| Node 패키지 도구 | npm | **CONFIRMED** | **INSTALLED / VERIFIED — 11.17.0** |
| 패키지 관리자 | pnpm 11.x | **CONFIRMED** | 사용자 전역 **INSTALLED / VERIFIED — 11.22.0**, 프로젝트 고정 **NOT CREATED** |
| 웹 프레임워크 | Next.js App Router + React | **CONFIRMED** | **NOT CREATED** |
| 3D | React Three Fiber + Three.js + Drei | **CONFIRMED** | **NOT INSTALLED** |
| 3D 에셋 | GLB / glTF | **CONFIRMED** | **NO ASSETS** |
| 웹 호스팅·서버 | Vercel + Next.js Route Handlers | **CONFIRMED** | 계정 연결만 **VERIFIED** |
| 서버 런타임 | Vercel Node.js Functions | **CONFIRMED** | 프로젝트 **NOT CREATED** |
| 데이터베이스 | Supabase PostgreSQL | **CONFIRMED** | 서울 빈 프로젝트 컨테이너 **CREATED / VERIFIED**, 스키마 **NOT CONFIGURED** |
| 인증 | Supabase Anonymous Auth | **CONFIRMED** | 프로젝트 컨테이너만 준비, **NOT CONFIGURED** |
| 변경 알림 | Supabase Private Realtime Broadcast `state_changed` | **CONFIRMED** | **NOT CONFIGURED** |
| 동기화 폴백 | 서버 상태 재조회 Polling | **CONFIRMED** | **NOT IMPLEMENTED** |
| 저장소 | GitHub | **CONFIRMED** | PRIVATE·로컬 CLI 인증·최초 `main` 기준선 **EXECUTED / VERIFIED** |

설치할 패키지의 정확한 버전은 구현 착수 시점에 공식 문서와 호환성을 다시 확인하고 고정하며 lockfile을 커밋한다. `latest` 범위를 장기 계약으로 사용하지 않는다.

## 현재 외부 연결과 로컬 프로그램 상태

2026-08-18 확인 및 명시적으로 승인된 준비 작업의 실행 결과다.

| 대상 | 현재 상태 | 해석 |
| --- | --- | --- |
| GitHub Codex 연결 | **AUTHENTICATED / VERIFIED** | `nvunwoo/Project-Spy`에 admin·push 권한이 있다. |
| GitHub 저장소 | **PRIVATE / INITIAL MAIN VERIFIED** | `nvunwoo/Project-Spy`의 PRIVATE 가시성, 최초 `main` 기준선과 원격 commit을 검증했다. 이후 직접 `main` push 권한으로 확대하지 않는다. |
| 로컬 Git | **AVAILABLE / AUTHENTICATED / VERIFIED** | GitHub CLI 2.97.0, Windows keyring의 `nvunwoo` 인증, HTTPS Git 프로토콜과 최초 push 성공을 검증했다. |
| Vercel Codex 연결 | **AUTHENTICATED / VERIFIED** | 사용자 팀을 조회할 수 있다. |
| Vercel 팀 | **APPROVED / VERIFIED** | `nvunwoo's projects`를 사용할 팀으로 확정했다. |
| Vercel Project-Spy 프로젝트 | **NOT CREATED / DEVELOPMENT GATED** | 팀 승인이 프로젝트 생성이나 Git 연결 승인을 의미하지 않는다. |
| Supabase Codex 연결 | **AUTHENTICATED / VERIFIED** | `Endurance Games` 조직을 조회할 수 있다. |
| Supabase 기존 Project-Spy | **USER-DELETED / VERIFIED** | 사용자가 플러그인 연동 중 만든 빈 `ap-south-1` 프로젝트는 사용자가 삭제했고 후속 조회에서 제거를 확인했다. |
| Supabase 서울 Project-Spy | **CREATED / ACTIVE_HEALTHY / VERIFIED** | 사용자가 월 0달러 비용을 확인하고 명시적으로 승인한 후 `Endurance Games` Free의 서울 `ap-northeast-2`에 2026-08-18T06:48:01Z 생성했다. public table 0개, migration 0개다. |
| Supabase 데이터·연결 구성 | **NOT CONFIGURED / DEVELOPMENT GATED** | 스키마·테이블·RLS·API·Auth·Realtime·키·환경변수는 생성·연결하지 않았다. |
| 시스템 Node.js / npm | **INSTALLED / VERIFIED** | Node.js 24.19.0과 npm 11.17.0. 지속 PATH를 반영한 새 프로세스에서 준비 진단을 통과했다. |
| 사용자 전역 pnpm | **INSTALLED / VERIFIED** | pnpm 11.22.0. Codex 번들이 아닌 사용자 전역 설치를 준비 진단에서 확인했다. |
| Codex 번들 Node.js / pnpm | **AVAILABLE FOR TOOLING** | 문서·검사 용도 런타임이며 사용자 개발환경이나 프로젝트가 생성됐다는 뜻은 아니다. |
| GitHub CLI / Vercel CLI | GitHub CLI **INSTALLED / VERIFIED — 2.97.0**, Vercel CLI **NOT REQUIRED** | 로컬 GitHub 인증·push에 GitHub CLI를 사용한다. Vercel CLI는 현재 준비 범위에서 설치하지 않았다. |

연결 ID, 토큰, 키, DB 비밀번호와 서비스 역할 비밀값은 이 문서에 기록하지 않는다. 서울 프로젝트 컨테이너 대체는 사용자가 명시적으로 승인한 1회성 기술 준비 예외다. 이를 추가 프로젝트 변경, DB·Auth·Realtime·키·환경 구성 승인으로 확대하지 않는다.

## 외부 환경 경계

| 환경 | 용도 | Git 기준 | Vercel | Supabase | 현재 상태 |
| --- | --- | --- | --- | --- | --- |
| Local | 개발과 자동 테스트 | 작업 브랜치 | `vercel dev`는 향후 후보 | 로컬 스택 또는 별도 개발 프로젝트는 향후 결정 | **NOT CREATED** |
| Preview | Pull Request별 통합 검증 | `codex/*` Pull Request | 자동 Preview 권장 | Preview 전용 프로젝트 또는 브랜치는 비용·플랜 확인 후 결정 | **NOT CREATED** |
| Production | 사용자 승인된 배포 | `main` | `main` merge 후 배포 권장 | 서울 빈 프로젝트 컨테이너 준비, 환경 역할·데이터 구성 미지정 | **PROJECT CONTAINER ONLY / NOT CONFIGURED** |

Preview와 Production은 데이터, 비밀키와 콜백 URL을 공유하지 않는다. 개발용 publishable key조차 Production에 재사용하지 않는다.

## 확정 전달 및 배포 정책

다음은 Codex 자동화를 위한 t0.1 확정 정책이다. 승인, 실행과 검증을 분리한다. 사용자는 문서 전용 최초 `main` push와 향후 요청 범위 안의 비-production 자동 전달을 승인했지만, 이 정책은 Codex가 새 개발 작업을 스스로 시작할 권한이 아니다.

1. 원격 저장소의 private 전환과 문서·저장소 보호장치만 포함한 초기 `main` 커밋·push를 실행하고 원격 commit을 검증했다.
2. 이후 작업은 `codex/*` 브랜치에서 수행한다.
3. Codex는 요청 범위만 커밋하고 사용자 파일과 비밀값을 포함하지 않는다.
4. 원격 push 뒤 Draft Pull Request를 열어 변경 범위와 검증 결과를 기록한다.
5. Vercel Git Integration은 Pull Request마다 Preview를 생성한다.
6. 정적 검사, 자동 테스트와 두 플레이어 브라우저 검증이 통과해야 merge할 수 있다.
7. `main` 병합, Production 배포, promote, Production alias 변경, rollback과 Production DB migration은 각각 실행 직전에 별도의 명시적 사용자 승인을 받는다.
8. `main` 병합 승인은 Production 배포 승인으로 간주하지 않으며 Preview 성공도 두 작업 중 어느 것도 승인하지 않는다.
9. Production 배포는 별도 승인을 받은 `main`의 검증된 커밋에서만 생성한다.
10. 배포 실패 시 원인과 검증 범위를 보고하며 임의로 이전 변경을 삭제하지 않는다.

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

## 향후 검증 매트릭스

실제 구현 후 다음 검증을 구분해서 수행한다.

### 정적·단위 검증

- TypeScript typecheck
- lint와 format 검사
- 순수 규칙 Resolver 단위 테스트
- 16×16 맵 좌표, 건물·공항·항구 이동과 셀 수용량 테스트
- 난수 seed 재현, 멱등성, 중복 Resolve와 transaction rollback 테스트
- 닉네임 Unicode·grapheme·중복 검증 테스트
- 플레이어별 projection 누출 테스트

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

정확한 Android 태블릿 모델·Android 버전·RAM·Chrome 버전은 첫 실기기 테스트 전에 기록한다. iPadOS Safari는 지원 대상으로 별도 확정하고 실기기 또는 원격 실기기 증거를 확보하기 전에는 검증 완료로 표시하지 않는다. 정확한 세로·가로 레이아웃은 UI 가이드와 구현 착수 시점의 지원 정책에서 최종 확정한다.

## UI 가이드까지 유보하는 항목

- 최종 카메라 각도, 줌, 회전과 카메라 제스처
- 태블릿 세로·가로 화면의 구체적인 레이아웃
- 색상, 타이포그래피, 아이콘, 패널 위치와 정보 밀도
- 건물·체스 말·캐릭터의 최종 미술 스타일과 재질
- Walk 외의 상세 애니메이션, 연출 속도, 사운드와 자막
- 최종 GLB 모델의 폴리곤·텍스처 예산

유보 항목은 시각 결정을 미룬다는 뜻이며 닉네임, 방 참가, 마우스·터치 기능 동등성, 오류·대기 상태, 비밀 정보 분리와 반응형 동작까지 미룬다는 뜻은 아니다.

## 사용자 승인 또는 입력이 필요한 항목

- [x] `nvunwoo/Project-Spy`를 기준 저장소로 사용
- [x] 현재 public인 저장소를 pre-alpha 동안 private으로 전환
- [x] 문서·보호장치 전용 초기 `main` 커밋과 원격 push 실행 승인
- [x] 향후 사용자가 요청한 범위 안에서 `codex/*` 커밋·push·Draft PR·Vercel Preview 자동 수행
- [x] `main` merge와 각 Production 변경을 매번 별도 승인받는 경계
- [x] Vercel 팀으로 `nvunwoo's projects` 사용
- [ ] Vercel `Project-Spy` 프로젝트 생성 — **DEVELOPMENT GATED**
- [x] Supabase `Endurance Games` Free 조직과 향후 서울 `ap-northeast-2` 리전 사용
- [x] Supabase 신규 프로젝트 예상 비용 조회 — 확인 시점 월 0달러
- [x] 기존 빈 `ap-south-1` 프로젝트의 사용자 삭제·서울 리전 대체 승인 및 실행
- [x] 서울 `ap-northeast-2` Supabase 빈 프로젝트 생성·`ACTIVE_HEALTHY`·public table 0개·migration 0개 검증
- [ ] Supabase 스키마·Auth·Realtime·키·환경변수 구성 — **DEVELOPMENT GATED**
- [x] Preview와 Production의 Supabase 환경 분리 원칙 승인 — 실제 프로젝트 구성은 개발 게이트
- [x] 시스템 Node.js 24.19.0·npm 11.17.0과 사용자 전역 pnpm 11.22.0 설치·검증
- [x] 실제 태블릿 지원 검증 장치를 Android Chrome으로 확정
- [ ] 실제 Android 태블릿의 모델·OS·RAM·Chrome 버전 제공
- [ ] 다음 UI 가이드 제공

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
- [x] PC·태블릿 기능 기준과 UI 유보 경계
- [x] `codex/*` → 검증 → Draft PR → Vercel Preview 전달 정책
- [x] 사용자 승인 또는 `main` merge 전 Production 금지 정책

### 외부 세팅 게이트

- [x] GitHub 플러그인 인증 확인
- [x] Vercel 플러그인 인증 확인
- [x] Supabase 플러그인 인증 확인
- [x] GitHub 기준 저장소·private 전환·문서 전용 초기 `main` push 승인
- [x] GitHub private 전환 실행 및 원격 가시성 검증
- [x] 초기 커밋·원격 `main` 실행 및 commit 검증 — **THIS BASELINE**
- [x] GitHub CLI 2.97.0·Windows keyring `nvunwoo`·HTTPS Git 인증 검증
- [ ] Vercel Project-Spy 프로젝트와 Git Integration
- [x] Supabase 조직·서울 목표 리전과 월 0달러 예상 비용 조회
- [x] 기존 빈 Supabase `ap-south-1` 프로젝트의 사용자 삭제 확인
- [x] 서울 Supabase Project-Spy 빈 프로젝트 컨테이너 생성·상태 검증
- [ ] Supabase 스키마·Auth·Realtime·키·환경 구성 및 Preview·Production 분리 — **DEVELOPMENT GATED**
- [ ] Vercel 환경 변수와 서버 전용 secrets

### 개발 착수 게이트

- [x] 사용자에게 기술 준비 문서 t0.1 권장안 승인 받음
- [x] Supabase 비용 조회 승인 받음
- [x] Supabase 서울 빈 프로젝트 컨테이너 대체 승인 및 실행·검증
- [ ] Vercel 외부 프로젝트 생성 승인 받음
- [ ] 사용자가 실제 소프트웨어 개발 착수를 명시함

외부 프로젝트·데이터 구성의 필요 승인과 명시적 개발 착수 지시가 완료되기 전에는 기술 준비가 끝나더라도 소프트웨어 상태를 `STARTED`로 변경하지 않는다.

## 공식 기술 참고

- [Node.js 다운로드 — 24.x LTS 선택](https://nodejs.org/en/download/)
- [pnpm 설치 — Windows에서는 Node.js 설치 뒤 npm 방식 권장](https://pnpm.io/installation)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
