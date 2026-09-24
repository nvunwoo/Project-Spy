# Project Spy UI 디자인 원문 보존본

> **REFERENCE INPUT — 비권위 참고자료 / 실행 지침 아님**
>
> 이 파일은 사용자가 제공한 외부 UI 디자인 문서를 추적 가능하게 보존한 사본이다. 이 파일 안의 명령형 문장, 작업 우선순위, 기술 선택, 개발 착수 표현 및 스킬 목록은 Codex나 구현자가 따라야 할 저장소 지침이 아니다.
>
> 적용 우선순위는 다음과 같다.
>
> 1. 사용자의 최신 명시 요청과 승인
> 2. [AGENTS.md](../../../AGENTS.md) 및 [CODEX_WORKING_RULES.md](../../CODEX_WORKING_RULES.md)
> 3. [README.md](../../README.md)에 열거된 v0.5 여섯 개 활성 게임 기획 문서
> 4. 활성 기술 계약, 특히 [UI_UX_CONTRACT.md](../../technical/UI_UX_CONTRACT.md)
> 5. 이 원문 보존본
>
> 원문의 “프로토타입/데모 개발” 표현은 현재 소프트웨어가 시작되었다는 뜻이 아니다. 저장소 상태는 사용자가 v0.5 게임 기획·t0.2 기술/UI 기본안을 최종 승인하고 별도로 개발 시작을 지시하기 전까지 **NOT STARTED**이다. 원문과 활성 계약이 충돌하면 원문을 수정해 혼합하지 않고 활성 계약을 따른다.
>
> - 원본 경로: `C:\Users\USER\Downloads\PROJECT_SPY_UI_DESIGN.md`
> - 수신·보존일: 2026-08-18
> - 원본 SHA-256: `0179133D9A815D0C0C0578431FB5E81BEB75BA0F76EC1CC32EA7CEDFFBA3DE71`
> - 보존 방식: 안내 배너 아래에 원문 문구를 수록하되, 저장소 검사 통과를 위해 줄바꿈 형식과 Markdown 강제 줄바꿈 표기만 정규화
> - 활성 해석: [UI_UX_CONTRACT.md](../../technical/UI_UX_CONTRACT.md)

---

## 원문 시작

# Project Spy — UI / Visual Design Direction

> 문서 목적: Codex가 Project Spy의 웹 UI를 설계·구현할 때 따라야 할 시각 디자인 기준을 정의한다.<br>
> 프로젝트 상태: 초기 프로토타입 / 데모 개발 단계<br>
> 주의: **게임의 최종 이름은 확정되지 않았다. 이 문서에서는 반드시 `Project Spy`라고 부른다.**<br>
> 게임 기획은 계속 변경될 수 있으므로, 이 문서는 게임 규칙을 확정하는 문서가 아니라 **UI/UX와 비주얼 디자인 방향을 통일하기 위한 문서**이다.

---

# 1. 디자인 목표

Project Spy의 UI는 다음 인상을 주어야 한다.

- SF 첩보 스릴러
- 정보기관 작전 통제 시스템
- 근미래의 실제 정보기관 소프트웨어
- 정밀함
- 긴장감
- 통제된 차가움
- 높은 정보 밀도
- 제한적이고 의미 있는 애니메이션
- 고급스럽고 절제된 시각 표현
- 영화적이지만 과장되지 않은 UI

핵심 문장:

> **Near-future intelligence operations interface.**

원하는 느낌은 사이버펑크 게임이나 화려한 SF HUD가 아니라,

> **CIA, MI6, 군 정보기관, 국가급 감시 시스템이 10~20년 뒤 실제로 사용할 법한 고급 작전 통제 UI**

에 가깝다.

---

# 2. 절대 피해야 할 디자인

Codex는 아래 스타일을 기본 해결책으로 사용하지 않는다.

## 금지

