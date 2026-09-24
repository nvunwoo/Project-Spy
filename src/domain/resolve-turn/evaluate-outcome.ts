import type { ObjectiveKind, Team } from "@/domain/model/game-types";

export type Outcome =
  | { readonly kind: "ONGOING" }
  | { readonly kind: "WIN"; readonly winner: Team }
  | { readonly kind: "DRAW" };

function isValidObjectiveForTeam(
  team: Team,
  objective: ObjectiveKind,
): boolean {
  if (objective === "BLUEPRINT" || objective === "SCIENTIST") {
    return true;
  }
  return team === "RED"
    ? objective === "BLUE_ROSTER"
    : objective === "RED_ROSTER";
}

function deliveredCount(
  team: Team,
  beforeTurn: ReadonlySet<ObjectiveKind>,
  thisResolution: ReadonlySet<ObjectiveKind>,
): number {
  const combined = new Set([...beforeTurn, ...thisResolution]);
  return [...combined].filter((objective) =>
    isValidObjectiveForTeam(team, objective),
  ).length;
}

export function evaluateOutcome(input: {
  readonly deliveredBeforeTurn: Readonly<
    Record<Team, ReadonlySet<ObjectiveKind>>
  >;
  readonly deliveredThisResolution: Readonly<
    Record<Team, ReadonlySet<ObjectiveKind>>
  >;
}): Outcome {
  const redBefore = deliveredCount(
    "RED",
    input.deliveredBeforeTurn.RED,
    new Set<ObjectiveKind>(),
  );
  const blueBefore = deliveredCount(
    "BLUE",
    input.deliveredBeforeTurn.BLUE,
    new Set<ObjectiveKind>(),
  );
  const redAfter = deliveredCount(
    "RED",
    input.deliveredBeforeTurn.RED,
    input.deliveredThisResolution.RED,
  );
  const blueAfter = deliveredCount(
    "BLUE",
    input.deliveredBeforeTurn.BLUE,
    input.deliveredThisResolution.BLUE,
  );

  const redReachedThisResolution = redBefore < 2 && redAfter >= 2;
  const blueReachedThisResolution = blueBefore < 2 && blueAfter >= 2;
  if (redReachedThisResolution && blueReachedThisResolution) {
    return { kind: "DRAW" };
  }
  if (redAfter >= 2 && blueAfter < 2) {
    return { kind: "WIN", winner: "RED" };
  }
  if (blueAfter >= 2 && redAfter < 2) {
    return { kind: "WIN", winner: "BLUE" };
  }

  // A canonical state should already be terminal if both sides had two goals
  // before this Resolve. Treat that impossible live-state input as a draw so
  // resolution never invents an execution-order winner.
  if (redAfter >= 2 && blueAfter >= 2) {
    return { kind: "DRAW" };
  }
  return { kind: "ONGOING" };
}
