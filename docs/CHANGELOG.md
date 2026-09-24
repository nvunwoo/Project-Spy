# Change Log

## 2026-09-25 — 보관 전환과 정적 테스트 플레이

- 향후 추가 개발 계획 없이 현재 Phase 0B-5 로컬 훈련판을 보관하기로 했다. v0.7 게임 규칙 자체는 변경하지 않았다.
- 현재 상태·문서 지도·기술 현황을 현재 시점의 실제 구현과 미구현 범위로 다시 작성하고, 이전 작업 대시보드·로드맵·작업 규칙·기술 준비 원문은 docs/archive/2026-09-25에 보존했다.
- GitHub Pages용 정적 빌드·배포 경로와 향후 개발을 다시 시작할 경우의 단계별 계획을 추가했다. 외부 서비스 삭제·main 통합·Pages 접속 결과는 CURRENT_STAGE.md의 완료 확인에 기록한다.

이 문서는 게임 기획이나 기술 기준의 의미 있는 변화를 기록한다. 단순 편집 이력은 기록하지 않는다.

## v0.7 / t0.3 — Phase 0B-5 3D command execution — 2026-08-23

### Turn rules and command UX

- 일반 명령 제한 시간을 40초에서 50초로, 이동 기본 성공률을 60%에서 70%로 변경했다. 충성도 페널티가 있으면 이동은 60%다. 해킹·암살·조사와 그 전문 보정, 비용 등 나머지 수치는 유지한다.
- 배신자 동료 암살은 1~5턴에 불가능하고 6턴부터 활성화한다. UI 비활성화와 순수 판정기 입력 검증을 함께 적용했다.
- 요원별 마지막 공작·기타 명령 선택은 즉시 초안 저장과 패널 종료로 이어지며 별도 완료 화면과 `패널 닫기`를 제거했다.
- 명단 은닉 후보 팝업을 없애고 3D 지도 위 호텔·지하철역 후보를 초록색 점멸 표식으로 직접 선택한다. 키보드·보조기술용 접이식 목록은 같은 하단 안내 dock 안에 유지한다.

### 3D execution and card results

- 배신자 명령 뒤 `명령 수행` 단계를 추가했다. 플레이어에게 허용된 자기 요원과 통제 배신자 cue만 구성하여 이동 경로 보간, 실패 흔들림, 해킹·조사·암살·숙청 기본 도형 효과와 제거 모션을 실제 시간으로 재생한다.
- 통제 배신자를 우측 요원 현황에 별도 카드와 지도 말로 항상 표시한다. 수행 중 결과와 최종 성공·실패는 자기 요원·배신자 카드에서 실시간으로 갱신한다.
- 별도 결과 팝업, 사건 이전·다음·전체 보기와 하단 사건 바를 제거했다. 모든 재생 뒤 카드 결과를 유지한 5초 확인 시간을 거쳐 진행 중인 경기는 다음 일반 명령으로 자동 전환한다.
- `RULES_VERSION=v0.7`, `RESOLVER_VERSION=resolver.phase0b.4`, `fixtureVersion=local-turn.phase0b.4`로 올렸다. Docker·Supabase·Vercel 범위는 변경하지 않았다.

## Phase 0B-4 local replay and training UX — 2026-08-23

### Training seed and restart

- 명단 은닉 화면에 현재 seed에서 결정적으로 다음 훈련 seed를 만드는 기능과 기본 seed 복원을 추가했다. 같은 seed와 같은 명령이 같은 판정을 만든다는 로컬 훈련 계약을 화면에 명시했다.
- 결과 화면에서 같은 seed로 명단 후보 선택을 유지한 재시작과 새 seed·새 명단 선택으로 돌아가는 재시작을 분리했다. F 삭제, K/H/D 3명과 다른 v0.6 규칙·수치는 변경하지 않았다.

### Projected result replay

- 이미 BLUE 수신자용으로 투영된 턴 보고서만 처음 한 건부터 시간순으로 공개하고, 이전·다음·전체 보기·처음부터와 현재 사건 진행 수를 제공한다.
- 최근 중요 사건 바도 현재까지 공개한 투영 보고서만 사용한다. canonical 사건 또는 상대 비공개 값을 클라이언트에 보내 UI에서 숨기는 서버 replay는 구현하지 않았다.

### Verification and boundary

- lint·typecheck·format·`git diff --check`·43개 source boundary, Vitest 13파일·77테스트와 정적 `/` Next production build가 통과했다.
- Playwright desktop·Galaxy Tab S9+ 가로·compact tablet 가로·portrait gate에서 훈련 seed 생성·복원과 사건 순차 재생을 포함해 11 passed / 17 intended skips를 기록했다.
- 물리 Galaxy Tab S9+, 권위 서버·canonical 사건 저장·recipient projection 전송·두 클라이언트, Docker·Supabase·Vercel·Preview·Production은 실행하거나 검증하지 않았다. 커밋·push·`main` 병합도 수행하지 않았다.

## Phase 0B-3 local turn completeness — 2026-08-23

### Timed local turn flow

- 일반 명령에 실제 40초, 배신자 명령에 실제 10초 countdown을 연결했다. 일반 명령 만료는 저장 완료된 요원 명령만 보존하고 미지정 활동 요원 K/H/D를 `WAIT`로 채우며, 배신자 명령 미확정은 `ACQUIESCE`로 처리한다.
- HUD 제한 시간은 분 단위 없이 `40`, `10`, `09`, `08`처럼 초 단위 두 자리로 표시하고 제한 시간이 없는 단계는 `--`로 표시한다.
- interval 호출 횟수를 시간 권위로 쓰지 않고 phase별 절대 마감 시각에서 남은 시간을 계산한다. `visibilitychange`, focus와 pageshow에서 즉시 재동기화해 background timer throttling 뒤에도 만료 단계를 따라잡는다. 이 로컬 wall-clock harness는 향후 서버 시각 권위를 대신하지 않는다.
- fixture UI를 세 턴 연속 진행하는 시나리오를 추가하고 시간 초과 자동 처리 결과를 HUD status로 설명한다.

