# 데이터, 비밀 정보와 API 계약

> 문서 상태: **ACTIVE — t0.1 확정 데이터/API 계약**  
> 기술 준비 기준: t0.1  
> 게임 기획 기준: v0.5  
> 최종 갱신: 2026-08-18  
> 구현 상태: **PROJECT CONTAINER ONLY / GAMEPLAY SCHEMA AND API NOT CONFIGURED**

이 문서는 현행 v0.5 게임을 구현할 데이터 경계, API 의미, 트랜잭션과 플레이어별 정보 투영을 확정한다. 물리적인 SQL 이름과 migration은 구현 착수 때 이 계약에서 파생한다. 서버 구조는 [ARCHITECTURE.md](./ARCHITECTURE.md), 기술 준비와 외부 상태는 [TECHNICAL_READINESS.md](./TECHNICAL_READINESS.md)를 따른다.

아래 테이블과 경로는 계약 수준의 논리 이름이다. 서울의 빈 Supabase 프로젝트 컨테이너만 준비됐으며, 실제 게임 테이블, RLS, 함수, key와 Route Handler가 존재한다는 뜻이 아니다.

## 계약 용어

| 용어 | 의미 |
| --- | --- |
| canonical state | 양측 비밀을 모두 포함하는 서버 전용 권위 상태 |
| player projection | 특정 인증 사용자에게 허용된 값만 새 객체로 만든 응답 |
| revision | 게임 상태가 commit될 때 증가하는 단조 증가 정수 |
| phase | 일반 명령, 배신자 명령, 실행, 결과 등 서버가 저장한 단계 |
| locked submission | 확정 후 수정할 수 없는 플레이어의 단계별 명령 묶음 |
| TurnEvent | canonical 판정 결과의 안정된 순서 사건 |
| `state_changed` | 상태 내용이 아닌 새 revision 존재만 알리는 private Realtime event |
| idempotency key | 동일 mutation 재시도를 한 번의 작업으로 묶는 client 생성 식별자 |

## 데이터 원칙

1. canonical gameplay data는 browser에 직접 전달하지 않는다.
2. client는 gameplay table을 Supabase Data API로 직접 읽거나 쓰지 않는다.
3. 모든 gameplay mutation은 인증된 Next.js Route Handler를 통한다.
4. 각 mutation은 Postgres transaction, row lock, constraint와 idempotency로 보호한다.
5. server timestamp와 저장된 deadline이 단계 전환의 단일 기준이다.
6. game state와 TurnEvent는 특정 플레이어의 projection으로 변환한 뒤 응답한다.
7. Realtime은 `state_changed` 알림만 전송하고 HTTPS projection을 대체하지 않는다.
8. 게임 난수는 서버에서 생성·기록하고 재시도 시 같은 결과를 낸다.
9. 3D Transform, client timer와 client 계산 결과를 저장된 게임 판정으로 신뢰하지 않는다.
10. DB schema와 API는 현행 게임 문서의 규칙을 다시 독립적으로 정의하지 않고 해당 문서에 연결한다.

## 스키마와 Data API 노출

### `game_private` — 권장 private schema

다음 canonical gameplay table은 Data API에 노출하지 않는 private schema에 둔다.

- games
- game_invites
- game_players
- map_layouts
- turns
- order_submissions
- orders
- agents
- objectives
- team_economies
- persistent_effects
- turn_resolutions
- turn_events
- player_events
- random_draws
- idempotency_requests

확정 접근 계약:

- `anon`과 `authenticated`에 직접 SELECT·INSERT·UPDATE·DELETE를 grant하지 않는다.
- schema usage도 필요한 범위가 아니면 grant하지 않는다.
- canonical gameplay query와 mutation은 server-only DB role로 실행한다.
- server role은 필요한 schema·table·sequence·function 권한만 가진다.
- Supabase secret key 또는 legacy `service_role`은 client에 절대 노출하지 않는다.
- RLS 우회 권한을 가진 key를 일반적인 편의 query에 남용하지 않는다.
- private schema에도 권한과 가능한 RLS를 defense in depth로 적용한다.

### `public`과 다른 exposed schema

MVP의 기본 구조에서는 client가 직접 읽는 gameplay table을 두지 않는다. 향후 public profile이나 비게임 데이터가 필요해 exposed schema에 table을 만들면 다음을 모두 요구한다.

