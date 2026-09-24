export type TimedLocalPlayPhase = "GENERAL" | "MOLE" | "RESULTS";

export const LOCAL_PHASE_DURATION_SECONDS: Readonly<
  Record<TimedLocalPlayPhase, number>
> = {
  GENERAL: 50,
  MOLE: 10,
  RESULTS: 5,
};

export interface LocalPhaseDeadline {
  readonly phase: TimedLocalPlayPhase;
  readonly deadlineAtMs: number;
}

export function createLocalPhaseDeadline(
  phase: TimedLocalPlayPhase,
  nowMs: number,
): LocalPhaseDeadline {
  if (!Number.isFinite(nowMs)) {
    throw new Error(
      "A local phase deadline requires a finite wall-clock value.",
    );
  }
  return {
    phase,
    deadlineAtMs: nowMs + LOCAL_PHASE_DURATION_SECONDS[phase] * 1_000,
  };
}

export function getLocalPhaseRemainingSeconds(
  deadline: LocalPhaseDeadline | null,
  nowMs: number,
): number {
  if (!deadline) return 0;
  const remaining = Math.ceil((deadline.deadlineAtMs - nowMs) / 1_000);
  return Math.max(
    0,
    Math.min(LOCAL_PHASE_DURATION_SECONDS[deadline.phase], remaining),
  );
}
