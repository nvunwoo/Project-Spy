> **보관 안내 (2026-09-25):** 추가 개발 예정이 없습니다. 이 문서의 이전 단계·서비스·후속 작업 표현은 작성 당시의 설계 기록입니다. 실제 구현·배포 상태는 [현재 상태](../CURRENT_STAGE.md)를 확인하세요.

# 기술 아키텍처 계약

> 문서 상태: **ACTIVE — APPROVED t0.2 CONTRACT**
> 기술 준비 기준: t0.2
> 게임 기획 기준: v0.6<br>
> 최종 갱신: 2026-08-22<br>
> 소프트웨어 개발 상태: **PHASE 0B STARTED — LOCAL FOUNDATION IN PROGRESS**

이 문서는 PC·태블릿 대상 3D 웹게임의 구현 경계와 권위 구조를 확정한다. 실제 데이터 구조와 HTTP 계약은 [DATA_AND_API.md](./DATA_AND_API.md), 화면 상태·조작·반응형 계약은 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md), 외부 계정·프로젝트·권한과 착수 게이트는 [TECHNICAL_READINESS.md](./TECHNICAL_READINESS.md)가 소유한다. 게임 판정 순서는 [TURN_MODEL.md](../game-design/TURN_MODEL.md), 위치·비밀 정보 규칙은 [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md)가 단일 기준이다.

이 문서는 2026-08-22 사용자 승인을 받은 구현 계약이다. `codex/phase-0b-foundation`의 Next.js 앱 스캐폴드, fixture UI, 기본 도형 R3F 표현과 현재 순수 규칙 foundation slice는 **IMPLEMENTED / LOCAL VERIFIED**다. 서울 리전의 Production-reserved 빈 Supabase 컨테이너에는 gameplay schema·table·RLS·함수·환경 연결을 구성하지 않았으며 모든 Supabase SDK/CLI와 Vercel 프로젝트·CLI·Preview·Production은 보류한다.

## 아키텍처 목표

- 두 플레이어가 하나의 권위 있는 게임 판정을 공유한다.
- 각 플레이어에게 허용된 상태와 사건만 서버에서 투영해 전달한다.
- 동시 명령, 제한 시간, 난수와 중복 요청을 재현 가능하고 원자적으로 처리한다.
- 3D scene은 게임 결과를 표현할 뿐 판정하지 않는다.
- PC와 태블릿에서 동일한 논리 게임을 마우스와 터치로 조작할 수 있다.
- 서버 인스턴스 교체, 재시도, Realtime 단절과 브라우저 새로고침에 복구할 수 있다.
- 초기 데모에 필요한 단순한 구조를 유지하고 전용 게임 서버나 대규모 실시간 시스템을 만들지 않는다.

### 현재 구현된 로컬 아키텍처 slice

- `src/domain`의 map 좌표·manifest·pathfinding, order 타입·합법성·경제 검증, namespaced deterministic RNG, 이동 resolve와 outcome 평가를 React·Three.js·네트워크·persistence 없이 구현했다.
- 플레이어에게 내보낼 fixture 상태는 allowlist projection 경계를 사용하며 canonical hidden state를 브라우저에서 CSS로 숨기는 구조를 만들지 않았다.
- UI command reducer와 R3F `SelectionIntent`는 논리 좌표·공개 projection을 사용하고 world transform을 규칙 상태로 역수입하지 않는다.
- source boundary 검사는 36개 파일에서 통과했다. 전체 12단계 turn resolver, 서버 Route Handler·transaction·persistence, Auth·Realtime과 두 클라이언트 동기화는 아직 구현하지 않았다.

## 확정 기술 스택

| 영역                        | 확정 기술                                          |
| --------------------------- | -------------------------------------------------- |
| Language                    | TypeScript                                         |
| Runtime                     | Node.js 24.x LTS                                   |
| Package manager             | pnpm 11.x                                          |
| Web                         | Next.js App Router + React                         |
| 3D                          | React Three Fiber + Three.js + Drei                |
| 3D asset                    | GLB / glTF                                         |
| Hosting                     | Vercel                                             |
| Server API                  | Next.js Route Handlers on Vercel Node.js Functions |
| Database                    | Supabase PostgreSQL                                |
| Authentication              | Supabase Anonymous Auth                            |
| Primary change notification | Supabase Private Realtime Broadcast                |
| Realtime event              | `state_changed`                                    |
| Recovery synchronization    | Authenticated fallback polling                     |

Vercel WebSocket Public Beta는 핵심 의존성으로 사용하지 않는다. Next.js의 WebSocket upgrade API, Function 인스턴스 메모리 기반 방과 연결 고정성을 요구하는 구조를 만들지 않는다.

## 전체 구조

```text
PC / Tablet Browser
  ├─ Next.js / React UI
  ├─ React Three Fiber 3D presentation
  ├─ Supabase Anonymous Auth session
  ├─ Private Realtime subscription: game:<gameId>
  └─ HTTPS Route Handler calls
                  │
                  ▼
Vercel Node.js Route Handlers
  ├─ authenticated user verification
  ├─ request validation and idempotency
  ├─ authorization and player-slot binding
  ├─ pure game rule resolver
  ├─ per-player projection
  └─ server-only Postgres transaction adapter
                  │
                  ▼
Supabase PostgreSQL
  ├─ canonical private game state
  ├─ transaction and row locks
  ├─ immutable locked orders
  ├─ deterministic random record
  ├─ canonical TurnEvent history
  └─ monotonic game revision
                  │ commit
                  ▼
Supabase Private Realtime
  └─ state_changed { gameId, revision }
                  │
                  ▼
Authorized clients refetch their own projection
```

Realtime 메시지는 권위 상태가 아니라 갱신 신호다. 연결이 끊기거나 메시지가 중복·지연·유실돼도 HTTPS 재조회와 revision 비교만으로 복구할 수 있어야 한다.

