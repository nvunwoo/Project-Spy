import type {
  AgentState,
  Coordinate,
  Objective,
  ObjectiveKind,
  Team,
} from "@/domain/model/game-types";
import { opposingTeam } from "@/domain/model/game-types";
import {
  isWithin3x3,
  isWithin5x5,
  sameCoordinate,
} from "@/domain/map/coordinates";
import { getMapCell } from "@/domain/map/map-manifest";
import {
  getGeneralOrderCost,
  isMoleColleagueAssassinationUnlocked,
  getMoleOrderCost,
  getOperationSuccessRate,
  settleUnusedAllocation,
  spendFunds,
  validateGeneralOrderSet,
} from "@/domain/orders/order-rules";
import type {
  GeneralOrder,
  HackState,
  MoleOrder,
} from "@/domain/orders/order-types";
import {
  evaluateOutcome,
  type Outcome,
} from "@/domain/resolve-turn/evaluate-outcome";
import {
  resolveMovement,
  type MovementResult,
} from "@/domain/resolve-turn/resolve-movement";
import type {
  LocalTurnState,
  PendingMoleRebuy,
  ReinforcementOrder,
  RemovalRecord,
  TeamReportEntry,
  TurnStage,
} from "@/domain/resolve-turn/turn-state";
import { createRng, rollPercent } from "@/domain/rng/deterministic-rng";

type TeamOrders = Readonly<Record<Team, readonly GeneralOrder[]>>;
type TeamMoleOrders = Readonly<Partial<Record<Team, MoleOrder>>>;

export interface ResolveLocalTurnResult {
  readonly resolvedState: LocalTurnState;
  readonly movementResults: readonly MovementResult[];
  readonly reports: Readonly<Record<Team, readonly TeamReportEntry[]>>;
  readonly removals: readonly RemovalRecord[];
  readonly deliveredThisTurn: Readonly<Record<Team, readonly ObjectiveKind[]>>;
  readonly outcome: Outcome;
  readonly replayKey: string;
}

interface MutableResolution {
  agents: AgentState[];
  objectives: Objective[];
  economies: Record<Team, { allocation: number; bank: number }>;
  hackState: HackState;
  visible: Record<Team, Set<string>>;
  reinforcements: ReinforcementOrder[];
  pendingMoleRebuys: PendingMoleRebuy[];
  removals: RemovalRecord[];
}

const teams = ["BLUE", "RED"] as const;

function compareId(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function cloneHackState(hackState: HackState): HackState {
  return {
    disabledFacilityIds: new Set(hackState.disabledFacilityIds),
    teamProgress: {
      BLUE: { ...hackState.teamProgress.BLUE },
      RED: { ...hackState.teamProgress.RED },
    },
  };
}

function replaceAgent(
  resolution: MutableResolution,
  agentId: string,
  update: (agent: AgentState) => AgentState,
): AgentState {
  const index = resolution.agents.findIndex((agent) => agent.id === agentId);
  const current = resolution.agents[index];
  if (index < 0 || !current) {
    throw new Error(`Unknown agent ${agentId}.`);
  }
  const next = update(current);
  resolution.agents[index] = next;
  return next;
}

function updateObjective(
  resolution: MutableResolution,
  objectiveId: string,
  update: (objective: Objective) => Objective,
): Objective {
  const index = resolution.objectives.findIndex(
    (objective) => objective.id === objectiveId,
  );
  const current = resolution.objectives[index];
  if (index < 0 || !current) {
    throw new Error(`Unknown objective ${objectiveId}.`);
  }
  const next = update(current);
  resolution.objectives[index] = next;
  return next;
}

function isEligibleCarrier(agent: AgentState, objective: Objective): boolean {
  if (agent.status !== "ACTIVE" || agent.carriedObjectiveId) return false;
  if (objective.kind === "RED_ROSTER") return agent.nominalTeam === "BLUE";
  if (objective.kind === "BLUE_ROSTER") return agent.nominalTeam === "RED";
  return true;
}

function flipScientistExit(objective: Objective): "AIRPORT" | "PORT" {
  return objective.scientistExit === "AIRPORT" ? "PORT" : "AIRPORT";
}

function giveObjective(
  resolution: MutableResolution,
  objectiveId: string,
  agentId: string,
  flipExit: boolean,
): void {
  replaceAgent(resolution, agentId, (agent) => ({
    ...agent,
    carriedObjectiveId: objectiveId,
  }));
  updateObjective(resolution, objectiveId, (objective) => ({
    ...objective,
    ...(objective.kind === "SCIENTIST" && flipExit
      ? { scientistExit: flipScientistExit(objective) }
      : {}),
    state: { status: "CARRIED", carrierAgentId: agentId },
  }));
}

function reportFactory() {
  const reports: Record<Team, TeamReportEntry[]> = { BLUE: [], RED: [] };
  let sequence = 0;
  const add = (
    team: Team,
    stage: TurnStage,
    tone: TeamReportEntry["tone"],
    message: string,
  ) => {
    sequence += 1;
    reports[team].push({
      id: `report-${String(sequence).padStart(3, "0")}`,
      stage,
      tone,
      message,
    });
  };
  return { reports, add };
}

function getMoleForController(
  agents: readonly AgentState[],
  controller: Team,
): AgentState | undefined {
  return agents.find(
    (agent) => agent.status === "ACTIVE" && agent.moleController === controller,
  );
}

function scheduleRemoval(
  state: LocalTurnState,
  resolution: MutableResolution,
  agent: AgentState,
  cause: RemovalRecord["cause"],
): void {
  if (agent.status !== "ACTIVE") return;
  const wasMole = agent.moleController !== undefined;
  const dueTurn =
    cause === "PURGE_MOLE" ? state.turnNumber + 2 : state.turnNumber + 3;
  resolution.removals.push({
    agentId: agent.id,
    team: agent.nominalTeam,
    role: agent.role,
    cause,
    turnNumber: state.turnNumber,
  });
  resolution.reinforcements.push({
    agentId: agent.id,
    team: agent.nominalTeam,
    role: agent.role,
    dueTurn,
    ...(wasMole && agent.moleController
      ? {
          moleController: agent.moleController,
          moleRebuyTurn: dueTurn + 1,
        }
      : {}),
  });
  replaceAgent(resolution, agent.id, (current) => ({
    ...current,
    status: "REINFORCEMENT_PENDING",
    canAct: false,
    moleController: undefined,
    interrogationMark: undefined,
    carriedObjectiveId: undefined,
  }));
}

function eligibleAgentsAt(
  resolution: MutableResolution,
  objective: Objective,
  coordinate: Coordinate,
  excludedAgentId?: string,
): AgentState[] {
  return resolution.agents
    .filter(
      (agent) =>
        agent.id !== excludedAgentId &&
        sameCoordinate(agent.coordinate, coordinate) &&
        isEligibleCarrier(agent, objective),
    )
    .sort((left, right) => compareId(left.id, right.id));
}

function removeAgentAndHandleObjective(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly agentId: string;
  readonly cause: RemovalRecord["cause"];
  readonly killerAgentId?: string;
  readonly rngSeed: string;
}): void {
  const removed = input.resolution.agents.find(
    (agent) => agent.id === input.agentId,
  );
  if (!removed || removed.status !== "ACTIVE") return;

  const objective = removed.carriedObjectiveId
    ? input.resolution.objectives.find(
        (candidate) => candidate.id === removed.carriedObjectiveId,
      )
    : undefined;
  scheduleRemoval(input.state, input.resolution, removed, input.cause);
  if (!objective) return;

  const killer = input.killerAgentId
    ? input.resolution.agents.find((agent) => agent.id === input.killerAgentId)
    : undefined;
  if (killer && isEligibleCarrier(killer, objective)) {
    giveObjective(input.resolution, objective.id, killer.id, true);
    return;
  }

  const dropped: Objective = {
    ...objective,
    state: { status: "DROPPED", coordinate: removed.coordinate },
  };
  updateObjective(input.resolution, objective.id, () => dropped);
  const candidates = eligibleAgentsAt(
    input.resolution,
    dropped,
    removed.coordinate,
    removed.id,
  );
  if (candidates.length === 0) return;
  const selected = createRng({
    seed: input.rngSeed,
    namespace: "TIE_BREAK",
  }).shuffle(candidates)[0];
  if (selected) {
    giveObjective(input.resolution, objective.id, selected.id, true);
  }
}

