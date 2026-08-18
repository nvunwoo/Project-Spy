# THE MOLE 문서 허브

> 현재 단계: **TECHNICAL READINESS — PRE-DEVELOPMENT**  
> 기획 기준 버전: v0.5  
> 기술 준비 기준: t0.1  
> 기술 준비 승인 상태: **APPROVED — PREPARATION COMPLETE**  
> 소프트웨어 개발 상태: **NOT STARTED**

모든 작업은 먼저 [CURRENT_STAGE.md](./CURRENT_STAGE.md)를 확인한다. 현재는 실제 개발 전 기술 준비 단계다. 기술 계약 문서화, 로컬 환경 감사와 승인된 외부 연결 준비만 수행했으며, 애플리케이션 스캐폴드·코드 작성·프로젝트 패키지 설치·데이터베이스 스키마 변경·Vercel 프로젝트 생성과 배포는 시작하지 않았다. Supabase에는 별도 사용자 승인에 따라 비어 있는 서울 프로젝트 컨테이너만 미리 준비했으며, 이는 소프트웨어 개발 착수를 뜻하지 않는다.

## 상태 표기

| 표기 | 의미 |
| --- | --- |
| **CONFIRMED** | 현재 활성 규칙으로 확정 |
| **TBD** | 결정되지 않아 후속 입력 필요 |
| **USER INPUT PENDING** | 사용자가 별도 자료나 값을 제공할 예정 |
| **CANDIDATE** | 검토 중인 후보 |
| **DEPRECATED** | 새 규칙으로 대체된 과거 기획 |
| **NOT STARTED** | 계획은 있으나 실행하지 않음 |

## 현재 상태

| 문서 | 역할 |
| --- | --- |
| [CURRENT_STAGE.md](./CURRENT_STAGE.md) | 현재 단계, 완료 항목, 입력 대기, 다음 작업 |
| [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md) | 남은 결정과 과거 질문의 해결 상태 |
| [CHANGELOG.md](./CHANGELOG.md) | 기획 기준 버전별 변경 이력 |
| [CODEX_WORKING_RULES.md](./CODEX_WORKING_RULES.md) | 비밀값, Git, PR, Preview와 Production 작업 경계 |

## 활성 게임 기획

| 기준 문서 | 단일 소유 범위 |
| --- | --- |
| [PROJECT_VISION.md](./game-design/PROJECT_VISION.md) | 프로젝트 방향, 세계, 핵심 경험, 승리 구조 요약 |
| [TURN_MODEL.md](./game-design/TURN_MODEL.md) | 네 단계 턴, 제한 시간, 실행 순서, 동시 충돌 |
| [ORDERS_AND_ECONOMY.md](./game-design/ORDERS_AND_ECONOMY.md) | 일반 명령, 비용, 성공률, 자금, 시설 해킹 |
| [GAMEPLAY_SYSTEMS.md](./game-design/GAMEPLAY_SYSTEMS.md) | 요원 유형, 배신자, 심문·숙청, 사망·충원·재매수 |
| [MAP_AND_INTELLIGENCE.md](./game-design/MAP_AND_INTELLIGENCE.md) | 16×16 격자, 건물, 이동, 수용 인원, 탐지와 정보 공개 |
| [WORLD_MISSIONS.md](./game-design/WORLD_MISSIONS.md) | 목표 배치, 획득, 운반, 이전, 확보, 승리와 무승부 |

활성 규칙을 찾을 때는 위 여섯 문서를 기준으로 한다. 같은 규칙을 다른 문서에 다시 정의하지 않고 필요한 경우 기준 문서로 연결한다. Q-052·Q-053과 Q-068~Q-073은 v0.5에서 모두 해결됐으며, 시작 좌표와 25개 블록의 건물 배치 Excel을 포함한 P0 맵 입력은 완료됐다. 기술 준비 t0.1이 시작됐어도 v0.5 전체 게임 기획의 최종 승인과 실제 개발 착수는 아직 이뤄지지 않았다.

## 활성 기술 준비 t0.1

다음 문서는 실제 구현 전에 확정하는 기술 준비 기준이다. 게임 규칙보다 우선하지 않으며, 체크박스나 설계가 존재한다는 사실은 프로젝트·코드·DB·배포가 만들어졌다는 뜻이 아니다.

| 문서 | t0.1 소유 범위 |
| --- | --- |
| [TECHNICAL_READINESS.md](./technical/TECHNICAL_READINESS.md) | 개발 전 환경·외부 연결·권한·보안 상태와 Go/No-Go 게이트 |
| [ARCHITECTURE.md](./technical/ARCHITECTURE.md) | Next.js + TypeScript, React Three Fiber, Vercel, Supabase 책임과 1대1 서버 권위 경계 |
| [DATA_AND_API.md](./technical/DATA_AND_API.md) | 닉네임, 방·경기 상태, 비밀 정보, API·Realtime·RLS 준비 계약 |
| [PRESENTATION.md](./technical/PRESENTATION.md) | PC·태블릿 3D 보드, 단순 도형 데모와 입력·성능·접근성 준비 |
| [IMPLEMENTATION_BLUEPRINT.md](./technical/IMPLEMENTATION_BLUEPRINT.md) | 개발 착수 뒤 사용할 폴더·모듈·테스트 경계 |
| [MVP_ROADMAP.md](./production/MVP_ROADMAP.md) | Phase 0A 기술 준비와 실제 구현 단계의 분리 |
| [CODEX_WORKING_RULES.md](./CODEX_WORKING_RULES.md) | 비밀값 금지, `codex/*` 브랜치, Draft PR, Preview·Production 권한 경계 |

