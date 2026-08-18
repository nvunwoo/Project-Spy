# 현재 개발 단계

> 마지막 갱신: 2026-08-18  
> 기획 기준 버전: v0.5  
> 기술 준비 기준: t0.1  
> 현재 단계: **TECHNICAL READINESS — PRE-DEVELOPMENT**  
> 기술 준비 승인 상태: **APPROVED — PREPARATION COMPLETE**  
> 소프트웨어 개발 상태: **NOT STARTED**

이 문서는 현재 무엇을 하고 있으며 다음에 무엇을 해야 하는지를 보여주는 작업 대시보드다. 세부 게임 규칙을 이 문서에 복제하지 않고 각 기준 문서로 연결한다.

## 현재 목표

v0.5 게임 기획을 변경하지 않은 채 PC·태블릿용 3D 웹게임의 기술 기준, 로컬 환경, 외부 계정 연결과 안전한 Git·Preview 배포 절차를 확정한다. 사용자는 t0.1 권장안과 한정된 저장소 초기화 절차를 승인했다. 승인, 실제 실행, 검증, 사용자 최종 기획 승인과 개발 착수 지시는 서로 별개의 상태로 추적한다.

## 현재 허용 범위

- 게임 규칙 정리
- 기획 문서 분류와 최신화
- 미결정 사항 추적
- 향후 개발에 필요한 기획·기술 계약 명시
- 확정된 상세 건물·시작 좌표와 맵 생성 규칙의 정합성 검증
- 로컬 개발 도구의 읽기 전용 설치·버전 감사
- GitHub·Vercel·Supabase 플러그인 인증과 권한 확인
- Next.js + TypeScript, React Three Fiber, Vercel, Supabase 기술 기준과 모듈 경계 문서화
- 사용자가 직접 수행해야 하는 설치·로그인·권한 승인 절차 안내
- `codex/*` 브랜치, 검증, Draft PR, Vercel Preview와 Production 승인 경계 문서화
- `.gitignore`, `.gitattributes`, `.nvmrc`, 값이 비어 있는 `.env.example`, 저장소 `AGENTS.md`, PR 템플릿과 읽기 전용 준비 진단 스크립트 같은 저장소 보호장치 작성·정적 검증
- 승인된 시스템 Node.js·npm·사용자 전역 pnpm 설치와 준비 진단
- GitHub 기준 저장소의 private 전환과 문서·보호장치만 포함한 최초 `main` 커밋·push
- Supabase 조직·프로젝트 현황과 비용의 읽기 전용 조회
- 사용자가 명시적으로 승인한 빈 Supabase 프로젝트 컨테이너의 1회성 삭제·서울 리전 대체·상태 검증

## 현재 비범위

- 실행 가능한 애플리케이션 프로젝트 생성
- 실제 데이터베이스·스키마·RLS·API 생성 또는 변경
- Next.js 프로젝트 생성
- 패키지 설치
- 게임·애플리케이션·런타임 코드 작성
- Vercel 프로젝트 생성 또는 Git 연결 변경
- 승인된 문서 전용 최초 `main` 커밋을 제외한 코드-bearing 커밋과 개발 브랜치 작업
- 사용자가 요청한 실제 변경이 없는 상태에서의 `codex/*` 브랜치·PR·Preview 생성
- 3D 에셋 제작
- Preview·Production 배포
- Vercel 프로젝트 생성
- 명시 승인된 1회성 서울 프로젝트 대체를 제외한 Supabase 프로젝트 삭제·재생성·추가 생성·연결 변경
- Supabase 스키마·테이블·RLS·API·Auth·Realtime·키·환경변수 생성 또는 변경
- 비밀키·토큰·비밀번호의 생성, 조회, 문서화 또는 저장소 기록

## 확정된 핵심 기획 항목

- [x] 1대1 동시 명령 핵심 구조
- [x] 네 단계 턴 구조와 제한 시간
- [x] K/H/F/D 팀 구성
- [x] 일반 명령 일곱 종류
- [x] 배신자 명령 네 종류
- [x] 공작 자금, 은행 적립과 비용
- [x] 성공률과 요원별 전문 보정
- [x] 심문, 숙청, 암살, 충원, 재매수의 핵심 규칙
- [x] 16×16 격자, 25개의 2×2 건물 블록과 하나로 연결된 도로망
- [x] 명명된 특수시설 25개·특수시설 31칸·일반 건물 69칸으로 이루어진 건물 부지 100칸
- [x] 일반 건물 진입, 건물 간 통과 금지와 공항·항구 4칸 내부 이동 예외
- [x] 검증된 A/B 무작위 시설 배치와 고정된 RED·BLUE K/H/F/D 시작 좌표
- [x] 탐지, 조사, 명단 정보, 통신국 도청의 핵심 규칙
- [x] 목표 3종과 실물 목표 4개
- [x] 목표 운반, 이전, 드롭, 확보와 승리의 핵심 규칙
- [x] 동시 해킹과 동시 승리 예외
- [x] 복합 상황에서 드러난 경계 규칙 Q-054~Q-067 최종 확정