- RLS 활성화
- 명시적 `TO` role
- `auth.uid()`와 row ownership 조건
- UPDATE의 `USING`과 `WITH CHECK`
- 최소 column과 operation grant
- 보안 테스트

`TO authenticated`만으로 모든 익명 로그인 사용자를 허용하면 안 된다. Supabase Anonymous Auth 사용자도 `authenticated` Postgres role을 사용한다.

### `realtime.messages`

Supabase가 관리하는 `realtime` schema에 임의 table이나 function을 만들지 않는다. 허용된 방식으로 `realtime.messages`의 RLS policy만 관리해 private channel receive 권한을 제한한다.

`realtime.messages` policy가 private 참가자 table을 직접 읽기 위해 광범위한 table 권한을 요구하게 만들지 않는다. 구현 시 다음 둘 중 더 작은 권한 경계를 security review로 선택한다.

- 참가자에게 자기 membership만 보이는 최소 전용 authorization relation을 RLS로 제공
- private schema의 좁은 membership 검사 함수를 사용

두 번째 방식을 사용할 때 함수가 `SECURITY DEFINER`여야 한다면 private schema, 고정 `search_path`, 함수 내부 `auth.uid()` 검사, `PUBLIC` 실행 권한 회수, `authenticated`에 필요한 실행 권한만 부여하고 Supabase security advisor를 통과해야 한다. 이 함수는 state나 nickname을 반환하지 않고 topic 참가 가능 여부 boolean만 반환한다.

## 논리 데이터 모델

정확한 SQL type과 index는 migration 설계 때 확정하지만 다음 의미와 불변 조건은 t0.1 계약이다.

### games

| 필드 | 의미 |
| --- | --- |
| `id` | 내부 UUID game ID |
| `status` | waiting, active, finished 등 게임 수명 상태 |
| `phase` | 현재 서버 phase |
| `turn_number` | 현재 턴 번호 |
| `revision` | commit마다 증가하는 bigint |
| `rules_version` | 사용한 게임 규칙 버전, 최초 v0.5 |
| `map_layout_id` | 경기 동안 고정된 공개 map layout |
| `phase_deadline_at` | 현재 phase의 server timestamp deadline |
| `winner` / `outcome` | 승리·패배·무승부·진행 중 |
| `created_at`, `started_at`, `finished_at`, `updated_at` | server timestamps |

불변 조건:

- `revision`은 감소하지 않는다.
- phase와 deadline은 유효한 상태 전이로만 변경한다.
- finished game은 gameplay mutation으로 다시 active가 되지 않는다.
- 두 player slot이 확정되기 전에는 게임 초기화와 숨은 목표 배치를 완료 상태로 만들지 않는다.

### game_invites

| 필드 | 의미 |
| --- | --- |
| `game_id` | 대상 game |
| `token_hash` | 원문이 아닌 초대 token hash |
| `expires_at` | 선택된 만료 시각 |
| `used_at` | guest slot 결합 시각 |
| `used_by_user_id` | 결합된 `auth.uid()` |
| `created_at` | 생성 시각 |

불변 조건:

- 원문 token은 저장하지 않는다.
- token은 128-bit 이상의 암호학적 난수다.
- 한 token은 guest slot 하나에 한 번만 사용할 수 있다.
- hash 비교는 timing 차이를 최소화하는 안전한 방식으로 한다.
- 사용·만료·취소된 token은 다시 유효해지지 않는다.

### game_players

| 필드 | 의미 |
| --- | --- |
| `game_id` | 참가 game |
| `user_id` | 검증된 Supabase Auth `auth.uid()` |
| `seat` | player 1 / player 2 |
| `team` | RED / BLUE 배정 결과 |
| `nickname` | 표시할 정규화 nickname |
| `nickname_key` | 방 내 중복 검사용 정규화 비교 key |
| `joined_at` | 참가 server timestamp |
| `last_seen_at` | 연결 판정이 아닌 운영용 최근 authenticated sync |

필수 unique 조건:

- `(game_id, user_id)`
- `(game_id, seat)`
- `(game_id, nickname_key)`

닉네임과 seat·team은 경기 시작 뒤 변경할 수 없다. `last_seen_at`은 플레이어가 연결돼 있다는 권위 판정이나 시간 제한 중지 근거가 아니다.

### map_layouts

