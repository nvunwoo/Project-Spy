# 구현 준비 청사진

> 문서 상태: **ACTIVE**  
> 기술 기준 버전: **t0.1**  
> 게임 규칙 기준: **v0.5**  
> 구현 상태: **PREPARATION COMPLETE / CODE NOT STARTED**  
> 적용 범위: Next.js App Router, 서버 권위 규칙, Supabase 영속화·알림, 플레이어별 투영, 3D 표현과 테스트의 모듈 경계

이 문서는 실제 개발을 시작할 때 생성할 모듈과 의존 방향을 확정한 준비 계약이다. 아래 경로는 **목표 구조**이며 현재 코드, 폴더, 데이터베이스 스키마, 패키지, 계정 연동 또는 배포가 만들어졌다는 뜻이 아니다. 이 문서 작업에서는 프로젝트 생성, 패키지 설치, 코드 생성, Supabase/Vercel 변경, 커밋과 배포를 하지 않는다.

## 1. 확정 스택과 운영 형태

| 계층 | t0.1 선택 | 역할 |
|---|---|---|
| 언어 | TypeScript | 브라우저·서버·공유 계약의 정적 타입 |
| 웹 앱 | Next.js App Router + React | DOM 셸, 방/게임 라우트, Route Handlers |
| 웹 배포 | Vercel | Preview/Production 배포와 Next.js Functions 실행 |
| 데이터 | Supabase Postgres | 권위 있는 게임 상태, 명령, 이벤트와 버전 영속화 |
| 임시 사용자 | Supabase Anonymous Auth | 계정 가입 전 브라우저 세션 식별 |
| 변경 알림 | Supabase Realtime private Broadcast + polling fallback | 안전한 무효화 신호 후 플레이어별 상태 재조회 |
| 3D | React Three Fiber + Three.js | WebGL2 기본 도형 데모와 향후 GLB 표현 |
| 소스 관리 | GitHub | 브랜치·리뷰·Vercel Git 배포 기준 |

