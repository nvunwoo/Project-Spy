import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { ReactNode } from "react";

import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

import { OrientationGate } from "@/ui/responsive/orientation-gate";

export const metadata: Metadata = {
  title: "PROJECT SPY · 로컬 훈련",
  description: "1대1 동시 명령 첩보 게임 PROJECT SPY의 로컬 훈련 화면",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "dark",
  themeColor: "#090d12",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ko" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <OrientationGate>{children}</OrientationGate>
      </body>
    </html>
  );
}
