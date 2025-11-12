import { test, expect } from '@playwright/test';
const BYPASS = process.env["BYPASS_SUPABASE_AUTH"] === "1";
test.skip(BYPASS, "Supabase-disabled environment; skipping spec.");

test.describe('Sign-in Reliability', () => {
  test('handles timeout gracefully', async ({ page, context }) => {
    // Simulate slow network by blocking Supabase auth requests
    await context.route('**/*supabase.co/auth/**', async (route) => {
      // Wait 16 seconds (longer than our 15s timeout)
      await new Promise(resolve => setTimeout(resolve, 16000));
      await route.abort('timedout');
    });

    await page.goto('/auth/sign-in');

    // Fill in credentials
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');

    // Click sign in
    await page.click('button[type="submit"]');

    // Should show timeout error message
    await expect(page.locator('text=Connection timed out')).toBeVisible({ timeout: 20000 });

    // Button should be enabled again (busy state cleared)
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('handles network errors gracefully', async ({ page, context }) => {
    // Simulate network error
    await context.route('**/*supabase.co/auth/**', async (route) => {
      await route.abort('failed');
    });

    await page.goto('/auth/sign-in');

    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Should show network error message
    await expect(
      page.locator('text=/Network error|Connection|failed/i')
    ).toBeVisible({ timeout: 5000 });

    // Button should be enabled again
    await expect(page.locator('button[type="submit"]')).toBeEnabled();
  });

  test('displays busy state during sign-in', async ({ page }) => {
    await page.goto('/auth/sign-in');

    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');

    // Click sign in
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Should immediately show "Signing in..." text
    await expect(submitButton).toContainText('Signing in...', { timeout: 100 });
    
    // Button should be disabled while signing in
    await expect(submitButton).toBeDisabled();
  });

  test('clears error on subsequent attempt', async ({ page, context }) => {
    // First attempt: simulate error
    await context.route('**/*supabase.co/auth/**', async (route, _request) => {
      await route.abort('failed');
    });

    await page.goto('/auth/sign-in');

    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');

    // Wait for error to appear
    const errorMessage = page.locator('[role="alert"]');
    await expect(errorMessage).toBeVisible();

    // Second attempt: clear route and try again
    await context.unroute('**/*supabase.co/auth/**');
    
    await page.fill('#password', 'newpassword123');
    await page.click('button[type="submit"]');

    // Error should clear when starting new attempt
    await expect(errorMessage).not.toBeVisible({ timeout: 1000 });
  });
});
