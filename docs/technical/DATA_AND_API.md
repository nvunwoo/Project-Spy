> **보관 안내 (2026-09-25):** 추가 개발 예정이 없습니다. 이 문서의 이전 단계·서비스·후속 작업 표현은 작성 당시의 설계 기록입니다. 실제 구현·배포 상태는 [현재 상태](../CURRENT_STAGE.md)를 확인하세요.

# 데이터, 비밀 정보와 API 계약

> 문서 상태: **ACTIVE — APPROVED t0.2 CONTRACT**
> 기술 준비 기준: t0.2
> 게임 기획 기준: v0.6<br>
> 최종 갱신: 2026-08-22<br>
> 구현 상태: **CONTRACT APPROVED / SUPABASE AND SERVER API IMPLEMENTATION DEFERRED**

이 문서는 현행 v0.6 게임을 구현할 데이터 경계, API 의미, 트랜잭션과 플레이어별 정보 투영을 확정한다. 사용자는 t0.2 계약을 승인했지만 현재 Phase 0B는 fixture UI와 순수 규칙까지이며, 물리적인 SQL 이름·migration·Route Handler·Supabase SDK/CLI는 후속 backend 승인 때 이 계약에서 파생한다. 서버 구조는 [ARCHITECTURE.md](./ARCHITECTURE.md), 화면 입력 상태와 저장 피드백은 [UI_UX_CONTRACT.md](./UI_UX_CONTRACT.md), 기술 준비와 외부 상태는 [TECHNICAL_READINESS.md](./TECHNICAL_READINESS.md)를 따른다.

아래 테이블과 경로는 계약 수준의 논리 이름이다. 서울의 Production-reserved 빈 Supabase 프로젝트 컨테이너만 준비됐으며, 실제 게임 테이블·RLS·함수·Route Handler와 앱용 key 선택·회수·env 연결은 구성하지 않았다. 모든 Supabase SDK/CLI와 Local·Preview·Production 데이터 작업은 현재 보류한다. 플랫폼 자동 제공 endpoint·key의 존재 여부와 게임 앱 연결 완료는 구분한다.

## 계약 용어

| 용어              | 의미                                                                                                                                               |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| canonical state   | 양측 비밀을 모두 포함하는 서버 전용 권위 상태                                                                                                      |
| player projection | 특정 인증 사용자에게 허용된 값만 새 객체로 만든 응답                                                                                               |
| revision          | shared game state·phase·player-visible 결과가 commit될 때 증가하는 단조 증가 정수. private draft와 한쪽만의 secret lock은 별도 version을 사용한다. |
| phase             | 일반 명령, 배신자 명령, 실행, 결과 등 서버가 저장한 단계                                                                                           |
| setup attempt     | 양 국장의 요원 명단 위치를 비공개로 받은 뒤 충돌 여부를 함께 판정하는 경기 전 시도                                                                 |
| private draft     | 현재 사용자에게만 보이며 확정 전까지 바꿀 수 있는 요원별 완전한 일반 명령                                                                          |
| locked submission | 확정 후 수정할 수 없는 플레이어의 단계별 명령 묶음                                                                                                 |
| TurnEvent         | canonical 판정 결과의 안정된 순서 사건                                                                                                             |
| `state_changed`   | 상태 내용이 아닌 새 revision 존재만 알리는 private Realtime event                                                                                  |
| idempotency key   | 동일 mutation 재시도를 한 번의 작업으로 묶는 client 생성 식별자                                                                                    |

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
- user_active_game_claims
- map_layouts
- roster_placement_submissions
- turns
- general_order_drafts
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
- api_rate_limit_buckets

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

정확한 SQL type과 index는 migration 설계 때 확정하지만 다음 의미와 불변 조건은 t0.2 계약이다.

### games

| 필드                                                    | 의미                                                                   |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `id`                                                    | 내부 UUID game ID                                                      |
| `status`                                                | waiting, setup, active, finished, cancelled 게임 수명 상태             |
| `phase`                                                 | 현재 서버 phase                                                        |
| `turn_number`                                           | 현재 턴 번호                                                           |
| `revision`                                              | shared game state·phase·player-visible 결과 commit마다 증가하는 bigint |
| `rules_version`                                         | 사용한 게임 규칙 버전. 최초 기준은 v0.5, 현재 기준은 v0.6               |
| `map_layout_id`                                         | 경기 동안 고정된 공개 map layout                                       |
| `setup_attempt_number`                                  | 현재 요원 명단 배치 시도 번호                                          |
| `phase_deadline_at`                                     | 현재 phase의 server timestamp deadline                                 |
| `winner` / `outcome`                                    | 승리·패배·무승부·진행 중                                               |
| `created_at`, `started_at`, `finished_at`, `updated_at` | server timestamps                                                      |

불변 조건:

- `revision`은 감소하지 않는다.
- phase와 deadline은 유효한 상태 전이로만 변경한다.
- 두 번째 player가 결합되면 `status = setup`으로 전환하고, 서로 다른 명단 위치가 확정돼 첫 `GENERAL_ORDER_OPEN`을 열 때만 `status = active`, `started_at = server time`으로 전환한다.
- `ROSTER_PLACEMENT_OPEN`과 `ROSTER_PLACEMENT_RESOLVING`에서는 `phase_deadline_at`이 null이며 setup attempt가 증가해도 상대 선택은 공개하지 않는다.
- finished 또는 cancelled game은 gameplay mutation으로 다시 active가 되지 않는다.
- 두 player slot이 확정되기 전에는 게임 초기화와 숨은 목표 배치를 완료 상태로 만들지 않는다.
- `cancelled`는 host가 guest 참가 전 waiting 방을 취소하거나, 어느 player든 첫 `GENERAL_ORDER_OPEN` 전 setup을 취소한 경우에만 사용하며 hard delete와 같은 의미로 쓰지 않는다. cancelled·finished membership은 새 방 생성·참가를 막는 nonterminal membership으로 세지 않는다.

### game_invites

| 필드              | 의미                                            |
| ----------------- | ----------------------------------------------- |
| `game_id`         | 대상 game                                       |
| `token_hash`      | 원문이 아닌 초대 token hash                     |
| `generation`      | 같은 game 안에서 단조 증가하는 재발급 세대      |
| `status`          | active, used, revoked                           |
| `expires_at`      | `created_at + 60분`인 non-null server timestamp |
| `used_at`         | guest slot 결합 시각                            |
| `used_by_user_id` | 결합된 `auth.uid()`                             |
| `revoked_at`      | 재발급 또는 방 취소로 폐기된 시각               |
| `created_at`      | 생성 시각                                       |

불변 조건:

- 원문 token은 저장하지 않는다.
- `expired`는 저장 enum이 아니다. `status = active`이면서 `expires_at <= serverTime`이면 player projection에서만 파생하는 공개 상태다.
- token은 128-bit 이상의 암호학적 난수다.
- 각 generation은 server timestamp 기준 발급 뒤 60분 동안만 유효하다. rotate는 새 60분을 시작하고 이전 generation을 revoke한다.
- 한 token은 guest slot 하나에 한 번만 사용할 수 있다.
- hash 비교는 timing 차이를 최소화하는 안전한 방식으로 한다.
- 사용·만료·취소된 token은 다시 유효해지지 않는다.
- 한 game에는 `status = active`, `used_at IS NULL`, `revoked_at IS NULL`인 invite가 최대 하나만 존재하도록 partial unique constraint 또는 동등한 transaction invariant를 둔다. rotate는 기존 active invite를 먼저 revoke한 같은 transaction에서 다음 generation을 만든다.
- expiry는 invite만 unusable하게 만들며 waiting game·host membership·active-game claim을 자동 취소하지 않는다. host는 만료 뒤에도 같은 waiting room에서 rotate하거나 방을 취소할 수 있다.

