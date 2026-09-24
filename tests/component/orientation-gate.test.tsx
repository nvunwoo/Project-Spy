import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { OrientationGate } from "@/ui/responsive/orientation-gate";

type MatchMediaController = {
  setPortrait: (matches: boolean) => void;
};

function installMatchMedia(initialPortrait: boolean): MatchMediaController {
  let matches = initialPortrait;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: "(orientation: portrait)",
    onchange: null,
    addEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      listeners.add(listener as (event: MediaQueryListEvent) => void);
    },
    removeEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      listeners.delete(listener as (event: MediaQueryListEvent) => void);
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } satisfies MediaQueryList;

  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => mediaQuery),
  );

  return {
    setPortrait(nextMatches) {
      matches = nextMatches;
      const event = { matches, media: mediaQuery.media } as MediaQueryListEvent;

      listeners.forEach((listener) => listener(event));
    },
  };
}

function StatefulFixture() {
  const [count, setCount] = useState(0);

  return (
    <button type="button" onClick={() => setCount((value) => value + 1)}>
      명령 {count}
    </button>
  );
}

describe("OrientationGate", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("keeps landscape content available and hides the blocking message", () => {
    installMatchMedia(false);

    render(
      <OrientationGate>
        <button type="button">요원 K 선택</button>
      </OrientationGate>,
    );

    expect(screen.getByRole("button", { name: "요원 K 선택" })).toBeVisible();
    expect(
      screen.queryByRole("dialog", { name: "가로 모드 전용" }),
    ).not.toBeInTheDocument();
  });

  it("blocks portrait interaction with the approved Korean message", () => {
    installMatchMedia(true);

    const { container } = render(
      <OrientationGate>
        <button type="button">요원 K 선택</button>
      </OrientationGate>,
    );

    expect(
      screen.getByRole("dialog", { name: "가로 모드 전용" }),
    ).toHaveTextContent(
      "PROJECT SPY는 가로 화면에 맞춰 설계되었습니다. 기기를 가로로 회전하면 작전을 계속할 수 있습니다.",
    );

    const content = container.querySelector("[data-orientation-content]");
    expect(content).toHaveAttribute("inert");
    expect(content).toHaveAttribute("aria-hidden", "true");
  });

  it("preserves child state and restores focus after returning to landscape", async () => {
    const media = installMatchMedia(false);
    const user = userEvent.setup();

    render(
      <OrientationGate>
        <StatefulFixture />
      </OrientationGate>,
    );

    const commandButton = screen.getByRole("button", { name: "명령 0" });
    await user.click(commandButton);
    expect(screen.getByRole("button", { name: "명령 1" })).toHaveFocus();

    act(() => media.setPortrait(true));
    expect(
      screen.getByRole("heading", { name: "가로 모드 전용" }),
    ).toHaveFocus();

    act(() => media.setPortrait(false));
    expect(screen.getByRole("button", { name: "명령 1" })).toHaveFocus();
  });
});
