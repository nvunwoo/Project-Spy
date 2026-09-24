# 데모 MVP 범위와 향후 개발 순서

> 문서 상태: 활성 개발 로드맵<br>
> 기획 기준 버전: v0.6<br>
> 기술 준비 기준: t0.2<br>
> 최종 갱신: 2026-08-23<br>
> 실행 상태: **PHASE 0B-4 — LOCAL REPLAY & TRAINING UX VERIFIED**<br>
> 현재 단계: [PHASE 0B-4 — LOCAL REPLAY & TRAINING UX VERIFIED](../CURRENT_STAGE.md)

이 문서는 개발 전 준비와 실제 구현을 의도적으로 분리한 로드맵이다. Phase 0A의 조사·문서·연결 확인 체크는 실제 프로젝트나 기능 구현을 뜻하지 않는다. 사용자는 2026-08-22에 v0.6 게임 기획·t0.2 기술/UI 기본안을 최종 승인하고 Phase 0B 착수를 명시했다. Phase 0B 이후의 체크박스는 실제 파일 생성·구현·검증 증거가 있는 항목만 완료 처리한다.

## 개발 착수 조건 — 완료

- [x] 핵심 턴과 명령 원칙 확정
- [x] 요원과 배신자의 핵심 원칙 확정
- [x] 자금과 시설의 핵심 효과 확정
- [x] 25개 블록·100개 건물 부지와 명명 시설·일반 건물 인벤토리 확정
- [x] 정보 공개의 핵심 원칙 확정
- [x] 목표와 승리의 핵심 원칙 확정
- [x] 경계 규칙 Q-054~Q-067 확정 및 기준 문서 반영
- [x] RED·BLUE K/H/D 요원의 실제 시작 좌표 반영
- [x] 공항·항구의 각 4칸 면적을 포함한 `MAP.xlsx` 배치 반영
- [x] 시작 좌표·건물 배치와 v0.6 활성 게임 규칙의 최종 일관성 감사
- [x] PC·태블릿 3D 웹게임 기술 기준 t0.2 문서화
- [x] 개발 준비와 실제 구현 체크박스 분리
- [x] t0.1 기술 권장안과 한정된 저장소 초기화 사용자 승인 — 이력 보존
- [x] 사용자 UI 참고 문서·세 스크린샷을 비권위 자료로 분리하고 [UI/UX 계약](../technical/UI_UX_CONTRACT.md)에 t0.2 파생 기준 반영
- [x] 로비·명단 은닉·HUD·명령 작성기·비공개 draft·사건 replay·R3F 입력 bridge의 구현 경계 확정
- [x] 목표 기기를 Galaxy Tab S9+로 사용자 확인하고 정확한 모델·OS·viewport 기록은 실기기 통과 게이트로 분리
- [x] t0.2 기술·UI 기본안 사용자 최종 승인 — 2026-08-22
- [x] 사용자 v0.6 최종 기획 승인 — 2026-08-22
- [x] 사용자 Phase 0B 개발 착수 지시 — 2026-08-22

## Phase 0A — 기술 준비만 수행

이 단계에서는 기술 결정, 로컬 전제 도구, 읽기 전용 외부 감사와 저장소 보호장치를 준비한다. 사용자가 별도로 승인한 GitHub private 전환·문서와 보호장치 전용 최초 `main` 커밋·push, 그리고 비어 있는 서울 Supabase 프로젝트 컨테이너 준비만 예외로 허용한다. 코드·앱 패키지·DB 스키마·Auth·Realtime·키·환경변수·Vercel 프로젝트·PR·배포는 만들지 않는다.

