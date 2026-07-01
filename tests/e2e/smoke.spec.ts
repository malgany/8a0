import { expect, test, type Page } from "@playwright/test";

async function draftIsReady(page: Page) {
  const completePanel = await page.locator(".roll-result").filter({ hasText: /11\/11/ }).count();
  if (completePanel > 0) return true;
  return page
    .locator(".roll-panel .roll-btn")
    .filter({ hasText: /jogar online|play online|simular a copa/i })
    .first()
    .isVisible()
    .catch(() => false);
}

async function rollAndPlacePlayer(page: Page, options: { allowAutoComplete?: boolean } = {}) {
  const filledBefore = await page.locator(".disc.slot-filled").count();
  if (options.allowAutoComplete && (await draftIsReady(page))) return false;

  await page.getByRole("button", { name: /rolar|sortear/i }).click({ force: true });
  await expect(page.locator(".roll-result")).toBeVisible({ timeout: 10_000 });
  await page.locator(".rolling-strip").waitFor({ state: "visible", timeout: 1_000 }).catch(() => {});
  await expect(page.locator(".rolling-strip")).toHaveCount(0, { timeout: 10_000 });

  const selectable = page.locator(".player-card:not(.is-disabled):visible");
  for (let attempt = 0; attempt < 4 && (await selectable.count()) === 0; attempt += 1) {
    const reroll = page.locator(".reroll-btn").first();
    if ((await reroll.count()) === 0) {
      if (options.allowAutoComplete && (await draftIsReady(page))) return false;
      break;
    }
    await reroll.click({ force: true });
    await page.locator(".rolling-strip").waitFor({ state: "visible", timeout: 1_000 }).catch(() => {});
    await expect(page.locator(".rolling-strip")).toHaveCount(0, { timeout: 10_000 });
  }

  if (options.allowAutoComplete && (await draftIsReady(page))) return false;
  if (options.allowAutoComplete && (await selectable.count()) === 0) {
    const completed = await page
      .locator(".roll-result")
      .filter({ hasText: /11\/11/ })
      .waitFor({ state: "visible", timeout: 2_000 })
      .then(() => true)
      .catch(() => false);
    if (completed) return false;
    return false;
  }
  if (options.allowAutoComplete) {
    const nextState = await Promise.race([
      selectable.first().waitFor({ state: "visible", timeout: 10_000 }).then(() => "selectable" as const).catch(() => "none" as const),
      page
        .locator(".roll-result")
        .filter({ hasText: /11\/11/ })
        .waitFor({ state: "visible", timeout: 10_000 })
        .then(() => "ready" as const)
        .catch(() => "none" as const),
    ]);
    if (nextState !== "selectable") return false;
  } else {
    await expect(selectable.first()).toBeVisible({ timeout: 10_000 });
  }
  await selectable.first().click();
  await expect(page.locator(".disc.slot-pickable").first()).toBeVisible();
  await page.locator(".disc.slot-pickable").first().click();
  await expect(page.locator(".disc.slot-filled")).toHaveCount(filledBefore + 1);
  await expect(page.locator(".online-budget-preview")).toHaveCount(0);
  if (!(options.allowAutoComplete && (await draftIsReady(page)))) {
    await expect(page.getByRole("button", { name: /rolar|sortear/i })).toBeVisible({ timeout: 6_000 });
  }
  return true;
}

async function rollAndSelectMovablePlayer(page: Page) {
  await page.getByRole("button", { name: /rolar|sortear/i }).click({ force: true });
  await expect(page.locator(".roll-result")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".rolling-strip")).toHaveCount(0, { timeout: 10_000 });

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const candidates = await page.locator(".player-card:not(.is-disabled)").evaluateAll((cards) =>
      cards
        .map((card, index) => ({
          index,
          name: card.querySelector(".pc-name")?.textContent?.trim() ?? "",
          positions: card.querySelector(".pc-pos")?.textContent?.trim() ?? "",
        }))
        .filter((item) => item.name && (item.positions.includes("/") || item.positions.includes("+"))),
    );

    for (const candidate of candidates) {
      await page.locator(".player-card:not(.is-disabled)").nth(candidate.index).click();
      if ((await page.locator(".disc.slot-pickable").count()) > 1) return candidate;
      await page.locator(".player-card.is-active").click();
    }

    await page.getByRole("button", { name: /outra/i }).first().click();
    await expect(page.locator(".rolling-strip")).toHaveCount(0, { timeout: 10_000 });
  }

  throw new Error("Could not find a movable multi-position player");
}

