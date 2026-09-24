import type { MapBuildingView } from "@/shared/contracts/player-projection";

const lowFacilities = new Set(["AIRPORT", "PORT"]);
const landmarkFacilities = new Set([
  "RED_EMBASSY",
  "BLUE_EMBASSY",
  "POWER_PLANT",
  "LABORATORY",
  "UNIVERSITY",
  "GOVERNMENT_OFFICE",
  "BROADCAST_STATION",
  "FACTORY",
  "MILITARY_BASE",
]);

export interface BuildingSceneGeometry {
  readonly width: number;
  readonly depth: number;
  readonly height: number;
  readonly color: string;
}

export function getBuildingSceneGeometry(
  building: MapBuildingView,
): BuildingSceneGeometry {
  const width = building.footprint === 2 ? 1.78 : 0.78;
  const numericSeed = [...building.id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );
  const height = lowFacilities.has(building.kind)
    ? building.kind === "AIRPORT"
      ? 0.28
      : 0.36
    : landmarkFacilities.has(building.kind)
      ? 1.12
      : 0.62 + (numericSeed % 4) * 0.13;
  const color =
    building.kind === "GENERAL"
      ? numericSeed % 2 === 0
        ? "#263b48"
        : "#304653"
      : lowFacilities.has(building.kind)
        ? "#294653"
        : "#405563";

  return { width, depth: width, height, color };
}
