export const RULES_VERSION = "v0.7" as const;
export const RESOLVER_VERSION = "resolver.phase0b.4" as const;

export type Team = "RED" | "BLUE";
export type AgentRole = "K" | "H" | "D";

export type GameStatus =
  "WAITING" | "SETUP" | "ACTIVE" | "FINISHED" | "CANCELLED";

export type GamePhase =
  | "ROSTER_PLACEMENT_OPEN"
  | "ROSTER_PLACEMENT_RESOLVING"
  | "GENERAL_ORDER_OPEN"
  | "MOLE_ORDER_OPEN"
  | "RESOLVING"
  | "EXECUTING"
  | "RESULTS";

export type AgentStatus = "ACTIVE" | "REMOVED" | "REINFORCEMENT_PENDING";
export type InterrogationMark = "MOLE" | "LOYAL";

export interface Coordinate {
  readonly row: number;
  readonly col: number;
}

export interface AgentState {
  readonly id: string;
  readonly nominalTeam: Team;
  readonly role: AgentRole;
  readonly coordinate: Coordinate;
  readonly status: AgentStatus;
  readonly canAct: boolean;
  readonly moleController?: Team;
  readonly interrogationMark?: InterrogationMark;
  readonly carriedObjectiveId?: string;
}

export type ObjectiveKind =
  "RED_ROSTER" | "BLUE_ROSTER" | "BLUEPRINT" | "SCIENTIST";

export type ObjectiveState =
  | {
      readonly status: "HIDDEN" | "DROPPED";
      readonly coordinate: Coordinate;
    }
  | {
      readonly status: "CARRIED";
      readonly carrierAgentId: string;
    }
  | {
      readonly status: "DELIVERED";
      readonly deliveredBy: Team;
    };

export interface Objective {
  readonly id: string;
  readonly kind: ObjectiveKind;
  readonly state: ObjectiveState;
  readonly scientistExit?: "AIRPORT" | "PORT";
}

export function opposingTeam(team: Team): Team {
  return team === "RED" ? "BLUE" : "RED";
}
