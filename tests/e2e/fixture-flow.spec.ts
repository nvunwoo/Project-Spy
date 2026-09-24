import { expect, test, type Locator, type Page } from "@playwright/test";

const FIXED_CLOCK = new Date("2026-08-23T00:00:00.000Z");

async function expectMinimumTouchTarget(locator: Locator) {
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  expect(box?.width ?? 0).toBeGreaterThanOrEqual(48);
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(48);
}

async function enterLocalOperation(
  page: Page,
  options: { readonly freezeClock?: boolean } = {},
) {
  if (options.freezeClock !== false) {
    await page.clock.setFixedTime(FIXED_CLOCK);
  }
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "정보는 제한되고, 명령은 동시에 실행된다.",
    }),
  ).toBeVisible();
  await expect(page.getByText("PHASE 0B · LOCAL FIXTURE")).toHaveCount(0);

  for (const name of ["훈련 대기실", "온라인 방 참가", "바로 훈련 시작"]) {
    await expectMinimumTouchTarget(page.getByRole("button", { name }));
  }

  await page.getByRole("button", { name: "바로 훈련 시작" }).click();
  await expect(page.getByTestId("operation-screen")).toBeVisible();
  await expect(page.getByText("4턴", { exact: true })).toBeVisible();
  await expect(page.getByTestId("phase-clock")).toHaveText("--");
  await expect(
    page.getByRole("heading", { name: "요원 명단 은닉" }),
  ).toBeVisible();

  await page.getByText("지도 은닉 건물 접근성 목록").click();
  const rosterChoice = page.getByRole("button", {
    name: "호텔 1 명단 은닉 위치 선택",
  });
  await expectMinimumTouchTarget(rosterChoice);
  await rosterChoice.click();
  const confirmRoster = page.getByRole("button", { name: "이 위치에 은닉" });
  await expectMinimumTouchTarget(confirmRoster);
  await confirmRoster.click();
  await expect(page.getByText("일반 명령", { exact: true })).toBeVisible();
  await expect(page.getByTestId("phase-clock")).toHaveText("50");
}

