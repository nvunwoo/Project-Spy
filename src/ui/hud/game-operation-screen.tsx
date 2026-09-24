"use client";

import { ArrowLeft, Menu, Users } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";

import { sameCoordinate } from "@/domain/map/coordinates";
import { getMapCell } from "@/domain/map/map-manifest";
import type { GeneralOrder, MoleOrder } from "@/domain/orders/order-types";
import {
  resolveLocalTurn,
  startNextLocalTurn,
  type ResolveLocalTurnResult,
} from "@/domain/resolve-turn/resolve-turn";
import type { LocalTurnState } from "@/domain/resolve-turn/turn-state";
import {
  createFixtureMoleOrder,
  createFixtureOpponentOrders,
  createLocalTurnFixture,
  createNextLocalMatchSeed,
  DEFAULT_LOCAL_MATCH_SEED,
  getMoleColleagueCandidates,
  rosterPlacementCandidates,
} from "@/fixtures/local-turn-fixture";
import {
  getFixturePath,
  getFixtureReachableCells,
} from "@/game-client/fixture/operation-fixture";
import {
  createLocalPhaseDeadline,
  type LocalPhaseDeadline,
  type TimedLocalPlayPhase,
} from "@/game-client/fixture/local-phase-deadline";
import {
  buildExecutionPlayback,
  type ExecutionBeat,
} from "@/game-client/fixture/execution-playback";
import {
  opponentViewIdToCanonical,
  projectLocalMatchForTeam,
} from "@/game-client/fixture/local-match-view";
import type { SelectionIntent } from "@/presentation-3d/input/selection-intent";
import type { AgentDraftView } from "@/shared/contracts/player-projection";
import { AgentCommandComposer } from "@/ui/command-composer/agent-command-composer";
import {
  commandComposerReducer,
  initialComposerState,
  type ComposerDraft,
  type ComposerEvent,
  type ComposerState,
} from "@/ui/command-composer/command-reducer";
import { getDraftCost } from "@/ui/command-composer/command-selectors";
import { AgentRail, type AgentPreviousTurnView } from "@/ui/hud/agent-rail";
import {
  GeneralOrderControlDock,
  MoleOrderPanel,
  RosterPlacementDock,
} from "@/ui/hud/local-phase-panels";
import { MapViewport } from "@/ui/hud/map-viewport";
import { MissionRail } from "@/ui/hud/mission-rail";
import { OperationBar } from "@/ui/hud/operation-bar";
import { usePhaseCountdown } from "@/ui/hud/use-phase-countdown";

interface GameOperationScreenProps {
  readonly callsign: string;
  readonly onExit: () => void;
}

type LocalPlayPhase = "ROSTER" | "GENERAL" | "MOLE" | "EXECUTION" | "RESULTS";

interface OperationState {
  readonly composer: ComposerState;
  readonly drafts: Readonly<Record<string, AgentDraftView>>;
}

type OperationEvent = ComposerEvent | { readonly type: "CLEAR_TURN" };

interface PendingTurn {
  readonly beforeState: LocalTurnState;
  readonly blueOrders: readonly GeneralOrder[];
  readonly redOrders: readonly GeneralOrder[];
  readonly redMoleOrder?: MoleOrder;
  readonly blueMoleOrder?: MoleOrder;
}

const initialOperationState: OperationState = {
  composer: initialComposerState,
  drafts: {},
};

function toDraftView(draft: ComposerDraft): AgentDraftView {
  return {
    agentId: draft.agentId,
    origin: draft.origin,
    destination: draft.destination,
    path: draft.path,
    primaryAction: draft.primaryAction,
    arrivalAction: draft.arrivalAction,
    targetAgentId: draft.targetAgentId,
    hackFacilityId: draft.hackFacilityId,
    cost: getDraftCost(draft),
    savedLabel: "명령 저장됨",
  };
}

