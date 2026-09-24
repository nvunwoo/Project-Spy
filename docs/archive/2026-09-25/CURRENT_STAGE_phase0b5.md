# 현재 개발 단계

> 마지막 갱신: 2026-08-23<br>
> 기획 기준 버전: v0.7<br>
> 기술 준비 기준: t0.3<br>
> 현재 단계: **PHASE 0B-5 — 3D COMMAND EXECUTION LOCAL VERIFIED**<br>
> 기준 승인 상태: **v0.7 + t0.3 USER CONFIRMED — 2026-08-23**<br>
> 소프트웨어 개발 상태: **STARTED — `codex/phase-0b-foundation`**

이 문서는 현재 무엇을 하고 있으며 다음에 무엇을 해야 하는지를 보여주는 작업 대시보드다. 세부 게임 규칙을 이 문서에 복제하지 않고 각 기준 문서로 연결한다.

## 현재 목표

승인된 v0.7 게임 기획과 t0.3 기술·UI 계약을 기준으로 로컬 Phase 0B를 구현한다. Next.js·TypeScript·React Three Fiber 기반 앱, 지도 직접 명단 은닉부터 여러 턴까지의 fixture 플레이, Q-079 즉시 명령 저장, 실제 50초·10초·5초 마감과 자동 기본 명령, 수신자 투영 3D 명령 수행, 우측 요원·배신자 카드 결과, 결정적 로컬 턴 판정과 복합 회귀를 포함한 **Phase 0B-5 3D command execution slice는 IMPLEMENTED / LOCAL VERIFIED**다. Phase 0B 전체는 서버 권위·persistence·두 클라이언트·실기기 범위가 남아 있어 계속 **IN PROGRESS**다.

### Phase 0B-5 진행 체크포인트 — 2026-08-23

- **IMPLEMENTED / UNIT VERIFIED** — `resolver.phase0b.4` 로컬 턴 상태, 결정론적 fixture RED 일반·배신자 명령과 같은 seed·명령 재실행 fingerprint
- **IMPLEMENTED / UNIT VERIFIED** — 비용, 심문·숙청, 이동·수용 인원, 목표 자동 획득, 해킹·조사, 일반·동료 암살, 목표 인도, 경제, 탐지, 충원·재매수 예약과 승패 판정의 로컬 수직 slice
- **IMPLEMENTED / BROWSER VERIFIED** — 초록색 점멸 건물 지도 직접 명단 은닉 → 일반 명령 즉시 저장 → 배신자 명령 → 3D 명령 수행 → 우측 카드 결과 5초 → 다음 턴 자동 전환
- **IMPLEMENTED / BROWSER VERIFIED** — 일반 명령 50초·배신자 명령 10초·재생 후 결과 5초 실제 countdown, 일반 명령 만료 시 저장된 완전 초안 보존과 미지정 K/H/D만 `WAIT`, 배신자 명령 만료 시 `ACQUIESCE`, 결과 뒤 다음 턴 자동 전환
- **IMPLEMENTED / UNIT+BROWSER VERIFIED** — interval tick 누적이 아니라 절대 마감 시각을 기준으로 visibility·focus·pageshow 때 남은 시간을 재계산하고, fixture를 세 턴 연속 진행
- **IMPLEMENTED / UNIT+BROWSER VERIFIED** — 기본 seed 복원, 현재 seed에서 다음 훈련 seed 결정적 생성, 같은 seed·새 seed 재시작과 같은 seed·명령의 판정 재현 안내
- **IMPLEMENTED / COMPONENT+BROWSER VERIFIED** — 별도 결과 팝업·사건 넘기기를 제거하고 BLUE 수신자에게 허용된 실행 cue만 3D 지도에서 재생하며 우측 자기 요원 3명·통제 배신자 카드에 실시간 결과를 표시. canonical 사건이나 상대 비공개 데이터는 이 UI에 전달하지 않음
- **IMPLEMENTED / UNIT VERIFIED** — 동시 이동·셀 4명 수용·복수 제거와 충원·목표 드롭과 인도·동시 승리 무승부의 순수 판정 회귀
- **IMPLEMENTED / LOCAL VERIFIED** — 팀당 K/H/D 3명, F와 4칸 이동 능력 삭제, 지도 문서의 고정 스폰 `BLUE K=P3, H=P1, D=N1 / RED K=A14, H=A16, D=C16`을 실제 fixture에 적용
- **IMPLEMENTED / LOCAL VERIFIED** — 공항·항구만 2×2 단일 건물로 그리고 나머지 특수·일반 건물 92개를 각각 독립된 1칸 건물로 표현
- **IMPLEMENTED / BROWSER VERIFIED** — Q-079 `요원 → 이동 → 지도 목적지 직접 선택 → 빨간 대표 경로 + 도착 공작`, 지도에 붙어 움직이는 소형 명령판, 미완성 명령 잠금 방지와 접힌 map DOM 대체 입력
- **IMPLEMENTED / BROWSER VERIFIED** — 전체 화면 지도, 반투명 overlay HUD, 1024px 이상 PC·태블릿 동일 좌우 rail, pan·zoom 중 비필수 HUD 9% opacity와 420ms 복귀, 자유 회전 금지
- **IMPLEMENTED / BROWSER VERIFIED** — React Three Fiber 9.7.0과 호환되는 Three.js 0.182.0 고정으로 `THREE.Clock` deprecation warning 제거
- **AVAILABLE / LOCAL ONLY** — PC `127.0.0.1:3100`과 같은 Wi-Fi의 개발 PC IPv4 `:3100` 테스트 경로. 개발 서버 실행 중에만 유효하며 배포가 아니다.