### game_players

| 필드           | 의미                                            |
| -------------- | ----------------------------------------------- |
| `game_id`      | 참가 game                                       |
| `user_id`      | 검증된 Supabase Auth `auth.uid()`               |
| `seat`         | player 1 / player 2                             |
| `team`         | RED / BLUE 배정 결과                            |
| `nickname`     | 표시할 정규화 nickname                          |
| `nickname_key` | 방 내 중복 검사용 정규화 비교 key               |
| `joined_at`    | 참가 server timestamp                           |
| `last_seen_at` | 연결 판정이 아닌 운영용 최근 authenticated sync |

필수 unique 조건:

- `(game_id, user_id)`
- `(game_id, seat)`
- `(game_id, nickname_key)`

닉네임과 seat·team은 경기 시작 뒤 변경할 수 없다. 두 플레이어가 결합될 때 서버는 저장된 암호학적 난수 bit로 seat와 RED·BLUE의 대응을 50:50으로 정하고, 정확히 한 명씩 배정한다. host·guest 순서나 client 입력으로 team을 선택하지 않으며 재시도로 다시 추첨하지 않는다. `last_seen_at`은 플레이어가 연결돼 있다는 권위 판정이나 시간 제한 중지 근거가 아니다.

### user_active_game_claims

Data API에 노출하지 않는 private guard relation이다.

| 필드         | 의미                                  |
| ------------ | ------------------------------------- |
| `user_id`    | primary key인 검증된 `auth.uid()`     |
| `game_id`    | 현재 결합된 waiting·setup·active game |
| `claimed_at` | claim server timestamp                |

불변 조건:

- 하나의 `user_id`에는 행이 최대 하나만 존재한다.
- waiting·setup·active `game_players` membership마다 정확히 하나의 같은 game claim이 있고, cancelled·finished membership에는 claim이 없다.
- create·join은 claim과 player slot을 같은 transaction에서 만들며, 다른 nonterminal game을 가리키는 claim이 있으면 `PLAYER_ALREADY_IN_GAME`으로 거부한다.
- 같은 game을 가리키는 claim과 기존 membership은 재시도로 간주하고 기존 projection을 반환한다.
- cancel과 finish는 해당 game의 모든 claim을 user ID 오름차순으로 잠그고 terminal 상태 전환과 같은 transaction에서 해제한다. hard delete되는 것은 guard claim뿐이며 감사용 game·membership은 남는다.

### map_layouts

| 필드                              | 의미                             |
| --------------------------------- | -------------------------------- |
| `id`                              | layout 식별자                    |
| `source_version`                  | MAP 원본과 parser·generator 버전 |
| `layout_seed` 또는 `candidate_id` | 검증된 A/B 배치 재현 정보        |
| `public_cells`                    | 16×16 도로·건물·공개 시설 배치   |
| `validation_version`              | 연결성·거리·중복 검증 버전       |
| `created_at`                      | 생성 server timestamp            |

상세 맵 수치와 좌표는 [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md)를 따른다.

- `row`, `column`은 각각 0~~15 범위의 정수로 저장하거나 동등한 0~~255 cell ID와 양방향 변환을 제공한다.
- 공개 시설 배치는 경기 초기화 때 한 번 확정하고 재접속으로 다시 생성하지 않는다.
- 숨겨진 목표와 배신자 정보는 `public_cells`에 포함하지 않는다.
- 공항과 항구의 각 네 cell은 하나의 facility ID를 공유하면서 cell 단위 경로를 유지한다.

### roster_placement_submissions

[WORLD_MISSIONS.md](../game-design/WORLD_MISSIONS.md)의 자기 팀 요원 명단 은닉을 경기 전 private setup attempt로 저장한다.

최소 의미:

- game ID, setup attempt number, player ID와 team
- 선택한 hotel 또는 subway facility instance ID
- `status`: locked, invalidated_collision, invalidated_cancelled, finalized
- 현재 attempt·player 범위에서 단조 증가하는 `private_input_version`
- `locked_at`, `resolved_at`

불변 조건:

- `(game_id, attempt_number, player_id)`는 유일하며 한 attempt에서 국장당 선택 하나만 잠근다.
- `ROSTER_PLACEMENT_OPEN`에는 deadline이 없다. 잠긴 자기 선택은 현재 attempt 안에서 수정하지 않는다.
- 첫 한쪽 선택 lock은 공개 revision·Realtime 없이 본인에게만 성공을 반환한다. 두 선택이 모두 잠기면 서버가 한 transaction에서만 비교한다. 같은 facility면 두 row를 모두 `invalidated_collision`로 바꾸고 attempt를 증가시켜 다시 연다.
- 서로 다르면 두 명단 위치를 objective canonical state로 확정하고, 설계도·과학자 배치와 탈출지까지 초기화한 뒤 첫 일반 명령 단계를 연다.
- player projection은 본인의 현재 선택·잠금과 `collisionRetryRequired`만 보여준다. 상대 facility ID, 선택 순서와 잠금 시각은 항상 숨긴다.

`private_input_version`은 `(game, setup attempt 또는 turn, phase, player)` 범위의 owner-only 단조 증가 version이다. 한쪽의 비밀 lock처럼 shared `games.revision`이 그대로인 mutation을 해당 사용자가 식별하는 데 사용한다. 현재 범위와 version은 직접 mutation 응답과 본인 projection에만 포함하며 상대 projection·Realtime에는 넣지 않는다.

### turns

| 필드                     | 의미                                      |
| ------------------------ | ----------------------------------------- |
| `game_id`, `turn_number` | turn 복합 식별자                          |
| `phase`, `status`        | turn 내부 상태                            |
| `general_deadline_at`    | 일반 명령 server deadline                 |
| `mole_deadline_at`       | 배신자 명령 server deadline               |
| `resolution_key`         | 한 번만 실행되게 하는 내부 transition key |
| `resolved_at`            | 판정 commit 시각                          |

`(game_id, turn_number)`와 `resolution_key`는 유일해야 한다. 단일 `player_a_ready`, `player_b_ready` boolean으로 두 명령 단계를 표현하지 않는다.

### general_order_drafts

일반 명령 deadline에서 이미 입력한 완전한 명령을 보존하기 위한 server-side private mutable state다.

최소 의미:

- game, turn, player, agent
- complete action type, 논리 path와 action별 target payload
- `draft_version`, validation/rules version
- `saved_at`

불변 조건:

- `(game_id, turn_number, player_id, agent_id)`는 유일하다.
- path·action·필수 target이 모두 갖춰진 요원 명령만 저장한다. destination만 고르거나 target 선택 중인 반쪽 상태는 client local state에 남긴다.
- `GENERAL_ORDER_OPEN`이고 해당 player가 아직 lock하지 않았을 때만 본인이 갱신할 수 있다.
- 갱신은 예상 `draft_version`을 비교해 stale tab overwrite를 거부한다.
- agent 하나를 교체한 뒤의 **플레이어 전체 저장 draft 집합**에 누락 활동 요원의 암시적 `WAIT`를 합쳐, 총비용·숙청 횟수·해킹 제한·턴별/국장별 제한과 상호 배타 제약을 모두 만족할 때만 저장한다. 각 개별 row가 합법이어도 전체 집합이 불법이면 transaction 전체를 거부하고 이전 저장 집합을 유지한다.
- draft 저장은 공개 `games.revision`을 증가시키지 않고 `state_changed`를 broadcast하지 않는다. draft와 저장 시각은 해당 player에게만 반환한다.
- draft는 비용 차감이나 행동 확정이 아니지만 저장된 집합은 어느 시점에도 deadline snapshot 가능한 합법 상태여야 한다. immutable submission이 생긴 뒤에는 수정할 수 없다.

