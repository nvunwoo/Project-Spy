import type { Coordinate } from "@/domain/model/game-types";

export const MAP_SIZE = 16;
export const CELL_COUNT = MAP_SIZE * MAP_SIZE;

export type CellId = number;

export function isCoordinate(value: unknown): value is Coordinate {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Coordinate>;
  return (
    Number.isInteger(candidate.row) &&
    Number.isInteger(candidate.col) &&
    (candidate.row ?? -1) >= 0 &&
    (candidate.row ?? MAP_SIZE) < MAP_SIZE &&
    (candidate.col ?? -1) >= 0 &&
    (candidate.col ?? MAP_SIZE) < MAP_SIZE
  );
}

export function toCellId(coordinate: Coordinate): CellId {
  if (!isCoordinate(coordinate)) {
    throw new RangeError(
      `Coordinate must use integer row/col values from 0 to ${MAP_SIZE - 1}.`,
    );
  }

  return coordinate.row * MAP_SIZE + coordinate.col;
}

export function fromCellId(cellId: CellId): Coordinate {
  if (!Number.isInteger(cellId) || cellId < 0 || cellId >= CELL_COUNT) {
    throw new RangeError(
      `Cell ID must be an integer from 0 to ${CELL_COUNT - 1}.`,
    );
  }

  return {
    row: Math.floor(cellId / MAP_SIZE),
    col: cellId % MAP_SIZE,
  };
}

export function sameCoordinate(left: Coordinate, right: Coordinate): boolean {
  return left.row === right.row && left.col === right.col;
}

export function isOrthogonallyAdjacent(
  left: Coordinate,
  right: Coordinate,
): boolean {
  return Math.abs(left.row - right.row) + Math.abs(left.col - right.col) === 1;
}

export function chebyshevDistance(left: Coordinate, right: Coordinate): number {
  return Math.max(
    Math.abs(left.row - right.row),
    Math.abs(left.col - right.col),
  );
}

export function isWithin3x3(center: Coordinate, target: Coordinate): boolean {
  return chebyshevDistance(center, target) <= 1;
}

export function isWithin5x5(center: Coordinate, target: Coordinate): boolean {
  return chebyshevDistance(center, target) <= 2;
}

export function excelAddressToCoordinate(address: string): Coordinate {
  const match = /^([A-P])(1[0-6]|[1-9])$/u.exec(address.toUpperCase());
  if (!match) {
    throw new RangeError(`Unsupported v0.6 map address: ${address}`);
  }

  return {
    row: Number(match[2]) - 1,
    col: match[1].charCodeAt(0) - "A".charCodeAt(0),
  };
}

export function coordinateToExcelAddress(coordinate: Coordinate): string {
  if (!isCoordinate(coordinate)) {
    throw new RangeError("Cannot format an out-of-bounds coordinate.");
  }

  return `${String.fromCharCode("A".charCodeAt(0) + coordinate.col)}${coordinate.row + 1}`;
}

/**
 * Stable pathfinding order. Sorting neighboring cells by (row, col) yields
 * north, west, east, south for any origin.
 */
export function orderedOrthogonalNeighbors(
  coordinate: Coordinate,
): readonly Coordinate[] {
  const candidates: Coordinate[] = [
    { row: coordinate.row - 1, col: coordinate.col },
    { row: coordinate.row, col: coordinate.col - 1 },
    { row: coordinate.row, col: coordinate.col + 1 },
    { row: coordinate.row + 1, col: coordinate.col },
  ];

  return candidates.filter(isCoordinate);
}
