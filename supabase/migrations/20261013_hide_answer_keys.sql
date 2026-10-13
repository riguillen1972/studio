-- Study Buddy AI: students could read the teacher's answer keys.
-- Row-level security let enrolled students read their class's context_packs rows, and that
-- included the answer_key column. The app now loads assignments through the server
-- (/api/assignments), so browsers only need the safe columns.
-- Run once in Supabase Dashboard > SQL Editor. Safe to re-run.

REVOKE SELECT ON context_packs FROM anon, authenticated;
GRANT SELECT (id, class_id, teacher_id, type, title, subject, content_parsed, rubric, due_date, status, created_at)
  ON context_packs TO authenticated;
-- answer_key and content_raw are now readable only by the server (service role).
