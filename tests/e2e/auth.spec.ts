import { test, expect } from "@playwright/test";

test.describe("Auth surfaces", () => {
  test("renders the sign-in form with accessible labels", async ({ page }) => {
    await page.goto("/auth/sign-in");

    await expect(page.getByRole("heading", { name: /welcome back/i })).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();

    await expect(page.getByRole("button", { name: /sign in/i })).toBeEnabled();
  });

  test("offers navigation to the sign-up route", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByRole("link", { name: /create an account/i }).click();
    await expect(page).toHaveURL(/\/auth\/sign-up$/);
  });
});