안전한 재개 지점은 이 문서의 **다음 작업**이다. 사용자는 현재 fixture의 PC·태블릿 터치 작동을 직접 확인했다. 다음에는 같은 Wi-Fi 링크에서 지도 직접 명단 은닉, 즉시 명령 확정, 3D 명령 수행과 5초 결과 유지가 실제 Galaxy Tab S9+에서 자연스러운지 확인하고 지도 연동 명령판의 위치·겹침, 시설명 밀도와 우측 결과 카드 가독성을 플레이 피드백으로 조정한다. 외부 서비스 없이 계속한다면 실행 모션·교체 가능한 VFX 표현과 오류·빈 상태의 남은 경계를 보강한다. Docker·Supabase·Vercel·Preview·Production은 계속 보류한다. Codex 사용량은 사용자가 직접 관리하며 저장소 작업 중단 조건으로 자동 추적하지 않는다.

## 현재 허용 범위

- `codex/phase-0b-foundation`의 로컬 Next.js + TypeScript + React Three Fiber 앱 스캐폴드와 정확한 패키지·`pnpm-lock.yaml`
- CSS custom-property token, Geist/Pretendard와 선별된 source-owned UI primitive
- fixture player projection을 사용하는 한국어 로비·HUD·명령 작성 UI와 오류·빈 상태
- Q-079의 `요원 선택 → 이동/대기/심문/숙청 → 지도 목적지 직접 선택 → 대표 경로·이동만/조사/암살/해킹` 상태 흐름
- Galaxy Tab S9+ 및 긴 가로 화면을 위한 landscape-only app shell, 포인터·터치·펜·키보드 동등 경로
- 세로 viewport에서 gameplay를 차단하고 기기 회전을 안내하는 접근 가능한 orientation gate
- 기본 도형 R3F 장면과 `SelectionIntent`, 논리 좌표·표현 좌표 adapter 경계
- React·Three.js·네트워크·persistence와 분리된 결정적 순수 규칙과 fixture projection
- lint, typecheck, unit/component test, production build와 로컬 Playwright desktop·tablet landscape·portrait-gate 검증
- 현재 단계·결정·구현 사실의 기준 문서 동기화

## 현재 비범위

- Docker Desktop 설치·실행과 Docker API 검증
- Local Supabase stack과 Supabase CLI·SDK 설치 또는 연결
- Supabase schema·table·migration·RLS·Auth·Realtime·function·key·환경변수 생성 또는 변경
- 기존 서울 Production-reserved Supabase 프로젝트의 Local·Preview 연결
- 별도 Preview Supabase 프로젝트 생성
- Vercel CLI·프로젝트·Git Integration·환경변수·Preview 생성
- `main` merge와 Production DB migration·배포·promote·alias·rollback
- 실제 서버 API·persistence·1대1 온라인 동기화
- 세로 gameplay reflow 또는 CSS transform으로 화면을 90도 회전하는 구현
- 최종 3D 모델·텍스처·일러스트·사운드 제작
- 비밀키·토큰·비밀번호의 생성, 조회, 문서화 또는 저장소 기록

