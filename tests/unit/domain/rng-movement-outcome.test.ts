import { describe, expect, it } from "vitest";

import type {
  AgentRole,
  AgentState,
  ObjectiveKind,
  Team,
} from "@/domain/model/game-types";
import { excelAddressToCoordinate } from "@/domain/map/coordinates";
import type { GeneralOrder } from "@/domain/orders/order-types";
import { evaluateOutcome } from "@/domain/resolve-turn/evaluate-outcome";
import { resolveMovement } from "@/domain/resolve-turn/resolve-movement";
import { createRng, rollPercent } from "@/domain/rng/deterministic-rng";

function agent(
  id: string,
  team: Team,
  role: AgentRole,
  address: string,
): AgentState {
  return {
    id,
    nominalTeam: team,
    role,
    coordinate: excelAddressToCoordinate(address),
    status: "ACTIVE",
    canAct: true,
  };
}

function findSeedWithSuccessfulMoveRolls(count: number): string {
  for (let index = 0; index < 10_000; index += 1) {
    const seed = `movement-success-${index}`;
    const rng = createRng({ seed, namespace: "ACTION_SUCCESS" });
    if (
      Array.from({ length: count }, () => rollPercent(rng, 70)).every(Boolean)
    ) {
      return seed;
    }
  }
  throw new Error("Could not find a deterministic movement test seed.");
}

describe("deterministic RNG", () => {
  it("replays the same stream and isolates namespaces", () => {
    const first = createRng({ seed: "turn-7", namespace: "ACTION_SUCCESS" });
    const replay = createRng({ seed: "turn-7", namespace: "ACTION_SUCCESS" });
    const otherNamespace = createRng({
      seed: "turn-7",
      namespace: "MOVEMENT_ORDER",
    });

    const firstSequence = Array.from({ length: 8 }, () => first.nextUint32());
    expect(Array.from({ length: 8 }, () => replay.nextUint32())).toEqual(
      firstSequence,
    );
    expect(
      Array.from({ length: 8 }, () => otherNamespace.nextUint32()),
    ).not.toEqual(firstSequence);
  });

  it("keeps bounded draws in range and shuffles without mutating input", () => {
    const rng = createRng({ seed: "bounds", namespace: "TIE_BREAK" });
    for (let index = 0; index < 1_000; index += 1) {
      expect(rng.nextInt(7)).toBeGreaterThanOrEqual(0);
      expect(rng.nextInt(7)).toBeLessThan(7);
    }

    const source = [1, 2, 3, 4, 5] as const;
    const shuffled = createRng({
      seed: "shuffle",
      namespace: "MOVEMENT_ORDER",
    }).shuffle(source);
    expect(source).toEqual([1, 2, 3, 4, 5]);
    expect([...shuffled].sort()).toEqual([...source]);
  });
});

