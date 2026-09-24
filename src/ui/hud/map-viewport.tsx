"use client";

import dynamic from "next/dynamic";
import { Crosshair, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";

import { toGridLabel } from "@/presentation-3d/coordinates/logical-to-world";
import {
  getMapCameraCommandForKey,
  type MapCameraCommand,
  type MapCameraCommandKind,
  type SelectionIntent,
} from "@/presentation-3d/input/selection-intent";
import type {
  ControlledMoleView,
  CoordinateView,
  MapBuildingView,
  OwnAgentView,
  VisibleOpponentView,
} from "@/shared/contracts/player-projection";
import type { ExecutionCue } from "@/game-client/fixture/execution-playback";

const CityCanvas = dynamic(
  () => import("@/presentation-3d/canvas/city-canvas"),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading">도시 전술 지도를 준비하고 있습니다…</div>
    ),
  },
);

interface MapViewportProps {
  readonly buildings: readonly MapBuildingView[];
  readonly agents: readonly OwnAgentView[];
  readonly opponents: readonly VisibleOpponentView[];
  readonly controlledMole: ControlledMoleView | null;
  readonly selectedAgentId: string | null;
  readonly reachableCells: readonly CoordinateView[];
  readonly path: readonly CoordinateView[];
  readonly showDestinationControls?: boolean;
  readonly rosterSelection?: {
    readonly selectedFacilityId: string | null;
    readonly candidates: readonly {
      readonly facilityId: string;
      readonly label: string;
      readonly coordinate: CoordinateView;
    }[];
  } | null;
  readonly executionCues?: readonly ExecutionCue[];
  readonly settledExecutionCues?: readonly ExecutionCue[];
  readonly commandOverlay?: {
    readonly coordinate: CoordinateView;
    readonly content: ReactNode;
  } | null;
  readonly onIntent: (intent: SelectionIntent) => void;
  readonly onInteractionChange?: (active: boolean) => void;
}

export function MapViewport({
  buildings,
  agents,
  opponents,
  controlledMole,
  selectedAgentId,
  reachableCells,
  path,
  showDestinationControls = true,
  rosterSelection = null,
  executionCues = [],
  settledExecutionCues = [],
  commandOverlay = null,
  onIntent,
  onInteractionChange,
}: MapViewportProps) {
  const [cameraCommand, setCameraCommand] = useState<MapCameraCommand>({
    sequence: 0,
    kind: "RESET",
  });
  const destinationButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const pathLabels = useMemo(() => path.map(toGridLabel).join(" → "), [path]);

  const issueCameraCommand = useCallback((kind: MapCameraCommandKind) => {
    setCameraCommand((command) => ({
      sequence: command.sequence + 1,
      kind,
    }));
  }, []);

  function resetView() {
    issueCameraCommand("RESET");
    onIntent({ kind: "RESET_VIEW" });
  }

  useEffect(() => {
    function handleMapShortcut(event: KeyboardEvent) {
      if (document.querySelector("dialog[open]")) return;
      const target = event.target;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }

      const command = getMapCameraCommandForKey(event);

      if (!command) return;
      event.preventDefault();
      issueCameraCommand(command);
      if (command === "RESET") {
        onIntent({ kind: "RESET_VIEW" });
      }
    }

    window.addEventListener("keydown", handleMapShortcut);
    return () => window.removeEventListener("keydown", handleMapShortcut);
  }, [issueCameraCommand, onIntent]);

  useEffect(() => {
    if (!onInteractionChange) return;
    const finishInteraction = () => onInteractionChange(false);
    window.addEventListener("pointerup", finishInteraction);
    window.addEventListener("pointercancel", finishInteraction);
    return () => {
      window.removeEventListener("pointerup", finishInteraction);
      window.removeEventListener("pointercancel", finishInteraction);
    };
  }, [onInteractionChange]);

  const moveDestinationFocus = useCallback(
    (event: ReactKeyboardEvent<HTMLButtonElement>, index: number) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }
      const columns = 4;
      const column = index % columns;
      const nextRowIndex = index + columns;
      const nextIndexByKey: Readonly<Record<string, number>> = {
        ArrowLeft: column > 0 ? index - 1 : index,
        ArrowRight:
          column < columns - 1 && index + 1 < reachableCells.length
            ? index + 1
            : index,
        ArrowUp: index >= columns ? index - columns : index,
        ArrowDown: nextRowIndex < reachableCells.length ? nextRowIndex : index,
      };
      const nextIndex = nextIndexByKey[event.key];
      if (nextIndex === undefined) return;
      event.preventDefault();
      destinationButtonRefs.current[nextIndex]?.focus();
    },
    [reachableCells.length],
  );

  return (
    <section className="map-viewport" aria-labelledby="map-heading">
      <header className="map-toolbar">
        <div>
          <h2 id="map-heading">작전 지도</h2>
        </div>
        <div className="map-toolbar__actions">
          <span className="map-north" aria-label="북쪽은 화면 위쪽입니다">
            N
          </span>
          <button
            type="button"
            className="icon-button"
            onClick={resetView}
            aria-label="지도 시점 초기화"
            aria-keyshortcuts="R"
          >
            <RotateCcw aria-hidden="true" size={18} />
          </button>
        </div>
      </header>

      <div
        className="map-stage"
        data-testid="map-stage"
        data-camera-command={cameraCommand.kind}
        data-camera-sequence={cameraCommand.sequence}
      >
        <CityCanvas
          buildings={buildings}
          agents={agents}
          opponents={opponents}
          controlledMole={controlledMole}
          selectedAgentId={selectedAgentId}
          reachableCells={reachableCells}
          path={path}
          rosterSelection={rosterSelection}
          executionCues={executionCues}
          settledExecutionCues={settledExecutionCues}
          cameraCommand={cameraCommand}
          commandOverlay={commandOverlay}
          onIntent={onIntent}
          onInteractionChange={onInteractionChange}
        />

        <div className="map-readout" aria-live="polite">
          <Crosshair aria-hidden="true" size={15} />
          <span>
            {executionCues.length > 0
              ? executionCues.map((cue) => cue.label).join(" · ")
              : rosterSelection
                ? rosterSelection.selectedFacilityId
                  ? `은닉 건물 선택됨 · ${rosterSelection.selectedFacilityId}`
                  : "초록색으로 깜빡이는 건물을 누르십시오"
                : path.length > 0
                  ? `경로 ${pathLabels}`
                  : "요원 또는 셀을 선택하십시오"}
          </span>
        </div>
      </div>

      {showDestinationControls && reachableCells.length > 0 ? (
        <details className="map-dom-controls">
          <summary>키보드 목적지 목록</summary>
          <div
            className="map-dom-controls__group map-dom-controls__group--destinations"
            aria-label="이동 가능 목적지 목록"
          >
            {reachableCells.map((coordinate, index) => {
              const label = toGridLabel(coordinate);
              return (
                <button
                  key={`${coordinate.row}-${coordinate.col}`}
                  ref={(element) => {
                    destinationButtonRefs.current[index] = element;
                  }}
                  type="button"
                  onClick={() => onIntent({ kind: "CELL", ...coordinate })}
                  onKeyDown={(event) => moveDestinationFocus(event, index)}
                  aria-label={`${label}을 목적지로 선택`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </details>
      ) : null}
    </section>
  );
}
