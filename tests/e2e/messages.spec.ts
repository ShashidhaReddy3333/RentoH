import { test, expect } from "@playwright/test";

test.describe("Messages workspace", () => {
  test("shows existing conversations", async ({ page }) => {
    await page.goto("/messages");

    await expect(page.getByRole("heading", { level: 1, name: "Messages" })).toBeVisible();

    const firstConversation = page.locator("[data-testid^=\"thread-\"]").first();
    await expect(firstConversation).toBeVisible();
    await firstConversation.click();

    await expect(page.getByText("Looking forward to meeting you for the tour!", { exact: false })).toBeVisible();
  });
});
