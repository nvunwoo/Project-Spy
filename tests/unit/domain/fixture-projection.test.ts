import { describe, expect, it } from "vitest";

import {
  createFixtureCanonicalState,
  projectFixtureForTeam,
} from "@/fixtures/fixture-player-projection";

function collectObjectKeys(
  value: unknown,
  keys = new Set<string>(),
): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, keys);
    }
    return keys;
  }
  if (typeof value !== "object" || value === null) {
    return keys;
  }

  for (const [key, nested] of Object.entries(value)) {
    keys.add(key);
    collectObjectKeys(nested, keys);
  }
  return keys;
}

describe("fixture player allowlist projection", () => {
  it("does not leak canonical secrets or production-only map metadata", () => {
    const canonical = createFixtureCanonicalState();
    const projection = projectFixtureForTeam(canonical, "BLUE");
    const keys = collectObjectKeys(projection);

    expect(canonical.agents).toHaveLength(6);
    expect(projection.ownAgents).toHaveLength(3);

    expect(keys).not.toContain("rngSeed");
    expect(keys).not.toContain("moleController");
    expect(keys).not.toContain("blockId");
    expect(keys).not.toContain("visibleEnemyAgentIdsByViewer");
    expect(keys).not.toContain("carrierAgentId");

    const nominalBlueMole = projection.ownAgents.find(
      (agent) => agent.role === "H",
    );
    expect(nominalBlueMole).toMatchObject({
      viewId: expect.stringMatching(/^agent-view-[a-z0-9]+$/),
      role: "H",
    });
    expect(nominalBlueMole).not.toHaveProperty("moleController");

    // BLUE may know and command its mole inside RED, including that mole's role.
    expect(projection.controlledMole).toMatchObject({
      viewId: expect.stringMatching(/^agent-view-[a-z0-9]+$/),
      nominalTeam: "RED",
      role: "D",
    });

    for (const canonicalAgentId of canonical.agents.map((agent) => agent.id)) {
      expect(JSON.stringify(projection)).not.toContain(canonicalAgentId);
    }
  });

  it("reveals only the viewer's own hidden roster objective", () => {
    const canonical = createFixtureCanonicalState();
    const blue = projectFixtureForTeam(canonical, "BLUE");
    const red = projectFixtureForTeam(canonical, "RED");

    expect(blue.knownObjectives.map((objective) => objective.kind)).toEqual([
      "BLUE_ROSTER",
    ]);
    expect(red.knownObjectives.map((objective) => objective.kind)).toEqual([
      "RED_ROSTER",
    ]);
    expect(JSON.stringify(blue)).not.toContain("server-only-fixture-seed");
  });

  it("never attaches an enemy role to ordinary visibility", () => {
    const canonical = createFixtureCanonicalState();
    const withVisibleEnemy = {
      ...canonical,
      visibleEnemyAgentIdsByViewer: {
        RED: canonical.visibleEnemyAgentIdsByViewer.RED,
        BLUE: new Set(["red-k"]),
      },
    };
    const blue = projectFixtureForTeam(withVisibleEnemy, "BLUE");

    expect(blue.visibleEnemyAgents).toEqual([
      expect.objectContaining({
        viewId: expect.stringMatching(/^agent-view-[a-z0-9]+$/),
        isCarryingObjective: false,
      }),
    ]);
    expect(blue.visibleEnemyAgents[0]).not.toHaveProperty("id");
    expect(blue.visibleEnemyAgents[0]).not.toHaveProperty("role");
    expect(blue.visibleEnemyAgents[0]).not.toHaveProperty("moleController");
  });

  it("keeps opaque agent IDs stable within one viewer and scoped between viewers", () => {
    const canonical = createFixtureCanonicalState();
    const blueFirst = projectFixtureForTeam(canonical, "BLUE");
    const blueAgain = projectFixtureForTeam(canonical, "BLUE");
    const red = projectFixtureForTeam(canonical, "RED");

    expect(blueAgain.ownAgents.map((agent) => agent.viewId)).toEqual(
      blueFirst.ownAgents.map((agent) => agent.viewId),
    );

    const blueControlledRedD = blueFirst.controlledMole;
    const redOwnD = red.ownAgents.find((agent) => agent.role === "D");
    expect(blueControlledRedD).toBeDefined();
    expect(redOwnD).toBeDefined();
    expect(blueControlledRedD?.viewId).not.toBe(redOwnD?.viewId);
  });

  it("uses one authorized view ID for an ordinary contact and a controlled mole", () => {
    const canonical = createFixtureCanonicalState();
    const withVisibleControlledMole = {
      ...canonical,
      visibleEnemyAgentIdsByViewer: {
        RED: canonical.visibleEnemyAgentIdsByViewer.RED,
        BLUE: new Set(["red-d"]),
      },
    };
    const blue = projectFixtureForTeam(withVisibleControlledMole, "BLUE");
    const visibleContact = blue.visibleEnemyAgents[0];

    expect(visibleContact?.viewId).toBe(blue.controlledMole?.viewId);
    expect(visibleContact).not.toHaveProperty("role");
    expect(blue.controlledMole).toHaveProperty("role", "D");
  });

  it("shows a carried objective and carrier position but restricts the scientist exit", () => {
    const canonical = createFixtureCanonicalState();
    const carried = {
      ...canonical,
      objectives: canonical.objectives.map((objective) =>
        objective.kind === "SCIENTIST"
          ? {
              ...objective,
              state: {
                status: "CARRIED" as const,
                carrierAgentId: "red-k",
              },
            }
          : objective,
      ),
      agents: canonical.agents.map((agent) =>
        agent.id === "red-k"
          ? { ...agent, carriedObjectiveId: "scientist" }
          : agent,
      ),
    };

    const blue = projectFixtureForTeam(carried, "BLUE");
    const red = projectFixtureForTeam(carried, "RED");
    const blueCarrier = blue.visibleEnemyAgents.find(
      (agent) => agent.isCarryingObjective,
    );
    const blueScientist = blue.knownObjectives.find(
      (objective) => objective.kind === "SCIENTIST",
    );
    expect(blueCarrier).toBeDefined();
    expect(blueScientist?.carrierViewId).toBe(blueCarrier?.viewId);
    expect(blueScientist).not.toHaveProperty("carrierAgentId");
    expect(blueScientist).not.toHaveProperty("scientistExit");
    expect(
      red.knownObjectives.find((objective) => objective.kind === "SCIENTIST"),
    ).toHaveProperty("scientistExit", "PORT");
  });
});
