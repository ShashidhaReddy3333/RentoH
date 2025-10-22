import { NextResponse } from "next/server";

import { parseSearchParams } from "@/lib/search/params";
import { searchListings } from "@/lib/search/service";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const filters = parseSearchParams(url.searchParams);
    const result = await searchListings(filters);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api] listings search failed", error);
    return NextResponse.json(
      { error: "Unable to load listings right now. Please try again." },
      { status: 500 }
    );
  }
}
