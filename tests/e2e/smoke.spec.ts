import { expect, test, type Page } from "@playwright/test";

async function rollAndPlacePlayer(page: Page) {
  const filledBefore = await page.locator(".disc.slot-filled").count();
  await page.getByRole("button", { name: /rolar/i }).click({ force: true });
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
