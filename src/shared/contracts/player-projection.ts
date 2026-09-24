export type TeamView = "BLUE" | "RED";
export type AgentRoleView = "K" | "H" | "D";

export interface CoordinateView {
  readonly row: number;
  readonly col: number;
}

export type MapBuildingKindView =
  | "GENERAL"
  | "RED_EMBASSY"
  | "BLUE_EMBASSY"
  | "POWER_PLANT"
  | "LABORATORY"
  | "UNIVERSITY"
  | "GOVERNMENT_OFFICE"
  | "BROADCAST_STATION"
  | "FACTORY"
  | "MILITARY_BASE"
  | "AIRPORT"
  | "PORT"
  | "BANK"
  | "COMMUNICATIONS"
  | "HOTEL"
  | "SUBWAY";

/** Public map geometry only. Canonical block metadata stays out of the client. */
export interface MapBuildingView {
  readonly id: string;
  readonly coordinate: CoordinateView;
  readonly footprint: 1 | 2;
  readonly kind: MapBuildingKindView;
  readonly label: string | null;
  readonly labelVisibility: "ALWAYS" | "DISCOVER" | "NONE";
}

export type ArrivalActionView =
  "MOVE_ONLY" | "INVESTIGATE" | "ASSASSINATE" | "HACK";

export interface AgentDraftView {
  readonly agentId: string;
  readonly origin: CoordinateView;
  readonly destination: CoordinateView;
  readonly path: readonly CoordinateView[];
  readonly primaryAction: "MOVE" | "WAIT" | "INTERROGATE" | "PURGE";
  readonly arrivalAction?: ArrivalActionView;
  readonly targetAgentId?: string;
  readonly hackFacilityId?: string;
  readonly cost: number;
  readonly savedLabel: string;
}

export interface OwnAgentView {
  readonly id: string;
  readonly callsign: AgentRoleView;
  readonly team: TeamView;
  readonly coordinate: CoordinateView;
  readonly status: "ACTIVE" | "REMOVED" | "REINFORCEMENT_PENDING";
  readonly specialty: string;
  readonly carrying: string | null;
  readonly draft: AgentDraftView | null;
}

export interface VisibleOpponentView {
  readonly id: string;
  readonly label: string;
  readonly team: TeamView;
  readonly coordinate: CoordinateView;
  readonly carryingPublicObjective: boolean;
}

export interface ControlledMoleView {
  readonly id: string;
  readonly callsign: AgentRoleView;
  readonly nominalTeam: TeamView;
  readonly coordinate: CoordinateView;
  readonly status: "ACTIVE" | "REMOVED" | "REINFORCEMENT_PENDING";
  readonly specialty: string;
}

export interface ObjectiveView {
  readonly id: string;
  readonly label: string;
  readonly state: "UNKNOWN" | "LOCATED" | "CARRIED" | "DELIVERED";
}

export interface IntelligenceView {
  readonly id: string;
  readonly label: string;
  readonly tone: "INFO" | "WARNING" | "CRITICAL";
}

export interface FixturePlayerProjection {
  readonly fixture: true;
  readonly team: TeamView;
  readonly turn: number;
  readonly phase: "GENERAL_ORDER_OPEN";
  readonly remainingSeconds: number;
  readonly funds: {
    readonly allocation: number;
    readonly bank: number;
  };
  readonly objectives: readonly ObjectiveView[];
  readonly intelligence: readonly IntelligenceView[];
  readonly buildings: readonly MapBuildingView[];
  readonly agents: readonly OwnAgentView[];
  readonly controlledMole: ControlledMoleView | null;
  readonly visibleOpponents: readonly VisibleOpponentView[];
}