function operationReducer(
  state: OperationState,
  event: OperationEvent,
): OperationState {
  if (event.type === "CLEAR_TURN") return initialOperationState;
  const composer = commandComposerReducer(state.composer, event);
  if (composer.type === "complete" && state.composer.type !== "complete") {
    return {
      composer: initialComposerState,
      drafts: {
        ...state.drafts,
        [composer.draft.agentId]: toDraftView(composer.draft),
      },
    };
  }
  return { ...state, composer };
}

function getComposerAgentId(state: ComposerState): string | null {
  if (state.type === "idle") return null;
  if (state.type === "complete") return state.draft.agentId;
  return state.agentId;
}

function getComposerPath(state: ComposerState) {
  return "path" in state ? state.path : [];
}

function draftToOrder(draft: AgentDraftView): GeneralOrder {
  if (draft.primaryAction === "WAIT") {
    return { kind: "WAIT", agentId: draft.agentId };
  }
  if (draft.primaryAction === "INTERROGATE") {
    return { kind: "INTERROGATE", agentId: draft.agentId };
  }
  if (draft.primaryAction === "PURGE") {
    return { kind: "PURGE", agentId: draft.agentId };
  }
  if (!draft.arrivalAction) {
    throw new Error(`Agent ${draft.agentId} has an incomplete movement draft.`);
  }
  if (draft.arrivalAction === "HACK") {
    if (!draft.hackFacilityId)
      throw new Error("A hack draft needs a facility.");
    return {
      kind: "OPERATE",
      agentId: draft.agentId,
      path: draft.path,
      arrivalAction: { kind: "HACK", facilityId: draft.hackFacilityId },
    };
  }
  if (draft.arrivalAction === "ASSASSINATE") {
    const targetAgentId = draft.targetAgentId
      ? opponentViewIdToCanonical("BLUE", draft.targetAgentId)
      : null;
    if (!targetAgentId) {
      throw new Error("An assassination draft needs a visible target.");
    }
    return {
      kind: "OPERATE",
      agentId: draft.agentId,
      path: draft.path,
      arrivalAction: { kind: "ASSASSINATE", targetAgentId },
    };
  }
  return {
    kind: "OPERATE",
    agentId: draft.agentId,
    path: draft.path,
    arrivalAction: { kind: draft.arrivalAction },
  };
}

const arrivalOrderLabel = {
  MOVE_ONLY: "이동",
  INVESTIGATE: "이동 후 조사",
  ASSASSINATE: "이동 후 암살",
  HACK: "이동 후 해킹",
} as const;

function buildPreviousTurnOrders(
  pending: PendingTurn,
  result: ResolveLocalTurnResult,
): Readonly<Record<string, AgentPreviousTurnView>> {
  return Object.fromEntries(
    pending.blueOrders.map((order) => {
      const role = pending.beforeState.agents.find(
        (agent) => agent.id === order.agentId,
      )?.role;
      if (!role) {
        return [
          order.agentId,
          { orderLabel: "명령", succeeded: false, resultLabel: "실패" },
        ];
      }
      if (order.kind !== "OPERATE") {
        const orderLabel = {
          WAIT: "대기",
          INTERROGATE: "심문",
          PURGE: "숙청",
        }[order.kind];
        return [
          order.agentId,
          { orderLabel, succeeded: true, resultLabel: "성공" },
        ];
      }

      const movement = result.movementResults.find(
        (entry) => entry.agentId === order.agentId,
      );
      const movementSucceeded = order.path.length === 0 || movement?.success;
      if (!movementSucceeded) {
        return [
          order.agentId,
          {
            orderLabel: arrivalOrderLabel[order.arrivalAction.kind],
            succeeded: false,
            resultLabel: "이동 실패",
          },
        ];
      }
      if (order.arrivalAction.kind === "MOVE_ONLY") {
        return [
          order.agentId,
          { orderLabel: "이동", succeeded: true, resultLabel: "성공" },
        ];
      }

      const actionName = {
        INVESTIGATE: "조사",
        ASSASSINATE: "암살",
        HACK: "해킹",
      }[order.arrivalAction.kind];
      const actionReport = result.reports.BLUE.find(
        (report) =>
          report.message.startsWith(`요원 ${role} `) &&
          report.message.includes(actionName) &&
          (report.message.endsWith("성공") || report.message.endsWith("실패")),
      );
      const succeeded = actionReport?.message.endsWith("성공") ?? false;
      return [
        order.agentId,
        {
          orderLabel: arrivalOrderLabel[order.arrivalAction.kind],
          succeeded,
          resultLabel: succeeded ? "성공" : "실패",
        },
      ];
    }),
  );
}

