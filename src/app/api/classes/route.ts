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

    const { name, subject } = await req.json();

    if (!name) {
      return NextResponse.json({ error: "Missing class name" }, { status: 400 });
    }

    // Generate a random 6-character alphanumeric join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: newClass, error: insertError } = await supabase
      .from("classes")
      .insert({
        teacher_id: user.id,
        name,
        subject,
        join_code: joinCode
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to create class", details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newClass });

  } catch (error) {
    console.error("Classes API POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
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

    // Check user role from metadata to determine if we fetch taught classes or enrolled classes
    const role = user.user_metadata?.role;

    if (role === 'teacher') {
      const { data: classes, error } = await supabase
        .from("classes")
        .select("*, enrollments(count)")
        .eq("teacher_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Map the Supabase response to include enrollment_count
      const formattedClasses = classes?.map(c => {
        const countData = c.enrollments && Array.isArray(c.enrollments) ? c.enrollments[0]?.count : 0;
        return {
          ...c,
          enrollment_count: parseInt(countData) || 0
        };
      });

      return NextResponse.json({ success: true, data: formattedClasses });
    } else {
      // For students, fetch classes they are enrolled in
      const { data: enrollments, error: fetchError } = await supabase
        .from("enrollments")
        .select(`
          class_id,
          classes (*)
        `)
        .eq("student_id", user.id);

      if (fetchError) {
        return NextResponse.json({ error: "Failed to fetch enrollments" }, { status: 500 });
      }

      const classes = (enrollments || [])
        .map(e => (Array.isArray(e.classes) ? e.classes[0] : e.classes))
        .filter(c => c && typeof c === "object" && c.id);
      return NextResponse.json({ success: true, data: classes });
    }
  } catch (error) {
    console.error("Classes API GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
