import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
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

    const { join_code } = await req.json();

    if (!join_code) {
      return NextResponse.json({ error: "Missing join code" }, { status: 400 });
    }

    // Find the class by join code
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id")
      .eq("join_code", join_code.toUpperCase())
      .single();

    if (classError || !classData) {
      return NextResponse.json({ error: "Invalid join code or class not found" }, { status: 404 });
    }

    // Create the enrollment
    const { error: enrollError } = await supabase
      .from("enrollments")
      .insert({
        class_id: classData.id,
        student_id: user.id
      });

    if (enrollError) {
      // Check for unique constraint violation (already enrolled)
      if (enrollError.code === '23505') {
        return NextResponse.json({ error: "You are already enrolled in this class" }, { status: 400 });
      }
      return NextResponse.json({ error: "Failed to enroll", details: enrollError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Successfully enrolled in class" });

  } catch (error) {
    console.error("Enrollment API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