- [x] 목표 플랫폼을 PC·태블릿 웹으로 확정
- [x] 데모 표현을 3D 체스판형 도시, 단순 도형 건물·캐릭터로 확정
- [x] Next.js + TypeScript, React Three Fiber, Vercel, Supabase 기준 유지
- [x] 1대1 멀티플레이, 서버 권위 판정, 시작 전 닉네임 입력의 기술 요구사항 문서화
- [x] GitHub·Vercel·Supabase Codex 플러그인 설치·인증 확인
- [x] GitHub 커넥터의 `nvunwoo/Project-Spy` admin·push 권한 확인
- [x] Vercel 팀과 Supabase 조직 접근 확인
- [x] 로컬 Git·브라우저·편집기와 누락된 런타임 감사
- [x] `codex/*` → 검증 → Draft PR → Vercel Preview 흐름과 Production 금지 경계 정의
- [x] 루트 `AGENTS.md`와 `.gitignore`·`.gitattributes` 저장소 보호장치 준비
- [x] Node.js 24 기준 `.nvmrc`와 비밀값 없이 이름만 둔 `.env.example` 준비
- [x] Draft PR 체크 템플릿과 `scripts/verify-development-readiness.ps1` 진단 스크립트 준비. 기본 실행은 core app 도구, `-RequireLocalSupabase`는 Docker daemon과 project CLI를 별도 검증
- [x] 사용자 시스템 Node.js 24.19.0·npm 11.17.0과 사용자 전역 pnpm 11.22.0 설치·지속 PATH·준비 진단 검증
- [x] `nvunwoo/Project-Spy` 기준 저장소, pre-alpha private 전환과 문서 전용 최초 `main` push 승인
- [x] GitHub `nvunwoo/Project-Spy` **PRIVATE** 전환 및 검증
- [x] 문서 전용 최초 `main` commit·push 실행 및 원격 commit 검증 — 이 문서가 해당 기준선에 포함됨
- [x] 향후 사용자 요청 범위의 `codex/*` → Draft PR → Vercel Preview 자동 전달 정책 승인
- [x] `main` merge와 각 Production 변경의 매회 별도 승인 정책 확정
- [x] GitHub CLI 2.97.0 설치와 로컬 자격 증명 저장소의 `nvunwoo` HTTPS 쓰기 인증 검증
- [x] Vercel `nvunwoo's projects` 팀 승인·확인
- [x] Supabase `Endurance Games` Free·서울 `ap-northeast-2`와 신규 프로젝트 월 0달러 예상 비용 조회
- [x] 기존 Supabase `Project-Spy`의 `ap-south-1`·`ACTIVE_HEALTHY`·public table 0·migration 0 불일치 확인
- [x] 사용자가 기존 `ap-south-1` 프로젝트의 생성 경위와 보호할 데이터가 없음을 확인하고 직접 삭제
- [x] 월 0달러 비용 확인과 명시적 승인 뒤 `Endurance Games`의 대체 `Project-Spy`를 서울 `ap-northeast-2`에 생성하고 `ACTIVE_HEALTHY`·public table 0·migration 0 검증
- [x] Supabase public table 0개·migration 0개를 확인하고 게임용 schema·RLS·function, Anonymous Auth 설정, private Realtime policy와 앱 key/env 연결이 미구성임을 기록. 플랫폼 자동 제공 key 값은 조회·기록하지 않음
- [x] Local Supabase 전제 감사에서 Docker·Podman·Supabase CLI 미설치를 확인하고 Docker Desktop + project devDependency CLI를 권장 기본안으로 기록
- [x] 실제 태블릿 검증 장치를 Android Chrome으로 확정
- [x] 서울 `ap-northeast-2` 프로젝트를 **Production-reserved 빈 컨테이너**로 지정하고 Local·Preview 연결 금지
- [x] Local은 개발 착수 뒤 로컬 Supabase stack, Preview는 별도 승인 뒤 별도 Supabase 프로젝트를 사용하도록 환경 역할 분리
- [x] Galaxy Tab S9+를 사용자 확인 목표 태블릿으로 기록하고 CSS viewport·DPR·방향·분할 화면 기반 검증 계약 확정
- [ ] Galaxy Tab S9+의 정확한 모델 번호·Android 버전·RAM·Chrome 버전 기록
- [x] 사용자 UI 가이드 수신과 시각 계약 반영
- [x] 디자인 토큰·Geist/Pretendard font·가로 전용·세로 orientation gate·48×48 CSS px 터치·키보드/포인터/터치 동등 경로 확정
- [x] 명단 은닉 setup, RED/BLUE 서버 무작위 배정, 소유자 전용 general draft와 상대 잠금 timing 비노출 계약 확정
- [x] t0.2 기술·UI 기본안 사용자 최종 승인 — 2026-08-22
- [x] 사용자 v0.6 최종 기획 승인 — 2026-08-22
- [x] 사용자 Phase 0B 개발 착수 지시 — 2026-08-22

