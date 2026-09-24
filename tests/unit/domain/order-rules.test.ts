import { describe, expect, it } from "vitest";

import type { AgentRole, AgentState, Team } from "@/domain/model/game-types";
import { excelAddressToCoordinate } from "@/domain/map/coordinates";
import { createV06FixtureMapManifest } from "@/domain/map/map-manifest";
import {
  createEmptyHackState,
  getAvailableFunds,
  getGeneralOrderCost,
  getMoleOrderCost,
  getOperationSuccessRate,
  isMoleColleagueAssassinationUnlocked,
  normalizeGeneralOrder,
  settleUnusedAllocation,
  spendFunds,
  validateGeneralOrderSet,
} from "@/domain/orders/order-rules";
import type { GeneralOrder } from "@/domain/orders/order-types";

function agent(team: Team, role: AgentRole, address: string): AgentState {
  return {
    id: `${team.toLowerCase()}-${role.toLowerCase()}`,
    nominalTeam: team,
    role,
    coordinate: excelAddressToCoordinate(address),
    status: "ACTIVE",
    canAct: true,
  };
}

describe("order costs and normalization", () => {
  it("uses exact v0.6 movement and action costs", () => {
    const threeStepPath = ["P4", "P5", "P6"].map(excelAddressToCoordinate);
    expect(
      getGeneralOrderCost({
        kind: "OPERATE",
        agentId: "blue-k",
        path: threeStepPath,
        arrivalAction: { kind: "MOVE_ONLY" },
      }),
    ).toBe(600);
    expect(
      getGeneralOrderCost({
        kind: "OPERATE",
        agentId: "blue-k",
        path: threeStepPath,
        arrivalAction: { kind: "INVESTIGATE" },
      }),
    ).toBe(1_600);
    expect(
      getGeneralOrderCost({
        kind: "OPERATE",
        agentId: "blue-k",
        path: threeStepPath,
        arrivalAction: { kind: "ASSASSINATE", targetAgentId: "red-k" },
      }),
    ).toBe(2_600);
    expect(
      getGeneralOrderCost({
        kind: "OPERATE",
        agentId: "blue-k",
        path: threeStepPath,
        arrivalAction: { kind: "HACK", facilityId: "bank-1" },
      }),
    ).toBe(2_600);
    expect(
      getGeneralOrderCost({ kind: "INTERROGATE", agentId: "blue-k" }),
    ).toBe(1_000);
    expect(getGeneralOrderCost({ kind: "PURGE", agentId: "blue-k" })).toBe(
      2_000,
    );
    expect(
      getMoleOrderCost({
        kind: "ASSASSINATE_COLLEAGUE",
        moleAgentId: "red-d",
        targetAgentId: "red-k",
      }),
    ).toBe(2_500);
  });

  it("normalizes zero-cell move-only to WAIT but preserves a zero-cell operation", () => {
    expect(
      normalizeGeneralOrder({
        kind: "OPERATE",
        agentId: "blue-k",
        path: [],
        arrivalAction: { kind: "MOVE_ONLY" },
      }),
    ).toEqual({ kind: "WAIT", agentId: "blue-k" });
    expect(
      normalizeGeneralOrder({
        kind: "OPERATE",
        agentId: "blue-k",
        path: [],
        arrivalAction: { kind: "INVESTIGATE" },
      }),
    ).toMatchObject({
      kind: "OPERATE",
      arrivalAction: { kind: "INVESTIGATE" },
    });
  });
});

describe("success rates and economy", () => {
  it.each([
    ["K", "ASSASSINATE", false, 80],
    ["H", "HACK", false, 80],
    ["D", "INVESTIGATE", false, 80],
    ["D", "MOVE", false, 70],
    ["K", "HACK", false, 60],
    ["K", "ASSASSINATE", true, 70],
    ["H", "MOVE", true, 60],
  ] as const)(
    "%s performing %s with penalty=%s has rate %i",
    (role, operation, loyaltyPenaltyActive, expected) => {
      expect(
        getOperationSuccessRate({ role, operation, loyaltyPenaltyActive }),
      ).toBe(expected);
    },
  );

  it("unlocks mole colleague assassination after five completed turns", () => {
    expect(isMoleColleagueAssassinationUnlocked(5)).toBe(false);
    expect(isMoleColleagueAssassinationUnlocked(6)).toBe(true);
  });

  it("spends allocation first, preserves unused bank, and banks half the allocation", () => {
    expect(getAvailableFunds({ allocation: 3_000, bank: 2_500 })).toBe(5_500);
    expect(spendFunds({ allocation: 3_000, bank: 2_500 }, 4_000)).toEqual({
      ok: true,
      economy: { allocation: 0, bank: 1_500 },
      spentFromAllocation: 3_000,
      spentFromBank: 1_000,
    });
    expect(spendFunds({ allocation: 3_000, bank: 500 }, 4_000)).toEqual({
      ok: false,
      reason: "INSUFFICIENT_FUNDS",
      shortfall: 500,
    });
    expect(settleUnusedAllocation({ allocation: 2_000, bank: 2_500 })).toEqual({
      allocation: 0,
      bank: 3_500,
    });
  });
});

