import { describe, expect, it } from "vitest";

import {
  createLocalPhaseDeadline,
  getLocalPhaseRemainingSeconds,
  LOCAL_PHASE_DURATION_SECONDS,
} from "@/game-client/fixture/local-phase-deadline";

describe("Phase 0B-3 local deadline math", () => {
  it("creates the approved 50-second, 10-second, and 5-second deadlines", () => {
    expect(LOCAL_PHASE_DURATION_SECONDS).toEqual({
      GENERAL: 50,
      MOLE: 10,
      RESULTS: 5,
    });
    expect(createLocalPhaseDeadline("GENERAL", 1_000)).toEqual({
      phase: "GENERAL",
      deadlineAtMs: 51_000,
    });
    expect(createLocalPhaseDeadline("MOLE", 1_000)).toEqual({
      phase: "MOLE",
      deadlineAtMs: 11_000,
    });
    expect(createLocalPhaseDeadline("RESULTS", 1_000)).toEqual({
      phase: "RESULTS",
      deadlineAtMs: 6_000,
    });
  });

  it("recovers remaining time from the deadline instead of counted ticks", () => {
    const deadline = createLocalPhaseDeadline("GENERAL", 10_000);

    expect(getLocalPhaseRemainingSeconds(deadline, 10_000)).toBe(50);
    expect(getLocalPhaseRemainingSeconds(deadline, 50_001)).toBe(10);
    expect(getLocalPhaseRemainingSeconds(deadline, 59_999)).toBe(1);
    expect(getLocalPhaseRemainingSeconds(deadline, 60_000)).toBe(0);
    expect(getLocalPhaseRemainingSeconds(deadline, 90_000)).toBe(0);
  });

  it("clamps a stale pre-phase clock sample to the phase duration", () => {
    const deadline = createLocalPhaseDeadline("MOLE", 20_000);
    expect(getLocalPhaseRemainingSeconds(deadline, 0)).toBe(10);
    expect(getLocalPhaseRemainingSeconds(null, 20_000)).toBe(0);
  });

  it("rejects a non-finite authority clock value", () => {
    expect(() => createLocalPhaseDeadline("GENERAL", Number.NaN)).toThrow(
      "finite wall-clock",
    );
  });
});
