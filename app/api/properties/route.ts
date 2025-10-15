import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest){
  // Placeholder stub: replace with Supabase query
  const data = [
    { id: "1", title: "Sunny Apartment", city: "Waterloo", rent: 1800, verified: true },
    { id: "2", title: "Modern Studio", city: "Kitchener", rent: 1450, verified: false }
  ];
  return NextResponse.json(data);
}

export async function POST(req: NextRequest){
  const body = await req.json();
  // TODO: insert into Supabase with RLS
  return NextResponse.json({ ok: true, body }, { status: 201 });
}
