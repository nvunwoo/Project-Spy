# 미결정 사항 및 결정 상태

> 문서 상태: **ACTIVE**  
> 기획 기준 버전: v0.5  
> 기술 준비 기준: t0.1  
> 현재 단계: TECHNICAL READINESS — PRE-DEVELOPMENT  
> 현재 작업 현황: [CURRENT_STAGE.md](../CURRENT_STAGE.md)

이 문서는 아직 필요한 입력과 과거 질문의 해결 상태를 추적한다. 확정된 실제 규칙은 연결된 게임 기획 기준 문서가 소유한다.

## 상태

- **OPEN**: 결정 필요
- **USER INPUT PENDING**: 사용자가 구체 자료나 값을 제공할 예정
- **RESOLVED**: 활성 기준 문서에 반영 완료
- **DEFERRED**: 현재 단계의 범위 밖
- **DEPRECATED**: 최신 규칙에서 제외

기술 준비 작업은 질문 상태와 별도로 **APPROVED**(사용자 승인), **EXECUTED**(실제 변경), **VERIFIED**(증거 확인), **GATED**(후속 승인 전 실행 금지)를 구분한다. 승인만 받은 작업을 실행 완료로 기록하지 않는다.

## 개발 전 사용자 입력 현황

현재 미해결 상태인 P0 맵 입력은 없다. Q-052와 Q-053은 사용자가 제공한 [MAP.xlsx](../MAP.xlsx)와 후속 확정으로 해결됐으며, 결정 이력은 아래 표에 보존한다.

## t0.1에서 해결된 기술 결정

| ID | 상태 | 확정 결정 | 기준 문서 |
| --- | --- | --- | --- |
| Q-048 | RESOLVED | 각 플레이어는 게임 시작 전에 자기 닉네임을 지정하는 단계를 반드시 거친다. 닉네임의 길이·문자·중복 정책은 데이터·API 계약에서 검증 가능한 값으로 관리하며 UI 시각 스타일과 분리한다. | [데이터·API](../technical/DATA_AND_API.md) |
| Q-074 | RESOLVED | 목표 플랫폼은 PC·태블릿 웹 브라우저다. 데모 도시는 3D 체스판형 격자로 표현하고 건물·요원은 단순 도형으로 시작하되 향후 3D 모델로 교체 가능한 표현 계층을 둔다. | [프로젝트 비전](../game-design/PROJECT_VISION.md), [3D·표현](../technical/PRESENTATION.md) |
| Q-075 | RESOLVED | 기술 기준 t0.1은 Next.js + TypeScript, React Three Fiber, Vercel, Supabase 조합을 유지한다. 기술 선택은 v0.5 게임 규칙과 별도 버전으로 관리한다. | [기술 아키텍처](../technical/ARCHITECTURE.md) |
| Q-076 | RESOLVED | 1대1 경기는 클라이언트 Transform이 아니라 하나의 서버 권위 상태·턴 판정을 공유한다. Supabase는 상태·영속화·Realtime 경계로 사용하고, 클라이언트에는 플레이어별 허용 정보만 전달한다. | [기술 아키텍처](../technical/ARCHITECTURE.md), [데이터·API](../technical/DATA_AND_API.md) |
| Q-077 | RESOLVED | 개발 변경은 `codex/*` 브랜치에서 검증한 뒤 Draft PR과 Vercel Preview로 확인한다. `main` merge, Production deploy·promote·alias 변경·rollback과 Production DB migration은 각각 매번 별도 사용자 승인을 받는다. | [Codex 작업 규칙](../CODEX_WORKING_RULES.md) |

이 표는 기술 방향의 결정을 뜻하며 구현 완료를 뜻하지 않는다. 명시적으로 승인된 빈 서울 Supabase 프로젝트 컨테이너만 준비됐고, 앱·패키지·DB 스키마·RLS·Auth·Realtime·Vercel 프로젝트와 배포는 모두 **NOT STARTED**다.

## 외부 연결과 로컬 환경 상태