### Resolver and presentation regressions

- 동시 이동과 한 셀 최대 4명, 복수 제거와 서로 다른 공항·항구 칸 충원, 같은 Resolve의 목표 드롭·인도, 양측 동시 두 번째 목표 확보 무승부를 순수 판정 회귀로 고정했다.
- React Three Fiber 9.7.0의 안정 호환 범위에 맞춰 Three.js와 타입을 0.182.0으로 고정해 0.185 계열의 `THREE.Clock` deprecation warning을 제거했다. Next App Router icon을 추가해 로컬 favicon 404도 제거했다.

### Verification and boundary

- format·lint·typecheck·`git diff --check`·43개 source boundary, Vitest 11파일·71테스트와 정적 `/` Next production build가 통과했다.
- Playwright desktop·Galaxy Tab S9+ 가로·compact tablet 가로·portrait gate에서 10 passed / 14 intended skips를 기록했고, 로컬 브라우저의 page warning/error와 `THREE.Clock` deprecation warning은 0건이었다.
- 물리 Galaxy Tab S9+, 권위 서버·두 클라이언트, Docker·Supabase·Vercel·Preview·Production은 실행하거나 검증하지 않았다. 커밋·push·`main` 병합도 수행하지 않았다.

## v0.6 — 2026-08-22

### Game design

- RED와 BLUE의 요원을 각각 K/H/F/D 4명에서 K/H/D 3명으로 줄여 전체 요원 수를 8명에서 6명으로 변경했다.
- F를 삭제하고 F의 최대 이동 4칸 능력은 누구에게도 승계하지 않도록 확정했다. K/H/D는 모두 최대 3칸을 이동하며 기존 전문 성공률, 명령 비용·확률·제한 시간, 셀당 최대 4명, 건물·시설·목표·배신자·충원·승리 규칙과 다른 모든 수치는 유지한다.
- 수정된 `MAP.xlsx`를 다시 검증해 BLUE 시작 좌표를 `K=P3, H=P1, D=N1`, RED 시작 좌표를 `K=A14, H=A16, D=C16`으로 대체했다. F의 이전 `P2/A15` 스폰은 삭제했다.

### Implementation

- 게임 규칙 버전을 `v0.6`, 로컬 resolver를 `resolver.phase0b.3`으로 올리고 domain·player projection의 역할 집합을 `K | H | D`로 축소했다.
- 지도 manifest, canonical/player fixture, 로컬 턴 fixture, UI 요원 레일과 opaque opponent allowlist에서 F를 제거하고 새 6개 스폰을 적용했다.
- 경로 규칙은 모든 역할의 최대 이동을 3칸으로 검증하며, 충원 빈칸 보장 계산은 최대 6명 편성에 맞게 갱신했다.

### Documentation

- 여섯 활성 게임 기획 문서, 현재 단계, 문서 허브, 결정 등록부 Q-096, 기술/UI 계약과 MVP 로드맵을 v0.6 기준으로 동기화했다.
- Q-052의 v0.5 8명 스폰은 **DEPRECATED** 이력으로 보존하고, 루트 `THE_MOLE_GAME_DESIGN_PREP.md`와 외부 UI 원문은 비권위 역사·참고 자료이므로 수정하지 않았다.

### Verification

- 수정된 `MAP.xlsx`의 `Sheet1!A1:P16`을 다시 읽고 렌더링해 새 6개 스폰과 F 표식 부재를 확인했다.
- format·lint·typecheck·`git diff --check`·41개 source boundary, Vitest 10파일·62테스트와 정적 `/` Next production build가 통과했다.
- Playwright에서 desktop·Galaxy Tab S9+ 가로·compact tablet 가로의 로컬 전체 턴과 portrait 차단 gate를 다시 실행해 적용 가능한 시나리오 6개 통과와 의도된 skip 10개를 기록했다. UI는 K/H/D 카드 3개와 새 BLUE 좌표를 표시하고 F 카드를 표시하지 않는다.
- 물리 Galaxy Tab S9+, 서버·두 클라이언트, Docker·Supabase·Vercel·Preview·Production은 이번 변경에서 실행하거나 검증하지 않았다.

## Phase 0B-2 local playable slice — 2026-08-22

### Canonical map and map-linked command revision

- 지도 정본의 고정 시작 좌표 `BLUE K=P3, H=O1, F=P2, D=N1 / RED K=A14, H=B16, F=A15, D=C16`을 실제 로컬 fixture 요원 상태에 연결했다.
- 25개 2×2 부지는 도시 구획일 뿐이라는 규칙을 화면에 반영해, 공항·항구만 2×2 단일 메시로 유지하고 나머지 특수시설 23개와 일반 건물 69개를 각각 독립된 1칸 건물로 렌더링한다.
- 요원 또는 우측 요원 카드를 선택하면 요원 좌표에 소형 1차 명령판이 나타나고, 이동 뒤 지도 목적지를 직접 선택하면 빨간 대표 경로와 도착지 소형 공작판이 즉시 나타나도록 Q-079를 갱신했다. 별도 이동 팝업·경로 수정·경로 승인 단계를 제거했다.
- 특수 건물 이름은 항상 표시하고 호텔·지하철역은 hover·touch로 확인하도록 했다. 최근 보고는 중요 사건이 있을 때만 표시하며, 결과 화면을 닫은 다음 턴에는 우측 요원 카드가 이전 명령과 성공·실패를 유지한다.
- 사용자는 PC와 태블릿에서 현재 pointer·touch 입력이 작동함을 직접 확인했다. 정확한 기기 환경·S Pen·WebGL2·성능 검증은 별도 gate로 남는다. Codex 사용량은 사용자가 직접 관리하므로 저장소의 자동 중단 조건에서 제거했다.

### Local turn and fixture opponent

