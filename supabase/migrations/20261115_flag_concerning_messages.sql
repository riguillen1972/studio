-- Task 2: flag worrying student messages for their teacher.
-- Run only after Richard says OK. Safe to re-run.

-- 1. Two new columns on the table that feeds the teacher's "AI chats" list.
--    flagged: true when the student's message matched detectConcern() (src/lib/safety.ts).
--    flag_reason: a short reason for the teacher, like 'possible self-harm'.
ALTER TABLE ai_interactions ADD COLUMN IF NOT EXISTS flagged BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ai_interactions ADD COLUMN IF NOT EXISTS flag_reason TEXT;

-- 2. A small index so finding a class's flagged messages stays fast as the table grows.
--    It only holds the flagged rows, so it costs almost nothing.
CREATE INDEX IF NOT EXISTS idx_ai_interactions_flagged
  ON ai_interactions(user_id, created_at DESC) WHERE flagged;

-- 3. Allow a new kind of teacher notification, 'student_concern'.
--    The table only accepts the kinds listed in this check, so the check is replaced
--    with the same list plus the new kind.
ALTER TABLE teacher_notifications DROP CONSTRAINT IF EXISTS teacher_notifications_type_check;
ALTER TABLE teacher_notifications ADD CONSTRAINT teacher_notifications_type_check
  CHECK (type IN ('student_left', 'student_switched', 'student_joined', 'student_concern'));

-- Who can see the flag: both tables already have Row Level Security turned on with no policies,
-- so no browser can read them directly. Only the server reads them, and it shows a student's
-- messages only to the teacher who owns that student's class. This migration doesn't change that.