## 확정된 핵심 기획 항목

- [x] 1대1 동시 명령 핵심 구조
- [x] 네 단계 턴 구조와 제한 시간
- [x] 팀당 K/H/D 3명 구성과 F·F 능력 삭제
- [x] 일반 명령 일곱 종류
- [x] 배신자 명령 네 종류
- [x] 공작 자금, 은행 적립과 비용
- [x] 성공률과 요원별 전문 보정
- [x] 심문, 숙청, 암살, 충원, 재매수의 핵심 규칙
- [x] 16×16 격자, 25개의 2×2 건물 블록과 하나로 연결된 도로망
- [x] 명명된 특수시설 25개·특수시설 31칸·일반 건물 69칸으로 이루어진 건물 부지 100칸
- [x] 일반 건물 진입, 건물 간 통과 금지와 공항·항구 4칸 내부 이동 예외
- [x] 검증된 A/B 무작위 시설 배치와 고정된 RED·BLUE K/H/D 시작 좌표
- [x] 탐지, 조사, 명단 정보, 통신국 도청의 핵심 규칙
- [x] 목표 3종과 실물 목표 4개
- [x] 목표 운반, 이전, 드롭, 확보와 승리의 핵심 규칙
- [x] 동시 해킹과 동시 승리 예외
- [x] 복합 상황에서 드러난 경계 규칙 Q-054~Q-067 최종 확정

## 남은 사용자 결정

| 우선순위 | 항목                                          | 상태                                      | 반영 문서                                            |
| -------- | --------------------------------------------- | ----------------------------------------- | ---------------------------------------------------- |
| P1       | 최종 게임명                                   | **OPEN**                                  | [PROJECT_VISION.md](./game-design/PROJECT_VISION.md) |
| P1       | 도시명, 시대, 분위기와 상세 세계관            | **OPEN**                                  | [PROJECT_VISION.md](./game-design/PROJECT_VISION.md) |
| P1       | 최종 3D 아트 스타일과 최종 에셋               | **OPEN — NON-BLOCKING**                   | [PRESENTATION.md](./technical/PRESENTATION.md)       |
| P1       | 정확한 Galaxy Tab S9+ 모델 번호·OS·RAM·Chrome | **USER INPUT PENDING — DEVICE TEST GATE** | [UI_UX_CONTRACT.md](./technical/UI_UX_CONTRACT.md)   |

## 최근 규칙 확정

Q-096은 팀당 K/H/D 3명, 총 6명, F와 그 능력 삭제 및 새 시작 좌표를 **RESOLVED**로 확정한다. Q-052의 이전 8명 스폰은 대체됐고, Q-053과 Q-068~Q-073의 건물·이동·8칸 충원·시설 봉쇄 규칙은 그대로 유지한다. 결정 이력은 [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md)에 보존한다.

v0.6 활성 게임 규칙 6개 문서의 의미·링크·상태 교차 감사를 완료했으며, 현재 알려진 규칙 충돌은 0건이다. 사용자는 2026-08-22에 v0.6 전체 게임 기획과 t0.2 기술·UI 기본안을 승인하고 Phase 0B 개발 착수를 명시했다.

## 기술 준비 t0.2 현황