## 계층과 의존 방향

```text
Game domain types and pure rules
            ▲
            │
Application services
  room / order / turn / projection
       ▲                 ▲
       │                 │
Route Handlers      3D presentation
       ▲                 ▲
       │                 │
Postgres adapter    React/R3F adapters
```

확정 경계:

- `game domain`은 React, Three.js, Next.js, Supabase와 Vercel을 import하지 않는다.
- `application services`는 도메인 규칙을 조합하지만 HTTP나 3D 좌표를 게임 판정으로 사용하지 않는다.
- `Route Handlers`는 인증, 입력 검증, transaction, projection과 응답을 담당한다.
- `Postgres adapter`는 잠금, 저장, revision과 idempotency를 담당한다.
- `3D presentation`은 projection과 TurnEvent만 소비하며 canonical state를 받지 않는다.
- 논리 위치 `row`, `column`이 단일 기준이며 Three.js Transform을 다시 게임 상태로 읽지 않는다.

## Next.js 런타임 경계

- App Router를 사용한다.
- 게임 상태 변경과 Postgres 연결이 필요한 Route Handler는 기본 Node.js runtime을 사용한다.
- 게임 API를 Edge runtime으로 옮기지 않는다. Node.js crypto, Postgres driver와 전체 패키지 호환성이 우선이다.
- R3F Canvas와 브라우저 입력을 사용하는 3D 계층만 Client Component 경계 안에 둔다.
- Server Component에서 Client Component로 전달하는 값은 JSON 직렬화 가능한 projection으로 제한한다.
- 플레이어별 상태, 세션이 포함된 화면과 API 응답은 정적 생성·공유 cache 대상으로 삼지 않는다.
- 게임 state·event 응답은 `private, no-store`를 사용하고 CDN 또는 다른 사용자에게 공유하지 않는다.
- Anonymous Auth 세션을 포함한 응답에 ISR이나 공개 cache를 사용하지 않는다.

게임의 HTTPS 계약을 명확히 유지하기 위해 핵심 room·state·order·sync 기능은 Route Handler로 제공한다. UI 편의를 위한 Server Action을 향후 사용할 수 있지만 서버 권위와 API 계약을 우회해서는 안 된다.

## 서버 권위 계약

다음 값은 서버와 Postgres에 저장된 canonical state만을 기준으로 한다.

- 방과 플레이어 슬롯
- 서버가 확정한 RED·BLUE 팀 배정
- 닉네임 확정 상태
- 현재 턴·단계·deadline과 잠금 상태
- 16×16 맵, 시설 배치와 배치 식별자
- 요원 명단 배치 시도·잠금·충돌·확정 상태
- 현재 사용자의 private 일반 명령 draft와 draft version
- 요원 위치·유형·생존·행동 가능 상태
- 배신자 소유와 비밀 명령
- 목표물 위치·운반·탈출지·확보 상태
- 공작 자금, 지속 효과와 재매수·충원 일정
- 모든 확률 판정과 무작위 순서
- TurnEvent와 사건 순서
- 게임 revision과 승리·무승부·종료 상태

클라이언트는 희망 명령과 입력만 제출한다. 다음 값은 신뢰하지 않는다.

- 클라이언트가 보낸 사용자 ID·팀·슬롯
- 클라이언트 시간, 남은 시간과 phase
- 3D Transform 또는 화면 좌표
- 클라이언트가 계산한 경로 유효성, 비용, 성공률과 난수 결과
- 닉네임이나 `user_metadata`에 기록된 권한 정보
- 클라이언트가 보낸 현재 revision보다 최신이라는 주장

## 인증과 플레이어 슬롯

### Anonymous Auth

- 회원가입 UI 없이 Supabase Anonymous Auth를 사용한다.
- 익명 사용자는 고유한 `auth.uid()`를 가지며 Postgres에서는 `authenticated` 역할을 사용한다.
- 서버는 검증된 세션에서 `auth.uid()`를 얻고 `game_players`의 참가 관계로 권한을 판단한다.
- 사용자 입력의 `userId`, nickname과 JWT `user_metadata`를 권한 근거로 사용하지 않는다.
- 익명 세션은 같은 브라우저 프로필의 cookie/session이 유지되는 범위에서 복구한다.
- 로그아웃, 브라우저 데이터 삭제나 다른 기기로의 이동 뒤 동일 계정을 복구하는 기능은 MVP 비범위다.
- MVP에서 하나의 `auth.uid()`는 waiting·setup·active 중인 game 하나에만 결합될 수 있다. 이 제한은 화면 조회 결과가 아니라 private `user_active_game_claims`의 사용자별 unique claim으로 강제한다.

### 방 생성과 참가

1. 방 생성자는 유효한 익명 세션과 닉네임을 제출한다.
2. 서버 transaction이 방, 사용자별 active-game claim과 첫 플레이어 슬롯을 함께 생성한다.
3. 서버는 guest 참가용 원문 token을 한 번만 반환하고 DB에는 hash만 저장한다.
4. 다른 익명 사용자가 유효한 token과 닉네임으로 참가하면 active-game claim과 두 번째 슬롯에 원자적으로 결합한다.
5. 같은 game에 이미 결합된 사용자의 재시도는 token이 이미 사용됐더라도 기존 슬롯과 현재 projection을 먼저 반환하고 닉네임·팀·seat를 다시 쓰지 않는다.
6. 세 번째 사용자, 사용된 token, 잘못된 token과 이미 다른 nonterminal 방 슬롯에 결합된 요청은 거부한다. cancelled·finished membership은 새 방을 막지 않는다.
7. 두 슬롯과 준비 조건이 충족돼야 경기 초기화 transaction을 실행한다.