test("landscape local turn performs 3D execution, card results, and automatic next turn", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "portrait-orientation-guard");

  const threeClockWarnings: string[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
    if (
      message.type() === "warning" &&
      message.text().includes("THREE.Clock")
    ) {
      threeClockWarnings.push(message.text());
    }
  });

  await enterLocalOperation(page);
  await expect(page.locator(".event-report")).toHaveCount(0);
  await expect(
    page.locator(".map-facility-label").getByText("공항"),
  ).toBeVisible();
  await expect(
    page.locator(".map-facility-label").getByText("호텔 1", { exact: true }),
  ).toHaveCount(0);

  const missionRail = page.locator(".operation-rail--mission");
  const agentRail = page.locator(".operation-rail--agents");
  await expect(missionRail).toBeVisible();
  await expect(agentRail).toBeVisible();
  await expect(agentRail.locator(".agent-card")).toHaveCount(4);
  await expect(page.getByTestId("controlled-mole-card")).toContainText(
    "배신자 요원 D",
  );
  await expect(agentRail.getByText("3/3", { exact: true })).toBeVisible();
  for (const [callsign, coordinate] of [
    ["K", "P3"],
    ["H", "P1"],
    ["D", "N1"],
  ]) {
    await expect(
      agentRail.getByRole("button", {
        name: `요원 ${callsign} 선택 · ${coordinate}`,
      }),
    ).toBeVisible();
  }
  await expect(
    agentRail.getByRole("button", { name: /요원 F 선택/ }),
  ).toHaveCount(0);
  expect((await missionRail.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(
    210,
  );
  expect((await agentRail.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(
    236,
  );

  const mapStage = page.getByTestId("map-stage");
  const mapBox = await mapStage.boundingBox();
  const viewport = page.viewportSize();
  expect(mapBox).not.toBeNull();
  expect(mapBox?.width ?? 0).toBe(viewport?.width);
  expect(mapBox?.height ?? 0).toBe(viewport?.height);

  const agentKButton = page
    .getByRole("button", { name: /요원 K 선택 · P3/ })
    .first();
  await expectMinimumTouchTarget(agentKButton);
  await agentKButton.click();

  const composer = page.locator(".command-panel");
  await expect(
    composer.getByRole("button", { name: /이동.*칸당 \$200/ }),
  ).toBeVisible();
  await expect(composer.getByRole("button", { name: /조사/ })).toHaveCount(0);

  await composer.getByRole("button", { name: /이동.*칸당 \$200/ }).click();
  await expect(composer).toHaveCount(0);
  const destinationList = page.locator(".map-dom-controls");
  await expect(destinationList).not.toHaveAttribute("open", "");
  await destinationList.locator("summary").click();
  const destinationButtons = page.locator(
    '.map-dom-controls__group[aria-label="이동 가능 목적지 목록"] button',
  );
  await expectMinimumTouchTarget(page.locator(".map-dom-controls summary"));
  await destinationButtons.first().focus();
  await page.keyboard.press("ArrowRight");
  await expect(destinationButtons.nth(1)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(destinationButtons.nth(5)).toBeFocused();

  const cameraSequence = Number(
    await mapStage.getAttribute("data-camera-sequence"),
  );
  await page.keyboard.press("Shift+ArrowRight");
  await expect(destinationButtons.nth(5)).toBeFocused();
  await expect(mapStage).toHaveAttribute(
    "data-camera-sequence",
    String(cameraSequence + 1),
  );

  await page.getByRole("button", { name: "P6을 목적지로 선택" }).click();
  await expect(
    page.getByRole("button", { name: "명령 작성을 먼저 완료" }),
  ).toBeDisabled();
  await expect(composer.getByText("P3 → P6")).toBeVisible();
  await expect(
    composer.getByRole("button", { name: /이동만.*총 \$600/ }),
  ).toBeVisible();
  await expect(
    composer.getByRole("button", { name: /조사.*총 \$1,600/ }),
  ).toBeVisible();
  await expect(composer.getByRole("button", { name: /해킹/ })).toBeDisabled();
  await expectMinimumTouchTarget(
    composer.getByRole("button", { name: /이동만.*총 \$600/ }),
  );

  await composer.getByRole("button", { name: /이동만.*총 \$600/ }).click();
  await expect(composer).toHaveCount(0);
  await expect(page.getByRole("button", { name: "패널 닫기" })).toHaveCount(0);
  await expect(page.getByText(/P3 → P6 · 이동만 · \$600/)).toBeVisible();
  await expect(page.getByText("명령 저장됨")).toBeVisible();
  await expect(page.locator(".funds-total dd")).toHaveText("$4,900");

  const lockOrders = page.getByRole("button", {
    name: "미지정 요원 대기 · 명령 확정",
  });
  await expectMinimumTouchTarget(lockOrders);
  await lockOrders.click();
  await expect(
    page.getByRole("heading", { name: "배신자 명령 · 요원 D" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "동료 암살 · 6턴부터 사용 가능" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "묵인 · $0" }).click();
  await expect(page.getByText("명령 수행", { exact: true })).toBeVisible();
  await expect(page.getByText(/이동 (성공|실패)/).first()).toBeVisible();
  await expect(
    page.getByText("실시간 결과", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("결과 통보", { exact: true })).toBeVisible({
    timeout: 8_000,
  });
  await expect(page.getByTestId("phase-clock")).toHaveText("05");
  await expect(page.locator(".resolution-panel")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "사건 재생" })).toHaveCount(0);
  await expect(page.locator(".event-report")).toHaveCount(0);
  await expect(page.locator(".funds-total dd")).toHaveText("$3,700");

  await page.clock.setFixedTime(new Date(FIXED_CLOCK.getTime() + 5_100));
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page.getByText("5턴", { exact: true })).toBeVisible();
  await expect(page.getByText("일반 명령", { exact: true })).toBeVisible();
  await expect(page.getByText("명령 0/3")).toBeVisible();
  await expect(
    page.getByText("이전 턴", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText(/이동 · (성공|이동 실패)/).first()).toBeVisible();
  await expect(page.getByTestId("phase-clock")).toHaveText("50");

  const viewportFits = await page.evaluate(
    () =>
      document.documentElement.scrollWidth <=
        document.documentElement.clientWidth &&
      document.documentElement.scrollHeight <=
        document.documentElement.clientHeight,
  );
  expect(viewportFits).toBe(true);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(threeClockWarnings).toEqual([]);
});

test("roster can derive and restore a deterministic local training seed", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium");

  await page.clock.setFixedTime(FIXED_CLOCK);
  await page.goto("/");
  await page.getByRole("button", { name: "바로 훈련 시작" }).click();
  await page.getByText("훈련 시드 설정").click();

  const seedInput = page.getByRole("textbox", {
    name: "훈련 시드",
    exact: true,
  });
  await expect(seedInput).toHaveValue("서울-훈련-042");
  await page.getByRole("button", { name: "새 시드 만들기" }).click();
  await expect(seedInput).not.toHaveValue("서울-훈련-042");
  const firstGeneratedSeed = await seedInput.inputValue();
  expect(firstGeneratedSeed).toMatch(/^서울-훈련-[a-f0-9]{8}$/);

  await page.getByRole("button", { name: "기본 시드 복원" }).click();
  await expect(seedInput).toHaveValue("서울-훈련-042");
  await expect(
    page.getByRole("button", { name: "기본 시드 복원" }),
  ).toBeDisabled();

  await page.getByRole("button", { name: "새 시드 만들기" }).click();
  await expect(seedInput).toHaveValue(firstGeneratedSeed);
  await page.getByText("지도 은닉 건물 접근성 목록").click();
  const rosterChoice = page.getByRole("button", {
    name: "호텔 1 명단 은닉 위치 선택",
  });
  await rosterChoice.click();
  await page.getByRole("button", { name: "이 위치에 은닉" }).click();
  await page
    .getByRole("button", { name: "미지정 요원 대기 · 명령 확정" })
    .click();
  await page.getByRole("button", { name: "묵인 · $0" }).click();

  await expect(page.getByText("결과 통보", { exact: true })).toBeVisible({
    timeout: 8_000,
  });
  await page.getByRole("button", { name: "같은 시드", exact: true }).click();
  await page.getByText("훈련 시드 설정").click();
  await expect(seedInput).toHaveValue(firstGeneratedSeed);
  await page.getByText("지도 은닉 건물 접근성 목록").click();
  await expect(rosterChoice).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "이 위치에 은닉" }).click();
  await page
    .getByRole("button", { name: "미지정 요원 대기 · 명령 확정" })
    .click();
  await page.getByRole("button", { name: "묵인 · $0" }).click();
  await expect(page.getByText("결과 통보", { exact: true })).toBeVisible({
    timeout: 8_000,
  });
  await page.getByRole("button", { name: "새 시드", exact: true }).click();

  await page.getByText("훈련 시드 설정").click();
  const secondGeneratedSeed = await seedInput.inputValue();
  expect(secondGeneratedSeed).toMatch(/^서울-훈련-[a-f0-9]{8}$/);
  expect(secondGeneratedSeed).not.toBe(firstGeneratedSeed);
  await page.getByText("지도 은닉 건물 접근성 목록").click();
  await expect(rosterChoice).toHaveAttribute("aria-pressed", "false");
});