## 데모에 필요한 게임 기능

### 경기와 턴

- [ ] 게임 시작 전 닉네임 입력·검증·확정 단계
- [ ] 1대1 방 생성과 참가
- [ ] 사용자별 private active-game claim으로 waiting·setup·active 작전 하나만 허용하고 cancel·finish 때 원자 해제
- [ ] 경기 초기화 때 서버가 RED / BLUE를 50:50으로 한 번만 무작위 배정
- [ ] 첫 일반 명령 전 양측 명단 은닉 위치 비공개 선택, 동일 시설 충돌 시 상대 위치 비노출 재선택
- [ ] 네 단계 턴 진행
- [ ] 일반 명령 40초, 완성된 요원별 비공개 서버 draft와 미지정 요원 자동 대기
- [ ] 배신자 명령 10초와 자동 묵인
- [ ] 확정 즉시 명령 잠금
- [ ] 정보 권한별 결과 통보

### 맵과 요원

- [ ] 16×16 격자
- [ ] 25개의 2×2 건물 블록과 총 100개 건물 부지 배치
- [ ] 이름이 있는 시설 25개가 차지하는 31칸과 일반 건물 69칸 판정
- [ ] 고정 도로·C 블록 시설과 검증을 통과한 A·B 블록 무작위 시설 배치
- [ ] 공항·항구의 각 4칸 시설 판정과 시설 내부 칸 통과 예외
- [ ] 공항·항구 총 8칸 중 현재 아무 요원도 없는 칸을 사용하는 중복 없는 균등 무작위 충원
- [ ] 확정된 RED·BLUE K/H/D 시작 좌표
- [ ] 팀당 K/H/D 한 명, 총 6명, F 및 F 능력 없음
- [ ] 상하좌우 단순 이동 경로와 건물 경로 차단
- [ ] 셀당 네 명 수용, 성공 이동의 무작위 순차 처리와 가득 찬 시설의 합법적 봉쇄
- [ ] 기본 탐지와 조사 정보

### 명령과 경제

- [ ] 이동·해킹·암살·조사
- [ ] 대기·심문·숙청
- [ ] 기본 60%와 전문 보정
- [ ] 턴 할당금과 은행 적립
- [ ] 실패 시 비용 비환불
- [ ] 은행·통신국 해킹
- [ ] 같은 시설 해킹 경합
- [ ] 강제 실패가 포함된 직접 경합의 승패 처리

### 배신자와 제거

- [ ] 배신자 무작위 지정
- [ ] 묵인·이동 실패·공작 실패
- [ ] 동료 암살과 2,500달러 비용
- [ ] 비밀 심문 표식과 재매수 시 전체 표식 제거
- [ ] 숙청 경고, 턴당 1회 제한과 게임 전체 무제한 사용
- [ ] 암살 우선순위와 특별 결투
- [ ] 조용한 암살 결과 통보
- [ ] 사망 원인별 충원
- [ ] 공항·항구 총 8칸의 빈 충원 위치 무작위 선택
- [ ] 신규 배신자 재매수
- [ ] 불완전 편제에서는 즉시 재매수하고 활동 요원 0명일 때만 연기하는 자동 진행
- [ ] 활동 요원 0명 상태에서도 생존한 자기 배신자 명령 허용

### 목표와 승리

- [ ] 두 요원 명단의 비밀 배치
- [ ] 설계도와 과학자 무작위 배치
- [ ] 자동 목표 획득과 동시 도착 무작위 선택
- [ ] 목표 운반자 위치 공개
- [ ] 암살 이전, 모든 드롭 공개와 동석 적격 요원의 즉시 재획득
- [ ] 명단 전체 위치 정보 효과
- [ ] 과학자 탈출지의 획득 국장 단독 공개와 재획득 시 공항·항구 전환
- [ ] 대사관 및 4칸 공항·항구 인도
- [ ] 유효 목표 두 개 확보 승리
- [ ] 동시 두 번째 목표 확보 무승부
- [ ] 게임 종료 화면

