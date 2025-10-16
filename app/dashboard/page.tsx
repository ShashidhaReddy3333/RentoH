import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  return <DashboardClient />;
}
