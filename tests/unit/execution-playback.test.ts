import { describe, expect, it } from "vitest";

import type { Team } from "@/domain/model/game-types";
import type { GeneralOrder } from "@/domain/orders/order-types";
import { resolveLocalTurn } from "@/domain/resolve-turn/resolve-turn";
import {
  createLocalTurnFixture,
  createFixtureOpponentOrders,
} from "@/fixtures/local-turn-fixture";
import { buildExecutionPlayback } from "@/game-client/fixture/execution-playback";

function waitOrders(
  state: ReturnType<typeof createLocalTurnFixture>,
  team: Team,
): readonly GeneralOrder[] {
  return state.agents
    .filter(
      (agent) =>
        agent.nominalTeam === team && agent.status === "ACTIVE" && agent.canAct,
    )
    .map((agent) => ({ kind: "WAIT", agentId: agent.id }) as const);
}

describe("viewer-scoped execution playback", () => {
  it("includes own agents and the controlled mole without exposing other opponents", () => {
    const state = createLocalTurnFixture({ seed: "playback-privacy" });
    const blueOrders = waitOrders(state, "BLUE");
    const redOrders = createFixtureOpponentOrders(state, "RED");
    const mole = state.agents.find((agent) => agent.moleController === "BLUE")!;
    const moleOrder = { kind: "ACQUIESCE", moleAgentId: mole.id } as const;
    const result = resolveLocalTurn({
      state,
      generalOrders: { BLUE: blueOrders, RED: redOrders },
      moleOrders: { BLUE: moleOrder },
    });

    const cues = buildExecutionPlayback({
      beforeState: state,
      viewer: "BLUE",
      generalOrders: blueOrders,
      moleOrder,
      result,
    }).flatMap((beat) => beat.cues);

    expect(cues.map((cue) => cue.agentId)).toEqual(
      expect.arrayContaining(["blue-k", "blue-h", "blue-d", mole.id]),
    );
    expect(cues.some((cue) => cue.label === "배신자 명령 묵인")).toBe(true);
    expect(
      cues.some(
        (cue) => cue.agentId.startsWith("red-") && cue.agentId !== mole.id,
      ),
    ).toBe(false);
  });
});
