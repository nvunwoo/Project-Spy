import type {
  ArrivalActionView,
  CoordinateView,
} from "@/shared/contracts/player-projection";

export type PrimaryAction = "MOVE" | "WAIT" | "INTERROGATE" | "PURGE";

export interface ComposerDraft {
  readonly agentId: string;
  readonly primaryAction: PrimaryAction;
  readonly origin: CoordinateView;
  readonly destination: CoordinateView;
  readonly path: readonly CoordinateView[];
  readonly arrivalAction?: ArrivalActionView;
  readonly targetAgentId?: string;
  readonly hackFacilityId?: string;
}

export type ComposerState =
  | { readonly type: "idle" }
  | {
      readonly type: "primary";
      readonly agentId: string;
      readonly origin: CoordinateView;
    }
  | {
      readonly type: "reachable";
      readonly agentId: string;
      readonly origin: CoordinateView;
    }
  | {
      readonly type: "arrival";
      readonly agentId: string;
      readonly origin: CoordinateView;
      readonly destination: CoordinateView;
      readonly path: readonly CoordinateView[];
    }
  | {
      readonly type: "assassination-target";
      readonly agentId: string;
      readonly origin: CoordinateView;
      readonly destination: CoordinateView;
      readonly path: readonly CoordinateView[];
    }
  | {
      readonly type: "purge-confirm";
      readonly agentId: string;
      readonly origin: CoordinateView;
    }
  | { readonly type: "complete"; readonly draft: ComposerDraft };

export type ComposerEvent =
  | {
      readonly type: "SELECT_AGENT";
      readonly agentId: string;
      readonly origin: CoordinateView;
    }
  | { readonly type: "CHOOSE_MOVE" }
  | {
      readonly type: "CHOOSE_IMMEDIATE";
      readonly action: "WAIT" | "INTERROGATE";
    }
  | { readonly type: "REQUEST_PURGE" }
  | { readonly type: "CONFIRM_PURGE" }
  | {
      readonly type: "SELECT_DESTINATION";
      readonly destination: CoordinateView;
      readonly path: readonly CoordinateView[];
    }
  | {
      readonly type: "CHOOSE_ARRIVAL";
      readonly action: "MOVE_ONLY" | "INVESTIGATE";
    }
  | {
      readonly type: "CHOOSE_ARRIVAL";
      readonly action: "HACK";
      readonly facilityId: string;
    }
  | { readonly type: "REQUEST_ASSASSINATION" }
  | {
      readonly type: "SELECT_ASSASSINATION_TARGET";
      readonly targetAgentId: string;
    }
  | { readonly type: "BACK" }
  | { readonly type: "RESET" };

export const initialComposerState: ComposerState = { type: "idle" };

export function commandComposerReducer(
  state: ComposerState,
  event: ComposerEvent,
): ComposerState {
  if (event.type === "RESET") {
    return initialComposerState;
  }

  if (event.type === "SELECT_AGENT") {
    return {
      type: "primary",
      agentId: event.agentId,
      origin: event.origin,
    };
  }

  switch (state.type) {
    case "idle":
      return state;
    case "primary":
      if (event.type === "CHOOSE_MOVE") {
        return {
          type: "reachable",
          agentId: state.agentId,
          origin: state.origin,
        };
      }
      if (event.type === "CHOOSE_IMMEDIATE") {
        return {
          type: "complete",
          draft: {
            agentId: state.agentId,
            primaryAction: event.action,
            origin: state.origin,
            destination: state.origin,
            path: [],
          },
        };
      }
      if (event.type === "REQUEST_PURGE") {
        return {
          type: "purge-confirm",
          agentId: state.agentId,
          origin: state.origin,
        };
      }
      if (event.type === "BACK") {
        return initialComposerState;
      }
      return state;
    case "reachable":
      if (event.type === "SELECT_DESTINATION") {
        return {
          type: "arrival",
          agentId: state.agentId,
          origin: state.origin,
          destination: event.destination,
          path: event.path,
        };
      }
      if (event.type === "BACK") {
        return {
          type: "primary",
          agentId: state.agentId,
          origin: state.origin,
        };
      }
      return state;
    case "arrival":
      if (event.type === "CHOOSE_ARRIVAL") {
        return {
          type: "complete",
          draft: {
            agentId: state.agentId,
            primaryAction: "MOVE",
            origin: state.origin,
            destination: state.destination,
            path: state.path,
            arrivalAction: event.action,
            ...(event.action === "HACK"
              ? { hackFacilityId: event.facilityId }
              : {}),
          },
        };
      }
      if (event.type === "REQUEST_ASSASSINATION") {
        return { ...state, type: "assassination-target" };
      }
      if (event.type === "BACK") {
        return {
          type: "reachable",
          agentId: state.agentId,
          origin: state.origin,
        };
      }
      return state;
    case "assassination-target":
      if (event.type === "SELECT_ASSASSINATION_TARGET") {
        return {
          type: "complete",
          draft: {
            agentId: state.agentId,
            primaryAction: "MOVE",
            origin: state.origin,
            destination: state.destination,
            path: state.path,
            arrivalAction: "ASSASSINATE",
            targetAgentId: event.targetAgentId,
          },
        };
      }
      if (event.type === "BACK") {
        return { ...state, type: "arrival" };
      }
      return state;
    case "purge-confirm":
      if (event.type === "CONFIRM_PURGE") {
        return {
          type: "complete",
          draft: {
            agentId: state.agentId,
            primaryAction: "PURGE",
            origin: state.origin,
            destination: state.origin,
            path: [],
          },
        };
      }
      if (event.type === "BACK") {
        return {
          type: "primary",
          agentId: state.agentId,
          origin: state.origin,
        };
      }
      return state;
    case "complete":
      return state;
  }
}