function assertAndSpendOrders(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly generalOrders: TeamOrders;
  readonly moleOrders: TeamMoleOrders;
}): void {
  for (const team of teams) {
    const validation = validateGeneralOrderSet({
      team,
      agents: input.state.agents,
      orders: input.generalOrders[team],
      manifest: input.state.map,
      economy: input.state.economies[team],
      visibleEnemyAgentIds: input.state.visibleEnemyAgentIdsByViewer[team],
      hackState: input.state.hackState,
    });
    if (!validation.ok) {
      const detail = validation.issues
        .map((issue) => `${issue.code}:${issue.agentId ?? "team"}`)
        .join(",");
      throw new Error(`Invalid ${team} general order set: ${detail}`);
    }

    const generalCost = validation.normalizedOrders.reduce(
      (total, order) => total + getGeneralOrderCost(order),
      0,
    );
    const moleOrder = input.moleOrders[team];
    if (moleOrder) {
      const controlled = getMoleForController(input.state.agents, team);
      if (!controlled || controlled.id !== moleOrder.moleAgentId) {
        throw new Error(`${team} submitted an order for an uncontrolled mole.`);
      }
      if (
        moleOrder.kind === "ASSASSINATE_COLLEAGUE" &&
        !isMoleColleagueAssassinationUnlocked(input.state.turnNumber)
      ) {
        throw new Error(
          `${team} cannot assassinate a mole colleague before turn 6.`,
        );
      }
    }
    const totalCost =
      generalCost + (moleOrder ? getMoleOrderCost(moleOrder) : 0);
    const spent = spendFunds(input.state.economies[team], totalCost);
    if (!spent.ok) {
      throw new Error(`${team} orders exceed available funds.`);
    }
    input.resolution.economies[team] = { ...spent.economy };
  }
}