슬롯과 사용자별 진행 game 선점은 Postgres row lock와 unique constraint로 보호한다. create·join은 claim과 membership을 같은 transaction에서 만들고, cancel·finish는 해당 game의 모든 claim을 같은 transaction에서 해제한다. 클라이언트에서 Player 1·2를 먼저 정하고 저장하지 않는다.

MVP 참가 수단은 초대 링크 또는 그 링크에서 추출한 원문 token이며 별도의 짧은 수동 방 코드는 만들지 않는다. 생성 응답과 로컬 idempotency key를 모두 잃은 host는 인증된 자기 membership 기반 recoverable-room 조회로 waiting 방을 다시 찾고 새 invite를 발급한다. guest 참가 전 waiting host 또는 첫 `GENERAL_ORDER_OPEN` 전 setup의 어느 player나 `작전 취소`를 요청할 수 있다. 서버는 game·사용자 claim·slots·invite·setup submission을 같은 transaction에서 잠가 `cancelled`로 남기고 두 사용자의 claim을 해제해 새 방으로 이동할 수 있게 한다. `active` 경기의 `나가기`는 로컬 화면 이탈일 뿐 slot 삭제·기권이 아니며 MVP에는 active-game leave API가 없다.

두 슬롯이 확정되면 서버가 저장된 암호학적 난수 결과로 seat와 RED·BLUE의 대응을 50:50으로 배정한다. 정확히 한 명은 RED, 다른 한 명은 BLUE여야 하며 host·guest·먼저 준비한 사용자가 팀을 선택하거나 유리한 확률을 얻지 않는다. 배정 결과와 사용한 random namespace는 경기 초기화 transaction에 기록하고 재시도로 다시 추첨하지 않는다.

### 초대 token

- 원문은 암호학적으로 안전한 128-bit 이상의 난수다.
- token hash만 DB에 저장하고 원문을 로그에 남기지 않는다.
- 각 generation은 server timestamp 기준 발급 뒤 정확히 60분 동안 유효하다. 만료는 waiting game이나 host claim을 자동 취소하지 않으며 host가 새 generation을 재발급한다.
- guest 슬롯 결합에 성공하면 재사용할 수 없다.
- 자동 참가 URL은 fragment 전달만 허용한다. query·path에는 원문 token을 넣지 않는다. 클라이언트는 fragment를 memory에 한 번 포착한 즉시 `history.replaceState`로 주소에서 제거한 뒤 same-origin POST body로만 교환한다. URL·`Referer`·analytics·error report·log·persistent browser storage에 원문을 남기지 않는다.
- `roomId`는 식별자일 뿐 참가 권한이 아니다.
- DB에 원문을 저장하지 않으므로 생성·재발급 성공 뒤 HTTP 응답이 유실되면 기존 원문을 복구하지 않는다. 같은 create key 재시도 또는 recoverable-room 조회로 game ID를 회복하고, host에게 **초대 링크 재발급**을 제공해 기존 미사용 token을 취소한 같은 transaction에서 새 generation token을 만든다.

### 닉네임

닉네임은 표시 이름이며 인증 수단, 권한, 방 ID나 영구 계정명이 아니다.

- Unicode NFC 정규화 후 양끝 공백을 제거한다.
- 정규화된 결과는 2~16 grapheme cluster여야 한다.
- Unicode letter, number, 내부 U+0020 공백, `_`, `-`만 허용한다.
- 제어문자, 줄바꿈, tab과 양끝 공백은 허용하지 않는다.
- 내부 공백의 연속은 하나의 U+0020으로 정규화한다.
- 방 안에서는 서버가 계산한 정규화 비교 key가 중복될 수 없다.
- 경기가 시작된 뒤에는 변경할 수 없다.
- 서버와 DB constraint가 최종 검증자이며 클라이언트 검사는 편의 기능일 뿐이다.

## 게임 phase와 서버 시간

기획의 네 단계 턴은 [TURN_MODEL.md](../game-design/TURN_MODEL.md)를 따른다. 기술 상태는 최소한 다음 전이를 구분한다.

```text
WAITING_FOR_PLAYER
  → INITIALIZING
  → ROSTER_PLACEMENT_OPEN
  → ROSTER_PLACEMENT_RESOLVING
      ├─ same building: invalidate both choices → ROSTER_PLACEMENT_OPEN
      └─ distinct buildings: finalize objectives → GENERAL_ORDER_OPEN
  → GENERAL_ORDER_LOCKED
  → MOLE_ORDER_OPEN
  → MOLE_ORDER_LOCKED
  → RESOLVING
  → RESULT_AVAILABLE
  → next turn boundary
  → GENERAL_ORDER_OPEN
  → ...
  → FINISHED
```

game lifecycle status는 두 번째 player 참가 전 `waiting`, 참가 뒤 위 INITIALIZING·ROSTER 단계에서 `setup`, 서로 다른 명단 위치가 확정돼 첫 `GENERAL_ORDER_OPEN`을 열 때 `active`가 된다. waiting host 또는 setup player의 취소는 어느 지점에서든 `cancelled` terminal status로 전환한다.