| 필드 | 의미 |
| --- | --- |
| `id` | layout 식별자 |
| `source_version` | MAP 원본과 parser·generator 버전 |
| `layout_seed` 또는 `candidate_id` | 검증된 A/B 배치 재현 정보 |
| `public_cells` | 16×16 도로·건물·공개 시설 배치 |
| `validation_version` | 연결성·거리·중복 검증 버전 |
| `created_at` | 생성 server timestamp |

상세 맵 수치와 좌표는 [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md)를 따른다.

- `row`, `column`은 각각 0~15 범위의 정수로 저장하거나 동등한 0~255 cell ID와 양방향 변환을 제공한다.
- 공개 시설 배치는 경기 초기화 때 한 번 확정하고 재접속으로 다시 생성하지 않는다.
- 숨겨진 목표와 배신자 정보는 `public_cells`에 포함하지 않는다.
- 공항과 항구의 각 네 cell은 하나의 facility ID를 공유하면서 cell 단위 경로를 유지한다.

### turns

| 필드 | 의미 |
| --- | --- |
| `game_id`, `turn_number` | turn 복합 식별자 |
| `phase`, `status` | turn 내부 상태 |
| `general_deadline_at` | 일반 명령 server deadline |
| `mole_deadline_at` | 배신자 명령 server deadline |
| `resolution_key` | 한 번만 실행되게 하는 내부 transition key |
| `resolved_at` | 판정 commit 시각 |

`(game_id, turn_number)`와 `resolution_key`는 유일해야 한다. 단일 `player_a_ready`, `player_b_ready` boolean으로 두 명령 단계를 표현하지 않는다.

### order_submissions와 orders

`order_submissions`는 플레이어의 단계별 확정 묶음이고 `orders`는 묶음 안의 요원별 명령이다.

`order_submissions` 최소 의미:

- game, turn, player, phase
- `status`: locked 또는 server_defaulted
- `locked_at`
- request payload hash
- validation/rules version

`orders` 최소 의미:

- submission ID
- agent ID
- action type
- 논리 path
- target cell·agent·facility·objective
- action별 정규화 payload

불변 조건:

- `(game_id, turn_number, player_id, phase)` submission은 하나다.
- lock 뒤 UPDATE와 DELETE를 허용하지 않는다.
- client draft는 기본적으로 client local state이며 canonical table에 저장하지 않는다.
- deadline 기본 명령도 명시적인 server-generated submission으로 기록한다.
- 일반 명령과 배신자 명령은 서로 다른 phase로 저장한다.

### agents

최소 의미:

- game ID와 안정된 agent ID
- 명목상 owner team과 K/H/F/D type
- `row`, `column`
- alive·can_act 상태
- mole controller와 비밀 상태
- 충원·재매수·심문 표식에 필요한 현행 상태

요원 규칙은 [GAMEPLAY_SYSTEMS.md](../game-design/GAMEPLAY_SYSTEMS.md), 명령은 [ORDERS_AND_ECONOMY.md](../game-design/ORDERS_AND_ECONOMY.md)를 따른다. mole controller와 상대에게 비공개인 type은 canonical table에만 존재하며 projection에서 제거한다.

### objectives

목표물 네 개를 각각 안정된 ID로 저장한다.

- objective type과 복제 번호
- 상태: hidden, carried, dropped, delivered 등
- current cell 또는 carrier agent
- owner·획득 이력 중 판정에 필요한 값
- 과학자의 현재 탈출지와 공개 권한
- 확보 상태와 시각

목표 배치·획득·드롭·운반·확보·승리 계약은 [WORLD_MISSIONS.md](../game-design/WORLD_MISSIONS.md)를 따른다.

### team_economies와 persistent_effects

- 팀별 현재 할당금·은행 잔액
- 이번 턴 비용과 확정된 차감
- 통신국·은행 효과와 지속 시간
- 충원·재매수 예약처럼 turn boundary에 적용할 효과

비용과 효과의 단일 기준은 [ORDERS_AND_ECONOMY.md](../game-design/ORDERS_AND_ECONOMY.md)와 [GAMEPLAY_SYSTEMS.md](../game-design/GAMEPLAY_SYSTEMS.md)다.

### turn_resolutions와 random_draws

`turn_resolutions`는 재현과 중복 실행 방지를 위한 private record다.

- game, turn, rules version
- canonical input snapshot hash
- server-generated random seed reference
- resolver version
- result hash
- 시작·완료 revision
- resolved_at

