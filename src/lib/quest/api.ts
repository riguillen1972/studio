import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";

/** The signed-in user's id from the bearer token, or null. */
export async function userIdFrom(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const { data: { user } } = await getAdminClient().auth.getUser(authHeader.split(" ")[1]);
  return user?.id ?? null;
}

export const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** Engine results carry { error } on failure. */
export function respond<T extends object>(result: T | { error: string }, status = 400) {
  return "error" in result ? NextResponse.json(result, { status }) : NextResponse.json(result);
}
