import { Banknote, FileSearch2, Radio, Target } from "lucide-react";

import type { FixturePlayerProjection } from "@/shared/contracts/player-projection";

interface MissionRailProps {
  readonly projection: FixturePlayerProjection;
  readonly availableFunds: number;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const objectiveStateLabel = {
  UNKNOWN: "미확인",
  LOCATED: "위치 확인",
  CARRIED: "운반 중",
  DELIVERED: "확보",
} as const;

export function MissionRail({ projection, availableFunds }: MissionRailProps) {
  return (
    <aside className="mission-rail" aria-label="임무·자금·첩보">
      <section className="rail-section">
        <header className="rail-heading">
          <Target aria-hidden="true" />
          <div>
            <h2>작전 목표</h2>
          </div>
        </header>
        <ol className="objective-list">
          {projection.objectives.map((objective, index) => (
            <li key={objective.id} data-state={objective.state.toLowerCase()}>
              <span className="objective-index">0{index + 1}</span>
              <span>
                {objective.label}
                <small>{objectiveStateLabel[objective.state]}</small>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="rail-section funds-section">
        <header className="rail-heading">
          <Banknote aria-hidden="true" />
          <div>
            <h2>공작 자금</h2>
          </div>
        </header>
        <dl>
          <div>
            <dt>턴 할당금</dt>
            <dd>{money.format(projection.funds.allocation)}</dd>
          </div>
          <div>
            <dt>비밀 계좌</dt>
            <dd>{money.format(projection.funds.bank)}</dd>
          </div>
          <div className="funds-total">
            <dt>사용 가능</dt>
            <dd>{money.format(availableFunds)}</dd>
          </div>
        </dl>
      </section>

      <section className="rail-section intel-section">
        <header className="rail-heading">
          <FileSearch2 aria-hidden="true" />
          <div>
            <h2>첩보 보고</h2>
          </div>
        </header>
        <ul className="intel-list">
          {projection.intelligence.map((item) => (
            <li key={item.id} data-tone={item.tone.toLowerCase()}>
              <Radio aria-hidden="true" />
              <span>{item.label}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
