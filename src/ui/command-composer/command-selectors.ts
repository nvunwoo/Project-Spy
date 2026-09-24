import type { ComposerDraft, ComposerState } from "./command-reducer";

const actionCost = {
  MOVE_ONLY: 0,
  INVESTIGATE: 1_000,
  ASSASSINATE: 2_000,
  HACK: 2_000,
} as const;

export function getComposerStep(state: ComposerState): string {
  switch (state.type) {
    case "primary":
    case "purge-confirm":
      return "1 / 3 · 명령";
    case "reachable":
      return "2 / 3 · 경로";
    case "arrival":
    case "assassination-target":
      return "3 / 3 · 공작";
    case "complete":
      return "초안 완료";
    case "idle":
      return "요원 선택";
  }
}

export function getDraftCost(draft: ComposerDraft): number {
  if (draft.primaryAction === "WAIT") return 0;
  if (draft.primaryAction === "INTERROGATE") return 1_000;
  if (draft.primaryAction === "PURGE") return 2_000;
  return (
    draft.path.length * 200 +
    (draft.arrivalAction ? actionCost[draft.arrivalAction] : 0)
  );
}