## 남은 사용자 결정

| 우선순위 | 항목 | 상태 | 반영 문서 |
| --- | --- | --- | --- |
| P1 | 최종 게임명 | **OPEN** | [PROJECT_VISION.md](./game-design/PROJECT_VISION.md) |
| P1 | 도시명, 시대, 분위기와 상세 세계관 | **OPEN** | [PROJECT_VISION.md](./game-design/PROJECT_VISION.md) |
| P1 | 아트와 카메라 스타일 | **OPEN** | [PRESENTATION.md](./technical/PRESENTATION.md) |
| P1 | UI 시각 스타일 가이드 | **USER INPUT PENDING** | [PRESENTATION.md](./technical/PRESENTATION.md) |

## 최근 규칙 확정

Q-052·Q-053과 Q-068~Q-073은 모두 **RESOLVED** 상태다. 실제 시작 좌표, 25개 블록과 건물 100칸, 검증된 A/B 배치, 공항·항구 내부 이동, 8칸 빈 셀 충원과 합법적 시설 봉쇄를 각 활성 기준 문서에 반영했다. 결정 이력은 [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md)에 보존한다.

v0.5 활성 게임 규칙 6개 문서의 의미·링크·상태 교차 감사를 완료했으며, 현재 알려진 규칙 충돌은 0건이다. 소프트웨어 개발은 여전히 시작하지 않았으며, 맵 승인은 전체 기획의 최종 승인이나 개발 착수 지시로 간주하지 않는다.

## 기술 준비 t0.1 현황

- 사용자는 t0.1 기술 권장안과 `nvunwoo/Project-Spy` 기준 저장소 사용을 승인했다. 이는 v0.5 전체 기획 승인이나 개발 착수 지시가 아니다.
- 기술 기준은 Next.js + TypeScript, React Three Fiber, Vercel, Supabase로 유지한다.
- 목표 플랫폼은 PC·태블릿 웹 브라우저이며, 데모는 3D 체스판형 도시와 단순 도형 건물·캐릭터를 사용한다.
- 게임 시작 전 닉네임 지정 단계를 필수로 확정해 Q-048을 `RESOLVED`로 전환했다.
- Codex의 GitHub·Vercel·Supabase 플러그인은 설치·인증되어 있다.
- GitHub 기준 저장소는 **PRIVATE**로 전환했고, 승인된 문서·보호장치 전용 최초 `main` 기준선을 게시해 원격 브랜치와 commit을 검증했다.
- 이후 사용자가 요청한 변경 범위에서는 `codex/*` 커밋·push·Draft PR·Vercel Preview를 별도 반복 승인 없이 진행할 수 있다. 이 정책은 새 개발을 임의로 시작할 권한이 아니다.
- `main` 병합, Production 배포·promote·alias 변경·rollback과 Production DB migration은 각각 매번 별도 사용자 승인을 받는다.
- Vercel은 승인된 `nvunwoo's projects` 팀에 연결됐지만 `Project-Spy` 프로젝트가 없다.
- 사용자가 플러그인 연동 중 만든 빈 `ap-south-1` 프로젝트는 사용자가 삭제했다. 사용자의 명시 승인과 월 0달러 비용 확인 후 `Endurance Games` Free 조직의 `Project-Spy`를 서울 `ap-northeast-2`에 2026-08-18T06:48:01Z 생성했고 `ACTIVE_HEALTHY`를 검증했다. public table은 0개, migration은 0개다.
- 서울 Supabase 프로젝트는 빈 프로젝트 컨테이너만 준비된 상태다. 스키마·테이블·RLS·Auth·Realtime·키·환경변수는 구성하지 않았으며 후속 변경은 개발 착수 지시와 해당 승인 경계를 따른다.
- 시스템 Node.js 24.19.0, npm 11.17.0과 사용자 전역 pnpm 11.22.0을 설치했고, 지속 PATH를 반영한 새 프로세스의 준비 진단까지 통과했다.
- Git, Git LFS, Chrome, Edge와 VS Code도 확인했다. GitHub CLI 2.97.0을 설치했고 Vercel CLI는 현재 필수가 아니다.
- GitHub CLI의 Windows keyring 인증을 `nvunwoo`로 확인했고 Git 프로토콜은 HTTPS로 설정했다. 최초 push 뒤 원격 `main`과 commit도 다시 검증했다.
- 실제 태블릿 검증 기준은 Android 태블릿 Chrome이다. 공식 지원 Android 12 이상 OEM 지원 기기, current 또는 previous Chrome, WebGL2와 RAM 4GB 이상을 최소선으로 하고 Android 14 이상·RAM 6GB 이상을 권장한다. Android 10·11은 best-effort이며 in-app WebView는 지원하지 않는다.
- t0.1 저장소 보호장치인 `AGENTS.md`, `.gitignore`, `.gitattributes`, `.nvmrc`, 값이 비어 있는 `.env.example`, Draft PR 템플릿과 `scripts/verify-development-readiness.ps1`은 준비됐다. 이 파일들은 앱 스캐폴드나 실제 환경값이 아니다.

