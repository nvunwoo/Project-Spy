import type {
  AgentRole,
  AgentState,
  AgentStatus,
  Coordinate,
  GamePhase,
  GameStatus,
  InterrogationMark,
  Objective,
  ObjectiveKind,
  Team,
} from "@/domain/model/game-types";
import { RULES_VERSION } from "@/domain/model/game-types";
import { excelAddressToCoordinate } from "@/domain/map/coordinates";
import {
  createV06FixtureMapManifest,
  type CellKind,
  type FacilityKind,
  type MapManifest,
} from "@/domain/map/map-manifest";
import type { Economy } from "@/domain/orders/order-types";

export interface FixtureCanonicalState {
  readonly gameId: string;
  readonly status: GameStatus;
  readonly phase: GamePhase;
  readonly turnNumber: number;
  readonly revision: number;
  readonly rngSeed: string;
  readonly map: MapManifest;
  readonly agents: readonly AgentState[];
  readonly objectives: readonly Objective[];
  readonly economies: Readonly<Record<Team, Economy>>;
  readonly visibleEnemyAgentIdsByViewer: Readonly<
    Record<Team, ReadonlySet<string>>
  >;
}

export interface PublicMapCell {
  readonly id: number;
  readonly coordinate: Coordinate;
  readonly kind: CellKind;
  readonly facilityId?: string;
  readonly facilityKind?: FacilityKind;
}

export type AgentViewId = `agent-view-${string}`;

export interface OwnAgentProjection {
  readonly viewId: AgentViewId;
  readonly role: AgentRole;
  readonly coordinate: Coordinate;
  readonly status: AgentStatus;
  readonly canAct: boolean;
  readonly interrogationMark?: InterrogationMark;
  readonly carriedObjectiveId?: string;
}

export interface VisibleEnemyAgentProjection {
  readonly viewId: AgentViewId;
  readonly coordinate: Coordinate;
  readonly status: AgentStatus;
  readonly isCarryingObjective: boolean;
}

export interface ControlledMoleProjection {
  readonly viewId: AgentViewId;
  readonly nominalTeam: Team;
  readonly role: AgentRole;
  readonly coordinate: Coordinate;
  readonly status: AgentStatus;
}

export interface KnownObjectiveProjection {
  readonly id: string;
  readonly kind: ObjectiveKind;
  readonly status: "HIDDEN" | "CARRIED" | "DROPPED" | "DELIVERED";
  readonly coordinate?: Coordinate;
  readonly carrierViewId?: AgentViewId;
  readonly deliveredBy?: Team;
  readonly scientistExit?: "AIRPORT" | "PORT";
}

type FixtureCanonicalAgentId = `${Lowercase<Team>}-${Lowercase<AgentRole>}`;

// These opaque fixture tokens model server-owned, viewer-scoped identifiers.
// They are intentionally unrelated to team or role and never fall back to a
// canonical ID when the allowlist is incomplete.
const FIXTURE_AGENT_VIEW_IDS = {
  BLUE: {
    "blue-k": "agent-view-a2q7",
    "blue-h": "agent-view-f8r3",
    "blue-d": "agent-view-u6c1",
    "red-k": "agent-view-n5x8",
    "red-h": "agent-view-b9t2",
    "red-d": "agent-view-g1p6",
  },
  RED: {
    "blue-k": "agent-view-c7y4",
    "blue-h": "agent-view-v2n9",
    "blue-d": "agent-view-q4e1",
    "red-k": "agent-view-z6l3",
    "red-h": "agent-view-d9w7",
    "red-d": "agent-view-t5m2",
  },
} as const satisfies Readonly<
  Record<Team, Readonly<Record<FixtureCanonicalAgentId, AgentViewId>>>
>;

function getAgentViewId(
  viewerTeam: Team,
  canonicalAgentId: string,
): AgentViewId {
  const viewId = (
    FIXTURE_AGENT_VIEW_IDS[viewerTeam] as Readonly<
      Partial<Record<FixtureCanonicalAgentId, AgentViewId>>
    >
  )[canonicalAgentId as FixtureCanonicalAgentId];

  if (!viewId) {
    throw new Error("Fixture agent view ID allowlist is incomplete.");
  }

  return viewId;
}