- `resolver.phase0b.2` 결정적 로컬 턴 상태와 fixture RED 일반·배신자 명령을 추가했다.
- 비용, 심문·숙청, 이동·수용 인원, 목표 획득·인도, 해킹·조사, 일반·동료 암살, 경제·탐지·충원·재매수 예약과 승패를 React·Three.js에서 분리된 순수 판정 slice로 연결했다.
- 명단 은닉→일반 명령→배신자 명령→결과→동일 입력 fingerprint 재판정→다음 턴과 seed·처음부터 흐름을 로컬 브라우저 UI에 연결했다. 이는 서버 권위 구현이 아니라 로컬 훈련 harness다.

### Map-first HUD revision

- 16×16 지도를 gameplay viewport 전체에 배치하고 상단 바·좌우 rail·최근 보고·명령·단계 panel을 제한된 blur의 반투명 overlay로 변경했다.
- 900px 이상 PC·태블릿에서 양쪽 rail과 정보량을 거의 동일하게 유지하고, 899px 이하 가로에서만 drawer 패턴을 사용한다.
- 지도는 자유 회전 없이 한 손가락/좌클릭 pan, 두 손가락 pinch·pan과 wheel zoom을 제공한다. 조작 중 비필수 HUD를 opacity `0.09`로 낮추고 종료 420ms 뒤 복귀한다.
- 개발 단계명·fixture 표식·반복 설명과 의미 없는 영문 eyebrow를 로비·HUD에서 제거했다.
- 도착지 DOM 목록이 명령 잠금과 겹쳐 잘못 확정되던 레이어를 수정하고, 미완성 Q-079 작성 중에는 전체 명령 잠금을 비활성화했다.

### Verification and delivery boundary

- lint·typecheck·format·`git diff --check`, 41개 source boundary, Vitest 10파일·62테스트, 정적 `/` Next production build가 통과했다.
- Playwright 1440×900 desktop·1280×800 Galaxy Tab S9+ 후보·1024×640 compact landscape·800×1280 portrait gate에서 적용 가능한 시나리오 6개 통과와 의도된 skip 10개를 기록했다.
- Codex 인앱 브라우저에서 로비부터 다음 턴까지와 같은 입력 재판정을 수동 확인했고, 후속 지도 정합성 수정에서는 고정 스폰·1칸 건물 도시·지도 연동 소형 명령판·빨간 경로를 다시 시각 점검했다. page console error는 0건이고 Three.js 의존성의 `THREE.Clock` deprecation warning은 남아 있다.
- 물리 Galaxy Tab S9+와 서버·두 클라이언트·Docker·Supabase·Vercel·Preview·Production은 통과 또는 실행하지 않았다. 로컬 개발 서버 주소는 실행 중에만 유효한 테스트 경로이며 배포가 아니다.

## Phase 0B foundation — 2026-08-22

### Approval and start

- 사용자가 v0.5 전체 게임 기획과 t0.2 기술·UI 기본안을 명시적으로 승인하고 Phase 0B 개발 착수를 지시했다.
- 구현 브랜치는 `codex/phase-0b-foundation`이며 소프트웨어 상태를 **STARTED / LOCAL FOUNDATION IN PROGRESS**로 전환했다.
- `package.json`, `pnpm-lock.yaml`, Next.js·TypeScript·React Three Fiber·Tailwind·Vitest·Playwright 기반 로컬 스캐폴드와 정확한 프로젝트 패키지가 생성됐다.

### Implemented and locally verified foundation slice

- fixture 기반 로비·HUD·Q-079 명령 작성기, Galaxy Tab S9+ 가로 전용 app shell·세로 orientation gate, 기본 도형 R3F 장면과 `SelectionIntent` 경계를 구현했다.
- React·Three.js·네트워크·persistence에 의존하지 않는 순수 domain/map/order/RNG/movement/outcome와 allowlist player projection foundation slice를 구현했다.
- lint, typecheck, format, `git diff --check`, 36개 source boundary 검사, Vitest 9파일·58테스트와 정적 `/`을 생성한 Next production build가 통과했다. production 의존성 감사는 알려진 취약점 0건, peer dependency 충돌 0건을 기록했다.
- Playwright의 1440×900 desktop·1280×800 touch landscape·1024×640 compact landscape·800×1280 portrait gate 프로젝트에서 적용 가능한 시나리오 6개가 통과했고 프로젝트 조건에 따른 10개 skip은 의도된 결과였다. agent-browser로 production Q-079 흐름, 세로 gate 뒤 가로 복귀 상태 보존과 page error 0건을 확인했다.
- 이 결과는 현재 로컬 foundation slice에 한정한다. Phase 0B 전체는 **IN PROGRESS**이며 물리 Galaxy Tab S9+의 터치·S Pen·WebGL2·성능과 전체 gameplay/server/persistence·두 클라이언트 흐름은 아직 구현 또는 검증 완료가 아니다.

### Confirmed UI decisions

- Q-079는 사진 번호가 아니라 메뉴 의미를 우선한 `요원 선택 → 이동/대기/심문/숙청 → 경로·도착지 → 이동만/조사/암살/해킹` 순서가 맞다고 사용자가 최종 확인했다.
- 목표 기기는 문맥상 추정이 아니라 **Galaxy Tab S9+**로 사용자 확인됐다. 정확한 모델 코드·OS·RAM·Chrome·CSS viewport·DPR은 첫 실기기 통과 선언 전 기록한다.
- 기존 t0.2의 “가로 우선·세로 완전 기능”은 **가로 전용**으로 대체됐다. 세로에서는 gameplay를 차단하는 방향 전환 안내를 표시하며, CSS transform으로 화면을 90도 돌리거나 portrait gameplay reflow를 만들지 않는다.
- 제공된 와이어프레임의 좌측 목표·자금·첩보 rail, 중앙 지도·경보, 우측 요원 rail, 상단 phase·시간과 명령 패널의 대략적 위치·형태를 첫 fixture UI의 배치 기준으로 유지한다.

### Explicitly deferred