function resolveInterrogationAndPurge(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly orders: TeamOrders;
  readonly addReport: ReturnType<typeof reportFactory>["add"];
}): Record<Team, number> {
  const nextLoyaltyPenalty = {
    BLUE: Math.max(0, input.state.loyaltyPenaltyTurns.BLUE - 1),
    RED: Math.max(0, input.state.loyaltyPenaltyTurns.RED - 1),
  };

  for (const team of teams) {
    for (const order of input.orders[team]) {
      const agent = input.resolution.agents.find(
        (candidate) => candidate.id === order.agentId,
      );
      if (!agent || agent.status !== "ACTIVE") continue;
      if (order.kind === "INTERROGATE") {
        const mark = agent.moleController ? "MOLE" : "LOYAL";
        replaceAgent(input.resolution, agent.id, (current) => ({
          ...current,
          interrogationMark: mark,
        }));
        input.addReport(
          team,
          "INTERROGATION_PURGE",
          mark === "MOLE" ? "WARNING" : "SUCCESS",
          `요원 ${agent.role} 심문: ${mark === "MOLE" ? "배신자" : "배신자 아님"}`,
        );
      }
      if (order.kind === "PURGE") {
        const cause = agent.moleController ? "PURGE_MOLE" : "PURGE_LOYAL";
        removeAgentAndHandleObjective({
          state: input.state,
          resolution: input.resolution,
          agentId: agent.id,
          cause,
          rngSeed: `${input.state.seed}:turn:${input.state.turnNumber}:purge:${agent.id}`,
        });
        input.addReport(
          team,
          "INTERROGATION_PURGE",
          cause === "PURGE_MOLE" ? "SUCCESS" : "CRITICAL",
          `요원 ${agent.role} 숙청 완료${cause === "PURGE_LOYAL" ? " · 무고한 숙청, 다음 턴 -10%p" : " · 배신자 제거"}`,
        );
        if (cause === "PURGE_LOYAL") {
          nextLoyaltyPenalty[team] = 1;
        } else if (agent.moleController) {
          input.addReport(
            agent.moleController,
            "INTERROGATION_PURGE",
            "CRITICAL",
            "통제 중이던 배신자가 숙청되었습니다.",
          );
        }
      }
    }
  }
  return nextLoyaltyPenalty;
}

function forcedFailureSets(input: {
  readonly agents: readonly AgentState[];
  readonly moleOrders: TeamMoleOrders;
}) {
  const move = new Set<string>();
  const operation = new Set<string>();
  for (const team of teams) {
    const order = input.moleOrders[team];
    if (!order) continue;
    const mole = getMoleForController(input.agents, team);
    if (!mole || mole.id !== order.moleAgentId) continue;
    if (
      order.kind === "FORCE_MOVE_FAILURE" ||
      order.kind === "ASSASSINATE_COLLEAGUE"
    ) {
      move.add(mole.id);
    }
    if (
      order.kind === "FORCE_OPERATION_FAILURE" ||
      order.kind === "ASSASSINATE_COLLEAGUE"
    ) {
      operation.add(mole.id);
    }
  }
  return { move, operation };
}

interface HackAttempt {
  readonly team: Team;
  readonly agent: AgentState;
  readonly facilityId: string;
  readonly facilityKind: "BANK" | "COMMUNICATIONS";
  readonly forcedFailure: boolean;
  readonly successRate: number;
}

function resolveHacksAndInvestigations(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly orders: TeamOrders;
  readonly cancelledActions: ReadonlySet<string>;
  readonly forcedOperationFailures: ReadonlySet<string>;
  readonly addReport: ReturnType<typeof reportFactory>["add"];
}) {
  const hackAttempts: HackAttempt[] = [];
  const investigationVisible: Record<Team, Set<string>> = {
    BLUE: new Set(),
    RED: new Set(),
  };
  const hackRng = createRng({
    seed: `${input.state.seed}:turn:${input.state.turnNumber}:hack`,
    namespace: "ACTION_SUCCESS",
  });
  const investigateRng = createRng({
    seed: `${input.state.seed}:turn:${input.state.turnNumber}:investigate`,
    namespace: "ACTION_SUCCESS",
  });

  for (const team of teams) {
    for (const order of input.orders[team]) {
      if (
        order.kind !== "OPERATE" ||
        input.cancelledActions.has(order.agentId)
      ) {
        continue;
      }
      const agent = input.resolution.agents.find(
        (candidate) => candidate.id === order.agentId,
      );
      if (!agent || agent.status !== "ACTIVE") continue;
      const action = order.arrivalAction;
      if (action.kind === "HACK") {
        const cell = getMapCell(input.state.map, agent.coordinate);
        if (
          cell.facilityId !== action.facilityId ||
          (cell.facilityKind !== "BANK" &&
            cell.facilityKind !== "COMMUNICATIONS")
        ) {
          continue;
        }
        hackAttempts.push({
          team,
          agent,
          facilityId: action.facilityId,
          facilityKind: cell.facilityKind,
          forcedFailure: input.forcedOperationFailures.has(agent.id),
          successRate: getOperationSuccessRate({
            role: agent.role,
            operation: "HACK",
            loyaltyPenaltyActive: input.state.loyaltyPenaltyTurns[team] > 0,
          }),
        });
      }
      if (action.kind === "INVESTIGATE") {
        const forced = input.forcedOperationFailures.has(agent.id);
        const success =
          !forced &&
          rollPercent(
            investigateRng,
            getOperationSuccessRate({
              role: agent.role,
              operation: "INVESTIGATE",
              loyaltyPenaltyActive: input.state.loyaltyPenaltyTurns[team] > 0,
            }),
          );
        if (success) {
          for (const target of input.resolution.agents) {
            if (
              target.status === "ACTIVE" &&
              target.nominalTeam !== team &&
              isWithin5x5(agent.coordinate, target.coordinate)
            ) {
              investigationVisible[team].add(target.id);
            }
          }
        }
        input.addReport(
          team,
          "HACK_INVESTIGATE",
          success ? "SUCCESS" : "WARNING",
          `요원 ${agent.role} 조사 ${success ? "성공" : "실패"}`,
        );
      }
    }
  }

  const successfulHacks: HackAttempt[] = [];
  const attemptsByFacility = new Map<string, HackAttempt[]>();
  for (const attempt of hackAttempts) {
    const attempts = attemptsByFacility.get(attempt.facilityId) ?? [];
    attempts.push(attempt);
    attemptsByFacility.set(attempt.facilityId, attempts);
  }

  for (const attempts of attemptsByFacility.values()) {
    if (
      input.resolution.hackState.disabledFacilityIds.has(
        attempts[0]!.facilityId,
      )
    ) {
      continue;
    }
    let winner: HackAttempt | undefined;
    if (attempts.length === 2 && attempts[0]!.team !== attempts[1]!.team) {
      const [first, second] = attempts as [HackAttempt, HackAttempt];
      if (first.forcedFailure !== second.forcedFailure) {
        winner = first.forcedFailure ? second : first;
      } else if (!first.forcedFailure) {
        if (first.successRate === second.successRate) {
          winner = createRng({
            seed: `${input.state.seed}:turn:${input.state.turnNumber}:hack-conflict:${first.facilityId}`,
            namespace: "TIE_BREAK",
          }).shuffle([first, second])[0];
        } else {
          winner = first.successRate > second.successRate ? first : second;
        }
      }
    } else {
      const attempt = attempts[0];
      if (
        attempt &&
        !attempt.forcedFailure &&
        rollPercent(hackRng, attempt.successRate)
      ) {
        winner = attempt;
      }
    }

    for (const attempt of attempts) {
      const success = attempt === winner;
      input.addReport(
        attempt.team,
        "HACK_INVESTIGATE",
        success ? "SUCCESS" : "WARNING",
        `요원 ${attempt.agent.role} ${attempt.facilityKind === "BANK" ? "은행" : "통신국"} 해킹 ${success ? "성공" : "실패"}`,
      );
    }
    if (winner) successfulHacks.push(winner);
  }

  const disabled = new Set(input.resolution.hackState.disabledFacilityIds);
  const progress = {
    BLUE: { ...input.resolution.hackState.teamProgress.BLUE },
    RED: { ...input.resolution.hackState.teamProgress.RED },
  };
  for (const hack of successfulHacks) {
    disabled.add(hack.facilityId);
    progress[hack.team] = {
      ...progress[hack.team],
      ...(hack.facilityKind === "BANK"
        ? { bankSucceeded: true }
        : { communicationsSucceeded: true }),
    };
  }
  input.resolution.hackState = {
    disabledFacilityIds: disabled,
    teamProgress: progress,
  };

  return { successfulHacks, investigationVisible };
}

