import type {
  AgentRole,
  AgentState,
  Objective,
  ObjectiveKind,
  Team,
} from "@/domain/model/game-types";
import type { MapManifest } from "@/domain/map/map-manifest";
import type { Economy, HackState } from "@/domain/orders/order-types";
import type { Outcome } from "@/domain/resolve-turn/evaluate-outcome";

export interface ReinforcementOrder {
  readonly agentId: string;
  readonly team: Team;
  readonly role: AgentRole;
  readonly dueTurn: number;
  /** A removed mole is bought again one turn after its replacement arrives. */
  readonly moleController?: Team;
  readonly moleRebuyTurn?: number;
}

export interface PendingMoleRebuy {
  readonly team: Team;
  readonly controller: Team;
  readonly dueTurn: number;
}

export interface LocalTurnState {
  readonly fixtureVersion: "local-turn.phase0b.4";
  readonly seed: string;
  readonly turnNumber: number;
  readonly map: MapManifest;
  readonly agents: readonly AgentState[];
  readonly objectives: readonly Objective[];
  readonly economies: Readonly<Record<Team, Economy>>;
  readonly hackState: HackState;
  readonly deliveredObjectives: Readonly<
    Record<Team, readonly ObjectiveKind[]>
  >;
  /** Remaining affected turns, including the currently open turn. */
  readonly loyaltyPenaltyTurns: Readonly<Record<Team, number>>;
  /** Remaining $2,000-allocation turns, including the currently open turn. */
  readonly allocationPenaltyTurns: Readonly<Record<Team, number>>;
  /** Remaining turns for which this team sees the opponent's general orders. */
  readonly communicationsInterceptTurns: Readonly<Record<Team, number>>;
  readonly visibleEnemyAgentIdsByViewer: Readonly<
    Record<Team, ReadonlySet<string>>
  >;
  readonly reinforcements: readonly ReinforcementOrder[];
  readonly pendingMoleRebuys: readonly PendingMoleRebuy[];
  readonly outcome: Outcome;
}

export type TurnStage =
  | "COST"
  | "INTERROGATION_PURGE"
  | "MOVEMENT"
  | "OBJECTIVE_PICKUP"
  | "HACK_INVESTIGATE"
  | "ASSASSINATION"
  | "DELIVERY"
  | "SETTLEMENT"
  | "DETECTION"
  | "REINFORCEMENT"
  | "OUTCOME";

export interface TeamReportEntry {
  readonly id: string;
  readonly stage: TurnStage;
  readonly tone: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL";
  readonly message: string;
}

export interface RemovalRecord {
  readonly agentId: string;
  readonly team: Team;
  readonly role: AgentRole;
  readonly cause: "PURGE_MOLE" | "PURGE_LOYAL" | "ASSASSINATION";
  readonly turnNumber: number;
}
