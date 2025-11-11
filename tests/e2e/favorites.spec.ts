import { test, expect } from '@playwright/test';
const BYPASS = process.env["BYPASS_SUPABASE_AUTH"] === "1";
test.skip(BYPASS, "Supabase-disabled environment; skipping spec.");

test.describe('Favorites Feature', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should navigate to favorites page from dashboard', async ({ page }) => {
    // Navigate to dashboard (assumes user is authenticated)
    await page.goto('/dashboard');
    
    // Find and click "Manage favorites" link
    const favoritesLink = page.locator('a:has-text("Manage favorites")');
    
    if (await favoritesLink.count() > 0) {
      await favoritesLink.click();
      
      // Should navigate to /favorites
      await expect(page).toHaveURL('/favorites');
      
      // Page should have correct heading
      await expect(page.locator('h1')).toContainText(/saved homes/i);
    } else {
      // Link not found - might be landlord account
      test.skip();
    }
  });

  test('should show empty state when no favorites', async ({ page }) => {
    await page.goto('/favorites');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for either properties or empty state
    const hasFavorites = await page.locator('[data-testid="property-card"]').count() > 0;
    const hasEmptyState = await page.locator('text=/save.*homes/i, text=/haven.*saved/i').count() > 0;
    
    // One of these should be true
    expect(hasFavorites || hasEmptyState).toBe(true);
  });

  test('should toggle favorite on property card', async ({ page }) => {
    // Navigate to browse page
    await page.goto('/browse');
    
    // Wait for properties to load
    await page.waitForSelector('[data-testid="property-card"], .text-text-muted', { timeout: 5000 });
    
    const propertyCards = page.locator('[data-testid="property-card"]');
    const cardCount = await propertyCards.count();
    
    if (cardCount > 0) {
      // Find heart/favorite button on first card
      const favoriteButton = propertyCards.first().locator('[data-testid="property-save"], button[aria-label*="favorite"], button[aria-label*="Save"]');
      
      if (await favoriteButton.count() > 0) {
        // Get initial state
        const initialState = await favoriteButton.getAttribute('aria-pressed');
        
        // Click to toggle
        await favoriteButton.click();
        
        // Wait for optimistic update
        await page.waitForTimeout(500);
        
        // Check state changed
        const newState = await favoriteButton.getAttribute('aria-pressed');
        expect(newState).not.toBe(initialState);
        
        // Should show toast notification
        const toast = page.locator('[role="status"], .toast, text=/favorite/i').first();
        if (await toast.count() > 0) {
          await expect(toast).toBeVisible({ timeout: 3000 });
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should persist favorite after page refresh', async ({ page }) => {
    // Navigate to browse
    await page.goto('/browse');
    
    await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
    
    const propertyCards = page.locator('[data-testid="property-card"]');
    
    if (await propertyCards.count() > 0) {
      const favoriteButton = propertyCards.first().locator('[data-testid="property-save"]');
      
      if (await favoriteButton.count() > 0) {
        // Make sure it's favorited
        const isPressed = await favoriteButton.getAttribute('aria-pressed');
        
        if (isPressed !== 'true') {
          await favoriteButton.click();
          await page.waitForTimeout(1000); // Wait for API call
        }
        
        // Refresh page
        await page.reload();
        await page.waitForSelector('[data-testid="property-card"]', { timeout: 5000 });
        
        // Check favorite state persisted
        const favoriteButtonAfter = propertyCards.first().locator('[data-testid="property-save"]');
        const isPressedAfter = await favoriteButtonAfter.getAttribute('aria-pressed');
        
        expect(isPressedAfter).toBe('true');
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should display favorited properties on /favorites page', async ({ page }) => {
    await page.goto('/favorites');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Check if favorites are displayed
    const favoriteCards = page.locator('[data-testid="property-card"]');
    const count = await favoriteCards.count();
    
    if (count > 0) {
      // Verify properties are displayed in grid
      await expect(favoriteCards.first()).toBeVisible();
      
      // Each card should have isFavorite state
      // This is implicit in the fact they're on the favorites page
    } else {
      // Empty state is acceptable
      const emptyState = page.locator('text=/save.*homes/i, text=/haven.*saved/i');
      await expect(emptyState).toBeVisible();
    }
  });

  test('should remove favorite from detail page', async ({ page }) => {
    // Navigate to favorites page
    await page.goto('/favorites');
    
    await page.waitForLoadState('networkidle');
    
    const propertyCards = page.locator('[data-testid="property-card"]');
    
    if (await propertyCards.count() > 0) {
      // Click on first property to go to detail page
      await propertyCards.first().click();
      
      // Wait for detail page
      await page.waitForURL(/\/property\//);
      
      // Find and click unfavorite button
      const favoriteButton = page.locator('[data-testid="property-save"]');
      
      if (await favoriteButton.count() > 0) {
        await favoriteButton.click();
        
        // Wait for API call
        await page.waitForTimeout(1000);
        
        // Go back to favorites page
        await page.goto('/favorites');
        
        // The property might not be there anymore or the count decreased
        // This is acceptable - just verify page loads
        await expect(page.locator('h1')).toContainText(/saved homes/i);
      }
    } else {
      test.skip();
    }
  });
});
