import { createClient } from "@/lib/supabase/client";

/** Calls a Math Quest API route as the signed-in user. Throws with the server's error message. */
export async function questFetch<T = Record<string, unknown>>(path: string, init?: RequestInit): Promise<T> {
  const { data: { session } } = await createClient().auth.getSession();
  if (!session) throw new Error("Your session has expired. Please sign in again.");
  const res = await fetch(path, {
    ...init,
    headers: { Authorization: `Bearer ${session.access_token}`, ...(init?.body ? { "Content-Type": "application/json" } : {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}
