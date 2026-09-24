import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useReducer } from "react";
import { describe, expect, it } from "vitest";

import { operationFixture } from "@/game-client/fixture/operation-fixture";
import { AgentCommandComposer } from "@/ui/command-composer/agent-command-composer";
import {
  commandComposerReducer,
  type ComposerState,
} from "@/ui/command-composer/command-reducer";

const agent = operationFixture.agents[0];
const primary: ComposerState = {
  type: "primary",
  agentId: agent.id,
  origin: agent.coordinate,
};

function Harness() {
  const [state, dispatch] = useReducer(commandComposerReducer, primary);
  return (
    <AgentCommandComposer
      state={state}
      agent={agent}
      visibleOpponents={operationFixture.visibleOpponents}
      availableFunds={5_500}
      onEvent={dispatch}
    />
  );
}

describe("AgentCommandComposer", () => {
  it("shows the primary menu before any destination operation", () => {
    render(<Harness />);
    expect(
      screen.getByRole("button", { name: /이동.*칸당 \$200/ }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /대기.*\$0/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /심문.*\$1,000/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /숙청.*\$2,000/ })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /조사/ }),
    ).not.toBeInTheDocument();
  });

  it("moves to destination selection without inventing a server save", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: /이동.*칸당 \$200/ }));
    expect(screen.getByText("도착지를 지정하십시오")).toBeVisible();
    expect(
      screen.getByRole("button", { name: /현재 위치 P3에서 공작/ }),
    ).toBeVisible();
    expect(screen.queryByText("FIXTURE SAVED")).not.toBeInTheDocument();
  });

  it("uses a modal alert dialog for purge and restores trigger focus on cancel", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const purgeTrigger = screen.getByRole("button", {
      name: /숙청.*\$2,000/,
    });

    await user.click(purgeTrigger);
    const dialog = screen.getByRole("alertdialog", {
      name: "요원 K 숙청 초안",
    });
    expect(dialog).toBeVisible();
    expect(dialog).toHaveAttribute("open");
    expect(
      screen.getByRole("button", { name: /요원 K 숙청 초안 저장/ }),
    ).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /숙청.*\$2,000/ })).toHaveFocus();
  });

  it("closes immediately after confirming purge", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /숙청.*\$2,000/ }));
    await user.click(
      screen.getByRole("button", { name: /요원 K 숙청 초안 저장/ }),
    );

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.queryByText("요원 K 명령 초안 완료")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "패널 닫기" }),
    ).not.toBeInTheDocument();
  });
});
