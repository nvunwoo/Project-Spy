import { describe, expect, it } from "vitest";

import {
  coordinateToExcelAddress,
  excelAddressToCoordinate,
  toCellId,
} from "@/domain/map/coordinates";
import {
  createV06FixtureMapManifest,
  getMapCell,
  validateV06MapManifest,
  V06_INITIAL_AGENT_SPAWNS,
} from "@/domain/map/map-manifest";
import {
  findReachableDestinations,
  findRepresentativeShortestPath,
  validatePath,
} from "@/domain/map/pathfinding";
import { projectMapBuildings } from "@/game-client/fixture/local-match-view";

describe("v0.6 map manifest", () => {
  const manifest = createV06FixtureMapManifest();

  it("matches every documented topology and content count", () => {
    expect(validateV06MapManifest(manifest)).toEqual({ ok: true, issues: [] });
    expect(manifest.cells).toHaveLength(256);
    expect(manifest.cells.filter((cell) => cell.kind === "ROAD")).toHaveLength(
      156,
    );
    expect(
      manifest.cells.filter((cell) => cell.kind === "GENERAL_BUILDING"),
    ).toHaveLength(69);
    expect(
      manifest.cells.filter((cell) => cell.kind === "FACILITY"),
    ).toHaveLength(31);
    expect(manifest.facilities).toHaveLength(25);
  });

  it("projects 92 independent one-cell buildings plus only airport and port as 2x2", () => {
    const buildings = projectMapBuildings(manifest);
    const oneCell = buildings.filter((building) => building.footprint === 1);
    const twoByTwo = buildings.filter((building) => building.footprint === 2);

    expect(buildings).toHaveLength(94);
    expect(oneCell).toHaveLength(92);
    expect(
      oneCell.filter((building) => building.kind === "GENERAL"),
    ).toHaveLength(69);
    expect(twoByTwo.map((building) => building.kind).sort()).toEqual([
      "AIRPORT",
      "PORT",
    ]);
    expect(
      buildings
        .filter(
          (building) => building.kind === "HOTEL" || building.kind === "SUBWAY",
        )
        .every((building) => building.labelVisibility === "DISCOVER"),
    ).toBe(true);
    expect(
      buildings
        .filter(
          (building) =>
            building.kind !== "GENERAL" &&
            building.kind !== "HOTEL" &&
            building.kind !== "SUBWAY",
        )
        .every((building) => building.labelVisibility === "ALWAYS"),
    ).toBe(true);
  });

  it("keeps the documented fixed facilities at exact Excel coordinates", () => {
    const expected = [
      ["O2", "BLUE_EMBASSY"],
      ["B15", "RED_EMBASSY"],
      ["C5", "COMMUNICATIONS"],
      ["N12", "COMMUNICATIONS"],
      ["H5", "BANK"],
      ["I12", "BANK"],
    ] as const;

    for (const [address, kind] of expected) {
      expect(
        getMapCell(manifest, excelAddressToCoordinate(address)),
      ).toMatchObject({
        kind: "FACILITY",
        facilityKind: kind,
      });
    }

    expect(
      manifest.facilities.find((facility) => facility.kind === "AIRPORT")
        ?.cells,
    ).toEqual(["B2", "C2", "B3", "C3"].map(excelAddressToCoordinate));
    expect(
      manifest.facilities.find((facility) => facility.kind === "PORT")?.cells,
    ).toEqual(["N14", "O14", "N15", "O15"].map(excelAddressToCoordinate));
  });

  it("uses the six exact, distinct road spawn cells from MAP.xlsx", () => {
    expect(
      V06_INITIAL_AGENT_SPAWNS.map(({ coordinate }) =>
        coordinateToExcelAddress(coordinate),
      ),
    ).toEqual(["P3", "P1", "N1", "A14", "A16", "C16"]);
    const ids = V06_INITIAL_AGENT_SPAWNS.map(({ coordinate }) =>
      toCellId(coordinate),
    );
    expect(new Set(ids).size).toBe(6);
    for (const spawn of V06_INITIAL_AGENT_SPAWNS) {
      expect(getMapCell(manifest, spawn.coordinate).kind).toBe("ROAD");
    }
  });

  it("freezes a valid 5 hotel / 5 subway rotational fixture candidate", () => {
    expect(
      manifest.facilities.filter((facility) => facility.kind === "HOTEL"),
    ).toHaveLength(5);
    expect(
      manifest.facilities.filter((facility) => facility.kind === "SUBWAY"),
    ).toHaveLength(5);

    const pairs = [
      ["E2", "L15"],
      ["H2", "I15"],
      ["K2", "F15"],
      ["N5", "C12"],
      ["B8", "O9"],
    ] as const;
    for (const [hotel, subway] of pairs) {
      expect(
        getMapCell(manifest, excelAddressToCoordinate(hotel)).facilityKind,
      ).toBe("HOTEL");
      expect(
        getMapCell(manifest, excelAddressToCoordinate(subway)).facilityKind,
      ).toBe("SUBWAY");
      const first = excelAddressToCoordinate(hotel);
      const second = excelAddressToCoordinate(subway);
      expect(second).toEqual({ row: 15 - first.row, col: 15 - first.col });
    }
  });

  it("keeps both frozen neutral-objective cells fair from the exact spawns", () => {
    for (const address of ["E5", "H8"]) {
      const destination = excelAddressToCoordinate(address);
      const teamDistances = (team: "RED" | "BLUE") =>
        V06_INITIAL_AGENT_SPAWNS.filter((spawn) => spawn.team === team).map(
          (spawn) => ({
            role: spawn.role,
            distance:
              findRepresentativeShortestPath({
                manifest,
                origin: spawn.coordinate,
                destination,
                maxDistance: 255,
              })?.length ?? Number.POSITIVE_INFINITY,
          }),
        );
      const blue = teamDistances("BLUE");
      const red = teamDistances("RED");
      const blueMinimum = Math.min(...blue.map(({ distance }) => distance));
      const redMinimum = Math.min(...red.map(({ distance }) => distance));

      expect(Math.abs(blueMinimum - redMinimum)).toBeLessThanOrEqual(3);
      expect(blue.some(({ distance }) => distance <= 3)).toBe(
        red.some(({ distance }) => distance <= 3),
      );
    }
  });
});

