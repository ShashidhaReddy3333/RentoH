import { test, expect } from "@playwright/test";

const SUPABASE_WARNING = "Supabase credentials are not configured.";

test.describe("Auth surfaces", () => {
  test("renders the sign-in surface", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const warning = page.getByText(SUPABASE_WARNING, { exact: false });
    if (await warning.count()) {
      await expect(warning).toBeVisible();
      return;
    }

    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  test("offers navigation to the sign-up route when enabled", async ({ page }) => {
    await page.goto("/auth/sign-in");

    const warning = page.getByText(SUPABASE_WARNING, { exact: false });
    if (await warning.count()) {
      await expect(warning).toBeVisible();
      return;
    }

    await page.getByRole("link", { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/auth\/sign-up$/);
  });
});