- Docker Desktop, Local Supabase와 모든 Supabase SDK/CLI·schema·migration·RLS·Auth·Realtime·key·환경변수·앱 연결은 A-011 또는 후속 명시 승인 전까지 보류한다.
- Vercel project/CLI/Git Integration/Preview와 별도 Preview Supabase 프로젝트를 보류한다.
- 기존 서울 Supabase 프로젝트는 Production-reserved 빈 컨테이너로 유지하고 Local·Preview에 연결하지 않는다.
- `main` merge, Production DB 변경과 Production deploy·promote·alias·rollback은 각각 별도 승인 전까지 보류한다.

## t0.2 — 2026-08-18

> UI/UX와 개발 직전 기술 누락을 닫은 기술 준비 버전이다. 게임 기획 기준은 v0.5로 유지하며, 사용자 최종 승인과 실제 개발 착수는 아직 이뤄지지 않았다.

### UI reference and authority

- 사용자가 제공한 `PROJECT_SPY_UI_DESIGN.md`와 1920×1080 HUD·명령 와이어프레임 3개를 분석했다.
- 외부 UI 문서 안의 “프로토타입 개발 단계” 상태와 Skill 우선순위는 저장소 지시로 적용하지 않았다. 원문은 비권위 참고 입력으로 보존하고 활성 결정만 `UI_UX_CONTRACT.md`가 소유하도록 분리했다.
- 첨부 파일 번호와 메뉴 의미가 충돌해, v0.5 명령 규칙과 화면 내용을 기준으로 `요원 선택 → 이동/대기/심문/숙청 → 경로·도착지 → 이동만/조사/암살/해킹` 흐름을 t0.2 권장 기본안으로 정했다.
- 현재 칸의 0칸 공작, 실제 경로 수정·확정, 요원별 draft 저장, 전체 명령 검토·잠금과 안전한 비활성 사유를 포함했다.

### Product and interaction contract

- 임시 화면명 `PROJECT SPY`, 근미래 정보기관 작전망, dark neutral/navy·저채도 cyan·amber·muted red의 절제된 시각 언어를 첫 구현 토큰으로 정했다.
- UI 기본 언어는 한국어이며 영어는 제품명·TURN·요원 ID·좌표·상태 코드에만 보조 사용한다.
- Geist Sans는 영문·숫자, Pretendard Variable은 한글, Geist Mono는 짧은 ASCII 메타데이터에 사용하도록 역할을 나눴다.
- 로비, 초대 생성·참가·재발급, 상대 참가 대기, 비밀 명단 은닉, 작전 브리핑, 일반·배신자 명령, 실행·결과·재접속 화면 계약을 작성했다. 상대 온라인·재접속 상태는 Presence 없이 추정하지 않는다.
- 중앙 3D 도시, wide 양쪽 rail, tablet drawer/bottom sheet와 하단 명령 도크 구조를 정했다. Canvas 직접 탭과 같은 기능을 DOM 요원·목적지·대상 목록에서도 제공한다.
- 48×48 CSS px 터치 대상, pointer/touch/pen/keyboard 동등성, 한글 IME, reduced motion, 안전한 focus 복귀와 player-specific ARIA/DOM 정보를 수용 기준에 포함했다.

### Galaxy Tab and presentation

- 사용자의 “갤럭시 S9 플러스 태블릿”을 문맥상 Galaxy Tab S9+ 모델군으로 기록했다. 정확한 모델 번호·Android·RAM·Chrome·CSS viewport·DPR·WebGL2는 첫 실기기 통과 선언 전 기록한다.
- 가로를 최적 경험으로 삼되 세로에서도 모든 기능을 제공한다. 물리 해상도가 아니라 실제 CSS viewport, `100dvh`, safe area, `visualViewport`, 방향 전환과 분할 화면을 기준으로 배치한다.
- 첫 카메라는 북쪽 고정 3/4 perspective, 자유 회전 없음, 제한된 two-finger pan·pinch zoom과 mouse pan·wheel zoom, DOM 시점 초기화를 사용한다.
- 실행 연출은 서버 결과만 재생한다. waiting/setup의 WebGL2·Canvas 실패는 호환성·취소 화면으로 처리하고, active membership은 재접속 첫 load나 context 복구 실패부터 동일 논리 ID·API를 쓰는 단순 2D 격자와 DOM 명령 폴백으로 이어 간다.

### Server, data, and lobby readiness