| 상태 ID | 상태 | 확인된 사실 | 다음 경계 |
| --- | --- | --- | --- |
| E-001 | CONNECTED / PRIVATE / INITIAL MAIN VERIFIED | GitHub 플러그인과 로컬 GitHub CLI는 `nvunwoo`로 인증됐다. `nvunwoo/Project-Spy`를 PRIVATE으로 전환했고 문서·보호장치 전용 최초 `main` 기준선과 원격 commit을 검증했다. | 이후 변경은 `codex/*`·Draft PR 정책을 사용하며 이번 1회성 직접 `main` 초기화를 일반 권한으로 확대하지 않는다. |
| E-002 | CONNECTED / TEAM APPROVED / PROJECT MISSING | Vercel 플러그인은 승인된 `nvunwoo's projects` 팀에 인증됐다. `Project-Spy` 프로젝트는 없다. | 프로젝트 생성과 Git 연결은 개발 착수 뒤 별도 승인 대상이다. |
| E-003 | SEOUL PROJECT READY / EMPTY / VERIFIED | 사용자가 만든 빈 `ap-south-1` 프로젝트는 사용자가 삭제했다. 월 0달러 비용 확인과 명시 승인 뒤 `Endurance Games` Free의 같은 이름 프로젝트를 `ap-northeast-2`에 생성해 `ACTIVE_HEALTHY`, public table 0개, migration 0개를 검증했다. | 스키마·RLS·Auth·Realtime·키·환경변수와 앱 연결은 개발 착수 및 해당 승인 전까지 구성하지 않는다. |
| E-004 | LOCAL RUNTIME READY / VERIFIED | Node.js 24.19.0, npm 11.17.0과 사용자 전역 pnpm 11.22.0을 설치하고 지속 PATH를 반영한 새 프로세스의 준비 진단을 통과했다. | 프로젝트 패키지와 앱 런타임은 아직 생성하지 않았다. |
| E-005 | LOCAL AUTH + INITIAL PUSH VERIFIED | GitHub CLI 2.97.0, Windows keyring `nvunwoo`, HTTPS Git 프로토콜과 최초 `main` push 성공을 검증했다. | 이후 변경은 `codex/*`·Draft PR 정책을 따른다. |
| E-006 | REPOSITORY GUARDS READY | `AGENTS.md`, `.gitignore`, `.gitattributes`, `.nvmrc`, 빈 `.env.example`, Draft PR 템플릿과 준비 진단 스크립트가 있다. | 앱 스캐폴드·패키지·실제 env 값·외부 프로젝트·코드·배포 완료로 확대 해석하지 않는다. |

## 사용자 작업 ID

| Action ID | 상태 | 사용자 작업 | 완료 증거 |
| --- | --- | --- | --- |
| UA-001 | COMPLETED / VERIFIED | Windows x64용 Node.js 24.19.0·npm 11.17.0과 사용자 전역 pnpm 11.22.0을 준비하고 지속 PATH를 설정했다. | 새 PATH를 반영한 진단에서 세 버전과 비-Codex pnpm 경로, `scripts/verify-development-readiness.ps1` 필수 항목 통과 |
| UA-002 | COMPLETED / VERIFIED | GitHub CLI 웹 로그인을 완료하고 로컬 HTTPS 쓰기 인증을 준비한다. | `gh auth status`에서 Windows keyring의 `nvunwoo`, HTTPS 프로토콜과 최초 push 성공 확인 |
| UA-003 | USER INPUT PENDING | 다음 단계에서 UI 시각 스타일 가이드를 제공한다. 기능 흐름과 입력 계약은 그 전에도 준비할 수 있지만 시각 스타일은 확정하지 않는다. | Q-040과 [PRESENTATION.md](../technical/PRESENTATION.md)에 가이드 반영 |
| UA-004 | TEAM RESOLVED / PROJECT GATED | Vercel 팀으로 `nvunwoo's projects`를 사용한다. `Project-Spy` 프로젝트 생성은 개발 착수 뒤 별도 승인받는다. | 팀은 확인 완료. 프로젝트 ID·Git 연결·Production branch는 아직 없음 |
| UA-005 | PROJECT CONTAINER COMPLETED / DATA GATED | `Endurance Games` Free, 월 0달러와 서울 `ap-northeast-2`를 확인하고 빈 `Project-Spy` 컨테이너를 대체 생성했다. | `ACTIVE_HEALTHY`, public table 0개, migration 0개. DB 스키마·Auth·Realtime·키·환경변수는 아직 없음 |
| UA-006 | DEVICE CLASS CONFIRMED / DETAILS PENDING | 실제 태블릿 검증은 Android Chrome으로 수행한다. 첫 실기기 테스트 전에 모델·Android 버전·RAM·Chrome 버전을 제공한다. | 최소 Android 12+ OEM 지원/current 또는 previous Chrome/WebGL2/RAM 4GB+, 권장 Android 14+/RAM 6GB+ 충족 여부 기록 |