interface AssassinationAttempt {
  readonly team: Team;
  readonly attackerId: string;
  readonly targetId: string;
  readonly successRate: number;
  readonly forcedFailure: boolean;
}

function resolveAssassinations(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly orders: TeamOrders;
  readonly moleOrders: TeamMoleOrders;
  readonly cancelledActions: ReadonlySet<string>;
  readonly forcedOperationFailures: ReadonlySet<string>;
  readonly addReport: ReturnType<typeof reportFactory>["add"];
}): void {
  const attempts: AssassinationAttempt[] = [];
  for (const team of teams) {
    for (const order of input.orders[team]) {
      if (
        order.kind !== "OPERATE" ||
        order.arrivalAction.kind !== "ASSASSINATE" ||
        input.cancelledActions.has(order.agentId)
      ) {
        continue;
      }
      const attacker = input.resolution.agents.find(
        (agent) => agent.id === order.agentId,
      );
      const targetAgentId = order.arrivalAction.targetAgentId;
      const target = input.resolution.agents.find(
        (agent) => agent.id === targetAgentId,
      );
      if (
        !attacker ||
        !target ||
        attacker.status !== "ACTIVE" ||
        target.status !== "ACTIVE" ||
        !isWithin3x3(attacker.coordinate, target.coordinate)
      ) {
        input.addReport(
          team,
          "ASSASSINATION",
          "WARNING",
          `요원 ${attacker?.role ?? "?"} 암살 실패`,
        );
        continue;
      }
      attempts.push({
        team,
        attackerId: attacker.id,
        targetId: target.id,
        forcedFailure: input.forcedOperationFailures.has(attacker.id),
        successRate: getOperationSuccessRate({
          role: attacker.role,
          operation: "ASSASSINATE",
          loyaltyPenaltyActive: input.state.loyaltyPenaltyTurns[team] > 0,
        }),
      });
    }
  }

  const used = new Set<string>();
  const events: Array<
    | {
        readonly kind: "DUEL";
        readonly attempts: readonly [
          AssassinationAttempt,
          AssassinationAttempt,
        ];
        readonly rate: number;
      }
    | {
        readonly kind: "SINGLE";
        readonly attempt: AssassinationAttempt;
        readonly rate: number;
      }
  > = [];
  for (const attempt of attempts) {
    if (used.has(attempt.attackerId)) continue;
    const reciprocal = attempts.find(
      (candidate) =>
        candidate.attackerId === attempt.targetId &&
        candidate.targetId === attempt.attackerId,
    );
    if (reciprocal) {
      used.add(attempt.attackerId);
      used.add(reciprocal.attackerId);
      events.push({
        kind: "DUEL",
        attempts: [attempt, reciprocal],
        rate: Math.max(attempt.successRate, reciprocal.successRate),
      });
    } else {
      used.add(attempt.attackerId);
      events.push({ kind: "SINGLE", attempt, rate: attempt.successRate });
    }
  }
  const eventRng = createRng({
    seed: `${input.state.seed}:turn:${input.state.turnNumber}:assassination-order`,
    namespace: "TIE_BREAK",
  });
  const ordered = [...events].sort((left, right) => right.rate - left.rate);
  for (let start = 0; start < ordered.length;) {
    let end = start + 1;
    while (
      end < ordered.length &&
      ordered[end]!.rate === ordered[start]!.rate
    ) {
      end += 1;
    }
    ordered.splice(
      start,
      end - start,
      ...eventRng.shuffle(ordered.slice(start, end)),
    );
    start = end;
  }
  const actionRng = createRng({
    seed: `${input.state.seed}:turn:${input.state.turnNumber}:assassination`,
    namespace: "ACTION_SUCCESS",
  });

  const kill = (winner: AssassinationAttempt, loserId: string) => {
    const winnerAgent = input.resolution.agents.find(
      (agent) => agent.id === winner.attackerId,
    );
    const loser = input.resolution.agents.find((agent) => agent.id === loserId);
    if (!winnerAgent || !loser || loser.status !== "ACTIVE") return;
    removeAgentAndHandleObjective({
      state: input.state,
      resolution: input.resolution,
      agentId: loser.id,
      cause: "ASSASSINATION",
      killerAgentId: winnerAgent.id,
      rngSeed: `${input.state.seed}:turn:${input.state.turnNumber}:kill:${loser.id}`,
    });
    input.addReport(
      winner.team,
      "ASSASSINATION",
      "SUCCESS",
      `요원 ${winnerAgent.role} 암살 성공`,
    );
    input.addReport(
      loser.nominalTeam,
      "ASSASSINATION",
      "CRITICAL",
      `요원 ${loser.role}가 암살당했습니다.`,
    );
    if (loser.moleController) {
      input.addReport(
        loser.moleController,
        "ASSASSINATION",
        "CRITICAL",
        "통제 중이던 배신자가 제거되었습니다.",
      );
    }
  };

  for (const event of ordered) {
    if (event.kind === "SINGLE") {
      const { attempt } = event;
      const attacker = input.resolution.agents.find(
        (agent) => agent.id === attempt.attackerId,
      );
      const target = input.resolution.agents.find(
        (agent) => agent.id === attempt.targetId,
      );
      if (
        !attacker ||
        !target ||
        attacker.status !== "ACTIVE" ||
        target.status !== "ACTIVE" ||
        !isWithin3x3(attacker.coordinate, target.coordinate)
      ) {
        continue;
      }
      if (
        !attempt.forcedFailure &&
        rollPercent(actionRng, attempt.successRate)
      ) {
        kill(attempt, target.id);
      } else {
        input.addReport(
          attempt.team,
          "ASSASSINATION",
          "WARNING",
          `요원 ${attacker.role} 암살 실패`,
        );
      }
      continue;
    }

    const [first, second] = event.attempts;
    const firstAgent = input.resolution.agents.find(
      (agent) => agent.id === first.attackerId,
    );
    const secondAgent = input.resolution.agents.find(
      (agent) => agent.id === second.attackerId,
    );
    if (
      !firstAgent ||
      !secondAgent ||
      firstAgent.status !== "ACTIVE" ||
      secondAgent.status !== "ACTIVE"
    ) {
      continue;
    }
    if (first.forcedFailure && second.forcedFailure) {
      input.addReport(
        first.team,
        "ASSASSINATION",
        "WARNING",
        `요원 ${firstAgent.role} 암살 실패`,
      );
      input.addReport(
        second.team,
        "ASSASSINATION",
        "WARNING",
        `요원 ${secondAgent.role} 암살 실패`,
      );
      continue;
    }
    if (first.forcedFailure !== second.forcedFailure) {
      const winner = first.forcedFailure ? second : first;
      const loser = first.forcedFailure ? first : second;
      kill(winner, loser.attackerId);
      continue;
    }
    if (first.successRate === second.successRate) {
      const winner = createRng({
        seed: `${input.state.seed}:turn:${input.state.turnNumber}:duel:${first.attackerId}:${second.attackerId}`,
        namespace: "TIE_BREAK",
      }).shuffle([first, second])[0]!;
      kill(winner, winner === first ? second.attackerId : first.attackerId);
      continue;
    }
    const higher = first.successRate > second.successRate ? first : second;
    const lower = higher === first ? second : first;
    const winner = rollPercent(actionRng, higher.successRate) ? higher : lower;
    kill(winner, winner === higher ? lower.attackerId : higher.attackerId);
  }

  for (const controller of teams) {
    const moleOrder = input.moleOrders[controller];
    if (moleOrder?.kind !== "ASSASSINATE_COLLEAGUE") continue;
    const mole = input.resolution.agents.find(
      (agent) => agent.id === moleOrder.moleAgentId,
    );
    const target = input.resolution.agents.find(
      (agent) => agent.id === moleOrder.targetAgentId,
    );
    const success =
      mole?.status === "ACTIVE" &&
      target?.status === "ACTIVE" &&
      mole.nominalTeam === target.nominalTeam &&
      isWithin5x5(mole.coordinate, target.coordinate);
    if (success && mole && target) {
      removeAgentAndHandleObjective({
        state: input.state,
        resolution: input.resolution,
        agentId: target.id,
        cause: "ASSASSINATION",
        killerAgentId: mole.id,
        rngSeed: `${input.state.seed}:turn:${input.state.turnNumber}:mole-kill:${target.id}`,
      });
      input.addReport(
        controller,
        "ASSASSINATION",
        "SUCCESS",
        "배신자 동료 암살 성공",
      );
      input.addReport(
        target.nominalTeam,
        "ASSASSINATION",
        "CRITICAL",
        `요원 ${target.role}가 암살당했습니다.`,
      );
    } else {
      input.addReport(
        controller,
        "ASSASSINATION",
        "WARNING",
        "배신자 동료 암살 실패",
      );
    }
  }
}