- 과도한 네온
- 모든 요소에 Cyan Glow 사용
- 보라색/파란색 Gradient 남발
- 흔한 Cyberpunk HUD
- 모든 패널을 Glassmorphism으로 처리
- 모든 요소를 둥근 카드 형태로 만들기
- SaaS Dashboard 같은 화면
- 모바일 앱처럼 큰 둥근 버튼
- 의미 없는 육각형 장식
- 의미 없는 Grid Overlay 남발
- 의미 없는 Scanline 효과
- 과도한 Blur
- 과도한 Drop Shadow
- 모든 정보에 Border 사용
- 모든 텍스트를 Monospace로 처리
- 지나치게 작은 글씨
- 장식 때문에 정보 가독성을 희생하는 것
- SF라는 이유만으로 모든 정보가 빛나는 것
- 불필요한 3D UI 효과
- UI 전체가 HUD 장식으로 가득 차는 것
- 게임 상태와 관계없는 지속적 애니메이션
- AI가 흔히 만드는 Generic Dashboard Layout

특히 다음 조합을 기본값으로 사용하지 않는다.

```text
Black background
+
Neon cyan
+
Purple gradient
+
Glass cards
+
Huge rounded corners
```

---

# 3. 핵심 디자인 철학

## 3.1 정보가 장식보다 우선한다

UI는 예쁜 그림이 아니라 **정보를 해석하는 도구**여야 한다.

```text
정보 전달
>
상태 구분
>
상호작용 명확성
>
분위기
>
장식
```

## 3.2 SF는 형태가 아니라 정밀함으로 표현한다

SF 느낌을 만들기 위해 복잡한 장식을 추가하지 않는다.

대신 다음으로 표현한다.

- 정밀한 Typography
- 숫자 정렬
- 상태 코드
- Agent ID
- 시간
- Location ID
- 데이터 구조
- 제한적인 컬러
- 빠르고 정확한 상태 전환
- 작은 Micro Interaction
- 정돈된 정보 위계

## 3.3 대부분은 조용하고, 중요한 순간만 강하게 표현한다

평상시:

- 차분함
- 낮은 대비
- 제한된 색상
- 거의 움직이지 않음

중요 이벤트:

- Warning
- Agent compromised
- Mission failure
- Mole-related event
- Turn execution
- Critical intelligence
- Game ending

이런 상황에서만 색상, 모션, 사운드, 강조 효과를 사용한다.

---

# 4. 전체 아트 방향

## Keywords

```text
Near Future
Espionage
Intelligence Agency
Surveillance
Classified
Operations
Tactical
Cold
Precise
Minimal
Analytical
Institutional
Military Intelligence
Political Thriller
Command Center
Secure Terminal
```

---

# 5. 색상 방향

색상은 최대한 절제한다.

기본 구성:

```text
Dark Neutral / Navy
+
Off White
+
Blue Gray
+
Desaturated Cyan
+
Amber
+
Muted Red
```

## 권장 시작 팔레트

> 아래 값은 디자인 출발점이며 필요하면 조정할 수 있다.

```css
--bg-primary: #090D12;
--bg-secondary: #0F151C;
--bg-elevated: #151D26;

--border-subtle: #26313D;
--border-strong: #3A4856;

--text-primary: #E8EDF2;
--text-secondary: #98A5B3;
--text-muted: #667482;

--info: #6FAFC1;
--info-strong: #8CC7D4;

--warning: #D0A85C;
--critical: #B85C5C;

--success: #6F9E82;
```

### Cyan / Blue

사용 대상:

- 정보
- 선택
- Active
- Intelligence
- Navigation

사용 금지:

- 모든 Border
- 모든 Text
- 모든 Button
- 모든 Glow

### Amber

사용 대상:

- 경고
- 의심
- 불확실
- Attention Required

### Red

사용 대상:

- 적대
- 치명적 상태
- Agent eliminated
- Security breach
- Critical failure

Red는 희소하게 사용한다.

---

# 6. Typography