- 사용자가 제공한 UI 참고 문서와 세 스크린샷을 검토해 [UI/UX 계약](./technical/UI_UX_CONTRACT.md)에 반영했다. 외부 문서 안의 상태 설명·스킬 우선순위는 사용자 요청이나 저장소 정본으로 취급하지 않는다.
- Q-079 화면 흐름은 `요원 선택 → 이동/대기/심문/숙청 → 지도 목적지 직접 선택 → 빨간 대표 경로 + 이동만/조사/암살/해킹`이다. 메뉴 의미가 사진 번호보다 우선하며, 이동 전용 팝업이나 별도 경로 승인 단계를 두지 않는다.
- UI 기본 언어는 한국어이고, 영어는 제품명·요원 ID·좌표·TURN·상태 코드 같은 짧은 메타데이터에만 보조적으로 사용한다.
- 기획 문서 내부 가제는 `THE MOLE`, t0.2 프로토타입 화면 작업명은 `PROJECT SPY`다. 최종 게임명 Q-001은 여전히 OPEN이다.
- 목표 기기는 사용자가 확인한 Galaxy Tab S9+이고 게임은 가로 전용이다. 세로에서는 화면을 CSS로 회전하거나 UI를 재배치하지 않고 gameplay 입력을 차단하는 방향 전환 안내를 표시한다. 첫 카메라는 북쪽 고정 3/4 시점, 자유 회전 없음, 제한된 pan·zoom과 DOM `시점 초기화` 버튼을 사용한다.
- 도착지를 탭하면 공개 정보만으로 결정한 대표 최단 합법 경로를 빨간 선으로 즉시 표시하고 도착지에 소형 공작판을 연다. 별도 이동 팝업·경로 수정·경로 승인 단계는 없으며 전체 대표 경로는 저장·잠금·실행 때 다시 검증한다. 현재 칸의 0칸 공작도 지원한다.
- 일반 명령은 완성된 요원별 초안을 마지막 선택 즉시 비공개 서버 draft로 저장하고 작성 패널을 닫는다. 검토 화면은 자기 팀 최대 세 슬롯을 모두 보이되 제거·충원 대기 슬롯은 상태 전용이다. 수동 잠금은 모든 활동 가능 요원의 완전한 명령 묶음으로 정규화하고, 50초 만료 시 마지막 저장 초안을 잠근 뒤 미지정 활동 가능 요원만 대기로 채운다. 활동 가능 요원이 0명이면 해당 일반 명령 입력을 자동 종료한다.
- 첫 턴 전에 각 플레이어가 자기 팀 명단 은닉 위치를 비밀 선택하는 단계를 추가했다. 같은 시설을 고르면 상대 위치를 공개하지 않고 양측 모두 새 라운드에서 재선택한다.
- RED/BLUE는 서버가 경기 초기화 때 50:50으로 한 번 무작위 배정하고 재시도·재접속으로 다시 추첨하지 않는다. 상대 잠금 여부는 내가 잠그기 전에는 공개하지 않는다.
- 로비 참가 수단은 초대 링크·원문 token으로 고정하고 짧은 방 코드는 만들지 않는다. 생성 응답 유실은 자기 작전 복구→새 링크 발급으로 처리한다. game status는 `waiting → setup → active`이며 첫 일반 명령 전 어느 player나 작전을 취소해 무제한 setup 정체를 끝낼 수 있다.
- 하나의 anonymous session에는 waiting·setup·active 작전 하나만 허용한다. 서버의 private 사용자별 claim이 서로 다른 create·join 경합을 차단하고 cancel·finish가 원자적으로 해제하며, 같은 game join 재시도는 기존 membership을 복구한다.
- invite generation은 server time 기준 60분 유효하며 만료돼도 waiting room을 유지하고 host가 재발급한다. create·join·rotate에는 t0.2 durable 10분 fixed-window 한도와 `Retry-After`를 사용하고 공개 출시 전 IP/WAF·CAPTCHA를 별도 검토한다.
- shared revision을 올리지 않는 자기 비밀 lock은 owner-only private input version으로 적용한다. 활동 요원 0명·조종할 배신자 없음은 phase 진입 즉시 server-default submission으로 확정하고, 양측 모두 자동이면 timer 없이 다음 phase로 진행한다.
- waiting/setup WebGL 실패는 호환성·작전 취소 화면으로, active membership의 재접속 첫 load·context 복구 실패는 플레이 가능한 2D 논리 폴백으로 처리한다.
- 기존 서울 Supabase 프로젝트는 Production용 빈 컨테이너로 보존한다. Local은 로컬 스택, Preview는 명시 승인 뒤 별도 Preview 프로젝트를 사용하며 Preview 데이터나 migration을 Production 컨테이너에 적용하지 않는다.
- 위 기본안은 2026-08-22 사용자 승인을 받은 활성 t0.2 계약이다. Phase 0B는 `codex/phase-0b-foundation`에서 시작했으며 스캐폴드·정확한 패키지·잠금 파일, fixture UI, 기본 도형 R3F 표현과 현재 순수 규칙 slice를 구현하고 로컬 검증했다.
- 기술 기준은 Next.js + TypeScript, React Three Fiber, Vercel, Supabase로 유지한다.
- 목표 플랫폼은 PC·태블릿 웹 브라우저이며, 데모는 3D 체스판형 도시와 단순 도형 건물·캐릭터를 사용한다.
- 게임 시작 전 닉네임 지정 단계를 필수로 확정해 Q-048을 `RESOLVED`로 전환했다.
- Codex의 GitHub·Vercel·Supabase 플러그인은 설치·인증되어 있다.
- GitHub 기준 저장소는 **PRIVATE**로 전환했고, 승인된 문서·보호장치 전용 최초 `main` 기준선을 게시해 원격 브랜치와 commit을 검증했다.
- 후속 승인으로 Vercel project·Git Integration·Preview 범위를 다시 연 뒤에는 사용자가 요청한 변경 범위에서 `codex/*` 커밋·push·Draft PR·Vercel Preview를 별도 반복 승인 없이 진행할 수 있다. 현재 Phase 0B에서는 Vercel 범위가 보류돼 있으며, 이 정책은 새 개발이나 외부 연결을 임의로 시작할 권한이 아니다.
- `main` 병합, Production 배포·promote·alias 변경·rollback과 Production DB migration은 각각 매번 별도 사용자 승인을 받는다.
- Vercel 연결 전 guard-only 변경을 별도 승인으로 remote `main`에 반영해 tracked `vercel.json`의 `main` 자동 deployment를 차단한다. deployment 없는 create/link 경로로 연결한 뒤 Production Branch `main`과 Production deployment 0건을 검증하며 Dashboard 최초 Deploy는 Production 승인 없이 실행하지 않는다. 비-production branch만 자동 Preview를 만들고 Production은 승인된 remote main SHA의 별도 clean detached worktree와 lockfile-pinned CLI에서만 수동 생성한다. 기존 작업트리는 reset·clean하지 않는다.
- Vercel은 승인된 `nvunwoo's projects` 팀에 연결됐지만 `Project-Spy` 프로젝트가 없다.
- 사용자가 플러그인 연동 중 만든 빈 `ap-south-1` 프로젝트는 사용자가 삭제했다. 사용자의 명시 승인과 월 0달러 비용 확인 후 `Endurance Games` Free 조직의 `Project-Spy`를 서울 `ap-northeast-2`에 2026-08-18T06:48:01Z 생성했고 `ACTIVE_HEALTHY`를 검증했다. public table은 0개, migration은 0개다.
- 서울 Supabase 프로젝트는 Production-reserved 컨테이너만 준비된 상태다. 검증된 사실은 public table 0개와 migration 0개다. 게임용 schema·table·RLS·function, Anonymous Auth 설정, private Realtime channel·policy, 앱에서 사용할 key 선택·회수와 환경·애플리케이션 연결은 미구성이며, 플랫폼이 자동 제공하는 endpoint·key 값은 이번 준비에서 조회·기록·연결하지 않았다.
- 시스템 Node.js 24.19.0, npm 11.17.0과 사용자 전역 pnpm 11.22.0을 설치했고, 지속 PATH를 반영한 새 프로세스에서 준비 진단의 core app 항목을 통과했다.
- Local Supabase에는 Docker API 호환 container runtime이 필요하지만 현재 Docker·Podman·project Supabase CLI는 설치돼 있지 않다. 사용자 지시에 따라 Docker·Local Supabase와 모든 Supabase SDK/CLI·앱 연결을 보류한다. `-RequireLocalSupabase` 실패는 현재 단계의 구현 실패가 아니다.
- Git, Git LFS, Chrome, Edge와 VS Code도 확인했다. GitHub CLI 2.97.0을 설치했다. Vercel 프로젝트·CLI·Git Integration·Preview는 사용자 지시에 따라 보류하며 전용 준비 게이트도 이번 단계에서 실행하지 않는다.
- GitHub CLI의 Windows keyring 인증을 `nvunwoo`로 확인했고 Git 프로토콜은 HTTPS로 설정했다. 최초 push 뒤 원격 `main`과 commit도 다시 검증했다.
- 목표 태블릿은 사용자 확인에 따라 **Galaxy Tab S9+**다. 사용자는 PC와 태블릿에서 현재 pointer·touch 명령 입력이 작동함을 직접 확인했다. 물리 사양을 CSS breakpoint로 사용하지 않고 실제 Chrome CSS viewport·DPR을 측정하며, 정확한 모델 코드·Android·RAM·Chrome과 S Pen·성능은 별도 실기기 gate로 남긴다.
- t0.3 저장소 보호장치와 함께 `package.json`, `pnpm-lock.yaml`, Next.js·TypeScript·Tailwind·Vitest·Playwright 설정과 프로젝트 패키지가 `codex/phase-0b-foundation`에 생성됐다. 현재 로컬 slice는 lint, typecheck, format, `git diff --check`, 44개 source boundary 검사, Vitest 14파일·80테스트와 정적 `/`을 생성한 Next production build를 통과했다. Playwright는 1440×900 desktop·1280×800 touch landscape·1024×640 compact landscape·800×1280 portrait gate에서 적용 가능한 시나리오 11개 통과와 의도된 프로젝트 조건 skip 17개를 기록했다. 고정 스폰·1칸 건물 도시, 지도 직접 명단 은닉, 지도 연동 Q-079 명령판·빨간 경로와 즉시 확정, 절대 마감 기반 50초·10초·5초 timeout, 세 턴 연속 fixture, 훈련 seed 생성·복원과 3D 명령 수행·우측 카드 결과를 확인했고 page exception·console error와 `THREE.Clock` deprecation warning은 0건이다.

