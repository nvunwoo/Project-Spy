import type { ObjectiveKind, Team } from "@/domain/model/game-types";
import type {
  FacilityInstance,
  FacilityKind,
  MapManifest,
} from "@/domain/map/map-manifest";
import type { LocalTurnState } from "@/domain/resolve-turn/turn-state";
import type {
  AgentDraftView,
  ControlledMoleView,
  FixturePlayerProjection,
  IntelligenceView,
  MapBuildingView,
  OwnAgentView,
} from "@/shared/contracts/player-projection";

const opponentViewIds = {
  BLUE: {
    "red-k": "contact-c7m2",
    "red-h": "contact-v4q9",
    "red-d": "contact-p5x6",
  },
  RED: {
    "blue-k": "contact-u2d7",
    "blue-h": "contact-f9w3",
    "blue-d": "contact-j1s4",
  },
} as const satisfies Readonly<Record<Team, Readonly<Record<string, string>>>>;

const specialty = {
  K: "암살 성공률 +20%p",
  H: "해킹 성공률 +20%p",
  D: "조사 성공률 +20%p",
} as const;

const objectiveLabel: Readonly<Record<ObjectiveKind, string>> = {
  RED_ROSTER: "RED 요원 명단",
  BLUE_ROSTER: "BLUE 요원 명단",
  BLUEPRINT: "설계도",
  SCIENTIST: "과학자",
};

const facilityLabel: Readonly<Record<FacilityKind, string>> = {
  RED_EMBASSY: "RED 대사관",
  BLUE_EMBASSY: "BLUE 대사관",
  POWER_PLANT: "발전소",
  LABORATORY: "연구소",
  UNIVERSITY: "대학교",
  GOVERNMENT_OFFICE: "정부 청사",
  BROADCAST_STATION: "방송국",
  FACTORY: "공장",
  MILITARY_BASE: "군사 기지",
  AIRPORT: "공항",
  PORT: "항구",
  BANK: "은행",
  COMMUNICATIONS: "통신국",
  HOTEL: "호텔",
  SUBWAY: "지하철역",
};

function labelForFacility(facility: FacilityInstance): string {
  const suffix = /-(\d+)$/u.exec(facility.id)?.[1];
  const base = facilityLabel[facility.kind];
  return suffix ? `${base} ${Number(suffix)}` : base;
}

export function projectMapBuildings(
  manifest: MapManifest,
): readonly MapBuildingView[] {
  const facilities = new Map(
    manifest.facilities.map((facility) => [facility.id, facility]),
  );
  const projectedLargeFacilities = new Set<string>();
  const buildings: MapBuildingView[] = [];

  for (const cell of manifest.cells) {
    if (cell.kind === "ROAD") continue;
    if (cell.kind === "GENERAL_BUILDING") {
      buildings.push({
        id: `general-${cell.id}`,
        coordinate: cell.coordinate,
        footprint: 1,
        kind: "GENERAL",
        label: null,
        labelVisibility: "NONE",
      });
      continue;
    }

    const facility = cell.facilityId
      ? facilities.get(cell.facilityId)
      : undefined;
    if (!facility) continue;
    const isLarge = facility.kind === "AIRPORT" || facility.kind === "PORT";
    if (isLarge && projectedLargeFacilities.has(facility.id)) continue;
    if (isLarge) projectedLargeFacilities.add(facility.id);

    const topLeft = isLarge
      ? {
          row: Math.min(...facility.cells.map((coordinate) => coordinate.row)),
          col: Math.min(...facility.cells.map((coordinate) => coordinate.col)),
        }
      : cell.coordinate;
    const discoverable =
      facility.kind === "HOTEL" || facility.kind === "SUBWAY";
    buildings.push({
      id: facility.id,
      coordinate: topLeft,
      footprint: isLarge ? 2 : 1,
      kind: facility.kind,
      label: labelForFacility(facility),
      labelVisibility: discoverable ? "DISCOVER" : "ALWAYS",
    });
  }

  return buildings.sort(
    (left, right) =>
      left.coordinate.row - right.coordinate.row ||
      left.coordinate.col - right.coordinate.col ||
      left.id.localeCompare(right.id),
  );
}