### order_submissions와 orders

`order_submissions`는 플레이어의 단계별 확정 묶음이고 `orders`는 묶음 안의 요원별 명령이다.

`order_submissions` 최소 의미:

- game, turn, player, phase
- `status`: locked 또는 server_defaulted
- 현재 turn·phase·player 범위에서 단조 증가하는 `private_input_version`
- server default 이유: deadline, no_active_agent, no_controllable_mole
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
- phase를 아직 전환하지 않는 첫 한쪽의 secret lock은 공개 game revision과 Realtime 없이 본인에게만 성공을 반환한다. 양측 lock 또는 deadline으로 shared phase가 전환될 때 revision을 증가시킨다.
- 수동 lock은 모든 활동 가능 요원을 포함한 최종 payload를 한 transaction에서 검증하고 immutable snapshot을 만든다. UI에서 아직 직접 편집하지 않은 요원도 명시적인 `WAIT`로 포함한다.
- 일반 명령 deadline은 이미 전체 집합 검증을 통과한 complete draft를 같은 transaction에서 그대로 snapshot하고, draft가 없는 활동 가능 요원만 `WAIT`로 채운 server-defaulted submission을 만든다. deadline에서 초안을 임의 우선순위로 버리거나 재정렬하지 않는다.
- deadline 기본 명령과 자동 `WAIT`의 출처도 감사 가능한 server-generated 값으로 기록한다.
- 일반 명령과 배신자 명령은 서로 다른 phase로 저장한다.
- `GENERAL_ORDER_OPEN` 진입 transaction은 활동 가능 요원이 0명인 player의 zero-order `server_defaulted(no_active_agent)` submission을 즉시 만든다. `MOLE_ORDER_OPEN` 진입은 조종할 살아 있는 배신자가 없는 player의 `server_defaulted(no_controllable_mole)` submission을 즉시 만든다. 둘 다 해당 owner scope의 `private_input_version`을 증가시킨다.
- phase 진입 시 양측 submission이 이미 완성되면 같은 transaction에서 다음 phase 진입 자동값까지 반복 적용한다. 최종 shared phase·deadline을 한 번 commit하고 shared revision·Realtime도 한 번만 증가시킨다.

### agents

최소 의미:

- game ID와 안정된 agent ID
- 명목상 owner team과 K/H/D type
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

- non-null scope key (`room:create` 또는 `game:<gameId>`)
- nullable game ID reference
- authenticated user ID
- operation
- idempotency key의 원문이 아닌 안정된 server-side hash
- request payload hash
- status (`pending`, `committed_success`, `committed_failure`, `rate_limited`, `expired`)
- committed revision
- 안전한 response reference 또는 재생 가능한 result
- created_at, committed_at, expires_at

필수 unique 조건은 `(scope_key, user_id, operation, idempotency_key_hash)`다. 방 생성 전에는 game ID가 없으므로 nullable `game_id`를 unique 범위로 사용하지 않는다. 경기 mutation은 `scope_key = game:<gameId>`, 방 생성은 `scope_key = room:create`를 사용한다.

일반 mutation의 같은 key·같은 payload는 같은 canonical resource와 안전한 response reference를 재생한다. `committed_success`·`committed_failure`가 commit된 시점부터 24시간을 replay 보장 기간으로 두며 `expires_at = committed_at + 24시간`으로 기록한다. 만료 뒤 같은 key는 새 mutation으로 재해석하지 않고 `410 IDEMPOTENCY_KEY_EXPIRED`를 반환한다. 최소 key-hash tombstone은 해당 anonymous user를 안전하게 정리할 때까지 남기며, nonterminal resource를 가리키는 record를 먼저 삭제하지 않는다. client는 만료 뒤 새 작업에 반드시 새 key를 사용한다. `rate_limited`는 domain result가 아닌 fixed-window guard이므로 이 24시간 규칙의 예외이며 window 종료 뒤 같은 key를 재claim한다.

단, raw invite token을 한 번만 반환하는 room create·invite rotate는 **resource mutation만 멱등**이다. 내부 safe-result marker는 `rotate_required`로 보존할 수 있지만 이는 `idempotency_requests.status`나 public wire field가 아니다. 같은 key 재시도의 public 응답은 동일 resource identity, `rawInviteTokenIncluded: false`, `inviteRecoveryAction: "rotate"`만 반환한다. 원문 token은 저장·재생하지 않으며 새 원문은 새 key의 rotate로만 만든다.

### api_rate_limit_buckets

Data API에 노출하지 않는 durable server-side request guard다. Vercel instance 메모리나 client clock에 의존하지 않는다.

- `bucket_key_hash`: 원문 식별자를 노출하지 않는 안정된 server-side bucket key의 hash
- operation, fixed-window start server timestamp, request count, updated_at
- `(operation, bucket_key_hash, window_start)` unique

t0.2 MVP 기본값은 server time의 10분 fixed window다.

| operation       | bucket                       |      한도 |
| --------------- | ---------------------------- | --------: |
| `room:create`   | authenticated user           |  5 / 10분 |
| `room:join`     | authenticated user + room ID | 10 / 10분 |
| `room:join`     | authenticated user 전체      | 30 / 10분 |
| `invite:rotate` | authenticated user + game ID |  5 / 10분 |

인증·request shape 검증은 transaction 앞에서 수행하며 이 단계의 실패는 이 application bucket에 세지 않는다. 그 뒤의 well-formed authenticated 요청은 아직 유효한 commit의 같은 key·같은 payload 정확한 replay만 새 사용량에서 제외하고, 정상 처리와 예상된 domain 4xx를 모두 센다. 같은 key에 다른 payload를 넣은 `IDEMPOTENCY_CONFLICT`와 만료 key의 `IDEMPOTENCY_KEY_EXPIRED`도 bucket을 갱신한다. 이 두 분기는 기존 성공 결과나 tombstone을 덮어쓰지 않고 bucket만 commit한 뒤 409·410을 반환한다.

여러 bucket이 필요한 join은 bucket key 오름차순으로 같은 transaction에서 원자 갱신한다. 하나라도 초과하면 canonical game write 없이 bucket 상태와 `rate_limited` request guard를 commit하고 `429 RATE_LIMITED`와 정수 초 단위 `Retry-After`를 반환한다. 같은 key·payload를 같은 window 안에 다시 보내면 저장된 429를 중복 차감 없이 재생한다. 해당 window가 끝나면 그 `rate_limited` guard만 원자적으로 다시 claim할 수 있어 같은 key로 실제 요청을 재시도할 수 있다. 정상·예상된 domain 4xx는 각각 `committed_success` 또는 안전한 `committed_failure` 결과를 bucket과 함께 commit한다. 예상하지 못한 DB·내부 오류와 최종 `503 RETRYABLE_TRANSACTION`은 transaction 전체를 rollback하므로 사용량도 commit되지 않는다.

raw token·token hash·IP 원문을 bucket key나 응답에 넣지 않는다. 끝난 fixed-window row는 `window_start + 10분 + 24시간`, 즉 window 종료 24시간 이후 정리할 수 있다. 공개 출시 전에는 provider/WAF의 IP 기반 보호와 CAPTCHA 필요성을 별도 검토한다.

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

