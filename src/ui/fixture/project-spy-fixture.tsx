"use client";

import { useState } from "react";

import { GameOperationScreen } from "@/ui/hud/game-operation-screen";
import { LobbyScreen } from "@/ui/lobby/lobby-screen";
import { WaitingRoomScreen } from "@/ui/lobby/waiting-room-screen";

type FixtureScreen = "lobby" | "waiting" | "operation";

export function ProjectSpyFixture() {
  const [screen, setScreen] = useState<FixtureScreen>("lobby");
  const [callsign, setCallsign] = useState("국장 A");

  function openScreen(
    next: Exclude<FixtureScreen, "lobby">,
    nextCallsign: string,
  ) {
    setCallsign(nextCallsign);
    setScreen(next);
  }

  if (screen === "waiting") {
    return (
      <WaitingRoomScreen
        callsign={callsign}
        onBack={() => setScreen("lobby")}
        onEnterOperation={() => setScreen("operation")}
      />
    );
  }

  if (screen === "operation") {
    return (
      <GameOperationScreen
        callsign={callsign}
        onExit={() => setScreen("lobby")}
      />
    );
  }

  return (
    <LobbyScreen
      onCreateFixture={(nextCallsign) => openScreen("waiting", nextCallsign)}
      onOpenOperation={(nextCallsign) => openScreen("operation", nextCallsign)}
    />
  );
}
