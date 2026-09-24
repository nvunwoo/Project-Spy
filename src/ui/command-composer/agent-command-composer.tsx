"use client";

import {
  AlertOctagon,
  ArrowLeft,
  Check,
  Crosshair,
  Footprints,
  ScanSearch,
  ShieldAlert,
  Skull,
  Terminal,
  UserSearch,
} from "lucide-react";
import { useEffect, useRef, type ReactNode, type Ref } from "react";

import { toGridLabel } from "@/presentation-3d/coordinates/logical-to-world";
import type {
  OwnAgentView,
  VisibleOpponentView,
} from "@/shared/contracts/player-projection";
import type {
  ComposerEvent,
  ComposerState,
} from "@/ui/command-composer/command-reducer";
import { getComposerStep } from "@/ui/command-composer/command-selectors";
import { Button } from "@/ui/primitives/button";
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from "@/ui/primitives/panel";
import { StatusChip } from "@/ui/primitives/status-chip";

interface AgentCommandComposerProps {
  readonly state: ComposerState;
  readonly agent: OwnAgentView | null;
  readonly visibleOpponents: readonly VisibleOpponentView[];
  readonly availableFunds: number;
  readonly hackFacilityId?: string | null;
  readonly compact?: boolean;
  readonly onEvent: (event: ComposerEvent) => void;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function ActionButton({
  title,
  detail,
  icon,
  dangerous = false,
  disabled = false,
  reason,
  buttonRef,
  onClick,
}: {
  readonly title: string;
  readonly detail: string;
  readonly icon: ReactNode;
  readonly dangerous?: boolean;
  readonly disabled?: boolean;
  readonly reason?: string;
  readonly buttonRef?: Ref<HTMLButtonElement>;
  readonly onClick: () => void;
}) {
  return (
    <Button
      type="button"
      ref={buttonRef}
      variant={dangerous ? "dangerous" : "secondary"}
      className="command-action"
      disabled={disabled}
      onClick={onClick}
      title={disabled ? reason : undefined}
    >
      {icon}
      <span>
        <strong>{title}</strong>
        <small>{disabled && reason ? reason : detail}</small>
      </span>
    </Button>
  );
}

export function AgentCommandComposer({
  state,
  agent,
  visibleOpponents,
  availableFunds,
  hackFacilityId = null,
  compact = false,
  onEvent,
}: AgentCommandComposerProps) {
  const confirmPurgeRef = useRef<HTMLButtonElement>(null);
  const commandTitleRef = useRef<HTMLHeadingElement>(null);
  const purgeDialogRef = useRef<HTMLDialogElement>(null);
  const purgeTriggerRef = useRef<HTMLButtonElement>(null);
  const previousComposerTypeRef = useRef(state.type);

  useEffect(() => {
    if (state.type !== "purge-confirm") return;
    const dialog = purgeDialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    confirmPurgeRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [state.type]);

  useEffect(() => {
    const previousType = previousComposerTypeRef.current;
    previousComposerTypeRef.current = state.type;
    if (previousType === "purge-confirm" && state.type !== "purge-confirm") {
      purgeTriggerRef.current?.focus();
      return;
    }
    if (state.type === "primary" && agent) {
      commandTitleRef.current?.focus();
    }
  }, [agent, state.type]);

  if (state.type === "idle" || !agent) {
    if (compact) return null;
    return (
      <aside className="command-hint" aria-live="polite">
        <Crosshair aria-hidden="true" />
        <span>
          <strong>명령 대기</strong> 지도 또는 우측 목록에서 자기 요원을
          선택하십시오.
        </span>
      </aside>
    );
  }

  // Completion is a transient reducer event. The parent saves the draft and
  // immediately resets to idle so issuing an order is the final interaction.
  if (state.type === "complete") return null;

  if (compact && state.type === "reachable") return null;

  const titleId = "agent-command-title";
  const path = "path" in state ? state.path : [];
  const movementCost = path.length * 200;
  const originLabel = toGridLabel(agent.coordinate);
  const destination =
    "destination" in state ? state.destination : agent.coordinate;
  const destinationLabel = toGridLabel(destination);
  const canAfford = (cost: number) => availableFunds >= cost;
  const eligibleOpponents = visibleOpponents.filter(
    (opponent) =>
      Math.abs(opponent.coordinate.row - destination.row) <= 1 &&
      Math.abs(opponent.coordinate.col - destination.col) <= 1,
  );

  return (
    <Panel
      className={`command-panel${compact ? " command-panel--map" : ""}`}
      tone={state.type === "purge-confirm" ? "critical" : "info"}
      aria-labelledby={titleId}
      data-state={state.type}
    >
      <PanelHeader>
        <div>
          <StatusChip tone="info">{getComposerStep(state)}</StatusChip>
          <PanelTitle ref={commandTitleRef} id={titleId} tabIndex={-1}>
            요원 {agent.callsign} 명령 작성
          </PanelTitle>
          <PanelDescription>
            {originLabel} · {agent.specialty}
          </PanelDescription>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="명령 작성 한 단계 뒤로"
          onClick={() => onEvent({ type: "BACK" })}
        >
          <ArrowLeft aria-hidden="true" />
        </Button>
      </PanelHeader>

      <PanelContent>
        {state.type === "primary" ? (
          <div
            className="command-grid"
            aria-label={`요원 ${agent.callsign} 1차 명령`}
          >
            <ActionButton
              title="이동"
              detail="칸당 $200"
              icon={<Footprints aria-hidden="true" />}
              onClick={() => onEvent({ type: "CHOOSE_MOVE" })}
            />
            <ActionButton
              title="대기"
              detail="$0"
              icon={<Check aria-hidden="true" />}
              onClick={() =>
                onEvent({ type: "CHOOSE_IMMEDIATE", action: "WAIT" })
              }
            />
            <ActionButton
              title="심문"
              detail="$1,000"
              icon={<UserSearch aria-hidden="true" />}
              disabled={!canAfford(1_000)}
              reason="자금 부족"
              onClick={() =>
                onEvent({ type: "CHOOSE_IMMEDIATE", action: "INTERROGATE" })
              }
            />
            <ActionButton
              title="숙청"
              detail="$2,000"
              icon={<Skull aria-hidden="true" />}
              dangerous
              buttonRef={purgeTriggerRef}
              disabled={!canAfford(2_000)}
              reason="자금 부족"
              onClick={() => onEvent({ type: "REQUEST_PURGE" })}
            />
          </div>
        ) : null}

        {state.type === "reachable" ? (
          <div className="command-instruction">
            <ScanSearch aria-hidden="true" />
            <h3>도착지를 지정하십시오</h3>
            <p>
              청록 격자는 공개 지형으로 계산한 이동 가능 범위입니다. 도착은 실행
              시 다시 판정됩니다.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                onEvent({
                  type: "SELECT_DESTINATION",
                  destination: agent.coordinate,
                  path: [],
                })
              }
            >
              현재 위치 {originLabel}에서 공작 · 0칸
            </Button>
          </div>
        ) : null}

        {state.type === "arrival" ? (
          <div>
            <div className="arrival-summary">
              <Terminal aria-hidden="true" />
              <span>
                <strong>
                  {originLabel} → {destinationLabel}
                </strong>
                <small>
                  {state.path.length}칸 · 이동 {money.format(movementCost)}
                </small>
              </span>
            </div>
            <div
              className="command-grid"
              aria-label={`요원 ${agent.callsign} 도착 후 공작`}
            >
              <ActionButton
                title="이동만"
                detail={`총 ${money.format(movementCost)}`}
                icon={<Footprints aria-hidden="true" />}
                disabled={!canAfford(movementCost)}
                reason="자금 부족"
                onClick={() =>
                  onEvent({ type: "CHOOSE_ARRIVAL", action: "MOVE_ONLY" })
                }
              />
              <ActionButton
                title="조사"
                detail={`총 ${money.format(movementCost + 1_000)}`}
                icon={<ScanSearch aria-hidden="true" />}
                disabled={!canAfford(movementCost + 1_000)}
                reason="자금 부족"
                onClick={() =>
                  onEvent({ type: "CHOOSE_ARRIVAL", action: "INVESTIGATE" })
                }
              />
              <ActionButton
                title="암살"
                detail={`총 ${money.format(movementCost + 2_000)}`}
                icon={<Crosshair aria-hidden="true" />}
                disabled={
                  eligibleOpponents.length === 0 ||
                  !canAfford(movementCost + 2_000)
                }
                reason={
                  eligibleOpponents.length === 0
                    ? "공개된 합법 대상 없음"
                    : "자금 부족"
                }
                onClick={() => onEvent({ type: "REQUEST_ASSASSINATION" })}
              />
              <ActionButton
                title="해킹"
                detail={`총 ${money.format(movementCost + 2_000)}`}
                icon={<Terminal aria-hidden="true" />}
                disabled={!hackFacilityId || !canAfford(movementCost + 2_000)}
                reason={
                  !hackFacilityId ? "이 위치에는 해킹 시설 없음" : "자금 부족"
                }
                onClick={() => {
                  if (hackFacilityId) {
                    onEvent({
                      type: "CHOOSE_ARRIVAL",
                      action: "HACK",
                      facilityId: hackFacilityId,
                    });
                  }
                }}
              />
            </div>
            <p className="command-note command-note--warning">
              이동이 실패하거나 차단되면 결합 공작도 취소되며 비용은 환불되지
              않습니다.
            </p>
          </div>
        ) : null}

        {state.type === "assassination-target" ? (
          <div className="target-list">
            <h3>암살 대상 지정</h3>
            <p>명령 시점 현재 위치의 3×3 안에서 공개된 대상만 표시합니다.</p>
            {eligibleOpponents.map((opponent) => (
              <Button
                key={opponent.id}
                type="button"
                variant="dangerous"
                onClick={() =>
                  onEvent({
                    type: "SELECT_ASSASSINATION_TARGET",
                    targetAgentId: opponent.id,
                  })
                }
              >
                <Crosshair aria-hidden="true" /> {opponent.label} ·{" "}
                {toGridLabel(opponent.coordinate)}
              </Button>
            ))}
          </div>
        ) : null}

        {state.type === "purge-confirm" ? (
          <dialog
            ref={purgeDialogRef}
            className="purge-warning"
            role="alertdialog"
            aria-labelledby="purge-title"
            aria-describedby="purge-description"
            onCancel={(event) => {
              event.preventDefault();
              onEvent({ type: "BACK" });
            }}
          >
            <AlertOctagon aria-hidden="true" />
            <h3 id="purge-title">요원 {agent.callsign} 숙청 초안</h3>
            <p id="purge-description">
              비용 $2,000. 요원이 제거되고 충원 대기에 들어갑니다. 무고하면 다음
              한 턴 동안 팀 전체 확률형 공작이 -10%p 적용됩니다.
            </p>
            <div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onEvent({ type: "BACK" })}
              >
                취소
              </Button>
              <Button
                ref={confirmPurgeRef}
                type="button"
                variant="dangerous"
                onClick={() => onEvent({ type: "CONFIRM_PURGE" })}
              >
                <Skull aria-hidden="true" /> 요원 {agent.callsign} 숙청 초안
                저장
              </Button>
            </div>
          </dialog>
        ) : null}
      </PanelContent>

      {state.type !== "purge-confirm" ? (
        <div className="composer-security-note">
          <ShieldAlert aria-hidden="true" /> 실행 전에 비용·경로·대상을 다시
          검증합니다.
        </div>
      ) : null}
    </Panel>
  );
}