현재 연결·환경·승인 요약:

- GitHub·Vercel·Supabase Codex 플러그인: 설치·인증 확인
- GitHub `nvunwoo/Project-Spy`: **PRIVATE** 전환과 승인된 문서·보호장치 전용 최초 `main` 기준선 게시·원격 commit 검증 완료
- GitHub CLI 2.97.0: 설치 완료. 로컬 자격 증명 저장소의 `nvunwoo` 인증과 Git HTTPS 사용을 검증
- 향후 사용자 요청 범위의 `codex/*` 커밋·push·Draft PR·Vercel Preview 자동화 승인. 새 개발을 임의로 시작하는 권한은 아님
- `main` merge와 Production deploy·promote·alias 변경·rollback·Production DB migration: 각각 매번 별도 사용자 승인
- Vercel `nvunwoo's projects`: 사용 팀 승인·연결됨, `Project-Spy` 프로젝트 없음
- Supabase `Endurance Games` Free: 플러그인 연동 때 사용자가 만든 비어 있는 `ap-south-1` 프로젝트는 사용자가 삭제했고, 월 0달러 비용 확인과 명시적 승인 뒤 같은 이름의 대체 프로젝트를 서울 `ap-northeast-2`에 생성해 `ACTIVE_HEALTHY`를 검증. public table 0개, migration 0개
- Supabase 미설정 범위: 스키마·RLS·Auth·Realtime·키·환경변수와 애플리케이션 연결은 생성하거나 구성하지 않음
- 로컬 저장소: 최초 `main` 기준선과 원격 추적 설정 완료. 이후 변경은 `codex/*`·Draft PR 정책 사용
- 시스템 개발 도구: Node.js 24.19.0, npm 11.17.0, 사용자 전역 pnpm 11.22.0과 지속 PATH를 새 프로세스에서 검증 완료
- 실제 태블릿 검증: Android Chrome. 최소 Android 12+ OEM 지원/current 또는 previous Chrome/WebGL2/RAM 4GB+, 권장 Android 14+/RAM 6GB+. Android 10·11 best-effort, in-app WebView 미지원
- 저장소 보호장치: `AGENTS.md`, `.gitignore`, `.gitattributes`, `.nvmrc`, 비어 있는 `.env.example`, Draft PR 템플릿과 준비 진단 스크립트 생성 완료

## 기준 우선순위

규칙이 충돌하면 다음 순서로 판단한다.

1. 사용자의 가장 최근 명시적 지시
2. v0.5 활성 게임 기획 문서
3. 해결 상태가 기록된 미결정 사항 등록부
4. 기술 준비 t0.1 문서
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

## 개발 착수 조건

사용자는 기술 준비 t0.1 권장안과 한정된 저장소 초기화를 승인했다. 이는 전체 게임 기획 승인이나 개발 허가가 아니다. 시작 좌표와 건물 배치 Excel 반영 및 기술 기준 문서화는 완료됐지만, 다음 조건을 모두 만족한 뒤 사용자의 명시적 지시로 개발 단계에 들어간다.

- 요원 시작 좌표 확정
- 건물 배치 Excel 반영
- 활성 기획 문서 간 충돌 제거
- 남은 핵심 기획 결정 정리
- [완료] 시스템 Node.js 24.19.0·npm 11.17.0과 Codex 캐시가 아닌 사용자 전역 pnpm 11.22.0 사용 가능
- [완료] GitHub CLI 2.97.0 설치와 로컬 자격 증명 저장소의 `nvunwoo` HTTPS 쓰기 인증 확인
- [완료] PRIVATE 저장소의 문서·보호장치 전용 최초 `main` 기준선 게시와 원격 commit 확인
- UI 시각 스타일 가이드 반영
- 사용자의 최종 기획 승인
- 사용자의 개발 착수 지시

Android 태블릿의 정확한 모델·Android 버전·RAM·Chrome 버전은 첫 실기기 검증 전 후속 입력이며 프로젝트 부트스트랩 자체를 막지 않는다. 문서·보호장치 전용 최초 `main` 커밋·push는 Phase 0A에서 별도로 승인된 일회성 저장소 초기화다. 코드-bearing 최초 커밋, Vercel `Project-Spy`, 프로젝트 패키지 설치, 서울 Supabase 프로젝트의 스키마·Auth·Realtime·키·환경변수 연결과 Preview 배포는 개발 착수 뒤 별도 실행·검증한다. 비어 있던 기존 `ap-south-1` 프로젝트는 사용자가 삭제했으며 서울의 대체 프로젝트 컨테이너만 사전 준비된 상태다. Draft PR 승인은 `main` merge나 Production 배포 승인이 아니며, 각 Production 변경은 매번 별도 승인을 받아야 한다.