function resolveObjectivePickup(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly addReport: ReturnType<typeof reportFactory>["add"];
}): void {
  for (const objective of [...input.resolution.objectives]) {
    if (
      objective.state.status !== "HIDDEN" &&
      objective.state.status !== "DROPPED"
    ) {
      continue;
    }
    const candidates = eligibleAgentsAt(
      input.resolution,
      objective,
      objective.state.coordinate,
    );
    if (candidates.length === 0) continue;
    const selected = createRng({
      seed: `${input.state.seed}:turn:${input.state.turnNumber}:pickup:${objective.id}`,
      namespace: "TIE_BREAK",
    }).shuffle(candidates)[0];
    if (!selected) continue;
    giveObjective(
      input.resolution,
      objective.id,
      selected.id,
      objective.state.status === "DROPPED",
    );
    input.addReport(
      selected.nominalTeam,
      "OBJECTIVE_PICKUP",
      "SUCCESS",
      `${objective.kind === "SCIENTIST" ? "과학자" : objective.kind === "BLUEPRINT" ? "설계도" : "상대 요원 명단"} 획득`,
    );
  }
}

function deliverObjectives(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly addReport: ReturnType<typeof reportFactory>["add"];
}) {
  const delivered: Record<Team, Set<ObjectiveKind>> = {
    BLUE: new Set(),
    RED: new Set(),
  };
  for (const objective of [...input.resolution.objectives]) {
    if (objective.state.status !== "CARRIED") continue;
    const carrierAgentId = objective.state.carrierAgentId;
    const carrier = input.resolution.agents.find(
      (agent) => agent.id === carrierAgentId,
    );
    if (!carrier || carrier.status !== "ACTIVE") continue;
    const facilityKind = getMapCell(
      input.state.map,
      carrier.coordinate,
    ).facilityKind;
    const ownEmbassy =
      carrier.nominalTeam === "BLUE" ? "BLUE_EMBASSY" : "RED_EMBASSY";
    const valid =
      (objective.kind === "RED_ROSTER" &&
        carrier.nominalTeam === "BLUE" &&
        facilityKind === ownEmbassy) ||
      (objective.kind === "BLUE_ROSTER" &&
        carrier.nominalTeam === "RED" &&
        facilityKind === ownEmbassy) ||
      (objective.kind === "BLUEPRINT" && facilityKind === ownEmbassy) ||
      (objective.kind === "SCIENTIST" &&
        facilityKind === objective.scientistExit);
    if (!valid) continue;
    delivered[carrier.nominalTeam].add(objective.kind);
    replaceAgent(input.resolution, carrier.id, (agent) => ({
      ...agent,
      carriedObjectiveId: undefined,
    }));
    updateObjective(input.resolution, objective.id, (current) => ({
      ...current,
      state: { status: "DELIVERED", deliveredBy: carrier.nominalTeam },
    }));
    input.addReport(
      carrier.nominalTeam,
      "DELIVERY",
      "SUCCESS",
      `${objective.kind === "SCIENTIST" ? "과학자" : objective.kind === "BLUEPRINT" ? "설계도" : "상대 요원 명단"} 확보 완료`,
    );
    input.addReport(
      opposingTeam(carrier.nominalTeam),
      "DELIVERY",
      "WARNING",
      "상대가 목표 하나를 확보했습니다.",
    );
  }
  return delivered;
}