### 화면·입력·사건 재생

- [ ] 한국어 중심 디자인 토큰과 Geist Sans·Pretendard Variable·제한된 Geist Mono font 계약
- [ ] 닉네임·방 생성/참가·fragment-only memory token·60분 초대 만료/재발급·rate-limit 대기·상대 대기·명단 은닉 로비
- [ ] phase·서버 마감·자금·목표·정보 보고서·요원·경보를 제공하는 HUD
- [ ] `요원 선택 → 이동/대기/심문/숙청 → 경로·도착지 → 이동만/조사/암살/해킹` command-composer reducer
- [ ] 공개 정보 기반 대표 최단 경로, 사용자의 인접 경로 수정·확정과 현재 칸 0칸 공작
- [ ] draft `저장 중/저장됨/재시도 필요`, 새로고침·포커스 복귀와 40초 마감 복구
- [ ] 플레이어별 projection에 따른 사건 queue/replay, skip와 reduced-motion 대체
- [ ] R3F 선택을 논리 `SelectionIntent`로 바꾸는 bridge와 동일 기능의 DOM 조작 경로
- [ ] Galaxy Tab S9+ 가로 전용 layout, safe area·동적 landscape viewport와 세로 orientation gate
- [ ] 48×48 CSS px 터치 대상, focus·live region, 색상 외 단서와 키보드·포인터·터치 접근성

## Phase 0B — 실제 기술 세팅과 최초 구현

이 절은 **STARTED / IN PROGRESS**다. Phase 0B-4 로컬 replay·훈련 UX slice는 **IMPLEMENTED / LOCAL VERIFIED**이고, Phase 0B 전체의 권위 server·persistence·두 클라이언트·실기기 범위는 완료하지 않았다.

