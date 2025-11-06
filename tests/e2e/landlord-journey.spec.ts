import { expect, test } from "@playwright/test";

const SUPABASE_WARNING = /Supabase credentials are not configured/i;

test.describe("Landlord journey smoke test", () => {
  test.use({ storageState: "./tests/e2e/fixtures/landlord.json" });

  test("navigates listing creation and messaging workflows", async ({ page }) => {
    await page.goto("/dashboard");
    const supabaseBanner = page.getByText(SUPABASE_WARNING, { exact: false });
    if ((await supabaseBanner.count()) > 0) {
      await expect(supabaseBanner).toBeVisible();
      return;
    }

    await test.step("Start a new listing draft", async () => {
      await page.goto("/listings/new");
      await expect(page.getByRole("heading", { name: /add a new property/i })).toBeVisible();
      await page.getByLabel(/listing title/i).fill("Automation Condo");
      await page.getByLabel(/monthly rent/i).fill("3100");
      await page.getByLabel(/city/i).fill("Toronto");
      await page.getByLabel(/description/i).fill("Playwright smoke listing.");
      await expect(page.getByText(SUPABASE_WARNING, { exact: false })).toBeVisible();
    });

    await test.step("Review the messaging inbox", async () => {
      await page.goto("/messages");
      await expect(page.getByRole("heading", { name: /conversations/i })).toBeVisible();
      const searchInput = page.getByRole("textbox", { name: /search conversations/i });
      await expect(searchInput).toBeVisible();
      await searchInput.fill("Playwright");
      const emptyState = page.getByText(/no conversations found/i);
      if ((await emptyState.count()) > 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });
});