`random_draws`가 필요하면 draw namespace, sequence, 범위와 결과를 private로 기록한다. seed와 draw 결과는 경기 중 player projection에 포함하지 않는다.

### turn_events

최소 의미:

- game ID, turn number
- turn 안에서 유일하고 안정된 `sequence`
- canonical event type
- canonical private payload
- projection에 필요한 audience/visibility rule reference
- created revision

`visibility` 문자열 하나만 믿고 payload를 그대로 client에 내보내지 않는다. event type별 projection 함수가 허용된 player payload를 새로 생성한다.

### player_events

턴 판정 transaction 안에서 canonical event를 각 player의 allowlist projection으로 변환한 안전한 event stream이다.

- game ID와 player ID
- 해당 player stream 안에서만 연속적인 `player_sequence`
- 허용된 event type과 projection payload
- 원본 canonical event의 server-only reference
- created revision

`(game_id, player_id, player_sequence)`는 유일해야 한다. client cursor는 canonical sequence가 아니라 이 player별 sequence 또는 동등한 opaque cursor를 사용한다. 숨겨진 canonical event 때문에 sequence gap이 생겨서는 안 된다.

### idempotency_requests

최소 의미:

- game ID
- authenticated user ID
- operation
- idempotency key
- request payload hash
- status
- committed revision
- 안전한 response reference 또는 재생 가능한 result
- created_at, expires_at

필수 unique 조건은 `(game_id, user_id, operation, idempotency_key)`다.

## 닉네임 정규화와 검증

닉네임은 방 참가 전 서버에서 다음 순서로 처리한다.

1. 입력을 string으로 제한하고 합리적인 byte 상한을 먼저 검사한다.
2. Unicode NFC를 적용한다.
3. 양끝 공백을 제거한다.
4. 허용된 내부 U+0020 공백의 연속을 하나로 줄인다.
5. Unicode grapheme cluster를 계산한다.
6. 2~16 grapheme인지 검사한다.
7. 각 code point가 Unicode letter, number, U+0020, `_`, `-` 중 하나인지 검사한다.
8. 모든 control, line separator, paragraph separator, tab, newline와 zero-width control을 거부한다.
9. 서버의 결정적 정규화 비교 함수를 적용해 `nickname_key`를 만든다.
10. `(game_id, nickname_key)` unique constraint로 방 내 중복을 거부한다.

비교 key는 NFC·공백 정규화 뒤 Unicode 기본 case folding에 준하는 결정적 대소문자 비구분을 적용한다. client와 server가 다른 결과를 만들지 않도록 구현 함수와 test vector를 한곳에서 공유한다.

닉네임은 다음 용도로 사용하지 않는다.

- 인증
- player slot 권한
- invite 검증
- RLS ownership
- 영구 계정 복구
- 게임 판정 난수 seed

경기 시작 뒤 nickname mutation API를 제공하지 않는다.

## 인증과 권한

### 세션

- browser는 Supabase Anonymous Auth로 세션을 얻는다.
- Route Handler는 server-side Supabase Auth 검증을 통해 현재 사용자를 확인한다.
- 요청 body나 URL의 user ID를 신뢰하지 않는다.
- expired·invalid session은 `401 AUTH_REQUIRED`다.
- game에 참가하지 않은 유효 사용자는 `403 GAME_ACCESS_DENIED` 또는 존재 누출을 줄이는 `404`로 처리한다.

Anonymous Auth 사용자는 browser data를 삭제하거나 로그아웃하면 기존 identity를 자동 복구할 수 없다. 동일 browser session 재접속만 MVP 보장 범위다.

### CSRF와 origin

cookie 기반 인증을 사용하는 mutation은 same-origin 요청을 기본으로 하고 `Origin` 검증, SameSite cookie 설정과 content type 제한을 적용한다. CORS를 전체 origin에 개방하지 않는다.

### 남용 방지

방 생성, join, 익명 로그인과 잘못된 invite token 시도에는 사용자·IP 기반 rate limit와 지연을 적용할 준비를 한다. 정확한 한도와 CAPTCHA 도입은 배포 전 트래픽·플랜에 맞춰 확정한다.

## API 공통 계약

모든 경로는 `/api` 아래 Next.js Route Handler이며 Node.js runtime을 사용한다.

### 요청

- mutation은 JSON `POST`다.
- mutation은 `Idempotency-Key` header를 요구한다.
- client가 `userId`, team, seat, current phase와 success result를 권위 값으로 보내지 않는다.
- path의 `roomId`는 내부 game ID를 외부에 표현하는 조회 식별자일 뿐 접근 권한이 아니다.
- 모든 payload는 runtime schema validation을 통과해야 한다.