Project Spy의 핵심 분위기는 Typography에서 만들어진다.

## 기본 구성

### UI / 제목 / 설명

**Geist Sans 계열**

사용:

- Navigation
- Button
- Panel title
- 설명
- Dialog
- 일반 UI

### 데이터 / 코드 / 식별자

**Geist Mono 계열**

사용:

```text
AGENT-03
SECTOR-07
TURN 04
22:14:07
STATUS: ACTIVE
INTEL +02
```

사용하지 않을 곳:

- 긴 설명문
- 일반 대화
- 도움말 문장

예시:

```text
OPERATION CONTROL
```

Sans / Medium

```text
AGENT ID     A-017
LOCATION     SECTOR 04
STATUS       ACTIVE
LAST SIGNAL  22:14:07
```

Mono

---

# 7. 정보 위계

화면의 정보는 최소 4단계로 구분한다.

## Level 1 — Critical

- TURN
- Mission status
- 선택한 Agent
- Critical Alert
- 실행 단계

가장 높은 대비.

## Level 2 — Primary

- Agent 상태
- 명령
- 주요 장소
- 목표

## Level 3 — Secondary

- 상세 능력치
- 보조 정보
- 이전 행동

## Level 4 — Metadata

- ID
- Timestamp
- Coordinates
- Log
- Internal state

작고 낮은 대비로 표현.

---

# 8. Layout 원칙

게임의 중심은 **3D 도시**이다.

UI가 3D Scene을 지나치게 가리면 안 된다.

기본 방향 예시:

```text
┌─────────────────────────────────────────────────────┐
│ PROJECT SPY                    OPERATION / TURN      │
├───────────────┬───────────────────────────┬─────────┤
│               │                           │         │
│ INTELLIGENCE  │                           │ AGENTS  │
│ / REPORT      │         3D CITY           │         │
│               │                           │         │
│               │                           │         │
├───────────────┴───────────────────────────┴─────────┤
│ ORDER / COMMAND / TURN CONTROL                     │
└─────────────────────────────────────────────────────┘
```

이 레이아웃은 **예시이며 고정 규칙이 아니다.**

핵심 원칙:

- 3D 도시가 중심
- 좌우 패널은 상황에 따라 접거나 축소 가능
- 명령 UI는 필요한 순간에만 확장
- 화면 대부분을 UI Panel이 차지하지 않음
- 동일한 중요도의 카드가 반복되는 구조를 피함

---

# 9. Panel 디자인

Panel은 다음 성격을 가진다.

```text
Flat
Sharp
Structured
Thin border
Low contrast
Minimal radius
```

Corner Radius 권장:

```text
2px ~ 6px
```

Border는 구조를 구분하기 위한 용도로만 사용한다.

가능하면:

- Background tone
- Spacing
- Typography

로 구분하고 Border 남발을 피한다.

---

# 10. Button 디자인

버튼은 웹 SaaS처럼 만들지 않는다.

## Primary Command

예:

```text
CONFIRM ORDERS
EXECUTE
LOCK ORDERS
```

명확하고 직선적인 형태.

## Secondary

예:

```text
CANCEL
DETAILS
BACK
```

시각적 중요도를 낮춘다.

모든 버튼에는 다음 상태가 있어야 한다.

- Default
- Hover
- Focus
- Active
- Disabled
- Dangerous

---

# 11. Agent UI

Agent는 단순 캐릭터 목록이 아니라 **정보기관 자산(Asset)** 처럼 표현한다.

예:

```text
A-017
────────────
ACTIVE

LOCATION
SECTOR 04

CURRENT ORDER
INVESTIGATE

SIGNAL
STABLE
```

가능하면 Character Portrait보다 다음 정보가 우선이다.

- Agent ID
- Status
- Current command
- Position
- Intelligence state

Portrait 사용 여부:

`TBD`

---

# 12. 불확실한 정보 표현

Project Spy에서는 확실한 정보와 불확실한 정보를 시각적으로 구분해야 한다.

