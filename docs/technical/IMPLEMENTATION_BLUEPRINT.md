> **보관 안내 (2026-09-25):** 추가 개발 예정이 없습니다. 이 문서의 이전 단계·서비스·후속 작업 표현은 작성 당시의 설계 기록입니다. 실제 구현·배포 상태는 [현재 상태](../CURRENT_STAGE.md)를 확인하세요.

# 구현 준비 청사진

> 문서 상태: **ACTIVE**  
> 기술 기준 버전: **t0.2**<br>
> 게임 규칙 기준: **v0.6**<br>
> 구현 상태: **APPROVED / PHASE 0B-4 LOCAL REPLAY & TRAINING UX VERIFIED**<br>
> 적용 범위: Next.js App Router, 서버 권위 규칙, Supabase 영속화·알림, 플레이어별 투영, 로비·HUD·명령 UI, 3D 표현과 테스트의 모듈 경계

이 문서는 2026-08-22 사용자 승인을 받은 모듈·의존 방향 계약이다. `codex/phase-0b-foundation`의 로컬 앱, 전체 화면 지도·반투명 HUD, 절대 마감 기반 40초·10초 countdown과 자동 기본 명령, 명단 은닉부터 여러 턴까지의 fixture 플레이, 결정적 훈련 seed·재시작, BLUE 투영 결과의 사건 재생과 `resolver.phase0b.3` 로컬 판정 slice는 **IMPLEMENTED / LOCAL VERIFIED**다. 아래 전체 경로는 후속 단계를 포함한 **목표 구조**이므로 목록에 있다는 사실만으로 권위 gameplay server·DB·계정 연동·배포가 구현됐다고 보지 않는다.

## 1. 확정 스택과 운영 형태

| 계층        | t0.2 선택                                              | 역할                                             |
| ----------- | ------------------------------------------------------ | ------------------------------------------------ |
| 언어        | TypeScript                                             | 브라우저·서버·공유 계약의 정적 타입              |
| 웹 앱       | Next.js App Router + React                             | DOM 셸, 방/게임 라우트, Route Handlers           |
| 웹 배포     | Vercel                                                 | Preview/Production 배포와 Next.js Functions 실행 |
| 데이터      | Supabase Postgres                                      | 권위 있는 게임 상태, 명령, 이벤트와 버전 영속화  |
| 임시 사용자 | Supabase Anonymous Auth                                | 계정 가입 전 브라우저 세션 식별                  |
| 변경 알림   | Supabase Realtime private Broadcast + polling fallback | 안전한 무효화 신호 후 플레이어별 상태 재조회     |
| 3D          | React Three Fiber + Three.js                           | WebGL2 기본 도형 데모와 향후 GLB 표현            |
| 소스 관리   | GitHub                                                 | 브랜치·리뷰·Vercel Git 배포 기준                 |

