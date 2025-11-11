import { test as base, chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

type Fixtures = { landlordStorage: string; tenantStorage: string; };
export const test = base.extend<Fixtures>({
  landlordStorage: async ({}, use) => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await sb.auth.signInWithPassword({ email: 'landlord+e2e@example.com', password: 'Pass@1234' });
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(process.env.NEXT_PUBLIC_SITE_URL!);
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [
      `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname}-auth-token`,
      JSON.stringify(data.session),
    ]);
    const path = 'tmp/landlord.json';
    await page.context().storageState({ path });
    await browser.close();
    await use(path);
  },
  tenantStorage: async ({}, use) => {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { data } = await sb.auth.signInWithPassword({ email: 'tenant+e2e@example.com', password: 'Pass@1234' });
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(process.env.NEXT_PUBLIC_SITE_URL!);
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [
      `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname}-auth-token`,
      JSON.stringify(data.session),
    ]);
    const path = 'tmp/tenant.json';
    await page.context().storageState({ path });
    await browser.close();
    await use(path);
  },
});
export const expect = base.expect;
