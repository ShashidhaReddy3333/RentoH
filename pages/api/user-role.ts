import { NextApiRequest, NextApiResponse } from "next";
import { getCurrentUser } from "@/lib/data-access/profile";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = await getCurrentUser();
  res.status(200).json({ role: user?.role ?? "tenant" });
}
