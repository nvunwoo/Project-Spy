import type { AgentRole, Coordinate, Team } from "@/domain/model/game-types";
import {
  CELL_COUNT,
  MAP_SIZE,
  excelAddressToCoordinate,
  fromCellId,
  orderedOrthogonalNeighbors,
  toCellId,
  type CellId,
} from "@/domain/map/coordinates";

export type CellKind = "ROAD" | "GENERAL_BUILDING" | "FACILITY";

export type FacilityKind =
  | "RED_EMBASSY"
  | "BLUE_EMBASSY"
  | "POWER_PLANT"
  | "LABORATORY"
  | "UNIVERSITY"
  | "GOVERNMENT_OFFICE"
  | "BROADCAST_STATION"
  | "FACTORY"
  | "MILITARY_BASE"
  | "AIRPORT"
  | "PORT"
  | "BANK"
  | "COMMUNICATIONS"
  | "HOTEL"
  | "SUBWAY";

export type BuildingBlockKind = "A" | "B" | "C" | "AIRPORT" | "PORT";

export interface MapCell {
  readonly id: CellId;
  readonly coordinate: Coordinate;
  readonly kind: CellKind;
  /** Canonical production metadata; omit it from player projections. */
  readonly blockId?: string;
  readonly facilityId?: string;
  readonly facilityKind?: FacilityKind;
}

export interface FacilityInstance {
  readonly id: string;
  readonly kind: FacilityKind;
  readonly cells: readonly Coordinate[];
}

export interface MapManifest {
  readonly id: string;
  readonly sourceVersion: "map.v0.6";
  readonly width: 16;
  readonly height: 16;
  readonly cells: readonly MapCell[];
  readonly facilities: readonly FacilityInstance[];
}

interface BuildingBlockDefinition {
  readonly id: string;
  readonly kind: BuildingBlockKind;
  readonly range: string;
}

interface FacilityDefinition {
  readonly id: string;
  readonly kind: FacilityKind;
  readonly addresses: readonly string[];
}

export interface InitialAgentSpawn {
  readonly team: Team;
  readonly role: AgentRole;
  readonly coordinate: Coordinate;
}

const A_BLOCK_RANGES = [
  "E2:F3",
  "H2:I3",
  "K2:L3",
  "N5:O6",
  "B8:C9",
  "N8:O9",
  "B11:C12",
  "E14:F15",
  "H14:I15",
  "K14:L15",
] as const;

const B_BLOCK_RANGES = [
  "E5:F6",
  "K5:L6",
  "E8:F9",
  "H8:I9",
  "K8:L9",
  "E11:F12",
  "K11:L12",
] as const;

const C_BLOCK_RANGES = [
  "N2:O3",
  "B5:C6",
  "H5:I6",
  "H11:I12",
  "N11:O12",
  "B14:C15",
] as const;

function defineBlocks(
  kind: BuildingBlockKind,
  ranges: readonly string[],
): readonly BuildingBlockDefinition[] {
  return ranges.map((range, index) => ({
    id: `${kind}-${String(index + 1).padStart(2, "0")}`,
    kind,
    range,
  }));
}

export const V06_BUILDING_BLOCKS: readonly BuildingBlockDefinition[] = [
  ...defineBlocks("A", A_BLOCK_RANGES),
  ...defineBlocks("B", B_BLOCK_RANGES),
  ...defineBlocks("C", C_BLOCK_RANGES),
  { id: "AIRPORT-01", kind: "AIRPORT", range: "B2:C3" },
  { id: "PORT-01", kind: "PORT", range: "N14:O15" },
];

/**
 * One frozen, rules-valid public facility candidate for fixture UI and tests.
 * Match initialization will later replace this candidate through the same
 * MapManifest contract with a seed-generated, fairness-validated layout.
 */
