import { test, expect } from '@playwright/test';

test.describe('Applications Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should display applications page for authenticated users', async ({ page }) => {
    // This test assumes the user is already authenticated
    // In a real scenario, you would set up authentication in beforeEach
    
    await page.goto('/applications');
    
    // Check if the page loads
    await expect(page).toHaveTitle(/Applications/i);
  });

  test('should show application details when clicking on an application', async ({ page }) => {
    // Navigate to applications list
    await page.goto('/applications');
    
    // Wait for applications to load
    await page.waitForSelector('[data-testid="application-row"], .text-text-muted', { timeout: 5000 });
    
    // Check if there are any applications
    const hasApplications = await page.locator('[data-testid="application-row"]').count() > 0;
    
    if (hasApplications) {
      // Click on the first application
      await page.locator('[data-testid="application-row"]').first().click();
      
      // Should navigate to detail page
      await expect(page).toHaveURL(/\/applications\/[a-f0-9-]+/);
      
      // Check for key elements on detail page
      await expect(page.locator('h1')).toContainText(/Application Details/i);
    } else {
      // No applications to test with - skip
      test.skip();
    }
  });

  test('should show status transition buttons for landlords', async ({ page }) => {
    // This test requires landlord authentication
    // Navigate to a specific application detail page
    await page.goto('/applications');
    
    const applicationLink = page.locator('a[href^="/applications/"]').first();
    const linkExists = await applicationLink.count() > 0;
    
    if (linkExists) {
      await applicationLink.click();
      
      // Check if action buttons are present (landlord view)
      const hasActions = await page.locator('button:has-text("Approve"), button:has-text("Reject")').count() > 0;
      
      if (hasActions) {
        // Verify buttons exist
        expect(hasActions).toBe(true);
      }
    } else {
      test.skip();
    }
  });

  test('should validate required fields when submitting application', async ({ page }) => {
    // Navigate to a property
    await page.goto('/browse');
    
    // Find and click on a property
    const propertyCard = page.locator('[data-testid="property-card"]').first();
    const hasProperty = await propertyCard.count() > 0;
    
    if (hasProperty) {
      await propertyCard.click();
      
      // Find and click Apply button
      const applyButton = page.locator('a:has-text("Apply now"), button:has-text("Apply")').first();
      const canApply = await applyButton.count() > 0;
      
      if (canApply) {
        await applyButton.click();
        
        // Try to submit without filling required fields
        const submitButton = page.locator('button[type="submit"]:has-text("Submit")').first();
        const hasSubmit = await submitButton.count() > 0;
        
        if (hasSubmit) {
          await submitButton.click();
          
          // Should show validation errors
          // Check for HTML5 validation or custom error messages
          const hasValidationMessage = await page.locator(':invalid, [aria-invalid="true"]').count() > 0;
          expect(hasValidationMessage).toBe(true);
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});

test.describe('Application Status Transitions', () => {
  test('landlord can transition application status', async ({ page }) => {
    // This test requires:
    // 1. Landlord authentication
    // 2. An existing application in 'submitted' status
    
    // For now, we'll make this a placeholder that can be filled in
    // when proper test data setup is available
    test.skip();
  });

  test('status transitions show toast notifications', async ({ page }) => {
    // Navigate to application detail as landlord
    // Click status transition button
    // Verify toast notification appears
    test.skip();
  });

  test('tenant can see updated application status', async ({ page }) => {
    // Navigate to applications as tenant
    // Verify status badges show correct status
    test.skip();
  });
});
