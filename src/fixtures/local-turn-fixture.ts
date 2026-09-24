import type {
  AgentRole,
  AgentState,
  Objective,
  Team,
} from "@/domain/model/game-types";
import {
  excelAddressToCoordinate,
  sameCoordinate,
  toCellId,
} from "@/domain/map/coordinates";
import {
  createV06FixtureMapManifest,
  getMapCell,
  V06_INITIAL_AGENT_SPAWNS,
} from "@/domain/map/map-manifest";
import {
  findReachableDestinations,
  getMaxMoveDistance,
} from "@/domain/map/pathfinding";
import {
  createEmptyHackState,
  getAvailableFunds,
  getGeneralOrderCost,
} from "@/domain/orders/order-rules";
import type { GeneralOrder, MoleOrder } from "@/domain/orders/order-types";
import type { LocalTurnState } from "@/domain/resolve-turn/turn-state";
import { createRng } from "@/domain/rng/deterministic-rng";

export const DEFAULT_LOCAL_MATCH_SEED = "서울-훈련-042";

export function createNextLocalMatchSeed(currentSeed: string): string {
  const normalizedSeed = currentSeed.trim() || DEFAULT_LOCAL_MATCH_SEED;
  const suffix = createRng({
    seed: `${normalizedSeed}:next-local-training-seed`,
    namespace: "FACILITY_PLACEMENT",
  })
    .nextUint32()
    .toString(16)
    .padStart(8, "0");
  return `서울-훈련-${suffix}`;
}

export const rosterPlacementCandidates = [
  {
    facilityId: "hotel-1",
    label: "호텔 1",
    coordinate: excelAddressToCoordinate("E2"),
  },
  {
    facilityId: "subway-1",
    label: "지하철역 1",
    coordinate: excelAddressToCoordinate("L15"),
  },
  {
    facilityId: "hotel-2",
    label: "호텔 2",
    coordinate: excelAddressToCoordinate("H2"),
  },
  {
    facilityId: "subway-2",
    label: "지하철역 2",
    coordinate: excelAddressToCoordinate("I15"),
  },
  {
    facilityId: "hotel-3",
    label: "호텔 3",
    coordinate: excelAddressToCoordinate("K2"),
  },
  {
    facilityId: "subway-3",
    label: "지하철역 3",
    coordinate: excelAddressToCoordinate("F15"),
  },
  {
    facilityId: "hotel-4",
    label: "호텔 4",
    coordinate: excelAddressToCoordinate("N5"),
  },
  {
    facilityId: "subway-4",
    label: "지하철역 4",
    coordinate: excelAddressToCoordinate("C12"),
  },
  {
    facilityId: "hotel-5",
    label: "호텔 5",
    coordinate: excelAddressToCoordinate("B8"),
  },
  {
    facilityId: "subway-5",
    label: "지하철역 5",
    coordinate: excelAddressToCoordinate("O9"),
  },
] as const;

function createAgent(input: {
  readonly team: Team;
  readonly role: AgentRole;
  readonly moleController?: Team;
}): AgentState {
  const spawn = V06_INITIAL_AGENT_SPAWNS.find(
    (candidate) =>
      candidate.team === input.team && candidate.role === input.role,
  );
  if (!spawn) {
    throw new Error(`Missing v0.6 spawn for ${input.team} ${input.role}.`);
  }
  return {
    id: `${input.team.toLowerCase()}-${input.role.toLowerCase()}`,
    nominalTeam: input.team,
    role: input.role,
    coordinate: spawn.coordinate,
    status: "ACTIVE",
    canAct: true,
    ...(input.moleController ? { moleController: input.moleController } : {}),
  };
}

function chooseRedRosterCoordinate(seed: string, blueFacilityId: string) {
  const candidates = rosterPlacementCandidates.filter(
    (candidate) => candidate.facilityId !== blueFacilityId,
  );
  const rng = createRng({
    seed: `${seed}:red-roster`,
    namespace: "OBJECTIVE_PLACEMENT",
  });
  return rng.shuffle(candidates)[0]!.coordinate;
}

