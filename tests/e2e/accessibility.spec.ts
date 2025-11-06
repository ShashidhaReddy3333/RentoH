import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const SUPABASE_WARNING = /Supabase credentials are not configured/i;

const routes = [
  { path: "/", label: "marketing home" },
  { path: "/browse", label: "browse listings" },
  { path: "/listings/new", label: "listing form" }
] as const;

test.describe("Accessibility audit", () => {
  for (const route of routes) {
    test(`has no critical accessibility violations on ${route.label}`, async ({ page }) => {
      await page.goto(route.path);
      // Surface setup warnings when Supabase is not configured but continue scanning UI.
      const warning = page.getByText(SUPABASE_WARNING, { exact: false });
      if ((await warning.count()) > 0) {
        await expect(warning).toBeVisible();
      }

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa"])
        .disableRules(["region"]) // allow marketing layouts without explicit landmarks on marketing pages
        .analyze();

      expect(results.violations, `Violations on ${route.path}`).toEqual([]);
    });
  }
});