`USER ACTION REQUIRED`는 개발 착수 전 로컬 준비를 위해 사용자가 직접 처리해야 하는 작업이다. `DEVELOPMENT GATED`는 지금 실행하지 않으며, 최종 기획 승인과 별도의 개발 착수 지시 뒤 다시 승인받는다. Android 10·11은 best-effort이고 in-app WebView는 지원 대상이 아니다.

## t0.1 후속 사용자 승인 기록

| Approval ID | 상태 | 승인 내용 | 실행 상태 |
| --- | --- | --- | --- |
| A-001 | EXECUTED / VERIFIED | `nvunwoo/Project-Spy`를 기준 저장소로 사용 | PRIVATE 기준 저장소와 최초 `main` 확인 |
| A-002 | EXECUTED / VERIFIED | pre-alpha 동안 GitHub 저장소를 private으로 전환 | 원격 가시성 PRIVATE 확인 |
| A-003 | EXECUTED / VERIFIED | 문서·보호장치 전용 최초 `main` 커밋과 push | 원격 `main`과 기준선 commit 확인 |
| A-004 | APPROVED POLICY | 향후 사용자가 요청한 범위 안에서 `codex/*` 커밋·push·Draft PR·Vercel Preview 자동 수행 | 개발 착수 권한 아님 |
| A-005 | APPROVED POLICY | `main` merge, Production deploy·promote·alias 변경·rollback과 Production DB migration은 각각 매번 별도 승인 | 정책 확정, 실행 없음 |
| A-006 | APPROVED | Vercel 팀으로 `nvunwoo's projects` 사용 | 팀 확인, 프로젝트 없음 |
| A-007 | EXECUTED / VERIFIED | Supabase `Endurance Games` Free, 월 0달러, 서울 `ap-northeast-2` 빈 프로젝트 대체 | 기존 빈 프로젝트 사용자 삭제 후 서울 프로젝트 `ACTIVE_HEALTHY`·public table 0·migration 0 확인 |
| A-008 | CONFIRMED | 실제 태블릿 검증 장치는 Android Chrome | 정확한 기기 정보 대기 |
| A-009 | USER INPUT PENDING | UI 가이드를 다음 단계에 제공 | 미수신 |

위 승인은 v0.5 전체 기획 승인이나 실제 소프트웨어 개발 착수 지시가 아니다.

## v0.5에서 해결된 맵 데이터와 경계 규칙

| ID | 상태 | 확정 결정 | 기준 문서 |
| --- | --- | --- | --- |
| Q-052 | RESOLVED | 최초 시작 좌표는 BLUE `K=P3, H=O1, F=P2, D=N1`, RED `K=A14, H=B16, F=A15, D=C16`으로 고정한다. 여덟 좌표는 모두 도로이며 시작 뒤에는 일반 도로와 동일하게 취급한다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-053 | RESOLVED | 16×16 Excel을 25개의 2×2 건물 블록과 하나로 연결된 도로망을 가진 고정 맵 템플릿으로 확정했다. 공항은 `B2:C3`, 항구는 `N14:O15`를 차지한다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-068 | RESOLVED | 맵에는 건물 부지 100칸이 있으며, 명명된 특수시설 25개가 31칸을 차지하고 나머지 69칸은 일반 건물이다. 일반 블록은 특수시설 하나와 일반 건물 셋으로 구성하고 공항·항구는 블록 전체를 차지하는 예외 시설이다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-069 | RESOLVED | A의 호텔 5개·지하철역 5개와 B의 일곱 시설은 경기 준비 때 검증된 후보 배치 중 하나로 중복 없이 생성한다. 결과는 양측에 공개하고 경기 종료까지 고정하며, 숨겨진 목표 배치 전에 완료한다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-070 | RESOLVED | 일반 건물은 진입·대기할 수 있지만 중간 통과하거나 다른 건물로 직접 이동할 수 없다. 공항·항구만 4칸 내부를 이동·통과할 수 있는 단일 건물이며, 내부의 모든 직교 이동도 이동 거리에 포함한다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-071 | RESOLVED | 충원되는 요원은 공항·항구의 합계 8칸 중 현재 아무 요원도 없는 칸에 무작위로 배치한다. 복수 동시 충원도 서로 다른 빈 칸에 중복 없이 배정한다. | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-072 | RESOLVED | 한 칸에 네 명을 채워 한 칸짜리 특수시설의 진입·목표 획득·인도·해킹을 차단하는 봉쇄는 합법적인 전술이다. 별도의 인접 상호작용 예외를 두지 않는다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-073 | RESOLVED | Excel의 `도로`, A/B/C, K/H/F/D와 충원 표시는 제작용 논리 데이터다. 실제 도로에는 문자를 표시하지 않으며, 고정 시작 유형 표기도 상대의 유형 비공개 규칙을 우회하도록 노출하지 않는다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |

## v0.4에서 해결된 경계 규칙

| ID | 상태 | 확정 결정 | 기준 문서 |
| --- | --- | --- | --- |
| Q-054 | RESOLVED | 자기 팀 활동 요원이 0명이어도 상대 팀의 자기 배신자가 생존하면 배신자 명령을 지시할 수 있다. | [턴 구조](../game-design/TURN_MODEL.md) |
| Q-055 | RESOLVED | 공항과 항구는 각각 일반 건물 셀 4개 크기의 특수 공간이며, 전체 요원 수보다 수용량이 커 충원 공간이 부족해지지 않는다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-056 | RESOLVED | 재매수 시 활동 요원이 한 명 이상이면 현재 활동 요원 중 즉시 무작위 매수하고, 0명이면 활동 요원이 생길 때까지 연기한다. | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-057 | RESOLVED | 과학자의 탈출지는 처음 획득한 국장에게만 공개한다. 운반자가 제거된 뒤 다른 요원이 과학자를 획득하면 공항과 항구를 서로 전환하고 새 획득 국장에게만 알려 준다. | [목표와 승리](../game-design/WORLD_MISSIONS.md) |
| Q-058 | RESOLVED | 원인과 관계없이 바닥에 떨어진 모든 목표물은 재획득될 때까지 양측에 계속 공개한다. | [목표와 승리](../game-design/WORLD_MISSIONS.md) |
| Q-059 | RESOLVED | 목표물 드롭 직후 같은 칸의 생존한 적격 요원에게 자동 획득을 판정하고, 여러 명이면 무작위로 한 명을 선택한다. | [목표와 승리](../game-design/WORLD_MISSIONS.md) |
| Q-060 | RESOLVED | 모든 최초 요원은 건물과 겹치지 않는 도로에서 시작한다. 공항·항구에서의 요원 스폰은 충원 때만 적용하며, 시작 좌표 및 초기 목표 배치 규칙과 독립적으로 처리한다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-061 | RESOLVED | 통신국 도청이 활성화돼 있으면 배신자에게 위장된 `대기`가 아니라 실제 `심문` 명령을 공개한다. | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-062 | RESOLVED | 경합 한쪽의 공작만 강제 실패하면 상대가 반드시 승리한다. 양쪽 모두 강제 실패하면 양쪽 모두 실패한다. 단독 행동의 강제 실패는 그대로 실패다. | [턴 구조](../game-design/TURN_MODEL.md) |
| Q-063 | RESOLVED | 심문 이력은 영구 기록하지 않는다. 현재 요원 옆의 `배신자` 또는 `배신자 아님` 표식만 유지하며, 재매수 알림이 발생하면 자기 팀 모든 요원의 심문 표식을 제거한다. | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-064 | RESOLVED | 명령한 국장은 자기 일반·배신자 명령 결과와 자기 배신자 사망을 직접 통보받는다. 피해 측에는 성공한 암살만 알리고 실패 시도·공격자·방식은 숨긴다. | [턴 구조](../game-design/TURN_MODEL.md) |
| Q-065 | RESOLVED | 상호 암살 결투는 하나의 사건이며, 두 참가자 중 높은 최종 성공률을 전역 정렬 키로 사용한다. 다른 사건과 동률이면 사건 단위로 순서를 무작위 결정한다. | [턴 구조](../game-design/TURN_MODEL.md) |
| Q-066 | RESOLVED | 확률 판정에 성공한 이동을 무작위 순서로 하나씩 처리한다. 처리 시점에 목적지가 가득 차면 차단하고 출발 칸에 남긴다. 꽉 찬 셀끼리의 맞교환도 차단된다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-067 | RESOLVED | 이동 경로는 같은 칸을 두 번 밟거나 출발 칸으로 되돌아올 수 없는 단순 경로다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |

## 아직 열린 창작 결정

| 기존 ID | 상태 | 항목 | 비고 |
| --- | --- | --- | --- |
| Q-001 | OPEN | 최종 게임명 | 현재 가제 THE MOLE |
| Q-002 | DEFERRED | 목표 평균 플레이 시간 | 첫 플레이테스트에서 측정 |
| Q-031 | OPEN | 배경 시대와 상세 세계관 | RED/BLUE/GREEN 구도는 확정 |
| Q-032 | OPEN | GREEN 국가 수도 이름 | 수도라는 배경은 확정 |
| Q-034 | OPEN | 작품 분위기 | 규칙과 독립된 창작 결정 |
| Q-035 | OPEN | 캐릭터 이름과 개별 설정 | K/H/F/D 기능은 확정 |
| Q-036 | OPEN | 전체 아트 스타일 | 개발 전 또는 시각 기획 단계에서 결정 |
| Q-037 | OPEN | 카메라 방식 | 개발 전 또는 시각 기획 단계에서 결정 |
| Q-038 | OPEN | 캐릭터 스타일 | 개발 전 또는 시각 기획 단계에서 결정 |
| Q-039 | OPEN | 도시 스타일 | 개발 전 또는 시각 기획 단계에서 결정 |
| Q-040 | USER INPUT PENDING | 색상과 UI 스타일 | 사용자가 다음 단계에 UI 가이드를 제공할 예정. 기능 UI 요구사항과 시각 스타일을 구분 |
| Q-041 | OPEN | 이동 연출과 필수 애니메이션 | 게임 판정 규칙은 이미 확정 |

## v0.3에서 해결된 게임 규칙

| 기존 ID | 상태 | 결정 요약 | 기준 문서 |
| --- | --- | --- | --- |
| Q-003 | RESOLVED | 초기 프로토타입 최대 턴 없음, 동시 두 번째 목표 확보 시 무승부 | [목표와 승리](../game-design/WORLD_MISSIONS.md) |
| Q-004~Q-007 | RESOLVED | 팀당 K/H/F/D 각 한 명, 기능과 전문 보정 확정 | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-008 | RESOLVED | 이동·해킹·암살·조사·대기·심문·숙청 | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-009 | RESOLVED | 공작 기본 60%, 전문 +20퍼센트포인트, 충성도 -10퍼센트포인트 | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-010 | RESOLVED | 암살·숙청 제거, 결원과 동일 유형 충원 | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-011 | DEPRECATED | 협력 시스템은 현재 명령 목록에 포함하지 않음 | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-012~Q-014 | RESOLVED | 묵인·이동 실패·공작 실패·동료 암살, 비용과 제한 확정 | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-015~Q-016 | RESOLVED | 심문과 숙청으로 배신자를 식별·제거 | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-017 | DEPRECATED | 기존 불신 기능을 심문·숙청으로 대체 | [요원과 배신자](../game-design/GAMEPLAY_SYSTEMS.md) |
| Q-018 | RESOLVED | 현행 국장 행동은 확정된 일곱 명령과 배신자 명령으로 제한 | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-019 | RESOLVED | 턴 할당금, 은행 잔액, 절반 적립과 시설 해킹 경제 확정 | [명령과 경제](../game-design/ORDERS_AND_ECONOMY.md) |
| Q-020~Q-022 | RESOLVED | 16×16 격자, 이동·수용량과 명명된 특수시설 25개의 종류·기능을 확정했다. 실제 25블록·100칸 구조와 일반 건물은 v0.5의 Q-053·Q-068에서 후속 확정했다. | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-023~Q-027 | RESOLVED | 목표 3종·실물 4개, 유효 목표 2개 확보 승리 | [목표와 승리](../game-design/WORLD_MISSIONS.md) |
| Q-028~Q-030 | RESOLVED | 탐지·조사·배신자·명단·목표 운반자·도청의 핵심 정보 범위 확정. 당시 별도 추적한 복합 경계 Q-057~Q-064도 v0.4에서 해결 | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |
| Q-042 | RESOLVED | 40초/10초, 확정 즉시 잠금, 시간 초과 기본 명령 확정 | [턴 구조](../game-design/TURN_MODEL.md) |
| Q-043 | RESOLVED | 이동 수용량, 암살 순서, 시설 경합과 동시 승리의 핵심 충돌 규칙 확정. 당시 별도 추적한 Q-062·Q-065·Q-066도 v0.4에서 해결 | [턴 구조](../game-design/TURN_MODEL.md) |
| Q-045 | RESOLVED | 동일 판정에서 플레이어별 공개 정보만 결과 통보 | [맵과 정보](../game-design/MAP_AND_INTELLIGENCE.md) |