방 생성·join·invite rotate에는 위 durable application rate limit를 적용한다. Supabase Anonymous Auth 자체의 provider quota는 Preview 연결 시 공식 현재값을 확인하고, 공개 출시 전에는 IP 기반 WAF·CAPTCHA와 오래된 anonymous account 정리를 별도 보안 게이트로 검증한다. invite token 상태를 추론하게 하는 응답 지연 차이·상세 code는 만들지 않는다.

## API 공통 계약

모든 경로는 `/api` 아래 Next.js Route Handler이며 Node.js runtime을 사용한다.

### 요청

- mutation은 JSON `POST`를 기본으로 한다. 현재 요원 draft처럼 식별된 private resource를 교체하는 경로는 JSON `PUT`를 사용한다.
- mutation은 `Idempotency-Key` header를 요구한다.
- client가 `userId`, team, seat, current phase와 success result를 권위 값으로 보내지 않는다.
- path의 `roomId`는 내부 game ID를 외부에 표현하는 조회 식별자일 뿐 접근 권한이 아니다.
- 모든 payload는 runtime schema validation을 통과해야 한다.

### 응답 envelope

성공 응답의 공통 형태:

```json
{
  "meta": {
    "contractVersion": "api.t0.2",
    "requestId": "opaque-request-id",
    "gameId": "uuid",
    "revision": 12,
    "privateInputScope": "turn:7:general",
    "privateInputVersion": 1,
    "serverTime": "2026-08-18T00:00:00.000Z"
  },
  "data": {}
}
```

오류 응답의 공통 형태:

```json
{
  "meta": {
    "contractVersion": "api.t0.2",
    "requestId": "opaque-request-id"
  },
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "사용자에게 공개 가능한 설명",
    "retryable": false
  }
}
```

`contractVersion`과 `requestId`는 모든 JSON 응답에 포함한다. `privateInputScope`와 `privateInputVersion`은 현재 사용자의 setup·일반·배신자 비밀 입력 문맥이 있는 owner 응답에서만 포함하고, 해당 문맥이 없으면 둘 다 생략한다. 클라이언트는 같은 scope 안에서 `(revision, privateInputVersion)`을 함께 비교하며 shared revision이 같다는 이유만으로 더 최신인 자기 lock 응답을 버리지 않는다.

응답은 내부 SQL, stack, secret, invite token hash와 canonical private payload를 포함하지 않는다.

### cache

game state, event, room과 session 응답은 다음 원칙을 사용한다.

```text
Cache-Control: private, no-store
```

ETag나 conditional request를 도입하더라도 player와 revision에 종속돼야 하며 공유 CDN cache로 바꾸지 않는다.

## API 경로

### `GET /api/rooms/recoverable`

목적: 현재 anonymous session이 이미 소유한 waiting·setup·active game을 안전하게 다시 찾기

- 인증된 `auth.uid()`의 `game_players` membership만 조회한다.
- game ID, 자기 seat·nickname, 안전한 status·phase, host 여부와 공개 가능한 상대 참가 상태만 반환한다.
- waiting host에게만 invite의 `active/expired` 상태와 `inviteExpiresAt`을 반환한다. raw token·hash와 이전 generation은 반환하지 않는다.
- invite 원문·hash, 상대 비밀, 내부 idempotency record는 반환하지 않는다.
- 방 생성 성공 응답과 로컬 idempotency key를 모두 잃은 host는 이 목록에서 waiting 방으로 복귀한 뒤 새 key로 invite rotate를 실행한다.
- MVP는 짧은 수동 방 코드를 만들지 않는다. 참가자는 초대 링크를 열거나 링크에서 전달된 원문 token을 붙여넣는다. `roomId`는 비밀이 아닌 opaque 조회 식별자다. 원문 token을 포함하는 자동 참가 URL은 **fragment만** 사용하고 query·path에는 넣지 않는다. client는 fragment를 memory에 한 번 포착한 즉시 `history.replaceState`로 주소에서 제거한 뒤 same-origin POST body로만 교환한다. token은 URL/query/path, `Referer`, analytics, error report, log와 persistent browser storage에 남기지 않는다.

### `POST /api/rooms`

목적: 방 생성과 host slot 결합

입력:

- nickname

서버 처리:

1. Anonymous Auth session 검증
2. nickname 정규화·검증
3. transaction 시작
4. non-null `scope_key = room:create`의 idempotency row를 `INSERT ... ON CONFLICT` 또는 동등한 방식으로 claim하고, 같은 key·payload가 이미 commit됐으면 안전한 resource 결과를 재생
5. 새 idempotency claim이면 `room:create` rate bucket을 갱신하고 초과 시 window-bound 429를 commit
6. domain savepoint 안에서 아직 공유되지 않은 game row를 만들고 `user_active_game_claims(user_id)`를 획득한다. 다른 nonterminal game claim과 충돌하면 domain savepoint까지만 rollback해 새 game을 없애고, outer transaction의 bucket과 안전한 `PLAYER_ALREADY_IN_GAME` failure는 commit
7. host `game_players` slot 생성
8. 128-bit 이상 guest invite token 생성
9. token hash 저장
10. game·active-game claim·slot·invite와 idempotency safe response reference를 같은 transaction에서 commit

응답:

- game ID
- host의 seat·team이 아직 미정이면 그 상태
- 정규화 nickname
- `rawInviteTokenIncluded: true`
- `rawInviteToken`: 최초 성공 응답에서만 포함하는 원문
- `inviteUrl`: 원문이 `#` 뒤 fragment에만 있는 복사 가능한 URL
- server-derived `inviteExpiresAt`
- 현재 player projection

원문 token은 hash만 저장하므로 HTTP 성공 응답이 완전히 유실된 뒤 같은 idempotency 요청으로 원문을 복구하지 않는다. 같은 key의 재시도는 이미 만들어진 game ID, `rawInviteTokenIncluded: false`, `inviteRecoveryAction: "rotate"`와 안전한 expiry 상태를 재생하고 UI가 **초대 링크 재발급**을 안내한다. 이 false 응답에는 `rawInviteToken`과 `inviteUrl` key 자체를 넣지 않는다. 로컬 key까지 잃었다면 `GET /api/rooms/recoverable`로 자기 waiting 방을 찾는다. host는 방에 복귀한 뒤 새 idempotency key로 rotate를 실행한다. 원문을 평문 DB·로그·persistent browser storage에 저장해서 멱등성을 해결하지 않는다. 최초 응답에서 받은 원문은 현재 페이지 memory에서만 복사할 수 있다. 새로고침·탭 복구 뒤에는 active/expired 상태와 expiry만 복구하며 `기존 링크 다시 표시 불가 · 새 링크 발급`을 안내한다.

### `POST /api/rooms/[roomId]/invites/rotate`

목적: host가 아직 사용되지 않은 guest invite를 취소하고 새 token을 발급

- transaction에서 idempotency row를 먼저 claim/replay하고 새 요청이면 `invite:rotate` bucket을 갱신한 뒤 game·invite를 잠근다. 초과 시 common 429 분기를 따른다.
- host session과 game membership을 검증한다.
- game과 기존 invite를 잠근다.
- 이전 unused token을 취소한다.
- 새 128-bit 이상 token을 만들고 hash만 저장한다.
- 새 generation의 `expires_at = server time + 60분`을 저장한다.
- 원문은 `rawInviteTokenIncluded: true`, `rawInviteToken`, fragment-only `inviteUrl`, `inviteExpiresAt`과 함께 성공 응답에서 한 번만 반환한다. 이 응답도 유실됐다면 같은 key는 `rawInviteTokenIncluded: false`, `inviteRecoveryAction: "rotate"`만 반환하고 `rawInviteToken`·`inviteUrl` key는 생략하며, 이전 원문을 복구하지 않은 채 새 idempotency key로 다시 rotate한다.
- 이미 guest가 결합됐거나 game이 시작됐다면 거부한다.
- mutation은 idempotency key를 요구한다.