위 로컬 검증은 fixture 플레이와 로컬 순수 판정기에만 적용한다. 물리 Galaxy Tab S9+의 터치·S Pen·WebGL2·성능, 실제 서버 권위 API·persistence·비공개 projection 전송·두 클라이언트 동기화는 구현 또는 검증하지 않았다. 로컬 판정기는 서버 판정 구조를 준비하는 훈련 harness이지 Production 권위 서버가 아니다. DB 구성과 배포는 보류 상태다. 사용자 작업과 외부 연결 상태의 세부 ID는 [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md)에서 추적한다.

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
4. [UI/UX 계약](./technical/UI_UX_CONTRACT.md)
5. [3D·표현 준비](./technical/PRESENTATION.md)
6. [구현 청사진](./technical/IMPLEMENTATION_BLUEPRINT.md)
7. [MVP 로드맵](./production/MVP_ROADMAP.md)
8. [Codex 작업 규칙](./CODEX_WORKING_RULES.md)

## 다음 작업

1. **사용자 직접 플레이** — 실행 중인 로컬 PC 링크와 같은 Wi-Fi 태블릿 링크에서 로비→한 턴→다음 턴을 플레이하고 지도 연동 명령판 위치·시설명 밀도·이전 턴 결과 카드 피드백을 반영한다.
2. **실기기 gate** — 이미 사용자 확인된 기본 터치와 별도로 Galaxy Tab S9+의 정확한 모델 코드·Android·RAM·Chrome, landscape CSS viewport·DPR·WebGL2, S Pen·pan·pinch zoom·성능·가로 고정을 기록한다.
3. **외부 서비스 없는 다음 코드 slice** — 로컬 fixture의 재연결·WebGL 실패·결과 0건 등 추가 오류·빈 상태와 결과 표현 세부를 보강한다.
4. **후속 승인 대기** — 서버 권위 Route Handler·persistence·두 클라이언트로 넘어가기 전에 Docker/Supabase 보류를 해제할지 사용자에게 확인한다.
5. Docker·Supabase·Vercel·Preview·Production은 명시적으로 계속 보류한다.

