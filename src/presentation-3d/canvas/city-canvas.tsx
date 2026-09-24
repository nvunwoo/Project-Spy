"use client";

import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import type {
  MapCameraCommand,
  SelectionIntent,
} from "@/presentation-3d/input/selection-intent";
import { PrimitiveCityScene } from "@/presentation-3d/scene/primitive-city-scene";
import type {
  CoordinateView,
  ControlledMoleView,
  MapBuildingView,
  OwnAgentView,
  VisibleOpponentView,
} from "@/shared/contracts/player-projection";
import type { ExecutionCue } from "@/game-client/fixture/execution-playback";

interface CityCanvasProps {
  readonly buildings: readonly MapBuildingView[];
  readonly agents: readonly OwnAgentView[];
  readonly opponents: readonly VisibleOpponentView[];
  readonly controlledMole: ControlledMoleView | null;
  readonly selectedAgentId: string | null;
  readonly reachableCells: readonly CoordinateView[];
  readonly path: readonly CoordinateView[];
  readonly cameraCommand: MapCameraCommand;
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

export default function CityCanvas(props: CityCanvasProps) {
  return (
    <Canvas
      aria-label="PROJECT SPY 16×16 도시 작전 지도"
      camera={{ position: [0, 18, 19], fov: 40, near: 0.1, far: 80 }}
      dpr={[1, 1.5]}
      gl={{
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      }}
      shadows={false}
      fallback={
        <div className="map-fallback">3D 지도를 불러올 수 없습니다.</div>
      }
    >
      <color attach="background" args={["#0b1117"]} />
      <fog attach="fog" args={["#0b1117", 24, 44]} />
      <PrimitiveCityScene {...props} />
    </Canvas>
  );
}