- 로비와 첫 턴 사이에 누락돼 있던 `ROSTER_PLACEMENT_OPEN/RESOLVING`을 추가했다. 양측이 같은 호텔·지하철역을 고르면 상대 위치를 공개하지 않고 두 선택을 원자적으로 무효화해 새 round에서 재선택한다.
- 두 번째 참가 때 서버가 RED/BLUE를 50:50으로 한 번 무작위 배정하고 재시도·재접속으로 재추첨하지 않도록 정했다. 별도 Ready 토글은 추가하지 않는다.
- 완성된 요원별 일반 명령을 본인만 볼 수 있는 mutable server draft로 저장한다. 각 upsert에서 플레이어 전체 draft 집합의 예산·횟수·상호 배타 제한을 검증하고, 40초 만료 시 합법인 마지막 저장 draft를 그대로 snapshot한 뒤 미지정 활동 요원만 `WAIT`로 채운다.
- phase 진입 시 활동 가능 요원 0명 또는 조종할 배신자 없음은 owner private version을 가진 server-default submission으로 즉시 확정하고, 양측 모두 자동이면 timer 없이 다음 phase까지 원자적으로 진행한다.
- 내가 잠그기 전에는 상대의 draft·잠금 여부·정확한 시각을 projection과 Realtime에서 숨기고, 양측 완료나 phase 전환 때만 공유 revision을 갱신하도록 정했다.
- 이동 선택 UI는 공개 map topology만 사용하며 숨은 적 점유에 따라 목적지를 제거하거나 오류를 다르게 반환하지 않는다. 실제 수용 인원은 Resolve에서 판정한다.
- 방 생성 전에도 non-null `room:create` scope를 사용하는 멱등성, 범주 안 stable ID row-lock 순서와 제한된 deadlock/serialization transaction 재시도를 추가했다. 생성 응답·로컬 key 유실은 자기 작전 복구 → 새 링크 발급으로 처리하고, waiting host 취소·active invite 단일성·cancel↔join 경합을 계약했다. 두 번째 참가 뒤에는 `setup`, 첫 일반 명령부터 `active`로 구분하고 어느 setup player나 작전을 취소해 무제한 명단 은닉 정체를 끝낼 수 있게 했다.
- shared revision을 올리지 않는 setup/general/mole 단독 lock에는 owner-only scope별 `private_input_version`을 추가하고 모든 JSON 응답에 `contractVersion`을 포함하도록 wire contract를 닫았다.
- room create·invite rotate의 멱등성은 canonical resource에만 적용하고 일회성 원문 token은 재생하지 않는다. 내부 `rotate_required`는 public wire의 `rawInviteTokenIncluded: false`·`inviteRecoveryAction: "rotate"`로 투영하며 새 key rotate만 새 원문을 반환한다. invite URL은 fragment-only·즉시 주소 제거·memory-only로 고정했다.
- 사용자별 private active-game claim으로 하나의 anonymous session이 waiting·setup·active 작전 하나만 갖게 하고, 서로 다른 create·join 경합·terminal 해제·같은 game join 재시도 순서를 계약했다.
- invite 60분 TTL·host 만료/재발급 UX, durable create/join/rotate fixed-window rate limit와 429 `Retry-After` 기본값을 고정했다. committed idempotency result는 24시간 replay·그 뒤 410/tombstone, `rate_limited`는 window 종료 후 같은 key 재claim, rate bucket은 window 종료 24시간 뒤 정리한다. expected 4xx는 domain savepoint만 rollback해 guard를 commit하고 unexpected DB/503은 전체 rollback하도록 경계를 닫았다.
- Vercel의 기본 Production Branch·최초 import 배포와 승인 정책의 충돌을 막기 위해 guard-only remote-main 선반영, deployment 없는 project create/link, 연결 직후 Production 0건 검증, 승인된 main SHA의 별도 clean detached worktree·lockfile-pinned CLI 수동 Production만 허용하는 전달 계약을 추가했다.

### Environment topology

- t0.2 최종 감사에서 사용자 전역 pnpm 설치 경로가 호스트 사용자 PATH에서 빠진 상태를 발견해 `C:\Users\USER\AppData\Roaming\npm`을 복원하고, 새 환경에서 Node.js 24.19.0·npm 11.17.0·pnpm 11.22.0과 core app 준비 진단을 다시 통과했다.
- 준비 진단을 core app 기본 실행과 `-RequireLocalSupabase` backend gate로 분리했다. 실제 host의 core 항목은 통과했고, backend gate는 미설치 Docker daemon과 project Supabase CLI 두 항목으로 의도대로 실패했다. Windows 권장 container runtime은 Docker Desktop이고 CLI는 개발 착수 뒤 project devDependency로 고정한다.
- 기존 서울 Supabase 프로젝트는 Production-reserved 빈 컨테이너로 보존한다.
- Local은 로컬 Supabase CLI stack, Preview는 추후 명시 승인된 별도 프로젝트를 사용하도록 통일했다. Preview와 Production은 데이터·키·콜백 URL을 공유하지 않는다.
- 서울 컨테이너는 존재하지만 게임용 schema·RLS·function, Anonymous Auth 설정, private Realtime policy와 앱 key/env 연결은 미구성이라는 현재 사실로 오래된 “Supabase 프로젝트 미생성” 문구를 정정했다. 플랫폼이 자동 제공하는 endpoint·key 존재 여부와 앱 구성 여부를 분리하고 key 값은 조회·기록하지 않았다.

### Implementation status

- 코드, 앱 스캐폴드, `package.json`, 프로젝트 패키지, Supabase schema·Auth·Realtime, 별도 Preview 프로젝트, Vercel 프로젝트, PR과 배포는 생성하거나 변경하지 않았다.
- 소프트웨어 상태는 **NOT STARTED**다. 다음 명령에서 사용자가 v0.5와 t0.2 기본안을 승인하고 개발 착수를 명시해야 Phase 0B로 전환한다.

## t0.1 — 2026-08-18

> 기술 준비 버전이다. 게임 기획 기준은 v0.5로 유지하며, 전체 게임 기획의 최종 승인이나 개발 착수를 의미하지 않는다.

### Technical readiness

- 목표 플랫폼을 PC 웹에서 PC·태블릿 웹 브라우저로 확장했다.
- 3D 체스판형 도시, 단순 도형 데모 건물·캐릭터와 향후 3D 모델 교체 가능 계층을 기술 요구사항으로 기록했다.
- 게임 시작 전 각 플레이어의 닉네임 지정 단계를 필수로 확정하고 Q-048을 `RESOLVED`로 전환했다.
- 기술 기준을 Next.js + TypeScript, React Three Fiber, Vercel, Supabase로 유지했다.
- 1대1 온라인 경기는 하나의 서버 권위 상태·턴 판정을 공유하고 플레이어별 허용 정보만 전달하는 경계를 유지했다.
- Phase 0A의 기술 감사·문서 준비와 Phase 0B 이후의 프로젝트 생성·패키지 설치·구현을 분리했다.

### Environment and connections

- GitHub·Vercel·Supabase Codex 플러그인의 설치·인증을 읽기 전용으로 확인했다.
- GitHub 커넥터가 `nvunwoo/Project-Spy` 공개 빈 저장소에 admin·push 권한을 가진 것을 확인했다.
- 로컬 저장소에는 커밋이 없고 현재 문서가 모두 untracked이며, 로컬 HTTPS 쓰기 인증이 별도로 필요함을 기록했다.
- Vercel `nvunwoo's projects` 팀은 연결됐지만 `Project-Spy` 프로젝트가 없음을 확인했다.
- Supabase `Endurance Games` 조직의 최초 조회에서는 프로젝트가 없는 것으로 판단했지만, 후속 조회에서 기존 `Project-Spy`가 `ap-south-1`에 `ACTIVE_HEALTHY`로 존재함을 확인했다. public table과 migration은 각각 0개이며 이번 작업에서 생성·변경하지 않았다.
- Git·Git LFS·Chrome·Edge·VS Code를 확인했다. 이후 Node.js 24.19.0·npm 11.17.0과 사용자 전역 pnpm 11.22.0을 준비하고 지속 PATH와 읽기 전용 준비 진단을 통과했다.
- 초기 Codex 부모 프로세스는 설치 전 PATH snapshot을 유지했으며, 후속 새 프로세스에서 지속 PATH를 다시 확인했다.
- 후속 UI 가이드와 개발 착수 뒤 Vercel 프로젝트 승인을 사용자 작업으로 추적한다.
- `AGENTS.md`, `.gitignore`, `.gitattributes`, `.nvmrc`, 비밀값은 비어 있고 비민감 기본값만 있는 `.env.example`, Draft PR 템플릿과 읽기 전용 준비 진단 스크립트를 Phase 0A 저장소 보호장치로 추가했다.