위 항목은 연결·환경·빈 Supabase 프로젝트 컨테이너 준비 결과이지 애플리케이션 구현, DB 구성 또는 배포 완료를 뜻하지 않는다. 사용자 작업과 외부 연결 상태의 세부 ID는 [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md)에서 추적한다.

## 활성 기준 문서

1. [프로젝트 비전](./game-design/PROJECT_VISION.md)
2. [턴 구조와 판정](./game-design/TURN_MODEL.md)
3. [명령과 경제](./game-design/ORDERS_AND_ECONOMY.md)
4. [요원과 배신자](./game-design/GAMEPLAY_SYSTEMS.md)
5. [맵과 정보](./game-design/MAP_AND_INTELLIGENCE.md)
6. [목표와 승리](./game-design/WORLD_MISSIONS.md)

## 활성 기술 준비 문서

1. [개발 전 기술 준비 기준](./technical/TECHNICAL_READINESS.md)
2. [기술 아키텍처](./technical/ARCHITECTURE.md)
3. [데이터·API·보안 경계](./technical/DATA_AND_API.md)
4. [3D·표현 준비](./technical/PRESENTATION.md)
5. [구현 청사진](./technical/IMPLEMENTATION_BLUEPRINT.md)
6. [MVP 로드맵](./production/MVP_ROADMAP.md)
7. [Codex 작업 규칙](./CODEX_WORKING_RULES.md)

## 다음 작업

1. 첫 실기기 테스트 전에 Android 태블릿의 정확한 모델·Android 버전·RAM·Chrome 버전을 기록한다.
2. 사용자가 다음에 제공할 UI 가이드를 별도 시각 계약으로 반영한다.
3. 사용자에게 v0.5 전체 게임 기획의 최종 승인을 받는다.
4. 사용자가 명시적으로 개발 착수를 지시한 뒤에만 앱 스캐폴드, 패키지 설치, Supabase 데이터·Auth·Realtime 구성과 최초 구현으로 전환한다.
5. Vercel `Project-Spy` 프로젝트 생성과 Git 연결은 개발 착수 뒤 별도 승인을 받아 진행한다. 서울 Supabase 프로젝트는 그 전까지 빈 컨테이너로 유지한다.

## 현재 단계 종료 조건

- [x] 요원 시작 좌표 확정
- [x] 25개 건물 블록과 건물 부지 100칸의 좌표 확정
- [x] 명명된 특수시설 25개와 일반 건물 69칸의 배치 계약 확정
- [x] Q-054~Q-067 경계 규칙 확정
- [x] Q-068~Q-073 맵 경계 규칙 확정
- [x] v0.5 활성 게임 규칙 문서 간 충돌 0건
- [x] 모든 미결정 규칙에 추적 상태 부여
- [x] PC·태블릿 3D 웹게임 기술 기준 t0.1 문서화
- [x] GitHub·Vercel·Supabase 플러그인 설치·인증 상태 확인
- [x] 로컬 개발환경과 저장소 초기 상태 감사
- [x] Preview와 Production 배포 권한 경계 정의
- [x] 저장소 보호장치·빈 환경변수 이름 템플릿·PR 템플릿·준비 진단 스크립트 작성
- [x] t0.1 기술 준비 권장안 사용자 승인
- [x] 시스템 Node.js 24.19.0·npm 11.17.0과 Codex 캐시가 아닌 사용자 전역 pnpm 11.22.0 사용 가능
- [x] Node.js·npm·pnpm 지속 PATH 설정과 준비 진단 통과
- [x] GitHub 기준 저장소·private 전환·문서 전용 최초 `main` push 승인
- [x] GitHub private 전환 실행 및 원격 가시성 검증
- [x] 문서 전용 최초 `main` commit·push 실행 및 원격 commit 검증 — **THIS BASELINE**
- [x] GitHub CLI 2.97.0·Windows keyring `nvunwoo`·HTTPS Git 프로토콜 검증
- [x] Vercel 팀과 Supabase 조직·서울 목표 리전·비용 조회 승인
- [x] 기존 빈 Supabase `ap-south-1` 프로젝트의 사용자 삭제 확인
- [x] Supabase 서울 `ap-northeast-2` 빈 프로젝트 생성·`ACTIVE_HEALTHY`·public table 0개·migration 0개 검증
- [x] 실제 태블릿 검증 장치를 Android Chrome으로 확정
- [ ] Android 태블릿의 정확한 모델·OS·RAM·Chrome 버전 기록
- [ ] UI 시각 스타일 가이드 수신·반영
- [ ] 사용자에게 최종 기획 승인 받음
- [ ] 사용자가 개발 착수를 명시적으로 지시함

## 문서 동기화 규칙

모든 후속 작업은 시작할 때 이 문서를 확인하고 종료할 때 다음을 함께 갱신한다.

- 현재 단계와 다음 작업
- 변경된 도메인의 기준 문서
- [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md)
- [README.md](./README.md)
- [CHANGELOG.md](./CHANGELOG.md)