- `ROSTER_PLACEMENT_OPEN`은 [WORLD_MISSIONS.md](../game-design/WORLD_MISSIONS.md)의 자기 팀 요원 명단 은닉 선택을 받는 경기 전 단계다. 이 단계에는 제한 시간을 두지 않는다.
- 양측 선택은 private이며 모두 잠긴 뒤에만 비교한다. 같은 건물을 선택하면 두 선택을 모두 무효화하고 attempt를 증가시켜 다시 연다. 상대가 고른 건물은 충돌 여부와 관계없이 공개하지 않는다.
- 서로 다른 건물이면 두 명단 위치, 설계도·과학자 배치와 탈출지를 하나의 초기화 transaction에서 확정한 뒤 첫 `GENERAL_ORDER_OPEN`을 연다.
- 일반 명령과 배신자 명령의 deadline은 Postgres `timestamptz` 서버 값이다.
- 클라이언트 타이머는 `serverTime`과 deadline 차이를 표시할 뿐 phase를 바꾸지 않는다.
- 양 플레이어가 일찍 잠그면 deadline 전에도 다음 단계로 전환할 수 있다.
- deadline을 넘긴 기본 명령은 서버가 [TURN_MODEL.md](../game-design/TURN_MODEL.md)의 규칙으로 확정한다.
- 브라우저 background throttling과 로컬 시계 변경은 판정에 영향을 주지 않는다.
- Vercel Cron을 10초·40초 phase 타이머로 사용하지 않는다.
- lock, sync 또는 재접속 요청이 due phase를 발견하면 서버가 동일한 원자적 전환 함수를 실행한다.
- 아무 클라이언트도 연결되지 않은 동안에는 다음 유효 authenticated `advance` 요청에서 server timestamp를 기준으로 필요한 전이를 따라잡는다.
- `GENERAL_ORDER_OPEN` 진입 transaction은 활동 가능 요원이 0명인 player의 빈 `server_defaulted` submission을 즉시 만들고 owner scope의 `private_input_version`을 증가시킨다. `MOLE_ORDER_OPEN` 진입도 조종할 살아 있는 배신자가 없는 player를 같은 방식으로 즉시 자동 확정한다.
- phase 진입 자동 submission과 phase 전환은 하나의 shared transaction에서 반복한다. 양측 모두 자동 확정 대상이면 40초·10초를 열지 않고 다음 입력 필요 phase 또는 `RESOLVING`까지 진행하며, 최종 player-visible 상태에 대해 shared revision과 Broadcast를 한 번만 만든다.

### 일반 명령 draft와 시간 초과

- 클라이언트는 한 요원의 명령이 path·action·target까지 완전하고 현재 공개 정보 기준으로 유효해진 시점마다 server-side private draft를 저장한다. 반쯤 선택된 destination·action·target은 저장하지 않는다.
- draft는 같은 game·turn·player의 본인에게만 보이는 mutable 입력이며 별도 `draft_version`으로 충돌을 감지한다. draft 저장은 공개 `game.revision`을 증가시키지 않고 Realtime `state_changed`를 보내지 않는다.
- draft upsert는 해당 player의 모든 활동 agent와 저장 draft를 agent ID 오름차순으로 잠근 뒤, 제안 row와 누락 agent의 암시적 `WAIT`를 합친 전체 묶음의 비용·횟수·상호 배타 제한을 검증한다. 따라서 저장된 draft 집합은 항상 그대로 deadline snapshot 가능한 합법 상태다.
- 수동 **확정**은 모든 활동 가능 요원의 최종 명령 묶음을 한 transaction에서 검증하고 immutable submission으로 잠근다. UI의 미지정 활동 요원은 명시적인 `WAIT` 기본값으로 포함한다. 활동 가능 요원이 0명이면 일반 명령 입력을 서버가 자동 종료한다.
- 40초 deadline 전환은 전체 집합 검증을 통과한 저장 complete draft를 원자적으로 그대로 snapshot하고 draft가 없는 활동 가능 요원만 `WAIT`로 채워 immutable server-defaulted submission을 만든다. deadline에서 초안을 임의로 버리거나 우선순위를 다시 정하지 않으며, background tab·새로고침·일시적 네트워크 단절 때문에 서버가 이미 저장한 완전한 명령을 버리지 않는다.
- 사용자가 자기 입력을 확정하기 전에는 상대의 잠금 여부·draft 활동·잠금 시각을 projection에서 생략한다. 자기 확정 뒤에는 `상대 입력 중`처럼 행동 불가능한 coarse waiting 상태만 허용하며 정확한 시각과 명령 수는 공개하지 않는다.
- 한쪽만 잠근 secret setup·일반·배신자 submission은 공개 `game.revision`을 증가시키거나 Realtime을 보내지 않는다. 양측 잠금·deadline으로 phase가 실제 전환될 때만 shared revision을 증가시켜, revision 변화 자체로 상대의 입력 시각을 추론하지 못하게 한다.
- 이 단독 secret lock은 `(game, setup attempt 또는 turn, phase, player)` 범위의 `private_input_version`을 증가시켜 owner에게만 HTTPS로 반환한다. agent draft의 `draft_version`과 submission의 `private_input_version`은 서로 다른 목적이며 상대 projection에는 어느 것도 노출하지 않는다.

## Postgres transaction과 row lock

모든 게임 상태 변경은 Vercel Node.js Route Handler의 server-only persistence 계층에서 짧은 Postgres transaction으로 실행한다.

### 연결 방식

- transaction과 `SELECT ... FOR UPDATE`가 필요한 게임 경로는 server-only pooled Postgres connection을 사용한다.
- browser에서 DB connection string을 사용하지 않는다.
- Supabase Data API를 canonical gameplay mutation의 transaction 경계로 사용하지 않는다.
- Function 인스턴스의 전역 변수나 in-memory mutex를 잠금으로 사용하지 않는다.

### 잠금 순서

교착을 줄이기 위해 모든 mutation은 다음 순서로 필요한 행만 잠근다.

0. request-scoped `idempotency_requests`
1. request-scoped `api_rate_limit_buckets`
2. `games`
3. `user_active_game_claims`
4. 현재 `turns`
5. `game_players`
6. `game_invites`
7. 현재 setup attempt 또는 현재 턴의 draft·order submission
8. 영향을 받는 agents·objectives·economy rows