function settleEconomiesAndEffects(input: {
  readonly state: LocalTurnState;
  readonly resolution: MutableResolution;
  readonly successfulHacks: readonly HackAttempt[];
}) {
  const nextAllocationPenalty = {
    BLUE: Math.max(0, input.state.allocationPenaltyTurns.BLUE - 1),
    RED: Math.max(0, input.state.allocationPenaltyTurns.RED - 1),
  };
  const nextIntercept = {
    BLUE: Math.max(0, input.state.communicationsInterceptTurns.BLUE - 1),
    RED: Math.max(0, input.state.communicationsInterceptTurns.RED - 1),
  };
  const bankWinners = new Set<Team>();
  for (const hack of input.successfulHacks) {
    if (hack.facilityKind === "BANK") {
      bankWinners.add(hack.team);
      nextAllocationPenalty[opposingTeam(hack.team)] = 2;
    } else {
      nextIntercept[hack.team] = 2;
    }
  }

  const bankSnapshot = {
    BLUE: input.resolution.economies.BLUE.bank,
    RED: input.resolution.economies.RED.bank,
  };
  if (bankWinners.has("BLUE")) {
    input.resolution.economies.BLUE.bank += bankSnapshot.RED;
    input.resolution.economies.RED.bank -= bankSnapshot.RED;
  }
  if (bankWinners.has("RED")) {
    input.resolution.economies.RED.bank += bankSnapshot.BLUE;
    input.resolution.economies.BLUE.bank -= bankSnapshot.BLUE;
  }
  for (const team of teams) {
    input.resolution.economies[team] = settleUnusedAllocation(
      input.resolution.economies[team],
    );
  }
  return { nextAllocationPenalty, nextIntercept };
}

function calculateDetection(input: {
  readonly agents: readonly AgentState[];
  readonly objectives: readonly Objective[];
  readonly investigationVisible: Readonly<Record<Team, ReadonlySet<string>>>;
}) {
  const visible: Record<Team, Set<string>> = {
    BLUE: new Set(input.investigationVisible.BLUE),
    RED: new Set(input.investigationVisible.RED),
  };
  const carriers = new Set(
    input.objectives.flatMap((objective) =>
      objective.state.status === "CARRIED"
        ? [objective.state.carrierAgentId]
        : [],
    ),
  );
  for (const viewer of teams) {
    const own = input.agents.filter(
      (agent) => agent.status === "ACTIVE" && agent.nominalTeam === viewer,
    );
    for (const enemy of input.agents) {
      if (enemy.status !== "ACTIVE" || enemy.nominalTeam === viewer) {
        continue;
      }
      if (
        carriers.has(enemy.id) ||
        own.some((agent) => isWithin3x3(agent.coordinate, enemy.coordinate))
      ) {
        visible[viewer].add(enemy.id);
      }
    }
  }
  return visible;
}

