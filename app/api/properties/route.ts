import { NextResponse } from "next/server";

import { getMany } from "@/lib/data-access/properties";

export const revalidate = 60;
export const fetchCache = "force-cache";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await getMany({}, "newest", 1);
    return NextResponse.json({ items: result.items });
  } catch (error) {
    console.error("Failed to fetch properties", error);
    return NextResponse.json({ error: "Failed to load properties" }, { status: 500 });
  }
}
