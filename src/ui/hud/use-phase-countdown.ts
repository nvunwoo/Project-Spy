"use client";

import { useEffect, useRef, useState } from "react";

import {
  getLocalPhaseRemainingSeconds,
  type LocalPhaseDeadline,
} from "@/game-client/fixture/local-phase-deadline";

const CLOCK_REFRESH_MS = 250;

/**
 * Displays a fixture deadline without accumulating interval ticks. The absolute
 * deadline remains the source of truth, so throttled background timers recover
 * immediately on visibility, focus, or page-show events.
 */
export function usePhaseCountdown(
  deadline: LocalPhaseDeadline | null,
  onExpire: () => void,
): number {
  const [clockSampleMs, setClockSampleMs] = useState(() => Date.now());
  const onExpireRef = useRef(onExpire);
  const expiredDeadlineRef = useRef<number | null>(null);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const remainingSeconds = getLocalPhaseRemainingSeconds(
    deadline,
    clockSampleMs,
  );

  useEffect(() => {
    if (!deadline) return;

    const synchronize = () => setClockSampleMs(Date.now());
    const intervalId = window.setInterval(synchronize, CLOCK_REFRESH_MS);
    document.addEventListener("visibilitychange", synchronize);
    window.addEventListener("focus", synchronize);
    window.addEventListener("pageshow", synchronize);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", synchronize);
      window.removeEventListener("focus", synchronize);
      window.removeEventListener("pageshow", synchronize);
    };
  }, [deadline]);

  useEffect(() => {
    if (!deadline || remainingSeconds > 0) return;
    if (expiredDeadlineRef.current === deadline.deadlineAtMs) return;
    expiredDeadlineRef.current = deadline.deadlineAtMs;
    onExpireRef.current();
  }, [deadline, remainingSeconds]);

  return remainingSeconds;
}