`idempotency_requests`는 `scope_key + authenticated_user_id + operation + key hash`의 단일 request row를 domain row보다 먼저 `INSERT ... ON CONFLICT` 또는 동등한 방식으로 claim한다. 아직 유효한 commit의 같은 payload면 뒤의 row lock 없이 안전한 결과를 재생한다. 다른 payload의 충돌과 만료된 key는 필요한 rate-limit bucket을 원자 갱신·commit한 뒤 각각 409·410으로 종료한다. 새 요청이면 bucket을 안정된 key 순으로 갱신하고 domain savepoint를 연 뒤 `games` → 사용자 claim → `game_players` → `game_invites` 순서를 지킨다. 방 생성은 아직 공유되지 않은 새 game row를 만든 뒤 사용자 claim을 획득한다. claim 충돌 같은 예상된 domain 4xx는 domain savepoint까지만 rollback해 새 game·slot 등 canonical write를 없애고, outer transaction의 rate bucket과 안전한 `committed_failure`는 commit한다. 같은 범주의 여러 행은 안정된 식별자 오름차순으로 잠근다. claim은 user ID, 플레이어는 seat와 player ID, invite는 generation, setup·submission은 attempt/phase와 player ID, agent·objective는 안정된 entity ID, economy는 team ID 순으로 정렬한다. 잠금을 획득한 뒤 서버가 저장된 phase, revision, 사용자 claim, 슬롯과 deadline을 다시 검증한다.

### 원자적 보장

- 명령 잠금과 phase 전환은 한 transaction 안에서 처리한다.
- `MOLE_ORDER_LOCKED`에서 `RESOLVING`으로 전환하는 실행자는 하나만 성공한다.
- 턴 결과, canonical state, TurnEvent sequence, deadline와 revision 증가는 같은 transaction에서 commit한다.
- 승리·무승부로 game이 `finished`가 되면 game 다음 양 `user_active_game_claims`를 user ID 순으로, 그 다음 current turn을 잠근 동일 Resolve transaction에서 두 claim을 해제한다.
- transaction 중 오류나 Function 종료가 발생하면 전체 변경을 rollback한다.
- commit 뒤 응답 전달이 실패해도 같은 idempotency key의 재시도는 이미 저장된 **안전한** 결과를 반환한다. invite 원문처럼 one-time secret은 아래 멱등성 예외를 따른다.
- unique constraint와 check constraint를 애플리케이션 검증의 최종 방어선으로 사용한다.
- deadlock(`40P01`) 또는 serialization failure(`40001`)만 jitter를 두고 transaction 전체를 **최대 3회 시도**한다. 다른 오류는 즉시 실패하고, 3회가 모두 충돌하면 `503 RETRYABLE_TRANSACTION`을 반환한다.

Rule Resolver는 transaction 안에서 필요한 snapshot을 읽은 뒤 순수 TypeScript 로직으로 계산하고, 외부 네트워크 호출 없이 결과를 저장한다. 계산 중 Realtime, 로그 수집과 다른 외부 API를 기다리지 않는다.

## 멱등성

상태 변경 요청은 `Idempotency-Key`를 사용한다.

- key는 client가 생성한 충분히 무작위인 UUID 계열 값이다.
- 유일 범위는 non-null `scope_key + authenticated_user_id + operation + key`다. 경기 mutation은 `scope_key = game:<gameId>`, game ID가 아직 없는 방 생성은 `scope_key = room:create`를 사용한다.
- request payload의 안정된 hash를 함께 저장한다.
- `committed_success`·`committed_failure`의 같은 key와 같은 payload는 commit 뒤 24시간 동안 같은 canonical resource identity·mutation status와 안전한 replay response reference를 반환한다. fixed-window `rate_limited` guard는 이 24시간 규칙의 예외로 window 종료 뒤 같은 key를 재claim한다.
- 같은 key와 다른 payload는 `409 IDEMPOTENCY_CONFLICT`로 거부한다.
- idempotency record와 상태 변경은 같은 transaction에서 commit한다. nullable `game_id`만으로 방 생성 멱등성을 보호하지 않는다.
- 24시간이 지난 key는 새 mutation으로 재해석하지 않고 `410 IDEMPOTENCY_KEY_EXPIRED`로 거부한다. 최소 key-hash tombstone은 해당 anonymous user의 안전한 정리까지 남기며 nonterminal resource를 참조하는 record를 먼저 삭제하지 않는다.
- 턴 Resolve와 due phase advancement는 저장된 state와 unique transition key로 추가 보호한다.
- 원문 invite token을 한 번만 전달하는 create/rotate는 명시적 예외다. resource 생성·generation 변경 자체는 멱등이지만 raw secret은 idempotency record에 저장하거나 같은 key 재시도에서 재생하지 않는다. 내부 상태 `rotate_required`는 public wire에서 같은 game/invite generation, `rawInviteTokenIncluded: false`, `inviteRecoveryAction: "rotate"`로 투영하고, 새 원문은 새 key의 rotate에서만 발급한다.

방 생성·join·rotate의 authenticated well-formed 요청은 durable rate bucket을 domain row보다 먼저 갱신한다. 예상된 domain 4xx는 canonical write 없이 안전한 실패 결과와 bucket을 commit한다. 429는 bucket과 fixed-window 끝까지만 유효한 guard를 commit해 같은 key의 window 내 replay를 중복 차감하지 않고, window 뒤 같은 key를 재claim할 수 있게 한다. 예상하지 못한 DB·내부 오류와 제한된 retry 뒤 503은 idempotency·bucket까지 rollback한다.

GET 요청은 상태를 변경하지 않는다. due phase를 전진시키는 동작은 명시적인 authenticated `POST .../advance` 또는 다른 mutation 내부에서만 수행한다.

## 난수와 재현

