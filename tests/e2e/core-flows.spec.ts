import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("can navigate to sign in page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/auth/sign-in");
  });

  test("validates email format", async ({ page }) => {
    await page.goto("/auth/sign-in");
    await page.getByLabel(/email/i).fill("invalid-email");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid email/i)).toBeVisible();
  });
});

test.describe("Browse Properties Flow", () => {
  test("can filter properties", async ({ page }) => {
    await page.goto("/browse");
    
    // Open filters panel
    await page.getByRole("button", { name: /filters/i }).click();
    
    // Set min price
    await page.getByLabel(/minimum/i).fill("1500");
    
    // Set property type
    await page.getByRole("button", { name: /property type/i }).click();
    await page.getByRole("button", { name: /apartment/i }).click();
    
    // Apply filters
    await page.getByRole("button", { name: /apply/i }).click();
    
    // Verify URL params
    await expect(page).toHaveURL(/min=1500/);
    await expect(page).toHaveURL(/type=apartment/);
  });

  test("can sort properties", async ({ page }) => {
    await page.goto("/browse");
    await page.getByRole("button", { name: /sort/i }).click();
    await page.getByRole("menuitem", { name: /price: low to high/i }).click();
    await expect(page).toHaveURL(/sort=priceAsc/);
  });
});

test.describe("Property Details Flow", () => {
  test("can view property details", async ({ page }) => {
    // Navigate to the first property card
    await page.goto("/browse");
    const firstProperty = page.locator("[data-testid=property-card]").first();
    const propertyTitle = await firstProperty.locator("h3").textContent();
    await firstProperty.click();
    
    // Verify details are shown
    await expect(page.getByRole("heading", { name: propertyTitle ?? "" })).toBeVisible();
    await expect(page.getByTestId("property-gallery")).toBeVisible();
    await expect(page.getByTestId("property-about")).toBeVisible();
  });
});

test.describe("Favorites Flow", () => {
  test.use({ storageState: "./tests/e2e/fixtures/authenticated.json" });

  test("can favorite a property", async ({ page }) => {
    await page.goto("/browse");
    const favoriteButton = page.locator("[data-testid=favorite-button]").first();
    await favoriteButton.click();
    await expect(favoriteButton).toHaveAttribute("aria-pressed", "true");
    
    // Verify favorite appears in favorites list
    await page.goto("/favorites");
    await expect(page.locator("[data-testid=property-card]")).toHaveCount(1);
  });
});