### `POST /api/rooms/[roomId]/cancel`

목적: waiting host 또는 첫 일반 명령 전 setup player가 방을 감사 가능한 terminal 상태로 안전하게 취소

- session·membership을 검증하고 game·두 player의 active-game claim·player slots·존재하는 active invite를 고정 순서로 잠근다.
- `status = waiting`이면 guest slot이 비어 있는 host만, `status = setup`이고 첫 `GENERAL_ORDER_OPEN` 전이면 두 player 중 누구나 허용한다.
- 존재하는 active unused invite를 revoke하고 아직 finalized되지 않은 roster submission을 무효화한 뒤 game을 `cancelled`로 전환하며 shared revision을 증가시키고 두 사용자의 active-game claim을 같은 transaction에서 해제한다.
- idempotency key와 payload hash를 사용하고, 이미 같은 요청으로 취소된 경우 안전한 cancelled projection을 재생한다.
- row를 hard delete하지 않는다. `status = active`·finished game 또는 첫 `GENERAL_ORDER_OPEN` 이후에는 `ROOM_NOT_CANCELLABLE`을 반환한다.

`status = active`인 진행 중 화면의 `나가기`는 브라우저의 로컬 화면 이탈일 뿐 player slot·game을 삭제하거나 기권시키지 않는다. MVP에는 active-game 탈퇴·기권 API가 없으며 같은 anonymous session은 recoverable 목록 또는 직접 URL로 재접속할 수 있다. waiting/setup game이 cancelled 또는 finished가 되면 그 membership은 새 방 생성·참가를 막지 않는다.

### `POST /api/rooms/[roomId]/join`

목적: 초대 token으로 guest slot 결합

입력:

- invite token 원문
- nickname

서버 처리:

1. session·nickname 검증
2. token hash 계산
3. transaction 안에서 idempotency row를 claim/replay
4. 새 요청이면 user+room과 user-global `room:join` bucket을 key 순으로 갱신하고 초과 시 common 429 분기를 commit
5. domain savepoint를 연 뒤 game row를 잠그고 같은 game의 기존 membership을 먼저 확인한다. 이미 member면 token의 used 상태와 관계없이 저장된 nickname·seat·team과 현재 projection을 안전하게 반환하고 canonical row를 다시 쓰지 않음
6. 비회원이면 `user_active_game_claims(user_id)`를 획득한다. 다른 nonterminal game claim이면 domain savepoint를 rollback하고 outer guard에 안전한 `PLAYER_ALREADY_IN_GAME` failure를 commit
7. invite row lock 뒤 token 유효·미사용·미만료와 빈 guest slot 확인
8. guest slot·active-game claim·token 사용을 한 transaction으로 commit
9. 두 player가 모였으면 game을 `setup`으로 바꾸고 저장된 server random bit로 RED·BLUE를 정확히 한 명씩 50:50 배정하며 공개 map initialization을 원자적으로 수행

두 사용자가 동시에 같은 token으로 참가해도 한 사용자만 성공해야 한다.

### `POST /api/rooms/[roomId]/setup/roster-placement/lock`

목적: 현재 setup attempt에서 자기 팀 요원 명단의 은닉 시설 확정

입력:

- setup attempt number
- 공개된 hotel·subway 중 하나의 facility instance ID

처리:

- session·membership·team·phase와 candidate facility를 검증한다.
- game, current setup attempt, 양 player submission을 고정 순서로 잠근다.
- 현재 player의 선택을 immutable하게 잠근다.
- 한쪽만 잠겼으면 자기 `privateInputScope`, 증가한 `privateInputVersion`, `locked`와 coarse 대기 상태를 본인에게만 반환한다.
- 한쪽만 잠긴 commit은 공개 game revision을 증가시키거나 Realtime을 보내지 않는다.
- 양측이 잠겼고 같은 facility면 두 선택을 모두 무효화하고 attempt를 증가시켜 `ROSTER_PLACEMENT_OPEN`을 다시 연다.
- 양측이 잠겼고 서로 다르면 두 명단과 나머지 목표 초기화를 한 transaction에서 확정하고 첫 `GENERAL_ORDER_OPEN`을 연다.

충돌 응답은 `collisionRetryRequired: true`만 제공하며 상대 facility ID·잠금 시각·먼저 선택한 player를 포함하지 않는다.

### `GET /api/rooms/[roomId]`

목적: 현재 사용자에게 허용된 최신 state projection 조회

처리:

- session과 game membership 검증
- 상태를 변경하지 않는 read
- canonical state를 player projection으로 변환
- contractVersion, revision, serverTime, phase, 허용된 deadline과 현재 owner-only private input scope/version 포함
- `private, no-store`

due phase를 이 GET에서 전진시키지 않는다.

### `POST /api/rooms/[roomId]/advance`

목적: due phase 전진 시도와 최신 projection을 한 번에 반환

처리:

- session·membership·idempotency 검증
- game row를 잠근 뒤 양 player의 `user_active_game_claims`를 user ID 오름차순으로 잠그고 membership·claim 불변 조건을 재검증한 다음 current turn row lock
- server timestamp 기준으로 필요한 default lock·phase transition·resolve 수행
- `GENERAL_ORDER_OPEN`에서 0 active agent, `MOLE_ORDER_OPEN`에서 no controllable mole인 player의 즉시 server-default submission을 생성하고 양측 완료면 다음 phase까지 원자적으로 연쇄 전환
- 일반 명령 deadline이면 각 player의 전체 집합 검증을 통과한 마지막 complete draft를 그대로 snapshot하고 draft가 없는 활동 가능 요원만 `WAIT`로 채워 잠금
- resolve 결과가 `finished`이면 두 active-game claim을 game terminal 상태·승리 결과와 같은 transaction에서 해제
- 이미 최신이면 no-op
- commit 뒤 현재 player projection 반환

여러 client가 동시에 호출해도 한 전이만 commit된다.

### `PUT /api/rooms/[roomId]/orders/general/draft`

목적: 현재 player의 한 요원에 대한 complete 일반 명령을 private draft로 저장·교체

입력:

- turn number, agent ID
- complete 논리 path, action type과 필요한 target
- expected draft version (`0`은 최초 생성)

처리:

- session·membership·`GENERAL_ORDER_OPEN`·deadline과 아직 잠기지 않은 상태를 검증한다.
- agent ownership·생존, 공개 topology 기준 path 구조, action 조합과 현재 공개 정보로 검증 가능한 target을 검증한다.
- game, turn, player, 모든 활동 가능 agent와 해당 player의 모든 draft row를 agent ID 오름차순으로 잠그고 대상 agent의 expected version을 비교한다.
- 대상 row를 제안값으로 치환한 결과에 누락 활동 요원의 `WAIT`를 더한 전체 묶음으로 총비용·턴별 숙청/해킹 제한·국장별 제한과 상호 배타 제약을 검증한다. 불법이면 아무 draft도 변경하지 않는다.
- 응답은 본인의 `draftVersion`, `savedAt`, 정규화된 own draft만 포함한다.
- 공개 game revision을 증가시키거나 Realtime을 보내지 않는다.

