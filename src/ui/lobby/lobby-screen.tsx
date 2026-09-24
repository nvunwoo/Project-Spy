"use client";

import { ArrowRight, KeyRound, RadioTower, ShieldCheck } from "lucide-react";
import { useState } from "react";

interface LobbyScreenProps {
  readonly onCreateFixture: (callsign: string) => void;
  readonly onOpenOperation: (callsign: string) => void;
}

export function LobbyScreen({
  onCreateFixture,
  onOpenOperation,
}: LobbyScreenProps) {
  const [callsign, setCallsign] = useState("국장 A");
  const [joinOpen, setJoinOpen] = useState(false);

  function safeCallsign() {
    return callsign.trim() || "국장 A";
  }

  return (
    <main className="lobby-shell" data-testid="lobby-screen">
      <header className="lobby-topbar">
        <div className="brand-lockup">
          <div>
            <strong>PROJECT SPY</strong>
          </div>
        </div>
        <div className="local-status">
          <span className="status-dot" aria-hidden="true" />
          로컬 훈련
        </div>
      </header>

      <section className="lobby-briefing" aria-labelledby="lobby-title">
        <div className="lobby-briefing__visual" aria-hidden="true">
          <div className="city-grid city-grid--back" />
          <div className="city-grid city-grid--front" />
          <div className="briefing-scan">
            <span>16×16 도시</span>
            <span>동시 명령</span>
            <span>가로 화면</span>
          </div>
        </div>

        <div className="lobby-briefing__copy">
          <h1 id="lobby-title">
            정보는 제한되고,
            <br />
            명령은 동시에 실행된다.
          </h1>
          <p>
            두 국장이 같은 도시에서 목표를 확보하고 조직 안의 배신자를 찾아내는
            1대1 동시 명령 첩보전입니다.
          </p>
          <dl className="briefing-stats">
            <div>
              <dt>대전</dt>
              <dd>1 대 1</dd>
            </div>
            <div>
              <dt>명령</dt>
              <dd>50초</dd>
            </div>
            <div>
              <dt>화면</dt>
              <dd>가로 전용</dd>
            </div>
          </dl>
        </div>

        <form
          className="access-terminal"
          onSubmit={(event) => {
            event.preventDefault();
            onCreateFixture(safeCallsign());
          }}
        >
          <div className="terminal-heading">
            <div>
              <h2>호출명 설정</h2>
            </div>
            <ShieldCheck aria-hidden="true" size={23} />
          </div>

          <label htmlFor="callsign">호출명</label>
          <input
            id="callsign"
            name="callsign"
            value={callsign}
            maxLength={24}
            autoComplete="nickname"
            onChange={(event) => setCallsign(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && event.nativeEvent.isComposing) {
                event.preventDefault();
              }
            }}
          />
          <p className="field-help">
            표시 이름입니다. 인증 또는 권한에는 사용하지 않습니다.
          </p>

          <button type="submit" className="primary-action">
            <RadioTower aria-hidden="true" size={18} />
            훈련 대기실
            <ArrowRight aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            className="secondary-action"
            onClick={() => setJoinOpen((open) => !open)}
          >
            <KeyRound aria-hidden="true" size={18} /> 온라인 방 참가
          </button>

          {joinOpen ? (
            <div
              className="join-fixture"
              role="region"
              aria-label="초대 링크 입력"
            >
              <label htmlFor="invite">초대 링크</label>
              <input
                id="invite"
                name="invite"
                placeholder="https://…/#invite=…"
                disabled
              />
              <p>
                온라인 대전은 아직 준비 중입니다. 현재는 자동 상대와 로컬 훈련을
                진행할 수 있습니다.
              </p>
            </div>
          ) : null}

          <div className="terminal-divider">
            <span>또는</span>
          </div>
          <button
            type="button"
            className="text-action"
            onClick={() => onOpenOperation(safeCallsign())}
          >
            바로 훈련 시작
            <ArrowRight aria-hidden="true" size={16} />
          </button>
        </form>
      </section>

      <footer className="lobby-footer">
        <span>로컬 훈련</span>
        <span>PC · 태블릿 가로 화면</span>
      </footer>
    </main>
  );
}