test("absolute deadlines recover after background time and apply both timeout defaults", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name === "portrait-orientation-guard");

  const clockOrigin = new Date("2026-08-23T00:00:00.000Z");
  await page.clock.setFixedTime(clockOrigin);
  await enterLocalOperation(page, { freezeClock: false });
  await expect(page.getByTestId("phase-clock")).toHaveText("50");

  await page.clock.setFixedTime(new Date(clockOrigin.getTime() + 41_000));
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page.getByTestId("phase-clock")).toHaveText("09");

  await page.clock.setFixedTime(new Date(clockOrigin.getTime() + 50_100));
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(
    page.getByRole("heading", { name: "배신자 명령 · 요원 D" }),
  ).toBeVisible();
  await expect(page.getByTestId("phase-clock")).toHaveText("10");
  await expect(page.getByTestId("phase-notice")).toHaveText(
    "시간 초과 · 저장된 0개 명령 + 자동 대기 3개",
  );

  await page.clock.setFixedTime(new Date(clockOrigin.getTime() + 60_200));
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(page.getByText("명령 수행", { exact: true })).toBeVisible();
  await expect(page.getByTestId("phase-notice")).toHaveText(
    "시간 초과 · 배신자 명령 자동 묵인",
  );
});

test("fixture continues through three consecutive turns", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium");

  await enterLocalOperation(page);
  let clockMs = FIXED_CLOCK.getTime();

  for (const turn of [4, 5, 6]) {
    await expect(page.getByText(`${turn}턴`, { exact: true })).toBeVisible();
    await page
      .getByRole("button", { name: "미지정 요원 대기 · 명령 확정" })
      .click();
    await page.getByRole("button", { name: "묵인 · $0" }).click();
    await expect(page.getByText("명령 수행", { exact: true })).toBeVisible();
    await expect(page.getByText("결과 통보", { exact: true })).toBeVisible({
      timeout: 8_000,
    });
    if (turn < 6) {
      clockMs += 5_100;
      await page.clock.setFixedTime(new Date(clockMs));
      await page.evaluate(() =>
        document.dispatchEvent(new Event("visibilitychange")),
      );
    }
  }

  await expect(page.getByText("6턴", { exact: true })).toBeVisible();
  await expect(page.getByTestId("phase-clock")).toHaveText("05");
});

