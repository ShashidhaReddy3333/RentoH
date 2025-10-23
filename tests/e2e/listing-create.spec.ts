import { test, expect } from "@playwright/test";

test.describe("Create listing flow", () => {
  test("submits the mocked new listing form", async ({ page }) => {
    await page.goto("/listings/new");

    await expect(page.getByRole("heading", { name: /add a new property/i })).toBeVisible();

    await page.getByLabel("Title").fill("Playwright Tower Suite");
    await page.getByLabel("Rent per month ($)").fill("2100");
    await page.getByLabel("Street address").fill("123 Testing Way");
    await page.getByLabel("City").fill("Waterloo");
    await page.getByLabel("Postal code").fill("N2L 0A1");
    await page.getByLabel("Property type").selectOption("apartment");
    await page.getByLabel("Description").fill("Bright two bedroom unit generated via automated test.");

    await page.getByRole("button", { name: /Save listing/i }).click();

    await expect(
      page.getByText("Property saved! Redirecting you to manage the listing...")
    ).toBeVisible();
  });
});
