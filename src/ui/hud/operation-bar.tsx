import { LockKeyhole, WalletCards } from "lucide-react";

interface OperationBarProps {
  readonly callsign: string;
  readonly turn: number;
  readonly phase: "ROSTER" | "GENERAL" | "MOLE" | "EXECUTION" | "RESULTS";
  readonly seconds: number;
  readonly team: "BLUE" | "RED";
  readonly availableFunds: number;
  readonly draftCost: number;
  readonly draftedAgents: number;
  readonly activeAgents: number;
  readonly phaseNotice?: string | null;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function OperationBar({
  callsign,
  turn,
  phase,
  seconds,
  team,
  availableFunds,
  draftCost,
  draftedAgents,
  activeAgents,
  phaseNotice,
}: OperationBarProps) {
  const phaseLabel = {
    ROSTER: "명단 은닉",
    GENERAL: "일반 명령",
    MOLE: "배신자 명령",
    EXECUTION: "명령 수행",
    RESULTS: "결과 통보",
  }[phase];
  const phaseIsTimed =
    phase === "GENERAL" || phase === "MOLE" || phase === "RESULTS";
  const formattedTime = phaseIsTimed ? String(seconds).padStart(2, "0") : "--";
  return (
    <header
      className="operation-bar"
      data-clock-urgent={phaseIsTimed && seconds <= 5 ? "true" : undefined}
    >
      <div className="operation-brand">
        <div>
          <strong>PROJECT SPY</strong>
          <span>
            {callsign} · {team} 국장
          </span>
        </div>
      </div>

      <div className="phase-summary">
        <span>{turn}턴</span>
        <strong>{phaseLabel}</strong>
        <time
          data-testid="phase-clock"
          dateTime={phaseIsTimed ? `PT${seconds}S` : undefined}
          aria-label={phaseIsTimed ? `${seconds}초 남음` : "제한 시간 없음"}
        >
          {formattedTime}
        </time>
      </div>

      <div className="operation-metrics">
        <div className="metric">
          <WalletCards aria-hidden="true" />
          <span>사용 가능</span>
          <strong>{money.format(availableFunds)}</strong>
        </div>
        <div className="metric">
          <LockKeyhole aria-hidden="true" />
          <span>초안</span>
          <strong>
            {draftedAgents}/{activeAgents} · {money.format(draftCost)}
          </strong>
        </div>
        <span className={`team-badge team-badge--${team.toLowerCase()}`}>
          {team}
        </span>
      </div>
      {phaseNotice ? (
        <p
          className="phase-timeout-notice"
          data-testid="phase-notice"
          role="status"
        >
          {phaseNotice}
        </p>
      ) : null}
    </header>
  );
}
