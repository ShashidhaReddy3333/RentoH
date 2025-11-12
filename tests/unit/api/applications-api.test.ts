import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Utility to parse NextResponse
async function readJson(res: Response) {
  const data = await (res as any).json();
  return data;
}

function makeSupabaseStub(options: {
  property?: { id: string; landlord_id: string } | null;
  application?: { id: string; status?: string | null; tenant_id: string; landlord_id: string } | null;
  insertAppId?: string;
  updateError?: null | { message: string };
}) {
  return {
    from(table: string) {
      if (table === 'properties') {
        return {
          select() { return this; },
          eq() { return this; },
          async maybeSingle() {
            if (!options.property) return { data: null, error: { message: 'Not found' } } as const;
            return { data: options.property, error: null } as const;
          }
        };
      }
      if (table === 'applications') {
        let payload: any = null;
        const api: any = {
          // For POST insert chain
          insert(body: any) { payload = body; return api; },
          select(_cols?: any) { return api; },
          async maybeSingle() {
            if (options.insertAppId) {
              return { data: { id: options.insertAppId }, error: null } as const;
            }
            // For SELECT after eq chain
            if (options.application) {
              return { data: options.application, error: null } as const;
            }
            return { data: null, error: { message: 'insert error' } } as const;
          },
          eq(_field?: string, _value?: string) { return api; },
          // For PATCH update chain
          update(_fields?: any) {
            return {
              eq() { return { error: options.updateError ?? null } as const; }
            };
          }
        };
        return api as any;
      }
      throw new Error(`Unexpected table ${table}`);
    }
  } as any;
}

// Mock revalidatePath to no-op
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

describe('Applications API', () => {
  beforeEach(() => {
    vi.resetModules();
    // Mock fetch for digest notifications
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ ok: true }) })) as any);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('POST /api/applications', () => {
    it('returns 400 for invalid body', async () => {
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase: {}, user: { id: 'u' } }) }));
      const { POST } = await import('@/app/api/applications/route');
      const res = await POST(new Request('http://localhost/api/applications', { method: 'POST', body: JSON.stringify({}) }));
      expect(res.status).toBe(400);
      const body = await readJson(res as any);
      expect(body.error).toBeDefined();
    });

    it('returns 401 if not authenticated', async () => {
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase: {}, user: null }) }));
      const { POST } = await import('@/app/api/applications/route');
      const res = await POST(new Request('http://localhost/api/applications', { method: 'POST', body: JSON.stringify({ propertyId: 'p1', monthlyIncome: 1000, message: 'hi' }) }));
      expect(res.status).toBe(401);
    });

    it('returns 404 when property not found', async () => {
      const supabase = makeSupabaseStub({ property: null });
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase, user: { id: 'u1' } }) }));
      const { POST } = await import('@/app/api/applications/route');
      const res = await POST(new Request('http://localhost/api/applications', { method: 'POST', body: JSON.stringify({ propertyId: 'p1', monthlyIncome: 1000, message: 'hello' }) }));
      expect(res.status).toBe(404);
    });

    it('creates application and returns 201', async () => {
      const supabase = makeSupabaseStub({ property: { id: 'p1', landlord_id: 'l1' }, insertAppId: 'app-1' });
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase, user: { id: 'u1' } }) }));
      const { POST } = await import('@/app/api/applications/route');
      const res = await POST(new Request('http://localhost/api/applications', { method: 'POST', body: JSON.stringify({ propertyId: 'p1', monthlyIncome: 5000, message: 'Interested' }) }));
      expect(res.status).toBe(201);
      const body = await readJson(res as any);
      expect(body?.application?.id).toBe('app-1');
    });
  });

  describe('PATCH /api/applications/[id]', () => {
    it('returns 401 if not authenticated', async () => {
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase: {}, user: null }) }));
      const { PATCH } = await import('@/app/api/applications/[id]/route');
      const res = await PATCH(new Request('http://localhost/api/applications/app-1', { method: 'PATCH', body: JSON.stringify({ status: 'reviewing' }) }), { params: { id: 'app-1' } });
      expect(res.status).toBe(401);
    });

    it('forbids non-landlord user', async () => {
      const supabase = makeSupabaseStub({ application: { id: 'app-1', status: 'submitted', tenant_id: 't1', landlord_id: 'landlord-123' } });
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase, user: { id: 'not-landlord' } }) }));
      const { PATCH } = await import('@/app/api/applications/[id]/route');
      const res = await PATCH(new Request('http://localhost/api/applications/app-1', { method: 'PATCH', body: JSON.stringify({ status: 'reviewing' }) }), { params: { id: 'app-1' } });
      expect(res.status).toBe(403);
    });

    it('rejects invalid transition', async () => {
      const supabase = makeSupabaseStub({ application: { id: 'app-1', status: 'submitted', tenant_id: 't1', landlord_id: 'l1' } });
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase, user: { id: 'l1' } }) }));
      const { PATCH } = await import('@/app/api/applications/[id]/route');
      const res = await PATCH(new Request('http://localhost/api/applications/app-1', { method: 'PATCH', body: JSON.stringify({ status: 'interview' }) }), { params: { id: 'app-1' } });
      expect(res.status).toBe(400);
    });

    it('updates status and returns 200', async () => {
      const supabase = makeSupabaseStub({ application: { id: 'app-1', status: 'submitted', tenant_id: 't1', landlord_id: 'l1' }, updateError: null });
      vi.doMock('@/lib/supabase/auth', () => ({ getSupabaseClientWithUser: () => ({ supabase, user: { id: 'l1' } }) }));
      const { PATCH } = await import('@/app/api/applications/[id]/route');
      const res = await PATCH(new Request('http://localhost/api/applications/app-1', { method: 'PATCH', body: JSON.stringify({ status: 'reviewing' }) }), { params: { id: 'app-1' } });
      expect(res.status).toBe(200);
      const body = await readJson(res as any);
      expect(body.status).toBe('reviewing');
    });
  });
});
