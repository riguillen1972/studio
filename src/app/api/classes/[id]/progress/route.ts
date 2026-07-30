import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: classId } = await params;
    if (!classId) {
      return NextResponse.json({ error: "Missing class ID" }, { status: 400 });
    }

    // Verify user is the teacher of this class
    const { data: cls, error: classError } = await supabase
      .from("classes")
      .select("teacher_id")
      .eq("id", classId)
      .single();

    if (classError || !cls) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (cls.teacher_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized: not the teacher of this class" }, { status: 403 });
    }

    // Aggregate class progress from spaced_rep_cards
    // Find questions with highest wrong_count
    const { data: cards, error: cardsError } = await supabase
      .from("spaced_rep_cards")
      .select("question, answer, wrong_count, review_count")
      .eq("class_id", classId)
      .gt("wrong_count", 0)
      .order("wrong_count", { ascending: false })
      .limit(20);

    if (cardsError) {
      return NextResponse.json({ error: "Failed to fetch class progress", details: cardsError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: cards });

  } catch (error) {
    console.error("Progress API GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