Next.js는 App Router를 기준으로 하며 [공식 App Router 문서](https://nextjs.org/docs/app)의 Server/Client Component 경계를 따른다. Supabase 연결의 기본 형태는 [공식 Next.js quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)를 참고하되, 정확한 패키지 버전은 개발 착수 시 잠금 파일로 고정한다.

### 1.1 검토했으나 t0.1에서 미채택한 대안

Vite 단독 SPA와 Colyseus 전용 룸 서버도 검토 대상이었다. 그러나 현재 게임은 1대1, 턴 기반, 저빈도 명령·상태 갱신이며 Next.js + Vercel + Supabase 한 운영면에서 인증, 권위 API, 영속화, Preview 배포를 관리하는 편이 초기 복잡도와 계정 수를 줄인다. 따라서 t0.1에는 별도 상시 연결 룸 서버를 두지 않는다.

2026-08-18 기준 Vercel Functions는 WebSocket을 Public Beta로 지원한다. 다만 연결은 해당 Function의 최대 실행 시간 동안 한 인스턴스에 고정되고, 이후 연결이 같은 인스턴스로 간다는 보장은 없으므로 권위 상태는 여전히 외부 저장소에 둬야 한다. 현재 게임은 직접 WebSocket 서버가 필요하지 않아 Supabase private Broadcast와 polling fallback을 선택한다. 근거는 [Vercel WebSocket 지원 안내](https://vercel.com/kb/guide/do-vercel-serverless-functions-support-websocket-connections), [Public Beta 변경 기록](https://vercel.com/changelog/websocket-support-is-now-in-public-beta), [Vercel Functions 실행 한도](https://vercel.com/docs/functions/limitations)이다.

향후 프레임 단위 동기화, 물리 권위 시뮬레이션, 높은 tick rate 또는 장시간 유지되는 전용 룸 프로세스가 실제 요구가 되면 Vercel WebSocket의 안정성·비용과 Colyseus 같은 별도 서버를 다시 비교한다. 현재 Route Handler를 상시 메모리 상태를 가진 룸 서버로 사용하지 않는다.

## 2. 목표 모듈 구조

다음은 구현 착수 시 만들 **논리 경계와 예상 경로**이다. 파일명은 책임을 보여 주기 위한 t0.1 기준이며, 지금 이 문서 수정으로 생성하지 않는다.

```text
src/
  app/
    page.tsx
    game/[roomId]/page.tsx
    api/rooms/route.ts
    api/rooms/[roomId]/route.ts
    api/rooms/[roomId]/join/route.ts
    api/rooms/[roomId]/invites/rotate/route.ts
    api/rooms/[roomId]/orders/general/lock/route.ts
    api/rooms/[roomId]/orders/mole/lock/route.ts
    api/rooms/[roomId]/advance/route.ts
    api/rooms/[roomId]/events/route.ts

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

  shared/
    contracts/
      requests/
      responses/
      realtime/
      versions/

tests/
  unit/
  contract/
  integration/
  security/
  e2e/
  performance/

public/
  models/
  textures/
  audio/
```

`public/models` 등 에셋 폴더도 목표 위치일 뿐 아직 만들지 않는다. 정확한 외부 API payload와 데이터 스키마의 정본은 [DATA_AND_API.md](./DATA_AND_API.md), 3D 세부 계약은 [PRESENTATION.md](./PRESENTATION.md)이다.

## 3. App Router와 공개 진입점

### 3.1 페이지

- `/`: DOM 닉네임 입력, 방 생성과 초대 코드 참가 진입점이다. 닉네임은 표시 이름이며 인증과 분리한다.
- `/game/[roomId]`: 방과 플레이어 접근을 서버에서 확인한 뒤 게임 DOM 셸을 제공한다. R3F 장면은 client-only lazy boundary 안에서만 로드한다.
- 페이지와 layout은 기본적으로 Server Component로 유지하고, 브라우저 API·Pointer Events·R3F가 필요한 최소 경계만 `'use client'`로 만든다.
- Server Component에서 Client Component로 넘기는 초기 투영은 직렬화 가능한 공개 DTO만 허용한다. 내부 GameState, DB row, secret key와 함수는 props에 넣지 않는다.

공식 근거는 [Next.js Server/Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)와 [지연 로딩](https://nextjs.org/docs/app/guides/lazy-loading)이다.

### 3.2 Route Handlers

| 목표 경로 | 메서드·책임 |
|---|---|
| `/api/rooms` | `POST`: 인증된 익명 사용자로 방 생성, RED/BLUE 슬롯과 초대 식별자 준비 |
| `/api/rooms/[roomId]` | `GET`: 상태를 변경하지 않고 현재 사용자의 player projection과 `revision` 반환 |
| `/api/rooms/[roomId]/join` | `POST`: 초대 검증, 빈 슬롯 참가, 닉네임 검증·저장 |
| `/api/rooms/[roomId]/invites/rotate` | `POST`: 사용 전 초대 token을 폐기하고 새 token을 1회 반환 |
| `/api/rooms/[roomId]/orders/general/lock` | `POST`: 일반 명령 묶음을 검증하고 즉시 불변 잠금. 성공 뒤 수정·해제 API 없음 |
| `/api/rooms/[roomId]/orders/mole/lock` | `POST`: 배신자 명령 묶음을 별도 권한·공개 범위로 검증하고 즉시 불변 잠금 |
| `/api/rooms/[roomId]/advance` | `POST`: idempotent `tryAdvance` 호출. 클라이언트가 결과나 시간을 결정하지 않음 |
| `/api/rooms/[roomId]/events?afterCursor=<cursor>` | `GET`: 현재 사용자에게 투영된 사건만 cursor 이후로 반환 |

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
- `use-cases`: create/join/getPlayerState/submitGeneralOrders/submitMoleOrder/tryAdvance 조정
- `transactions`: 현재 revision 잠금, 중복 요청 확인, resolver 한 번 실행, 상태·사건·다음 deadline 원자 저장
- `clock`: 서버 현재 시각을 읽고 명시적 값으로 resolver에 전달

닉네임, `roomId`, 클라이언트가 보낸 team, phase, 잔액, 성공률과 경로를 신뢰하지 않는다. 모든 명령은 서버가 현재 권한·phase·대상·비용·버전과 대조한다.

`tryAdvance`는 같은 방·phase·revision에 여러 번 호출되어도 한 번만 결과를 확정하는 idempotent 연산이다. server-only pooled PostgreSQL transaction이 `games`와 현재 `turns` row를 정해진 순서로 잠그고 현재 revision을 조건부 갱신하며, 경합에서 진 요청은 이미 생성된 최신 상태를 다시 읽는다. Supabase Data API 호출 여러 개를 canonical mutation의 transaction처럼 묶거나 애플리케이션 메모리 lock만으로 동시성을 제어하지 않는다.

## 6. 플레이어별 projection

canonical GameState 전체를 직렬화한 뒤 브라우저에서 필드를 숨기는 방식을 금지한다. `src/projection`은 권위 상태를 RED/BLUE 각각의 최소 공개 DTO로 바꾼다.

- 자기 요원 유형·명령, 자기 배신자 제어 정보, 허용된 조사·도청·목표 정보만 해당 플레이어 projection에 포함한다.
- 상대 유형, 상대의 비공개 명령, 숨은 목표, 비공개 이동 경로, RNG seed와 내부 판정 원인은 응답과 Realtime payload에 넣지 않는다.
- turn event도 수신자별 문구와 필드를 별도로 투영한다. 하나의 상세 사건을 모든 클라이언트에 보내고 UI에서 가리지 않는다.
- 각 응답에는 contract version과 단조 증가하는 `revision`을 포함해 오래된 응답·연출을 폐기할 수 있게 한다.

Projection 누출 검사는 독립적인 security test로 유지한다.

## 7. Supabase 영속화와 보안 경계

### 7.1 키와 클라이언트 분리

- 브라우저에는 `NEXT_PUBLIC_SUPABASE_URL`과 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`만 제공한다.
- `SUPABASE_SECRET_KEY`는 Vercel server environment에만 두며 client bundle, 로그, Preview 댓글과 저장소에 넣지 않는다.
- canonical mutation용 pooled `DATABASE_URL`과 DB password도 server-only이며 브라우저 Supabase client에 전달하지 않는다.
- 구형 `anon`/`service_role` JWT 키를 새 프로젝트의 기준 이름으로 사용하지 않는다. 현재 키 체계는 [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys)를 따른다.
- publishable key는 비밀이 아니지만 사용자 권한을 부여하지 않는다. 실제 권한은 Supabase Auth JWT, 방 membership, 서버 검증과 RLS가 결정한다.
- secret key는 높은 권한과 RLS 우회 특성이 있으므로 일반 사용자 요청의 권한 증명으로 사용하지 않는다. 필요한 내부 트랜잭션은 서버가 사용자·방·phase 권한을 먼저 검증한 뒤 최소 표면으로 호출한다.

브라우저용 Supabase client와 서버용 client를 다른 모듈로 분리하고 서버 client는 요청별 쿠키/세션 범위를 지킨다. SSR 인증 패턴은 [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side)를 기준으로 하되, 해당 helper의 안정성·최신 API와 정확한 버전은 scaffold 당일 다시 확인해 lockfile에 고정한다.

### 7.2 데이터 노출과 RLS

- canonical state, 양측 원본 명령, RNG seed와 내부 사건은 브라우저가 직접 select할 수 없는 private schema에 둔다.
- Data API에 노출할 객체는 최소화하고, 노출 객체에는 RLS와 명시적 grant를 함께 적용한다.
- 2026년의 새 프로젝트/테이블은 Data API 권한이 자동 부여된다고 가정하지 않는다. migration에 필요한 grant와 revoke를 명시한다.
- 브라우저 직접 읽기가 필요한 공개 객체가 생겨도 membership 기반 row policy와 필드 최소화를 적용한다.
- secret key를 사용하는 서버 경로에도 방 membership·명령 소유권·phase 검증을 반복한다.

근거 문서는 [Supabase Data API 보안](https://supabase.com/docs/guides/api/securing-your-api)과 [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)이다.

### 7.3 익명 인증

닉네임 제출 전 또는 방 생성/참가 시 Supabase anonymous sign-in으로 사용자 세션을 만든다. 익명 사용자는 DB의 `authenticated` 역할을 사용하므로 policy에서 `is_anonymous` claim과 room membership을 함께 구분한다. 브라우저 저장소를 지우거나 다른 장치로 옮긴 익명 세션은 같은 플레이어로 자동 복구된다고 약속하지 않는다.

공개 출시 전에는 CAPTCHA/rate limit, 오래된 익명 계정 정리, 초대 코드 추측 방지와 재접속/계정 승격 정책을 별도 보안 게이트로 완료한다. 공식 동작과 주의점은 [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)를 따른다.

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
- transaction commit 이후 서버가 `state_changed` Broadcast 신호를 시도한다. 알림 유실·중복·순서 변경은 가능하다고 보고 `revision`으로 중복을 제거한다.
- Broadcast 실패 또는 연결 해제 중에도 foreground 3초 safety polling, 탭 복귀, 포커스 복귀와 명령 응답 후 재조회로 결국 최신 상태에 도달한다. 오류 재시도는 jitter를 둔 exponential backoff로 최대 15초까지 늦춘다.
- Presence는 초기 MVP에서 사용하지 않는다. 접속 여부, 플레이어 생존, 방 슬롯, 타이머와 턴 진행도 Presence로 추론하지 않는다.
- 내부 테이블의 `Postgres Changes`를 브라우저가 직접 구독해 숨은 row를 받는 구조는 사용하지 않는다.
- client가 Broadcast를 보낼 수 있는 `realtime.messages` INSERT policy를 만들지 않는다.

Supabase는 확장성과 보안 측면에서 Broadcast 방식을 권장한다. [Realtime 개요](https://supabase.com/docs/guides/realtime), [Broadcast](https://supabase.com/docs/guides/realtime/broadcast), [데이터베이스 변경 구독 비교](https://supabase.com/docs/guides/realtime/subscribing-to-database-changes)를 기준으로 한다.

## 9. 3D 표현 계층

`src/presentation-3d`는 player projection을 그릴 뿐 도메인과 DB에 직접 접근하지 않는다.

- `canvas`: WebGL2 capability check와 client-only R3F Canvas 수명주기
- `scene`: 16×16 도시, 건물, 요원, 조명과 카메라 구성
- `adapters`: 기본 도형과 향후 GLB 표현 교체
- `coordinates`: 논리 `{row,col}`와 월드 `X/Z`의 유일한 양방향 변환
- `input`: mouse/touch/pen/keyboard 입력을 논리 선택 의도로 정규화

서버가 승인한 공개 waypoint만 보간하며 물리, NavMesh, free WASD를 쓰지 않는다. 상세 계약과 성능 게이트는 [PRESENTATION.md](./PRESENTATION.md)를 따른다.

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

game client ----------> presentation-3d -------> shared public contracts
Realtime client ------> invalidation signal ---> room GET Route Handler
```

의존 규칙은 다음과 같다.

1. `domain`은 상위 계층을 import하지 않는다.
2. `server`는 domain port와 persistence port를 조정하지만 React/R3F를 import하지 않는다.
3. Supabase adapter는 persistence port를 구현하며 domain 내부 타입을 DB row에 직접 노출하지 않는다.
4. `projection`은 canonical 결과를 읽을 수 있지만 presentation이나 DB SDK에 의존하지 않는다.
5. `presentation-3d`는 shared public contracts만 읽고 server/persistence/private domain state를 import하지 않는다.
6. client bundle에서 `server`, `persistence/supabase/server-client`, private projection source가 참조되면 build/security test를 실패시킨다.

## 11. 테스트 구조와 착수 게이트

| 테스트 층 | 최소 범위 |
|---|---|
| Unit | 16×16 맵 manifest, 이동·점유·공항/항구 4칸, 모든 명령, 순서, 비용, seed 재현, 승리·무승부 |
| Contract | 요청/응답 파싱, contract version, `revision`, 잘못된 nickname/room/order 거절, 잠금 뒤 수정 API 부재 |
| Projection security | RED/BLUE별 golden DTO, 상대 유형·명령·목표·경로·seed 문자열 부재, event 수신자 차이 |
| Persistence | migration 재실행, transaction rollback, revision 경합, idempotency, deadline, 원자적 복수 충원 |
| RLS/Auth | anonymous 사용자 교차 방 읽기·쓰기 거절, 탈퇴/만료 세션 거절, private Realtime 구독 거절 |
| Integration | 두 클라이언트 동시 제출, 양측 잠금, timeout, 중복 advance, broadcast 유실 후 polling 복구 |
| E2E | 닉네임 → 방 생성 → 두 번째 브라우저 참가 → 한 턴 → 새로고침/재접속 → 결과 확인 |
| 3D/입력 | WebGL2 폴백, 단일 좌표 변환, waypoint, PC/태블릿 입력, GLB 폴백 |
| Performance | [PRESENTATION.md](./PRESENTATION.md)의 전체 맵·8요원 production build 기준 |
| Deployment | GitHub Preview build, environment 분리, Preview 두 클라이언트 smoke test, Production promotion |

정적 typecheck와 unit test만으로 1대1 멀티플레이 준비 완료를 선언하지 않는다. 최소 한 번은 서로 분리된 두 브라우저 context와 실제 태블릿에서 권한·동기화·입력·복구를 함께 검증한다.

## 12. GitHub·Vercel·환경변수 준비안

개발 착수 뒤 GitHub 브랜치 push가 Vercel Preview를 만들고, 검증된 기본 브랜치만 Production으로 승격하는 흐름을 사용한다. 공식 동작은 [Vercel Git 배포](https://vercel.com/docs/git)와 [배포 개요](https://vercel.com/docs/deployments/overview)를 따른다.

예정 환경변수는 다음과 같다. 실제 값은 아직 요청·저장하지 않는다.

| 이름 | 노출 범위 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + Server | Auth와 제한된 public client 초기화 |
| `NEXT_PUBLIC_APP_ENV` | Browser + Server | Local/Preview/Production 표시와 진단용 환경 구분 |
| `DATABASE_URL` | Server only | Supabase pooler를 통한 짧은 PostgreSQL transaction |
| `SUPABASE_SECRET_KEY` | Server only | 검증된 Auth 관리·Realtime 등 제한된 내부 작업 |
| `INVITE_TOKEN_PEPPER` | Server only | 원문을 저장하지 않는 invite token hash 강화 |

- Local/Preview/Production 값을 분리한다.
- `.env.local`과 Vercel 연결 메타데이터를 저장소에 커밋하지 않는다.
- secret은 문서, 채팅, 테스트 fixture, client-side 환경변수와 브라우저 로그에 복사하지 않는다.
- GitHub와 Vercel을 연결하기 전 저장소 소유자, Production branch, Preview 접근 정책과 배포 권한을 사용자가 확인한다.

## 13. 개발 착수 시 실행 순서

아래 단계는 준비된 순서이며 이 문서 작업에서 실행하지 않는다.

1. 사용자가 GitHub 저장소·Vercel 팀·Supabase 조직·리전·비용과 권한 경계를 승인한다. 이 확인만으로 외부 프로젝트를 생성하지 않는다.
2. 지원할 Node.js와 package manager 버전을 고정하고 Next.js TypeScript 프로젝트를 scaffold한다.
3. 정확한 패키지 버전을 검토해 lockfile에 고정한다.
4. shared contracts와 순수 domain resolver/test부터 만든다.
5. 별도 승인으로 Supabase 개발 프로젝트를 만든 뒤 migration, private schema, grant/RLS와 transaction 함수를 적용한다.
6. Route Handlers와 player projection을 연결하고 두 브라우저 통합 테스트를 통과한다.
7. 기본 도형 3D 장면과 입력을 연결하고 PC·실물 태블릿 성능 기준을 측정한다.
8. GitHub Preview 배포를 검증한 뒤에만 Production 연결을 허용한다.

## 14. 아직 생성하거나 실행하지 않은 항목

- Next.js 앱과 위 목표 폴더
- `package.json`, lockfile과 npm/pnpm 패키지 설치
- Supabase 프로젝트, 테이블, migration, Auth, RLS와 Realtime channel
- Vercel 프로젝트, 환경변수, 도메인과 GitHub 연동
- Box/Cylinder/Capsule/Sphere 데모 장면과 GLB 에셋
- 테스트 코드, CI workflow, 커밋, push와 배포

따라서 t0.1의 의미는 **기술 방향과 모듈 경계가 개발 가능한 수준으로 준비되었다**는 것이며, 실행 가능한 게임이나 배포가 존재한다는 의미가 아니다.
