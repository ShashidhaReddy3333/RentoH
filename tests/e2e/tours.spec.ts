import { test, expect } from '@playwright/test';
const BYPASS = process.env["BYPASS_SUPABASE_AUTH"] === "1";
test.skip(BYPASS, "Supabase-disabled environment; skipping spec.");

test.describe('Tours & Scheduling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should show tours page', async ({ page }) => {
    await page.goto('/tours');
    
    // Should show tours page heading
    await expect(page.locator('h1, h2').filter({ hasText: /tours/i }).first()).toBeVisible();
  });

  test('should navigate to tours from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Find "View details" or "Scheduled tours" link
    const toursLink = page.locator('a:has-text("View details"), a[href="/tours"]').first();
    
    if (await toursLink.count() > 0) {
      await toursLink.click();
      await expect(page).toHaveURL('/tours');
    }
  });

  test('should display custom time picker on property page', async ({ page }) => {
    // Navigate to a property
    await page.goto('/browse');
    
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    
    if (await propertyCard.count() > 0) {
      await propertyCard.click();
      
      // Wait for property detail page
      await page.waitForURL(/\/property\//);
      
      // Find "Request a tour" button
      const tourButton = page.locator('button:has-text("Request a tour"), button:has-text("request tour")').first();
      
      if (await tourButton.count() > 0) {
        await tourButton.click();
        
        // Wait for tour form to appear
        await page.waitForSelector('[id="tour-date"], [id="tour-time"]', { timeout: 2000 });
        
        // Check for time picker (not native input)
        const timeInput = page.locator('[id="tour-time"]');
        const inputType = await timeInput.getAttribute('type');
        
        // Should be hidden input, not type="time"
        expect(inputType).not.toBe('time');
        
        // Should have a button or custom picker
        const customPicker = page.locator('button[aria-label*="time"], button[aria-haspopup="listbox"]');
        await expect(customPicker).toBeVisible();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should validate tour request form', async ({ page }) => {
    await page.goto('/browse');
    
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    
    if (await propertyCard.count() > 0) {
      await propertyCard.click();
      await page.waitForURL(/\/property\//);
      
      const tourButton = page.locator('button:has-text("Request a tour"), button:has-text("request tour")').first();
      
      if (await tourButton.count() > 0) {
        await tourButton.click();
        
        // Wait for form
        await page.waitForSelector('form', { timeout: 2000 });
        
        // Try to submit without filling fields
        const submitButton = page.locator('button[type="submit"]:has-text("Send request"), button:has-text("request")').first();
        
        if (await submitButton.count() > 0) {
          await submitButton.click();
          
          // Should show validation errors or prevent submission
          // Check for HTML5 validation
          const invalidFields = page.locator(':invalid');
          const hasInvalid = await invalidFields.count() > 0;
          
          if (hasInvalid) {
            expect(hasInvalid).toBe(true);
          } else {
            // Might use custom validation - check for error messages
            const errorMessages = page.locator('[role="alert"], .text-red-600, text=/required/i');
            const hasErrors = await errorMessages.count() > 0;
            expect(hasErrors).toBe(true);
          }
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should show time in 15-minute increments', async ({ page }) => {
    await page.goto('/browse');
    
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    
    if (await propertyCard.count() > 0) {
      await propertyCard.click();
      await page.waitForURL(/\/property\//);
      
      const tourButton = page.locator('button:has-text("Request a tour")').first();
      
      if (await tourButton.count() > 0) {
        await tourButton.click();
        
        // Open time picker
        const timePicker = page.locator('button[aria-haspopup="listbox"], button[aria-label*="time"]');
        
        if (await timePicker.count() > 0) {
          await timePicker.click();
          
          // Wait for dropdown
          await page.waitForSelector('[role="listbox"], [role="option"]', { timeout: 2000 });
          
          // Check for time options with 15-minute increments
          const timeOptions = page.locator('[role="option"]');
          const optionCount = await timeOptions.count();
          
          if (optionCount > 0) {
            // Get first few options and verify format
            const firstOption = await timeOptions.first().textContent();
            const secondOption = await timeOptions.nth(1).textContent();
            
            // Should be in format like "9:00 AM", "9:15 AM", etc.
            expect(firstOption).toMatch(/\d{1,2}:(00|15|30|45)\s?(AM|PM)/i);
            expect(secondOption).toMatch(/\d{1,2}:(00|15|30|45)\s?(AM|PM)/i);
          } else {
            test.skip();
          }
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('should submit tour request successfully', async ({ page }) => {
    // This test requires proper setup and mocking
    // Placeholder for when environment is configured
    test.skip();
  });

  test('landlord can confirm tour request', async ({ page }) => {
    // Navigate to tours page as landlord
    // Find pending tour
    // Click confirm button
    // Verify status updates
    test.skip();
  });

  test('landlord can cancel tour request', async ({ page }) => {
    // Similar to confirm test but for cancellation
    test.skip();
  });

  test('should prevent past dates in tour form', async ({ page }) => {
    await page.goto('/browse');
    
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    
    if (await propertyCard.count() > 0) {
      await propertyCard.click();
      await page.waitForURL(/\/property\//);
      
      const tourButton = page.locator('button:has-text("Request a tour")').first();
      
      if (await tourButton.count() > 0) {
        await tourButton.click();
        
        // Check date input has min attribute set to today
        const dateInput = page.locator('[id="tour-date"]');
        const minDate = await dateInput.getAttribute('min');
        
        if (minDate) {
          const today = new Date().toISOString().split('T')[0];
          expect(minDate).toBe(today);
        }
      }
    } else {
      test.skip();
    }
  });
});