async function completeLineup(page: Page) {
  for (let index = 0; index < 11 && !(await draftIsReady(page)); index += 1) {
    await rollAndPlacePlayer(page, { allowAutoComplete: true });
  }
  await expect(page.getByRole("button", { name: /simular a copa/i })).toBeVisible({ timeout: 10_000 });
}

test("home renders the 8a0 entry experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /jogar|time/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /^online$/i })).toBeVisible();
  await expect(page.locator(".home-pitch")).toBeVisible();
});

test("secret showcase code opens a completed lineup", async ({ page }) => {
  await page.goto("/");
  const numbers = page.locator(".home-pitch .hp-c");
  for (const index of [0, 9, 10, 5, 5, 1]) {
    await numbers.nth(index).click();
  }
  await page.locator(".home-cta-main").first().click();
  await expect(page.locator(".roll-result").filter({ hasText: /11\/11/ })).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".disc.slot-filled")).toHaveCount(11);
  await expect(page.getByRole("button", { name: /simular a copa|simulate/i })).toBeVisible();
});

test("placed multi-position players can move to another open slot", async ({ page }) => {
  await page.goto("/play");
  await page.waitForLoadState("networkidle");

  const candidate = await rollAndSelectMovablePlayer(page);
  await page.locator(".disc.slot-pickable").first().click();
  await expect(page.locator(".disc.slot-filled").filter({ hasText: candidate.name })).toHaveCount(1);

  const placedDisc = page.locator(".disc.slot-filled").filter({ hasText: candidate.name });
  const beforeMove = await placedDisc.evaluate((disc) => [...document.querySelectorAll(".disc")].indexOf(disc));
  await placedDisc.click();

  await expect(page.locator(".disc.move-from").filter({ hasText: candidate.name })).toHaveCount(1);
  await expect(page.locator(".disc.move-target").first()).toBeVisible();
  await page.locator(".disc.move-target").first().click();

  await expect(page.locator(".disc.move-from")).toHaveCount(0);
  await expect(page.locator(".disc.move-target")).toHaveCount(0);
  await expect(page.locator(".disc.slot-filled").filter({ hasText: candidate.name })).toHaveCount(1);
  const afterMove = await page
    .locator(".disc.slot-filled")
    .filter({ hasText: candidate.name })
    .evaluate((disc) => [...document.querySelectorAll(".disc")].indexOf(disc));
  expect(afterMove).not.toBe(beforeMove);
});

test("play page can roll, simulate, and inspect the Cup panel", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/play");
  await page.waitForLoadState("networkidle");
  await completeLineup(page);
  await page.getByRole("button", { name: /simular a copa/i }).click({ force: true });
  await expect(page.locator(".reveal-wrap")).toBeVisible({ timeout: 10_000 });

  const tableButton = page.getByRole("button", { name: /ver tabela|view table|ver tabla/i });
  await expect(tableButton).toBeVisible();
  await expect(page.locator(".tour-modal")).toHaveCount(0);

  await tableButton.click();
  await expect(page.locator(".tour-modal")).toBeVisible();
  await expect(page.getByRole("table", { name: /grupo/i }).first()).toBeVisible();
  await page.getByRole("button", { name: /fechar|close|cerrar|x/i }).click();

  await page.getByRole("button", { name: /revelar/i }).click();
  await tableButton.click();
  await expect(page.locator(".tour-modal")).toBeVisible();
});