### Governance

- 비밀키·토큰·비밀번호·Supabase secret/service-role 키를 문서, 저장소, 로그, 커밋과 PR에 기록하지 않는 규칙을 명시했다.
- 기본 전달 경로를 `codex/*` 브랜치 → 로컬 검증 → Draft PR → Vercel Preview로 정리했다.
- 사용자 승인과 `main` 병합 전에는 Production 배포, promote와 Production alias 변경을 금지했다.
- UI 시각 스타일 Q-040은 사용자의 후속 가이드를 기다리는 `USER INPUT PENDING`으로 유지했다.

### Follow-up approvals

- 사용자가 t0.1 기술 권장안과 `nvunwoo/Project-Spy` 기준 저장소 사용을 승인했다. 이는 v0.5 전체 기획 승인이나 개발 착수 지시가 아니다.
- pre-alpha private 전환과 문서·보호장치 전용 최초 `main` 커밋·push를 승인했다. 승인 시점의 저장소는 아직 public·empty이고 로컬 파일은 untracked다.
- 향후 사용자가 요청한 범위 안에서 `codex/*` 커밋·push·Draft PR·Vercel Preview를 자동 수행하도록 승인했다. 이 정책은 요청되지 않은 개발을 시작할 권한이 아니다.
- `main` merge, Production deploy·promote·alias 변경·rollback과 Production DB migration은 각각 매번 별도 사용자 승인을 받도록 확정했다.
- Vercel 팀으로 `nvunwoo's projects`를 승인했지만 `Project-Spy` 프로젝트 생성은 승인하지 않았다.
- Supabase는 `Endurance Games` Free와 향후 서울 `ap-northeast-2` 리전을 승인했다. 신규 프로젝트 예상 비용 조회 결과는 월 0달러지만, 기존 `ap-south-1` 프로젝트 채택·삭제·재생성과 서울 프로젝트 생성은 승인하지 않았다.
- 실제 태블릿 검증 장치를 Android Chrome으로 확정했다. 최소 기준은 Android 12 이상 OEM 지원 기기, current 또는 previous Chrome, WebGL2와 RAM 4GB 이상이며 Android 14 이상·RAM 6GB 이상을 권장한다. Android 10·11은 best-effort이고 in-app WebView는 지원하지 않는다.
- 정확한 태블릿 모델·Android 버전·RAM·Chrome 버전과 UI 가이드는 후속 입력으로 유지했다.

### Follow-up execution evidence

- Node.js 24.19.0, npm 11.17.0과 사용자 전역 pnpm 11.22.0을 확인하고 `scripts/verify-development-readiness.ps1` 필수 항목을 통과했다.
- 기존 Supabase `Project-Spy`의 생성 시각 `2026-08-18T06:44:41Z`, 리전 `ap-south-1`, `ACTIVE_HEALTHY`, public table 0개와 migration 0개를 읽기 전용으로 확인했다.
- 사용자는 위 `ap-south-1` 프로젝트가 플러그인 연동 때 직접 만든 것이며 보호할 기존 데이터가 없다고 확인하고, 이를 삭제하거나 서울 프로젝트로 대체하도록 명시적으로 승인했다.
- 사용자가 기존의 비어 있는 `ap-south-1` 프로젝트를 삭제했다. 월 0달러 비용을 다시 확인한 뒤, 명시적 승인 범위에서 `Endurance Games` 조직의 같은 이름 프로젝트를 `2026-08-18T06:48:01Z`에 서울 `ap-northeast-2`로 생성하고 `ACTIVE_HEALTHY`, public table 0개와 migration 0개를 확인했다.
- 대체 Supabase 프로젝트에는 스키마·RLS·Auth·Realtime·키·환경변수와 애플리케이션 연결을 생성하거나 구성하지 않았다.
- GitHub CLI 2.97.0을 설치하고 로컬 자격 증명 저장소의 `nvunwoo` 인증과 HTTPS Git 프로토콜을 검증했다.
- GitHub `nvunwoo/Project-Spy`를 **PRIVATE**으로 전환하고, 승인된 문서·보호장치 전용 최초 `main` 기준선을 게시해 원격 브랜치와 commit을 검증했다.
- Vercel `Project-Spy` 프로젝트는 여전히 존재하지 않으며 Preview·Production 배포도 만들지 않았다.

### Implementation

- 없음. 승인된 Supabase 빈 프로젝트 컨테이너와 GitHub 저장소 가시성·로컬 인증·문서 기준선 외에 애플리케이션 프로젝트, 코드, 프로젝트 패키지, DB 스키마·RLS·Auth·Realtime, 환경변수, Vercel 프로젝트, PR과 Preview·Production 배포는 생성하거나 변경하지 않았다. 소프트웨어 상태는 계속 **NOT STARTED**다.

## v0.5 — 2026-08-18

### Game design