## 구현 단계로 연기한 세부 결정

t0.1 기술 방향은 확정했지만 다음 항목은 게임 규칙 미정이 아니라 실제 구현·운영 단계에서 증거와 함께 구체화할 세부 계약이다.

| 기존 ID | 상태 | 항목 |
| --- | --- | --- |
| Q-044 | DEFERRED | t0.1에서 transaction·idempotency·server seed·revision 원칙은 확정했다. 구현 시 사용할 정확한 PRNG 알고리즘, seed 직렬화와 운영 기록 보존 기간은 테스트와 함께 고정 |
| Q-046 | DEFERRED | t0.1에서 128-bit 이상 링크 초대 token과 hash 저장·회수 원칙은 확정했다. 구현 시 외부 `roomId` 형식, token 만료 시간·rate limit와 초대 UI의 정확한 값은 고정 |
| Q-047 | DEFERRED | 관전 기능 |
| Q-049 | DEFERRED | t0.1에서 private Realtime 알림, foreground 3초 polling과 최대 15초 backoff는 확정했다. 구현 시 플레이테스트·비용 측정에 따른 조정값과 재접속 UX를 검증 |
| Q-050 | DEFERRED | t0.1에서 데이터 의미, API, private schema와 RLS·직접 접근 거부 계약은 확정했다. 구현 시 정확한 SQL 타입·index·migration과 provider plan 제약을 검증 |
| Q-051 | DEFERRED | t0.1 목표 모듈 트리와 의존 방향은 확정했다. 실제 scaffold 뒤 생성된 경로·패키지 버전·build output과 정합성을 검증 |

## 완료 조건

게임 기획을 개발 착수 가능한 상태로 전환하려면 다음이 필요하다.

- [x] Q-052 시작 좌표 반영
- [x] Q-053 건물 배치 반영
- [x] 활성 게임 규칙 문서 간 충돌 0건
- [x] t0.1 기술 방향과 준비·구현 경계 문서화
- [x] 외부 플러그인 연결과 로컬 환경 상태 감사
- [x] t0.1 기술 권장안 사용자 승인
- [x] UA-001 시스템 Node.js 24.19.0·npm 11.17.0·사용자 전역 pnpm 11.22.0 준비
- [x] A-002·A-003 GitHub private 전환과 문서 전용 최초 `main` push 실행·검증
- [x] UA-002 로컬 GitHub HTTPS 쓰기 인증
- [x] Supabase 기존 빈 `ap-south-1` 프로젝트 사용자 삭제와 서울 `ap-northeast-2` 빈 프로젝트 대체·검증
- [x] Android 태블릿 Chrome 검증 정책 확정
- [ ] UA-006 정확한 Android 기기 정보 기록
- [ ] UA-003 UI 시각 스타일 가이드 반영
- [ ] 사용자 최종 기획 승인
- [ ] 사용자 개발 착수 지시