export function createLocalTurnFixture(
  input: {
    readonly seed?: string;
    readonly blueRosterFacilityId?: string;
  } = {},
): LocalTurnState {
  const seed = input.seed?.trim() || DEFAULT_LOCAL_MATCH_SEED;
  const blueRoster =
    rosterPlacementCandidates.find(
      (candidate) => candidate.facilityId === input.blueRosterFacilityId,
    ) ?? rosterPlacementCandidates[0];
  const agents: AgentState[] = [
    createAgent({ team: "BLUE", role: "K" }),
    createAgent({
      team: "BLUE",
      role: "H",
      moleController: "RED",
    }),
    createAgent({ team: "BLUE", role: "D" }),
    createAgent({ team: "RED", role: "K" }),
    createAgent({ team: "RED", role: "H" }),
    createAgent({
      team: "RED",
      role: "D",
      moleController: "BLUE",
    }),
  ];
  const objectives: Objective[] = [
    {
      id: "red-roster",
      kind: "RED_ROSTER",
      state: {
        status: "HIDDEN",
        coordinate: chooseRedRosterCoordinate(seed, blueRoster.facilityId),
      },
    },
    {
      id: "blue-roster",
      kind: "BLUE_ROSTER",
      state: { status: "HIDDEN", coordinate: blueRoster.coordinate },
    },
    {
      id: "blueprint",
      kind: "BLUEPRINT",
      state: { status: "HIDDEN", coordinate: excelAddressToCoordinate("E5") },
    },
    {
      id: "scientist",
      kind: "SCIENTIST",
      state: { status: "HIDDEN", coordinate: excelAddressToCoordinate("K8") },
      scientistExit: "PORT",
    },
  ];
  return {
    fixtureVersion: "local-turn.phase0b.4",
    seed,
    turnNumber: 4,
    map: createV06FixtureMapManifest(),
    agents,
    objectives,
    economies: {
      BLUE: { allocation: 3_000, bank: 2_500 },
      RED: { allocation: 3_000, bank: 2_500 },
    },
    hackState: createEmptyHackState(),
    deliveredObjectives: { BLUE: [], RED: [] },
    loyaltyPenaltyTurns: { BLUE: 0, RED: 0 },
    allocationPenaltyTurns: { BLUE: 0, RED: 0 },
    communicationsInterceptTurns: { BLUE: 0, RED: 0 },
    visibleEnemyAgentIdsByViewer: {
      BLUE: new Set(["red-k"]),
      RED: new Set(["blue-k"]),
    },
    reinforcements: [],
    pendingMoleRebuys: [],
    outcome: { kind: "ONGOING" },
  };
}

function distanceToCenter(coordinate: {
  readonly row: number;
  readonly col: number;
}) {
  return Math.abs(coordinate.row - 7.5) + Math.abs(coordinate.col - 7.5);
}

function chooseFixtureMove(
  state: LocalTurnState,
  agent: AgentState,
): readonly { readonly row: number; readonly col: number }[] {
  const paths = [
    ...findReachableDestinations({
      manifest: state.map,
      origin: agent.coordinate,
      maxDistance: Math.min(2, getMaxMoveDistance(agent.role)),
    }).values(),
  ].filter((path) => path.length > 0);
  const ranked = paths.sort((left, right) => {
    const leftDestination = left.at(-1)!;
    const rightDestination = right.at(-1)!;
    return (
      distanceToCenter(leftDestination) - distanceToCenter(rightDestination) ||
      toCellId(leftDestination) - toCellId(rightDestination)
    );
  });
  return ranked[0] ?? [];
}

