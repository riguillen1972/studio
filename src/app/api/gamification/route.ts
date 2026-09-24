import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, xp_amount, class_id } = await req.json();

    if (!action || xp_amount === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate action against whitelist
    const VALID_ACTIONS = ['quiz_complete', 'flashcard_review', 'homework_submit', 'tutor_session', 'focus_session', 'streak_bonus', 'study_tool_use'];
    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action type" }, { status: 400 });
    }

    // Cap XP to prevent client-side manipulation
    const MAX_XP_PER_ACTION = 100;
    const safeXpAmount = Math.min(Math.max(0, Math.floor(Number(xp_amount))), MAX_XP_PER_ACTION);

    if (safeXpAmount <= 0) {
      return NextResponse.json({ error: "Invalid XP amount" }, { status: 400 });
    }

    // 1. Insert XP Log
    const { error: insertError } = await supabase
      .from("xp_logs")
      .insert({
        user_id: user.id,
        action,
        xp_amount: safeXpAmount,
        class_id: class_id || null
      });

    if (insertError) {
      return NextResponse.json({ error: "Failed to log XP", details: insertError.message }, { status: 500 });
    }

    // 2. Update Study Streaks
    // We can use a Postgres function for atomic updates, but for now we'll fetch and update
    const { data: streakData, error: streakFetchError } = await supabase
      .from("study_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    let newStreak = 1;
    let newTotalXp = safeXpAmount;
    let longestStreak = 1;

    if (streakFetchError && streakFetchError.code !== 'PGRST116') {
      // PGRST116 is not found, which is fine, we'll create one
      return NextResponse.json({ error: "Failed to fetch streak data", details: streakFetchError.message }, { status: 500 });
    }

    if (streakData) {
      newTotalXp = (streakData.total_xp || 0) + safeXpAmount;
      
      if (streakData.last_active_date) {
        const lastDate = new Date(streakData.last_active_date);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
          // Consecutive day
          newStreak = (streakData.current_streak || 0) + 1;
        } else if (diffDays === 0) {
          // Same day, streak doesn't increase but XP does
          newStreak = streakData.current_streak || 1;
        } else {
          // Streak broken
          newStreak = 1;
        }
      }
      longestStreak = Math.max(streakData.longest_streak || 0, newStreak);
    }

    const { error: upsertError } = await supabase
      .from("study_streaks")
      .upsert({
        user_id: user.id,
        current_streak: newStreak,
        longest_streak: longestStreak,
        last_active_date: today,
        total_xp: newTotalXp
      });

    if (upsertError) {
      return NextResponse.json({ error: "Failed to update streaks", details: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      xp_awarded: safeXpAmount, 
      new_total_xp: newTotalXp,
      current_streak: newStreak 
    });

  } catch (error) {
    console.error("Gamification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: streakData, error: streakFetchError } = await supabase
      .from("study_streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (streakFetchError && streakFetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: "Failed to fetch streak data" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      data: streakData || { current_streak: 0, longest_streak: 0, total_xp: 0 }
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
