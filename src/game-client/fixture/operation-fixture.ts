import {
  fromCellId,
  orderedOrthogonalNeighbors,
} from "@/domain/map/coordinates";
import { createV06FixtureMapManifest } from "@/domain/map/map-manifest";
import {
  findReachableDestinations,
  getMaxMoveDistance,
  validatePath,
} from "@/domain/map/pathfinding";
import type {
  CoordinateView,
  FixturePlayerProjection,
  OwnAgentView,
} from "@/shared/contracts/player-projection";
import { projectMapBuildings } from "@/game-client/fixture/local-match-view";

const fixtureManifest = createV06FixtureMapManifest();

export const operationFixture: FixturePlayerProjection = {
  fixture: true,
  team: "BLUE",
  turn: 4,
  phase: "GENERAL_ORDER_OPEN",
  remainingSeconds: 38,
  funds: {
    allocation: 3_000,
    bank: 2_500,
  },
  objectives: [
    { id: "red-roster", label: "RED 요원 명단 탈취", state: "LOCATED" },
    { id: "blueprint", label: "무기 설계도 확보", state: "UNKNOWN" },
    { id: "scientist", label: "과학자 확보", state: "CARRIED" },
  ],
  intelligence: [
    { id: "wiretap", label: "통신국 도청 감지", tone: "WARNING" },
    { id: "bank", label: "상대 은행 접근 흔적", tone: "INFO" },
  ],
  buildings: projectMapBuildings(fixtureManifest),
  controlledMole: null,
  agents: [
    {
      id: "blue-k",
      callsign: "K",
      team: "BLUE",
      coordinate: { row: 2, col: 15 },
      status: "ACTIVE",
      specialty: "암살 성공률 +20%p",
      carrying: null,
      draft: null,
    },
    {
      id: "blue-h",
      callsign: "H",
      team: "BLUE",
      coordinate: { row: 0, col: 15 },
      status: "ACTIVE",
      specialty: "해킹 성공률 +20%p",
      carrying: "과학자",
      draft: null,
    },
    {
      id: "blue-d",
      callsign: "D",
      team: "BLUE",
      coordinate: { row: 0, col: 13 },
      status: "ACTIVE",
      specialty: "조사 성공률 +20%p",
      carrying: null,
      draft: null,
    },
  ],
  visibleOpponents: [
    {
      id: "red-contact-7",
      label: "RED 접촉자 7",
      team: "RED",
      coordinate: { row: 13, col: 0 },
      carryingPublicObjective: false,
    },
  ],
};

export const fixturePathToP6 = [
  { row: 3, col: 15 },
  { row: 4, col: 15 },
  { row: 5, col: 15 },
] as const;

function getFixturePaths(agent: OwnAgentView) {
  return findReachableDestinations({
    manifest: fixtureManifest,
    origin: agent.coordinate,
    maxDistance: getMaxMoveDistance(agent.callsign),
  });
}

export function getFixtureReachableCells(
  agent: OwnAgentView,
): readonly CoordinateView[] {
  return [...getFixturePaths(agent).keys()].map(fromCellId);
}

export function getFixturePath(agent: OwnAgentView, row: number, col: number) {
  return getFixturePaths(agent).get(row * 16 + col) ?? null;
}

export function isValidFixturePath(
  agent: OwnAgentView,
  path: readonly CoordinateView[],
): boolean {
  return validatePath({
    manifest: fixtureManifest,
    origin: agent.coordinate,
    path,
    role: agent.callsign,
  }).ok;
}

export function getFixtureEditableNextCells(
  agent: OwnAgentView,
  path: readonly CoordinateView[],
): readonly CoordinateView[] {
  const previous = path.at(-1) ?? agent.coordinate;
  return orderedOrthogonalNeighbors(previous).filter((coordinate) =>
    isValidFixturePath(agent, [...path, coordinate]),
  );
}
