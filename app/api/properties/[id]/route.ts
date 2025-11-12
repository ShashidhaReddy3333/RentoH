import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getBySlugOrId } from "@/lib/data-access/properties";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property = await getBySlugOrId(params.id);
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json(property);
  } catch (error) {
    console.error("[api/properties/[id]] Failed to load property", params.id, error);
    return NextResponse.json({ error: "Failed to load property" }, { status: 500 });
  }
}
