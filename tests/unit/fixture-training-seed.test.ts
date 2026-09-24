import { describe, expect, it } from "vitest";

import {
  createNextLocalMatchSeed,
  DEFAULT_LOCAL_MATCH_SEED,
} from "@/fixtures/local-turn-fixture";

describe("local training seed", () => {
  it("derives the same next seed from the same current seed", () => {
    expect(createNextLocalMatchSeed("훈련-A")).toBe(
      createNextLocalMatchSeed("훈련-A"),
    );
  });

  it("creates a distinct bounded seed suitable for the roster input", () => {
    const nextSeed = createNextLocalMatchSeed(DEFAULT_LOCAL_MATCH_SEED);

    expect(nextSeed).not.toBe(DEFAULT_LOCAL_MATCH_SEED);
    expect(nextSeed).toMatch(/^서울-훈련-[a-f0-9]{8}$/);
    expect(nextSeed.length).toBeLessThanOrEqual(48);
  });

  it("normalizes whitespace and falls back to the default seed", () => {
    expect(createNextLocalMatchSeed("   ")).toBe(
      createNextLocalMatchSeed(DEFAULT_LOCAL_MATCH_SEED),
    );
    expect(createNextLocalMatchSeed("  훈련-A  ")).toBe(
      createNextLocalMatchSeed("훈련-A"),
    );
  });

  it("supports a deterministic sequence of different training seeds", () => {
    const first = createNextLocalMatchSeed(DEFAULT_LOCAL_MATCH_SEED);
    const second = createNextLocalMatchSeed(first);

    expect(second).not.toBe(first);
    expect(second).toMatch(/^서울-훈련-[a-f0-9]{8}$/);
  });
});
