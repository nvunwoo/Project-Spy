import { describe, expect, it } from "vitest";

import type { Team } from "@/domain/model/game-types";
import { excelAddressToCoordinate } from "@/domain/map/coordinates";
import type { GeneralOrder, MoleOrder } from "@/domain/orders/order-types";
import {
  localStateFingerprint,
  resolveLocalTurn,
  startNextLocalTurn,
} from "@/domain/resolve-turn/resolve-turn";
import {
  createFixtureMoleOrder,
  createFixtureOpponentOrders,
  createLocalTurnFixture,
} from "@/fixtures/local-turn-fixture";

function waitOrders(
  state: ReturnType<typeof createLocalTurnFixture>,
  team: Team,
): GeneralOrder[] {
  return state.agents
    .filter(
      (agent) =>
        agent.nominalTeam === team && agent.status === "ACTIVE" && agent.canAct,
    )
    .map((agent) => ({ kind: "WAIT", agentId: agent.id }));
}

function acquiesceMoleOrders(
  state: ReturnType<typeof createLocalTurnFixture>,
): Partial<Record<Team, MoleOrder>> {
  return Object.fromEntries(
    (["BLUE", "RED"] as const).flatMap((controller) => {
      const mole = state.agents.find(
        (agent) => agent.moleController === controller,
      );
      return mole
        ? [
            [
              controller,
              { kind: "ACQUIESCE", moleAgentId: mole.id } satisfies MoleOrder,
            ],
          ]
        : [];
    }),
  );
}

