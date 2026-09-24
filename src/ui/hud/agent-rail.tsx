import {
  Check,
  CheckCircle2,
  CircleDot,
  Crosshair,
  Dice5,
  RotateCcw,
  Shield,
  TimerReset,
  XCircle,
} from "lucide-react";

import { toGridLabel } from "@/presentation-3d/coordinates/logical-to-world";
import type {
  ControlledMoleView,
  OwnAgentView,
} from "@/shared/contracts/player-projection";

interface AgentRailProps {
  readonly agents: readonly OwnAgentView[];
  readonly controlledMole: ControlledMoleView | null;
  readonly selectedAgentId: string | null;
  readonly onSelectAgent: (agentId: string) => void;
  readonly onReviewOrders?: () => void;
  readonly previousTurnOrders?: Readonly<Record<string, AgentPreviousTurnView>>;
  readonly liveResults?: Readonly<Record<string, AgentPreviousTurnView>>;
  readonly live?: boolean;
  readonly onRestartSameSeed?: () => void;
  readonly onRestartNewSeed?: () => void;
}

export interface AgentPreviousTurnView {
  readonly orderLabel: string;
  readonly succeeded: boolean;
  readonly resultLabel: string;
}

const actionLabel = {
  MOVE_ONLY: "이동만",
  INVESTIGATE: "조사",
  ASSASSINATE: "암살",
  HACK: "해킹",
} as const;

const primaryLabel = {
  MOVE: "이동",
  WAIT: "대기",
  INTERROGATE: "심문",
  PURGE: "숙청",
} as const;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function draftSummary(agent: OwnAgentView) {
  if (!agent.draft) return "자동 대기 · $0";
  const start = toGridLabel(agent.draft.origin);
  const destination = toGridLabel(agent.draft.destination);
  const action = agent.draft.arrivalAction
    ? actionLabel[agent.draft.arrivalAction]
    : primaryLabel[agent.draft.primaryAction];
  const route =
    agent.draft.path.length > 0 ? `${start} → ${destination}` : start;
  return `${route} · ${action} · ${money.format(agent.draft.cost)}`;
}

export function AgentRail({
  agents,
  controlledMole,
  selectedAgentId,
  onSelectAgent,
  onReviewOrders,
  previousTurnOrders = {},
  liveResults = {},
  live = false,
  onRestartSameSeed,
  onRestartNewSeed,
}: AgentRailProps) {
  return (
    <aside className="agent-rail" aria-labelledby="agent-rail-title">
      <header className="agent-rail__header">
        <div>
          <h2 id="agent-rail-title">요원 현황</h2>
        </div>
        <strong>
          {agents.filter((agent) => agent.status === "ACTIVE").length}/
          {agents.length}
        </strong>
      </header>
      <div className="agent-list">
        {agents.map((agent) => {
          const selected = selectedAgentId === agent.id;
          const previousTurn = previousTurnOrders[agent.id];
          const liveResult = liveResults[agent.id];
          return (
            <button
              type="button"
              key={agent.id}
              className="agent-card"
              data-selected={selected ? "true" : undefined}
              onClick={() => onSelectAgent(agent.id)}
              aria-pressed={selected}
              aria-label={`요원 ${agent.callsign} 선택 · ${toGridLabel(agent.coordinate)}`}
            >
              <span className="agent-card__identity">
                <span className="agent-sigil">{agent.callsign}</span>
                <span>
                  <strong>요원 {agent.callsign}</strong>
                  <small>
                    {toGridLabel(agent.coordinate)} ·{" "}
                    {agent.status === "ACTIVE" ? "활동 중" : "충원 대기"}
                  </small>
                </span>
              </span>
              <span className="agent-specialty">
                <Crosshair aria-hidden="true" />
                {agent.specialty}
              </span>
              {agent.carrying ? (
                <span className="agent-carrying">
                  <Shield aria-hidden="true" />
                  {agent.carrying} 동행
                </span>
              ) : null}
              {previousTurn && !live ? (
                <span
                  className="agent-previous-order"
                  data-result={previousTurn.succeeded ? "success" : "failure"}
                >
                  {previousTurn.succeeded ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <XCircle aria-hidden="true" />
                  )}
                  <span>
                    <small>이전 턴</small>
                    {previousTurn.orderLabel} · {previousTurn.resultLabel}
                  </span>
                </span>
              ) : null}
              {live && liveResult ? (
                <span
                  className="agent-previous-order agent-live-result"
                  data-result={liveResult.succeeded ? "success" : "failure"}
                  aria-live="polite"
                >
                  {liveResult.succeeded ? (
                    <CheckCircle2 aria-hidden="true" />
                  ) : (
                    <XCircle aria-hidden="true" />
                  )}
                  <span>
                    <small>실시간 결과</small>
                    {liveResult.orderLabel} · {liveResult.resultLabel}
                  </span>
                </span>
              ) : null}
              <span
                className="agent-draft"
                data-saved={agent.draft ? "true" : undefined}
              >
                {agent.draft ? (
                  <Check aria-hidden="true" />
                ) : (
                  <TimerReset aria-hidden="true" />
                )}
                <span>
                  {draftSummary(agent)}
                  <small>
                    {agent.draft?.savedLabel ?? "미지정 시 시간초과에 대기"}
                  </small>
                </span>
              </span>
              <span className="agent-card__select">
                <CircleDot aria-hidden="true" />
                {selected ? "선택됨" : "명령 작성"}
              </span>
            </button>
          );
        })}
        {controlledMole ? (
          <article
            className="agent-card agent-card--mole"
            data-testid="controlled-mole-card"
          >
            <span className="agent-card__identity">
              <span className="agent-sigil">{controlledMole.callsign}</span>
              <span>
                <strong>배신자 요원 {controlledMole.callsign}</strong>
                <small>
                  {toGridLabel(controlledMole.coordinate)} · 위장 소속{" "}
                  {controlledMole.nominalTeam}
                </small>
              </span>
            </span>
            <span className="agent-specialty">
              <Crosshair aria-hidden="true" /> 비공개 통제 요원
            </span>
            {live && liveResults[controlledMole.id] ? (
              <span
                className="agent-previous-order agent-live-result"
                data-result={
                  liveResults[controlledMole.id]!.succeeded
                    ? "success"
                    : "failure"
                }
                aria-live="polite"
              >
                {liveResults[controlledMole.id]!.succeeded ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <XCircle aria-hidden="true" />
                )}
                <span>
                  <small>실시간 결과</small>
                  {liveResults[controlledMole.id]!.orderLabel} ·{" "}
                  {liveResults[controlledMole.id]!.resultLabel}
                </span>
              </span>
            ) : (
              <span className="agent-draft">
                <Shield aria-hidden="true" />
                <span>
                  항상 표시<small>배신자 명령 단계에서 직접 통제</small>
                </span>
              </span>
            )}
          </article>
        ) : null}
      </div>
      <button
        type="button"
        className="review-orders-button"
        disabled={!onReviewOrders}
        onClick={onReviewOrders}
      >
        전체 명령 검토
      </button>
      {onRestartSameSeed && onRestartNewSeed ? (
        <div className="agent-rail__restart" aria-label="훈련 재시작">
          <button type="button" onClick={onRestartSameSeed}>
            <RotateCcw aria-hidden="true" /> 같은 시드
          </button>
          <button type="button" onClick={onRestartNewSeed}>
            <Dice5 aria-hidden="true" /> 새 시드
          </button>
        </div>
      ) : null}
    </aside>
  );
}
