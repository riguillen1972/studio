import { NextRequest, NextResponse } from "next/server";
import { getAdminClient, currentMonth } from "@/lib/usage";
import { TOKEN_LIMITS, USAGE_COLUMNS, type SubscriptionTier, type UsageModel } from "@/lib/plans";

// Usage is recorded on the server when each AI request runs (see src/lib/actions.ts and /api/tools),
// so this endpoint only reports the current month's usage. It no longer accepts client-reported counts,
// which let anyone skip or rewrite their own usage.
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const supabase = getAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const month = currentMonth();
    const [{ data: profile }, { data: usage }] = await Promise.all([
      supabase.from("profiles").select("tier").eq("id", user.id).maybeSingle(),
      supabase.from("token_usage").select("*").eq("user_id", user.id).eq("month", month).maybeSingle(),
    ]);

    const tier: SubscriptionTier = profile?.tier === "pro" || profile?.tier === "max" ? profile.tier : "free";
    const models = Object.keys(USAGE_COLUMNS) as UsageModel[];
    const result = Object.fromEntries(
      models.map((m) => {
        const used = usage?.[USAGE_COLUMNS[m]] ?? 0;
        const limit = TOKEN_LIMITS[tier][m];
        return [m, { used, limit, remaining: Math.max(0, limit - used) }];
      })
    );

    return NextResponse.json({ month, tier, usage: result });
  } catch (error) {
    console.error("Token Usage API GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