const FIXTURE_FACILITIES: readonly FacilityDefinition[] = [
  { id: "blue-embassy", kind: "BLUE_EMBASSY", addresses: ["O2"] },
  { id: "red-embassy", kind: "RED_EMBASSY", addresses: ["B15"] },
  { id: "communications-1", kind: "COMMUNICATIONS", addresses: ["C5"] },
  { id: "communications-2", kind: "COMMUNICATIONS", addresses: ["N12"] },
  { id: "bank-1", kind: "BANK", addresses: ["H5"] },
  { id: "bank-2", kind: "BANK", addresses: ["I12"] },
  {
    id: "airport",
    kind: "AIRPORT",
    addresses: ["B2", "C2", "B3", "C3"],
  },
  {
    id: "port",
    kind: "PORT",
    addresses: ["N14", "O14", "N15", "O15"],
  },

  // Each rotational A pair has one hotel and one subway. The paired facility
  // cells are exact 180-degree counterparts on the 16x16 board.
  { id: "hotel-1", kind: "HOTEL", addresses: ["E2"] },
  { id: "subway-1", kind: "SUBWAY", addresses: ["L15"] },
  { id: "hotel-2", kind: "HOTEL", addresses: ["H2"] },
  { id: "subway-2", kind: "SUBWAY", addresses: ["I15"] },
  { id: "hotel-3", kind: "HOTEL", addresses: ["K2"] },
  { id: "subway-3", kind: "SUBWAY", addresses: ["F15"] },
  { id: "hotel-4", kind: "HOTEL", addresses: ["N5"] },
  { id: "subway-4", kind: "SUBWAY", addresses: ["C12"] },
  { id: "hotel-5", kind: "HOTEL", addresses: ["B8"] },
  { id: "subway-5", kind: "SUBWAY", addresses: ["O9"] },

  { id: "university", kind: "UNIVERSITY", addresses: ["E5"] },
  { id: "laboratory", kind: "LABORATORY", addresses: ["K5"] },
  { id: "factory", kind: "FACTORY", addresses: ["E8"] },
  { id: "power-plant", kind: "POWER_PLANT", addresses: ["H8"] },
  {
    id: "broadcast-station",
    kind: "BROADCAST_STATION",
    addresses: ["K8"],
  },
  {
    id: "government-office",
    kind: "GOVERNMENT_OFFICE",
    addresses: ["E11"],
  },
  { id: "military-base", kind: "MILITARY_BASE", addresses: ["K11"] },
];

export const V06_INITIAL_AGENT_SPAWNS: readonly InitialAgentSpawn[] = [
  { team: "BLUE", role: "K", coordinate: excelAddressToCoordinate("P3") },
  { team: "BLUE", role: "H", coordinate: excelAddressToCoordinate("P1") },
  { team: "BLUE", role: "D", coordinate: excelAddressToCoordinate("N1") },
  { team: "RED", role: "K", coordinate: excelAddressToCoordinate("A14") },
  { team: "RED", role: "H", coordinate: excelAddressToCoordinate("A16") },
  { team: "RED", role: "D", coordinate: excelAddressToCoordinate("C16") },
];

function expandExcelRange(range: string): readonly Coordinate[] {
  const [startAddress, endAddress] = range.split(":");
  if (!startAddress || !endAddress) {
    throw new RangeError(`Invalid v0.6 block range: ${range}`);
  }

  const start = excelAddressToCoordinate(startAddress);
  const end = excelAddressToCoordinate(endAddress);
  const coordinates: Coordinate[] = [];

  for (let row = start.row; row <= end.row; row += 1) {
    for (let col = start.col; col <= end.col; col += 1) {
      coordinates.push({ row, col });
    }
  }

  return coordinates;
}

export function getMapCell(
  manifest: MapManifest,
  coordinate: Coordinate,
): MapCell {
  const id = toCellId(coordinate);
  const directCell = manifest.cells[id];
  if (directCell?.id === id) {
    return directCell;
  }

  const cell = manifest.cells.find((candidate) => candidate.id === id);
  if (!cell) {
    throw new RangeError(`Map manifest does not contain cell ${id}.`);
  }
  return cell;
}