- 사용자가 제공한 `MAP.xlsx`의 16×16 고정 템플릿, 25개의 2×2 건물 블록, 하나로 연결된 도로망과 실제 시작 좌표를 확정했다.
- 기존의 `건물 25개·건물 칸 31개`를 `명명된 특수시설 25개·특수시설 점유 칸 31개`로 재정의하고, 전체 건물 부지 100칸 중 나머지 69칸을 일반 건물로 확정했다.
- A 블록 10개에는 호텔 5개와 지하철역 5개를, B 블록 7개에는 일곱 종류의 시설을 중복 없이 배치하도록 확정했다.
- A/B 시설은 경기 준비 때 검증된 후보 배치 중 하나를 선택하고 양측에 공개한 뒤 경기 종료까지 고정하도록 확정했다.
- 일반 건물은 진입·대기 가능한 최종 목적지지만 목표 은신·해킹 기능이 없고, 이동 경로 중간에 통과하거나 인접한 다른 건물로 직접 이동할 수 없도록 확정했다.
- 공항과 항구는 각각 4칸을 차지하는 하나의 건물이며, 내부 칸 사이를 이동하거나 시설을 가로질러 통과할 수 있는 유일한 건물 예외로 확정했다. 내부의 각 직교 이동도 이동 거리에 포함한다.
- 공항과 항구의 각 4칸 모두 과학자 도착 판정 지점으로 유지했다.
- 충원 요원은 공항·항구 합계 8칸 중 현재 요원이 없는 칸에 무작위로 생성하며, 복수 동시 충원은 서로 다른 빈 칸에 중복 없이 배정하도록 변경했다.
- 한 칸을 네 명으로 채워 특수시설의 진입·목표 획득·인도·해킹을 막는 봉쇄를 합법적인 전술로 확정했다.
- BLUE 시작 좌표를 `K=P3, H=O1, F=P2, D=N1`, RED 시작 좌표를 `K=A14, H=B16, F=A15, D=C16`으로 확정했다.
- 도로에는 일방통행·진영 제한·추가 이동 비용·지형 차단이 없지만, 기존의 직교 이동·최대 거리·단순 경로 규칙은 유지하도록 명확히 했다.
- Excel의 `도로`, A/B/C, K/H/F/D와 충원 표시는 제작용 논리 데이터이며 실제 도로에 문자를 표시하지 않도록 확정했다.

### Documentation

- 여섯 활성 게임 기획 문서와 현재 단계·미결정 등록부·문서 허브·MVP 로드맵을 v0.5 기준으로 갱신했다.
- Q-052와 Q-053을 `RESOLVED`로 전환하고, 새 맵 경계 규칙 Q-068~Q-073을 해결 이력으로 추가했다.
- 사용자 입력 대기였던 시작 좌표와 건물 배치 Excel을 실제 좌표·블록·시설 생성 계약으로 반영했다.
- v0.5 활성 규칙 문서의 의미 교차 감사, 상대 링크, 엄격한 UTF-8 디코딩과 수치·좌표 검사를 통과했다.
- 기술 준비 문서는 계속 `DEFERRED` 상태로 유지하고, 검증된 시드의 생성·저장 구현은 개발 착수 뒤 구체화하도록 남겼다.

### Pending user input

- v0.5 전체 게임 기획의 최종 승인
- 명시적인 개발 착수 지시
- 최종 게임명과 세계관·아트 관련 P1 창작 결정은 별도 OPEN 상태로 유지

### Implementation

- 없음. 코드, 패키지, 데이터베이스, 외부 서비스와 배포 설정은 변경하지 않았다.

## v0.4 — 2026-08-18

### Game design

- Q-054~Q-067의 경계 규칙을 모두 확정했다.
- 자기 팀 활동 요원이 0명이더라도 상대 팀의 자기 배신자가 생존하면 배신자 명령을 계속 내릴 수 있도록 확정했다.
- 공항과 항구를 각각 일반 건물 셀 4개 크기의 특수 공간으로 변경했다. 건물 인스턴스 수는 25개지만 실제 건물 점유 셀은 총 31칸이다.
- 공항·항구의 시설별 수용량을 16명으로 확정하여 충원 공간 부족과 충원 연기 규칙을 제거했다.
- 불완전 편제에서도 활동 요원이 한 명 이상이면 재매수를 즉시 진행하고, 0명이면 활동 요원이 생길 때까지 연기하도록 확정했다.
- 과학자의 현재 탈출지는 획득한 국장에게만 공개하도록 확정했다.
- 과학자 운반자가 제거된 뒤 다른 요원이 획득하면 획득 팀과 관계없이 탈출지를 공항과 항구 사이에서 반드시 전환하도록 확정했다.
- 모든 드롭 목표물을 양측에 공개하고, 드롭 칸의 적격 생존 요원에게 즉시 자동 획득을 다시 판정하도록 확정했다.
- 최초 요원은 모두 건물이 아닌 도로에서 시작하도록 확정했다.
- 통신국 도청과 심문 위장이 겹치면 도청이 우선하여 실제 `심문`을 보여 주도록 확정했다.
- 경합 한쪽만 강제 실패하면 상대가 반드시 승리하고, 양쪽 모두 강제 실패하면 양쪽 모두 실패하도록 확정했다.
- 심문 영구 이력을 폐기하고 현재 요원의 표식만 유지하며, 재매수 알림 때 자기 팀 전원의 표식을 제거하도록 확정했다.
- 명령한 국장에게 자기 일반·배신자 명령 결과와 자기 배신자 사망을 통보하고, 실패한 암살은 피해 측에 숨기도록 확정했다.
- 상호 암살 결투를 하나의 전역 암살 사건으로 정렬하도록 확정했다.
- 성공 판정을 통과한 이동을 무작위 순서로 하나씩 처리하고, 꽉 찬 셀의 교차 이동을 차단하도록 확정했다.
- 이동 경로를 같은 칸을 반복하지 않는 단순 경로로 확정했다.

### Documentation

- 여섯 활성 게임 기획 문서를 v0.4로 갱신했다.
- Q-054~Q-067을 모두 `RESOLVED`로 전환하고 현재 단계의 규칙 확인 대기를 종료했다.
- 맵 Excel 입력 계약을 건물 인스턴스 25개와 점유 셀 31칸 기준으로 갱신했다.
- 여섯 활성 규칙 문서의 의미 교차 감사, 전체 Markdown 상대 링크, 엄격한 UTF-8과 대체 문자 검사를 통과했다.
- 기술 준비 문서는 계속 `DEFERRED` 상태로 유지했다.

