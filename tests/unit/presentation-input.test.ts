import { describe, expect, it } from "vitest";

import {
  getMapCameraCommandForKey,
  isPrimarySelectionButton,
  isTapGesture,
  TAP_MAX_DISTANCE_PX,
  TAP_MAX_DURATION_MS,
} from "@/presentation-3d/input/selection-intent";

describe("map tap gesture contract", () => {
  const start = { clientX: 100, clientY: 100, timeStamp: 1_000 };

  it("accepts a gesture at the approved distance and duration boundaries", () => {
    expect(
      isTapGesture(start, {
        clientX: 100 + TAP_MAX_DISTANCE_PX,
        clientY: 100,
        timeStamp: 1_000 + TAP_MAX_DURATION_MS,
      }),
    ).toBe(true);
  });

  it("rejects drag, long-press, missing-start, and invalid-time gestures", () => {
    expect(
      isTapGesture(start, {
        clientX: 100 + TAP_MAX_DISTANCE_PX + 0.1,
        clientY: 100,
        timeStamp: 1_100,
      }),
    ).toBe(false);
    expect(
      isTapGesture(start, {
        clientX: 100,
        clientY: 100,
        timeStamp: 1_000 + TAP_MAX_DURATION_MS + 1,
      }),
    ).toBe(false);
    expect(
      isTapGesture(undefined, {
        clientX: 100,
        clientY: 100,
        timeStamp: 1_100,
      }),
    ).toBe(false);
    expect(
      isTapGesture(start, {
        clientX: 100,
        clientY: 100,
        timeStamp: 999,
      }),
    ).toBe(false);
  });

  it("rejects an out-and-back drag by its maximum excursion", () => {
    expect(
      isTapGesture(
        start,
        { clientX: 101, clientY: 100, timeStamp: 1_120 },
        TAP_MAX_DISTANCE_PX + 20,
      ),
    ).toBe(false);
  });

  it("accepts only the primary pointer button for selection", () => {
    expect(isPrimarySelectionButton(0)).toBe(true);
    expect(isPrimarySelectionButton(1)).toBe(false);
    expect(isPrimarySelectionButton(2)).toBe(false);
  });

  it("maps the approved reset, zoom, and shifted pan shortcuts", () => {
    const key = (
      value: string,
      overrides: Partial<Parameters<typeof getMapCameraCommandForKey>[0]> = {},
    ) =>
      getMapCameraCommandForKey({
        key: value,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        ...overrides,
      });

    expect(key("r")).toBe("RESET");
    expect(key("+")).toBe("ZOOM_IN");
    expect(key("-")).toBe("ZOOM_OUT");
    expect(key("ArrowUp", { shiftKey: true })).toBe("PAN_NORTH");
    expect(key("ArrowRight", { shiftKey: true })).toBe("PAN_EAST");
    expect(key("ArrowLeft")).toBeNull();
    expect(key("r", { ctrlKey: true })).toBeNull();
  });
});
