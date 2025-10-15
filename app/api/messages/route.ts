import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { propertyId, body, recipientId } = await req.json();
  // TODO: insert into Supabase messages
  return NextResponse.json({ ok: true, propertyId, body, recipientId }, { status: 201 });
}