### Pending user input

- 도로 위에 배치될 RED·BLUE 각 4명, 총 8명 요원의 시작 좌표
- 공항·항구의 각 4칸 면적을 포함한 건물 배치 Excel

### Implementation

- 없음. 코드, 패키지, 데이터베이스, 외부 서비스와 배포 설정은 변경하지 않았다.

## v0.3 — 2026-08-18

### Game design

- 최신 상세 기획을 기존 초안보다 우선하는 활성 게임 규칙으로 반영했다.
- 턴을 명령 → 배신자 명령 → 실행 → 결과 통보 네 단계로 확정했다.
- 일반 명령 40초, 배신자 명령 10초와 확정 즉시 잠금 및 시간 초과 기본 행동을 확정했다.
- 각 팀을 K/H/F/D 한 명씩 총 네 명으로 확정하고, 상대 팀 한 명을 배신자로 지정하는 구조를 확정했다.
- 일반 명령을 이동·해킹·암살·조사·대기·심문·숙청으로 확정했다.
- 배신자 명령을 묵인·이동 실패·공작 실패·동료 암살로 확정했다.
- 공작 기본 성공률 60%, 전문 보정 +20퍼센트포인트, 무고한 숙청 페널티 -10퍼센트포인트를 확정했다.
- 턴 할당금 3,000달러, 미사용 할당금 절반 적립, 기존 은행 잔액 유지 규칙을 확정했다.
- 동료 암살 비용을 2,500달러로 확정하고 일반 암살보다 낮은 우선순위를 부여했다.
- 일반 암살을 최종 성공률 순서로 처리하고 먼저 제거된 요원의 미실행 암살을 취소하도록 확정했다.
- 상호 암살 특별 결투의 적용 범위를 최종 위치에서 서로의 3×3 범위 안에 있는 상호 지정 대상으로 확장했다.
- 팀별 턴당 숙청을 한 명으로 제한하고 확정 전 경고와 취소를 요구했다.
- 사망 원인별 결원·충원과 배신자 재매수 절차를 확정했다.
- 충원 위치를 수용 공간이 있는 공항 또는 항구 중 무작위 장소로 확정했다.
- 연결형 노드 맵을 16×16 정사각형 격자로 대체하고 건물을 경로 장애물이자 도착지로 확정했다.
- 건물 25개의 종류와 수량을 확정하고 상세 좌표는 사용자 Excel 입력으로 남겼다.
- 기본 3×3 탐지, 조사 5×5, 적 유형·행동 비공개, 배신자 유형 예외를 확정했다.
- 목표 종류 3개, 실제 목표물 4개, 플레이어별 유효 목표 3개와 2개 확보 승리를 확정했다.
- 명단 정보 효과가 재획득 때마다 다시 발동하고 다음 턴 명령 단계까지만 유지되도록 확정했다.
- 같은 시설 동시 해킹은 최종 해킹 성공률이 높은 팀이 확정 성공하고 동률만 무작위로 처리하도록 확정했다.
- 은행 해킹의 다음 2턴 할당금을 3,000달러에서 2,000달러로 변경했다.
- 통신국 도청 시 상대 일반 명령 전체를 공개하고 피해자에게 도청 사실을 알리되 배신자 명령은 숨기도록 확정했다.
- 초기 프로토타입에는 최대 턴을 두지 않고 동시 두 번째 목표 확보는 무승부로 확정했다.

### Documentation

- [CURRENT_STAGE.md](./CURRENT_STAGE.md)를 추가해 현재 단계와 다음 작업의 단일 대시보드로 지정했다.
- 게임 기획을 프로젝트 비전, 턴, 명령·경제, 요원·배신자, 맵·정보, 목표·승리의 여섯 기준 문서로 재편했다.
- 미결정 사항 등록부를 v0.3 결정 상태에 맞게 갱신했다.
- 기존 불신 기능과 협력·미행·감시·보호 등의 과거 후보를 현행 규칙에서 제외했다.
- 기술 준비 문서는 개발 착수 전까지 초안 상태로 유지했다.

### Pending user input

- RED·BLUE 각 4명, 총 8명 요원의 시작 좌표
- 건물 25개의 16×16 배치 Excel
- 교차 감사에서 발견된 판정·정보 공개 경계 Q-054~Q-067의 사용자 확정

### Implementation

- 없음. 코드, 패키지, 데이터베이스, 외부 서비스와 배포 설정은 변경하지 않았다.

## v0.2 — 2026-08-18

### Changed

- 단일 준비 문서를 게임 디자인, 기술 설계, 제작 계획, 미결정 사항, 작업 규칙으로 분리했다.
- **CONFIRMED**, **TBD**, **CANDIDATE**, **DEPRECATED**의 의미를 문서 허브에 명시했다.
- 기술 선택 상태와 실제 세팅 완료 상태를 분리했다.
- 원문의 미결정 항목에 안정적인 Q-ID를 부여했다.
- 루트 원문을 분할 전 v0.1 비권위 스냅샷으로 보존했다.

### Clarified

- 조직당 배신자 1명은 최종 확정이 아니라 현재 기본안이다.
- 예상 턴 처리 순서, 데이터 모델, API 경로, 프로젝트 구조는 초안이다.
- 권위 있는 턴 판정의 일치와 플레이어별 비밀 정보 가시성은 별도 계약이다.
- MVP와 개발 로드맵은 아직 실행되지 않았다.

### Game design decisions

- 없음. 이번 버전은 문서 구조만 변경했다.

## v0.1

- 초기 기획 / 기술 준비 문서 작성
- 1대1 웹 기반 턴제 구조 정의
- 동시 명령 / 동시 실행 구조 정의
- 배신자 기본 개념 정의
- 서버 권위 방식 정의
- GitHub + Vercel + Supabase 기반 기술 스택 정의
- 게임 로직 / 3D 연출 분리 원칙 정의

다음 변경: **TBD**