export function GameOperationScreen({
  callsign,
  onExit,
}: GameOperationScreenProps) {
  const [operation, dispatch] = useReducer(
    operationReducer,
    initialOperationState,
  );
  const [phase, setPhase] = useState<LocalPlayPhase>("ROSTER");
  const [seed, setSeed] = useState(DEFAULT_LOCAL_MATCH_SEED);
  const [selectedRosterFacilityId, setSelectedRosterFacilityId] = useState<
    string | null
  >(null);
  const [match, setMatch] = useState<LocalTurnState>(() =>
    createLocalTurnFixture(),
  );
  const [pendingTurn, setPendingTurn] = useState<PendingTurn | null>(null);
  const [resolution, setResolution] = useState<ResolveLocalTurnResult | null>(
    null,
  );
  const [executionBeats, setExecutionBeats] = useState<
    readonly ExecutionBeat[]
  >([]);
  const [executionIndex, setExecutionIndex] = useState(0);
  const [liveAgentResults, setLiveAgentResults] = useState<
    Readonly<Record<string, AgentPreviousTurnView>>
  >({});
  const [previousTurnOrders, setPreviousTurnOrders] = useState<
    Readonly<Record<string, AgentPreviousTurnView>>
  >({});
  const [openRail, setOpenRail] = useState<"mission" | "agents" | null>(null);
  const [mapInteracting, setMapInteracting] = useState(false);
  const [phaseDeadline, setPhaseDeadline] = useState<LocalPhaseDeadline | null>(
    null,
  );
  const [phaseNotice, setPhaseNotice] = useState<string | null>(null);
  const phaseSubmissionRef = useRef<LocalPlayPhase | null>(null);
  const interactionRestoreTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const controlledMole = match.agents.find(
    (agent) => agent.status === "ACTIVE" && agent.moleController === "BLUE",
  );
  const remainingSeconds = usePhaseCountdown(phaseDeadline, () => {
    if (phase === "GENERAL") {
      lockGeneralOrders("timeout");
      return;
    }
    if (phase === "MOLE" && controlledMole) {
      chooseMoleOrder(
        { kind: "ACQUIESCE", moleAgentId: controlledMole.id },
        "timeout",
      );
      return;
    }
    if (phase === "RESULTS" && match.outcome.kind === "ONGOING") {
      nextTurn();
    }
  });

  const projection = useMemo(
    () =>
      projectLocalMatchForTeam({
        state: match,
        viewer: "BLUE",
        drafts: operation.drafts,
        remainingSeconds,
      }),
    [match, operation.drafts, remainingSeconds],
  );
  const agents = projection.agents;
  const selectedAgentId = getComposerAgentId(operation.composer);
  const selectedAgent =
    agents.find((agent) => agent.id === selectedAgentId) ?? null;
  const path = getComposerPath(operation.composer);
  const reachableCells = useMemo(() => {
    if (phase !== "GENERAL" || !selectedAgent) return [];
    if (operation.composer.type === "reachable") {
      return getFixtureReachableCells(selectedAgent);
    }
    return [];
  }, [selectedAgent, operation.composer, phase]);
  const draftCost = Object.values(operation.drafts).reduce(
    (total, draft) => total + draft.cost,
    0,
  );
  const commandPhase = phase === "GENERAL" || phase === "MOLE";
  const reservedDraftCost = commandPhase ? draftCost : 0;
  const availableFunds =
    projection.funds.allocation + projection.funds.bank - reservedDraftCost;
  const composerAvailableFunds =
    availableFunds +
    (selectedAgentId ? (operation.drafts[selectedAgentId]?.cost ?? 0) : 0);
  const activeAgents = agents.filter(
    (agent) => agent.status === "ACTIVE",
  ).length;
  const hackFacilityId = useMemo(() => {
    if (phase !== "GENERAL" || operation.composer.type !== "arrival") {
      return null;
    }
    const cell = getMapCell(match.map, operation.composer.destination);
    if (
      !cell.facilityId ||
      (cell.facilityKind !== "BANK" &&
        cell.facilityKind !== "COMMUNICATIONS") ||
      match.hackState.disabledFacilityIds.has(cell.facilityId)
    ) {
      return null;
    }
    return cell.facilityId;
  }, [match, operation.composer, phase]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        phase === "GENERAL" &&
        event.key === "Escape" &&
        operation.composer.type !== "idle"
      ) {
        event.preventDefault();
        dispatch({ type: "BACK" });
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [operation.composer.type, phase]);

  useEffect(() => {
    phaseSubmissionRef.current = null;
  }, [phase]);

  useEffect(
    () => () => {
      if (interactionRestoreTimer.current) {
        clearTimeout(interactionRestoreTimer.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (phase !== "EXECUTION" || !resolution || !pendingTurn) return;
    const beat = executionBeats[executionIndex];
    if (!beat) {
      const completionTimer = window.setTimeout(() => {
        const finalResults = buildPreviousTurnOrders(pendingTurn, resolution);
        setPreviousTurnOrders(finalResults);
        setLiveAgentResults((current) => ({ ...current, ...finalResults }));
        setMatch(resolution.resolvedState);
        setPhase("RESULTS");
        setPhaseDeadline(createLocalPhaseDeadline("RESULTS", Date.now()));
      }, 0);
      return () => window.clearTimeout(completionTimer);
    }

    let statusTimer: number | null = null;
    if (beat.cues.length > 0) {
      statusTimer = window.setTimeout(() => {
        setLiveAgentResults((current) => ({
          ...current,
          ...Object.fromEntries(
            beat.cues.map((cue) => [
              cue.agentId,
              {
                orderLabel: cue.label,
                succeeded: cue.succeeded,
                resultLabel: cue.succeeded ? "진행" : "실패",
              },
            ]),
          ),
        }));
      }, 0);
    }
    const timer = window.setTimeout(
      () => setExecutionIndex((index) => index + 1),
      beat.durationMs,
    );
    return () => {
      window.clearTimeout(timer);
      if (statusTimer !== null) window.clearTimeout(statusTimer);
    };
  }, [executionBeats, executionIndex, pendingTurn, phase, resolution]);

  const handleMapInteractionChange = useCallback((active: boolean) => {
    if (interactionRestoreTimer.current) {
      clearTimeout(interactionRestoreTimer.current);
      interactionRestoreTimer.current = null;
    }
    if (active) {
      setMapInteracting(true);
      return;
    }
    interactionRestoreTimer.current = setTimeout(
      () => setMapInteracting(false),
      420,
    );
  }, []);

  function selectAgent(agentId: string) {
    if (phase !== "GENERAL") return;
    const agent = agents.find((candidate) => candidate.id === agentId);
    if (!agent || agent.status !== "ACTIVE") return;
    dispatch({
      type: "SELECT_AGENT",
      agentId: agent.id,
      origin: agent.coordinate,
    });
    setOpenRail(null);
  }

  function handleIntent(intent: SelectionIntent) {
    if (intent.kind === "RESET_VIEW") return;
    if (phase === "ROSTER" && intent.kind === "CELL") {
      const candidate = rosterPlacementCandidates.find((entry) =>
        sameCoordinate(entry.coordinate, intent),
      );
      if (candidate) setSelectedRosterFacilityId(candidate.facilityId);
      return;
    }
    if (phase !== "GENERAL") return;
    if (intent.kind === "AGENT") {
      if (
        operation.composer.type === "reachable" &&
        intent.logicalId === selectedAgent?.id
      ) {
        dispatch({
          type: "SELECT_DESTINATION",
          destination: selectedAgent.coordinate,
          path: [],
        });
        return;
      }
      selectAgent(intent.logicalId);
      return;
    }
    if (operation.composer.type === "reachable") {
      if (!selectedAgent) return;
      const fixturePath = getFixturePath(selectedAgent, intent.row, intent.col);
      if (fixturePath) {
        dispatch({
          type: "SELECT_DESTINATION",
          destination: { row: intent.row, col: intent.col },
          path: fixturePath,
        });
      }
      return;
    }
  }

  function confirmRosterPlacement() {
    const normalizedSeed = seed.trim();
    if (!selectedRosterFacilityId || normalizedSeed.length === 0) return;
    setSeed(normalizedSeed);
    setMatch(
      createLocalTurnFixture({
        seed: normalizedSeed,
        blueRosterFacilityId: selectedRosterFacilityId,
      }),
    );
    dispatch({ type: "CLEAR_TURN" });
    setPhaseNotice(null);
    openTimedPhase("GENERAL");
  }

  function openTimedPhase(nextPhase: TimedLocalPlayPhase) {
    setPhase(nextPhase);
    setPhaseDeadline(createLocalPhaseDeadline(nextPhase, Date.now()));
  }

  function collectBlueOrders(): readonly GeneralOrder[] {
    return match.agents
      .filter(
        (agent) =>
          agent.nominalTeam === "BLUE" &&
          agent.status === "ACTIVE" &&
          agent.canAct,
      )
      .map((agent) => {
        const draft = operation.drafts[agent.id];
        return draft
          ? draftToOrder(draft)
          : ({ kind: "WAIT", agentId: agent.id } as const);
      });
  }

  function executePendingTurn(pending: PendingTurn, blueMoleOrder?: MoleOrder) {
    const replayablePending = {
      ...pending,
      ...(blueMoleOrder ? { blueMoleOrder } : {}),
    };
    const result = resolveLocalTurn({
      state: pending.beforeState,
      generalOrders: {
        BLUE: pending.blueOrders,
        RED: pending.redOrders,
      },
      moleOrders: {
        ...(blueMoleOrder ? { BLUE: blueMoleOrder } : {}),
        ...(pending.redMoleOrder ? { RED: pending.redMoleOrder } : {}),
      },
    });
    setPendingTurn(replayablePending);
    setResolution(result);
    setExecutionBeats(
      buildExecutionPlayback({
        beforeState: pending.beforeState,
        viewer: "BLUE",
        generalOrders: pending.blueOrders,
        ...(blueMoleOrder ? { moleOrder: blueMoleOrder } : {}),
        result,
      }),
    );
    setExecutionIndex(0);
    setLiveAgentResults({});
    setPhaseDeadline(null);
    setPhase("EXECUTION");
  }

  function lockGeneralOrders(source: "manual" | "timeout" = "manual") {
    if (phase !== "GENERAL" || phaseSubmissionRef.current === "GENERAL") {
      return;
    }
    phaseSubmissionRef.current = "GENERAL";
    setPhaseDeadline(null);
    const blueOrders = collectBlueOrders();
    if (source === "timeout") {
      const savedOrders = blueOrders.filter(
        (order) => operation.drafts[order.agentId],
      ).length;
      setPhaseNotice(
        `시간 초과 · 저장된 ${savedOrders}개 명령 + 자동 대기 ${blueOrders.length - savedOrders}개`,
      );
    } else {
      setPhaseNotice(null);
    }
    const redOrders = createFixtureOpponentOrders(match, "RED");
    const nextPending: PendingTurn = {
      beforeState: match,
      blueOrders,
      redOrders,
      redMoleOrder: createFixtureMoleOrder({
        controller: "RED",
        state: match,
        nominalOrders: blueOrders,
      }),
    };
    setPendingTurn(nextPending);
    dispatch({ type: "RESET" });
    const controlledMole = match.agents.find(
      (agent) => agent.status === "ACTIVE" && agent.moleController === "BLUE",
    );
    if (!controlledMole) {
      executePendingTurn(nextPending);
      return;
    }
    openTimedPhase("MOLE");
  }

  function chooseMoleOrder(
    order: MoleOrder,
    source: "manual" | "timeout" = "manual",
  ) {
    if (
      phase !== "MOLE" ||
      phaseSubmissionRef.current === "MOLE" ||
      !pendingTurn
    ) {
      return;
    }
    phaseSubmissionRef.current = "MOLE";
    setPhaseDeadline(null);
    if (source === "timeout") {
      setPhaseNotice("시간 초과 · 배신자 명령 자동 묵인");
    }
    executePendingTurn(pendingTurn, order);
  }

  function nextTurn() {
    setMatch((current) => startNextLocalTurn(current));
    setPendingTurn(null);
    setResolution(null);
    setExecutionBeats([]);
    setExecutionIndex(0);
    setLiveAgentResults({});
    dispatch({ type: "CLEAR_TURN" });
    setPhaseNotice(null);
    openTimedPhase("GENERAL");
  }

  function restartTraining(mode: "same-seed" | "new-seed") {
    const nextSeed =
      mode === "new-seed" ? createNextLocalMatchSeed(seed) : seed.trim();
    setSeed(nextSeed);
    setMatch(createLocalTurnFixture({ seed: nextSeed }));
    if (mode === "new-seed") setSelectedRosterFacilityId(null);
    setPendingTurn(null);
    setResolution(null);
    setExecutionBeats([]);
    setExecutionIndex(0);
    setLiveAgentResults({});
    setPreviousTurnOrders({});
    phaseSubmissionRef.current = null;
    setPhaseDeadline(null);
    setPhaseNotice(null);
    dispatch({ type: "CLEAR_TURN" });
    setPhase("ROSTER");
  }

  const nominalMoleOrder = controlledMole
    ? pendingTurn?.redOrders.find(
        (order) => order.agentId === controlledMole.id,
      )
    : undefined;
  const activeExecutionCues =
    phase === "EXECUTION" ? (executionBeats[executionIndex]?.cues ?? []) : [];
  const settledExecutionCues =
    phase === "EXECUTION"
      ? executionBeats.slice(0, executionIndex).flatMap((beat) => beat.cues)
      : [];

  const commandCoordinate = (() => {
    if (phase !== "GENERAL" || !selectedAgent) return null;
    if (
      operation.composer.type === "idle" ||
      operation.composer.type === "reachable"
    ) {
      return null;
    }
    if (operation.composer.type === "complete") {
      return operation.composer.draft.destination;
    }
    if ("destination" in operation.composer) {
      return operation.composer.destination;
    }
    return selectedAgent.coordinate;
  })();

  return (
    <main
      className="operation-shell"
      data-testid="operation-screen"
      data-map-interacting={mapInteracting ? "true" : undefined}
    >
      <OperationBar
        callsign={callsign}
        turn={projection.turn}
        phase={phase}
        seconds={remainingSeconds}
        team={projection.team}
        availableFunds={availableFunds}
        draftCost={commandPhase ? draftCost : 0}
        draftedAgents={commandPhase ? Object.keys(operation.drafts).length : 0}
        activeAgents={activeAgents}
        phaseNotice={phaseNotice}
      />

      <div className="tablet-rail-controls" aria-label="정보 패널">
        <button
          type="button"
          onClick={() =>
            setOpenRail((rail) => (rail === "mission" ? null : "mission"))
          }
          aria-controls="mission-drawer"
          aria-expanded={openRail === "mission"}
        >
          <Menu aria-hidden="true" /> 임무
        </button>
        <button
          type="button"
          onClick={() =>
            setOpenRail((rail) => (rail === "agents" ? null : "agents"))
          }
          aria-controls="agent-drawer"
          aria-expanded={openRail === "agents"}
        >
          <Users aria-hidden="true" /> 요원
        </button>
        <span>{callsign} · BLUE</span>
      </div>

      <div className="operation-grid">
        <div
          id="mission-drawer"
          className="operation-rail operation-rail--mission"
          data-open={openRail === "mission" ? "true" : undefined}
        >
          <MissionRail
            projection={projection}
            availableFunds={availableFunds}
          />
        </div>

        <div className="map-column">
          <MapViewport
            buildings={projection.buildings}
            agents={agents}
            opponents={projection.visibleOpponents}
            controlledMole={projection.controlledMole}
            selectedAgentId={selectedAgentId}
            reachableCells={reachableCells}
            path={phase === "GENERAL" ? path : []}
            showDestinationControls={phase === "GENERAL"}
            rosterSelection={
              phase === "ROSTER"
                ? {
                    selectedFacilityId: selectedRosterFacilityId,
                    candidates: rosterPlacementCandidates,
                  }
                : null
            }
            executionCues={activeExecutionCues}
            settledExecutionCues={settledExecutionCues}
            commandOverlay={
              commandCoordinate
                ? {
                    coordinate: commandCoordinate,
                    content: (
                      <AgentCommandComposer
                        compact
                        state={operation.composer}
                        agent={selectedAgent}
                        visibleOpponents={projection.visibleOpponents}
                        availableFunds={composerAvailableFunds}
                        hackFacilityId={hackFacilityId}
                        onEvent={dispatch}
                      />
                    ),
                  }
                : null
            }
            onIntent={handleIntent}
            onInteractionChange={handleMapInteractionChange}
          />

          {phase === "ROSTER" ? (
            <RosterPlacementDock
              seed={seed}
              selectedFacilityId={selectedRosterFacilityId}
              onSeedChange={setSeed}
              onCreateSeed={() => setSeed(createNextLocalMatchSeed(seed))}
              onResetSeed={() => setSeed(DEFAULT_LOCAL_MATCH_SEED)}
              onSelect={setSelectedRosterFacilityId}
              onConfirm={confirmRosterPlacement}
            />
          ) : null}

          {phase === "GENERAL" ? (
            <>
              <GeneralOrderControlDock
                draftedAgents={Object.keys(operation.drafts).length}
                activeAgents={activeAgents}
                draftCost={draftCost}
                availableFunds={availableFunds}
                canLock={
                  operation.composer.type === "idle" ||
                  operation.composer.type === "complete"
                }
                onLock={() => lockGeneralOrders("manual")}
              />
            </>
          ) : null}

          {phase === "MOLE" && controlledMole ? (
            <MoleOrderPanel
              controller="BLUE"
              mole={controlledMole}
              nominalOrder={nominalMoleOrder}
              colleagues={getMoleColleagueCandidates(match, "BLUE")}
              availableFunds={availableFunds}
              turn={match.turnNumber}
              onChoose={(order) => chooseMoleOrder(order, "manual")}
            />
          ) : null}
        </div>

        <div
          id="agent-drawer"
          className="operation-rail operation-rail--agents"
          data-open={openRail === "agents" ? "true" : undefined}
        >
          <AgentRail
            agents={agents}
            controlledMole={projection.controlledMole}
            selectedAgentId={selectedAgentId}
            onSelectAgent={selectAgent}
            onReviewOrders={
              phase === "GENERAL"
                ? () => lockGeneralOrders("manual")
                : undefined
            }
            previousTurnOrders={previousTurnOrders}
            liveResults={liveAgentResults}
            live={phase === "EXECUTION" || phase === "RESULTS"}
            onRestartSameSeed={
              phase === "RESULTS"
                ? () => restartTraining("same-seed")
                : undefined
            }
            onRestartNewSeed={
              phase === "RESULTS"
                ? () => restartTraining("new-seed")
                : undefined
            }
          />
        </div>
      </div>

      <button type="button" className="exit-operation" onClick={onExit}>
        <ArrowLeft aria-hidden="true" /> 로비로
      </button>
    </main>
  );
}
