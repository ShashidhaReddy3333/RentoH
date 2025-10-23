import { test, expect } from "@playwright/test";

test.describe("Messages workspace", () => {
  test("sends a mock chat message", async ({ page }) => {
    await page.goto("/messages");

    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();

    const firstConversation = page.locator("nav button").first();
    await expect(firstConversation).toBeVisible();
    await firstConversation.click();

    const composer = page.getByLabel("Message");
    await composer.fill("Is the unit still available this weekend?");
    await page.getByRole("button", { name: /^Send$/ }).click();

    await expect(page.getByText("Is the unit still available this weekend?").first()).toBeVisible();
  });
});
