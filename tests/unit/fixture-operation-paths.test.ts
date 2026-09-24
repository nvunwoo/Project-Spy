import { describe, expect, it } from "vitest";

import {
  fixturePathToP6,
  getFixturePath,
  getFixtureReachableCells,
  isValidFixturePath,
  operationFixture,
} from "@/game-client/fixture/operation-fixture";

describe("operation fixture path adapter", () => {
  it("keeps the actual browser fixture projection free of opponent role and server fields", () => {
    const serialized = JSON.stringify(operationFixture);
    const opponentPayload = JSON.stringify(operationFixture.visibleOpponents);

    expect(opponentPayload).not.toMatch(/red-[khd]/iu);
    expect(opponentPayload).not.toMatch(
      /"(?:role|moleController|canonicalId|rngSeed|serverSeed|hiddenState)"/u,
    );
    expect(serialized).not.toMatch(
      /"(?:moleController|canonicalId|rngSeed|serverSeed|hiddenState)"/u,
    );
    for (const opponent of operationFixture.visibleOpponents) {
      expect(Object.keys(opponent).sort()).toEqual([
        "carryingPublicObjective",
        "coordinate",
        "id",
        "label",
        "team",
      ]);
    }
  });

  it("derives every reachable path from the selected agent's own origin and role", () => {
    for (const agent of operationFixture.agents) {
      const reachable = getFixtureReachableCells(agent);

      expect(reachable).toContainEqual(agent.coordinate);
      for (const destination of reachable) {
        const path = getFixturePath(agent, destination.row, destination.col);
        expect(path).not.toBeNull();
        expect(isValidFixturePath(agent, path ?? [])).toBe(true);

        const first = path?.[0];
        if (first) {
          const firstStepDistance =
            Math.abs(first.row - agent.coordinate.row) +
            Math.abs(first.col - agent.coordinate.col);
          expect(firstStepDistance).toBe(1);
        }

        expect(path?.length ?? 0).toBeLessThanOrEqual(3);
        expect(path?.at(-1) ?? agent.coordinate).toEqual(destination);
      }
    }
  });

  it("preserves the documented K path but never reuses it for H", () => {
    const agentK = operationFixture.agents.find(
      (agent) => agent.callsign === "K",
    );
    const agentH = operationFixture.agents.find(
      (agent) => agent.callsign === "H",
    );

    expect(agentK).toBeDefined();
    expect(agentH).toBeDefined();
    expect(getFixturePath(agentK!, 5, 15)).toEqual(fixturePathToP6);
    expect(getFixturePath(agentH!, 9, 3)).toBeNull();
  });
});
