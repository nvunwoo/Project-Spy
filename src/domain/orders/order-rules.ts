import type { AgentRole, AgentState, Team } from "@/domain/model/game-types";
import { isWithin3x3 } from "@/domain/map/coordinates";
import { getMapCell, type MapManifest } from "@/domain/map/map-manifest";
import { validatePath } from "@/domain/map/pathfinding";
import type {
  Economy,
  GeneralOrder,
  HackState,
  MoleOrder,
} from "@/domain/orders/order-types";

export const ORDER_COST = {
  MOVE_PER_CELL: 200,
  HACK: 2_000,
  ASSASSINATE: 2_000,
  INVESTIGATE: 1_000,
  WAIT: 0,
  INTERROGATE: 1_000,
  PURGE: 2_000,
  MOLE_COLLEAGUE_ASSASSINATION: 2_500,
} as const;

export const MOLE_COLLEAGUE_ASSASSINATION_UNLOCK_TURN = 6;

export function isMoleColleagueAssassinationUnlocked(
  turnNumber: number,
): boolean {
  return turnNumber >= MOLE_COLLEAGUE_ASSASSINATION_UNLOCK_TURN;
}

export type ProbabilisticOperation =
  "MOVE" | "HACK" | "ASSASSINATE" | "INVESTIGATE";

export function normalizeGeneralOrder(order: GeneralOrder): GeneralOrder {
  if (
    order.kind === "OPERATE" &&
    order.path.length === 0 &&
    order.arrivalAction.kind === "MOVE_ONLY"
  ) {
    return { kind: "WAIT", agentId: order.agentId };
  }

  return order;
}

export function getGeneralOrderCost(order: GeneralOrder): number {
  const normalized = normalizeGeneralOrder(order);
  switch (normalized.kind) {
    case "WAIT":
      return ORDER_COST.WAIT;
    case "INTERROGATE":
      return ORDER_COST.INTERROGATE;
    case "PURGE":
      return ORDER_COST.PURGE;
    case "OPERATE": {
      const movementCost = normalized.path.length * ORDER_COST.MOVE_PER_CELL;
      switch (normalized.arrivalAction.kind) {
        case "MOVE_ONLY":
          return movementCost;
        case "INVESTIGATE":
          return movementCost + ORDER_COST.INVESTIGATE;
        case "HACK":
          return movementCost + ORDER_COST.HACK;
        case "ASSASSINATE":
          return movementCost + ORDER_COST.ASSASSINATE;
      }
    }
  }
}

export function getMoleOrderCost(order: MoleOrder): number {
  return order.kind === "ASSASSINATE_COLLEAGUE"
    ? ORDER_COST.MOLE_COLLEAGUE_ASSASSINATION
    : 0;
}

export function getOperationSuccessRate(input: {
  readonly role: AgentRole;
  readonly operation: ProbabilisticOperation;
  readonly loyaltyPenaltyActive: boolean;
}): number {
  const specialized =
    (input.role === "K" && input.operation === "ASSASSINATE") ||
    (input.role === "H" && input.operation === "HACK") ||
    (input.role === "D" && input.operation === "INVESTIGATE");
  const baseRate = input.operation === "MOVE" ? 70 : specialized ? 80 : 60;
  return input.loyaltyPenaltyActive ? baseRate - 10 : baseRate;
}