숨은 상대 점유나 숨은 목표를 이유로 destination affordance 또는 오류 상세를 달리하지 않는다. 그러한 실행 시점 조건은 게임 규칙대로 Resolve에서 판정한다.

### `POST /api/rooms/[roomId]/orders/general/lock`

목적: 현재 턴 일반 명령 묶음 확정

입력:

- turn number
- 모든 활동 가능 요원을 포함한 최종 명령 목록과 논리 path·target
- agent ID별 마지막 `expectedDraftVersions` map

처리:

- session·membership·phase·deadline 검증
- 모든 agent ownership, 생존, 공개 topology 기준 경로·도착지 형태, 비용과 action payload를 검증한다. 숨은 점유에 따른 실제 수용량은 이 단계에서 후보 제거·오류 사유로 사용하지 않는다.
- game·turn·player draft·submission row를 고정 순서로 잠그고 draft version 재검증
- immutable submission을 만들고 현재 turn·general·player 범위의 `private_input_version`을 증가시킨다.
- 양측 잠금 상태면 다음 phase를 원자적으로 연다.

확정 성공 뒤 수정 API는 없다. 한쪽만 잠긴 commit은 공개 game revision을 증가시키거나 Realtime을 보내지 않고 자기 `privateInputScope`·`privateInputVersion`만 반환한다. lock 전까지 상대의 locked boolean·draft 수·잠금 시각을 반환하지 않는다. 자기 lock 뒤에는 명령을 바꿀 수 없는 coarse `waitingForOpponent` 상태만 허용한다.

### `POST /api/rooms/[roomId]/orders/mole/lock`

목적: 현재 턴 배신자 명령 묶음 확정

입력과 처리 원칙은 일반 명령과 같지만 현재 사용자가 통제하는 상대 배신자와 [GAMEPLAY_SYSTEMS.md](../game-design/GAMEPLAY_SYSTEMS.md)의 허용 명령만 검증한다. lock 성공은 현재 turn·mole·player 범위의 `private_input_version`을 증가시켜 본인에게 반환하고, 상대에게 이 submission의 존재와 payload를 노출하지 않는다.

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
  → claim or replay request-scoped idempotency row
  → update required durable rate-limit buckets by bucket key
  → on exceeded bucket: commit rate_limited guard + bucket state, return 429
  → open domain savepoint
  → lock game row FOR UPDATE
  → lock required user_active_game_claim rows by user ID
  → verify membership, claim, phase, deadline, revision
  → lock current turn and remaining affected rows in fixed order
  → run domain validation / pure resolver
  → on expected domain 4xx: rollback domain savepoint, commit safe failure + bucket, no canonical write
  → write canonical state and canonical events
  → increment shared revision when player-visible shared state changes
  → store idempotent result reference
  → commit
  → if shared revision increased, broadcast state_changed(gameId, revision)
  → return player projection