export function createV06FixtureMapManifest(): MapManifest {
  const cells: MapCell[] = Array.from({ length: CELL_COUNT }, (_, id) => ({
    id,
    coordinate: fromCellId(id),
    kind: "ROAD" as const,
  }));

  for (const block of V06_BUILDING_BLOCKS) {
    for (const coordinate of expandExcelRange(block.range)) {
      const id = toCellId(coordinate);
      cells[id] = {
        ...cells[id],
        kind: "GENERAL_BUILDING",
        blockId: block.id,
      };
    }
  }

  const facilities = FIXTURE_FACILITIES.map<FacilityInstance>((facility) => {
    const facilityCells = facility.addresses.map(excelAddressToCoordinate);
    for (const coordinate of facilityCells) {
      const id = toCellId(coordinate);
      const previous = cells[id];
      if (!previous?.blockId) {
        throw new Error(
          `Fixture facility ${facility.id} is outside a documented building block.`,
        );
      }

      cells[id] = {
        ...previous,
        kind: "FACILITY",
        facilityId: facility.id,
        facilityKind: facility.kind,
      };
    }

    return {
      id: facility.id,
      kind: facility.kind,
      cells: facilityCells,
    };
  });

  return {
    id: "fixture.v0.6.001",
    sourceVersion: "map.v0.6",
    width: MAP_SIZE,
    height: MAP_SIZE,
    cells,
    facilities,
  };
}

export type MapValidationIssueCode =
  | "INVALID_DIMENSIONS"
  | "INVALID_CELL_COUNT"
  | "DUPLICATE_CELL"
  | "INVALID_TERRAIN_COUNTS"
  | "INVALID_BLOCKS"
  | "INVALID_FACILITIES"
  | "DISCONNECTED_ROAD"
  | "INVALID_INITIAL_SPAWN";

export interface MapValidationIssue {
  readonly code: MapValidationIssueCode;
  readonly message: string;
}

export interface MapValidationResult {
  readonly ok: boolean;
  readonly issues: readonly MapValidationIssue[];
}

const EXPECTED_FACILITY_INSTANCES: Readonly<Record<FacilityKind, number>> = {
  RED_EMBASSY: 1,
  BLUE_EMBASSY: 1,
  POWER_PLANT: 1,
  LABORATORY: 1,
  UNIVERSITY: 1,
  GOVERNMENT_OFFICE: 1,
  BROADCAST_STATION: 1,
  FACTORY: 1,
  MILITARY_BASE: 1,
  AIRPORT: 1,
  PORT: 1,
  BANK: 2,
  COMMUNICATIONS: 2,
  HOTEL: 5,
  SUBWAY: 5,
};

function countConnectedRoadCells(manifest: MapManifest): number {
  const firstRoad = manifest.cells.find((cell) => cell.kind === "ROAD");
  if (!firstRoad) {
    return 0;
  }

  const visited = new Set<CellId>([firstRoad.id]);
  const queue: Coordinate[] = [firstRoad.coordinate];

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (!current) {
      continue;
    }

    for (const neighbor of orderedOrthogonalNeighbors(current)) {
      const cell = getMapCell(manifest, neighbor);
      if (cell.kind === "ROAD" && !visited.has(cell.id)) {
        visited.add(cell.id);
        queue.push(neighbor);
      }
    }
  }

  return visited.size;
}

