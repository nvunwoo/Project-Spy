import type { CoordinateView } from "@/shared/contracts/player-projection";

export const GRID_SIZE = 16;
export const CELL_SIZE = 1;

export interface WorldCoordinate {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export function logicalToWorld(
  coordinate: CoordinateView,
  elevation = 0,
): WorldCoordinate {
  const offset = (GRID_SIZE - 1) / 2;
  return {
    x: (coordinate.col - offset) * CELL_SIZE,
    y: elevation,
    z: (coordinate.row - offset) * CELL_SIZE,
  };
}

export function worldToLogical(x: number, z: number): CoordinateView | null {
  const offset = GRID_SIZE / 2;
  const col = Math.floor(x / CELL_SIZE + offset);
  const row = Math.floor(z / CELL_SIZE + offset);
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    return null;
  }
  return { row, col };
}

export function toGridLabel(coordinate: CoordinateView): string {
  const column = String.fromCharCode("A".charCodeAt(0) + coordinate.col);
  return `${column}${coordinate.row + 1}`;
}
