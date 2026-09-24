import type { AgentState, Coordinate, Team } from "@/domain/model/game-types";
import { toCellId } from "@/domain/map/coordinates";
import { getOperationSuccessRate } from "@/domain/orders/order-rules";
import type { GeneralOrder } from "@/domain/orders/order-types";
import { createRng, rollPercent } from "@/domain/rng/deterministic-rng";

export type MovementResultReason =
  "FORCED_FAILURE" | "CHANCE_FAILURE" | "DESTINATION_FULL" | "ARRIVED";

export interface MovementResult {
  readonly agentId: string;
  readonly from: Coordinate;
  readonly intendedDestination: Coordinate;
  readonly finalCoordinate: Coordinate;
  readonly success: boolean;
  readonly reason: MovementResultReason;
}

interface MovementCandidate {
  readonly agent: AgentState;
  readonly destination: Coordinate;
}

function compareStableId(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export interface ResolveMovementResult {
  readonly agents: readonly AgentState[];
  readonly results: readonly MovementResult[];
  readonly cancelledArrivalActions: ReadonlySet<string>;
}

/**
 * Resolves only v0.6 movement stage semantics. The caller must validate paths
 * and commit costs before invoking this function.
 */
export function resolveMovement(input: {
  readonly agents: readonly AgentState[];
  readonly orders: readonly GeneralOrder[];
  readonly forcedMoveFailureAgentIds: ReadonlySet<string>;
  readonly loyaltyPenaltyTeams: ReadonlySet<Team>;
  readonly rngSeed: string;
}): ResolveMovementResult {
  const agentsById = new Map(input.agents.map((agent) => [agent.id, agent]));
  const movingOrders = input.orders
    .filter(
      (order): order is Extract<GeneralOrder, { readonly kind: "OPERATE" }> =>
        order.kind === "OPERATE" && order.path.length > 0,
    )
    .sort((left, right) => compareStableId(left.agentId, right.agentId));

  const successRng = createRng({
    seed: input.rngSeed,
    namespace: "ACTION_SUCCESS",
  });
  const movementOrderRng = createRng({
    seed: input.rngSeed,
    namespace: "MOVEMENT_ORDER",
  });
  const results: MovementResult[] = [];
  const cancelledArrivalActions = new Set<string>();
  const successfulCandidates: MovementCandidate[] = [];

  for (const order of movingOrders) {
    const agent = agentsById.get(order.agentId);
    if (!agent || agent.status !== "ACTIVE" || !agent.canAct) {
      throw new Error(
        `resolveMovement requires a validated active agent for ${order.agentId}.`,
      );
    }
    const destination = order.path.at(-1);
    if (!destination) {
      throw new Error("A moving order must include a destination step.");
    }

    if (input.forcedMoveFailureAgentIds.has(agent.id)) {
      cancelledArrivalActions.add(agent.id);
      results.push({
        agentId: agent.id,
        from: agent.coordinate,
        intendedDestination: destination,
        finalCoordinate: agent.coordinate,
        success: false,
        reason: "FORCED_FAILURE",
      });
      continue;
    }

    const successRate = getOperationSuccessRate({
      role: agent.role,
      operation: "MOVE",
      loyaltyPenaltyActive: input.loyaltyPenaltyTeams.has(agent.nominalTeam),
    });
    if (!rollPercent(successRng, successRate)) {
      cancelledArrivalActions.add(agent.id);
      results.push({
        agentId: agent.id,
        from: agent.coordinate,
        intendedDestination: destination,
        finalCoordinate: agent.coordinate,
        success: false,
        reason: "CHANCE_FAILURE",
      });
      continue;
    }

    successfulCandidates.push({ agent, destination });
  }

  const occupancy = new Map<number, number>();
  for (const agent of input.agents) {
    if (agent.status === "ACTIVE") {
      const id = toCellId(agent.coordinate);
      occupancy.set(id, (occupancy.get(id) ?? 0) + 1);
    }
  }

  const resolvedCoordinates = new Map(
    input.agents.map((agent) => [agent.id, agent.coordinate]),
  );
  const executionOrder = movementOrderRng.shuffle(successfulCandidates);
  for (const candidate of executionOrder) {
    const from =
      resolvedCoordinates.get(candidate.agent.id) ?? candidate.agent.coordinate;
    const fromId = toCellId(from);
    const destinationId = toCellId(candidate.destination);
    const destinationOccupancy = occupancy.get(destinationId) ?? 0;

    if (destinationOccupancy >= 4) {
      cancelledArrivalActions.add(candidate.agent.id);
      results.push({
        agentId: candidate.agent.id,
        from,
        intendedDestination: candidate.destination,
        finalCoordinate: from,
        success: false,
        reason: "DESTINATION_FULL",
      });
      continue;
    }

    occupancy.set(fromId, (occupancy.get(fromId) ?? 1) - 1);
    occupancy.set(destinationId, destinationOccupancy + 1);
    resolvedCoordinates.set(candidate.agent.id, candidate.destination);
    results.push({
      agentId: candidate.agent.id,
      from,
      intendedDestination: candidate.destination,
      finalCoordinate: candidate.destination,
      success: true,
      reason: "ARRIVED",
    });
  }

  return {
    agents: input.agents.map((agent) => ({
      ...agent,
      coordinate: resolvedCoordinates.get(agent.id) ?? agent.coordinate,
    })),
    results,
    cancelledArrivalActions,
  };
}