- 난수 seed는 서버의 암호학적 난수원으로 생성한다.
- 각 경기의 팀 배정·시설 배치와 각 턴 판정은 용도가 구분된 seed 또는 deterministic stream을 사용한다.
- 입력 snapshot, 규칙 버전, seed reference와 필요한 random draw 순서를 private 기록으로 보존한다.
- 클라이언트 `Math.random()`과 3D 애니메이션 난수는 게임 결과에 영향을 주지 않는다.
- 재시도와 장애 복구는 같은 저장된 입력·seed로 같은 canonical 결과를 만들어야 한다.
- 비밀을 누출할 수 있는 seed와 draw log는 경기 중 player projection에 포함하지 않는다.

검증된 A/B 시설 배치는 숨겨진 목표 배치 전에 한 번 생성해 저장하며 재접속과 새로고침으로 다시 생성하지 않는다. 상세 맵 계약은 [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md)를 따른다.

## 비밀 정보와 player projection

canonical state는 두 플레이어의 비밀을 모두 포함하므로 어떤 클라이언트에도 직접 전송하지 않는다.

```text
Canonical GameState + Canonical TurnEvent[]
                    │
                    ├─ projectFor(playerA)
                    │      └─ Player A state and events
                    │
                    └─ projectFor(playerB)
                           └─ Player B state and events
```

- projection은 인증된 `auth.uid()`가 해당 game의 어느 슬롯인지 확인한 뒤 생성한다.
- projection 함수는 명시적인 allowlist로 응답을 만든다. 전체 객체 복사 뒤 일부 필드를 삭제하는 denylist 방식을 사용하지 않는다.
- 상대의 배신자, 유형, 명령, 숨은 위치, 목표와 과학자 탈출지는 [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md)의 허용 조건이 없으면 존재 자체를 응답에 포함하지 않는다.
- canonical TurnEvent payload와 player event payload는 별도 타입으로 둔다.
- 턴 판정 transaction에서 각 player에게 허용된 event를 별도 player event stream으로 만들고 player별 연속 cursor를 부여한다.
- client cursor에 canonical event sequence를 그대로 사용해 숨겨진 사건의 개수나 위치를 누출하지 않는다.
- 3D replay도 player event만 받아 비밀 이동·행동을 재생하지 않는다.
- state와 event projection에는 monotonic `revision`, `serverTime`, 허용된 deadline와 안정된 event sequence를 포함한다.
- 현재 사용자의 요원 명단 선택과 일반 명령 draft는 본인 projection 또는 전용 private draft 응답에만 포함한다. 상대 선택·draft·정확한 잠금 시각은 포함하지 않는다.
- 이동 선택용 affordance는 공개 map topology, 해당 자기 요원의 공개 이동 한도와 현재 사용자에게 이미 허용된 정보만으로 만든다. 숨은 상대 점유·숨은 목표 때문에 destination을 제거하거나 disabled 이유를 달리해 존재를 누출하지 않는다.

## Supabase 접근 통제

- canonical gameplay tables는 Data API에 노출되지 않는 private schema에 둔다.
- `anon`과 `authenticated`에 gameplay table의 직접 SELECT·INSERT·UPDATE·DELETE 권한을 주지 않는다.
- 노출 스키마를 사용해야 하는 테이블은 RLS를 활성화하고 명시적인 row ownership 조건을 둔다.
- `TO authenticated`만으로 허용하지 않고 `auth.uid()`와 `game_players` 참가 관계를 함께 확인한다.
- `user_metadata`와 닉네임은 권한 조건으로 사용하지 않는다.
- view를 공개해야 한다면 security invoker와 최소 컬럼을 사용하지만, MVP의 기본 구조는 Route Handler projection이다.
- `SECURITY DEFINER`는 권한 오류 우회 수단이 아니다. 필요 시 private schema, 고정 `search_path`, 실행 권한 회수와 내부 사용자 검증을 요구한다.
- Supabase secret key 또는 legacy `service_role`은 RLS를 우회하므로 server-only로 제한하고 최소 권한 DB 역할을 우선한다.

정확한 테이블과 API 보안 계약은 [DATA_AND_API.md](./DATA_AND_API.md)를 따른다.

## Private Realtime 변경 알림

Supabase Realtime Broadcast는 상태 전달이 아니라 상태 변경 알림에만 사용한다.

- topic: `game:<gameId>`
- channel: private
- event: `state_changed`
- 최소 payload: `{ gameId, revision }`
- payload에 agent, order, target, mole, event detail과 nickname 외 추가 상태를 넣지 않는다.
- Realtime 설정에서 public channel 접근을 허용하지 않는다.
- `realtime.messages` RLS는 현재 `auth.uid()`가 topic의 game 참가자인 경우에만 receive를 허용한다.
- 이 확인을 위해 private membership 검사 함수가 필요하면 private schema, 고정 `search_path`, 함수 내부 `auth.uid()` 검사, `PUBLIC` 실행 권한 회수와 최소 `authenticated` 실행 권한을 요구한다.
- client broadcast·Presence는 MVP에서 허용하지 않는다.
- client는 `private: true`로 참가하고 session JWT 갱신을 전달한다.
- 참가자 제거·세션 변경 뒤 기존 연결의 authorization cache가 남을 수 있으므로 연결 종료·token refresh와 HTTPS 재검증을 함께 사용한다.

서버는 canonical transaction이 commit된 뒤 알림을 보낸다. 알림 전송 실패는 이미 commit된 게임 상태를 rollback하지 않는다. fallback polling이 최신 revision을 발견한다.

private 일반 명령 draft 저장과 phase를 전환하지 않은 한쪽의 secret submission lock은 공개 revision을 바꾸지 않으며 `state_changed` 대상이 아니다. draft 성공의 `draft_version`, lock 성공의 `privateInputScope`·`privateInputVersion`은 해당 요청을 보낸 사용자에게만 HTTPS로 반환한다. 양측 입력 완료·deadline·setup 충돌처럼 shared projection 또는 phase가 바뀌는 commit만 새 revision을 broadcast한다.