### 응답 envelope

성공 응답의 공통 형태:

```json
{
  "meta": {
    "requestId": "opaque-request-id",
    "gameId": "uuid",
    "revision": 12,
    "serverTime": "2026-08-18T00:00:00.000Z"
  },
  "data": {}
}
```

오류 응답의 공통 형태:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "사용자에게 공개 가능한 설명",
    "retryable": false,
    "requestId": "opaque-request-id"
  }
}
```

응답은 내부 SQL, stack, secret, invite token hash와 canonical private payload를 포함하지 않는다.

### cache

game state, event, room과 session 응답은 다음 원칙을 사용한다.

```text
Cache-Control: private, no-store
```

ETag나 conditional request를 도입하더라도 player와 revision에 종속돼야 하며 공유 CDN cache로 바꾸지 않는다.

## API 경로

### `POST /api/rooms`

목적: 방 생성과 host slot 결합

입력:

- nickname

서버 처리:

1. Anonymous Auth session 검증
2. nickname 정규화·검증
3. idempotency 확인
4. transaction 시작
5. game row lock 대상 생성
6. host `game_players` slot 생성
7. 128-bit 이상 guest invite token 생성
8. token hash 저장
9. revision과 response record commit

응답:

- game ID
- host의 seat·team이 아직 미정이면 그 상태
- 정규화 nickname
- guest invite URL과 원문 token을 최초 성공 응답에서만 안전하게 전달
- 현재 player projection

원문 token은 hash만 저장하므로 HTTP 성공 응답이 완전히 유실된 뒤 같은 idempotency 요청으로 원문을 복구하지 않는다. 재시도는 이미 만들어진 game을 반환하고 host에게 새 invite를 발급하도록 안내한다. 원문을 평문 DB·로그에 저장해서 멱등성을 해결하지 않는다.

### `POST /api/rooms/[roomId]/invites/rotate`

목적: host가 아직 사용되지 않은 guest invite를 취소하고 새 token을 발급

- host session과 game membership을 검증한다.
- game과 기존 invite를 잠근다.
- 이전 unused token을 취소한다.
- 새 128-bit 이상 token을 만들고 hash만 저장한다.
- 원문은 성공 응답에서 한 번만 반환한다.
- 이미 guest가 결합됐거나 game이 시작됐다면 거부한다.
- mutation은 idempotency key를 요구한다.

### `POST /api/rooms/[roomId]/join`

목적: 초대 token으로 guest slot 결합

입력:

- invite token 원문
- nickname

서버 처리:

1. session·nickname 검증
2. token hash 계산
3. idempotency 확인
4. game과 invite row lock
5. token 유효·미사용·미만료 확인
6. 동일 사용자 재접속 또는 빈 guest slot 확인
7. guest slot과 token 사용을 한 transaction으로 commit
8. 두 player가 모였으면 팀 배정과 game initialization을 원자적으로 수행

두 사용자가 동시에 같은 token으로 참가해도 한 사용자만 성공해야 한다.

### `GET /api/rooms/[roomId]`

목적: 현재 사용자에게 허용된 최신 state projection 조회

처리:

- session과 game membership 검증
- 상태를 변경하지 않는 read
- canonical state를 player projection으로 변환
- revision, serverTime, phase, 허용된 deadline 포함
- `private, no-store`

due phase를 이 GET에서 전진시키지 않는다.

### `POST /api/rooms/[roomId]/advance`

목적: due phase 전진 시도와 최신 projection을 한 번에 반환

처리:

- session·membership·idempotency 검증
- game과 current turn row lock
- server timestamp 기준으로 필요한 default lock·phase transition·resolve 수행
- 이미 최신이면 no-op
- commit 뒤 현재 player projection 반환

여러 client가 동시에 호출해도 한 전이만 commit된다.

### `POST /api/rooms/[roomId]/orders/general/lock`

목적: 현재 턴 일반 명령 묶음 확정

입력:

- turn number
- 명령 목록과 논리 path·target

처리:

- session·membership·phase·deadline 검증
- 모든 agent ownership, 생존, 경로, 수용량 후보, 비용과 action payload 검증
- game·turn·submission row lock
- immutable submission 생성
- 양측 잠금 상태면 다음 phase를 원자적으로 연다.

확정 성공 뒤 수정 API는 없다.

### `POST /api/rooms/[roomId]/orders/mole/lock`

목적: 현재 턴 배신자 명령 묶음 확정

입력과 처리 원칙은 일반 명령과 같지만 현재 사용자가 통제하는 상대 배신자와 [GAMEPLAY_SYSTEMS.md](../game-design/GAMEPLAY_SYSTEMS.md)의 허용 명령만 검증한다. 상대에게 이 submission의 존재와 payload를 노출하지 않는다.

양측 lock 또는 deadline 기본 명령이 완료되면 같은 transaction 또는 후속 `advance`가 단 한 번의 Resolve를 획득한다.

### `GET /api/rooms/[roomId]/events?afterCursor=<cursor>`

목적: 현재 사용자에게 허용된 결과 사건의 이어받기

- canonical event를 직접 반환하지 않는다.
- transaction에서 생성된 해당 player의 `player_events`만 반환한다.
- cursor는 player별 sequence 또는 이를 감싼 opaque 값이며 현재 revision을 함께 반환한다.
- 이미 소비한 player cursor 뒤의 사건만 반환한다.
- canonical sequence, 숨은 event 수와 다른 player의 cursor를 노출하지 않는다.

state 응답에 필요한 event batch를 포함하는 구현을 선택할 수 있지만 동일한 projection 계약을 따라야 한다.

## 상태 변경 transaction

Route Handler의 상태 변경은 다음 구조를 따른다.

```text
authenticate
  → validate request shape
  → begin Postgres transaction
  → lock game row FOR UPDATE
  → verify membership, phase, deadline, revision
  → check or create idempotency record
  → lock current turn and affected rows in fixed order
  → run domain validation / pure resolver
  → write canonical state and canonical events
  → increment revision
  → store idempotent result reference
  → commit
  → broadcast state_changed(gameId, revision)
  → return player projection
