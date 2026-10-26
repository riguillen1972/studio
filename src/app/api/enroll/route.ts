import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getAdminClient } from "@/lib/usage";
import { requiresSchoolConsent } from "@/lib/plans";

// A student is in one class at a time. Joining a new class replaces the old one,
// and the old class's teacher is notified when a student leaves or switches away.

async function getUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const { data: { user } } = await getAdminClient().auth.getUser(authHeader.split(" ")[1]);
  return user ?? null;
}

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

/** The student's current classes (normally one), with their teachers. */
async function currentClasses(supabase: SupabaseClient, studentId: string) {
  const { data } = await supabase
    .from("enrollments")
    .select("class_id, classes(id, name, join_code, teacher_id)")
    .eq("student_id", studentId);
  return (data ?? [])
    .map((e) => (Array.isArray(e.classes) ? e.classes[0] : e.classes) as { id: string; name: string; join_code: string; teacher_id: string } | null)
    .filter((c): c is { id: string; name: string; join_code: string; teacher_id: string } => !!c);
}

/** Tells a class's teacher that a student left or switched out. Never blocks the student's action. */
async function notifyTeacher(
  supabase: SupabaseClient,
  cls: { name: string; teacher_id: string },
  studentId: string,
  type: "student_left" | "student_switched",
) {
  try {
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", studentId).maybeSingle();
    const { error } = await supabase.from("teacher_notifications").insert({
      teacher_id: cls.teacher_id,
      type,
      student_id: studentId,
      student_name: profile?.display_name || "A student",
      class_name: cls.name,
    });
    if (error) console.error("Failed to notify teacher:", error);
  } catch (e) {
    console.error("Failed to notify teacher:", e);
  }
}

// The student's current class
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return unauthorized();
  const classes = await currentClasses(getAdminClient(), user.id);
  const cls = classes[0];
  return NextResponse.json({ class: cls ? { name: cls.name, join_code: cls.join_code } : null });
}

// Join a class, or switch to a different one
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const supabase = getAdminClient();

    const { join_code } = await req.json().catch(() => ({}));
    const code = typeof join_code === "string" ? join_code.trim().toUpperCase() : "";
    if (!code) {
      return NextResponse.json({ error: "Enter a class code" }, { status: 400 });
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "teacher") {
      return NextResponse.json({ error: "Teachers can't join a class as a student" }, { status: 403 });
    }

    const { data: target } = await supabase
      .from("classes")
      .select("id, name, join_code")
      .eq("join_code", code)
      .maybeSingle();
    if (!target) {
      return NextResponse.json({ error: "We couldn't find a class with that code. Check it with your teacher." }, { status: 404 });
    }

    // Leave any other class first, and tell those teachers
    const previous = (await currentClasses(supabase, user.id)).filter((c) => c.id !== target.id);
    if (previous.length) {
      await supabase.from("enrollments").delete().eq("student_id", user.id).neq("class_id", target.id);
      await Promise.all(previous.map((c) => notifyTeacher(supabase, c, user.id, "student_switched")));
    }

    const { error: enrollError } = await supabase
      .from("enrollments")
      .insert({ class_id: target.id, student_id: user.id });
    // 23505 = already enrolled, which is fine
    if (enrollError && enrollError.code !== "23505") {
      console.error("Enrollment failed:", enrollError);
      return NextResponse.json({ error: "Couldn't join the class. Please try again." }, { status: 500 });
    }

    await supabase.from("profiles").update({ class_code: target.join_code }).eq("id", user.id);
    return NextResponse.json({ success: true, class: { name: target.name, join_code: target.join_code } });
  } catch (error) {
    console.error("Enroll POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Leave the current class (remove the class code)
export async function DELETE(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return unauthorized();
    const supabase = getAdminClient();

    const { data: profile } = await supabase.from("profiles").select("role, grade_level").eq("id", user.id).maybeSingle();
    // Under-13 students can only use the app through a class (school consent), so they can switch but not leave
    if (requiresSchoolConsent(profile?.role, profile?.grade_level)) {
      return NextResponse.json({
        error: "Students in 7th grade and below need to stay in a class. You can switch to a different class code instead.",
      }, { status: 403 });
    }

    const classes = await currentClasses(supabase, user.id);
    if (classes.length === 0) {
      return NextResponse.json({ success: true });
    }

    await supabase.from("enrollments").delete().eq("student_id", user.id);
    await supabase.from("profiles").update({ class_code: null }).eq("id", user.id);
    await Promise.all(classes.map((c) => notifyTeacher(supabase, c, user.id, "student_left")));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Enroll DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
