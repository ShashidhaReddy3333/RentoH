import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/data-access/profile";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ role: user?.role ?? "tenant" });
}
