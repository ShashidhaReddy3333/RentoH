import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/data-access/profile";

export async function requireAuth() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?next=/dashboard");
  }
}