import { test, expect } from "@playwright/test";

test("home renders", async ({ page }) => {
  await page.goto("/");
  // Use a stable test id to avoid strict-mode ambiguity
  await expect(page.getByTestId("search-submit")).toBeVisible();
});

test("browse renders", async ({ page }) => {
  await page.goto("/browse");
  const status = page.locator('span[role="status"]');
  await expect(status.first()).toContainText(/Showing|results/);
});

test("auth sign-in renders", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
});