test("map drag fades HUD and is not mistaken for a cell tap", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "galaxy-tab-s9-plus-landscape");

  await enterLocalOperation(page);
  await page
    .getByRole("button", { name: /요원 K 선택 · P3/ })
    .first()
    .click();
  const composer = page.locator(".command-panel");
  await composer.getByRole("button", { name: /이동.*칸당 \$200/ }).click();
  await expect(composer).toHaveCount(0);

  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  // Keep the gesture on an exposed map area, outside the command panel,
  // rails, map toolbar, destination list, and turn-lock dock.
  const startX = (box?.x ?? 0) + (box?.width ?? 0) * 0.7;
  const startY = (box?.y ?? 0) + (box?.height ?? 0) * 0.35;
  const shell = page.getByTestId("operation-screen");

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + 54, startY + 5, { steps: 5 });
  await expect(shell).toHaveAttribute("data-map-interacting", "true");
  await expect(page.locator(".operation-bar")).toHaveCSS("opacity", "0.09");
  await page.mouse.up();

  await expect(composer).toHaveCount(0);
  await expect(page.locator(".map-dom-controls")).not.toHaveAttribute(
    "open",
    "",
  );
  await expect(shell).not.toHaveAttribute("data-map-interacting", "true", {
    timeout: 1_500,
  });
});

test("purge confirmation is a real modal and restores focus", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-chromium");

  await enterLocalOperation(page);
  await page
    .getByRole("button", { name: /요원 K 선택 · P3/ })
    .first()
    .click();
  const purgeTrigger = page.getByRole("button", { name: /숙청.*\$2,000/ });
  await purgeTrigger.click();

  const dialog = page.getByRole("alertdialog", { name: "요원 K 숙청 초안" });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(
    true,
  );
  await expect(
    dialog.getByRole("button", { name: /요원 K 숙청 초안 저장/ }),
  ).toBeFocused();

  const mapStage = page.getByTestId("map-stage");
  const cameraSequence = await mapStage.getAttribute("data-camera-sequence");
  await page.keyboard.press("r");
  await expect(mapStage).toHaveAttribute(
    "data-camera-sequence",
    cameraSequence ?? "0",
  );

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(purgeTrigger).toBeFocused();

  await purgeTrigger.click();
  await dialog.getByRole("button", { name: /요원 K 숙청 초안 저장/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("button", { name: "패널 닫기" })).toHaveCount(0);
  await expect(page.getByText(/P3 · 숙청 · \$2,000/)).toBeVisible();
});

test("portrait shows the landscape-only blocking gate", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "portrait-orientation-guard");

  await page.goto("/");
  const gate = page.getByRole("dialog", { name: "가로 모드 전용" });
  await expect(gate).toBeVisible();
  await expect(gate).toContainText(
    "기기를 가로로 회전하면 작전을 계속할 수 있습니다.",
  );
  await expect(page.locator("[data-orientation-content]")).toHaveAttribute(
    "inert",
    "",
  );
  await expect(
    page.getByRole("button", {
      name: "바로 훈련 시작",
      includeHidden: true,
    }),
  ).toBeHidden();
});