예:

### Confirmed

```text
LOCATION CONFIRMED
```

강한 텍스트.

### Estimated

```text
PROBABLE LOCATION
```

낮은 대비.

### Unknown

```text
SIGNAL LOST
```

### Suspicious

Amber 계열.

---

# 13. Turn UI

턴의 상태는 매우 명확해야 한다.

예:

```text
TURN 04

PLANNING
```

상대가 준비되지 않은 경우:

```text
YOU         READY
OPPONENT    PENDING
```

실행 단계:

```text
ORDERS LOCKED

EXECUTION PHASE
```

---

# 14. Motion Design

Project Spy에서 Motion은 장식이 아니라 **상태 변화 전달 수단**이다.

원칙:

- 짧게
- 정확하게
- 이유가 있을 때만
- Easing을 일관되게
- 반복 애니메이션 최소화
- 불필요한 Bounce 금지
- Spring 효과 남발 금지

좋은 Motion 예:

```text
TURN 04
↓
ORDERS AVAILABLE
```

```text
ORDER CONFIRMED
↓
LOCK
↓
EXECUTION
```

```text
ACTIVE
↓
SIGNAL LOST
↓
COMPROMISED
```

---

# 15. Scan / Glitch 효과

사용 가능하지만 매우 제한한다.

## 허용

- 정보가 해독될 때
- 통신 방해
- Agent signal loss
- 비밀 데이터 복호화
- 적 정보 탈취

## 금지

- 항상 화면에 Scanline
- 지속적인 Glitch
- 모든 Hover에 Glitch
- 장식용 CRT Effect

---

# 16. 3D Scene + UI Integration

3D 도시와 UI는 서로 독립된 화면처럼 보이지 않아야 한다.

## Agent 선택

```text
3D Agent
↓
Subtle highlight
↓
Agent Panel update
```

## Building 선택

```text
Building
↓
Thin outline / subtle highlight
↓
Location information
```

큰 빛기둥이나 과도한 Glow보다 다음을 우선한다.

- Outline
- Ground marker
- Small tactical indicator

---

# 17. 3D 후처리

Post Processing은 최소화한다.

가능한 후보:

- subtle vignette
- restrained color grading
- very mild bloom
- subtle depth
- localized outline

금지:

- 강한 Bloom
- 과한 Chromatic Aberration
- 지속적 Film Grain
- 과도한 DOF
- 화면을 흐리게 만드는 효과

---

# 18. 메인 화면 / 로비

게임 HUD와 다르게 조금 더 영화적인 표현을 허용한다.

가능한 방향:

```text
PROJECT SPY

CLASSIFIED OPERATIONS NETWORK
```

또는:

```text
SECURE CONNECTION
ESTABLISHING...
```

허용:

- 큰 Typography
- Negative Space
- Cinematic transition
- 제한적 3D background
- 간결한 Mission/Room UI

금지:

- 일반 SaaS Landing Page
- Hero + CTA + Feature Cards 구조
- 과도한 Marketing Website 느낌

---

# 19. Mission Briefing

작전 브리핑 화면은 영화적 연출을 사용할 수 있다.

예:

```text
OPERATION // XXXXX

LOCATION
TBD

OBJECTIVE
TBD

INTELLIGENCE LEVEL
CLASSIFIED
```

지도, 문서, 데이터 패널을 활용한다.

---

# 20. 결과 화면

결과 화면은 단순히:

```text
VICTORY
```

만 보여주지 않는다.

가능한 방향:

```text
OPERATION COMPLETE

INTELLIGENCE SECURED
AGENTS LOST
TURN COUNT
FINAL STATUS
```

배신자 공개 같은 중요 이벤트가 있다면 별도의 연출을 허용한다.

---

# 21. Shadcn 사용 원칙

shadcn/ui는 구현 기반으로 사용한다.

사용 가능한 요소:

- Dialog
- Tooltip
- Dropdown
- Button
- Tabs
- Sheet
- Context Menu
- Table

하지만 기본 shadcn 디자인을 그대로 사용하지 않는다.

Project Spy의:

- radius
- spacing
- typography
- color
- border

에 맞게 수정한다.

---

# 22. 디자인 관련 Codex Skill 전략

모든 디자인 Skill을 동시에 적용하지 않는다.

Skill은 역할별로 사용한다.

## 22.1 Primary — Impeccable

역할:

**전체 Art Direction / UI Quality / Polish**

사용 시점:

- 주요 화면 신규 디자인
- 기존 화면 재설계
- 디자인 평가
- 최종 Polish

예시 요청:

```text
Use Impeccable to redesign this interface.

Follow the Project Spy UI design document.
Do not introduce cyberpunk clichés or generic SaaS patterns.
```

Impeccable을 Project Spy의 기본 Design Director 역할로 사용한다.

---

## 22.2 UI UX Pro Max

역할:

**Design research / Palette / Typography / Pattern exploration**

사용 시점:

- 새로운 화면을 만들기 전
- 디자인 후보 비교
- 색상 또는 폰트 시스템 검토
- UX Pattern 조사

이 Skill의 결과가 Project Spy 디자인 문서와 충돌하면 **이 문서를 우선한다.**

---

## 22.3 shadcn

역할:

**실제 React UI Component 구현**

사용 시점:

- Dialog
- Tooltip
- Button
- Table
- Context Menu
- Sheet
- 기타 UI Component 구현

---

## 22.4 Motion Design Skill

역할:

**UI Motion / Transition / Micro-interaction**

사용 시점:

- Turn transition
- Status transition
- Alert
- Briefing
- Result
- Loading
- Agent state change

모션은 반드시 의미를 가져야 한다.

---

## 22.5 R3F Skills

역할:

**React Three Fiber / 3D Scene 품질**

추천 영역:

- r3f-fundamentals
- r3f-lighting
- r3f-loaders
- r3f-animation
- r3f-interaction
- r3f-postprocessing

사용 시점:

- 3D Agent 선택
- 3D 도시
- 카메라
- Interaction
- Animation
- Outline
- Post Processing

---

## 22.6 better-interface

역할:

**최종 UI 세부 검토**

필요한 경우 개별 스킬:

- better-typography
- better-colors
- better-layout
- better-accessibility

전체 디자인을 다시 만들기보다 특정 문제를 개선할 때 사용한다.

---

## 22.7 Premium Frontend UI

역할:

**영화적인 화면**

사용 가능:

- Main Menu
- Mission Briefing
- Operation Start
- Result
- Mole Reveal
- Major story transition

메인 게임 HUD 전체에는 우선 적용하지 않는다.

---

## 22.8 Taste Skill

역할:

**Landing / Main Menu 계열에서 AI Generic Design 제거**

사용 가능:

- Project Spy 첫 화면
- Room Create / Join
- 소개 화면

사용하지 않을 곳:

- 정보 밀도가 높은 게임 HUD
- 복잡한 Agent management interface

---

## 22.9 Web Design Guidelines

역할:

**최종 Web UX / Accessibility 검수**

UI 구현 후 검토용으로 사용한다.

---

## 22.10 React Best Practices

역할:

**React / Next.js 성능 검수**

특히 다음 문제를 확인한다.

- 불필요한 Re-render
- 3D Scene까지 영향을 주는 UI state
- 과도한 Client component
- Bundle size
- Heavy component loading

---

# 23. Skill 우선순위

충돌하는 경우 아래 우선순위를 따른다.

```text
1. Project Spy UI Design Document
2. 사용자가 직접 지정한 요구사항
3. Impeccable
4. UI UX Pro Max
5. shadcn / Motion / R3F implementation skill
6. better-interface / Web guideline review
7. 기타 외부 Skill
```

외부 Skill이 이 문서의 디자인 방향과 충돌하면 **이 문서를 우선한다.**