describe("v0.6 path rules", () => {
  const manifest = createV06FixtureMapManifest();

  it("enforces role distance, orthogonal steps, uniqueness, and no origin return", () => {
    const origin = excelAddressToCoordinate("P3");
    const fourSteps = ["P4", "P5", "P6", "P7"].map(excelAddressToCoordinate);

    for (const role of ["K", "H", "D"] as const) {
      expect(
        validatePath({
          manifest,
          origin,
          path: fourSteps.slice(0, 3),
          role,
        }).ok,
      ).toBe(true);
      expect(
        validatePath({ manifest, origin, path: fourSteps, role }),
      ).toMatchObject({
        ok: false,
        issues: expect.arrayContaining(["TOO_LONG"]),
      });
    }
    expect(
      validatePath({
        manifest,
        origin,
        path: [excelAddressToCoordinate("O4")],
        role: "K",
      }),
    ).toMatchObject({
      ok: false,
      issues: expect.arrayContaining(["NON_ORTHOGONAL_STEP"]),
    });
    expect(
      validatePath({
        manifest,
        origin,
        path: [
          excelAddressToCoordinate("P4"),
          excelAddressToCoordinate("P5"),
          excelAddressToCoordinate("P4"),
        ],
        role: "K",
      }),
    ).toMatchObject({
      ok: false,
      issues: expect.arrayContaining(["REVISITED_CELL"]),
    });
    expect(
      validatePath({
        manifest,
        origin,
        path: [excelAddressToCoordinate("P4"), origin],
        role: "K",
      }),
    ).toMatchObject({
      ok: false,
      issues: expect.arrayContaining(["RETURNED_TO_ORIGIN"]),
    });
  });

  it("allows a building destination but forbids normal building transit and direct building hops", () => {
    const roadOrigin = excelAddressToCoordinate("P5");
    const generalBuilding = excelAddressToCoordinate("O5");
    const neighboringFacility = excelAddressToCoordinate("N5");

    expect(
      validatePath({
        manifest,
        origin: roadOrigin,
        path: [generalBuilding],
        role: "K",
      }),
    ).toMatchObject({ ok: true, distance: 1 });
    expect(
      validatePath({
        manifest,
        origin: roadOrigin,
        path: [generalBuilding, neighboringFacility],
        role: "K",
      }),
    ).toMatchObject({
      ok: false,
      issues: expect.arrayContaining([
        "BUILDING_USED_AS_TRANSIT",
        "BUILDING_TO_BUILDING_TRANSITION",
      ]),
    });
    expect(
      validatePath({
        manifest,
        origin: generalBuilding,
        path: [neighboringFacility],
        role: "K",
      }),
    ).toMatchObject({
      ok: false,
      issues: expect.arrayContaining(["BUILDING_TO_BUILDING_TRANSITION"]),
    });
  });

  it("allows airport/port internal movement and airport transit", () => {
    expect(
      validatePath({
        manifest,
        origin: excelAddressToCoordinate("B2"),
        path: [excelAddressToCoordinate("C2")],
        role: "K",
      }).ok,
    ).toBe(true);
    expect(
      validatePath({
        manifest,
        origin: excelAddressToCoordinate("A2"),
        path: [
          excelAddressToCoordinate("B2"),
          excelAddressToCoordinate("C2"),
          excelAddressToCoordinate("D2"),
        ],
        role: "K",
      }).ok,
    ).toBe(true);
  });

  it("treats an empty path as a legal zero-cell destination", () => {
    const origin = excelAddressToCoordinate("P3");
    expect(validatePath({ manifest, origin, path: [], role: "K" })).toEqual({
      ok: true,
      destination: origin,
      distance: 0,
    });
  });

  it("produces one stable representative shortest path from public topology only", () => {
    const origin = excelAddressToCoordinate("A2");
    const destination = excelAddressToCoordinate("D2");
    const first = findRepresentativeShortestPath({
      manifest,
      origin,
      destination,
      maxDistance: 3,
    });
    const second = findRepresentativeShortestPath({
      manifest,
      origin,
      destination,
      maxDistance: 3,
    });
    expect(first).toEqual([
      excelAddressToCoordinate("B2"),
      excelAddressToCoordinate("C2"),
      destination,
    ]);
    expect(second).toEqual(first);

    const reachable = findReachableDestinations({
      manifest,
      origin,
      maxDistance: 3,
    });
    expect(reachable.get(toCellId(origin))).toEqual([]);
    expect(reachable.get(toCellId(destination))).toEqual(first);
  });
});
