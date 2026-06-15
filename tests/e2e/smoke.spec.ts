import { expect, test, type Page } from "@playwright/test";

async function rollAndPlacePlayer(page: Page) {
  const filledBefore = await page.locator(".disc.slot-filled").count();
  await page.getByRole("button", { name: /rolar|sortear/i }).click({ force: true });
  await expect(page.locator(".roll-result")).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(".rolling-strip")).toHaveCount(0, { timeout: 10_000 });

  const selectable = page.locator(".player-card:not(.is-disabled)");
  for (let attempt = 0; attempt < 4 && (await selectable.count()) === 0; attempt += 1) {
    await page.getByRole("button", { name: /outra/i }).first().click();
    await expect(page.locator(".rolling-strip")).toHaveCount(0, { timeout: 10_000 });
  }

  await expect(selectable.first()).toBeVisible({ timeout: 10_000 });
  await selectable.first().click();
  await expect(page.locator(".disc.slot-pickable").first()).toBeVisible();
  await page.locator(".disc.slot-pickable").first().click();
  await expect(page.locator(".disc.slot-filled")).toHaveCount(filledBefore + 1);
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
  for (let index = 0; index < 11; index += 1) {
    await rollAndPlacePlayer(page);
  }
  await expect(page.getByRole("button", { name: /simular a copa/i })).toBeVisible({ timeout: 10_000 });
}

test("home renders the 8a0 entry experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /^time$/i })).toBeVisible();
  await expect(page.locator(".home-pitch")).toBeVisible();
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

  await expect(page.getByRole("button", { name: /^copa$/i })).toBeVisible();
  await expect(page.locator(".tournament-panel")).toHaveCount(0);

  await page.getByRole("button", { name: /^copa$/i }).click();
  await expect(page.locator(".tournament-panel")).toBeVisible();
  await expect(page.locator(".tour-team")).toHaveCount(4);
  await expect(page.locator(".tour-match-score.is-locked").first()).toBeVisible();

  await page.getByRole("button", { name: /revelar/i }).click();
  await expect(page.locator(".tour-match-score:not(.is-locked)").first()).toBeVisible();
  await page.getByRole("button", { name: /^rodada$/i }).click();
  await expect(page.locator(".tour-match-score:not(.is-locked)")).toHaveCount(2);
});

test("localized pages render", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: /^team$/i })).toBeVisible();
  await page.goto("/es/privacidade");
  await expect(page.getByRole("heading", { name: /privacidad/i })).toBeVisible();
});
