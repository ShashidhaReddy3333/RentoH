import { test as base, chromium } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

type Fixtures = { landlordStorage: string; tenantStorage: string; };
export const test = base.extend<Fixtures>({
  landlordStorage: async ({}, use) => {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'http://127.0.0.1:54321';
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';
    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000';
    
    const sb = createClient(supabaseUrl, supabaseKey);
    const { data } = await sb.auth.signInWithPassword({ email: 'landlord+e2e@example.com', password: 'Pass@1234' });
    
    if (!data.session) {
      throw new Error('Failed to authenticate landlord for e2e test');
    }
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(siteUrl);
    await page.addInitScript((args: string[]) => {
      if (args[0] && args[1]) {
        localStorage.setItem(args[0], args[1]);
      }
    }, [
      `sb-${new URL(supabaseUrl).hostname}-auth-token`,
      JSON.stringify(data.session),
    ]);
    const path = 'tmp/landlord.json';
    await page.context().storageState({ path });
    await browser.close();
    await use(path);
  },
  tenantStorage: async ({}, use) => {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || 'http://127.0.0.1:54321';
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';
    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] || 'http://localhost:3000';
    
    const sb = createClient(supabaseUrl, supabaseKey);
    const { data } = await sb.auth.signInWithPassword({ email: 'tenant+e2e@example.com', password: 'Pass@1234' });
    
    if (!data.session) {
      throw new Error('Failed to authenticate tenant for e2e test');
    }
    
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(siteUrl);
    await page.addInitScript((args: string[]) => {
      if (args[0] && args[1]) {
        localStorage.setItem(args[0], args[1]);
      }
    }, [
      `sb-${new URL(supabaseUrl).hostname}-auth-token`,
      JSON.stringify(data.session),
    ]);
    const path = 'tmp/tenant.json';
    await page.context().storageState({ path });
    await browser.close();
    await use(path);
  },
});
export const expect = base.expect;