- [x] Next.js + TypeScript 프로젝트 스캐폴드 생성
- [ ] tracked `vercel.json`에 `git.deploymentEnabled.main = false`를 고정해 main 자동 Production 차단 — **VERCEL DEFERRED**
- [x] React Three Fiber 기본 도형 3D 장면·논리 좌표 adapter·`SelectionIntent` bridge 생성 — **LOCAL VERIFIED**
- [x] `package.json`의 Node·pnpm 계약 고정과 `pnpm-lock.yaml` 생성
- [x] 테스트·린트·타입 검사·브라우저 자동화 패키지 설치와 현재 slice 실행 — **LOCAL VERIFIED**
- [x] 디자인 토큰·폰트·가로 전용 app shell, 전체 화면 지도·반투명 HUD와 fixture 로비·Q-079 명령 작성기 생성 — **LOCAL VERIFIED**
- [x] fixture allowlist player projection, command-composer reducer와 `SelectionIntent` bridge 생성 — **LOCAL VERIFIED**
- [ ] 서버 draft sync와 projected 사건 replay — **SERVER SLICE NOT IMPLEMENTED**
- [x] 순수 domain/map/order/RNG/movement/outcome와 `resolver.phase0b.3` 로컬 턴 판정·fixture RED·결정성 replay slice와 단위 테스트 — **LOCAL VERIFIED**
- [x] 명단 은닉→일반 명령→배신자 명령→결과→동일 입력 재판정→다음 턴 로컬 UI 연결 — **LOCAL BROWSER VERIFIED**
- [x] 결정적 다음 훈련 seed·기본 seed 복원·같은/새 seed 재시작과 사전 투영된 BLUE 결과의 순차 사건 재생 — **LOCAL BROWSER VERIFIED**
- [x] 절대 마감 기반 일반 명령 40초·배신자 명령 10초 countdown, 미지정 요원 자동 `WAIT`, 배신자 자동 `ACQUIESCE`, visibility/focus/pageshow 복구 — **LOCAL BROWSER VERIFIED**
- [x] 세 턴 연속 fixture와 동시 이동·4명 수용·복수 제거/충원·목표 드롭/인도·동시 승리 회귀 — **UNIT + BROWSER VERIFIED**
- [x] 900px 이상 PC·태블릿 동일 양쪽 rail, pan·zoom 중 HUD 투명화와 세로 gate 자동화 — **LOCAL BROWSER VERIFIED**
- [ ] Docker Desktop 설치·실행·Docker API 검증 — **DEFERRED / A-011**
- [ ] Supabase CLI·SDK와 Local Supabase stack·로컬 환경변수 연결 — **DEFERRED / A-011**
- [ ] Vercel CLI를 project devDependency와 lockfile에 고정하고 Preview 연결 전 준비 진단 통과 — **DEFERRED**
- [ ] Local backend 시작 전 `scripts/verify-development-readiness.ps1 -RequireLocalSupabase` 통과 — **DEFERRED / A-011**
- [x] `codex/phase-0b-foundation` 개발 브랜치 흐름 시작
- [ ] 최초 code-bearing 커밋 — **PENDING / 이번 로컬 구현·검증과 별도 상태**
- [ ] 별도 `main` merge 승인 뒤 guard-only PR을 병합해 remote `vercel.json`의 main auto-deploy 차단 검증 — **DEFERRED**
- [ ] 별도 Preview integration 승인 뒤 deployment 없는 경로로 Vercel `Project-Spy` project create/link·GitHub 연결 — **DEFERRED**
- [ ] Vercel 연결 직후 Production Branch `main`, tracked guard와 Production deployment 0건을 검증하고 비-production branch만 자동 Preview 허용 — **DEFERRED**
- [ ] 별도 명시 승인 뒤 Supabase Preview 프로젝트 생성·Preview 전용 환경변수·보안 경계 검증 — **DEFERRED**
- [ ] 기존 서울 Production-reserved Supabase 프로젝트가 Local·Preview 어디에도 연결되지 않았는지 검증 — **DEFERRED**
- [ ] 시작 전 닉네임과 익명 세션 식별
- [ ] 서버 1회 팀 배정과 명단 은닉 충돌 재선택
- [ ] 동일 anonymous session의 create/join 경합, 같은 game join 재시도와 terminal claim 해제 통합 검증
- [ ] 권위 있는 턴 판정
- [ ] 플레이어별 비밀 정보 분리
- [ ] 소유자 전용 일반 명령 draft, 마감 snapshot과 불변 잠금
- [ ] 플레이어별 projected TurnEvent 기반 연출·replay
- [ ] 두 클라이언트 결과 일관성 검증
- [ ] Draft PR의 Vercel Preview에서 PC·태블릿·2클라이언트 검증 — **DEFERRED**
- [ ] 실제 Android 태블릿 Chrome에서 WebGL2·터치·가로 gameplay·세로 orientation gate·DPR·백그라운드 복귀 검증

Vercel·Supabase 프로젝트 생성과 DB·RLS 적용은 하나의 체크로 합치지 않는다. 프로젝트 생성, 환경변수 연결, 스키마 적용, RLS 검증과 Realtime 검증을 각각 별도 증거로 완료 처리한다. 서울 Production-reserved 프로젝트는 Production migration 승인을 받기 전까지 빈 컨테이너로 유지하며 Local·Preview 작업의 편의상 연결하지 않는다.

## 권장 개발 순서

### Phase 0A — 기술 준비와 승인 완료

1. v0.6 맵 데이터와 활성 규칙 문서 동결
2. t0.2 기술·UI 계약과 연결·환경 감사 유지
3. 승인된 문서 전용 최초 `main` push와 원격 commit 검증 완료
4. 사전 생성된 서울 Supabase 프로젝트를 Production-reserved 빈 컨테이너로 유지
5. 정확한 Galaxy Tab S9+ 정보는 첫 실기기 통과 선언 전에 기록
6. 사용자 t0.2 기술·UI 기본안과 최종 기획 승인, 별도의 개발 착수 지시 — 2026-08-22 완료

### Phase 0B — 프로젝트 부트스트랩