export interface FixturePlayerProjection {
  readonly contractVersion: "fixture.t0.2";
  readonly rulesVersion: typeof RULES_VERSION;
  readonly gameId: string;
  readonly status: GameStatus;
  readonly phase: GamePhase;
  readonly turnNumber: number;
  readonly revision: number;
  readonly viewerTeam: Team;
  readonly economy: Economy;
  readonly map: {
    readonly id: string;
    readonly width: 16;
    readonly height: 16;
    readonly cells: readonly PublicMapCell[];
  };
  readonly ownAgents: readonly OwnAgentProjection[];
  readonly visibleEnemyAgents: readonly VisibleEnemyAgentProjection[];
  readonly controlledMole?: ControlledMoleProjection;
  readonly knownObjectives: readonly KnownObjectiveProjection[];
}

function cloneCoordinate(coordinate: Coordinate): Coordinate {
  return { row: coordinate.row, col: coordinate.col };
}

function projectKnownObjective(
  objective: Objective,
  viewerTeam: Team,
  agentsById: ReadonlyMap<string, AgentState>,
): KnownObjectiveProjection | null {
  const ownRosterKind: ObjectiveKind =
    viewerTeam === "RED" ? "RED_ROSTER" : "BLUE_ROSTER";

  switch (objective.state.status) {
    case "HIDDEN":
      return objective.kind === ownRosterKind
        ? {
            id: objective.id,
            kind: objective.kind,
            status: "HIDDEN",
            coordinate: cloneCoordinate(objective.state.coordinate),
          }
        : null;
    case "DROPPED":
      return {
        id: objective.id,
        kind: objective.kind,
        status: "DROPPED",
        coordinate: cloneCoordinate(objective.state.coordinate),
      };
    case "DELIVERED":
      return {
        id: objective.id,
        kind: objective.kind,
        status: "DELIVERED",
        deliveredBy: objective.state.deliveredBy,
      };
    case "CARRIED": {
      const carrier = agentsById.get(objective.state.carrierAgentId);
      if (!carrier) {
        throw new Error(`Fixture objective ${objective.id} has no carrier.`);
      }
      const maySeeScientistExit =
        objective.kind === "SCIENTIST" && carrier.nominalTeam === viewerTeam;
      return {
        id: objective.id,
        kind: objective.kind,
        status: "CARRIED",
        carrierViewId: getAgentViewId(viewerTeam, carrier.id),
        coordinate: cloneCoordinate(carrier.coordinate),
        ...(maySeeScientistExit && objective.scientistExit
          ? { scientistExit: objective.scientistExit }
          : {}),
      };
    }
  }
}