export function createFixtureOpponentOrders(
  state: LocalTurnState,
  team: Team,
): readonly GeneralOrder[] {
  let remaining = getAvailableFunds(state.economies[team]);
  const orders: GeneralOrder[] = [];
  const agents = state.agents
    .filter(
      (agent) =>
        agent.nominalTeam === team && agent.status === "ACTIVE" && agent.canAct,
    )
    .sort((left, right) => compareRole(left.role, right.role));

  for (const agent of agents) {
    const visibleTarget = state.agents
      .filter(
        (target) =>
          target.nominalTeam !== team &&
          target.status === "ACTIVE" &&
          state.visibleEnemyAgentIdsByViewer[team].has(target.id),
      )
      .find(
        (target) =>
          Math.abs(target.coordinate.row - agent.coordinate.row) <= 1 &&
          Math.abs(target.coordinate.col - agent.coordinate.col) <= 1,
      );
    let candidate: GeneralOrder | undefined;
    if (agent.role === "K" && visibleTarget) {
      candidate = {
        kind: "OPERATE",
        agentId: agent.id,
        path: [],
        arrivalAction: {
          kind: "ASSASSINATE",
          targetAgentId: visibleTarget.id,
        },
      };
    } else {
      const cell = getMapCell(state.map, agent.coordinate);
      if (
        agent.role === "H" &&
        cell.facilityId &&
        (cell.facilityKind === "BANK" ||
          cell.facilityKind === "COMMUNICATIONS") &&
        !state.hackState.disabledFacilityIds.has(cell.facilityId)
      ) {
        candidate = {
          kind: "OPERATE",
          agentId: agent.id,
          path: [],
          arrivalAction: { kind: "HACK", facilityId: cell.facilityId },
        };
      } else if (agent.role === "D") {
        candidate = {
          kind: "OPERATE",
          agentId: agent.id,
          path: [],
          arrivalAction: { kind: "INVESTIGATE" },
        };
      } else {
        const path = chooseFixtureMove(state, agent);
        candidate = {
          kind: "OPERATE",
          agentId: agent.id,
          path,
          arrivalAction: { kind: "MOVE_ONLY" },
        };
      }
    }
    const cost = getGeneralOrderCost(candidate);
    if (cost <= remaining) {
      orders.push(candidate);
      remaining -= cost;
    } else {
      orders.push({ kind: "WAIT", agentId: agent.id });
    }
  }
  return orders;
}

function compareRole(left: AgentRole, right: AgentRole): number {
  const order: readonly AgentRole[] = ["K", "H", "D"];
  return order.indexOf(left) - order.indexOf(right);
}

export function createFixtureMoleOrder(input: {
  readonly controller: Team;
  readonly state: LocalTurnState;
  readonly nominalOrders: readonly GeneralOrder[];
}): MoleOrder | undefined {
  const mole = input.state.agents.find(
    (agent) =>
      agent.status === "ACTIVE" && agent.moleController === input.controller,
  );
  if (!mole) return undefined;
  const order = input.nominalOrders.find(
    (candidate) => candidate.agentId === mole.id,
  );
  if (order?.kind === "OPERATE" && order.path.length > 0) {
    return { kind: "FORCE_MOVE_FAILURE", moleAgentId: mole.id };
  }
  if (order?.kind === "OPERATE" && order.arrivalAction.kind !== "MOVE_ONLY") {
    return { kind: "FORCE_OPERATION_FAILURE", moleAgentId: mole.id };
  }
  return { kind: "ACQUIESCE", moleAgentId: mole.id };
}

export function getMoleColleagueCandidates(
  state: LocalTurnState,
  controller: Team,
): readonly AgentState[] {
  const mole = state.agents.find(
    (agent) => agent.status === "ACTIVE" && agent.moleController === controller,
  );
  if (!mole) return [];
  return state.agents.filter(
    (agent) =>
      agent.id !== mole.id &&
      agent.status === "ACTIVE" &&
      agent.nominalTeam === mole.nominalTeam &&
      Math.abs(agent.coordinate.row - mole.coordinate.row) <= 2 &&
      Math.abs(agent.coordinate.col - mole.coordinate.col) <= 2 &&
      !sameCoordinate(agent.coordinate, mole.coordinate),
  );
}
