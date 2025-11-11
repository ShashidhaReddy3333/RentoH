import { test, expect } from "@playwright/test";
const BYPASS = process.env["BYPASS_SUPABASE_AUTH"] === "1";
test.skip(BYPASS, "Supabase-disabled environment; skipping spec.");

test.describe("Messaging Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Ensure authenticated as tenant
    await page.goto("/messages");
  });

  test("can send a message to landlord", async ({ page }) => {
    // Start by viewing a property
    await page.goto("/browse");
    await page.locator("[data-testid=property-card]").first().click();
    
    // Click contact button
    await page.getByRole("button", { name: /contact landlord/i }).click();
    
    // Send an inquiry
    const message = "Hi, I'm interested in viewing this property. Is it still available?";
    await page.getByPlaceholder(/type.*message/i).fill(message);
    await page.getByRole("button", { name: /send/i }).click();
    
    // Verify message sent
    await expect(page.getByText(message)).toBeVisible();
    await expect(page.getByText(/sent/i)).toBeVisible();
  });

  test("shows message history", async ({ page }) => {
    // Navigate to messages
    await page.goto("/messages");
    
    // Check conversation list
    await expect(page.locator("[data-testid=chat-list]")).toBeVisible();
    
    // Select first conversation
    await page.locator("[data-testid=chat-thread]").first().click();
    
    // Verify message thread loads
    await expect(page.locator("[data-testid=chat-messages]")).toBeVisible();
    await expect(page.getByPlaceholder(/type.*message/i)).toBeVisible();
  });

  test("message input validation", async ({ page }) => {
    await page.goto("/messages");
    
    // Select first conversation
    await page.locator("[data-testid=chat-thread]").first().click();
    
    // Try to send empty message
    await page.getByRole("button", { name: /send/i }).click();
    
    // Verify button remains disabled
    await expect(page.getByRole("button", { name: /send/i })).toBeDisabled();
    
    // Type a message
    await page.getByPlaceholder(/type.*message/i).fill("Test message");
    
    // Verify button enables
    await expect(page.getByRole("button", { name: /send/i })).toBeEnabled();
  });

  test("updates read status", async ({ page }) => {
    await page.goto("/messages");
    
    // Find unread conversation
    const unreadThread = page.locator("[data-testid=chat-thread]").filter({ has: page.locator("[data-testid=unread-indicator]") }).first();
    
    // Click the thread
    await unreadThread.click();
    
    // Wait for messages to load and mark as read
    await expect(page.locator("[data-testid=chat-messages]")).toBeVisible();
    
    // Verify unread indicator is removed
    await expect(unreadThread.locator("[data-testid=unread-indicator]")).not.toBeVisible();
  });
});
