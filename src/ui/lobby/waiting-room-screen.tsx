"use client";

import { ArrowLeft, UserRoundCheck } from "lucide-react";

interface WaitingRoomScreenProps {
  readonly callsign: string;
  readonly onBack: () => void;
  readonly onEnterOperation: () => void;
}

export function WaitingRoomScreen({
  callsign,
  onBack,
  onEnterOperation,
}: WaitingRoomScreenProps) {
  return (
    <main className="waiting-shell" data-testid="waiting-room">
      <header className="lobby-topbar">
        <div className="brand-lockup">
          <div>
            <strong>PROJECT SPY</strong>
          </div>
        </div>
        <button type="button" className="text-action" onClick={onBack}>
          <ArrowLeft aria-hidden="true" size={16} /> 로비로
        </button>
      </header>

      <section className="waiting-panel" aria-labelledby="waiting-heading">
        <div className="waiting-panel__title">
          <div>
            <h1 id="waiting-heading">훈련 준비</h1>
          </div>
          <span className="classified-stamp">자동 상대</span>
        </div>

        <div className="director-slots">
          <article className="director-slot director-slot--filled">
            <span>국장 A</span>
            <strong>{callsign}</strong>
            <small>
              <UserRoundCheck aria-hidden="true" size={15} /> 참가 완료
            </small>
          </article>
          <article className="director-slot">
            <span>국장 B</span>
            <strong>훈련 상대</strong>
            <small>결정론적 명령 준비 완료</small>
          </article>
        </div>

        <dl className="operation-parameters">
          <div>
            <dt>인원</dt>
            <dd>2인</dd>
          </div>
          <div>
            <dt>일반 명령</dt>
            <dd>50초</dd>
          </div>
          <div>
            <dt>배신자 명령</dt>
            <dd>10초</dd>
          </div>
          <div>
            <dt>방향</dt>
            <dd>가로 전용</dd>
          </div>
        </dl>

        <div className="fixture-notice">
          <p>
            지도 조작, 요원별 명령, 배신자 방해와 턴 판정을 한 흐름으로
            플레이합니다.
          </p>
          <button
            type="button"
            className="primary-action"
            onClick={onEnterOperation}
          >
            훈련 시작
          </button>
        </div>
      </section>
    </main>
  );
}
