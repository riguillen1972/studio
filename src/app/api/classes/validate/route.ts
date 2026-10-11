import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/usage";

// Public check used on the sign-up page: does this class code exist?
// Returns only true/false, never class details.
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9-]{4,20}$/.test(code)) {
    return NextResponse.json({ valid: false });
  }

  try {
    const { data } = await getAdminClient()
      .from("classes")
      .select("id")
      .eq("join_code", code)
      .maybeSingle();
    return NextResponse.json({ valid: !!data });
  } catch (error) {
    console.error("Class code validation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