describe("Phase 0B-3 local turn resolver", () => {
  it("rejects colleague assassination before turn 6", () => {
    const state = createLocalTurnFixture({ seed: "mole-lock" });
    const blueMole = state.agents.find(
      (agent) => agent.moleController === "BLUE",
    )!;
    expect(() =>
      resolveLocalTurn({
        state,
        generalOrders: {
          BLUE: waitOrders(state, "BLUE"),
          RED: waitOrders(state, "RED"),
        },
        moleOrders: {
          BLUE: {
            kind: "ASSASSINATE_COLLEAGUE",
            moleAgentId: blueMole.id,
            targetAgentId: "red-h",
          },
        },
      }),
    ).toThrow("before turn 6");
  });

  it("replays the same complete local turn from the same seed and orders", () => {
    const state = createLocalTurnFixture();
    const blueOrders = waitOrders(state, "BLUE");
    const redOrders = createFixtureOpponentOrders(state, "RED");
    const moleOrders = {
      BLUE: createFixtureMoleOrder({
        controller: "BLUE",
        state,
        nominalOrders: redOrders,
      }),
      RED: createFixtureMoleOrder({
        controller: "RED",
        state,
        nominalOrders: blueOrders,
      }),
    };
    const first = resolveLocalTurn({
      state,
      generalOrders: { BLUE: blueOrders, RED: redOrders },
      moleOrders,
    });
    const replay = resolveLocalTurn({
      state,
      generalOrders: { BLUE: blueOrders, RED: redOrders },
      moleOrders,
    });

    expect(localStateFingerprint(replay.resolvedState)).toBe(
      localStateFingerprint(first.resolvedState),
    );
    expect(replay.reports).toEqual(first.reports);
    expect(replay.movementResults).toEqual(first.movementResults);
  });

  it("resolves movement plus a bank hack and applies the two-turn allocation penalty", () => {
    let successful: ReturnType<typeof resolveLocalTurn> | undefined;
    for (let index = 0; index < 250 && !successful; index += 1) {
      const base = createLocalTurnFixture({ seed: `bank-success-${index}` });
      const state = {
        ...base,
        agents: base.agents.map((agent) =>
          agent.id === "blue-h"
            ? { ...agent, coordinate: excelAddressToCoordinate("H4") }
            : agent,
        ),
      };
      const blueOrders: GeneralOrder[] = [
        { kind: "WAIT", agentId: "blue-k" },
        {
          kind: "OPERATE",
          agentId: "blue-h",
          path: [excelAddressToCoordinate("H5")],
          arrivalAction: { kind: "HACK", facilityId: "bank-1" },
        },
        { kind: "WAIT", agentId: "blue-d" },
      ];
      const result = resolveLocalTurn({
        state,
        generalOrders: {
          BLUE: blueOrders,
          RED: waitOrders(state, "RED"),
        },
        moleOrders: acquiesceMoleOrders(state),
      });
      if (result.resolvedState.hackState.teamProgress.BLUE.bankSucceeded) {
        successful = result;
      }
    }

    expect(successful).toBeDefined();
    expect(successful?.resolvedState.allocationPenaltyTurns.RED).toBe(2);
    expect(
      successful?.resolvedState.hackState.disabledFacilityIds.has("bank-1"),
    ).toBe(true);
    const next = startNextLocalTurn(successful!.resolvedState);
    expect(next.economies.RED.allocation).toBe(2_000);
  });

  it("purges a mole before movement and schedules the shorter replacement cycle", () => {
    const state = createLocalTurnFixture();
    const blueOrders: GeneralOrder[] = [
      { kind: "WAIT", agentId: "blue-k" },
      { kind: "PURGE", agentId: "blue-h" },
      { kind: "WAIT", agentId: "blue-d" },
    ];
    const result = resolveLocalTurn({
      state,
      generalOrders: {
        BLUE: blueOrders,
        RED: waitOrders(state, "RED"),
      },
      moleOrders: acquiesceMoleOrders(state),
    });

    expect(
      result.resolvedState.agents.find((agent) => agent.id === "blue-h"),
    ).toMatchObject({ status: "REINFORCEMENT_PENDING", canAct: false });
    expect(result.removals).toContainEqual(
      expect.objectContaining({
        agentId: "blue-h",
        cause: "PURGE_MOLE",
      }),
    );
    const reinforcement = result.resolvedState.reinforcements.find(
      (entry) => entry.agentId === "blue-h",
    );
    expect(reinforcement).toMatchObject({
      dueTurn: state.turnNumber + 2,
      moleRebuyTurn: state.turnNumber + 3,
    });

    const dueState = {
      ...result.resolvedState,
      turnNumber: reinforcement!.dueTurn - 1,
    };
    const next = startNextLocalTurn(dueState);
    const replacement = next.agents.find((agent) => agent.id === "blue-h");
    expect(replacement).toMatchObject({
      status: "ACTIVE",
      canAct: true,
      interrogationMark: undefined,
      moleController: undefined,
    });
    expect(
      next.map.facilities
        .filter(
          (facility) => facility.kind === "AIRPORT" || facility.kind === "PORT",
        )
        .flatMap((facility) => facility.cells)
        .some((coordinate) =>
          replacement
            ? coordinate.row === replacement.coordinate.row &&
              coordinate.col === replacement.coordinate.col
            : false,
        ),
    ).toBe(true);
  });

  it("delivers an objective after assassination timing and reaches victory", () => {
    const base = createLocalTurnFixture({ seed: "delivery-win" });
    const state = {
      ...base,
      agents: base.agents.map((agent) =>
        agent.id === "blue-d"
          ? {
              ...agent,
              coordinate: excelAddressToCoordinate("O2"),
              carriedObjectiveId: "blueprint",
            }
          : agent,
      ),
      objectives: base.objectives.map((objective) =>
        objective.id === "blueprint"
          ? {
              ...objective,
              state: {
                status: "CARRIED" as const,
                carrierAgentId: "blue-d",
              },
            }
          : objective,
      ),
      deliveredObjectives: {
        BLUE: ["RED_ROSTER" as const],
        RED: [],
      },
      visibleEnemyAgentIdsByViewer: {
        BLUE: new Set<string>(),
        RED: new Set<string>(),
      },
    };
    const result = resolveLocalTurn({
      state,
      generalOrders: {
        BLUE: waitOrders(state, "BLUE"),
        RED: waitOrders(state, "RED"),
      },
      moleOrders: acquiesceMoleOrders(state),
    });

    expect(result.deliveredThisTurn.BLUE).toContain("BLUEPRINT");
    expect(result.outcome).toEqual({ kind: "WIN", winner: "BLUE" });
    expect(
      result.resolvedState.objectives.find(
        (objective) => objective.id === "blueprint",
      )?.state,
    ).toEqual({ status: "DELIVERED", deliveredBy: "BLUE" });
  });

  it("runs three consecutive fixture turns without losing deterministic replay", () => {
    let state = createLocalTurnFixture({ seed: "three-turn-fixture" });
    const fingerprints = new Set<string>();

    for (let turnIndex = 0; turnIndex < 3; turnIndex += 1) {
      const input = {
        state,
        generalOrders: {
          BLUE: waitOrders(state, "BLUE"),
          RED: waitOrders(state, "RED"),
        },
        moleOrders: acquiesceMoleOrders(state),
      };
      const resolved = resolveLocalTurn(input);
      const replay = resolveLocalTurn(input);
      const fingerprint = localStateFingerprint(resolved.resolvedState);

      expect(localStateFingerprint(replay.resolvedState)).toBe(fingerprint);
      expect(resolved.outcome).toEqual({ kind: "ONGOING" });
      fingerprints.add(fingerprint);
      state = startNextLocalTurn(resolved.resolvedState);
    }

    expect(state.turnNumber).toBe(7);
    expect(fingerprints).toHaveLength(3);
  });

  it("resolves simultaneous arrivals against the four-agent destination cap", () => {
    let successful: ReturnType<typeof resolveLocalTurn> | undefined;

    for (let index = 0; index < 250 && !successful; index += 1) {
      const base = createLocalTurnFixture({
        seed: `integrated-capacity-${index}`,
      });
      const state = {
        ...base,
        agents: base.agents.map((agent) => {
          const coordinate = {
            "blue-k": "C4",
            "red-k": "E4",
            "blue-h": "D4",
            "blue-d": "D4",
            "red-d": "D4",
          }[agent.id];
          return coordinate
            ? { ...agent, coordinate: excelAddressToCoordinate(coordinate) }
            : agent;
        }),
      };
      const result = resolveLocalTurn({
        state,
        generalOrders: {
          BLUE: [
            {
              kind: "OPERATE",
              agentId: "blue-k",
              path: [excelAddressToCoordinate("D4")],
              arrivalAction: { kind: "MOVE_ONLY" },
            },
            { kind: "WAIT", agentId: "blue-h" },
            { kind: "WAIT", agentId: "blue-d" },
          ],
          RED: [
            {
              kind: "OPERATE",
              agentId: "red-k",
              path: [excelAddressToCoordinate("D4")],
              arrivalAction: { kind: "MOVE_ONLY" },
            },
            { kind: "WAIT", agentId: "red-h" },
            { kind: "WAIT", agentId: "red-d" },
          ],
        },
        moleOrders: acquiesceMoleOrders(state),
      });
      const reasons = result.movementResults.map((entry) => entry.reason);
      if (
        reasons.filter((reason) => reason === "ARRIVED").length === 1 &&
        reasons.filter((reason) => reason === "DESTINATION_FULL").length === 1
      ) {
        successful = result;
      }
    }

    expect(successful).toBeDefined();
    expect(
      successful?.resolvedState.agents.filter(
        (agent) =>
          agent.status === "ACTIVE" &&
          agent.coordinate.row === excelAddressToCoordinate("D4").row &&
          agent.coordinate.col === excelAddressToCoordinate("D4").col,
      ),
    ).toHaveLength(4);
    expect(successful?.movementResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: "ARRIVED" }),
        expect.objectContaining({ reason: "DESTINATION_FULL" }),
      ]),
    );
  });

  it("handles two removals and places both due reinforcements on distinct empty transport cells", () => {
    const state = {
      ...createLocalTurnFixture({ seed: "compound-reinforcement" }),
      turnNumber: 6,
    };
    const blueMole = state.agents.find(
      (agent) => agent.moleController === "BLUE",
    )!;
    const result = resolveLocalTurn({
      state,
      generalOrders: {
        BLUE: [
          { kind: "WAIT", agentId: "blue-k" },
          { kind: "PURGE", agentId: "blue-h" },
          { kind: "WAIT", agentId: "blue-d" },
        ],
        RED: waitOrders(state, "RED"),
      },
      moleOrders: {
        BLUE: {
          kind: "ASSASSINATE_COLLEAGUE",
          moleAgentId: blueMole.id,
          targetAgentId: "red-h",
        },
        RED: { kind: "ACQUIESCE", moleAgentId: "blue-h" },
      },
    });

    expect(result.removals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          agentId: "blue-h",
          cause: "PURGE_MOLE",
        }),
        expect.objectContaining({
          agentId: "red-h",
          cause: "ASSASSINATION",
        }),
      ]),
    );

    let advanced = result.resolvedState;
    while (advanced.turnNumber < state.turnNumber + 3) {
      advanced = startNextLocalTurn(advanced);
    }
    const replacements = advanced.agents.filter(
      (agent) => agent.id === "blue-h" || agent.id === "red-h",
    );
    expect(replacements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "blue-h", status: "ACTIVE" }),
        expect.objectContaining({ id: "red-h", status: "ACTIVE" }),
      ]),
    );
    expect(
      new Set(
        replacements.map(
          (agent) => `${agent.coordinate.row}:${agent.coordinate.col}`,
        ),
      ).size,
    ).toBe(2);
    expect(advanced.reinforcements).toHaveLength(0);
  });

  it("drops one carried objective while delivering another in the same Resolve", () => {
    const base = createLocalTurnFixture({ seed: "drop-and-deliver" });
    const state = {
      ...base,
      agents: base.agents.map((agent) => {
        if (agent.id === "blue-h") {
          return { ...agent, carriedObjectiveId: "scientist" };
        }
        if (agent.id === "blue-d") {
          return {
            ...agent,
            coordinate: excelAddressToCoordinate("O2"),
            carriedObjectiveId: "blueprint",
          };
        }
        return agent;
      }),
      objectives: base.objectives.map((objective) => {
        if (objective.id === "scientist") {
          return {
            ...objective,
            state: { status: "CARRIED" as const, carrierAgentId: "blue-h" },
          };
        }
        if (objective.id === "blueprint") {
          return {
            ...objective,
            state: { status: "CARRIED" as const, carrierAgentId: "blue-d" },
          };
        }
        return objective;
      }),
    };
    const result = resolveLocalTurn({
      state,
      generalOrders: {
        BLUE: [
          { kind: "WAIT", agentId: "blue-k" },
          { kind: "PURGE", agentId: "blue-h" },
          { kind: "WAIT", agentId: "blue-d" },
        ],
        RED: waitOrders(state, "RED"),
      },
      moleOrders: acquiesceMoleOrders(state),
    });

    expect(
      result.resolvedState.objectives.find(
        (objective) => objective.id === "scientist",
      )?.state,
    ).toEqual({
      status: "DROPPED",
      coordinate: excelAddressToCoordinate("P1"),
    });
    expect(
      result.resolvedState.objectives.find(
        (objective) => objective.id === "blueprint",
      )?.state,
    ).toEqual({ status: "DELIVERED", deliveredBy: "BLUE" });
    expect(result.deliveredThisTurn.BLUE).toEqual(["BLUEPRINT"]);
    expect(result.outcome).toEqual({ kind: "ONGOING" });
  });

  it("declares an integrated draw when both teams deliver their second objective", () => {
    const base = createLocalTurnFixture({ seed: "simultaneous-delivery-draw" });
    const state = {
      ...base,
      agents: base.agents.map((agent) => {
        if (agent.id === "blue-d") {
          return {
            ...agent,
            coordinate: excelAddressToCoordinate("O2"),
            carriedObjectiveId: "red-roster",
          };
        }
        if (agent.id === "red-d") {
          return {
            ...agent,
            coordinate: excelAddressToCoordinate("B15"),
            carriedObjectiveId: "blue-roster",
          };
        }
        return agent;
      }),
      objectives: base.objectives.map((objective) => {
        if (objective.id === "red-roster") {
          return {
            ...objective,
            state: { status: "CARRIED" as const, carrierAgentId: "blue-d" },
          };
        }
        if (objective.id === "blue-roster") {
          return {
            ...objective,
            state: { status: "CARRIED" as const, carrierAgentId: "red-d" },
          };
        }
        if (objective.id === "blueprint") {
          return {
            ...objective,
            state: {
              status: "DELIVERED" as const,
              deliveredBy: "BLUE" as const,
            },
          };
        }
        if (objective.id === "scientist") {
          return {
            ...objective,
            state: {
              status: "DELIVERED" as const,
              deliveredBy: "RED" as const,
            },
          };
        }
        return objective;
      }),
      deliveredObjectives: {
        BLUE: ["BLUEPRINT" as const],
        RED: ["SCIENTIST" as const],
      },
    };
    const result = resolveLocalTurn({
      state,
      generalOrders: {
        BLUE: waitOrders(state, "BLUE"),
        RED: waitOrders(state, "RED"),
      },
      moleOrders: acquiesceMoleOrders(state),
    });

    expect(result.deliveredThisTurn).toEqual({
      BLUE: ["RED_ROSTER"],
      RED: ["BLUE_ROSTER"],
    });
    expect(result.outcome).toEqual({ kind: "DRAW" });
    expect(result.resolvedState.outcome).toEqual({ kind: "DRAW" });
  });
});