export function resolveLocalTurn(input: {
  readonly state: LocalTurnState;
  readonly generalOrders: TeamOrders;
  readonly moleOrders: TeamMoleOrders;
}): ResolveLocalTurnResult {
  if (input.state.outcome.kind !== "ONGOING") {
    throw new Error("A finished local match cannot resolve another turn.");
  }
  const resolution: MutableResolution = {
    agents: input.state.agents.map((agent) => ({ ...agent })),
    objectives: input.state.objectives.map((objective) => ({
      ...objective,
      state: { ...objective.state },
    })),
    economies: {
      BLUE: { ...input.state.economies.BLUE },
      RED: { ...input.state.economies.RED },
    },
    hackState: cloneHackState(input.state.hackState),
    visible: {
      BLUE: new Set(input.state.visibleEnemyAgentIdsByViewer.BLUE),
      RED: new Set(input.state.visibleEnemyAgentIdsByViewer.RED),
    },
    reinforcements: [...input.state.reinforcements],
    pendingMoleRebuys: [...input.state.pendingMoleRebuys],
    removals: [],
  };
  const { reports, add } = reportFactory();
  assertAndSpendOrders({
    state: input.state,
    resolution,
    generalOrders: input.generalOrders,
    moleOrders: input.moleOrders,
  });
  for (const team of teams) {
    add(
      team,
      "COST",
      "INFO",
      `명령 비용 $${(
        input.state.economies[team].allocation +
        input.state.economies[team].bank -
        resolution.economies[team].allocation -
        resolution.economies[team].bank
      ).toLocaleString("en-US")} 확정`,
    );
  }

  const nextLoyaltyPenalty = resolveInterrogationAndPurge({
    state: input.state,
    resolution,
    orders: input.generalOrders,
    addReport: add,
  });
  const forced = forcedFailureSets({
    agents: resolution.agents,
    moleOrders: input.moleOrders,
  });
  const allOrders = [...input.generalOrders.BLUE, ...input.generalOrders.RED];
  const movement = resolveMovement({
    agents: resolution.agents,
    orders: allOrders,
    forcedMoveFailureAgentIds: forced.move,
    loyaltyPenaltyTeams: new Set(
      teams.filter((team) => input.state.loyaltyPenaltyTurns[team] > 0),
    ),
    rngSeed: `${input.state.seed}:turn:${input.state.turnNumber}`,
  });
  resolution.agents = movement.agents.map((agent) => ({ ...agent }));
  for (const movementResult of movement.results) {
    const agent = resolution.agents.find(
      (candidate) => candidate.id === movementResult.agentId,
    );
    if (!agent) continue;
    add(
      agent.nominalTeam,
      "MOVEMENT",
      movementResult.success ? "SUCCESS" : "WARNING",
      `요원 ${agent.role} 이동 ${movementResult.success ? "성공" : "실패"}`,
    );
  }

  resolveObjectivePickup({ state: input.state, resolution, addReport: add });
  const operation = resolveHacksAndInvestigations({
    state: input.state,
    resolution,
    orders: input.generalOrders,
    cancelledActions: movement.cancelledArrivalActions,
    forcedOperationFailures: forced.operation,
    addReport: add,
  });
  resolveAssassinations({
    state: input.state,
    resolution,
    orders: input.generalOrders,
    moleOrders: input.moleOrders,
    cancelledActions: movement.cancelledArrivalActions,
    forcedOperationFailures: forced.operation,
    addReport: add,
  });
  const deliveredThisTurn = deliverObjectives({
    state: input.state,
    resolution,
    addReport: add,
  });
  const effects = settleEconomiesAndEffects({
    state: input.state,
    resolution,
    successfulHacks: operation.successfulHacks,
  });
  resolution.visible = calculateDetection({
    agents: resolution.agents,
    objectives: resolution.objectives,
    investigationVisible: operation.investigationVisible,
  });

  const outcome = evaluateOutcome({
    deliveredBeforeTurn: {
      BLUE: new Set(input.state.deliveredObjectives.BLUE),
      RED: new Set(input.state.deliveredObjectives.RED),
    },
    deliveredThisResolution: deliveredThisTurn,
  });
  const deliveredObjectives = {
    BLUE: [
      ...new Set([
        ...input.state.deliveredObjectives.BLUE,
        ...deliveredThisTurn.BLUE,
      ]),
    ],
    RED: [
      ...new Set([
        ...input.state.deliveredObjectives.RED,
        ...deliveredThisTurn.RED,
      ]),
    ],
  };
  if (outcome.kind === "WIN") {
    add(
      outcome.winner,
      "OUTCOME",
      "SUCCESS",
      "두 번째 목표를 확보해 승리했습니다.",
    );
    add(
      opposingTeam(outcome.winner),
      "OUTCOME",
      "CRITICAL",
      "상대가 두 번째 목표를 확보했습니다.",
    );
  } else if (outcome.kind === "DRAW") {
    for (const team of teams)
      add(
        team,
        "OUTCOME",
        "WARNING",
        "양측이 동시에 두 번째 목표를 확보해 무승부입니다.",
      );
  }

  const resolvedState: LocalTurnState = {
    ...input.state,
    agents: resolution.agents,
    objectives: resolution.objectives,
    economies: resolution.economies,
    hackState: resolution.hackState,
    deliveredObjectives,
    loyaltyPenaltyTurns: nextLoyaltyPenalty,
    allocationPenaltyTurns: effects.nextAllocationPenalty,
    communicationsInterceptTurns: effects.nextIntercept,
    visibleEnemyAgentIdsByViewer: resolution.visible,
    reinforcements: resolution.reinforcements,
    pendingMoleRebuys: resolution.pendingMoleRebuys,
    outcome,
  };
  return {
    resolvedState,
    movementResults: movement.results,
    reports,
    removals: resolution.removals,
    deliveredThisTurn: {
      BLUE: [...deliveredThisTurn.BLUE],
      RED: [...deliveredThisTurn.RED],
    },
    outcome,
    replayKey: `${input.state.seed}:turn:${input.state.turnNumber}`,
  };
}

