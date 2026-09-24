"use client";

import { Html, Line, MapControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentRef,
  type ReactNode,
} from "react";
import {
  Group,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MOUSE,
  TOUCH,
  Vector3,
} from "three";
import type { ThreeEvent } from "@react-three/fiber";

import {
  logicalToWorld,
  worldToLogical,
} from "@/presentation-3d/coordinates/logical-to-world";
import {
  isTapGesture,
  isPrimarySelectionButton,
  type MapCameraCommand,
  type PointerSample,
  type SelectionIntent,
} from "@/presentation-3d/input/selection-intent";
import { getBuildingSceneGeometry } from "@/presentation-3d/scene/map-geometry";
import type { ExecutionCue } from "@/game-client/fixture/execution-playback";
import type {
  CoordinateView,
  ControlledMoleView,
  MapBuildingView,
  OwnAgentView,
  VisibleOpponentView,
} from "@/shared/contracts/player-projection";

interface PrimitiveCitySceneProps {
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

const INITIAL_CAMERA_POSITION = new Vector3(0, 18, 19);
const MAP_TARGET_LIMIT = 6;

interface PointerGesture {
  readonly start: PointerSample;
  maxExcursionPx: number;
}

function RosterHighlight(props: {
  readonly coordinate: CoordinateView;
  readonly selected: boolean;
  readonly onPointerDown: PrimitiveCitySceneProps["onIntent"];
}) {
  const materialRef = useRef<MeshBasicMaterial>(null);
  const meshRef = useRef<Mesh>(null);
  useFrame(() => {
    const pulse = (Math.sin(performance.now() / 180) + 1) / 2;
    if (materialRef.current) materialRef.current.opacity = 0.34 + pulse * 0.5;
    if (meshRef.current) {
      const scale = props.selected ? 1.1 : 0.94 + pulse * 0.16;
      meshRef.current.scale.setScalar(scale);
    }
  });
  const world = logicalToWorld(props.coordinate, 1.15);
  return (
    <mesh
      ref={meshRef}
      position={[world.x, world.y, world.z]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(event) => {
        event.stopPropagation();
        props.onPointerDown({ kind: "CELL", ...props.coordinate });
      }}
    >
      <ringGeometry args={[0.28, 0.48, 24]} />
      <meshBasicMaterial
        ref={materialRef}
        color={props.selected ? "#d4ff86" : "#58ff8b"}
        transparent
        opacity={0.75}
        depthWrite={false}
      />
    </mesh>
  );
}

function AgentMarker(props: {
  readonly id: string;
  readonly callsign: string;
  readonly coordinate: CoordinateView;
  readonly selected: boolean;
  readonly mole: boolean;
  readonly activeCue?: ExecutionCue;
  readonly settledCues: readonly ExecutionCue[];
  readonly onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  readonly onPointerMove?: (event: ThreeEvent<PointerEvent>) => void;
  readonly onPointerUp?: (event: ThreeEvent<PointerEvent>) => void;
  readonly onPointerCancel?: (event: ThreeEvent<PointerEvent>) => void;
}) {
  const groupRef = useRef<Group>(null);
  const startedAtRef = useRef(0);
  useEffect(() => {
    startedAtRef.current = performance.now();
  }, [props.activeCue?.id]);
  const settledMove = [...props.settledCues]
    .reverse()
    .find(
      (cue) => cue.agentId === props.id && cue.kind === "MOVE" && cue.succeeded,
    );
  const settledRemoved = props.settledCues.some(
    (cue) => cue.agentId === props.id && cue.kind === "REMOVAL",
  );
  const baseCoordinate = settledMove?.path.at(-1) ?? props.coordinate;

  useFrame(() => {
    const group = groupRef.current;
    if (!group) return;
    const elapsed = performance.now() - startedAtRef.current;
    const cue = props.activeCue;
    let world = logicalToWorld(baseCoordinate, 0.36);
    let scale = settledRemoved ? 0 : 1;
    let yOffset = 0;

    if (cue?.kind === "MOVE" && cue.path.length > 0) {
      const points = [cue.from, ...cue.path];
      const progress = Math.min(1, elapsed / 1_250);
      const segmentProgress = progress * (points.length - 1);
      const index = Math.min(points.length - 2, Math.floor(segmentProgress));
      const from = logicalToWorld(points[index]!, 0.36);
      const to = logicalToWorld(points[index + 1]!, 0.36);
      const local = segmentProgress - index;
      world = {
        x: MathUtils.lerp(from.x, to.x, local),
        y: from.y,
        z: MathUtils.lerp(from.z, to.z, local),
      };
      yOffset = Math.sin(progress * Math.PI * (points.length - 1)) * 0.08;
    } else if (cue?.kind === "MOVE_FAILURE") {
      world = {
        ...world,
        x:
          world.x +
          Math.sin(elapsed / 34) * Math.max(0, 1 - elapsed / 1_250) * 0.1,
      };
    } else if (cue?.kind === "REMOVAL") {
      scale = Math.max(0, 1 - elapsed / 760);
      yOffset = -Math.min(0.34, elapsed / 2_400);
    } else if (cue && cue.kind !== "WAIT") {
      yOffset = Math.sin(Math.min(1, elapsed / 850) * Math.PI * 2) * 0.1;
    }

    group.position.set(world.x, world.y + yOffset, world.z);
    group.scale.setScalar(scale);
  });

  const activeCue = props.activeCue;
  return (
    <group
      ref={groupRef}
      onPointerDown={props.onPointerDown}
      onPointerMove={props.onPointerMove}
      onPointerUp={props.onPointerUp}
      onPointerCancel={props.onPointerCancel}
    >
      <mesh castShadow>
        <cylinderGeometry
          args={[props.selected ? 0.28 : 0.23, 0.3, 0.62, 12]}
        />
        <meshStandardMaterial
          color={
            props.mole ? "#9f6bd9" : props.selected ? "#8cc7d4" : "#4f78a8"
          }
          emissive={
            activeCue
              ? activeCue.succeeded
                ? "#2c6a50"
                : "#6a1f2c"
              : props.mole
                ? "#331d4a"
                : props.selected
                  ? "#294c57"
                  : "#102036"
          }
          emissiveIntensity={activeCue ? 1.1 : props.selected ? 0.75 : 0.25}
        />
      </mesh>
      <Html
        center
        position={[0, 0.58, 0]}
        distanceFactor={12}
        pointerEvents="none"
      >
        <span
          className={`map-agent-label ${props.mole ? "map-agent-label--mole" : "map-agent-label--blue"}`}
        >
          {props.callsign}
        </span>
      </Html>
    </group>
  );
}

function OperationEffect({ cue }: { readonly cue: ExecutionCue }) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshBasicMaterial>(null);
  const startedAtRef = useRef(0);
  useEffect(() => {
    startedAtRef.current = performance.now();
  }, [cue.id]);
  useFrame(() => {
    const progress = Math.min(
      1,
      (performance.now() - startedAtRef.current) / 900,
    );
    if (meshRef.current) {
      meshRef.current.rotation.z = progress * Math.PI * 2;
      meshRef.current.scale.setScalar(0.7 + progress * 1.45);
    }
    if (materialRef.current)
      materialRef.current.opacity = 0.82 * (1 - progress);
  });
  if (["MOVE", "MOVE_FAILURE", "WAIT"].includes(cue.kind)) return null;
  const world = logicalToWorld(cue.from, 0.11);
  const color =
    cue.kind === "ASSASSINATE" ||
    cue.kind === "MOLE_ASSASSINATION" ||
    cue.kind === "REMOVAL"
      ? "#ff4e67"
      : cue.kind === "HACK"
        ? "#49e7ff"
        : "#d4ff86";
  return (
    <mesh
      ref={meshRef}
      position={[world.x, world.y, world.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[0.24, 0.39, 24]} />
      <meshBasicMaterial
        ref={materialRef}
        color={color}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

export function PrimitiveCityScene({
  buildings,
  agents,
  opponents,
  controlledMole,
  selectedAgentId,
  reachableCells,
  path,
  cameraCommand,
  rosterSelection = null,
  executionCues = [],
  settledExecutionCues = [],
  commandOverlay = null,
  onIntent,
  onInteractionChange,
}: PrimitiveCitySceneProps) {
  const { camera } = useThree();
  const controlsRef = useRef<ComponentRef<typeof MapControls>>(null);
  const pointerGestures = useRef(new Map<number, PointerGesture>());
  const multiPointerGesture = useRef(new Set<number>());
  const [hoveredFacilityId, setHoveredFacilityId] = useState<string | null>(
    null,
  );
  const [touchedFacilityId, setTouchedFacilityId] = useState<string | null>(
    null,
  );

  const recordPointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    if (!isPrimarySelectionButton(event.button)) {
      pointerGestures.current.delete(event.pointerId);
      return;
    }
    pointerGestures.current.set(event.pointerId, {
      start: {
        clientX: event.clientX,
        clientY: event.clientY,
        timeStamp: event.timeStamp,
      },
      maxExcursionPx: 0,
    });
    if (pointerGestures.current.size > 1) {
      for (const pointerId of pointerGestures.current.keys()) {
        multiPointerGesture.current.add(pointerId);
      }
    }
  }, []);

  const trackPointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
    const gesture = pointerGestures.current.get(event.pointerId);
    if (!gesture) return;
    event.stopPropagation();
    gesture.maxExcursionPx = Math.max(
      gesture.maxExcursionPx,
      Math.hypot(
        event.clientX - gesture.start.clientX,
        event.clientY - gesture.start.clientY,
      ),
    );
  }, []);

  const consumeTap = useCallback((event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    const pointerId = event.pointerId;
    const gesture = pointerGestures.current.get(pointerId);
    const wasMultiPointer = multiPointerGesture.current.has(pointerId);
    pointerGestures.current.delete(pointerId);
    multiPointerGesture.current.delete(pointerId);
    if (pointerGestures.current.size === 0) {
      multiPointerGesture.current.clear();
    }
    return (
      isPrimarySelectionButton(event.button) &&
      !wasMultiPointer &&
      isTapGesture(
        gesture?.start,
        {
          clientX: event.clientX,
          clientY: event.clientY,
          timeStamp: event.timeStamp,
        },
        gesture?.maxExcursionPx,
      )
    );
  }, []);

  const cancelPointer = useCallback((event: ThreeEvent<PointerEvent>) => {
    pointerGestures.current.delete(event.pointerId);
    multiPointerGesture.current.delete(event.pointerId);
  }, []);

  const handleBoardSelection = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      if (!consumeTap(event)) return;
      setTouchedFacilityId(null);
      const coordinate = worldToLogical(event.point.x, event.point.z);
      if (coordinate) {
        onIntent({ kind: "CELL", ...coordinate });
      }
    },
    [consumeTap, onIntent],
  );

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const linePoints = (
    selectedAgent && path.length > 0 ? [selectedAgent.coordinate, ...path] : []
  ).map((coordinate) => {
    const world = logicalToWorld(coordinate, 0.16);
    return [world.x, world.y, world.z] as [number, number, number];
  });
  const commandOverlayWorld = commandOverlay
    ? logicalToWorld(commandOverlay.coordinate)
    : null;

  const clampControlsTarget = useCallback(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const clampedX = Math.max(
      -MAP_TARGET_LIMIT,
      Math.min(MAP_TARGET_LIMIT, controls.target.x),
    );
    const clampedZ = Math.max(
      -MAP_TARGET_LIMIT,
      Math.min(MAP_TARGET_LIMIT, controls.target.z),
    );
    if (
      clampedX === controls.target.x &&
      clampedZ === controls.target.z &&
      controls.target.y === 0
    ) {
      return;
    }
    const correction = new Vector3(
      clampedX - controls.target.x,
      -controls.target.y,
      clampedZ - controls.target.z,
    );
    controls.target.set(clampedX, 0, clampedZ);
    camera.position.add(correction);
  }, [camera]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const panBy = (x: number, z: number) => {
      const offset = new Vector3(x, 0, z);
      controls.target.add(offset);
      camera.position.add(offset);
      clampControlsTarget();
    };

    if (cameraCommand.kind === "RESET") {
      camera.position.copy(INITIAL_CAMERA_POSITION);
      controls.target.set(0, 0, 0);
    } else if (
      cameraCommand.kind === "ZOOM_IN" ||
      cameraCommand.kind === "ZOOM_OUT"
    ) {
      const offset = camera.position.clone().sub(controls.target);
      const distance = offset.length();
      const requested =
        cameraCommand.kind === "ZOOM_IN" ? distance * 0.88 : distance / 0.88;
      offset.setLength(Math.min(27, Math.max(15, requested)));
      camera.position.copy(controls.target).add(offset);
    } else {
      const panStep = 0.9;
      const offsets = {
        PAN_NORTH: [0, -panStep],
        PAN_SOUTH: [0, panStep],
        PAN_WEST: [-panStep, 0],
        PAN_EAST: [panStep, 0],
      } as const;
      const [x, z] = offsets[cameraCommand.kind];
      panBy(x, z);
    }

    controls.update();
  }, [camera, cameraCommand, clampControlsTarget]);

  return (
    <>
      <ambientLight intensity={1.35} />
      <directionalLight
        position={[6, 14, 10]}
        intensity={2.1}
        color="#c8e3e8"
      />
      <directionalLight
        position={[-8, 7, -5]}
        intensity={0.45}
        color="#6f7da0"
      />

      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={recordPointerDown}
        onPointerMove={trackPointerMove}
        onPointerUp={handleBoardSelection}
        onPointerCancel={cancelPointer}
        receiveShadow
      >
        <planeGeometry args={[16, 16]} />
        <meshStandardMaterial
          color="#111a21"
          roughness={0.94}
          metalness={0.04}
        />
      </mesh>

      <gridHelper
        args={[16, 16, "#40525e", "#22313b"]}
        position={[0, 0.018, 0]}
      />

      {buildings.map((building) => {
        const centerOffset = building.footprint === 2 ? 0.5 : 0;
        const centerCoordinate = {
          row: building.coordinate.row + centerOffset,
          col: building.coordinate.col + centerOffset,
        };
        const center = logicalToWorld(centerCoordinate);
        const geometry = getBuildingSceneGeometry(building);
        const labelVisible =
          building.labelVisibility === "ALWAYS" ||
          (building.labelVisibility === "DISCOVER" &&
            (hoveredFacilityId === building.id ||
              touchedFacilityId === building.id));
        return (
          <group key={building.id}>
            <mesh
              position={[center.x, geometry.height / 2 + 0.03, center.z]}
              castShadow
              onPointerOver={(event) => {
                if (building.labelVisibility !== "DISCOVER") return;
                event.stopPropagation();
                setHoveredFacilityId(building.id);
              }}
              onPointerOut={() => {
                if (building.labelVisibility === "DISCOVER") {
                  setHoveredFacilityId((current) =>
                    current === building.id ? null : current,
                  );
                }
              }}
              onPointerDown={recordPointerDown}
              onPointerMove={trackPointerMove}
              onPointerUp={(event) => {
                if (!consumeTap(event)) return;
                if (building.labelVisibility === "DISCOVER") {
                  setTouchedFacilityId(building.id);
                }
                const coordinate = worldToLogical(event.point.x, event.point.z);
                if (coordinate) onIntent({ kind: "CELL", ...coordinate });
              }}
              onPointerCancel={cancelPointer}
            >
              <boxGeometry
                args={[geometry.width, geometry.height, geometry.depth]}
              />
              <meshStandardMaterial
                color={geometry.color}
                roughness={0.72}
                metalness={0.16}
              />
            </mesh>
            {building.label && labelVisible ? (
              <Html
                center
                position={[center.x, geometry.height + 0.28, center.z]}
                distanceFactor={12}
                pointerEvents="none"
              >
                <span
                  className="map-facility-label"
                  data-discovered={
                    building.labelVisibility === "DISCOVER" ? "true" : undefined
                  }
                >
                  {building.label}
                </span>
              </Html>
            ) : null}
          </group>
        );
      })}

      {reachableCells.map((coordinate) => {
        const world = logicalToWorld(coordinate, 0.07);
        return (
          <mesh
            key={`reachable-${coordinate.row}-${coordinate.col}`}
            position={[world.x, world.y, world.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerDown={recordPointerDown}
            onPointerMove={trackPointerMove}
            onPointerUp={(event) => {
              if (!consumeTap(event)) return;
              onIntent({ kind: "CELL", ...coordinate });
            }}
            onPointerCancel={cancelPointer}
          >
            <planeGeometry args={[0.84, 0.84]} />
            <meshBasicMaterial
              color="#6fafc1"
              transparent
              opacity={0.31}
              depthWrite={false}
            />
          </mesh>
        );
      })}

      {rosterSelection?.candidates.map((candidate) => (
        <RosterHighlight
          key={candidate.facilityId}
          coordinate={candidate.coordinate}
          selected={candidate.facilityId === rosterSelection.selectedFacilityId}
          onPointerDown={onIntent}
        />
      ))}

      {linePoints.length > 1 ? (
        <Line
          points={linePoints}
          color="#f04b55"
          lineWidth={3}
          transparent
          opacity={0.96}
        />
      ) : null}

      {agents.map((agent) => (
        <AgentMarker
          key={agent.id}
          id={agent.id}
          callsign={agent.callsign}
          coordinate={agent.coordinate}
          selected={agent.id === selectedAgentId}
          mole={false}
          activeCue={executionCues.find((cue) => cue.agentId === agent.id)}
          settledCues={settledExecutionCues}
          onPointerDown={recordPointerDown}
          onPointerMove={trackPointerMove}
          onPointerUp={(event) => {
            if (!consumeTap(event)) return;
            onIntent({ kind: "AGENT", logicalId: agent.id });
          }}
          onPointerCancel={cancelPointer}
        />
      ))}

      {controlledMole ? (
        <AgentMarker
          id={controlledMole.id}
          callsign={`${controlledMole.callsign}†`}
          coordinate={controlledMole.coordinate}
          selected={false}
          mole
          activeCue={executionCues.find(
            (cue) => cue.agentId === controlledMole.id,
          )}
          settledCues={settledExecutionCues}
        />
      ) : null}

      {executionCues.map((cue) => (
        <OperationEffect key={cue.id} cue={cue} />
      ))}

      {opponents.map((opponent) => {
        const world = logicalToWorld(opponent.coordinate, 0.34);
        return (
          <group key={opponent.id} position={[world.x, world.y, world.z]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.22, 0.28, 0.58, 10]} />
              <meshStandardMaterial
                color="#a35d62"
                emissive="#32171a"
                emissiveIntensity={0.3}
              />
            </mesh>
            <Html
              center
              position={[0, 0.55, 0]}
              distanceFactor={12}
              pointerEvents="none"
            >
              <span className="map-agent-label map-agent-label--red">?</span>
            </Html>
          </group>
        );
      })}

      {commandOverlay && commandOverlayWorld ? (
        <Html
          center
          position={[commandOverlayWorld.x, 1.52, commandOverlayWorld.z]}
          wrapperClass="map-command-anchor"
          zIndexRange={[120, 80]}
        >
          <div
            className="map-command-positioner"
            data-side={commandOverlay.coordinate.col >= 8 ? "left" : "right"}
            data-vertical={commandOverlay.coordinate.row <= 7 ? "down" : "up"}
            onPointerDown={(event) => event.stopPropagation()}
            onPointerUp={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            onWheel={(event) => event.stopPropagation()}
          >
            {commandOverlay.content}
          </div>
        </Html>
      ) : null}

      <MapControls
        ref={controlsRef}
        enableRotate={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={15}
        maxDistance={27}
        maxPolarAngle={Math.PI / 2.35}
        minPolarAngle={Math.PI / 3.4}
        mouseButtons={{
          LEFT: MOUSE.PAN,
          MIDDLE: MOUSE.PAN,
          RIGHT: MOUSE.PAN,
        }}
        touches={{ ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }}
        onChange={clampControlsTarget}
        onStart={() => onInteractionChange?.(true)}
        onEnd={() => onInteractionChange?.(false)}
      />
    </>
  );
}