---

# 24. 권장 디자인 Workflow

새 화면을 만드는 경우:

```text
1. 화면 목적 정의
↓
2. 필요한 정보 우선순위 정리
↓
3. UI UX Pro Max로 패턴 탐색 (필요 시)
↓
4. Project Spy 디자인 문서 확인
↓
5. Impeccable로 디자인
↓
6. shadcn 기반 컴포넌트 구현
↓
7. Motion Design 적용
↓
8. R3F Scene과 연결
↓
9. better-interface 검수
↓
10. React Best Practices 검수
```

---

# 25. Codex 구현 규칙

Codex는 UI 작업 시 다음을 반드시 지킨다.

1. 먼저 이 문서를 읽는다.
2. 화면 목적을 이해한 뒤 구현한다.
3. 단순히 예쁜 UI를 만들지 않는다.
4. 정보 우선순위를 먼저 정한다.
5. 기존 Project Spy 디자인 시스템을 재사용한다.
6. 새로운 색상을 임의로 계속 추가하지 않는다.
7. Radius / Border / Spacing을 일관되게 유지한다.
8. UI Component를 불필요하게 중복 생성하지 않는다.
9. 게임 로직과 Visual UI를 분리한다.
10. UI state 변경이 불필요하게 전체 3D Scene을 re-render하지 않게 한다.
11. 중요한 상태는 색상만으로 전달하지 않는다.
12. Hover뿐 아니라 Keyboard Focus 상태도 구현한다.
13. Motion은 상태 전달 목적이 있을 때만 사용한다.
14. Screen size 변화에도 UI가 망가지지 않도록 한다.
15. 사용자가 요청하지 않은 게임 기획 요소를 UI 작업 중 임의로 추가하지 않는다.

---

# 26. 디자인 시스템 파일 구조 권장

```text
src/
├─ components/
│  ├─ ui/
│  ├─ game/
│  └─ hud/
│
├─ styles/
│  ├─ tokens.css
│  └─ globals.css
│
└─ lib/
   └─ design/
```

권장:

```text
tokens.css
```

에 다음을 통합한다.

- Colors
- Spacing
- Radius
- Typography
- Animation duration
- Z-index
- Border

---

# 27. CSS Token 예시

```css
:root {
  --spy-bg-primary: #090D12;
  --spy-bg-secondary: #0F151C;
  --spy-bg-elevated: #151D26;

  --spy-text-primary: #E8EDF2;
  --spy-text-secondary: #98A5B3;
  --spy-text-muted: #667482;

  --spy-border-subtle: #26313D;

  --spy-info: #6FAFC1;
  --spy-warning: #D0A85C;
  --spy-critical: #B85C5C;
  --spy-success: #6F9E82;

  --spy-radius-sm: 2px;
  --spy-radius-md: 4px;
  --spy-radius-lg: 6px;
}
```

코드에 임의의 색상 Hex를 반복해서 하드코딩하지 않는다.

---

# 28. 접근성

세련된 디자인보다 접근성을 우선해야 하는 경우 접근성을 우선한다.

필수:

- 충분한 Contrast
- Keyboard navigation
- Focus indication
- 버튼 Hit area 확보
- 색상 외 상태 표현
- Tooltip에만 중요한 정보를 숨기지 않음
- Motion reduction 대응 검토

---

# 29. Performance

Project Spy는 React UI와 React Three Fiber를 동시에 사용한다.

따라서 UI 디자인이 3D Performance를 해치면 안 된다.

주의:

- 불필요한 Blur
- 큰 Backdrop Filter
- 과도한 DOM Overlay
- 실시간으로 움직이는 다수의 UI
- 모든 프레임 React State 업데이트
- Heavy SVG animation
- 무분별한 post processing

UI Animation은 가능하면:

- CSS Transform
- Opacity

중심으로 구현한다.

---

# 30. 화면별 디자인 강도