export function startNextLocalTurn(state: LocalTurnState): LocalTurnState {
  if (state.outcome.kind !== "ONGOING") return state;
  const nextTurn = state.turnNumber + 1;
  let agents = state.agents.map((agent) => ({ ...agent }));
  let pendingMoleRebuys = [...state.pendingMoleRebuys];
  const dueReinforcements = state.reinforcements
    .filter((entry) => entry.dueTurn === nextTurn)
    .sort((left, right) => compareId(left.agentId, right.agentId));
  const remainingReinforcements = state.reinforcements.filter(
    (entry) => entry.dueTurn !== nextTurn,
  );
  if (dueReinforcements.length > 0) {
    const spawnCells = state.map.facilities
      .filter(
        (facility) => facility.kind === "AIRPORT" || facility.kind === "PORT",
      )
      .flatMap((facility) => facility.cells)
      .filter(
        (coordinate) =>
          !agents.some(
            (agent) =>
              agent.status === "ACTIVE" &&
              sameCoordinate(agent.coordinate, coordinate),
          ),
      );
    const rng = createRng({
      seed: `${state.seed}:turn:${nextTurn}:reinforcement`,
      namespace: "REINFORCEMENT_PLACEMENT",
    });
    const selectedCells = rng
      .shuffle(spawnCells)
      .slice(0, dueReinforcements.length);
    if (selectedCells.length !== dueReinforcements.length) {
      throw new Error(
        "The v0.6 eight-cell reinforcement guarantee was violated.",
      );
    }
    dueReinforcements.forEach((entry, index) => {
      const coordinate = selectedCells[index]!;
      agents = agents.map((agent) =>
        agent.id === entry.agentId
          ? {
              ...agent,
              coordinate,
              status: "ACTIVE" as const,
              canAct: true,
              moleController: undefined,
              interrogationMark: undefined,
              carriedObjectiveId: undefined,
            }
          : agent,
      );
      if (entry.moleController && entry.moleRebuyTurn) {
        pendingMoleRebuys.push({
          team: entry.team,
          controller: entry.moleController,
          dueTurn: entry.moleRebuyTurn,
        });
      }
    });
  }

  const dueRebuys = pendingMoleRebuys.filter(
    (entry) => entry.dueTurn <= nextTurn,
  );
  pendingMoleRebuys = pendingMoleRebuys.filter(
    (entry) => entry.dueTurn > nextTurn,
  );
  for (const rebuy of dueRebuys) {
    const candidates = agents
      .filter(
        (agent) =>
          agent.status === "ACTIVE" && agent.nominalTeam === rebuy.team,
      )
      .sort((left, right) => compareId(left.id, right.id));
    if (candidates.length === 0) {
      pendingMoleRebuys.push({ ...rebuy, dueTurn: nextTurn + 1 });
      continue;
    }
    const selected = createRng({
      seed: `${state.seed}:turn:${nextTurn}:mole-rebuy:${rebuy.team}`,
      namespace: "MOLE_ASSIGNMENT",
    }).shuffle(candidates)[0]!;
    agents = agents.map((agent) =>
      agent.id === selected.id
        ? { ...agent, moleController: rebuy.controller }
        : agent,
    );
    agents = agents.map((agent) =>
      agent.nominalTeam === rebuy.team
        ? { ...agent, interrogationMark: undefined }
        : agent,
    );
  }

  const visible = calculateDetection({
    agents,
    objectives: state.objectives,
    investigationVisible: { BLUE: new Set(), RED: new Set() },
  });
  return {
    ...state,
    turnNumber: nextTurn,
    agents,
    economies: {
      BLUE: {
        allocation: state.allocationPenaltyTurns.BLUE > 0 ? 2_000 : 3_000,
        bank: state.economies.BLUE.bank,
      },
      RED: {
        allocation: state.allocationPenaltyTurns.RED > 0 ? 2_000 : 3_000,
        bank: state.economies.RED.bank,
      },
    },
    visibleEnemyAgentIdsByViewer: visible,
    reinforcements: remainingReinforcements,
    pendingMoleRebuys,
  };
}

export function localStateFingerprint(state: LocalTurnState): string {
  const compact = {
    turn: state.turnNumber,
    agents: state.agents
      .map((agent) => [
        agent.id,
        agent.coordinate.row,
        agent.coordinate.col,
        agent.status,
        agent.moleController ?? null,
        agent.interrogationMark ?? null,
        agent.carriedObjectiveId ?? null,
      ])
      .sort((left, right) => compareId(String(left[0]), String(right[0]))),
    objectives: state.objectives
      .map((objective) => [objective.id, objective.kind, objective.state])
      .sort((left, right) => compareId(String(left[0]), String(right[0]))),
    economies: state.economies,
    delivered: state.deliveredObjectives,
    outcome: state.outcome,
  };
  let hash = 2_166_136_261;
  const serialized = JSON.stringify(compact);
  for (let index = 0; index < serialized.length; index += 1) {
    hash ^= serialized.charCodeAt(index);
    hash = Math.imul(hash, 16_777_619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