test("online flow creates a team, drafts a lineup, and plays the first campaign match", async ({ page }) => {
  test.setTimeout(220_000);
  await page.goto("/");
  await page.getByRole("link", { name: /^online$/i }).click();
  await expect(page.getByRole("button", { name: /convidado|guest/i })).toBeVisible();
  await page.getByRole("button", { name: /convidado|guest/i }).click();

  const teamName = page.getByPlaceholder(/nome do time|team name/i);
  await expect(teamName).toBeFocused();
  await teamName.fill("Time!@#_Teste-123456789999");
  await expect(teamName).toHaveValue("Time_Teste-123456");

  const firstPixel = page.locator(".flag-pixel").first();
  await firstPixel.click();
  await expect(firstPixel).toHaveCSS("background-color", "rgb(17, 17, 17)");
  await page.getByRole("button", { name: /borracha|eraser/i }).click();
  await firstPixel.click();
  await expect(firstPixel).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");

  await page.getByRole("button", { name: /salvar|save/i }).click();
  await expect(page.getByText(/pontos/i)).toBeVisible();

  await page.getByRole("button", { name: /rolar|sortear/i }).click({ force: true });
  await expect(page.locator(".roll-result")).toBeVisible({ timeout: 10_000 });
  await page.locator(".rolling-strip").waitFor({ state: "visible", timeout: 1_000 }).catch(() => {});
  await expect(page.locator(".rolling-strip")).toHaveCount(0, { timeout: 10_000 });
  const startingPoints = Number((await page.locator(".online-budget-value").innerText()).replace(/\D/g, ""));
  const firstSelectable = page.locator(".player-card:not(.is-disabled):visible").first();
  await expect(firstSelectable).toBeVisible({ timeout: 10_000 });
  const selectedForce = Number((await firstSelectable.locator(".pc-force").innerText()).replace(/\D/g, ""));
  await firstSelectable.click();
  await expect(page.locator(".online-budget-preview")).toHaveCount(0);
  await expect(page.locator(".online-budget-value")).toHaveText(String(startingPoints));
  await page.locator(".disc.slot-pickable").first().click();
  await expect(page.locator(".online-budget-value")).toHaveText(String(Math.max(0, startingPoints - selectedForce)), { timeout: 5_000 });
  await expect(page.getByRole("button", { name: /rolar|sortear/i })).toBeVisible({ timeout: 6_000 });

  for (let index = 0; index < 10 && !(await draftIsReady(page)); index += 1) {
    await rollAndPlacePlayer(page, { allowAutoComplete: true });
  }

  await expect(page.getByRole("button", { name: /jogar online|play online/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: /jogar online|play online/i }).click({ force: true });
  await expect(page.getByText(/1\s*\/\s*8/)).toBeVisible({ timeout: 10_000 });
  const firstStepGeometry = await page.locator(".campaign-track").evaluate((track) => {
    const first = track.querySelector(".campaign-step")!.getBoundingClientRect();
    const line = track.querySelector(".campaign-line")!.getBoundingClientRect();
    const rect = track.getBoundingClientRect();
    const firstCenter = first.left + first.width / 2;
    return {
      scrollLeft: track.scrollLeft,
      centerDelta: Math.abs(firstCenter - (rect.left + rect.width / 2)),
      lineStartDelta: Math.abs(line.left - firstCenter),
    };
  });
  expect(firstStepGeometry.scrollLeft).toBe(0);
  expect(firstStepGeometry.centerDelta).toBeLessThan(2);
  expect(firstStepGeometry.lineStartDelta).toBeLessThan(2);
  await page.getByRole("button", { name: /^jogar$|^play$/i }).click();
  await expect(page.locator(".campaign-goals")).toBeVisible();
  await expect(page.getByText(/finalizado|finished/i)).toBeVisible({ timeout: 30_000 });

  const advanced = await page.locator(".campaign-step").nth(1).isEnabled().catch(() => false);
  if (advanced) {
    await expect(page.locator(".campaign-step.is-done")).toHaveCount(1);
    await expect(page.locator(".campaign-step").nth(1)).toBeEnabled();

    const beforeScroll = await page.locator(".campaign-track").evaluate((element) => element.scrollLeft);
    await page.locator(".campaign-track").dispatchEvent("wheel", { deltaY: 260, shiftKey: true });
    const afterScroll = await page.locator(".campaign-track").evaluate((element) => element.scrollLeft);
    expect(afterScroll).toBeGreaterThan(beforeScroll);
    await expect(page.getByText(/2\s*\/\s*8/)).toBeVisible({ timeout: 5_000 });
  } else {
    await expect(page.locator(".campaign-retry-btn")).toBeVisible();
  }
});

test("localized pages render", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: /^team$/i })).toBeVisible();
  await page.goto("/es/privacidade");
  await expect(page.getByRole("heading", { name: /privacidad/i })).toBeVisible();
});
