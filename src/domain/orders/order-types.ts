import type { Coordinate, Team } from "@/domain/model/game-types";

export type ArrivalAction =
  | { readonly kind: "MOVE_ONLY" }
  | { readonly kind: "INVESTIGATE" }
  | {
      readonly kind: "HACK";
      readonly facilityId: string;
    }
  | {
      readonly kind: "ASSASSINATE";
      readonly targetAgentId: string;
    };

export type GeneralOrder =
  | {
      readonly kind: "WAIT";
      readonly agentId: string;
    }
  | {
      readonly kind: "INTERROGATE";
      readonly agentId: string;
    }
  | {
      readonly kind: "PURGE";
      readonly agentId: string;
    }
  | {
      readonly kind: "OPERATE";
      readonly agentId: string;
      /** Destination steps only. The origin is deliberately excluded. */
      readonly path: readonly Coordinate[];
      readonly arrivalAction: ArrivalAction;
    };

export type MoleOrder =
  | { readonly kind: "ACQUIESCE"; readonly moleAgentId: string }
  | { readonly kind: "FORCE_MOVE_FAILURE"; readonly moleAgentId: string }
  | { readonly kind: "FORCE_OPERATION_FAILURE"; readonly moleAgentId: string }
  | {
      readonly kind: "ASSASSINATE_COLLEAGUE";
      readonly moleAgentId: string;
      readonly targetAgentId: string;
    };

export interface Economy {
  readonly allocation: number;
  readonly bank: number;
}

export interface TeamHackProgress {
  readonly bankSucceeded: boolean;
  readonly communicationsSucceeded: boolean;
}

export interface HackState {
  readonly disabledFacilityIds: ReadonlySet<string>;
  readonly teamProgress: Readonly<Record<Team, TeamHackProgress>>;
}