## 현재 단계 종료 조건

- [x] 요원 시작 좌표 확정
- [x] 25개 건물 블록과 건물 부지 100칸의 좌표 확정
- [x] 명명된 특수시설 25개와 일반 건물 69칸의 배치 계약 확정
- [x] Q-054~Q-067 경계 규칙 확정
- [x] Q-068~Q-073 맵 경계 규칙 확정
- [x] v0.6 활성 게임 규칙 문서 간 충돌 0건
- [x] 모든 미결정 규칙에 추적 상태 부여
- [x] PC·태블릿 3D 웹게임 기술 기준 t0.2 문서화
- [x] GitHub·Vercel·Supabase 플러그인 설치·인증 상태 확인
- [x] 로컬 개발환경과 저장소 초기 상태 감사
- [x] Preview와 Production 배포 권한 경계 정의
- [x] 저장소 보호장치·빈 환경변수 이름 템플릿·PR 템플릿·준비 진단 스크립트 작성
- [x] t0.1 기술 준비 권장안 사용자 승인
- [x] 시스템 Node.js 24.19.0·npm 11.17.0과 Codex 캐시가 아닌 사용자 전역 pnpm 11.22.0 사용 가능
- [x] Node.js·npm·pnpm 지속 PATH 설정과 준비 진단 통과
- [ ] Docker API 호환 container runtime 설치·검증 — **LOCAL BACKEND GATED / 앱 부트스트랩 비차단**
- [x] GitHub 기준 저장소·private 전환·문서 전용 최초 `main` push 승인
- [x] GitHub private 전환 실행 및 원격 가시성 검증
- [x] 문서 전용 최초 `main` commit·push 실행 및 원격 commit 검증 — **THIS BASELINE**
- [x] GitHub CLI 2.97.0·Windows keyring `nvunwoo`·HTTPS Git 프로토콜 검증
- [x] Vercel 팀과 Supabase 조직·서울 목표 리전·비용 조회 승인
- [x] 기존 빈 Supabase `ap-south-1` 프로젝트의 사용자 삭제 확인
- [x] Supabase 서울 `ap-northeast-2` 빈 프로젝트 생성·`ACTIVE_HEALTHY`·public table 0개·migration 0개 검증
- [x] 실제 태블릿 검증 장치를 Android Chrome으로 확정
- [x] 사용자 UI 참고 문서·세 스크린샷 수신·t0.2 파생 계약 반영
- [x] 로비·HUD·명령 작성·경로·카메라·반응형·접근성 기본안 확정
- [x] 명단 은닉 준비 단계·비공개 draft·팀 배정·상대 잠금 공개 정책·환경 역할 계약 보완
- [x] 대상 기기를 Galaxy Tab S9+로 사용자 확인
- [x] Q-079 메뉴 의미 우선 흐름 사용자 확인
- [x] 가로 전용·세로 orientation gate 계약 사용자 확정
- [ ] Galaxy Tab S9+의 정확한 모델 번호·OS·RAM·Chrome 및 실제 viewport 기록 — 첫 실기기 검증 전 필요
- [x] t0.2 기술·UI 기본안 사용자 최종 승인 — 2026-08-22
- [x] v0.6 게임 기획 사용자 최종 승인 — 2026-08-22
- [x] 사용자가 Phase 0B 개발 착수를 명시적으로 지시함 — 2026-08-22
- [x] `codex/phase-0b-foundation` 브랜치와 Next.js 스캐폴드·프로젝트 패키지·`pnpm-lock.yaml` 생성
- [x] fixture 로비·HUD·Q-079 명령 UI와 기본 도형 R3F 표현 — **IMPLEMENTED / LOCAL VERIFIED**
- [x] 순수 domain/map/order/RNG/movement/outcome와 allowlist player projection foundation slice — **IMPLEMENTED / UNIT VERIFIED**
- [x] lint·typecheck·format·`git diff --check`·44 source boundary·Vitest 14파일/80테스트·Next production build·Playwright 4-project 11 passed/17 intended skips 기록
- [x] 절대 마감 기반 50초·10초·5초 countdown, 일반 명령 자동 `WAIT`, 배신자 명령 자동 `ACQUIESCE`, 백그라운드 복귀와 세 턴 연속 fixture — **IMPLEMENTED / LOCAL VERIFIED**
- [x] 결정적 다음 seed·기본 seed 복원·같은/새 seed 재시작과 투영 3D 실행 cue·우측 카드 결과 — **IMPLEMENTED / LOCAL VERIFIED**
- [x] Codex 인앱 브라우저 수동 한 턴·Q-079·결정성 재실행·다음 턴 확인과 page console error 0건 기록
- [x] 전체 화면 지도·반투명 HUD·지도 pan/zoom 중 HUD 투명화와 1024px 이상 PC·태블릿 좌우 rail 동등 배치
- [ ] 물리 Galaxy Tab S9+ 터치·S Pen·WebGL2·성능 검증 — **NOT TESTED / DEVICE GATE**
- [ ] Docker·Local Supabase·Supabase SDK/CLI — **DEFERRED / A-011**
- [ ] Vercel project/CLI/Preview·별도 Preview Supabase — **DEFERRED**

## 문서 동기화 규칙

모든 후속 작업은 시작할 때 이 문서를 확인하고 종료할 때 다음을 함께 갱신한다.

- 현재 단계와 다음 작업
- 변경된 도메인의 기준 문서
- [OPEN_DECISIONS.md](./production/OPEN_DECISIONS.md)
- [README.md](./README.md)
- [CHANGELOG.md](./CHANGELOG.md)