클라이언트 처리:

1. 현재 적용한 shared revision과 현재 owner input scope의 private version을 따로 보관한다.
2. 더 큰 revision의 `state_changed`를 받으면 HTTPS state를 다시 요청한다.
3. Realtime의 같거나 작은 shared revision은 중복·지연 알림으로 무시한다.
4. 직접 HTTPS 응답은 같은 scope의 `(revision, privateInputVersion)`을 비교한다. shared revision이 같더라도 private version이 더 크면 자기 lock 상태를 적용한다.
5. revision이 건너뛰어도 중간 알림을 재생하려 하지 않고 서버 projection의 최신 상태와 event sequence를 가져온다.

## fallback polling과 재접속

- Realtime 연결 여부와 무관하게 경기 중 foreground에서는 configurable safety poll을 유지한다.
- t0.2 기본값은 3초이며 실제 플레이테스트에서 조정한다.
- Realtime 오류 시 재연결은 1, 2, 4, 8초 뒤 최대 15초까지 jitter를 포함한 backoff를 사용한다.
- polling 오류도 backoff하되 phase deadline 표시를 클라이언트 판정으로 확정하지 않는다.
- `visibilitychange`, 네트워크 복귀와 탭 focus 시 즉시 authenticated `advance`를 실행한다.
- 새로고침 뒤 세션과 player slot을 확인하고 latest state projection과 아직 소비하지 않은 event sequence를 받는다.
- 복잡한 다른 기기 계정 복구와 장기 오프라인 플레이는 MVP 비범위다.

## 3D 표현 구조

### 논리 보드

- 16×16 `row`, `column`을 월드 `x`, `z`로 변환한다.
- cell size, board origin과 높이 offset은 presentation configuration이다.
- 25개의 2×2 건물 블록, 도로와 100개 건물 부지는 저장된 공개 map layout으로 렌더링한다.
- Excel의 `도로`, A/B/C, spawn과 유형 표기는 제작 데이터이며 플레이 화면에 그대로 노출하지 않는다.

### 데모 geometry

- 일반 건물: 공유 Box geometry
- 특수시설: 기본 geometry 조합과 임시 label adapter
- 요원: Capsule, Cylinder 또는 Box 계열 geometry
- board: Plane/Box와 격자 표현
- 반복 geometry와 material은 공유하고 필요하면 instancing한다.

### 이동

- 화면의 agent 선택 → destination 선택 → 공작 선택 흐름과 path 수정·확인 UX는 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md)를 따른다.
- client의 destination·path preview는 공개 projection만 사용한 임시 표현이다. 서버는 draft 저장과 lock에서 path 구조·소유권·행동 조합을 다시 검증하고, 숨은 점유처럼 실행 시점에 판정하는 정보는 preview의 가능/불가능 표시로 누출하지 않는다.
- server projection이 허용한 TurnEvent에 논리 path가 포함된다.
- presentation adapter가 각 cell을 world waypoint로 바꾸고 시간 기반 보간으로 재생한다.
- 공항·항구 내부 이동도 각각 이동 거리 1인 waypoint다.
- 최종 Transform을 서버에 game state로 다시 저장하지 않는다.
- 물리 엔진, 충돌 기반 판정, NavMesh와 실시간 위치 동기화는 사용하지 않는다.

### 향후 GLB 교체

기본 geometry와 GLB renderer는 동일한 `AgentViewModel`, `BuildingViewModel`과 animation command를 소비한다. 모델 파일, skeleton, material과 animation clip이 바뀌어도 `GameState`, Resolver, path와 projection 타입은 바뀌지 않아야 한다.

카메라, 조작, 색상, 서체와 UI 배치의 구현 기준은 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md)를 따른다. 최종 3D 모델·조명·브랜드 아트의 제작 자산은 별도 승인 전까지 기본 geometry 경계 안에 둔다.

## 환경 변수와 secrets

환경은 Local, Preview, Production으로 분리한다.

클라이언트 공개 가능:

- Supabase project URL
- Supabase publishable key

서버 전용:

- Supabase secret key 또는 legacy service role key
- pooled Postgres connection string과 DB password
- token hashing에 별도 pepper를 사용할 경우 그 값
- 운영·로그·관리용 비밀값

서버 전용 값은 `NEXT_PUBLIC_` 접두사를 사용하지 않고 client component에서 import할 수 없는 server-only module이 읽는다. 값은 Vercel 환경 변수와 승인된 로컬 비밀 파일에만 저장하며 저장소, 문서, 오류 응답과 로그에 기록하지 않는다.

## 장애와 복구 계약

| 장애                                         | 기대 결과                                                                                                                       |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 같은 일반 mutation 재시도                    | 같은 canonical resource와 안전한 idempotency 결과 반환                                                                          |
| invite create/rotate 원문 응답 유실          | 같은 key는 resource identity + `rawInviteTokenIncluded: false` + `inviteRecoveryAction: "rotate"`; 새 key rotate만 새 원문 전달 |
| expected authenticated domain 4xx            | canonical write 없이 rate bucket과 안전한 failure result commit                                                                 |
| rate limit 초과                              | bucket과 window-bound guard commit, 같은 key는 window 안에서 429 replay·뒤에는 재claim                                          |
| 두 resolve 동시 요청                         | 한 transaction만 `RESOLVING` 획득                                                                                               |
| Function이 transaction 중 종료               | Postgres rollback, 다음 요청이 다시 시도                                                                                        |
| 일반 mutation commit 후 HTTP 응답 유실       | 재시도가 저장된 안전한 결과·revision 반환                                                                                       |
| commit 후 Realtime 알림 실패                 | polling 또는 재접속이 최신 revision 발견                                                                                        |
| Realtime 중복·역순 알림                      | revision 비교로 무시                                                                                                            |
| 브라우저 새로고침                            | 같은 익명 세션을 player slot에 재결합                                                                                           |
| 브라우저 데이터 삭제                         | 기존 익명 identity 자동 복구 불가, MVP 제한 안내                                                                                |
| client clock 조작                            | server timestamp 기준이므로 판정 영향 없음                                                                                      |
| 제3자 game ID 조회                           | 참가 관계가 없으면 존재 정보를 최소화해 거부                                                                                    |
| 방 생성·초대 재발급 응답에서 원문 token 유실 | 기존 원문 복구 불가를 알리고 host가 새 idempotency key로 초대 링크를 다시 발급                                                  |
| 일반 명령 중 탭 중단·새로고침                | 마지막 server-saved complete draft를 복구하고 deadline에는 나머지만 `WAIT` 처리                                                 |

