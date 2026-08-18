# 3D 표현 및 입력 기술 계약

> 문서 상태: **ACTIVE**  
> 기술 기준 버전: **t0.1**  
> 게임 규칙 기준: **v0.5**  
> 구현 상태: **PREPARATION COMPLETE / CODE NOT STARTED**  
> 적용 범위: 3D 장면, 좌표 변환, 이동 연출, 입력, 렌더링 품질과 표현 계층 테스트  
> 규칙 기준: 맵과 이동 판정은 [MAP_AND_INTELLIGENCE.md](../game-design/MAP_AND_INTELLIGENCE.md), 턴 실행과 공개 범위는 [TURN_MODEL.md](../game-design/TURN_MODEL.md)를 따른다.

이 문서는 브라우저에 게임 상태를 **표현하고 입력을 수집하는 방법**을 확정한다. 3D 장면, 애니메이션, 카메라 또는 포인터 충돌은 게임 규칙을 판정하지 않는다. 이동 가능 여부, 경로, 점유, 목표 획득과 공개 정보는 항상 서버의 권위 있는 결과를 따른다.

현재는 기술 계약만 확정했다. Next.js 프로젝트, React 컴포넌트, 3D 에셋, 패키지와 설정 파일은 아직 만들지 않았다.

## 1. 활성 기술 기준

| 영역 | t0.1 계약 |
|---|---|
| 웹 프레임워크 | Next.js App Router + React + TypeScript |
| 3D 표현 | React Three Fiber(R3F) `Canvas` + Three.js |
| 현재 에셋 | Three.js 기본 도형 `Box`, `Cylinder`, `Capsule`, `Sphere` 조합 |
| 향후 모델 | GLB(glTF 2.0 binary), 표현 어댑터를 통해 기본 도형과 교체 |
| 그래픽 기준 | WebGL2 |
| 데스크톱 입력 | 마우스/포인터 + 키보드 |
| 태블릿 입력 | 터치 기반 Pointer Events |
| 이동 연출 | 서버 승인 경로의 셀 중심 waypoint 보간 |