export function validateV06MapManifest(
  manifest: MapManifest,
): MapValidationResult {
  const issues: MapValidationIssue[] = [];

  if (manifest.width !== MAP_SIZE || manifest.height !== MAP_SIZE) {
    issues.push({
      code: "INVALID_DIMENSIONS",
      message: "The v0.6 board must be exactly 16x16.",
    });
  }

  if (manifest.cells.length !== CELL_COUNT) {
    issues.push({
      code: "INVALID_CELL_COUNT",
      message: `Expected ${CELL_COUNT} cells, received ${manifest.cells.length}.`,
    });
  }

  const uniqueCellIds = new Set(manifest.cells.map((cell) => cell.id));
  if (uniqueCellIds.size !== manifest.cells.length) {
    issues.push({
      code: "DUPLICATE_CELL",
      message: "Every map cell ID must be unique.",
    });
  }

  const roadCount = manifest.cells.filter(
    (cell) => cell.kind === "ROAD",
  ).length;
  const buildingCount = manifest.cells.length - roadCount;
  const facilityCellCount = manifest.cells.filter(
    (cell) => cell.kind === "FACILITY",
  ).length;
  const generalBuildingCount = manifest.cells.filter(
    (cell) => cell.kind === "GENERAL_BUILDING",
  ).length;

  if (
    roadCount !== 156 ||
    buildingCount !== 100 ||
    facilityCellCount !== 31 ||
    generalBuildingCount !== 69
  ) {
    issues.push({
      code: "INVALID_TERRAIN_COUNTS",
      message:
        "Expected 156 road, 100 building-site, 31 facility, and 69 general-building cells.",
    });
  }

  const blockCounts = new Map<string, number>();
  for (const cell of manifest.cells) {
    if (cell.blockId) {
      blockCounts.set(cell.blockId, (blockCounts.get(cell.blockId) ?? 0) + 1);
    }
  }
  if (
    blockCounts.size !== 25 ||
    [...blockCounts.values()].some((count) => count !== 4)
  ) {
    issues.push({
      code: "INVALID_BLOCKS",
      message: "The v0.6 map requires 25 non-overlapping 2x2 building blocks.",
    });
  }

  const facilityIds = new Set(
    manifest.facilities.map((facility) => facility.id),
  );
  const actualFacilityCounts = new Map<FacilityKind, number>();
  for (const facility of manifest.facilities) {
    actualFacilityCounts.set(
      facility.kind,
      (actualFacilityCounts.get(facility.kind) ?? 0) + 1,
    );
  }

  const facilityShapeInvalid = manifest.facilities.some((facility) => {
    const expectedCellCount =
      facility.kind === "AIRPORT" || facility.kind === "PORT" ? 4 : 1;
    return (
      facility.cells.length !== expectedCellCount ||
      facility.cells.some((coordinate) => {
        const cell = getMapCell(manifest, coordinate);
        return (
          cell.kind !== "FACILITY" ||
          cell.facilityId !== facility.id ||
          cell.facilityKind !== facility.kind
        );
      })
    );
  });

  const facilityCountsInvalid = Object.entries(
    EXPECTED_FACILITY_INSTANCES,
  ).some(
    ([kind, count]) => actualFacilityCounts.get(kind as FacilityKind) !== count,
  );

  if (
    manifest.facilities.length !== 25 ||
    facilityIds.size !== manifest.facilities.length ||
    facilityShapeInvalid ||
    facilityCountsInvalid
  ) {
    issues.push({
      code: "INVALID_FACILITIES",
      message:
        "Named facility instance counts, IDs, or footprints are invalid.",
    });
  }

  if (countConnectedRoadCells(manifest) !== roadCount) {
    issues.push({
      code: "DISCONNECTED_ROAD",
      message: "All 156 road cells must be one orthogonally connected network.",
    });
  }

  const spawnIds = new Set<CellId>();
  const invalidSpawn = V06_INITIAL_AGENT_SPAWNS.some((spawn) => {
    const cell = getMapCell(manifest, spawn.coordinate);
    const id = toCellId(spawn.coordinate);
    const duplicate = spawnIds.has(id);
    spawnIds.add(id);
    return duplicate || cell.kind !== "ROAD";
  });
  if (invalidSpawn || spawnIds.size !== 6) {
    issues.push({
      code: "INVALID_INITIAL_SPAWN",
      message: "All six fixed v0.6 initial spawns must be distinct road cells.",
    });
  }

  return { ok: issues.length === 0, issues };
}
