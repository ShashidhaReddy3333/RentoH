import { test, expect } from "@playwright/test";

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Featured homes|Search/i)).toBeVisible();
});

test("browse renders", async ({ page }) => {
  await page.goto("/browse");
  await expect(page.getByText(/Search results|No homes match/i)).toBeVisible();
});

test("auth sign-in renders", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
});