1. `codex/phase-0b-foundation`에서 Next.js + TypeScript와 React Three Fiber 프로젝트 생성 — 완료
2. 정확한 버전·lockfile·lint·typecheck·unit·Playwright 도구 고정과 현재 slice 검증 — 완료
3. 색·간격·상태 token, Geist/Pretendard font와 가로 전용 DOM app shell·세로 orientation gate 생성 — 완료 / 로컬 검증
4. fixture player projection으로 로비·HUD·Q-079 명령 작성기와 오류·빈 상태 구현 — 완료 / 로컬 검증
5. 기본 도형 R3F 장면·논리 좌표 adapter·`SelectionIntent`, 전체 화면 지도·반투명 HUD 구현 — 완료 / 로컬 검증
6. `resolver.phase0b.3`, fixture RED, 명단 은닉부터 다음 턴과 결정성 재판정의 로컬 수직 slice — 완료 / 로컬 검증
7. 절대 마감 기반 40초·10초 timeout과 자동 기본 명령, 세 턴 연속 fixture, 복합 resolver 회귀 — 완료 / 로컬 검증
8. 결정적 다음 훈련 seed·같은/새 seed 재시작과 BLUE 투영 결과의 순차 사건 재생 — 완료 / 로컬 검증
9. lint·typecheck·format·`git diff --check`·43 source boundary·Vitest 13파일/77테스트·Next build·Playwright 11 passed/17 intended skips·로컬 브라우저 점검 — 완료
10. 물리 Galaxy Tab S9+ touch·S Pen·WebGL2·성능과 권위 gameplay server·두 클라이언트 — 미검증·미구현
11. Docker Desktop·Local Supabase·모든 Supabase SDK/CLI는 A-011에 따라 보류
12. 서울 Production-reserved 프로젝트는 Local에 연결하지 않음 — 유지

### Phase 1 — 순수 규칙 시뮬레이션

Phase 0B-4까지 좌표·정적 map manifest/pathfinding, order·경제 검증, deterministic RNG, 이동·목표·해킹·조사·암살·충원·outcome과 allowlist projection을 사용하는 로컬 resolver 수직 slice, 훈련 seed·재시작 UX, 사전 투영 결과 replay와 복합 회귀를 앞당겨 구현·검증했다. 아래 Production 권위 resolver와 서버 통합이 완료됐다는 뜻은 아니다.

1. 격자, 요원, 목표, 자금, setup phase와 명단 은닉 상태 정의
2. 고정 골격과 검증된 A·B 무작위 배치, 팀 1회 무작위 배정 생성
3. 명령 유효성, 비용, 확률 판정과 결정적인 대표 최단 경로 제안
4. 이동, 공항·항구 내부 통과, 시설 봉쇄, 암살, 목표 판정
5. 8칸 빈 셀 충원과 배신자 재매수
6. player projection과 recipient별 `TurnEvent` 정의
7. 자동화된 규칙·projection 누출 테스트

### Phase 2 — 로비·setup와 단일 브라우저 명령

1. 닉네임·방 생성/참가·fragment token 즉시 제거·자기 작전 복구·60분 초대 만료/재발급·24시간 idempotency replay/410·durable rate limit·waiting 방 취소·setup 양측 작전 취소와 RED/BLUE 배정 표시
2. 명단 은닉 비공개 제출·동일 시설 충돌 재선택
3. HUD와 순수 command-composer reducer, 경로 수정·확정과 대상 선택
4. 완성된 요원별 비공개 draft 저장·복구, 전체 저장 집합 합법성, owner private input version, 수동 잠금, 0 agent 즉시 확정과 40초 자동 대기
5. 배신자 명령 10초·자동 묵인과 no controllable mole 즉시 확정
6. 정보 권한별 사건 queue/replay와 전체 경기 완주

### Phase 3 — 3D 표현과 입력 bridge

1. 16×16 도시 보드와 25개 건물 블록
2. 건물과 요원 표시
3. 논리 좌표와 `SelectionIntent` bridge를 통한 요원·도착지·대상 선택
4. 서버 승인 waypoint 기반 이동과 projected event replay
5. Canvas 선택과 동등한 DOM 제어, 북쪽 고정 카메라·pan·zoom·시점 초기화
6. waiting/setup WebGL2 호환성 게이트와 active 재접속 첫 load·context 복구 실패용 2D 논리 폴백

