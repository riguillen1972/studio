import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseContextPack } from "@/ai/flows/parse-context-pack";

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

    const { class_id, title, subject, type, content_raw, due_date } = await req.json();

    if (!class_id || !title || !type || !content_raw) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Run the Genkit Flow to parse the raw text
    const parsedData = await parseContextPack({
      rawContent: content_raw,
      type: type as any
    });

    // 2. Save to Supabase
    const { data: newPack, error: insertError } = await supabase
      .from("context_packs")
      .insert({
        teacher_id: user.id,
        class_id,
        title,
        subject,
        type,
        content_raw,
        content_parsed: parsedData.content_parsed,
        rubric: parsedData.rubric,
        answer_key: parsedData.answer_key,
        due_date: due_date || null
      })
      .select("*")
      .single();

    if (insertError) {
      return NextResponse.json({ error: "Failed to create context pack", details: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: newPack });

  } catch (error) {
    console.error("Context Packs API POST error:", error);
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

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get('class_id');

    let query = supabase
      .from("context_packs")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (classId) {
      // Verify user has access to this class (is teacher or enrolled student)
      const { data: classData } = await supabase
        .from("classes")
        .select("teacher_id")
        .eq("id", classId)
        .single();

      if (!classData) {
        return NextResponse.json({ error: "Class not found" }, { status: 404 });
      }

      const isTeacher = classData.teacher_id === user.id;

      if (!isTeacher) {
        // Check if user is an enrolled student
        const { data: enrollment } = await supabase
          .from("enrollments")
          .select("id")
          .eq("class_id", classId)
          .eq("student_id", user.id)
          .single();

        if (!enrollment) {
          return NextResponse.json({ error: "You don't have access to this class" }, { status: 403 });
        }
      }

      query = query.eq("class_id", classId);

      // Students should not see answer keys
      if (!isTeacher) {
        query = query.select("id, class_id, teacher_id, type, title, subject, content_parsed, rubric, due_date, status, created_at");
      }
    } else {
       // Only teachers can fetch all their packs across classes
      query = query.eq("teacher_id", user.id);
    }

    const { data: packs, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json({ error: "Failed to fetch context packs" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: packs });
  } catch (error) {
    console.error("Context Packs API GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
