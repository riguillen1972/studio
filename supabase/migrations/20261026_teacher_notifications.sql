-- Study Buddy AI: notifications for teachers (a student left or switched out of their class).
-- Written and read only by the server. Applied to Supabase on 2026-10-26
-- (recorded there as teacher_notifications). Safe to re-run.

CREATE TABLE IF NOT EXISTS teacher_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('student_left', 'student_switched', 'student_joined')),
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  student_name TEXT,
  class_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  read_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_teacher_notifications_teacher ON teacher_notifications(teacher_id, created_at DESC);
ALTER TABLE teacher_notifications ENABLE ROW LEVEL SECURITY;