describe("complete general order validation", () => {
  const manifest = createV06FixtureMapManifest();

  it("accepts one bank hack plus one communications hack and complete WAIT defaults", () => {
    const agents = [
      agent("BLUE", "H", "H4"),
      agent("BLUE", "K", "D5"),
      agent("BLUE", "D", "N1"),
    ];
    const orders: GeneralOrder[] = [
      {
        kind: "OPERATE",
        agentId: "blue-h",
        path: [excelAddressToCoordinate("H5")],
        arrivalAction: { kind: "HACK", facilityId: "bank-1" },
      },
      {
        kind: "OPERATE",
        agentId: "blue-k",
        path: [excelAddressToCoordinate("C5")],
        arrivalAction: { kind: "HACK", facilityId: "communications-1" },
      },
      { kind: "WAIT", agentId: "blue-d" },
    ];

    expect(
      validateGeneralOrderSet({
        team: "BLUE",
        agents,
        orders,
        manifest,
        economy: { allocation: 3_000, bank: 2_000 },
        visibleEnemyAgentIds: new Set(),
        hackState: createEmptyHackState(),
      }),
    ).toMatchObject({ ok: true, totalCost: 4_400, issues: [] });
  });

  it("rejects duplicate category hacks, excess purge, missing orders, and excess cost", () => {
    const agents = [
      agent("BLUE", "H", "H4"),
      agent("BLUE", "K", "G5"),
      agent("BLUE", "D", "N1"),
    ];
    const orders: GeneralOrder[] = [
      {
        kind: "OPERATE",
        agentId: "blue-h",
        path: [excelAddressToCoordinate("H5")],
        arrivalAction: { kind: "HACK", facilityId: "bank-1" },
      },
      {
        kind: "OPERATE",
        agentId: "blue-k",
        path: [excelAddressToCoordinate("H5")],
        arrivalAction: { kind: "HACK", facilityId: "bank-1" },
      },
      { kind: "PURGE", agentId: "blue-h" },
      { kind: "PURGE", agentId: "blue-h" },
    ];

    const result = validateGeneralOrderSet({
      team: "BLUE",
      agents,
      orders,
      manifest,
      economy: { allocation: 3_000, bank: 0 },
      visibleEnemyAgentIds: new Set(),
      hackState: createEmptyHackState(),
    });
    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "BANK_HACK_LIMIT_EXCEEDED",
        "PURGE_LIMIT_EXCEEDED",
        "DUPLICATE_AGENT_ORDER",
        "MISSING_AGENT_ORDER",
        "INSUFFICIENT_FUNDS",
      ]),
    );
  });

  it("requires a visible enemy in the command-time 3x3 assassination range", () => {
    const blue = agent("BLUE", "K", "D4");
    const nearRed = agent("RED", "H", "E4");
    const farRed = agent("RED", "D", "P16");
    const baseOrders: GeneralOrder[] = [
      {
        kind: "OPERATE",
        agentId: blue.id,
        path: [],
        arrivalAction: { kind: "ASSASSINATE", targetAgentId: nearRed.id },
      },
    ];

    expect(
      validateGeneralOrderSet({
        team: "BLUE",
        agents: [blue, nearRed, farRed],
        orders: baseOrders,
        manifest,
        economy: { allocation: 3_000, bank: 0 },
        visibleEnemyAgentIds: new Set([nearRed.id]),
        hackState: createEmptyHackState(),
      }).ok,
    ).toBe(true);

    const hidden = validateGeneralOrderSet({
      team: "BLUE",
      agents: [blue, nearRed, farRed],
      orders: baseOrders,
      manifest,
      economy: { allocation: 3_000, bank: 0 },
      visibleEnemyAgentIds: new Set(),
      hackState: createEmptyHackState(),
    });
    expect(hidden.issues.map((issue) => issue.code)).toContain(
      "ASSASSINATION_TARGET_NOT_VISIBLE",
    );

    const outOfRange = validateGeneralOrderSet({
      team: "BLUE",
      agents: [blue, nearRed, farRed],
      orders: [
        {
          kind: "OPERATE",
          agentId: blue.id,
          path: [],
          arrivalAction: { kind: "ASSASSINATE", targetAgentId: farRed.id },
        },
      ],
      manifest,
      economy: { allocation: 3_000, bank: 0 },
      visibleEnemyAgentIds: new Set([farRed.id]),
      hackState: createEmptyHackState(),
    });
    expect(outOfRange.issues.map((issue) => issue.code)).toContain(
      "ASSASSINATION_TARGET_OUT_OF_INITIAL_RANGE",
    );
  });
});
