import { NextResponse } from 'next/server';

import { listProperties } from '@/lib/data/properties';

export const revalidate = 60;
export const fetchCache = 'force-cache';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const items = await listProperties();
    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch properties', error);
    return NextResponse.json({ error: 'Failed to load properties' }, { status: 500 });
  }
}
