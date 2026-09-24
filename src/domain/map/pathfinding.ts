import type { AgentRole, Coordinate } from "@/domain/model/game-types";
import {
  isCoordinate,
  isOrthogonallyAdjacent,
  orderedOrthogonalNeighbors,
  sameCoordinate,
  toCellId,
  type CellId,
} from "@/domain/map/coordinates";
import {
  getMapCell,
  type MapCell,
  type MapManifest,
} from "@/domain/map/map-manifest";

export type PathIssue =
  | "OUT_OF_BOUNDS"
  | "TOO_LONG"
  | "NON_ORTHOGONAL_STEP"
  | "REVISITED_CELL"
  | "RETURNED_TO_ORIGIN"
  | "BUILDING_USED_AS_TRANSIT"
  | "BUILDING_TO_BUILDING_TRANSITION";

export type PathValidationResult =
  | {
      readonly ok: true;
      readonly destination: Coordinate;
      readonly distance: number;
    }
  | {
      readonly ok: false;
      readonly issues: readonly PathIssue[];
    };

const MAX_MOVE_DISTANCE_BY_ROLE: Readonly<Record<AgentRole, 3>> = {
  K: 3,
  H: 3,
  D: 3,
};

export function getMaxMoveDistance(role: AgentRole): 3 {
  return MAX_MOVE_DISTANCE_BY_ROLE[role];
}

function isAirportOrPort(cell: MapCell): boolean {
  return cell.facilityKind === "AIRPORT" || cell.facilityKind === "PORT";
}

function isAllowedBuildingTransition(from: MapCell, to: MapCell): boolean {
  if (from.kind === "ROAD" || to.kind === "ROAD") {
    return true;
  }

  return (
    from.facilityId !== undefined &&
    from.facilityId === to.facilityId &&
    isAirportOrPort(from) &&
    isAirportOrPort(to)
  );
}

function canUseAsTransit(cell: MapCell): boolean {
  return cell.kind === "ROAD" || isAirportOrPort(cell);
}

export function validatePath(input: {
  readonly manifest: MapManifest;
  readonly origin: Coordinate;
  readonly path: readonly Coordinate[];
  readonly role: AgentRole;
}): PathValidationResult {
  const { manifest, origin, path, role } = input;
  const issues = new Set<PathIssue>();
  const maxDistance = getMaxMoveDistance(role);

  if (!isCoordinate(origin)) {
    return { ok: false, issues: ["OUT_OF_BOUNDS"] };
  }

  if (path.length > maxDistance) {
    issues.add("TOO_LONG");
  }

  const visited = new Set<CellId>([toCellId(origin)]);
  let previous = origin;

  for (let index = 0; index < path.length; index += 1) {
    const step = path[index];
    if (!isCoordinate(step)) {
      issues.add("OUT_OF_BOUNDS");
      continue;
    }

    if (!isOrthogonallyAdjacent(previous, step)) {
      issues.add("NON_ORTHOGONAL_STEP");
    }

    const stepId = toCellId(step);
    if (sameCoordinate(step, origin)) {
      issues.add("RETURNED_TO_ORIGIN");
    } else if (visited.has(stepId)) {
      issues.add("REVISITED_CELL");
    }
    visited.add(stepId);

    const previousCell = getMapCell(manifest, previous);
    const stepCell = getMapCell(manifest, step);
    if (!isAllowedBuildingTransition(previousCell, stepCell)) {
      issues.add("BUILDING_TO_BUILDING_TRANSITION");
    }

    if (index < path.length - 1 && !canUseAsTransit(stepCell)) {
      issues.add("BUILDING_USED_AS_TRANSIT");
    }

    previous = step;
  }

  if (issues.size > 0) {
    return { ok: false, issues: [...issues] };
  }

  return {
    ok: true,
    destination: path.at(-1) ?? origin,
    distance: path.length,
  };
}

interface SearchNode {
  readonly coordinate: Coordinate;
  readonly path: readonly Coordinate[];
}

/**
 * Finds every topology-reachable destination without consulting occupancy.
 * This intentionally cannot leak hidden enemy positions through affordances.
 */
export function findReachableDestinations(input: {
  readonly manifest: MapManifest;
  readonly origin: Coordinate;
  readonly maxDistance: number;
}): ReadonlyMap<CellId, readonly Coordinate[]> {
  const { manifest, origin, maxDistance } = input;
  if (!isCoordinate(origin)) {
    throw new RangeError("Pathfinding origin must be inside the 16x16 map.");
  }
  if (!Number.isInteger(maxDistance) || maxDistance < 0) {
    throw new RangeError(
      "Pathfinding maxDistance must be a non-negative integer.",
    );
  }

  const originId = toCellId(origin);
  const paths = new Map<CellId, readonly Coordinate[]>([[originId, []]]);
  const queue: SearchNode[] = [{ coordinate: origin, path: [] }];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (!current || current.path.length >= maxDistance) {
      continue;
    }

    const currentCell = getMapCell(manifest, current.coordinate);
    for (const neighbor of orderedOrthogonalNeighbors(current.coordinate)) {
      const neighborId = toCellId(neighbor);
      if (paths.has(neighborId)) {
        continue;
      }

      const neighborCell = getMapCell(manifest, neighbor);
      if (!isAllowedBuildingTransition(currentCell, neighborCell)) {
        continue;
      }

      const path = [...current.path, neighbor];
      paths.set(neighborId, path);

      if (canUseAsTransit(neighborCell)) {
        queue.push({ coordinate: neighbor, path });
      }
    }
  }

  return paths;
}

export function findRepresentativeShortestPath(input: {
  readonly manifest: MapManifest;
  readonly origin: Coordinate;
  readonly destination: Coordinate;
  readonly maxDistance: number;
}): readonly Coordinate[] | null {
  if (!isCoordinate(input.destination)) {
    return null;
  }

  const paths = findReachableDestinations(input);
  return paths.get(toCellId(input.destination)) ?? null;
}