function assertNonNegativeFunds(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a finite, non-negative amount.`);
  }
}

export function getAvailableFunds(economy: Economy): number {
  assertNonNegativeFunds(economy.allocation, "Allocation");
  assertNonNegativeFunds(economy.bank, "Bank balance");
  return economy.allocation + economy.bank;
}

export type SpendFundsResult =
  | {
      readonly ok: true;
      readonly economy: Economy;
      readonly spentFromAllocation: number;
      readonly spentFromBank: number;
    }
  | {
      readonly ok: false;
      readonly reason: "INSUFFICIENT_FUNDS";
      readonly shortfall: number;
    };

export function spendFunds(economy: Economy, cost: number): SpendFundsResult {
  assertNonNegativeFunds(cost, "Cost");
  const available = getAvailableFunds(economy);
  if (cost > available) {
    return {
      ok: false,
      reason: "INSUFFICIENT_FUNDS",
      shortfall: cost - available,
    };
  }

  const spentFromAllocation = Math.min(economy.allocation, cost);
  const spentFromBank = cost - spentFromAllocation;
  return {
    ok: true,
    economy: {
      allocation: economy.allocation - spentFromAllocation,
      bank: economy.bank - spentFromBank,
    },
    spentFromAllocation,
    spentFromBank,
  };
}

export function settleUnusedAllocation(economy: Economy): Economy {
  getAvailableFunds(economy);
  return {
    allocation: 0,
    bank: economy.bank + economy.allocation / 2,
  };
}

export type OrderValidationIssueCode =
  | "UNKNOWN_AGENT"
  | "AGENT_NOT_OWNED"
  | "AGENT_CANNOT_ACT"
  | "DUPLICATE_AGENT_ORDER"
  | "MISSING_AGENT_ORDER"
  | "INVALID_PATH"
  | "INVALID_HACK_DESTINATION"
  | "HACK_FACILITY_DISABLED"
  | "HACK_SUCCESS_ALREADY_USED"
  | "BANK_HACK_LIMIT_EXCEEDED"
  | "COMMUNICATIONS_HACK_LIMIT_EXCEEDED"
  | "INVALID_ASSASSINATION_TARGET"
  | "ASSASSINATION_TARGET_NOT_VISIBLE"
  | "ASSASSINATION_TARGET_OUT_OF_INITIAL_RANGE"
  | "PURGE_LIMIT_EXCEEDED"
  | "INSUFFICIENT_FUNDS";

export interface OrderValidationIssue {
  readonly code: OrderValidationIssueCode;
  readonly agentId?: string;
  readonly detail?: string;
}

export interface GeneralOrderSetValidation {
  readonly ok: boolean;
  readonly totalCost: number;
  readonly normalizedOrders: readonly GeneralOrder[];
  readonly issues: readonly OrderValidationIssue[];
}

export function createEmptyHackState(): HackState {
  return {
    disabledFacilityIds: new Set<string>(),
    teamProgress: {
      RED: { bankSucceeded: false, communicationsSucceeded: false },
      BLUE: { bankSucceeded: false, communicationsSucceeded: false },
    },
  };
}

export function validateGeneralOrderSet(input: {
  readonly team: Team;
  readonly agents: readonly AgentState[];
  readonly orders: readonly GeneralOrder[];
  readonly manifest: MapManifest;
  readonly economy: Economy;
  readonly visibleEnemyAgentIds: ReadonlySet<string>;
  readonly hackState: HackState;
}): GeneralOrderSetValidation {
  const normalizedOrders = input.orders.map(normalizeGeneralOrder);
  const issues: OrderValidationIssue[] = [];
  const agentsById = new Map(input.agents.map((agent) => [agent.id, agent]));
  const orderedAgentIds = new Set<string>();
  let purgeCount = 0;
  let bankHackCount = 0;
  let communicationsHackCount = 0;

  for (const order of normalizedOrders) {
    const agent = agentsById.get(order.agentId);
    if (!agent) {
      issues.push({ code: "UNKNOWN_AGENT", agentId: order.agentId });
      continue;
    }
    if (agent.nominalTeam !== input.team) {
      issues.push({ code: "AGENT_NOT_OWNED", agentId: order.agentId });
    }
    if (agent.status !== "ACTIVE" || !agent.canAct) {
      issues.push({ code: "AGENT_CANNOT_ACT", agentId: order.agentId });
    }
    if (orderedAgentIds.has(order.agentId)) {
      issues.push({ code: "DUPLICATE_AGENT_ORDER", agentId: order.agentId });
    }
    orderedAgentIds.add(order.agentId);

    if (order.kind === "PURGE") {
      purgeCount += 1;
      continue;
    }
    if (order.kind !== "OPERATE") {
      continue;
    }

    const pathResult = validatePath({
      manifest: input.manifest,
      origin: agent.coordinate,
      path: order.path,
      role: agent.role,
    });
    if (!pathResult.ok) {
      issues.push({
        code: "INVALID_PATH",
        agentId: order.agentId,
        detail: pathResult.issues.join(","),
      });
      continue;
    }

    if (order.arrivalAction.kind === "HACK") {
      const destination = getMapCell(input.manifest, pathResult.destination);
      if (
        destination.facilityId !== order.arrivalAction.facilityId ||
        (destination.facilityKind !== "BANK" &&
          destination.facilityKind !== "COMMUNICATIONS")
      ) {
        issues.push({
          code: "INVALID_HACK_DESTINATION",
          agentId: order.agentId,
        });
        continue;
      }

      if (input.hackState.disabledFacilityIds.has(destination.facilityId)) {
        issues.push({
          code: "HACK_FACILITY_DISABLED",
          agentId: order.agentId,
        });
      }

      if (destination.facilityKind === "BANK") {
        bankHackCount += 1;
        if (input.hackState.teamProgress[input.team].bankSucceeded) {
          issues.push({
            code: "HACK_SUCCESS_ALREADY_USED",
            agentId: order.agentId,
            detail: "BANK",
          });
        }
      } else {
        communicationsHackCount += 1;
        if (input.hackState.teamProgress[input.team].communicationsSucceeded) {
          issues.push({
            code: "HACK_SUCCESS_ALREADY_USED",
            agentId: order.agentId,
            detail: "COMMUNICATIONS",
          });
        }
      }
    }

    if (order.arrivalAction.kind === "ASSASSINATE") {
      const target = agentsById.get(order.arrivalAction.targetAgentId);
      if (
        !target ||
        target.nominalTeam === input.team ||
        target.status !== "ACTIVE"
      ) {
        issues.push({
          code: "INVALID_ASSASSINATION_TARGET",
          agentId: order.agentId,
        });
        continue;
      }

      if (!input.visibleEnemyAgentIds.has(target.id)) {
        issues.push({
          code: "ASSASSINATION_TARGET_NOT_VISIBLE",
          agentId: order.agentId,
        });
      }
      if (!isWithin3x3(agent.coordinate, target.coordinate)) {
        issues.push({
          code: "ASSASSINATION_TARGET_OUT_OF_INITIAL_RANGE",
          agentId: order.agentId,
        });
      }
    }
  }

  const activeOwnAgents = input.agents.filter(
    (agent) =>
      agent.nominalTeam === input.team &&
      agent.status === "ACTIVE" &&
      agent.canAct,
  );
  for (const agent of activeOwnAgents) {
    if (!orderedAgentIds.has(agent.id)) {
      issues.push({ code: "MISSING_AGENT_ORDER", agentId: agent.id });
    }
  }

  if (purgeCount > 1) {
    issues.push({ code: "PURGE_LIMIT_EXCEEDED" });
  }
  if (bankHackCount > 1) {
    issues.push({ code: "BANK_HACK_LIMIT_EXCEEDED" });
  }
  if (communicationsHackCount > 1) {
    issues.push({ code: "COMMUNICATIONS_HACK_LIMIT_EXCEEDED" });
  }

  const totalCost = normalizedOrders.reduce(
    (total, order) => total + getGeneralOrderCost(order),
    0,
  );
  const available = getAvailableFunds(input.economy);
  if (totalCost > available) {
    issues.push({
      code: "INSUFFICIENT_FUNDS",
      detail: String(totalCost - available),
    });
  }

  return {
    ok: issues.length === 0,
    totalCost,
    normalizedOrders,
    issues,
  };
}
