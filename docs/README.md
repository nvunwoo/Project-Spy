# 문서 지도

> 보관 기준: 2026-09-25 · 게임 기획 v0.7 · 기술/UI 계약 t0.3 · 추가 개발 예정 없음

[현재 상태](CURRENT_STAGE.md)에서 구현·검증·배포와 외부 서비스 정리 결과를 먼저 확인합니다. 여기의 기획 문서와 기술 계약은 **완성된 제품의 증거가 아닙니다.** 과거 작업 대시보드와 개발 계획 원문은 [2026-09-25 스냅샷](archive/2026-09-25/)에 보존했습니다.

## 활성 게임 기획: 규칙의 기준

| 문서 | 소유 범위 |
| --- | --- |
| [프로젝트 비전](game-design/PROJECT_VISION.md) | 세계, 핵심 경험, 승리 구조 |
| [턴 구조](game-design/TURN_MODEL.md) | 네 단계 턴, 제한 시간, 동시 해결 |
| [명령과 경제](game-design/ORDERS_AND_ECONOMY.md) | 명령, 비용, 성공률, 자금 |
| [게임플레이 시스템](game-design/GAMEPLAY_SYSTEMS.md) | 요원, 배신자, 심문·숙청, 충원 |
| [맵과 정보](game-design/MAP_AND_INTELLIGENCE.md) | 16×16 격자, 이동, 탐지, 정보 공개 |
| [목표와 승리](game-design/WORLD_MISSIONS.md) | 목표물, 운반, 확보, 승패 |

시설 배치와 시작 좌표의 원본은 [MAP.xlsx](MAP.xlsx)입니다. [결정 기록](production/OPEN_DECISIONS.md)은 해결된 규칙과 아직 열린 이름·세계관·최종 아트를 구분합니다. 루트의 THE_MOLE_GAME_DESIGN_PREP.md는 분할 이전 역사 자료입니다.

## 기술 자료

- [현재 기술 상태](technical/TECHNICAL_READINESS.md): 실제 코드, 외부 연결, 검증의 구분
- [UI/UX 계약](technical/UI_UX_CONTRACT.md): 가로 화면, HUD, 입력과 표시 기준
- [아키텍처](technical/ARCHITECTURE.md), [데이터/API](technical/DATA_AND_API.md), [구현 설계](technical/IMPLEMENTATION_BLUEPRINT.md), [3D 표현](technical/PRESENTATION.md): 실전 1대1 게임을 위한 **미실행 설계**
- [개발 재개 계획](production/FUTURE_DEVELOPMENT_PLAN.md): 우선 시작점, 단계별 완료 기준과 전체 계획
- [작업 규칙](CODEX_WORKING_RULES.md), [변경 이력](CHANGELOG.md)

외부 [UI 참고 원문](reference/ui/PROJECT_SPY_UI_DESIGN_SOURCE.md)은 비권위 자료로 보관합니다. 규칙 충돌 시 사용자의 최신 지시, 위 여섯 게임 기획, 해결된 결정 기록, 기술 계약 순서로 확인합니다.
