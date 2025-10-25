import { test, expect } from "@playwright/test";

test.describe("Create listing flow", () => {
  test.beforeEach(async ({ page }) => {
    // Start from the new listing page
    await page.goto("/listings/new");
    await expect(page.getByRole("heading", { name: /add a new property/i })).toBeVisible();
  });

  test("submits a valid listing form", async ({ page }) => {
    // Fill required fields
    await page.getByLabel(/title/i).fill("Playwright Tower Suite");
    await page.getByLabel(/rent.*month/i).fill("2100");
    await page.getByLabel(/street address/i).fill("123 Testing Way");
    await page.getByLabel(/city/i).fill("Waterloo");
    await page.getByLabel(/postal code/i).fill("N2L 0A1");
    await page.getByLabel(/property type/i).selectOption("apartment");
    await page.getByLabel(/description/i).fill("Bright two bedroom unit generated via automated test.");

    // Fill optional fields
    await page.getByLabel(/bedrooms/i).fill("2");
    await page.getByLabel(/bathrooms/i).fill("2");
    await page.getByLabel(/area/i).fill("1000");
    await page.getByLabel(/pets allowed/i).check();

    // Submit and verify
    await page.getByRole("button", { name: /save listing/i }).click();
    await expect(page.getByLabel(/title/i)).toHaveValue("");
    await expect(page.getByLabel(/rent.*month/i)).toHaveValue("");
    await expect(page.locator("[role=\"alert\"]")).toHaveCount(0);
  });

  test("validates required fields", async ({ page }) => {
    // Try to submit empty form
    await page.getByRole("button", { name: /save listing/i }).click();
    
    // Verify error messages
    await expect(page.getByText(/title.*required/i)).toBeVisible();
    await expect(page.getByText(/rent.*required/i)).toBeVisible();
    await expect(page.getByText(/street.*required/i)).toBeVisible();
    await expect(page.getByText(/city.*required/i)).toBeVisible();
    await expect(page.getByText(/postal code.*required/i)).toBeVisible();
    await expect(page.getByText(/description.*required/i)).toBeVisible();
  });

  test("validates field formats", async ({ page }) => {
    // Test invalid values
    await page.getByLabel(/rent.*month/i).fill("-100");
    await page.getByLabel(/postal code/i).fill("12");
    await page.getByLabel(/title/i).fill("x"); // Too short
    await page.getByLabel(/description/i).fill("short"); // Too short

    await page.getByRole("button", { name: /save listing/i }).click();
    
    // Verify specific error messages
    await expect(page.getByText(/rent.*greater than zero/i)).toBeVisible();
    await expect(page.getByText(/postal code.*3 characters/i)).toBeVisible();
    await expect(page.getByText(/title.*3 characters/i)).toBeVisible();
    await expect(page.getByText(/description.*10 characters/i)).toBeVisible();
  });

  test("can save draft and resume editing", async ({ page }) => {
    // Fill partial form
    await page.getByLabel(/title/i).fill("Draft Tower Suite");
    await page.getByLabel(/rent.*month/i).fill("2200");
    await page.getByLabel(/description/i).fill("This is a draft listing being tested.");

    // Save as draft
    await page.getByRole("button", { name: /save draft/i }).click();

    // Verify draft saved
    await expect(page.getByText(/draft saved/i)).toBeVisible();

    // Reload page and verify draft loaded
    await page.reload();
    await expect(page.getByLabel(/title/i)).toHaveValue("Draft Tower Suite");
    await expect(page.getByLabel(/rent.*month/i)).toHaveValue("2200");
    await expect(page.getByLabel(/description/i)).toHaveValue("This is a draft listing being tested.");
  });
});





