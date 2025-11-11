import { test, expect } from "@playwright/test";
const BYPASS = process.env["BYPASS_SUPABASE_AUTH"] === "1";
test.skip(BYPASS, "Supabase-disabled environment; skipping spec.");

test("sign-in form renders", async ({ page }) => {
  await page.goto("/auth/sign-in");
  await expect(page.getByRole("button", { name: /Sign in/i })).toBeVisible();
});

test("browse page loads", async ({ page }) => {
  await page.goto("/browse");
  await expect(page.getByText(/Search|Results/i)).toBeVisible();
});

test.skip("favorite toggle mock", async ({ page }) => {
  await page.goto("/browse");
  const btn = page.getByRole("button", { name: /Favorite|Save/i }).first();
  await btn.click();
  await expect(page.getByText(/Saved|Favorited/i)).toBeVisible();
});
