import { expect, test } from "@playwright/test";

test("home renders the 8a0 entry experience", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: /jogar agora/i })).toBeVisible();
  await expect(page.locator(".home-pitch")).toBeVisible();
});

test("play page can roll a squad", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("button", { name: /rolar/i }).click({ force: true });
  await expect(page.locator(".roll-result")).toBeVisible();
  await expect(page.locator(".player-card").first()).toBeVisible();
});

test("localized pages render", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("link", { name: /play now/i })).toBeVisible();
  await page.goto("/es/privacidade");
  await expect(page.getByRole("heading", { name: /privacidad/i })).toBeVisible();
});