### Phase 4 — 1대1 온라인

1. 방 생성·응답 유실/새로고침 복구·invite active 단일성·one-time-secret public wire·waiting cancel↔참가 경합·setup 양측 cancel
2. 팀 배정·명단 은닉과 player projection 동기화
3. draft/private input version 경합·재접속 복구와 동시 명령 잠금
4. 한 번만 수행되는 턴 판정과 deadline snapshot
5. 플레이어별 결과 동기화, Broadcast 유실 후 polling 복구

### Phase 5 — 반응형·접근성·온라인 검증

1. PC와 Galaxy Tab S9+ 가로 HUD/명령 layout, 세로 orientation gate와 가로 복귀 상태 보존
2. 포인터·터치·펜·키보드, focus 복귀, live region과 reduced motion 검증
3. 두 브라우저 context에서 방 생성/복구 → 참가 → 명단 은닉 → 한 턴 → 재접속 E2E
4. 별도 승인된 Supabase Preview 프로젝트와 Vercel Preview의 RLS·Realtime·2클라이언트 smoke test
5. 실제 태블릿 WebGL2·DPR·동적 viewport·백그라운드 복귀와 성능 측정

### Phase 6 — 플레이테스트

1. 한 게임 완주와 규칙 오류 확인
2. 평균 턴 수와 플레이 시간 측정
3. 검증된 무작위 배치별 자금·성공률·목표 동선 밸런스 확인
4. 배신 추리가 실제로 가능한지 검증

### Production 경계

- 비-production 브랜치의 Vercel Preview만 자동 검증 대상으로 사용한다.
- guard-only PR의 별도 `main` merge 승인 뒤 remote `vercel.json`의 `git.deploymentEnabled.main = false`를 먼저 확인한다. 그 다음 deployment 없는 경로로 project를 create/link·Git 연결하고 Production Branch `main`과 Production deployment 0건을 검증한다. Dashboard import의 최초 `Deploy`는 Production 승인 없이 실행하지 않는다.
- Preview는 별도 Supabase Preview 프로젝트만 사용하고 서울 Production-reserved 프로젝트를 연결하지 않는다.
- Preview가 통과해도 `main` merge나 Production 변경을 자동 승인하지 않는다.
- `main` merge, Production deploy, promote, Production alias 변경과 rollback은 각각 실행 직전에 별도 사용자 승인을 받는다.
- Production은 승인된 remote `main` SHA의 별도 clean detached worktree에서 `HEAD`·remote SHA와 clean status, team·project·environment를 확인한 뒤 lockfile-pinned Vercel CLI의 수동 명령으로만 생성한다. deployment source/Git SHA를 사후 검증하고 기존 작업트리는 reset·clean하지 않으며 자동 deployment guard도 유지한다.
- Supabase Production migration과 RLS 변경도 검토된 migration, RLS·advisor·회귀 검증 뒤 각각 별도 사용자 승인을 받는다. 코드 배포 승인을 DB 변경 승인으로 간주하지 않는다.

## 데모 비범위

- 회원가입 UI
- 친구 시스템
- 공개 매치메이킹
- 랭킹
- 채팅
- 관전
- 복잡한 재접속
- 전용 게임 서버
- 실시간 Transform 동기화
- 대규모 동시 접속 대응
- 고급 Anti-Cheat
- 복잡한 3D 물리
- 고급 NavMesh 시스템

## 데모 완료 판단

기능 구현만으로 데모가 성공했다고 보지 않는다. 다음을 실제 플레이로 검증해야 한다.

- 명령 실패가 추리 단서로 작동하는가?
- 배신자 명령에 묵인과 배신 사이의 선택이 있는가?
- 목표, 시설, 암살 중 무엇을 우선할지 의미 있는 선택이 생기는가?
- 제한된 정보로도 결과를 이해할 수 있는가?
- 한 게임의 길이와 결과 통보 시간이 적절한가?