```

- 외부 HTTP, Realtime과 분석 서비스 호출은 transaction 안에서 기다리지 않는다.
- broadcast는 commit 뒤 best effort다.
- broadcast 실패를 이유로 committed state를 되돌리지 않는다.
- DB 오류는 전체 transaction을 rollback한다.
- commit 뒤 응답 실패는 idempotency 재시도로 복구한다.

## 동시성별 잠금 계약

| 상황 | 잠금·constraint |
| --- | --- |
| 두 guest의 동시 참가 | game + invite `FOR UPDATE`, unique game/seat, token single-use |
| 같은 nickname 동시 참가 | unique `(game_id, nickname_key)` |
| 같은 단계 중복 lock | game + turn + submission lock, unique phase submission |
| 두 사용자의 마지막 lock | game + turn lock 후 한 번만 phase 전환 |
| 두 `advance`의 동시 Resolve | turn `FOR UPDATE`, unique resolution key와 status compare |
| HTTP 재시도 | idempotency unique constraint와 payload hash |
| 복수 충원 | 한 resolution transaction에서 빈 8칸 snapshot과 중복 없는 배정 |
| 성공 이동 순서 | 한 resolution의 저장된 random stream으로 순차 처리 |

잠금 순서와 전체 책임은 [ARCHITECTURE.md](./ARCHITECTURE.md)를 따른다.

## 난수와 규칙 버전

- 경기 초기화와 턴 Resolve에 server-generated seed를 사용한다.
- 시설 배치, 목표 배치, 배신자, 성공률, 동률, 이동 순서와 충원 배정은 namespace가 구분된 deterministic stream을 사용한다.
- `rules_version`, resolver version과 input snapshot hash를 resolution에 기록한다.
- 동일 idempotent Resolve를 다시 계산해야 하면 동일 seed와 input으로 동일 결과가 나와야 한다.
- 게임 결과용 난수와 3D 시각 효과용 난수를 분리한다.

## player state projection

projection은 allowlist 기반의 별도 타입이다. canonical object를 JSON으로 직렬화한 뒤 금지 필드를 삭제하지 않는다.

공통으로 제공 가능한 범주:

- game ID, status, turn, phase, revision와 serverTime
- 사용자 자신의 seat, team과 nickname
- 상대 nickname과 허용된 공개 상태
- 공개 map layout과 시설 배치
- 허용된 자기 팀 상태·명령 잠금 상태·자금
- [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md)에 따라 볼 수 있는 적 위치·사건
- 공개된 목표물, 운반자와 결과
- 해당 사용자에게 허용된 deadline와 결과 알림

조건 없이 제공하면 안 되는 범주:

- 상대 K/H/F/D 유형
- 상대의 숨은 위치·이동·행동
- 상대 일반 명령과 배신자 명령
- 자기 팀 안의 상대 통제 배신자 정체
- 상대가 단독으로 아는 심문 결과
- 권한 없는 과학자 탈출지
- 숨겨진 목표 위치
- canonical random seed·draw와 전체 event payload

도청, 심문, 명단, 목표 운반과 드롭 같은 예외는 게임 문서의 조건을 projection test case로 작성한다.

## player event projection

각 canonical event type은 player별 mapper를 가져야 한다.

예:

- 자기 명령 성공·실패: 해당 사용자에게만 직접 결과
- 통제 중인 자기 배신자 사망: 통제 국장에게만 알림
- 성공 암살 피해: 피해 국장에게 제거 사실만, 공격자·방식 제거
- 실패 암살: 피해 국장 event 없음
- 숨은 적 이동: 탐지·목표·명단 등 공개 근거가 없으면 event 없음
- 공개 목표 드롭: 양측 event

event가 허용되지 않은 사용자에게 sequence gap을 설명하는 placeholder를 보내지 않는다. resolution transaction은 두 player에게 각각 연속적인 `player_sequence`를 부여해 숨은 canonical 사건 수를 cursor로 추론할 수 없게 한다.

## Private Realtime `state_changed`

Supabase Realtime Broadcast contract:

```json
{
  "event": "state_changed",
  "payload": {
    "gameId": "uuid",
    "revision": 12
  }
}
```

- topic은 `game:<gameId>`다.
- channel은 `private: true`다.
- Realtime public access를 비활성화한다.
- `realtime.messages` SELECT policy는 `auth.uid()`가 해당 game의 player일 때 receive를 허용한다.
- client용 INSERT policy를 만들지 않아 player가 broadcast할 수 없게 한다.
- Presence는 사용하지 않는다.
- `state_changed`에 state, order, event, nickname, target과 mole 정보를 넣지 않는다.
- revision보다 큰 알림을 받은 client만 state를 다시 가져온다.
- 중복·역순·유실을 정상 상황으로 보고 polling으로 보완한다.

Realtime 연결 authorization은 연결 시점에 cache될 수 있으므로 session JWT refresh와 재연결 때 membership을 다시 평가한다. 모든 HTTPS state 요청도 별도로 membership을 검증한다.

## fallback polling

- foreground 경기 기본 safety poll은 3초다.
- Realtime이 연결돼도 revision 복구를 위해 poll을 완전히 제거하지 않는다.
- 네트워크 오류는 jitter가 있는 exponential backoff로 최대 15초까지 늦춘다.
- 탭 focus, visibility 복귀와 online event에서 즉시 `/advance`한다.
- polling 응답은 projection과 `private, no-store`를 사용한다.
- client가 background에서 늦게 poll해도 server deadline 판정은 변하지 않는다.

간격은 플레이테스트와 비용 측정으로 조정할 수 있는 기술 설정이며 게임 규칙이 아니다.

## 오류 코드

최소 안정 코드:

| HTTP | code | 의미 |
| --- | --- | --- |
| 400 | `INVALID_REQUEST` | JSON 또는 field 형식 오류 |
| 400 | `INVALID_NICKNAME` | nickname 정규화·grapheme·문자 규칙 실패 |
| 401 | `AUTH_REQUIRED` | 유효한 익명 session 없음 |
| 403 | `GAME_ACCESS_DENIED` | 해당 game의 player가 아님 |
| 404 | `GAME_NOT_FOUND` | 공개 가능한 범위에서 game 없음 |
| 409 | `ROOM_FULL` | guest slot 없음 |
| 409 | `INVITE_ALREADY_USED` | token이 이미 사용됨 |
| 409 | `NICKNAME_CONFLICT` | 방 내 정규화 nickname 중복 |
| 409 | `PHASE_CONFLICT` | 현재 phase에서 허용되지 않은 mutation |
| 409 | `ALREADY_LOCKED` | submission이 이미 잠김 |
| 409 | `IDEMPOTENCY_CONFLICT` | 같은 key에 다른 payload |
| 410 | `INVITE_EXPIRED` | invite 만료 |
| 422 | `ORDER_INVALID` | 게임 규칙상 유효하지 않은 명령 |
| 429 | `RATE_LIMITED` | 요청 한도 초과 |
| 503 | `RETRYABLE_TRANSACTION` | 제한된 내부 retry 후 일시적 충돌 |

상대 비밀을 추론할 수 있는 상세 실패 이유는 player에게 반환하지 않는다.

## 데이터 보존과 정리 준비

정확한 기간은 실제 배포와 개인정보·비용 정책 확정 때 결정한다. 구현 전 다음 범주를 분리해야 한다.

- 진행 중 game과 재접속에 필요한 state
- 종료 game의 플레이테스트 분석용 비식별 결과
- 재현용 private resolution·random record
- 짧은 수명의 idempotency record
- 사용·만료된 invite hash
- Supabase anonymous users
- 운영 로그

Supabase Anonymous Auth 사용자는 자동 정리되지 않을 수 있으므로 운영 전 명시적인 만료·정리 작업과 안전한 game 참조 확인이 필요하다. 정리 작업은 실행 전 별도 문서·migration·검증을 요구한다.

## 구현 전 보안·무결성 검증 목록

- [ ] gameplay table이 Data API에 노출되지 않음
- [ ] `anon`·`authenticated`의 직접 gameplay table 권한 없음
- [ ] exposed table마다 RLS와 실제 ownership predicate 존재
- [ ] anonymous user가 `authenticated` role임을 반영한 policy test
- [ ] `user_metadata`·nickname이 authorization에 사용되지 않음
- [ ] service/secret/DB key가 client bundle과 `NEXT_PUBLIC_`에 없음
- [ ] 같은 invite를 두 사용자가 동시에 쓸 때 한 명만 성공
- [ ] 128-bit 이상 invite token 원문이 DB·로그에 없음
- [ ] nickname grapheme·허용 문자·정규화 중복 test
- [ ] lock 뒤 order 수정 불가
- [ ] 두 Resolve 동시 요청에서 resolution 하나만 존재
- [ ] idempotency same-payload replay와 different-payload conflict test
- [ ] transaction rollback 뒤 partial state가 없음
- [ ] server deadline이 client clock 변경과 무관함
- [ ] player projection에 상대 비밀 field가 key 형태로도 없음
- [ ] canonical event가 client API에 직접 노출되지 않음
- [ ] private Realtime topic의 비참가자 subscribe 거부
- [ ] client Realtime send 거부
- [ ] Realtime 알림 유실 뒤 polling으로 revision 복구
- [ ] game 응답에 `private, no-store`

## DEPRECATED — v0.1 데이터/API 초안

t0.1 이전 문서에는 다음 구형 예시가 있었다.

- `games`, `agents`, `orders`, `turns`, `events` 다섯 table의 최소 필드 목록
- 좌표 대신 의미가 정의되지 않은 `location_id`
- `player_a_ready`, `player_b_ready`의 단일 ready 단계
- `POST /api/game/ready`와 client가 호출하는 `POST /api/game/resolve-turn`
- nickname, invite token, idempotency, revision, server deadline와 transaction 경계가 없는 구조
- canonical event의 단일 `visibility` 값

이 예시는 구현된 schema가 아니었고 t0.1 계약으로 대체됐다.

| 구형 항목 | t0.1 대체 |
| --- | --- |
| `location_id` | 검증된 16×16 `row`, `column`과 map layout |
| 단일 ready | 일반·배신자 phase별 immutable submission |
| client `resolve-turn` | authenticated `advance`와 서버 내부 단일 Resolve 전환 |
| 한 event payload + visibility | canonical event와 player별 allowlist projection |
| 직접 table 접근 가능성 미정 | private schema, direct deny와 Route Handler 전용 접근 |
| 중복 Resolve 구현 TBD | transaction, `FOR UPDATE`, unique resolution key와 idempotency |
| Polling만 초기 선택 | private `state_changed` 알림 + 3초 safety polling |
| 닉네임 TBD | NFC·trim·2~16 grapheme·허용 문자·방 내 중복 금지 계약 |

과거의 “비밀 정보는 화면에서만 숨기지 않는다”와 “중요 판정은 서버에서 수행한다”는 원칙은 폐기하지 않고 t0.1에서 더 강한 데이터·권한 계약으로 구체화했다.

## 공식 기술 참고

- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Vercel Functions](https://vercel.com/docs/functions)