export function projectFixtureForTeam(
  state: FixtureCanonicalState,
  viewerTeam: Team,
): FixturePlayerProjection {
  const agentsById = new Map(state.agents.map((agent) => [agent.id, agent]));
  const carrierIds = new Set(
    state.objectives.flatMap((objective) =>
      objective.state.status === "CARRIED"
        ? [objective.state.carrierAgentId]
        : [],
    ),
  );
  const explicitlyVisible = state.visibleEnemyAgentIdsByViewer[viewerTeam];

  const ownAgents = state.agents
    .filter((agent) => agent.nominalTeam === viewerTeam)
    .map<OwnAgentProjection>((agent) => ({
      viewId: getAgentViewId(viewerTeam, agent.id),
      role: agent.role,
      coordinate: cloneCoordinate(agent.coordinate),
      status: agent.status,
      canAct: agent.canAct,
      ...(agent.interrogationMark
        ? { interrogationMark: agent.interrogationMark }
        : {}),
      ...(agent.carriedObjectiveId
        ? { carriedObjectiveId: agent.carriedObjectiveId }
        : {}),
    }));

  const visibleEnemyAgents = state.agents
    .filter(
      (agent) =>
        agent.nominalTeam !== viewerTeam &&
        (explicitlyVisible.has(agent.id) || carrierIds.has(agent.id)),
    )
    .map<VisibleEnemyAgentProjection>((agent) => ({
      viewId: getAgentViewId(viewerTeam, agent.id),
      coordinate: cloneCoordinate(agent.coordinate),
      status: agent.status,
      isCarryingObjective: carrierIds.has(agent.id),
    }));

  const controlledMole = state.agents.find(
    (agent) => agent.moleController === viewerTeam && agent.status === "ACTIVE",
  );

  const knownObjectives = state.objectives.flatMap((objective) => {
    const projection = projectKnownObjective(objective, viewerTeam, agentsById);
    return projection ? [projection] : [];
  });

  return {
    contractVersion: "fixture.t0.2",
    rulesVersion: RULES_VERSION,
    gameId: state.gameId,
    status: state.status,
    phase: state.phase,
    turnNumber: state.turnNumber,
    revision: state.revision,
    viewerTeam,
    economy: { ...state.economies[viewerTeam] },
    map: {
      id: state.map.id,
      width: state.map.width,
      height: state.map.height,
      cells: state.map.cells.map((cell) => ({
        id: cell.id,
        coordinate: cloneCoordinate(cell.coordinate),
        kind: cell.kind,
        ...(cell.facilityId ? { facilityId: cell.facilityId } : {}),
        ...(cell.facilityKind ? { facilityKind: cell.facilityKind } : {}),
      })),
    },
    ownAgents,
    visibleEnemyAgents,
    ...(controlledMole
      ? {
          controlledMole: {
            viewId: getAgentViewId(viewerTeam, controlledMole.id),
            nominalTeam: controlledMole.nominalTeam,
            role: controlledMole.role,
            coordinate: cloneCoordinate(controlledMole.coordinate),
            status: controlledMole.status,
          },
        }
      : {}),
    knownObjectives,
  };
}

function createAgent(
  team: Team,
  role: AgentRole,
  address: string,
  extras: Partial<AgentState> = {},
): AgentState {
  return {
    id: `${team.toLowerCase()}-${role.toLowerCase()}`,
    nominalTeam: team,
    role,
    coordinate: excelAddressToCoordinate(address),
    status: "ACTIVE",
    canAct: true,
    ...extras,
  };
}

export function createFixtureCanonicalState(): FixtureCanonicalState {
  return {
    gameId: "fixture-room-alpha",
    status: "ACTIVE",
    phase: "GENERAL_ORDER_OPEN",
    turnNumber: 1,
    revision: 1,
    rngSeed: "server-only-fixture-seed",
    map: createV06FixtureMapManifest(),
    agents: [
      createAgent("BLUE", "K", "P3", { interrogationMark: "LOYAL" }),
      createAgent("BLUE", "H", "P1", { moleController: "RED" }),
      createAgent("BLUE", "D", "N1"),
      createAgent("RED", "K", "A14"),
      createAgent("RED", "H", "A16"),
      createAgent("RED", "D", "C16", { moleController: "BLUE" }),
    ],
    objectives: [
      {
        id: "red-roster",
        kind: "RED_ROSTER",
        state: { status: "HIDDEN", coordinate: excelAddressToCoordinate("E2") },
      },
      {
        id: "blue-roster",
        kind: "BLUE_ROSTER",
        state: {
          status: "HIDDEN",
          coordinate: excelAddressToCoordinate("I15"),
        },
      },
      {
        id: "blueprint",
        kind: "BLUEPRINT",
        state: { status: "HIDDEN", coordinate: excelAddressToCoordinate("E5") },
      },
      {
        id: "scientist",
        kind: "SCIENTIST",
        // H8 is equidistant (13 legal steps) from the nearest initial agent of
        // each team in this frozen fixture candidate.
        state: { status: "HIDDEN", coordinate: excelAddressToCoordinate("H8") },
        scientistExit: "PORT",
      },
    ],
    economies: {
      RED: { allocation: 3_000, bank: 2_500 },
      BLUE: { allocation: 3_000, bank: 2_500 },
    },
    visibleEnemyAgentIdsByViewer: {
      RED: new Set<string>(),
      BLUE: new Set<string>(),
    },
  };
}
