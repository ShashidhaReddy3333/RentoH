import { NextResponse } from "next/server";

import { getMany } from "@/lib/data-access/properties";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getMany({}, "newest", 1);
  return NextResponse.json({ items: result.items });
}