## 관측과 감사 준비

로그에는 다음 식별값만 구조적으로 남길 수 있다.

- request ID
- game ID
- turn number
- operation
- authenticated user의 비가역적 축약 식별자 또는 내부 ID
- 시작·종료 revision
- transaction retry 횟수
- 결과 status와 안전한 error code

다음을 로그에 남기지 않는다.

- 원문 invite token
- session JWT, refresh token과 API secret
- DB connection string
- canonical mole·order·hidden target payload
- nickname 전체가 필요하지 않은 운영 로그

게임 판정 감사용 private record와 운영 로그는 목적과 보존 정책을 분리한다.

## 명시적 비범위

- Vercel WebSocket Public Beta 의존
- Function 인스턴스 메모리 기반 room·presence·game state
- 전용 게임 서버와 프레임 단위 동기화
- 자유 이동, 복잡한 물리와 NavMesh
- 공개 매치메이킹, 관전, 채팅, 친구, 랭킹
- 이메일·소셜 회원가입과 기기 간 익명 계정 복구
- 최종 3D 모델·브랜드 일러스트·고급 시네마틱 제작
- 대규모 동시 접속과 고급 anti-cheat

## 아키텍처 승인과 구현 게이트

- [x] 서버 권위와 계층 의존 방향 확정
- [x] Node.js Route Handler와 Postgres transaction 경계 확정
- [x] row lock 순서와 원자적 턴 전환 확정
- [x] idempotency와 server timestamp deadline 확정
- [x] player projection과 직접 gameplay table 접근 거부 확정
- [x] Private Realtime `state_changed`와 fallback polling 확정
- [x] Vercel WebSocket Public Beta 핵심 의존 제외
- [x] Anonymous Auth, invite token과 닉네임 계약 확정
- [x] 3D 기본 도형·논리 경로·향후 GLB 교체 경계 확정
- [x] 요원 명단 배치 phase·충돌 재선택·private projection 확정
- [x] private 일반 명령 draft·deadline snapshot·상대 잠금 비노출 확정
- [x] UI 조작 계약과 숨은 점유를 누출하지 않는 이동 affordance 경계 확정
- [x] GitHub 연결과 Supabase Local/Preview/Production 역할 확정
- [x] v0.6·t0.2 최종 승인과 사용자의 Phase 0B 개발 착수 지시 — **2026-08-22**
- [x] `codex/phase-0b-foundation` 앱 스캐폴드·프로젝트 패키지·잠금 파일 생성
- [x] fixture UI·기본 도형 표현·현재 순수 규칙 foundation slice와 로컬 품질 게이트 — **IMPLEMENTED / LOCAL VERIFIED**
- [ ] 전체 gameplay resolver·서버·persistence·두 클라이언트 통합 — **NOT IMPLEMENTED / DEFERRED**
- [ ] Docker·Local Supabase·모든 Supabase SDK/CLI — **DEFERRED / A-011**
- [ ] Vercel 프로젝트·CLI·별도 Preview Supabase와 gameplay schema 세팅 — **DEFERRED**

## DEPRECATED — t0.1 이전 준비안

다음 과거 해석은 t0.1에서 대체됐다. 이력 확인을 위해 요약을 보존한다.

| 과거 준비안                                 | t0.1 대체 계약                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------ |
| 기술 문서 전체를 개발 착수까지 DEFERRED     | 실제 코드는 시작하지 않되 기술 계약은 ACTIVE t0.1로 전환                             |
| PC 웹만 명시                                | PC와 태블릿 웹을 함께 대상으로 확정                                                  |
| 닉네임 TBD                                  | 경기 전 필수 닉네임과 정규화 계약 확정                                               |
| Polling만 초기 확정, Realtime은 후보        | Private Realtime 알림을 기본으로 하고 polling을 복구 폴백으로 확정                   |
| 단일 Ready와 개략 `resolveTurn()`           | 일반·배신자 명령 잠금, server deadline, transaction과 idempotency 계약으로 대체      |
| Vercel Function과 Supabase DB의 개념적 조합 | Node.js Route Handler, pooled Postgres transaction과 player projection 경계로 구체화 |
| 브라우저별 익명 ID만 언급                   | Supabase Anonymous Auth `auth.uid()`와 game player slot 결합으로 구체화              |
| 3D 표현의 구체적 데모 경계 없음             | R3F 기본 geometry, 논리 path 재생과 GLB adapter를 확정                               |

대체는 과거의 서버 권위, 게임 로직·3D 표현 분리, GitHub·Vercel·Supabase 선택을 폐기한 것이 아니라 현행 v0.6 게임 규칙과 최신 플랫폼 목표에 맞게 구체화한 것이다.

## 공식 기술 참고

- [Next.js App Router](https://nextjs.org/docs/app)
- [Vercel Functions](https://vercel.com/docs/functions)
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