function objectiveForMission(
  state: LocalTurnState,
  kind: ObjectiveKind,
  viewer: Team,
): FixturePlayerProjection["objectives"][number] {
  const objective = state.objectives.find(
    (candidate) => candidate.kind === kind,
  );
  if (!objective) throw new Error(`Missing fixture objective ${kind}.`);
  const delivered = objective.state.status === "DELIVERED";
  const carrierAgentId =
    objective.state.status === "CARRIED"
      ? objective.state.carrierAgentId
      : null;
  const carriedByViewer =
    carrierAgentId !== null &&
    state.agents.some(
      (agent) => agent.id === carrierAgentId && agent.nominalTeam === viewer,
    );
  const dropped = objective.state.status === "DROPPED";
  return {
    id: objective.id,
    label: objectiveLabel[kind],
    state: delivered
      ? "DELIVERED"
      : carriedByViewer
        ? "CARRIED"
        : dropped
          ? "LOCATED"
          : "UNKNOWN",
  };
}

export function projectLocalMatchForTeam(input: {
  readonly state: LocalTurnState;
  readonly viewer: Team;
  readonly drafts?: Readonly<Record<string, AgentDraftView>>;
  readonly remainingSeconds?: number;
}): FixturePlayerProjection {
  const opponentIds = opponentViewIds[input.viewer];
  const ownAgents: OwnAgentView[] = input.state.agents
    .filter((agent) => agent.nominalTeam === input.viewer)
    .map((agent) => ({
      id: agent.id,
      callsign: agent.role,
      team: agent.nominalTeam,
      coordinate: agent.coordinate,
      status: agent.status,
      specialty: specialty[agent.role],
      carrying: agent.carriedObjectiveId
        ? objectiveLabel[
            input.state.objectives.find(
              (objective) => objective.id === agent.carriedObjectiveId,
            )?.kind ?? "BLUEPRINT"
          ]
        : null,
      draft: input.drafts?.[agent.id] ?? null,
    }));
  const controlledMoleAgent = input.state.agents.find(
    (agent) =>
      agent.moleController === input.viewer && agent.status === "ACTIVE",
  );
  const controlledMole: ControlledMoleView | null = controlledMoleAgent
    ? {
        id: controlledMoleAgent.id,
        callsign: controlledMoleAgent.role,
        nominalTeam: controlledMoleAgent.nominalTeam,
        coordinate: controlledMoleAgent.coordinate,
        status: controlledMoleAgent.status,
        specialty: specialty[controlledMoleAgent.role],
      }
    : null;
  const visibleOpponents = input.state.agents
    .filter(
      (agent) =>
        agent.nominalTeam !== input.viewer &&
        agent.id !== controlledMoleAgent?.id &&
        agent.status === "ACTIVE" &&
        input.state.visibleEnemyAgentIdsByViewer[input.viewer].has(agent.id),
    )
    .map((agent, index) => ({
      id:
        opponentIds[agent.id as keyof typeof opponentIds] ??
        `contact-${index + 1}`,
      label: `${agent.nominalTeam} 접촉자 ${index + 1}`,
      team: agent.nominalTeam,
      coordinate: agent.coordinate,
      carryingPublicObjective: Boolean(agent.carriedObjectiveId),
    }));
  const validObjectiveKinds: readonly ObjectiveKind[] =
    input.viewer === "BLUE"
      ? ["RED_ROSTER", "BLUEPRINT", "SCIENTIST"]
      : ["BLUE_ROSTER", "BLUEPRINT", "SCIENTIST"];
  const intelligence: IntelligenceView[] = [];
  if (input.state.communicationsInterceptTurns[input.viewer] > 0) {
    intelligence.push({
      id: "wiretap-active",
      label: `상대 일반 명령 도청 · ${input.state.communicationsInterceptTurns[input.viewer]}턴`,
      tone: "INFO",
    });
  }
  if (input.state.loyaltyPenaltyTurns[input.viewer] > 0) {
    intelligence.push({
      id: "loyalty-penalty",
      label: "충성도 저하 · 확률형 공작 -10%p",
      tone: "CRITICAL",
    });
  }
  if (intelligence.length === 0) {
    intelligence.push({
      id: "city-status",
      label: "추가 첩보 없음",
      tone: "INFO",
    });
  }
  return {
    fixture: true,
    team: input.viewer,
    turn: input.state.turnNumber,
    phase: "GENERAL_ORDER_OPEN",
    remainingSeconds: input.remainingSeconds ?? 50,
    funds: { ...input.state.economies[input.viewer] },
    objectives: validObjectiveKinds.map((kind) =>
      objectiveForMission(input.state, kind, input.viewer),
    ),
    intelligence,
    buildings: projectMapBuildings(input.state.map),
    agents: ownAgents,
    controlledMole,
    visibleOpponents,
  };
}

export function opponentViewIdToCanonical(
  viewer: Team,
  viewId: string,
): string | null {
  const entries = Object.entries(opponentViewIds[viewer]);
  return entries.find(([, candidate]) => candidate === viewId)?.[0] ?? null;
}