## 게임 HUD

```text
Minimal
Functional
Precise
Low visual noise
```

## Main Menu

```text
More cinematic
More typography
More negative space
```

## Mission Briefing

```text
Cinematic
Classified document
Intelligence analysis
```

## Execution Phase

```text
Minimal UI
Focus on 3D city
```

## Result / Reveal

```text
Stronger motion
Stronger typography
Controlled dramatic presentation
```

---

# 31. 디자인 검수 체크리스트

## Visual

- [ ] Generic SaaS처럼 보이지 않는가?
- [ ] Cyberpunk cliché가 없는가?
- [ ] 과도한 Glow가 없는가?
- [ ] 의미 없는 Gradient가 없는가?
- [ ] 불필요하게 Rounded Card가 많지 않은가?
- [ ] 3D Scene을 지나치게 가리지 않는가?
- [ ] 정보 우선순위가 한눈에 보이는가?
- [ ] Primary / Secondary / Metadata가 구분되는가?
- [ ] Warning / Critical 색상이 남용되지 않았는가?

## Typography

- [ ] Sans / Mono 역할이 구분되는가?
- [ ] 모든 글자를 Mono로 만들지 않았는가?
- [ ] 숫자 / ID가 읽기 쉬운가?
- [ ] 작은 텍스트가 지나치게 작지 않은가?

## Interaction

- [ ] Hover 상태가 있는가?
- [ ] Focus 상태가 있는가?
- [ ] Disabled 상태가 구분되는가?
- [ ] 현재 선택 상태가 명확한가?

## Motion

- [ ] 애니메이션에 명확한 이유가 있는가?
- [ ] 반복 Motion이 산만하지 않은가?
- [ ] Alert가 실제로 중요한 순간에만 강한가?

## 3D

- [ ] 선택된 Agent가 명확한가?
- [ ] Location과 UI 정보가 연결되어 보이는가?
- [ ] Outline / Marker가 과도하지 않은가?
- [ ] Post Processing이 가독성을 해치지 않는가?

## Performance

- [ ] UI 변경이 3D Scene 전체 Re-render를 유발하지 않는가?
- [ ] 과도한 Blur / Filter가 없는가?
- [ ] Heavy component를 필요할 때만 Load하는가?

---

# 32. 현재 미정인 디자인 요소

아래 항목은 임의로 확정하지 않는다.

- 최종 게임명
- Logo
- 최종 Color Palette
- Character Portrait 방식
- 도시의 최종 Art Style
- Camera 스타일
- Mission Briefing 최종 Layout
- Agent Panel 최종 Layout
- Main Menu 최종 Layout
- UI Sound Style
- Game Logo Typography
- Faction 색상
- 정보기관 Logo / Symbol

필요할 때 디자인 후보를 제안하되 사용자 승인 없이 프로젝트 전체 규칙으로 확정하지 않는다.

---

# 33. 최종 목표

Project Spy UI의 목표는:

> **화려한 SF UI가 아니라, 매우 정교하고 현대적인 정보기관 작전 시스템을 플레이하는 느낌을 주는 것.**

플레이어가 화면을 보았을 때:

```text
"AI가 만든 SF 웹사이트"
```

가 아니라

```text
"실제 첩보기관의 비밀 작전 시스템을 게임으로 만든 것 같다"
```

라고 느껴야 한다.

---

# 34. Codex용 요약 지시

```text
Project Spy is a near-future espionage thriller web game.

Design the interface as a refined intelligence operations system,
not as cyberpunk entertainment UI.

Prioritize information hierarchy, precision, restraint,
typography, tactical readability, and meaningful motion.

Avoid generic AI SaaS aesthetics, excessive cards,
glassmorphism, neon cyan, purple gradients, excessive glow,
and decorative sci-fi elements without function.

The 3D city is the visual center of the game.
UI should support the scene, not cover it.

Use the Project Spy design document as the highest-priority
visual design source.
```