```

- 외부 HTTP, Realtime과 분석 서비스 호출은 transaction 안에서 기다리지 않는다.
- broadcast는 commit 뒤 best effort다.
- broadcast 실패를 이유로 committed state를 되돌리지 않는다.
- 인증·request shape 오류는 transaction 앞에서 반환한다. 인증된 요청의 예상된 domain 4xx는 domain savepoint까지만 rollback해 canonical write와 그 뒤의 lock을 버리고, outer transaction에서 안전한 `committed_failure`와 rate bucket만 commit한다. PostgreSQL exception을 사용하는 경우 반드시 `ROLLBACK TO SAVEPOINT` 또는 동등한 정상 분기로 복구한 뒤 commit한다.
- `429`는 rate bucket과 window 끝까지만 유효한 `rate_limited` guard를 commit한다. 같은 key의 window 내 replay는 중복 차감하지 않으며 `Retry-After = ceil(window_end - current server time)`의 남은 정수 초를 매 응답에서 다시 계산한다. window가 끝나면 같은 guard를 원자적으로 재claim할 수 있다.
- 예상하지 못한 DB·내부 오류는 idempotency·bucket을 포함한 전체 transaction을 rollback한다.
- commit 뒤 응답 실패는 idempotency 재시도의 안전한 resource 결과로 복구한다. invite 원문은 재생하지 않는다. 내부 `rotate_required` 상태는 public wire에서 `rawInviteTokenIncluded: false`, `inviteRecoveryAction: "rotate"`로 투영한다.
- 모든 mutation은 request-scoped idempotency row를 domain row보다 먼저 claim하고, 새 요청에 필요한 durable rate-limit bucket을 bucket key 순으로 갱신한다. 그 뒤 game → user claim → turn → player → invite → setup/submission → agent/objective/economy 순서를 사용한다. 같은 잠금 범주의 여러 row는 안정된 ID 오름차순으로 잠근다. claim은 user ID, player는 seat·player ID, invite는 generation, setup/submission은 attempt·phase·player ID, agent/objective는 entity ID, economy는 team ID 순서를 사용한다.
- deadlock `40P01` 또는 serialization failure `40001`만 jitter를 두고 transaction 전체를 최대 3회 시도한다. 다른 오류는 즉시 실패하고, 제한 소진 시 `503 RETRYABLE_TRANSACTION`을 반환한다.
- private general draft 저장과 phase를 바꾸지 않는 한쪽의 secret submission lock은 예외적으로 공개 game revision·canonical TurnEvent·Realtime broadcast 없이 자체 `draft_version` 또는 `private_input_version`만 증가시킨다. idempotency와 row lock, rollback 원칙은 동일하게 적용한다.

## 동시성별 잠금 계약

| 상황                                     | 잠금·constraint                                                                                                                                                                                                                               |
| ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 두 guest의 동시 참가                     | game + invite `FOR UPDATE`, unique game/seat, token single-use                                                                                                                                                                                |
| 같은 사용자의 서로 다른 create·join 경합 | game lock 뒤 private `user_active_game_claims(user_id)` unique claim; 하나의 nonterminal membership만 commit하고 패한 요청은 domain savepoint rollback 뒤 canonical write 없이 rate bucket + 안전한 `PLAYER_ALREADY_IN_GAME` failure만 commit |
| waiting host의 cancel과 guest join 경합  | game + active invite `FOR UPDATE`; cancel 또는 join 하나만 commit, cancelled game에는 join 불가                                                                                                                                               |
| 같은 nickname 동시 참가                  | unique `(game_id, nickname_key)`                                                                                                                                                                                                              |
| 같은 setup attempt의 동시 명단 선택      | game + attempt + player submission을 안정된 순서로 잠그고 양측 충돌 판정을 한 번만 실행                                                                                                                                                       |
| 여러 tab의 agent draft 저장              | expected `draft_version` compare-and-set, game + turn + player + 모든 활동 agent/draft를 ID 오름차순으로 잠그고 교체 후 전체 집합 재검증                                                                                                      |
| deadline과 수동 일반 lock 경합           | game + turn + player draft + submission lock 뒤 하나의 immutable submission만 생성                                                                                                                                                            |
| 같은 단계 중복 lock                      | game + turn + submission lock, unique phase submission                                                                                                                                                                                        |
| 두 사용자의 마지막 lock                  | game + turn lock 후 한 번만 phase 전환                                                                                                                                                                                                        |
| 두 `advance`의 동시 Resolve·finish       | game → 양 user claim(user ID 순) → turn `FOR UPDATE`, unique resolution key와 status compare; 승리 commit이 두 claim을 원자 해제                                                                                                              |
| HTTP 재시도                              | idempotency unique constraint와 payload hash                                                                                                                                                                                                  |
| 서로 다른 mutation의 교착 방지           | 모든 state mutation이 request idempotency row를 0순위로 claim한 뒤 공통 domain row 순서를 사용                                                                                                                                                |
| 복수 충원                                | 한 resolution transaction에서 빈 8칸 snapshot과 중복 없는 배정                                                                                                                                                                                |
| 성공 이동 순서                           | 한 resolution의 저장된 random stream으로 순차 처리                                                                                                                                                                                            |

잠금 순서와 전체 책임은 [ARCHITECTURE.md](./ARCHITECTURE.md)를 따른다.

## 난수와 규칙 버전

- 경기 초기화와 턴 Resolve에 server-generated seed를 사용한다.
- 팀 배정, 시설 배치, 목표 배치, 배신자, 성공률, 동률, 이동 순서와 충원 배정은 namespace가 구분된 deterministic stream을 사용한다.
- 팀 배정은 저장된 unbiased random bit 하나로 seat↔RED/BLUE 대응을 정하고 정확히 한 명씩 배정한다. 같은 초기화 재시도에서 다시 draw하지 않는다.
- `rules_version`, resolver version과 input snapshot hash를 resolution에 기록한다.
- 동일 idempotent Resolve를 다시 계산해야 하면 동일 seed와 input으로 동일 결과가 나와야 한다.
- 게임 결과용 난수와 3D 시각 효과용 난수를 분리한다.

## player state projection

projection은 allowlist 기반의 별도 타입이다. canonical object를 JSON으로 직렬화한 뒤 금지 필드를 삭제하지 않는다.

공통으로 제공 가능한 범주:

- game ID, status, turn, phase, contractVersion, revision와 serverTime
- 사용자 자신의 seat, team과 nickname
- 상대 nickname과 허용된 공개 상태
- 공개 map layout과 시설 배치
- 허용된 자기 팀 상태·자기 명령 잠금 상태·자금
- 현재 setup attempt의 본인 명단 선택·잠금 또는 상대 시설을 밝히지 않는 충돌 재선택 상태
- 본인의 private general draft·저장 상태와 현재 owner-only `privateInputScope`·`privateInputVersion`
- [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md)에 따라 볼 수 있는 적 위치·사건
- 공개된 목표물, 운반자와 결과
- 해당 사용자에게 허용된 deadline와 결과 알림

조건 없이 제공하면 안 되는 범주:

- 상대 K/H/D 유형
- 상대의 숨은 위치·이동·행동
- 상대 일반 명령과 배신자 명령
- 상대의 명단 배치 선택, general draft, draft 수·수정 시각과 정확한 lock 시각
- 자기 팀 안의 상대 통제 배신자 정체
- 상대가 단독으로 아는 심문 결과
- 권한 없는 과학자 탈출지
- 숨겨진 목표 위치
- canonical random seed·draw와 전체 event payload

도청, 심문, 명단, 목표 운반과 드롭 같은 예외는 게임 문서의 조건을 projection test case로 작성한다.

일반·배신자처럼 simultaneous secret input 단계에서는 자기 lock 전 상대의 locked boolean도 생략한다. 자기 lock 뒤에는 `waitingForOpponent` 같은 coarse 대기 상태만 허용하며 상대가 언제, 몇 개를 입력했는지 추론할 필드를 보내지 않는다.

이동 destination affordance는 공개 map topology, 자기 요원의 공개 이동 한도와 이미 공개된 상태만 사용한다. 숨은 상대 점유·숨은 목표·비공개 type 때문에 후보를 제거하거나 disabled reason을 바꾸지 않는다. client preview와 draft 검증을 통과해도 Resolve에서 숨은 점유와 실행 순서 때문에 이동이 실패할 수 있다.

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
- private general draft 저장에는 `state_changed`를 보내지 않는다.
- phase를 전환하지 않는 한쪽의 setup·일반·배신자 secret lock에도 `state_changed`를 보내지 않는다. 양측 완료·deadline으로 shared phase가 바뀔 때만 broadcast한다.
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

| HTTP | code                      | 의미                                                                                                  |
| ---- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| 400  | `INVALID_REQUEST`         | JSON 또는 field 형식 오류                                                                             |
| 400  | `INVALID_NICKNAME`        | nickname 정규화·grapheme·문자 규칙 실패                                                               |
| 401  | `AUTH_REQUIRED`           | 유효한 익명 session 없음                                                                              |
| 403  | `GAME_ACCESS_DENIED`      | 해당 game의 player가 아님                                                                             |
| 404  | `GAME_NOT_FOUND`          | 공개 가능한 범위에서 game 없음                                                                        |
| 409  | `PLAYER_ALREADY_IN_GAME`  | 이 anonymous session이 다른 waiting·setup·active game을 이미 소유함                                   |
| 409  | `INVITE_UNAVAILABLE`      | 비회원에게 공개하지 않는 동일 응답: token 불일치·폐기·만료·사용됨, terminal game 또는 guest slot 없음 |
| 409  | `ROOM_NOT_CANCELLABLE`    | first general order 이후이거나 terminal 상태라 취소 불가                                              |
| 409  | `NICKNAME_CONFLICT`       | 방 내 정규화 nickname 중복                                                                            |
| 409  | `PHASE_CONFLICT`          | 현재 phase에서 허용되지 않은 mutation                                                                 |
| 409  | `ALREADY_LOCKED`          | submission이 이미 잠김                                                                                |
| 409  | `DRAFT_VERSION_CONFLICT`  | 다른 tab 또는 요청이 더 최신 private draft를 저장함                                                   |
| 409  | `IDEMPOTENCY_CONFLICT`    | 같은 key에 다른 payload                                                                               |
| 410  | `IDEMPOTENCY_KEY_EXPIRED` | 24시간 replay 보장 기간이 지난 key. 새 mutation으로 재사용하지 않으며 새 key 필요                     |
| 422  | `ORDER_INVALID`           | 게임 규칙상 유효하지 않은 명령                                                                        |
| 429  | `RATE_LIMITED`            | t0.2 request bucket 한도 초과. 정수 초 `Retry-After` 포함                                             |
| 503  | `RETRYABLE_TRANSACTION`   | 제한된 내부 retry 후 일시적 충돌                                                                      |

비회원의 join 실패는 `INVITE_UNAVAILABLE` 하나로 정규화하고 token 존재·generation·used/revoked/expired 상태, game 존재·terminal 여부와 빈 slot 여부를 응답 문구·필드·status 차이로 구분하지 않는다. 내부 감사 로그는 원인을 구분할 수 있지만 원문 token이나 hash를 남기지 않는다. 같은 game의 기존 member는 이 정규화보다 먼저 현재 projection으로 복구된다. 상대 비밀을 추론할 수 있는 상세 실패 이유도 player에게 반환하지 않는다.

## 데이터 보존과 정리 준비

게임·개인정보·운영 로그의 장기 보존 기간은 실제 배포와 정책 확정 때 결정한다. 멱등성과 rate-limit guard에는 아래 t0.2 최소값을 적용하고 나머지 범주를 분리한다.

- 진행 중 game과 재접속에 필요한 state
- 종료 game의 플레이테스트 분석용 비식별 결과
- 재현용 private resolution·random record
- commit 뒤 24시간 replay 결과와 그 뒤 anonymous user 안전 정리까지 남기는 최소 idempotency key-hash tombstone. nonterminal resource를 참조하는 record는 먼저 삭제하지 않음
- fixed-window 종료 24시간 뒤 정리 가능한 `api_rate_limit_buckets`
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
- [ ] 같은 사용자의 create↔create·create↔join·join↔join 경합에서 waiting/setup/active membership과 active-game claim이 하나만 남음
- [ ] 같은 game의 join 재시도는 이미 used인 token보다 기존 membership을 먼저 인식해 저장된 slot·projection을 반환하고 nickname·team·seat를 변경하지 않음
- [ ] 비회원의 invalid·revoked·expired·used token, terminal game과 full slot이 동일한 `INVITE_UNAVAILABLE` status·code·공개 body를 반환하고 rate limit을 우회하지 않음
- [ ] waiting host cancel과 guest join 경합에서 하나만 commit되고 active unused invite가 game당 최대 하나
- [ ] 어느 setup player든 첫 general order 전 취소할 수 있고 두 사용자는 새 방 생성·참가 가능
- [ ] cancel·finish transaction이 해당 game의 사용자 claim을 모두 해제하되 감사용 game·membership은 보존
- [ ] `/advance` Resolve가 game → user claim → turn 순서를 지키고 finish↔새 create/join 경합에서도 한 사용자에게 nonterminal claim이 둘 생기지 않음
- [ ] 128-bit 이상 invite token 원문이 DB·로그에 없음
- [ ] invite URL은 fragment만 사용하고 client가 즉시 `history.replaceState`로 제거하며 query·path·Referer·analytics·persistent storage에 원문이 없음
- [ ] 방 생성·rotate 응답 유실 뒤 이전 원문을 복구하지 않고 recoverable room 조회와 새 링크 재발급 가능
- [ ] create/rotate 뒤 새로고침한 host projection은 invite active/expired와 expiry만 받고 원문·기존 복사 링크는 복구하지 않으며 새 링크 발급을 안내
- [ ] invite `expired`는 저장 enum이 아니라 active+server expiry에서 파생되고, false one-time-secret 응답에는 `rawInviteToken`·`inviteUrl` key가 존재하지 않음
- [ ] invite generation이 server time 60분에 만료되고 waiting room·host claim은 유지되며 host가 새 60분 generation을 rotate 가능
- [ ] nickname grapheme·허용 문자·정규화 중복 test
- [ ] 양측 요원 명단이 같은 시설이면 두 선택 모두 무효화되고 상대 시설은 미노출
- [ ] 서로 다른 명단 선택 뒤 objective initialization이 한 번만 commit
- [ ] team assignment가 정확히 RED·BLUE 한 명씩이며 재시도로 바뀌지 않음
- [ ] complete general draft만 저장되고 본인 외 조회·Realtime 수신 불가
- [ ] 한 agent draft 교체 후 플레이어 전체 저장 집합의 비용·횟수·상호 배타 제한이 항상 합법하며 거부 시 이전 집합 유지
- [ ] 40초 deadline이 저장된 draft를 보존하고 나머지 활동 요원만 `WAIT` 처리
- [ ] 0 active agent와 no controllable mole이 phase 진입 즉시 owner private version을 가진 server-default submission으로 확정되고 양측 자동이면 timer 없이 연쇄 전환
- [ ] deadline이 저장 draft를 임의 폐기·재정렬하지 않고 합법 집합 그대로 snapshot
- [ ] 자기 lock 전 상대 lock·draft timing field가 projection에 없음
- [ ] 한쪽 secret lock이 shared revision·Realtime 변화로 상대에게 드러나지 않음
- [ ] 같은 shared revision에서도 owner의 더 큰 `privateInputVersion` 응답이 적용되고 상대 projection에는 해당 version이 없음
- [ ] 숨은 점유에 따라 이동 후보·동기 오류 상세가 달라지지 않음
- [ ] lock 뒤 order 수정 불가
- [ ] 두 Resolve 동시 요청에서 resolution 하나만 존재
- [ ] idempotency same-payload replay와 different-payload conflict test
- [ ] invite create/rotate 같은 key 재시도는 원문을 재생하지 않고 같은 resource identity + `rawInviteTokenIncluded: false` + `inviteRecoveryAction: "rotate"`, 새 key rotate만 새 원문 반환
- [ ] commit된 idempotency 결과는 24시간 replay되고 이후 같은 key가 `410 IDEMPOTENCY_KEY_EXPIRED`로 새 mutation을 만들지 않으며 최소 tombstone과 nonterminal 참조가 조기 삭제되지 않음
- [ ] create·join·rotate rate-limit fixed window와 bucket key 정렬이 경합에서도 한도를 넘지 않고, 같은 idempotent replay는 중복 차감되지 않으며 429에 `Retry-After` 포함
- [ ] expected domain 4xx는 canonical write 없이 bucket+safe failure를 commit하고, 429는 window 안에서만 같은 key로 replay한 뒤 window 종료 후 재claim되며, unexpected DB/503은 bucket까지 rollback
- [ ] 같은 429 replay의 `Retry-After`가 원래 window 종료까지 남은 server-time 초로 감소함
- [ ] `api_rate_limit_buckets`의 종료 24시간 지난 row 정리가 현재 window에 영향을 주지 않음
- [ ] `room:create` non-null scope가 nullable game ID 없이도 중복 방 생성을 차단
- [ ] 다중 row가 범주별 stable ID 순서로 잠기며 retry가 3회에서 종료
- [ ] transaction rollback 뒤 partial state가 없음
- [ ] server deadline이 client clock 변경과 무관함
- [ ] player projection에 상대 비밀 field가 key 형태로도 없음
- [ ] canonical event가 client API에 직접 노출되지 않음
- [ ] private Realtime topic의 비참가자 subscribe 거부
- [ ] client Realtime send 거부
- [ ] Realtime 알림 유실 뒤 polling으로 revision 복구
- [ ] 모든 JSON 응답에 `contractVersion`·request ID가 있고 game 응답에 `private, no-store`

## DEPRECATED — v0.1 데이터/API 초안

t0.1 이전 문서에는 다음 구형 예시가 있었다.

- `games`, `agents`, `orders`, `turns`, `events` 다섯 table의 최소 필드 목록
- 좌표 대신 의미가 정의되지 않은 `location_id`
- `player_a_ready`, `player_b_ready`의 단일 ready 단계
- `POST /api/game/ready`와 client가 호출하는 `POST /api/game/resolve-turn`
- nickname, invite token, idempotency, revision, server deadline와 transaction 경계가 없는 구조
- canonical event의 단일 `visibility` 값

이 예시는 구현된 schema가 아니었고 t0.1 계약으로 대체됐다.

| 구형 항목                     | t0.1 대체                                                      |
| ----------------------------- | -------------------------------------------------------------- |
| `location_id`                 | 검증된 16×16 `row`, `column`과 map layout                      |
| 단일 ready                    | 일반·배신자 phase별 immutable submission                       |
| client `resolve-turn`         | authenticated `advance`와 서버 내부 단일 Resolve 전환          |
| 한 event payload + visibility | canonical event와 player별 allowlist projection                |
| 직접 table 접근 가능성 미정   | private schema, direct deny와 Route Handler 전용 접근          |
| 중복 Resolve 구현 TBD         | transaction, `FOR UPDATE`, unique resolution key와 idempotency |
| Polling만 초기 선택           | private `state_changed` 알림 + 3초 safety polling              |
| 닉네임 TBD                    | NFC·trim·2~16 grapheme·허용 문자·방 내 중복 금지 계약          |

과거의 “비밀 정보는 화면에서만 숨기지 않는다”와 “중요 판정은 서버에서 수행한다”는 원칙은 폐기하지 않고 t0.1에서 더 강한 데이터·권한 계약으로 구체화했다.

## 공식 기술 참고

- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Realtime Authorization](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers)
- [Vercel Functions](https://vercel.com/docs/functions)
