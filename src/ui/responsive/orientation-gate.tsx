"use client";

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react";

import styles from "./orientation-gate.module.css";

const PORTRAIT_QUERY = "(orientation: portrait)";

function getPortraitSnapshot() {
  return typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
    ? window.matchMedia(PORTRAIT_QUERY).matches
    : false;
}

function getServerPortraitSnapshot() {
  return false;
}

function subscribeToPortraitChange(onChange: () => void) {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return () => undefined;
  }

  const mediaQuery = window.matchMedia(PORTRAIT_QUERY);
  mediaQuery.addEventListener("change", onChange);

  return () => mediaQuery.removeEventListener("change", onChange);
}

type OrientationGateProps = {
  children: ReactNode;
};

function OrientationGate({ children }: OrientationGateProps) {
  const isPortrait = useSyncExternalStore(
    subscribeToPortraitChange,
    getPortraitSnapshot,
    getServerPortraitSnapshot,
  );
  const contentRef = useRef<HTMLDivElement>(null);
  const gateTitleRef = useRef<HTMLHeadingElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const wasPortraitRef = useRef(false);

  useEffect(() => {
    if (isPortrait && !wasPortraitRef.current) {
      const activeElement = document.activeElement;

      if (
        activeElement instanceof HTMLElement &&
        contentRef.current?.contains(activeElement)
      ) {
        previousFocusRef.current = activeElement;
      }

      gateTitleRef.current?.focus({ preventScroll: true });
    }

    if (!isPortrait && wasPortraitRef.current) {
      const previousFocus = previousFocusRef.current;

      if (previousFocus?.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }

      previousFocusRef.current = null;
    }

    wasPortraitRef.current = isPortrait;
  }, [isPortrait]);

  return (
    <div
      className={styles.root}
      data-orientation={isPortrait ? "portrait" : "landscape"}
    >
      <div
        ref={contentRef}
        className={styles.content}
        data-orientation-content=""
        aria-hidden={isPortrait ? true : undefined}
        inert={isPortrait ? true : undefined}
      >
        {children}
      </div>

      <div
        className={styles.gate}
        role="dialog"
        aria-hidden={isPortrait ? undefined : true}
        aria-labelledby="orientation-gate-title"
        aria-describedby="orientation-gate-description"
        aria-modal={isPortrait ? true : undefined}
      >
        <div className={styles.gatePanel}>
          <div className={styles.deviceMark} aria-hidden="true" />
          <p className={styles.eyebrow}>LANDSCAPE REQUIRED</p>
          <h1
            ref={gateTitleRef}
            id="orientation-gate-title"
            className={styles.title}
            tabIndex={-1}
          >
            가로 모드 전용
          </h1>
          <p id="orientation-gate-description" className={styles.description}>
            PROJECT SPY는 가로 화면에 맞춰 설계되었습니다. 기기를 가로로
            회전하면 작전을 계속할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export { OrientationGate, type OrientationGateProps };