Next.js는 App Router를 기준으로 하며 [공식 App Router 문서](https://nextjs.org/docs/app)의 Server/Client Component 경계를 따른다. Phase 0B 앱 패키지는 `package.json`과 `pnpm-lock.yaml`에 정확한 버전으로 고정했다. Supabase 연결의 기본 형태는 향후 승인된 backend 단계에서 [공식 Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)를 다시 검토하되 현재는 모든 Supabase SDK/CLI와 앱 연결을 보류한다.

### 1.1 t0.1에서 검토해 t0.2에서도 미채택한 대안

Vite 단독 SPA와 Colyseus 전용 룸 서버도 t0.1에서 검토 대상이었다. 그러나 현재 게임은 1대1, 턴 기반, 저빈도 명령·상태 갱신이며 Next.js + Vercel + Supabase 한 운영면에서 인증, 권위 API, 영속화, Preview 배포를 관리하는 편이 초기 복잡도와 계정 수를 줄인다. 이 판단은 t0.2에서도 유지하며 별도 상시 연결 룸 서버를 두지 않는다.

2026-08-18 기준 Vercel Functions는 WebSocket을 Public Beta로 지원한다. 다만 연결은 해당 Function의 최대 실행 시간 동안 한 인스턴스에 고정되고, 이후 연결이 같은 인스턴스로 간다는 보장은 없으므로 권위 상태는 여전히 외부 저장소에 둬야 한다. 현재 게임은 직접 WebSocket 서버가 필요하지 않아 Supabase private Broadcast와 polling fallback을 선택한다. 근거는 [Vercel WebSocket 지원 안내](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections), [Public Beta 변경 기록](https://vercel.com/changelog/websocket-support-is-now-in-public-beta), [Vercel Functions 실행 한도](https://vercel.com/docs/functions/limitations)이다.

향후 프레임 단위 동기화, 물리 권위 시뮬레이션, 높은 tick rate 또는 장시간 유지되는 전용 룸 프로세스가 실제 요구가 되면 Vercel WebSocket의 안정성·비용과 Colyseus 같은 별도 서버를 다시 비교한다. 현재 Route Handler를 상시 메모리 상태를 가진 룸 서버로 사용하지 않는다.

## 2. 목표 모듈 구조

다음은 Phase 0B와 후속 단계의 **논리 경계와 예상 경로**이다. 파일명은 책임을 보여 주기 위한 t0.2 기준이며 실제 생성 여부는 현재 작업트리와 [CURRENT_STAGE.md](../CURRENT_STAGE.md)에서 별도로 확인한다.

```text
src/
  app/
    layout.tsx
    page.tsx
    lobby/[roomId]/page.tsx
    game/[roomId]/page.tsx
    api/rooms/route.ts
    api/rooms/recoverable/route.ts
    api/rooms/[roomId]/route.ts
    api/rooms/[roomId]/join/route.ts
    api/rooms/[roomId]/cancel/route.ts
    api/rooms/[roomId]/invites/rotate/route.ts
    api/rooms/[roomId]/setup/roster-placement/lock/route.ts
    api/rooms/[roomId]/orders/general/draft/route.ts
    api/rooms/[roomId]/orders/general/lock/route.ts
    api/rooms/[roomId]/orders/mole/lock/route.ts
    api/rooms/[roomId]/advance/route.ts
    api/rooms/[roomId]/events/route.ts

  ui/
    design-system/
      tokens.css
      fonts.ts
    primitives/
    lobby/
    hud/
    command-composer/
      command-reducer.ts
      command-selectors.ts
    replay/
    responsive/
    accessibility/

  game-client/
    projection-store/
    general-draft-sync/
    phase-clock/
    realtime/
    replay/

  domain/
    model/
    map/
    orders/
    resolve-turn/
    rng/

  server/
    auth/
    use-cases/
    transactions/
    clock/

  projection/
    player-state/
    turn-events/

  persistence/
    ports/
    supabase/
      auth-clients/
      postgres-pool/
      repositories/
      transaction-boundary/

  presentation-3d/
    canvas/
    scene/
    adapters/
    coordinates/
    input/
      selection-intent.ts

  shared/
    contracts/
      requests/
      responses/
      realtime/
      versions/

tests/
  unit/
  component/
  contract/
  integration/
  security/
  e2e/
  accessibility/
  performance/

public/
  models/
  textures/
  audio/
```

`public/models` 등 에셋 폴더도 목표 위치일 뿐 아직 만들지 않는다. 정확한 외부 API payload와 데이터 스키마의 정본은 [DATA_AND_API.md](./DATA_AND_API.md), UI 상태·반응형·접근성의 정본은 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md), 3D 세부 계약은 [PRESENTATION.md](./PRESENTATION.md)이다.

## 3. App Router와 공개 진입점

### 3.1 페이지

- `/`: DOM 닉네임 입력, 방 생성, 초대 링크·원문 token 참가와 인증된 자기 작전 복구 진입점이다. MVP는 별도 짧은 방 코드를 만들지 않는다. 자동 참가 URL은 fragment만 사용하고 token을 memory에 포착한 즉시 `history.replaceState`로 제거하며, 닉네임은 표시 이름이고 인증과 분리한다.
- `/lobby/[roomId]`: 참가자 대기, 초대 링크 재발급, waiting host 방 취소, 첫 일반 명령 전 양 player의 setup 작전 취소, 두 슬롯의 참가 상태, RED/BLUE 서버 배정 결과와 명단 은닉 위치 선택을 제공한다. 별도 Ready 토글과 상대 재접속 추정 상태는 두지 않는다.
- `/game/[roomId]`: 방과 플레이어 접근을 서버에서 확인한 뒤 게임 DOM 셸을 제공한다. R3F 장면은 client-only lazy boundary 안에서만 로드한다.
- 페이지와 layout은 기본적으로 Server Component로 유지하고, 브라우저 API·Pointer Events·R3F가 필요한 최소 경계만 `'use client'`로 만든다.
- Server Component에서 Client Component로 넘기는 초기 투영은 직렬화 가능한 공개 DTO만 허용한다. 내부 GameState, DB row, secret key와 함수는 props에 넣지 않는다.

공식 근거는 [Next.js Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)와 [지연 로딩](https://nextjs.org/docs/app/guides/lazy-loading)이다.

### 3.2 Route Handlers

| 목표 경로                                         | 메서드·책임                                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/rooms`                                      | `POST`: 인증된 익명 사용자로 방과 host slot을 만들고 guest invite·빈 seat를 준비. guest slot 결합과 RED/BLUE 배정은 두 번째 참가 transaction에서 수행 |
| `/api/rooms/recoverable`                          | `GET`: 현재 session의 waiting·setup·active membership을 안전한 요약으로 반환. 생성 응답과 로컬 key 유실 복구에 사용                                   |
| `/api/rooms/[roomId]`                             | `GET`: 상태를 변경하지 않고 현재 사용자의 player projection, shared `revision`과 현재 owner input scope/version 반환                                  |
| `/api/rooms/[roomId]/join`                        | `POST`: 초대 검증, 빈 슬롯 참가, 닉네임 검증·저장                                                                                                     |
| `/api/rooms/[roomId]/cancel`                      | `POST`: waiting host 또는 첫 general order 전 어느 setup player가 game을 cancelled로 전환. hard delete·active 경기 기권 아님                          |
| `/api/rooms/[roomId]/invites/rotate`              | `POST`: 사용 전 초대 token을 폐기하고 새 token을 1회 반환                                                                                             |
| `/api/rooms/[roomId]/setup/roster-placement/lock` | `POST`: 자기 팀 명단 은닉 시설을 비공개 잠금. 양측 동일 시설이면 상대 선택을 공개하지 않고 양측 제출을 무효화한 새 선택 라운드 반환                   |
| `/api/rooms/[roomId]/orders/general/draft`        | `PUT`: 완성된 요원 한 명의 일반 명령 초안을 소유자 전용으로 upsert하고 `draft_version` 반환. game `revision` 증가나 상대 Broadcast 없음               |
| `/api/rooms/[roomId]/orders/general/lock`         | `POST`: 모든 활동 가능 요원의 완전한 일반 명령 묶음을 검증하고 즉시 불변 잠금. 성공 뒤 수정·해제 API 없음                                             |
| `/api/rooms/[roomId]/orders/mole/lock`            | `POST`: 배신자 명령 묶음을 별도 권한·공개 범위로 검증하고 즉시 불변 잠금                                                                              |
| `/api/rooms/[roomId]/advance`                     | `POST`: idempotent `tryAdvance` 호출. 클라이언트가 결과나 시간을 결정하지 않음                                                                        |
| `/api/rooms/[roomId]/events?afterCursor=<cursor>` | `GET`: 현재 사용자에게 투영된 사건만 cursor 이후로 반환                                                                                               |

Route Handler는 인증·요청 파싱 뒤 `server/use-cases`를 호출하고 DTO로 응답한다. 게임 규칙을 route 파일에 직접 구현하지 않는다. 기본 런타임은 Node.js이며, 응답을 열어 둔 채 메모리 타이머로 40초/10초를 기다리지 않는다. 마감 시각과 phase revision을 DB에 저장하고, 명령 잠금 mutation 또는 명시적인 인증된 `POST .../advance`에서만 같은 `tryAdvance`를 호출한다. `GET`은 상태를 변경하지 않는다. 두 클라이언트가 모두 떠난 동안에는 다음 유효한 `advance`가 서버 시각으로 필요한 전이를 따라잡는다. Route Handler의 공식 동작은 [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)를 따른다.

정확한 요청 필드, 오류 코드와 버전 충돌 응답은 `shared/contracts`에서 정의하고 [DATA_AND_API.md](./DATA_AND_API.md)와 함께 변경한다.

## 4. 순수 도메인 resolver

`src/domain`은 게임의 유일한 규칙 판정 계층이다.

- 입력: 검증된 canonical state, 양측의 잠긴 명령, 명시적 deadline/clock 값, 명시적 RNG seed와 현재 revision
- 출력: 새 canonical state, 권위 있는 사건 목록, 다음 phase/deadline, 영속화할 결정 메타데이터
- 책임: 맵 이동·점유, 명령 순서, 비용·확률, 배신자 효과, 목표 획득·인도, 제거·충원, 승리·무승부 판정
- 금지 의존성: Next.js, React, Supabase SDK, SQL, WebGL/Three.js, 브라우저 API, 네트워크, `Date.now()`, `Math.random()`

resolver는 같은 입력에 항상 같은 출력을 내야 한다. 시간과 난수는 포트가 아니라 값/seed로 주입하고, 사용한 seed와 규칙 버전을 결과에 기록해 재현 테스트를 가능하게 한다. 실행 순서의 정본은 [TURN_MODEL.md](../game-design/TURN_MODEL.md)이다.

`domain/map`은 Excel 파일을 런타임에 읽지 않는다. 개발 시 검증된 정적 맵 manifest로 변환된 16×16 셀 데이터만 받고, A/B/C 같은 제작 분류와 플레이어에게 공개할 표현 DTO를 분리한다.

## 5. 서버 응용 계층

`src/server`는 HTTP와 도메인 사이의 신뢰 경계다.

- `auth`: Supabase 세션 검증, 익명 `user_id` 확인, 방 슬롯과 실제 RED/BLUE 권한 결합
- `use-cases`: create/listRecoverableRooms/cancelRoom/join/assignTeams/lockRosterPlacement/getPlayerState/saveGeneralDraft/submitGeneralOrders/submitMoleOrder/tryAdvance 조정
- `transactions`: 현재 revision 잠금, 중복 요청 확인, resolver 한 번 실행, 상태·사건·다음 deadline 원자 저장
- `clock`: 서버 현재 시각을 읽고 명시적 값으로 resolver에 전달

닉네임, `roomId`, 클라이언트가 보낸 team, phase, 잔액, 성공률과 경로를 신뢰하지 않는다. 모든 명령은 서버가 현재 권한·phase·대상·비용·버전과 대조한다.

RED/BLUE는 두 참가자가 준비된 setup transaction에서 서버 RNG로 50:50 한 번만 배정하고 canonical state에 저장한다. game status는 두 번째 참가 전 `waiting`, 명단 은닉 중 `setup`, 첫 `GENERAL_ORDER_OPEN`부터 `active`다. 방장이나 먼저 참가한 플레이어가 팀을 선택하지 않으며, 새로고침·재접속·중복 요청으로 재추첨하지 않는다. 첫 일반 명령 전에 양측이 자기 팀 명단의 은닉 시설을 비공개 제출하고, 같은 시설 충돌이면 상대 시설명을 노출하지 않은 채 양측 제출만 폐기해 새 setup round에서 다시 받는다. setup에는 타이머가 없으므로 어느 player나 작전을 취소해 둘 다 새 방으로 이동할 수 있다.

하나의 anonymous `auth.uid()`는 waiting·setup·active game 하나만 소유할 수 있다. persistence adapter는 private `user_active_game_claims`의 사용자별 unique guard를 create·join의 player slot과 같은 transaction에서 획득하고, cancel·finish의 terminal 전환과 같은 transaction에서 해제한다. 다른 game claim과 충돌하면 클라이언트 캐시로 추측하지 않고 기존 작전 복구 경로를 안내한다. 같은 game join 재시도는 invite의 used 오류보다 기존 membership을 우선해 현재 projection을 반환한다.

`tryAdvance`는 같은 방·phase·revision에 여러 번 호출되어도 한 번만 결과를 확정하는 idempotent 연산이다. server-only pooled PostgreSQL transaction이 request-scoped idempotency row를 0순위로 claim한 뒤 `games` → 양 `user_active_game_claims`(user ID 순) → 현재 `turns` row를 정해진 순서로 잠그고 현재 revision을 조건부 갱신하며, 경합에서 진 요청은 이미 생성된 최신 상태를 다시 읽는다. Resolve가 game을 `finished`로 만들면 같은 transaction에서 두 claim을 해제한다. 복수 row를 잠글 때는 범주별로 안정적인 ID 오름차순을 사용해 교착 가능성을 줄인다. Supabase Data API 호출 여러 개를 canonical mutation의 transaction처럼 묶거나 애플리케이션 메모리 lock만으로 동시성을 제어하지 않는다.

## 6. 플레이어별 projection

canonical GameState 전체를 직렬화한 뒤 브라우저에서 필드를 숨기는 방식을 금지한다. `src/projection`은 권위 상태를 RED/BLUE 각각의 최소 공개 DTO로 바꾼다.

- 자기 요원 유형·명령, 자기 배신자 제어 정보, 허용된 조사·도청·목표 정보만 해당 플레이어 projection에 포함한다.
- 자기 명단 은닉 제출과 자기 일반 명령 draft는 소유자 projection에만 포함한다. 같은 시설 충돌은 `재선택 필요`만 알리고 상대 시설명은 포함하지 않는다.
- 상대 유형, 상대의 비공개 명령, 숨은 목표, 비공개 이동 경로, RNG seed와 내부 판정 원인은 응답과 Realtime payload에 넣지 않는다.
- 상대의 일반 명령 잠금 여부는 내가 잠그기 전에는 포함하지 않는다. 내가 잠근 뒤에도 정확한 잠금 시각은 주지 않고 `상대 입력 중` 또는 `완료 대기`처럼 다음 행동에 영향을 주지 않는 상태만 반환한다.
- turn event도 수신자별 문구와 필드를 별도로 투영한다. 하나의 상세 사건을 모든 클라이언트에 보내고 UI에서 가리지 않는다.
- 모든 JSON 응답에는 `contractVersion: api.t0.2`와 request ID를 포함한다. state 응답에는 단조 증가하는 shared `revision`을 포함하고, 현재 owner의 setup/general/mole 문맥에는 scope가 있는 `privateInputVersion`도 포함한다. 클라이언트는 같은 scope의 `(revision, privateInputVersion)`을 함께 비교해 shared revision이 같아도 더 최신인 자기 lock 응답을 적용한다.

Projection 누출 검사는 독립적인 security test로 유지한다.

### 6.1 비공개 일반 명령 draft와 마감 처리

일반 명령 작성 중 완성된 요원별 명령은 브라우저 메모리에만 두지 않고 소유자 전용 서버 draft로 즉시 저장한다. 경로만 고르고 행동을 고르지 않은 상태처럼 불완전한 중간 단계는 저장하지 않는다. 각 저장은 별도 `draft_version`으로 경합을 막되 canonical game `revision`을 증가시키거나 상대에게 Realtime 신호를 보내지 않는다.

- UI는 각 활동 가능 요원을 처음부터 `자동 대기` 기본값으로 보이게 해 수동 잠금 payload가 항상 완전한 명령 묶음이 되게 한다.
- draft 요청은 `저장 중 → 저장됨 → 재시도 필요` 상태를 명시하고, 마지막 저장된 소유자 draft를 새로고침·포커스 복귀 때 복원한다.
- draft upsert는 모든 활동 agent·현재 player draft를 agent ID 오름차순으로 잠그고, 제안 row와 누락 agent의 `WAIT`를 합친 전체 집합의 총비용·턴별/국장별 횟수 제한·상호 배타 조건을 검증한다. 불법이면 이전 저장 집합을 유지한다.
- 수동 잠금은 요청에 포함된 최종 완전 명령 묶음을 같은 transaction에서 검증·저장한 뒤 불변 submission으로 잠근다.
- 40초 마감은 서버 시각을 기준으로 이미 전체 집합 검증을 통과한 마지막 저장 draft를 그대로 snapshot하고, 저장되지 않은 활동 요원만 `대기`로 채워 불변 submission을 만든다. 저장 초안의 임의 폐기·우선순위 재정렬은 하지 않는다.
- `GENERAL_ORDER_OPEN` 진입 transaction은 활동 가능 요원 0명의 zero-order server-default submission을 즉시 만들고, `MOLE_ORDER_OPEN` 진입은 조종할 살아 있는 배신자가 없는 player를 즉시 자동 확정한다. owner private input version을 남기고 양측 자동이면 timer 없이 다음 phase까지 같은 transaction에서 연쇄 전환한다.
- 배신자가 있는 국장의 배신자 명령은 10초 안에 명시적으로 잠그지 않으면 규칙의 기본값인 `묵인`으로 처리하므로 미확정 중간 선택을 별도 draft로 영속화하지 않는다.

## 7. Supabase 영속화와 보안 경계

2026-08-18에 확인한 서울 `ap-northeast-2`의 `Project-Spy`는 public table 0개·migration 0개이며 게임 앱 연결이 없는 **Production-reserved 빈 컨테이너**다. 플랫폼 자동 제공 endpoint·key 존재와 별개로 게임용 schema·Auth 설정·Realtime policy·앱 key/env 연결은 미구성이고 값은 조회·기록하지 않았다. 이를 Local 또는 Preview의 개발 DB로 연결하지 않는다.

- Local backend를 향후 시작할 경우 Docker API 호환 container runtime과 project-pinned Supabase CLI의 로컬 stack을 사용한다. 현재는 A-011에 따라 Docker·Local Supabase와 모든 Supabase SDK/CLI를 명시적으로 보류한다.
- Preview는 사용자의 별도 명시 승인을 받은 뒤 별도 Supabase Preview 프로젝트를 생성해 사용한다. 현재는 Vercel과 함께 보류한다.
- Local·Preview fixture, migration 실험과 테스트 데이터를 Production-reserved 프로젝트에 적용하지 않는다.
- Production-reserved 프로젝트의 migration·RLS·환경변수 연결은 Production 변경 승인과 검증 게이트를 별도로 통과한 뒤에만 수행한다.

### 7.1 키와 클라이언트 분리

- 브라우저에는 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`만 제공한다.
- `SUPABASE_SECRET_KEY`는 Vercel server environment에만 두며 client bundle, 로그, Preview 댓글과 저장소에 넣지 않는다.
- canonical mutation용 pooled `DATABASE_URL`과 DB password도 server-only이며 브라우저 Supabase client에 전달하지 않는다.
- 구형 `anon`/`service_role` JWT 키를 새 프로젝트의 기준 이름으로 사용하지 않는다. 현재 키 체계는 [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)를 따른다.
- publishable key는 비밀이 아니지만 사용자 권한을 부여하지 않는다. 실제 권한은 Supabase Auth JWT, 방 membership, 서버 검증과 RLS가 결정한다.
- secret key는 높은 권한과 RLS 우회 특성이 있으므로 일반 사용자 요청의 권한 증명으로 사용하지 않는다. 필요한 내부 트랜잭션은 서버가 사용자·방·phase 권한을 먼저 검증한 뒤 최소 표면으로 호출한다.

향후 승인된 backend 구현에서는 브라우저용 Supabase client와 서버용 client를 다른 모듈로 분리하고 서버 client는 요청별 쿠키/세션 범위를 지킨다. SSR 인증 패턴은 [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side)를 기준으로 하되, 해당 helper의 안정성·최신 API와 정확한 버전은 backend 착수일 다시 확인해 lockfile에 고정한다. 현재 app lockfile에는 Supabase SDK/CLI를 추가하지 않는다.

### 7.2 데이터 노출과 RLS

- canonical state, 양측 원본 명령, RNG seed와 내부 사건은 브라우저가 직접 select할 수 없는 private schema에 둔다.
- Data API에 노출할 객체는 최소화하고, 노출 객체에는 RLS와 명시적 grant를 함께 적용한다.
- 2026년의 새 프로젝트/테이블은 Data API 권한이 자동 부여된다고 가정하지 않는다. migration에 필요한 grant와 revoke를 명시한다.
- 브라우저 직접 읽기가 필요한 공개 객체가 생겨도 membership 기반 row policy와 필드 최소화를 적용한다.
- secret key를 사용하는 서버 경로에도 방 membership·명령 소유권·phase 검증을 반복한다.

근거 문서는 [Supabase Data API 보안](https://supabase.com/docs/guides/api/securing-your-api)과 [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)이다.

### 7.3 익명 인증

닉네임 제출 전 또는 방 생성/참가 시 Supabase anonymous sign-in으로 사용자 세션을 만든다. 익명 사용자는 DB의 `authenticated` 역할을 사용하므로 policy에서 `is_anonymous` claim과 room membership을 함께 구분한다. 브라우저 저장소를 지우거나 다른 장치로 옮긴 익명 세션은 같은 플레이어로 자동 복구된다고 약속하지 않는다.

MVP Route Handler에는 [DATA_AND_API.md](./DATA_AND_API.md)의 durable create·join·rotate fixed-window rate limit, invite 60분 TTL과 committed idempotency result의 24시간 replay/expired tombstone을 구현한다. expected authenticated domain 4xx는 domain savepoint까지만 rollback해 canonical write 없이 bucket과 안전한 failure를 commit하고, 429는 window-bound guard를 commit한 뒤 window 종료 후 같은 key를 재claim하며, unexpected DB/503은 guard까지 rollback한다. 공개 출시 전에는 추가 IP 기반 WAF·CAPTCHA, 오래된 익명 계정 정리와 재접속/계정 승격 정책을 별도 보안 게이트로 완료한다. 공식 동작과 주의점은 [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)를 따른다.

## 8. Realtime은 알림, API가 상태 정본

Supabase Realtime은 게임 상태 자체가 아니라 **새 버전이 생겼다는 안전한 무효화 신호**에만 사용한다.

```text
private topic game:<gameId>
  -> event: state_changed
  -> payload: { gameId, revision }
  -> client compares local revision
  -> GET /api/rooms/[roomId]
  -> server returns player-specific projection
```

- 채널은 private으로 두고 인증된 room membership만 subscribe할 수 있게 한다.
- payload에는 상대 명령, 경로, 유형, 숨은 목표, 판정 seed와 상세 사건을 넣지 않는다.
- player-visible shared state 변경으로 `games.revision`이 증가한 transaction commit 뒤에만 서버가 `state_changed` Broadcast 신호를 시도한다. private draft와 phase를 전환하지 않은 단독 setup/general/mole lock은 제외한다. 알림 유실·중복·순서 변경은 가능하다고 보고 shared `revision`으로 중복을 제거한다.
- Broadcast 실패 또는 연결 해제 중에도 foreground 3초 safety polling, 탭 복귀, 포커스 복귀와 명령 응답 후 재조회로 결국 최신 상태에 도달한다. 오류 재시도는 jitter를 둔 exponential backoff로 최대 15초까지 늦춘다.
- Presence는 초기 MVP에서 사용하지 않는다. 접속 여부, 플레이어 생존, 방 슬롯, 타이머와 턴 진행도 Presence로 추론하지 않는다.
- 내부 테이블의 `Postgres Changes`를 브라우저가 직접 구독해 숨은 row를 받는 구조는 사용하지 않는다.
- client가 Broadcast를 보낼 수 있는 `realtime.messages` INSERT policy를 만들지 않는다.

Supabase는 확장성과 보안 측면에서 Broadcast 방식을 권장한다. [Realtime 개요](https://supabase.com/docs/guides/realtime), [Broadcast](https://supabase.com/docs/guides/realtime/broadcast), [데이터베이스 변경 구독 비교](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)를 기준으로 한다.

## 9. UI 셸, 명령 작성기, 3D 연결과 사건 재생

### 9.1 디자인 시스템과 DOM 셸

`src/ui`는 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md)의 색·간격·타이포그래피·상태 토큰을 한 곳에서 소유한다. 한국어 본문은 Pretendard Variable 계열 fallback을, 라틴 UI는 Geist Sans를, 짧은 ID·좌표·시간 같은 메타데이터만 Geist Mono를 사용한다. 폰트 로드 실패가 기능 또는 레이아웃 파손으로 이어지지 않게 fallback과 허용 폭을 시각 회귀 테스트에 포함한다.

- `lobby`: 닉네임, 방 생성·참가, 초대 링크 재발급, 상대 대기, 팀 배정과 명단 은닉 단계
- `hud`: phase·서버 마감, 자금, 목표, 정보 보고서, 요원 상태, 경보·사건 큐
- `command-composer`: 선택과 뒤로 가기를 순수 reducer로 관리하고 서버 DTO 생성 전까지 도메인 명령으로 간주하지 않음
- `replay`: 플레이어별로 투영된 `TurnEvent`만 순서대로 재생하고 skip·감소된 동작을 지원
- `responsive`·`accessibility`: Galaxy Tab S9+ 가로 전용 셸, 세로 gameplay 차단 orientation gate, safe area, 48×48 CSS px 터치 대상, 포인터·터치·키보드 동등 경로, focus·live region 관리

명령 작성 reducer는 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md)의 식별 가능한 상태를 그대로 따른다. 기본 이동 분기는 `IDLE → SELECT_AGENT → PRIMARY_MENU → REACHABLE_MAP → DESTINATION → PATH_PREVIEW → ARRIVAL_ACTION → COMPLETE_AGENT_DRAFT → SAVE_TO_SERVER → SAVED`이고, 암살만 `TARGET`을 추가로 거친다. `대기·심문·숙청`은 `PRIMARY_MENU`에서 경로 단계를 건너뛴다. 취소와 뒤로 가기는 일반 명령 잠금 전까지 결정적이고 복원 가능해야 하며, 모든 활동 가능 요원의 보이는 기본값은 `자동 대기`다.

도착지 선택은 공개 projection만 사용해 결정적인 대표 최단 경로를 제안한다. 사용자는 인접 칸을 이어 경로를 수정하고 명시적으로 확정할 수 있으며 현재 칸을 고른 0칸 공작도 허용한다. 클라이언트의 합법성 표시는 편의 기능일 뿐이고 draft 저장과 최종 잠금에서 서버가 canonical state로 전체 경로·비용·대상·phase를 다시 검증한다.

### 9.2 R3F 표현과 `SelectionIntent` 경계

`src/presentation-3d`는 player projection을 그릴 뿐 도메인과 DB에 직접 접근하지 않는다.

- `canvas`: WebGL2 capability check와 client-only R3F Canvas 수명주기
- `scene`: 16×16 도시, 건물, 요원, 조명과 카메라 구성
- `adapters`: 기본 도형과 향후 GLB 표현 교체
- `coordinates`: 논리 `{row,col}`와 월드 `X/Z`의 유일한 양방향 변환
- `input`: mouse/touch/pen/keyboard 입력을 `{ kind, logicalId, row, col }` 형태의 `SelectionIntent`로 정규화

Canvas는 store, reducer 또는 API를 직접 변경하지 않고 `SelectionIntent`만 `game-client` bridge에 전달한다. bridge가 최신 player projection과 현재 command-composer 상태를 대조해 reducer event로 변환한다. 동일한 필수 선택은 DOM 목록·버튼으로도 수행할 수 있어야 하며 hover나 Canvas 직접 탭만으로 기능을 제한하지 않는다.

서버가 승인한 공개 waypoint만 보간하며 물리, NavMesh, free WASD를 쓰지 않는다. 사건 재생은 canonical event가 아니라 수신자용으로 투영된 `TurnEvent`와 `revision`을 사용하고, 오래된 revision·중복 event를 폐기한다. 상세 계약과 성능 게이트는 [PRESENTATION.md](./PRESENTATION.md)를 따른다.

## 10. 의존 방향

```text
app pages / Route Handlers
            |
            v
server use-cases -----> domain pure resolver
       |   |
       |   +----------> projection -----> shared response contracts
       |
       +--------------> persistence port <----- Supabase adapter

DOM UI / command reducer <---- SelectionIntent bridge <---- presentation-3d
          |                                      |
          +-----> game client -----> shared public contracts
Realtime client ------> invalidation signal ---> room GET Route Handler
```

의존 규칙은 다음과 같다.

1. `domain`은 상위 계층을 import하지 않는다.
2. `server`는 domain port와 persistence port를 조정하지만 React/R3F를 import하지 않는다.
3. Supabase adapter는 persistence port를 구현하며 domain 내부 타입을 DB row에 직접 노출하지 않는다.
4. `projection`은 canonical 결과를 읽을 수 있지만 presentation이나 DB SDK에 의존하지 않는다.
5. `presentation-3d`는 shared public contracts만 읽고 server/persistence/private domain state를 import하지 않는다.
6. `presentation-3d` input은 `SelectionIntent`만 방출하고 명령 reducer, network mutation 또는 canonical state를 직접 변경하지 않는다.
7. `ui/replay`는 player projection의 event만 사용하며 private/canonical event를 import하지 않는다.
8. client bundle에서 `server`, `persistence/supabase/server-client`, private projection source가 참조되면 build/security test를 실패시킨다.

## 11. 테스트 구조와 착수 게이트

| 테스트 층           | 최소 범위                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit                | 16×16 맵 manifest, 이동·점유·공항/항구 4칸, 모든 명령, 순서, 비용, seed 재현, 승리·무승부, command reducer와 대표 경로 tie-break                                                                                                                                                                                                                                                                                                                                                              |
| Component           | 닉네임·로비·작전 복구·방 취소·명단 은닉·HUD·명령 작성기·저장 상태·사건 replay의 상태 전이와 오류 복구                                                                                                                                                                                                                                                                                                                                                                                         |
| Contract            | 요청/응답 파싱, contract version, `revision`/`private_input_version`/`draft_version`, invite fragment-only 전달·60분 TTL·one-time-secret public wire, idempotency 24시간 replay/410 tombstone, durable rate limit·`Retry-After`, 비회원 join의 통합 `INVITE_UNAVAILABLE`·`PLAYER_ALREADY_IN_GAME`, 잘못된 nickname/room/setup/draft/order 거절, 잠금 뒤 수정 API 부재                                                                                                                         |
| Projection security | RED/BLUE별 golden DTO, 상대 유형·명령·draft·명단 위치·경로·seed 문자열 부재, 상대 잠금 timing 비노출, event 수신자 차이                                                                                                                                                                                                                                                                                                                                                                       |
| Persistence         | migration 재실행, transaction rollback, idempotency→rate bucket→game→user claim→turn 안정적 row lock 순서, expected 4xx·429 commit 대 unexpected DB/503 rollback, rate bucket 원자 한도·24시간 정리, idempotency replay/expired tombstone, revision·private/draft version 경합, 사용자별 active-game claim 단일성·cancel/finish 원자 해제, active invite 단일성·60분 expiry, cancel↔join·finish↔새 create/join 경합, roster 충돌, 전체 draft 집합 합법성, deadline snapshot, 원자적 복수 충원 |
| RLS/Auth            | anonymous 사용자 교차 방 읽기·쓰기 거절, 탈퇴/만료 세션 거절, private Realtime 구독 거절                                                                                                                                                                                                                                                                                                                                                                                                      |
| Integration         | 방 생성 응답 유실 복구·invite 재발급·waiting cancel·setup 양측 cancel, 동일 사용자의 서로 다른 create/join 경합과 같은 game join 재시도, 팀 1회 배정, 명단 은닉 재선택, 합법 draft 저장·복구, 0 agent/no mole 즉시 자동 확정, 두 클라이언트 동시 잠금, timeout 자동 대기, 중복 advance, broadcast 유실 후 polling 복구                                                                                                                                                                        |
| E2E                 | 닉네임 → 방 생성/복구 → 두 번째 브라우저 참가 → 명단 은닉 → 명령 작성·저장 → 한 턴 replay → 새로고침/재접속 → 결과 확인                                                                                                                                                                                                                                                                                                                                                                       |
| 3D/입력             | waiting/setup WebGL2 호환성 gate, active 재접속 첫 load·context 복구·2D 논리 폴백, 단일 좌표 변환, waypoint, `SelectionIntent` bridge, PC/태블릿 포인터·터치·키보드, GLB 폴백                                                                                                                                                                                                                                                                                                                 |
| 접근성·반응형       | 48×48 CSS px 대상, focus 순서·복귀, live region, reduced motion, 색상 외 상태 단서, 가로 layout과 세로 orientation gate·가로 복귀 상태 보존                                                                                                                                                                                                                                                                                                                                                   |
| Performance         | [PRESENTATION.md](./PRESENTATION.md)의 전체 맵·8요원 production build 기준                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Deployment          | GitHub Preview build, environment 분리, Preview 두 클라이언트 smoke test, Production 자동 차단·clean approved-SHA provenance 검증. 실제 Production은 별도 승인 시만 실행                                                                                                                                                                                                                                                                                                                      |

정적 typecheck와 unit test만으로 1대1 멀티플레이 준비 완료를 선언하지 않는다. 최소 한 번은 서로 분리된 두 브라우저 context와 실제 태블릿에서 권한·동기화·입력·복구를 함께 검증한다.

## 12. GitHub·Vercel·환경변수 준비안

후속 Vercel integration 승인을 받은 뒤 비-production GitHub 브랜치 push가 Vercel Preview를 만들고, 검증된 `main` commit만 별도 승인 뒤 수동 Production으로 배포하는 흐름을 사용한다. Vercel은 기본적으로 Production Branch의 push·merge를 Production으로 배포하므로, Git Integration 전에 아래 tracked guard를 만든다. 공식 동작은 [Vercel Git 배포](https://vercel.com/docs/git), [Git Configuration](https://vercel.com/docs/project-configuration/git-configuration)과 [배포 개요](https://vercel.com/docs/deployments/overview)를 따른다.

현재 Phase 0B에서는 Vercel project/CLI/Git Integration/Preview와 tracked guard 생성을 모두 보류한다. 아래 내용은 후속 승인을 받은 integration 단계의 실행 계약이다.

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "git": {
    "deploymentEnabled": {
      "main": false
    }
  }
}
```

이 guard는 Vercel Git Integration 전에 guard-only PR과 별도 `main` merge 승인을 거쳐 **remote `main`에 먼저 존재**해야 한다. 그 뒤 `vercel link` 또는 동등한 deployment 없는 project create/link 경로로 껍데기 프로젝트를 만들고 Git을 연결한다. Dashboard의 Git import `Deploy`는 첫 Production deployment를 만들 수 있으므로 Production 승인 없이 사용하지 않는다. 연결 직후 Production Branch `main`, guard 적용과 Production deployment 0건을 검증한다. 명시되지 않은 이후 `codex/*` branch는 Preview를 만들 수 있지만 `main` push·merge는 자동 deployment를 만들지 않는다. Production은 승인된 remote `main` SHA로 만든 별도의 clean detached worktree에서 `HEAD`·remote SHA 일치와 `git status --porcelain` 0건을 확인하고, lockfile-pinned Vercel CLI를 `pnpm exec`으로 실행해 수동 생성한다. deployment source/Git SHA를 사후 검증하며 기존 사용자 작업트리를 reset·clean·release checkout에 쓰거나 guard를 임의로 해제하지 않는다.

예정 환경변수는 다음과 같다. 실제 값은 아직 요청·저장하지 않는다.

| 이름                                   | 노출 범위        | 용도                                               |
| -------------------------------------- | ---------------- | -------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Browser + Server | Supabase 프로젝트 URL                              |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + Server | Auth와 제한된 public client 초기화                 |
| `NEXT_PUBLIC_APP_ENV`                  | Browser + Server | Local/Preview/Production 표시와 진단용 환경 구분   |
| `DATABASE_URL`                         | Server only      | Supabase pooler를 통한 짧은 PostgreSQL transaction |
| `SUPABASE_SECRET_KEY`                  | Server only      | 검증된 Auth 관리·Realtime 등 제한된 내부 작업      |
| `INVITE_TOKEN_PEPPER`                  | Server only      | 원문을 저장하지 않는 invite token hash 강화        |

- Local/Preview/Production 값을 분리한다.
- Local 값은 로컬 Supabase stack만 가리키고 Preview 값은 별도 승인된 Preview 프로젝트만 가리킨다. 기존 서울 Production-reserved 프로젝트 값을 Local/Preview에 복사하지 않는다.
- `.env.local`과 Vercel 연결 메타데이터를 저장소에 커밋하지 않는다.
- secret은 문서, 채팅, 테스트 fixture, client-side 환경변수와 브라우저 로그에 복사하지 않는다.
- GitHub와 Vercel을 연결하기 전 저장소 소유자, Production branch `main`, tracked main auto-deploy guard, Preview 접근 정책과 배포 권한을 확인한다.

## 13. 개발 실행 순서와 현재 상태

아래 단계는 승인된 순서이며 완료·진행·보류를 구분한다.

1. **완료** — 사용자가 2026-08-22에 v0.6/t0.2 승인과 로컬 Phase 0B 개발 착수를 명시했다.
2. **완료 / LOCAL VERIFIED** — `codex/phase-0b-foundation`에서 Node.js·pnpm 계약, Next.js TypeScript 스캐폴드, lint·typecheck·Vitest·Playwright 설정과 정확한 package lock을 생성하고 현재 slice의 품질 게이트를 통과했다.
3. **완료 / LOCAL VERIFIED** — design token·Geist/Pretendard font와 Galaxy Tab S9+ 가로 전용 app shell·세로 orientation gate를 구현했다.
4. **완료 / LOCAL VERIFIED** — fixture player projection으로 로비·HUD·Q-079 command-composer reducer와 오류·빈 상태를 DOM 중심으로 구현했다.
5. **Phase 0B-3 local resolver 완료 / UNIT VERIFIED** — 순수 domain/map/order/RNG/movement/outcome, setup·objective·hack·investigate·assassination·economy·reinforcement의 결정적 로컬 턴 판정, 세 턴 연속 fixture와 동시 이동·4명 수용·복수 제거/충원·목표 드롭/인도·동시 승리 회귀, allowlist player projection을 만들었다. 이는 서버 권위·persistence·recipient별 `TurnEvent` 구현이 아니다.
6. **보류 / A-011** — Docker Desktop·Local Supabase·모든 Supabase SDK/CLI와 backend 구성을 수행하지 않고 서울 Production-reserved 프로젝트도 연결하지 않는다.
7. 팀 1회 무작위 배정, 명단 은닉 재선택, draft 저장/복구/마감 snapshot과 불변 lock Route Handler를 연결한다.
8. **기본 장면·입력 bridge·로컬 여러 턴·투영 결과 재생 완료 / 서버 replay 미구현** — 기본 도형 R3F 장면과 `SelectionIntent`, 전체 화면 지도·반투명 HUD, 명단 은닉→40초 일반→10초 배신자→timeout 기본 명령→결과→동일 입력 재판정→여러 턴, 결정적 seed 생성·재시작과 사전 투영된 BLUE 결과의 순차 재생을 구현했다. 로컬 카운트다운은 절대 wall-clock deadline으로 백그라운드 복귀를 따라잡지만 Production 권위는 아니다. canonical 사건 저장·recipient projection·revision을 갖춘 서버 replay는 후속 구현한다.
9. **로컬 fixture 자동화 완료 / 실기기 미검증** — Playwright 1440×900 desktop·1280×800 touch landscape·1024×640 compact landscape·800×1280 portrait gate에서 실제 timeout·background 복구·세 턴 연속 진행·훈련 seed·사건 재생을 포함해 11 passed·17 intended skips를 기록하고 로컬 브라우저로 page warning/error와 `THREE.Clock` deprecation warning 0건을 확인했다. 물리 touch·S Pen·WebGL2·성능은 별도 device gate다.
10. **보류** — Preview integration 전에 guard-only 변경을 만들고 별도 `main` merge 승인을 받는 단계.
11. **보류** — Vercel 프로젝트·Git 연결·Preview와 별도 Supabase Preview 프로젝트를 구성하는 단계.
12. **보류** — Production-reserved Supabase migration, `main` merge와 Production 배포. 각각 별도 승인을 받는다.

## 14. 현재 생성 사실과 아직 완료하지 않은 항목

- **구현·로컬 검증됨**: Next.js 앱 스캐폴드, `package.json`, `pnpm-lock.yaml`, fixture 로비·Q-079·전체 화면 지도·반투명 HUD, 기본 도형 R3F·`SelectionIntent`, 절대 마감 기반 40초·10초 timeout과 자동 기본 명령, 명단 은닉부터 여러 턴·결정성 replay, 다음 훈련 seed·같은/새 seed 재시작과 사전 투영된 BLUE 결과의 순차 사건 재생까지의 순수 로컬 턴 resolver와 allowlist projection slice
- **로컬 검증됨**: lint·typecheck·format·`git diff --check`, 43 source boundary, Vitest 13파일·77테스트, 정적 `/` Next production build, Playwright 11 passed·17 intended skips, 로컬 브라우저 page warning/error와 `THREE.Clock` deprecation warning 0건
- **미구현·미검증**: Production 권위 gameplay server, Route Handler·persistence, 서버 draft sync, canonical 사건 저장·recipient별 projection·revision 기반 event replay, 두 클라이언트 흐름, 물리 Galaxy Tab S9+ touch·S Pen·WebGL2·성능
- 보류: Docker API 호환 container runtime, 모든 Supabase SDK/CLI, 로컬 Supabase stack과 별도 Preview 프로젝트, 테이블, migration, Auth, RLS와 Realtime channel
- 기존 서울 Production-reserved Supabase 프로젝트의 스키마·migration·환경변수 연결
- 보류: Vercel 프로젝트·CLI·환경변수·도메인·GitHub 연동과 Preview
- 미생성: 최종 GLB 에셋
- 미완료: CI workflow, 코드-bearing 커밋·push와 모든 배포

서울 Production-reserved Supabase 빈 컨테이너는 앱 또는 개발 환경이 아니며 계속 연결하지 않는다. 현재 상태는 **Phase 0B-4 로컬 replay·훈련 UX slice가 구현·검증됐다**는 뜻이며, Phase 0B 전체·서버 권위 게임·두 클라이언트 실행이나 배포가 완료됐다는 의미가 아니다.
