import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { excelAddressToCoordinate } from "@/domain/map/coordinates";
import type { AgentState } from "@/domain/model/game-types";
import {
  MoleOrderPanel,
  RosterPlacementDock,
} from "@/ui/hud/local-phase-panels";

const mole: AgentState = {
  id: "red-d",
  nominalTeam: "RED",
  role: "D",
  coordinate: excelAddressToCoordinate("C16"),
  status: "ACTIVE",
  canAct: true,
  moleController: "BLUE",
};
const colleague: AgentState = {
  id: "red-h",
  nominalTeam: "RED",
  role: "H",
  coordinate: excelAddressToCoordinate("C15"),
  status: "ACTIVE",
  canAct: true,
};

describe("local phase panels", () => {
  it("keeps seed controls in a map-selection dock without a building chooser", async () => {
    const user = userEvent.setup();
    const onCreateSeed = vi.fn();
    const onResetSeed = vi.fn();

    render(
      <RosterPlacementDock
        seed="사용자-시드"
        selectedFacilityId={null}
        onSeedChange={() => undefined}
        onCreateSeed={onCreateSeed}
        onResetSeed={onResetSeed}
        onSelect={() => undefined}
        onConfirm={() => undefined}
      />,
    );

    await user.click(screen.getByText("훈련 시드 설정"));
    await user.click(screen.getByRole("button", { name: "새 시드 만들기" }));
    await user.click(screen.getByRole("button", { name: "기본 시드 복원" }));

    expect(onCreateSeed).toHaveBeenCalledOnce();
    expect(onResetSeed).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("훈련 시드")).toHaveValue("사용자-시드");
    expect(screen.getByText(/초록색으로 깜빡이는/)).toBeVisible();
    expect(screen.queryByLabelText("명단 은닉 후보")).not.toBeInTheDocument();
  });

  it("locks colleague assassination through turn 5 and enables it on turn 6", () => {
    const onChoose = vi.fn();
    const { rerender } = render(
      <MoleOrderPanel
        controller="BLUE"
        mole={mole}
        nominalOrder={{ kind: "WAIT", agentId: mole.id }}
        colleagues={[colleague]}
        availableFunds={5_500}
        turn={5}
        onChoose={onChoose}
      />,
    );
    expect(
      screen.getByRole("button", { name: "동료 암살 · 6턴부터 사용 가능" }),
    ).toBeDisabled();

    rerender(
      <MoleOrderPanel
        controller="BLUE"
        mole={mole}
        nominalOrder={{ kind: "WAIT", agentId: mole.id }}
        colleagues={[colleague]}
        availableFunds={5_500}
        turn={6}
        onChoose={onChoose}
      />,
    );
    expect(
      screen.getByRole("button", { name: /요원 H 동료 암살/ }),
    ).toBeEnabled();
  });
});
