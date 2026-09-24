import type { AgentState, Coordinate, Team } from "@/domain/model/game-types";
import type { GeneralOrder, MoleOrder } from "@/domain/orders/order-types";
import type { ResolveLocalTurnResult } from "@/domain/resolve-turn/resolve-turn";

export type ExecutionCueKind =
  | "MOVE"
  | "MOVE_FAILURE"
  | "WAIT"
  | "INTERROGATE"
  | "PURGE"
  | "HACK"
  | "INVESTIGATE"
  | "ASSASSINATE"
  | "MOLE_ASSASSINATION"
  | "REMOVAL";

export interface ExecutionCue {
  readonly id: string;
  readonly agentId: string;
  readonly kind: ExecutionCueKind;
  readonly label: string;
  readonly succeeded: boolean;
  readonly from: Coordinate;
  readonly path: readonly Coordinate[];
}

export interface ExecutionBeat {
  readonly id: string;
  readonly durationMs: number;
  readonly cues: readonly ExecutionCue[];
}

function operationSucceeded(input: {
  readonly result: ResolveLocalTurnResult;
  readonly viewer: Team;
  readonly role: AgentState["role"];
  readonly operation: "해킹" | "조사" | "암살";
}): boolean {
  return (
    input.result.reports[input.viewer]
      .find(
        (report) =>
          report.message.startsWith(`요원 ${input.role} `) &&
          report.message.includes(input.operation) &&
          (report.message.endsWith("성공") || report.message.endsWith("실패")),
      )
      ?.message.endsWith("성공") ?? false
  );
}

function pushBeat(
  beats: ExecutionBeat[],
  id: string,
  durationMs: number,
  cues: readonly ExecutionCue[],
): void {
  if (cues.length > 0) beats.push({ id, durationMs, cues });
}

/**
 * Builds only the viewer-authorized playback slice. Canonical hidden opponent
 * activity is never copied into browser animation cues.
 */
export function buildExecutionPlayback(input: {
  readonly beforeState: {
    readonly agents: readonly AgentState[];
  };
  readonly viewer: Team;
  readonly generalOrders: readonly GeneralOrder[];
  readonly moleOrder?: MoleOrder;
  readonly result: ResolveLocalTurnResult;
}): readonly ExecutionBeat[] {
  const agentsById = new Map(
    input.beforeState.agents.map((agent) => [agent.id, agent]),
  );
  const beats: ExecutionBeat[] = [];
  const immediate: ExecutionCue[] = [];
  const movement: ExecutionCue[] = [];
  const operations: ExecutionCue[] = [];

  for (const order of input.generalOrders) {
    const agent = agentsById.get(order.agentId);
    if (!agent || agent.nominalTeam !== input.viewer) continue;
    if (order.kind !== "OPERATE") {
      const labels = {
        WAIT: "대기",
        INTERROGATE: "심문 수행",
        PURGE: "숙청 수행",
      } as const;
      immediate.push({
        id: `${order.agentId}:${order.kind}`,
        agentId: order.agentId,
        kind: order.kind,
        label: labels[order.kind],
        succeeded: true,
        from: agent.coordinate,
        path: [],
      });
      continue;
    }

    const movementResult = input.result.movementResults.find(
      (entry) => entry.agentId === order.agentId,
    );
    const moved = order.path.length === 0 || movementResult?.success === true;
    if (order.path.length > 0) {
      movement.push({
        id: `${order.agentId}:MOVE`,
        agentId: order.agentId,
        kind: moved ? "MOVE" : "MOVE_FAILURE",
        label: moved ? "이동 성공" : "이동 실패",
        succeeded: moved,
        from: agent.coordinate,
        path: order.path,
      });
    }
    if (!moved || order.arrivalAction.kind === "MOVE_ONLY") continue;

    const operationName = {
      HACK: "해킹",
      INVESTIGATE: "조사",
      ASSASSINATE: "암살",
    } as const;
    const operation = operationName[order.arrivalAction.kind];
    const succeeded = operationSucceeded({
      result: input.result,
      viewer: input.viewer,
      role: agent.role,
      operation,
    });
    operations.push({
      id: `${order.agentId}:${order.arrivalAction.kind}`,
      agentId: order.agentId,
      kind: order.arrivalAction.kind,
      label: `${operation} ${succeeded ? "성공" : "실패"}`,
      succeeded,
      from: order.path.at(-1) ?? agent.coordinate,
      path: [],
    });
  }

  pushBeat(beats, "IMMEDIATE", 700, immediate);
  pushBeat(beats, "MOVEMENT", 1_400, movement);
  pushBeat(beats, "OPERATIONS", 1_000, operations);

  const moleOrder = input.moleOrder;
  if (moleOrder && agentsById.has(moleOrder.moleAgentId)) {
    const mole = agentsById.get(moleOrder.moleAgentId)!;
    const removed =
      moleOrder.kind === "ASSASSINATE_COLLEAGUE" &&
      input.result.removals.some(
        (entry) => entry.agentId === moleOrder.targetAgentId,
      );
    const moleLabel = {
      ACQUIESCE: "배신자 명령 묵인",
      FORCE_MOVE_FAILURE: "이동 방해 수행",
      FORCE_OPERATION_FAILURE: "공작 방해 수행",
      ASSASSINATE_COLLEAGUE: `동료 암살 ${removed ? "성공" : "실패"}`,
    }[moleOrder.kind];
    pushBeat(beats, "MOLE_ACTION", 1_000, [
      {
        id: `${mole.id}:${moleOrder.kind}`,
        agentId: mole.id,
        kind:
          moleOrder.kind === "ASSASSINATE_COLLEAGUE"
            ? "MOLE_ASSASSINATION"
            : "WAIT",
        label: moleLabel,
        succeeded: moleOrder.kind === "ASSASSINATE_COLLEAGUE" ? removed : true,
        from: mole.coordinate,
        path: [],
      },
    ]);
  }

  const controlledMoleId = input.beforeState.agents.find(
    (agent) => agent.moleController === input.viewer,
  )?.id;
  const visibleRemovals = input.result.removals.flatMap((removal) => {
    const agent = agentsById.get(removal.agentId);
    if (
      !agent ||
      (agent.nominalTeam !== input.viewer && agent.id !== controlledMoleId)
    ) {
      return [];
    }
    return [
      {
        id: `${agent.id}:REMOVAL`,
        agentId: agent.id,
        kind: "REMOVAL" as const,
        label: removal.cause.startsWith("PURGE") ? "숙청됨" : "암살당함",
        succeeded: false,
        from: agent.coordinate,
        path: [],
      },
    ];
  });
  pushBeat(beats, "REMOVALS", 900, visibleRemovals);

  if (beats.length === 0) {
    beats.push({ id: "NO_VISIBLE_ACTION", durationMs: 600, cues: [] });
  }
  return beats;
}
