import { describe, expect, it } from "vitest";

import {
  commandComposerReducer,
  initialComposerState,
  type ComposerState,
} from "@/ui/command-composer/command-reducer";

const origin = { row: 7, col: 2 } as const;
const destination = { row: 9, col: 3 } as const;
const path = [{ row: 7, col: 3 }, { row: 8, col: 3 }, destination] as const;

function selected(): ComposerState {
  return commandComposerReducer(initialComposerState, {
    type: "SELECT_AGENT",
    agentId: "blue-k",
    origin,
  });
}

describe("commandComposerReducer", () => {
  it("opens destination operations directly after a map destination click", () => {
    const primary = selected();
    expect(primary.type).toBe("primary");

    const reachable = commandComposerReducer(primary, { type: "CHOOSE_MOVE" });
    expect(reachable.type).toBe("reachable");

    const arrival = commandComposerReducer(reachable, {
      type: "SELECT_DESTINATION",
      destination,
      path,
    });
    expect(arrival.type).toBe("arrival");

    const complete = commandComposerReducer(arrival, {
      type: "CHOOSE_ARRIVAL",
      action: "INVESTIGATE",
    });
    expect(complete).toMatchObject({
      type: "complete",
      draft: {
        agentId: "blue-k",
        primaryAction: "MOVE",
        destination,
        arrivalAction: "INVESTIGATE",
      },
    });
  });

  it("backs out exactly one unfinished level at a time", () => {
    const reachable = commandComposerReducer(selected(), {
      type: "CHOOSE_MOVE",
    });
    const arrival = commandComposerReducer(reachable, {
      type: "SELECT_DESTINATION",
      destination,
      path,
    });
    const backToReachable = commandComposerReducer(arrival, {
      type: "BACK",
    });
    expect(backToReachable.type).toBe("reachable");
    const backToPrimary = commandComposerReducer(backToReachable, {
      type: "BACK",
    });
    expect(backToPrimary.type).toBe("primary");
    expect(commandComposerReducer(backToPrimary, { type: "BACK" })).toEqual({
      type: "idle",
    });
  });

  it("supports a zero-cell operation by selecting the current map position", () => {
    const reachable = commandComposerReducer(selected(), {
      type: "CHOOSE_MOVE",
    });
    const arrival = commandComposerReducer(reachable, {
      type: "SELECT_DESTINATION",
      destination: origin,
      path: [],
    });
    const complete = commandComposerReducer(arrival, {
      type: "CHOOSE_ARRIVAL",
      action: "INVESTIGATE",
    });

    expect(complete).toMatchObject({
      type: "complete",
      draft: { path: [], destination: origin, arrivalAction: "INVESTIGATE" },
    });
  });

  it("models wait, interrogation, and purge as mutually exclusive immediate commands", () => {
    expect(
      commandComposerReducer(selected(), {
        type: "CHOOSE_IMMEDIATE",
        action: "WAIT",
      }),
    ).toMatchObject({
      type: "complete",
      draft: { primaryAction: "WAIT", path: [] },
    });

    const purge = commandComposerReducer(selected(), { type: "REQUEST_PURGE" });
    expect(purge.type).toBe("purge-confirm");
    expect(
      commandComposerReducer(purge, { type: "CONFIRM_PURGE" }),
    ).toMatchObject({
      type: "complete",
      draft: { primaryAction: "PURGE", path: [] },
    });
  });
});
