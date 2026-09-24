export type SelectionIntent =
  | { readonly kind: "AGENT"; readonly logicalId: string }
  | { readonly kind: "CELL"; readonly row: number; readonly col: number }
  | { readonly kind: "RESET_VIEW" };

export type MapCameraCommandKind =
  | "RESET"
  | "ZOOM_IN"
  | "ZOOM_OUT"
  | "PAN_NORTH"
  | "PAN_SOUTH"
  | "PAN_WEST"
  | "PAN_EAST";

export interface MapCameraCommand {
  readonly sequence: number;
  readonly kind: MapCameraCommandKind;
}

export interface MapShortcutInput {
  readonly key: string;
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
}

const shiftedPanByKey: Readonly<Record<string, MapCameraCommandKind>> = {
  ArrowUp: "PAN_NORTH",
  ArrowDown: "PAN_SOUTH",
  ArrowLeft: "PAN_WEST",
  ArrowRight: "PAN_EAST",
};

export function getMapCameraCommandForKey(
  input: MapShortcutInput,
): MapCameraCommandKind | null {
  if (input.altKey || input.ctrlKey || input.metaKey) return null;
  if (input.key.toLowerCase() === "r" && !input.shiftKey) return "RESET";
  if (input.key === "+" || input.key === "=") return "ZOOM_IN";
  if (input.key === "-" || input.key === "_") return "ZOOM_OUT";
  if (!input.shiftKey) return null;
  return shiftedPanByKey[input.key] ?? null;
}

export interface PointerSample {
  readonly clientX: number;
  readonly clientY: number;
  readonly timeStamp: number;
}

export const TAP_MAX_DISTANCE_PX = 10;
export const TAP_MAX_DURATION_MS = 350;

export function isPrimarySelectionButton(button: number): boolean {
  return button === 0;
}

export function isTapGesture(
  start: PointerSample | undefined,
  end: PointerSample,
  maxExcursionPx?: number,
): boolean {
  if (!start) return false;
  const endDistance = Math.hypot(
    end.clientX - start.clientX,
    end.clientY - start.clientY,
  );
  const distance = Math.max(endDistance, maxExcursionPx ?? endDistance);
  const duration = end.timeStamp - start.timeStamp;
  return (
    distance <= TAP_MAX_DISTANCE_PX &&
    duration >= 0 &&
    duration <= TAP_MAX_DURATION_MS
  );
}