describe("deterministic movement resolution", () => {
  it("applies mole-forced failure before chance and cancels the arrival action", () => {
    const mover = agent("blue-k", "BLUE", "K", "C4");
    const order: GeneralOrder = {
      kind: "OPERATE",
      agentId: mover.id,
      path: [excelAddressToCoordinate("D4")],
      arrivalAction: { kind: "INVESTIGATE" },
    };

    const result = resolveMovement({
      agents: [mover],
      orders: [order],
      forcedMoveFailureAgentIds: new Set([mover.id]),
      loyaltyPenaltyTeams: new Set(),
      rngSeed: "forced-failure-does-not-need-a-roll",
    });
    expect(result.results).toEqual([
      expect.objectContaining({
        agentId: mover.id,
        success: false,
        reason: "FORCED_FAILURE",
        finalCoordinate: mover.coordinate,
      }),
    ]);
    expect(result.cancelledArrivalActions.has(mover.id)).toBe(true);
  });

  it("admits one mover into a three-person cell and blocks the next in seeded order", () => {
    const destination = "D4";
    const movers = [
      agent("blue-k", "BLUE", "K", "C4"),
      agent("red-k", "RED", "K", "E4"),
    ];
    const occupants = [
      agent("occupant-1", "BLUE", "H", destination),
      agent("occupant-2", "BLUE", "D", destination),
      agent("occupant-3", "RED", "D", destination),
    ];
    const orders: GeneralOrder[] = movers.map((mover) => ({
      kind: "OPERATE",
      agentId: mover.id,
      path: [excelAddressToCoordinate(destination)],
      arrivalAction: { kind: "MOVE_ONLY" },
    }));
    const result = resolveMovement({
      agents: [...movers, ...occupants],
      orders,
      forcedMoveFailureAgentIds: new Set(),
      loyaltyPenaltyTeams: new Set(),
      rngSeed: findSeedWithSuccessfulMoveRolls(2),
    });

    expect(
      result.results.filter((event) => event.reason === "ARRIVED"),
    ).toHaveLength(1);
    expect(
      result.results.filter((event) => event.reason === "DESTINATION_FULL"),
    ).toHaveLength(1);
    expect(
      result.agents.filter(
        (current) =>
          current.coordinate.row ===
            excelAddressToCoordinate(destination).row &&
          current.coordinate.col === excelAddressToCoordinate(destination).col,
      ),
    ).toHaveLength(4);
    expect(result.cancelledArrivalActions.size).toBe(1);
  });

  it("blocks both sides of a swap when both origin cells start full", () => {
    const left = [
      agent("left-mover", "BLUE", "K", "D4"),
      agent("left-2", "BLUE", "H", "D4"),
      agent("left-3", "RED", "K", "D4"),
      agent("left-4", "BLUE", "D", "D4"),
    ];
    const right = [
      agent("right-mover", "RED", "K", "E4"),
      agent("right-2", "RED", "H", "E4"),
      agent("right-3", "BLUE", "K", "E4"),
      agent("right-4", "RED", "D", "E4"),
    ];
    const result = resolveMovement({
      agents: [...left, ...right],
      orders: [
        {
          kind: "OPERATE",
          agentId: "left-mover",
          path: [excelAddressToCoordinate("E4")],
          arrivalAction: { kind: "MOVE_ONLY" },
        },
        {
          kind: "OPERATE",
          agentId: "right-mover",
          path: [excelAddressToCoordinate("D4")],
          arrivalAction: { kind: "MOVE_ONLY" },
        },
      ],
      forcedMoveFailureAgentIds: new Set(),
      loyaltyPenaltyTeams: new Set(),
      rngSeed: findSeedWithSuccessfulMoveRolls(2),
    });

    expect(result.results.map((event) => event.reason)).toEqual([
      "DESTINATION_FULL",
      "DESTINATION_FULL",
    ]);
    expect(result.cancelledArrivalActions).toEqual(
      new Set(["left-mover", "right-mover"]),
    );
  });
});

describe("victory and draw evaluation", () => {
  const set = (...values: ObjectiveKind[]): ReadonlySet<ObjectiveKind> =>
    new Set(values);

  it("remains ongoing with fewer than two valid objectives", () => {
    expect(
      evaluateOutcome({
        deliveredBeforeTurn: {
          RED: set("BLUE_ROSTER"),
          BLUE: set("RED_ROSTER"),
        },
        deliveredThisResolution: { RED: set(), BLUE: set() },
      }),
    ).toEqual({ kind: "ONGOING" });
  });

  it("declares the only team that reaches two distinct valid objectives", () => {
    expect(
      evaluateOutcome({
        deliveredBeforeTurn: {
          RED: set("BLUE_ROSTER"),
          BLUE: set("RED_ROSTER"),
        },
        deliveredThisResolution: { RED: set("SCIENTIST"), BLUE: set() },
      }),
    ).toEqual({ kind: "WIN", winner: "RED" });
  });

  it("declares a draw when both teams deliver their second objective in one Resolve", () => {
    expect(
      evaluateOutcome({
        deliveredBeforeTurn: {
          RED: set("BLUE_ROSTER"),
          BLUE: set("RED_ROSTER"),
        },
        deliveredThisResolution: {
          RED: set("BLUEPRINT"),
          BLUE: set("SCIENTIST"),
        },
      }),
    ).toEqual({ kind: "DRAW" });
  });

  it("does not count a team's own roster toward its victory", () => {
    expect(
      evaluateOutcome({
        deliveredBeforeTurn: {
          RED: set("RED_ROSTER", "BLUEPRINT"),
          BLUE: set(),
        },
        deliveredThisResolution: { RED: set(), BLUE: set() },
      }),
    ).toEqual({ kind: "ONGOING" });
  });
});