R3F는 Three.js 장면을 React 컴포넌트로 구성하지만, 렌더링 기반과 성능 원칙은 Three.js를 그대로 따른다. 기술 선택의 공식 근거는 [R3F 소개](https://r3f.docs.pmnd.rs/getting-started/introduction), [R3F Canvas 예제](https://r3f.docs.pmnd.rs/getting-started/your-first-scene), [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html)이다.

## 2. 16×16 체스판형 도시 표현

### 2.1 논리 보드

- 도시는 `row: 0..15`, `col: 0..15`의 16×16 논리 격자이다.
- Excel 원본의 `A1`은 `(row: 0, col: 0)`, `P16`은 `(row: 15, col: 15)`로 정규화한다.
- 맵에는 100개의 건물 부지 셀이 있으며, 4개 부지로 하나의 블록을 이루어 총 25개 블록을 구성한다.
- 공항과 항구는 각각 4개 부지를 점유하는 하나의 대형 건물이지만, 네 셀은 모두 독립적인 이동·도착·점유 셀로 유지한다.
- 나머지 셀의 도로 연결, 건물 종류, 스폰과 목표 후보 메타데이터는 3D 메시가 아니라 서버의 맵 데이터가 소유한다.
- 플레이 화면에는 제작용 `도로`, `A/B/C`, `K/H/F/D`, 고정/충원 스폰 표기를 그대로 노출하지 않는다.

100개의 건물 부지와 도로를 낮은 기반 타일 위에 배치해, 도시 전체가 한눈에 읽히는 3D 체스판처럼 보이게 한다. 건물 높이와 색은 셀 의미를 식별하는 표현값일 뿐 이동 가능 여부를 판정하지 않는다.

### 2.2 단일 좌표 변환

논리 셀을 월드 좌표로 바꾸는 함수는 `presentation-3d/coordinates` 한 곳에만 둔다. 모든 건물, 도로, 요원, 선택 표시, raycast 결과, 카메라 초점과 경로 waypoint가 같은 변환을 사용한다.

```text
x = (col - 7.5) * CELL_SIZE
y = surfaceY
z = (row - 7.5) * CELL_SIZE
```

- `CELL_SIZE`와 지면 높이는 표현 설정값이다.
- 행/열의 증가 방향과 월드 `X/Z` 방향은 위 식으로 고정한다. 카메라 배치가 바뀌어도 논리 방향을 뒤집지 않는다.
- 화면에서 선택한 월드 위치는 동일 어댑터의 역변환을 거쳐 `{ row, col }`로 정규화한 뒤 요청 계약에 넣는다.
- 장면 컴포넌트가 자체적으로 `row/col` 계산식을 복제하거나 Excel 좌표 문자열을 직접 해석하면 안 된다.

## 3. 기본 도형 데모 장면

첫 데모는 외부 3D 모델 없이 다음 도형 조합으로 만든다.

| 대상 | 기본 도형 계약 |
|---|---|
| 지면·도로·일반 건물 | `BoxGeometry` |
| 특수 건물의 탑·기둥·설비 | `BoxGeometry` + `CylinderGeometry` |
| 요원 몸체 | `CapsuleGeometry` |
| 요원 머리·위치/선택 표식 | `SphereGeometry` |
| 셀 도착/범위 표식 | 얇은 `CylinderGeometry` 또는 `BoxGeometry` |

공항과 항구는 하나의 건물처럼 읽히는 공통 지붕·외곽 표현을 사용할 수 있다. 그러나 이동 waypoint와 선택 표식은 내부 네 셀 각각에 유지하며, 하나의 불투명 충돌체로 네 셀을 지우지 않는다. 요원은 네 셀 안을 돌아다니고, 시설 내부를 통과하고, 어느 셀에도 최종 도착할 수 있어야 한다. 과학자 운반자의 지정 탈출지 도착도 네 셀 중 어느 셀에 도착했는지와 관계없이 같은 시설 도착으로 표현한다.

일반 건물도 유효한 도착 셀이다. 건물 사이를 통과할 수 없는 규칙과 도로·공항·항구 통과 규칙은 서버가 승인한 경로에 이미 반영되므로 클라이언트가 메시 충돌로 재판정하지 않는다.

## 4. R3F 로딩과 WebGL2 폴백

Next.js의 페이지와 DOM 셸은 서버에서 먼저 제공한다. 3D 경계는 작은 Client Component로 분리하고, 그 안에서만 `next/dynamic`의 `{ ssr: false }`를 사용해 R3F `Canvas` 장면을 지연 로드한다. Server Component에서 `ssr: false`를 직접 사용하지 않는다. 이 구조는 [Next.js 지연 로딩 가이드](https://nextjs.org/docs/app/guides/lazy-loading)와 [Server/Client Components 가이드](https://nextjs.org/docs/app/getting-started/server-and-client-components)를 따른다.

로딩 순서는 다음과 같다.

1. 닉네임, 방 상태, 오류와 접근 가능한 조작을 제공하는 DOM 셸을 먼저 렌더링한다.
2. Client Component에서 `WebGL.isWebGL2Available()` 또는 동등한 안전한 capability check를 수행한다.
3. WebGL2가 가능할 때만 R3F 장면 번들을 불러오고 `Canvas`를 마운트한다.
4. 불가능하면 WebGL1로 묵시적 강등하지 않는다. 호환성 안내, 브라우저/그래픽 가속 확인, 다시 시도와 방 나가기 기능이 있는 DOM 폴백을 표시한다.
5. `webglcontextlost`, 장면 로드 실패 또는 GLB 로드 실패도 빈 화면 대신 같은 복구 UI로 전환한다.

Three.js의 현재 `WebGLRenderer`는 WebGL2를 사용하며 WebGL1은 지원하지 않는다. capability check와 오류 메시지는 [Three.js WebGL 유틸리티](https://threejs.org/docs/pages/WebGL.html)를 기준으로 한다. WebGPU는 t0.1 필수 범위가 아니다.

## 5. 서버 승인 경로와 이동 연출

클라이언트가 이동 경로를 계산하거나 추측하지 않는다. 서버가 해당 플레이어에게 공개해도 되는 이동 결과에 논리 waypoint 목록을 포함했을 때만 이를 연출한다.

```text
ApprovedMovement = {
  agentViewId,
  from: { row, col },
  waypoints: [{ row, col }, ...],
  to: { row, col },
  revision
}
```

위 형태는 표현 계층의 개념 계약이며 실제 직렬화 타입은 [DATA_AND_API.md](./DATA_AND_API.md)의 공유 계약과 일치시킨다.

- 각 waypoint를 단일 `row/col → X/Z` 변환으로 바꾼 뒤, 셀 중심 사이를 일정한 시각 속도로 보간한다.
- 공항·항구 내부 이동도 네 논리 셀을 그대로 waypoint로 사용한다. 각 내부 셀의 이동 비용과 도착 판정이 애니메이션에서 생략되지 않아야 한다.
- 이동 애니메이션은 이미 확정된 서버 상태를 재생할 뿐이다. 애니메이션 중단, 탭 전환, 프레임 저하가 논리 위치나 턴 결과를 바꾸지 않는다.
- 재접속하거나 더 최신 `revision`을 받으면 오래된 연출을 취소하고 최신 공개 상태에 맞춰 스냅 또는 안전하게 재동기화한다.
- 상대 경로가 비공개인 상황에서는 경로를 만들어 내지 않는다. 공개 투영이 허용한 최종 위치와 사건만 표현한다.

t0.1에서는 다음을 사용하지 않는다.

- 물리 엔진과 rigid-body 충돌
- NavMesh 또는 클라이언트 pathfinding
- 메시 경계를 이용한 이동 가능 판정
- 플레이어가 요원을 직접 움직이는 자유 WASD 이동
- 프레임마다 위치를 서버로 전송하는 실시간 캐릭터 제어

## 6. 렌더링 자원과 GLB 교체 경계

### 6.1 초기 성능 원칙

- 같은 형태의 도로, 부지와 건물은 geometry와 material을 공유한다.
- 반복 개수가 많은 타일·일반 건물은 색상/변환 조건이 맞는 단위로 `InstancedMesh`를 사용한다. 공식 동작과 제약은 [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html)를 따른다.
- 선택, 소유, 조사와 목표 표시는 원본 material을 매 프레임 복제하지 않고 별도 overlay 또는 제한된 상태 material로 표현한다.
- 장면 교체 시 loader 결과, texture, geometry와 material의 소유권을 추적해 해제한다.
- 기본 품질에서는 고비용 후처리와 다수의 동적 그림자를 사용하지 않는다.

### 6.2 표현 어댑터

도메인과 서버 응답은 `buildingId`, `buildingKind`, `agentViewId`, `teamView`, `row`, `col` 같은 의미 식별자만 사용한다. Three.js의 mesh 이름, node 경로, material 이름과 animation clip 이름을 게임 규칙에 저장하지 않는다.

표현 계층은 같은 의미 입력을 받는 두 어댑터를 갖는다.

- `PrimitivePresentationAdapter`: Box/Cylinder/Capsule/Sphere로 데모 오브젝트를 만든다.
- `GlbPresentationAdapter`: 향후 GLB scene, material과 animation clip을 의미 슬롯에 연결한다.

GLB 로드 실패 시 가능한 대상은 기본 도형 어댑터로 대체하고, 게임 상태는 계속 유지한다. 모델 교체는 `GLTFLoader`와 에셋 매핑에서 끝나야 하며 맵·이동·승리 판정 코드를 수정하면 안 된다. 근거 문서는 [Three.js GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)와 [Three.js glTF 모델 워크플로](https://threejs.org/manual/en/loading-3d-models.html)이다.

## 7. PC와 태블릿 입력 계약

### 7.1 공통 원칙

- Canvas 선택은 Pointer Events 계층으로 통일해 `mouse`, `touch`, `pen`을 같은 명령 흐름으로 정규화한다.
- 클릭과 탭은 같은 셀 선택 의미를 가진다. 드래그/핀치가 카메라에 배정되더라도 임계 거리 이하의 탭을 선택으로 구분한다.
- `hover`는 보조 피드백일 뿐이다. hover하지 못하면 선택, 설명, 확인 또는 취소가 불가능해지는 UI를 만들지 않는다.
- 선택 가능한 셀과 말은 포인터 다운/포커스 뒤에도 지속되는 시각 피드백을 제공한다.
- 중요한 명령은 Canvas에만 숨기지 않고 키보드 접근이 가능한 DOM 패널에서도 확인·취소할 수 있게 한다.
- 키보드는 포커스 이동, 선택, 확인, 취소와 단축키에 사용한다. WASD로 요원을 자유 이동시키지 않는다.
- 멀티터치 중 브라우저 스크롤/확대와 게임 제스처의 충돌 범위는 Canvas 영역에만 제한한다. 전체 문서의 기본 접근성 제스처를 무조건 차단하지 않는다.

### 7.2 닉네임 입력

게임 시작 전 닉네임 단계는 3D Canvas가 아니라 실제 DOM `<form>`과 `<input>`으로 구현한다.

- 한국어 IME 조합 중에는 Enter 제출을 오인하지 않는다.
- 필수 여부, 길이, 허용 문자와 중복 정책은 공유 요청 계약에서 한 번 정의하고 클라이언트와 서버가 모두 검증한다.
- 모바일 가상 키보드가 입력과 제출 버튼을 가리지 않도록 viewport 변화에 대응한다.
- 닉네임은 표시 이름이며 인증 수단, 방 참가 권한 또는 플레이어 슬롯 증명이 아니다.
- 오류는 색상만이 아니라 텍스트와 포커스 이동으로 전달한다.

### 7.3 Android 브라우저 범위

Android 태블릿은 별도 네이티브 앱이나 APK가 아니라 **일반 Google Chrome 브라우저 탭**으로 접속한다. 따라서 Android 전용 게임 코드를 만들지는 않지만, OS가 설치 가능한 Chrome의 하한, GPU·벤더 드라이버, 메모리 회수와 발열 정책을 결정하므로 OS와 실제 기종을 무관한 것으로 취급하지 않는다.

- t0.1 정식 지원 브라우저는 Android용 Google Chrome이다.
- Android System WebView와 메신저·소셜 앱의 인앱 WebView는 정식 지원 범위가 아니다. 해당 환경에서 열렸거나 WebGL2 초기화가 실패하면 일반 Chrome에서 다시 열도록 안내한다.
- Chrome과 OS 버전 문자열만으로 3D 호환성을 판정하지 않는다. 실제 장치에서 WebGL2 context 생성, frame time, context 손실과 복귀를 함께 검증한다.
- 브라우저 탭이 숨겨지거나 폐기될 수 있으므로 탭·앱 복귀 시 오래된 애니메이션을 신뢰하지 않고 서버의 최신 공개 `revision`을 다시 조회한다. 근거는 [Chrome Page Lifecycle](https://developer.chrome.com/docs/web-platform/page-lifecycle-api)이다.

## 8. DPR과 품질 제어

초기 품질 프리셋은 Android 버전이나 장치 종류만 믿지 않고 WebGL2 capability, 실제 DPR, 렌더러 정보와 지속적인 frame time을 참고한다. 지원선의 실제 RAM은 기종 사양으로 확인하며, `navigator.deviceMemory` 같은 브라우저 값은 근삿값이므로 초기 힌트로만 사용하고 단독 차단 조건으로 사용하지 않는다.

| 프리셋 | DPR 상한 | 그림자/효과 | 초기 대상 |
|---|---:|---|---|
| Low | 1.0 | 동적 그림자 없음, 후처리 없음 | 저성능 태블릿 또는 자동 강등 |
| Balanced | 1.5 | 제한된 정적/단일 그림자, 후처리 없음 | 기본값 |
| High | 2.0 | 측정 후 허용된 제한 효과 | 성능 여유가 확인된 PC |

- CSS 표시 크기와 drawing buffer 크기를 분리하고, 브라우저 원본 DPR을 무제한 사용하지 않는다.
- WebGL2 context 생성에 실패하면 품질을 낮춰 계속 실행하지 않고 3D 호환성 폴백으로 전환한다.
- 5초 이상 목표 frame time을 지속해서 넘으면 한 단계 강등한다. 자동 상향은 장면 흔들림을 피하기 위해 즉시 수행하지 않는다.
- resize, 분할 화면, 가상 키보드와 방향 전환 뒤 Canvas 크기와 카메라 투영을 다시 계산한다.
- 사용자가 품질을 직접 선택하는 UI의 위치와 모양은 UI 가이드 이후 정한다. 단, 개발용 강제 프리셋과 측정 HUD는 준비한다.

## 9. 성능·호환성 수용 기준

### 9.1 Android 태블릿 지원 정책

2026-08-18 기준 Project-Spy의 Android 정책은 다음과 같다. Chrome의 공식 OS 하한은 현재 Android 10이지만, 이는 Chrome 설치 가능 조건일 뿐 Project-Spy의 장기 품질 보증선과 같지 않다. 공식 하한과 최신 버전은 변할 수 있으므로 구현 착수와 배포 직전에 [Chrome 시스템 요구사항](https://support.google.com/chrome/a/answer/7100626?hl=en)과 [Chrome 릴리스 채널](https://developer.chrome.com/docs/web-platform/chrome-release-channels/)을 다시 확인한다.

| 분류 | Android 태블릿 계약 |
|---|---|
| 정식 지원 | OEM 보안 지원 중인 Android 12 이상, `current/previous Chrome Stable`, WebGL2 context 생성 성공, 실제 RAM 4GB 이상 |
| 권장 환경 | OEM 보안 지원 중인 Android 14 이상, 실제 RAM 6GB 이상, current Chrome Stable, WebGL2 context 생성 성공 |
| Best-effort | Android 10·11에서 최신 사용 가능 Chrome과 WebGL2가 동작하는 기기. 실행을 임의 차단하지는 않지만 정식 품질 보증 대상으로 선언하지 않는다. |
| 미지원 | Android 9 이하, 오래된 Chrome, WebGL2 context 생성 실패, Android System WebView 또는 인앱 WebView |

Android 12를 정식 지원 하한으로 두는 것은 브라우저 기능 하나 때문이 아니라 유지보수 가능한 OS·브라우저·보안 기준을 함께 확보하기 위한 정책이다. Android 11 이하의 Mainline 지원 종료 상태는 [Android Mainline 문서](https://source.android.com/docs/core/ota/modular-system)에서 확인한다. 지원 판단은 User-Agent만으로 하지 않으며, WebGL2 capability와 실제 측정 결과가 정식 지원 조건을 충족해야 한다.

### 9.2 공통 성능 기준

초기 데모의 공통 측정 장면은 전체 16×16 맵, 100개 건물 부지, 공항·항구의 4칸 표현, 요원 8명, 선택 표식과 8명의 동시 waypoint 이동을 포함한다. 개발 빌드가 아니라 최적화된 production build에서 로드 완료 후 60초 이상 측정한다.

| 대상 | t0.1 목표 | 실패 기준 |
|---|---|---|
| Windows 11, Chrome/Edge 최신 안정판, 1920×1080 | Balanced에서 60 FPS 지향, 중앙값 55 FPS 이상 | 1초 이상 주기적 정지, 입력 유실, WebGL 오류 |
| 실물 Android 태블릿, 위 정식 지원선, 약 1024×768 이상 | Low/Balanced에서 중앙값 30 FPS 이상 | 지속 20 FPS 미만, 터치 선택 실패, context 반복 손실 |
| 실물 iPad, Safari 최신 안정판, 약 1024×768 이상 | PC+태블릿 제품 목표의 향후 검증 대상 | 현재 보유 검증 장치가 없으므로 통과나 정식 지원을 보장하지 않는다. |

현재 사용자가 보유한 Android 태블릿 한 대의 통과는 그 **검증 기종**에 대한 증거일 뿐 Android 태블릿 전체 지원의 증거가 아니다. 정식 Android 지원을 선언하려면 최소 다음 두 등급의 실물 기기를 확보해 같은 production build와 장면을 검증한다.

1. 하한 기종: OEM 보안 지원 중인 Android 12, 실제 RAM 4GB, 중저가 GPU, current/previous Chrome Stable
2. 대표 기종: OEM 보안 지원 중인 Android 14 이상, 실제 RAM 6GB 이상, current Chrome Stable

각 실물 결과에는 제조사·정확한 모델명, Android 버전, 보안 패치 날짜, 실제 RAM, Chrome 전체 버전, 화면 해상도·DPR와 WebGL2 성공 여부를 기록한다. 화면·터치 에뮬레이션은 사전 회귀 검사에는 사용하지만 GPU, 드라이버, RAM, 발열 또는 Android 탭 생명주기 통과의 증거로 사용하지 않는다. Playwright가 에뮬레이션하는 범위는 [공식 Emulation 문서](https://playwright.dev/docs/emulation)를 따른다.

### 9.3 필수 테스트 매트릭스

| 축 | 확인 항목 |
|---|---|
| WebGL | WebGL2 정상, WebGL2 불가, 초기화 실패, `webglcontextlost`와 복구 UI |
| 입력 | 마우스 클릭/드래그, 키보드 포커스/확인/취소, 단일 터치, 멀티터치 취소, pen pointer |
| 화면 | 1.0/1.5/2.0 DPR, resize, 가상 키보드, 세로↔가로 방향 전환 |
| 좌표 | 네 모서리와 중심 셀, 역변환, 공항·항구 네 내부 셀, 건물 도착, 도로 통과 |
| 이동 | 승인/거절, 오래된 버전 취소, 재접속 스냅, 8명 동시 이동, 숨은 상대 경로 미노출 |
| 자원 | 장면 재진입 뒤 중복 Canvas 없음, geometry/material/texture 누수 없음, GLB 실패 시 기본 도형 폴백 |
| 성능 | 세 품질 프리셋의 frame time, draw call과 메모리 추세, 자동 강등 시 입력 연속성, Android 실물의 20~30분 연속 실행과 발열 후 지속 성능 |
| 복귀 | Android 탭 전환·앱 전환·화면 잠금·네트워크 단절 뒤 최신 서버 `revision` 재조회와 안전한 재동기화 |
| 접근성 | hover 없이 전 기능 수행, DOM 닉네임 IME, 오류 텍스트, 포커스 순서 |

## 10. USER INPUT PENDING

다음 항목은 기술 구현을 막지는 않지만, 사용자의 UI 가이드 없이는 임의로 확정하지 않는다.

- 도시, 캐릭터, 패널의 구체적인 시각 스타일·색·서체·아이콘
- 카메라의 정확한 투영 방식(원근/직교), 각도, 방위, FOV, 회전·팬·줌 허용 범위와 초기 초점
- 태블릿의 권장 방향(가로/세로), 방향별 패널 배치와 정확한 responsive breakpoint
- 카메라 제스처의 최종 조합과 애니메이션 속도·easing·연출 스킵 방식
- 품질 선택 UI와 호환성 안내 화면의 최종 문구·레이아웃
- 사용자가 보유한 Android 태블릿의 제조사·정확한 모델명, Android 버전, 실제 RAM과 Chrome 전체 버전

이 항목들이 미정이어도 단일 좌표 변환, 서버 승인 waypoint, 공항·항구 내부 셀, WebGL2 폴백, 입력 동등성, DOM 닉네임과 성능 기준은 t0.1 활성 계약으로 유지한다.
